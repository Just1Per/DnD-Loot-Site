/**
 * Stage a generated 5etools metadata release in Firestore.
 *
 * This deliberately has no activation switch: current player clients continue
 * using their reviewed catalogue until each domain gets an explicit reader and
 * compatibility mapping. Item metadata is kept in the JSON release only; the
 * existing reviewed root-item pipeline remains the sole item publisher.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const KINDS=new Set(['classes','subclasses','species','backgrounds','feats','spells']);
const VERSION=2026110501;
const validProject=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(value);
const safeId=value=>typeof value==='string'&&/^[a-z0-9-]{8,240}$/i.test(value);

export function prepareMetadata(text){
  const release=JSON.parse(text),kinds=release?.kinds;
  if(release?.format!==1||!release?.source?.revision||!kinds||typeof kinds!=='object')throw Error('Unsupported 5etools metadata release');
  // The build output is trusted only for its documented source fingerprint;
  // individual staged records are still fully validated below.
  if(typeof release.release!=='string'||!/^[a-f0-9]{64}$/.test(release.release))throw Error('Missing metadata release digest');
  const rows=[];
  for(const [kind,records] of Object.entries(kinds)){
    if(!KINDS.has(kind))continue;
    if(!Array.isArray(records))throw Error('Invalid '+kind+' records');
    const ids=new Set();
    for(const record of records){
      if(!record||typeof record!=='object'||!safeId(record.id)||ids.has(record.id)||typeof record.name!=='string'||!record.name.trim()||record.name.length>240||typeof record.source!=='string'||record.source.length>60||!['2014','2024'].includes(record.edition))throw Error('Invalid '+kind+' record');
      if(Object.keys(record).some(key=>/^(entries|fluff|image|description|text)$/i.test(key)))throw Error('Source prose or media is not allowed in '+kind);
      ids.add(record.id);rows.push({kind,record});
    }
  }
  if(!rows.length)throw Error('No supported metadata records');
  return {release,rows};
}

export async function stageMetadata(db,prepared){
  const releaseId='5etools-'+prepared.release.release.slice(0,24),now=Date.now();
  for(let offset=0;offset<prepared.rows.length;offset+=400){
    const batch=db.batch();
    for(const {kind,record} of prepared.rows.slice(offset,offset+400))batch.set(db.doc(`rulesCatalog/${releaseId}/${kind}/${record.id}`),{...record,catalogVersion:VERSION,sourceRelease:prepared.release.release,stagedAt:now});
    await batch.commit();
  }
  const counts=Object.fromEntries([...KINDS].map(kind=>[kind,prepared.rows.filter(row=>row.kind===kind).length]));
  await db.doc('rulesCatalog/'+releaseId).set({format:1,scope:'staged-5etools-metadata',source:prepared.release.source,release:prepared.release.release,version:VERSION,counts,updatedAt:now,activation:'none'});
  return {releaseId,counts,writes:prepared.rows.length+1};
}

async function main(){
  const args=process.argv.slice(2),allowed=new Set(['--project','--file','--write']);let project,file=path.join(ROOT,'data/rules/5etools/metadata.json'),write=false;
  for(let i=0;i<args.length;i++){
    if(!allowed.has(args[i]))throw Error('Unknown argument '+args[i]);
    if(args[i]==='--write')write=true;else if(args[i]==='--project')project=args[++i];else file=path.resolve(args[++i]);
  }
  if(!validProject(project))throw Error('Use --project YOUR_FIREBASE_PROJECT_ID [--file metadata.json] [--write]');
  if(process.env.FIRESTORE_EMULATOR_HOST&&!project.startsWith('demo-'))throw Error('Use a demo- project with the emulator');
  const prepared=prepareMetadata(await fs.readFile(file,'utf8'));
  const summary={project,file,mode:write?'STAGE':'DRY RUN',release:prepared.release.release,source:prepared.release.source,records:prepared.rows.length,kinds:Object.fromEntries([...KINDS].map(kind=>[kind,prepared.rows.filter(row=>row.kind===kind).length])),activation:'none; no player-visible catalogue pointer changes'};
  console.log(JSON.stringify(summary,null,2));
  if(!write){console.log('No database writes. Add --write to stage this release.');return;}
  const {initializeApp,applicationDefault}=await import('firebase-admin/app');
  const {getFirestore}=await import('firebase-admin/firestore');
  initializeApp(process.env.FIRESTORE_EMULATOR_HOST?{projectId:project}:{projectId:project,credential:applicationDefault()});
  console.log(JSON.stringify(await stageMetadata(getFirestore(),prepared),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
