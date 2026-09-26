/** Run locally; no Cloud Functions. Dry run unless --write is supplied. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function prepareCatalog(text) {
  const data=JSON.parse(text);
  if(data.format!==1 || !Array.isArray(data.spells) || !Array.isArray(data.feats)) throw Error('Unsupported catalogue');
  const ids=new Set();
  for(const row of [...data.spells,...data.feats]) {
    if(!row.id || ids.has(row.id) || !['2014','2024'].includes(row.edition) || !row.name) throw Error('Invalid/duplicate catalogue entry');
    if(!row.licensedText && row.description) throw Error('Unlicensed rule text');
    ids.add(row.id);
  }
  const release=createHash('sha256').update(text).digest('hex');
  const parts=[];
  for(let i=0;i<text.length;i+=100000) parts.push(text.slice(i,i+100000));
  return {release,parts,manifest:{format:1,release,parts:parts.length,spells:data.spells.length,feats:data.feats.length}};
}
export async function publishCatalog(db,prepared) {
  // Content-addressed releases are complete before the current pointer changes.
  // A failed/interrupted run leaves the previous release live. Retrying is safe.
  for(let i=0;i<prepared.parts.length;i+=10) {
    const batch=db.batch();
    for(let j=i;j<Math.min(i+10,prepared.parts.length);j++) batch.set(db.doc(`rulesCatalog/${prepared.release}/parts/${String(j).padStart(4,'0')}`),{text:prepared.parts[j]});
    await batch.commit();
  }
  await db.doc('rulesCatalog/current').set(prepared.manifest);
}
async function main() {
  const args=process.argv.slice(2), valid=new Set(['--write','--project']);
  let project,write=false;
  for(let i=0;i<args.length;i++) {
    if(!valid.has(args[i])) throw Error(`Unknown argument ${args[i]}`);
    if(args[i]==='--write') write=true;
    else project=args[++i];
  }
  if(!project || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project)) throw Error('Use --project YOUR_FIREBASE_PROJECT_ID (and optionally --write)');
  if(process.env.FIRESTORE_EMULATOR_HOST && !project.startsWith('demo-')) throw Error('Use a demo- project when testing with the emulator');
  const text=await fs.readFile(new URL('../data/rules/catalog.json',import.meta.url),'utf8');
  const prepared=prepareCatalog(text);
  console.log(JSON.stringify({project,mode:write?'WRITE':'DRY RUN',...prepared.manifest},null,2));
  if(!write) { console.log('No database writes. Add --write to publish this catalogue.'); return; }
  const {initializeApp,applicationDefault}=await import('firebase-admin/app');
  const {getFirestore}=await import('firebase-admin/firestore');
  initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? {projectId:project} : {projectId:project,credential:applicationDefault()});
  await publishCatalog(getFirestore(),prepared);
  console.log('Catalogue published. No characters, inventory or campaign data changed.');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
