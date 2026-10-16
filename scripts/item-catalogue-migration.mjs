/** Reviewed copy/verify/publish migration. CLI defaults to an offline, non-writing plan. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from './build-srd-item-hashes.mjs';
import {stableJson,documentsToRows,writePrivateFile,decodeValue} from './audit-item-catalogue.mjs';

export const POLICY='approved-v1';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const id=value=>typeof value==='string'&&value.length>0&&value.length<200&&!value.includes('/');
export const fieldsHash=fields=>digest(stableJson(fields));
export function encode(value){
 if(value===null)return {nullValue:null};
 if(typeof value==='string')return {stringValue:value};
 if(typeof value==='boolean')return {booleanValue:value};
 if(typeof value==='number'&&Number.isFinite(value))return Number.isSafeInteger(value)?{integerValue:String(value)}:{doubleValue:value};
 if(Array.isArray(value))return {arrayValue:value.length?{values:value.map(encode)}:{}};
 if(value&&typeof value==='object')return {mapValue:Object.keys(value).length?{fields:Object.fromEntries(Object.entries(value).map(([key,v])=>[key,encode(v)]))}:{}};
 throw Error('Unsupported reviewed payload value');
}
export const encodeFields=value=>encode(value).mapValue.fields||{};
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
function reviewedPayload(decision){
 const item=decision.replacement,rights=decision.rights;
 check(item&&typeof item.name==='string'&&item.name.trim()&&typeof item.description==='string','Publish requires a complete reviewed replacement');
 const allowed=['name','description','category','rarity','source','attunement','classes','properties','quote','mechanics','edition'];
 check(Object.keys(item).every(key=>allowed.includes(key)),'Replacement contains unreviewed fields or image links');
 check(!item.quote&&(!item.properties||Array.isArray(item.properties)&&!item.properties.length),'Extra quote/property prose must be removed from the replacement');
 check(rights&&['CC-BY-4.0','ORIGINAL'].includes(rights.license)&&typeof rights.attribution==='string'&&rights.attribution.trim()&&typeof rights.evidence==='string'&&rights.evidence.trim(),'Publish requires licence, attribution and evidence');
 check(Object.keys(rights).every(key=>['license','attribution','evidence','sourceUrl','referenceSha256','reviewedBy','reviewedAt'].includes(key)),'Unreviewed rights metadata');
 if(rights.license==='CC-BY-4.0')check(typeof rights.sourceUrl==='string'&&rights.sourceUrl.startsWith('https://')&&sha(rights.referenceSha256),'SRD publishing requires source URL and reference digest');
 return {...item,quote:'',properties:[],imageUrl:'',imageBaseId:'',thumbnailUrl:'',thumbUrl:'',artwork:{status:'none'},catalogueStatus:POLICY,
  rights:{...rights,reviewedBy:decision.reviewedBy,reviewedAt:decision.reviewedAt}};
}
export function buildMigrationPlan(snapshot,manifest,{project,campaignId,campaignName,ownerId}={}){
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||''),'Invalid project');
 check(snapshot.project===project&&snapshot.collection==='items','Snapshot must identify the same project and root items collection');
 check(snapshot.completeRootCatalogue!==false,'A reviewed-only public subset cannot be used as a migration snapshot');
 check(id(campaignId)&&id(ownerId)&&typeof campaignName==='string'&&campaignName.trim(),'Pin target campaign ID, name and owner');
 check(manifest?.format===1&&Array.isArray(manifest.decisions),'Expected a decision manifest');
 check(manifest.targetCampaignId===campaignId,'Manifest target campaign mismatch');
 const rows=documentsToRows(snapshot.documents).filter(row=>row.id!=='catalog_meta'&&row.data._type!=='catalog-meta');
 const decisions=new Map();for(const decision of manifest.decisions){check(id(decision.id)&&!decisions.has(decision.id),'Invalid or duplicate manifest ID');decisions.set(decision.id,decision);}
 check(rows.length===decisions.size&&rows.length>0,'Manifest must cover every snapshot item exactly once');
 const items=rows.map(row=>{
  const decision=decisions.get(row.id),document=snapshot.documents.find(doc=>doc.name.split('/').at(-1)===row.id);
  check(decision&&decision.sourceSha256===fieldsHash(row.raw),'Source digest mismatch: '+row.id);
  check(typeof document.updateTime==='string','Snapshot requires original Firestore update times');
  check(document.name===`projects/${project}/databases/(default)/documents/items/${row.id}`,'Snapshot document belongs to a different project');
  check(['publish','retire'].includes(decision.action),'Unknown decision action');
  const approved=decision.approved===true&&typeof decision.reviewedBy==='string'&&decision.reviewedBy.trim()&&typeof decision.reviewedAt==='string'&&Number.isFinite(Date.parse(decision.reviewedAt));
  const replacement=decision.action==='publish'?reviewedPayload(decision):null;
  return {id:row.id,sourceSha256:decision.sourceSha256,source:document,action:decision.action,approved:!!approved,
   archiveId:'catalogue-'+digest(row.id).slice(0,32),replacement:replacement?encodeFields(replacement):null};
 });
 const plan={format:1,project,campaignId,campaignName,ownerId,manifestSha256:digest(stableJson(manifest)),
  retireLegacyArtwork:manifest.retireLegacyArtwork===true,allApproved:items.every(item=>item.approved),items};
 return {...plan,planSha256:digest(stableJson(plan))};
}
export function assertPlan(plan){
 const {planSha256,...body}=plan;
 check(sha(planSha256)&&planSha256===digest(stableJson(body)),'Plan digest mismatch');
 // Revalidate the stored sources, not just the plan checksum.
 check(Array.isArray(plan.items)&&plan.items.length>0&&new Set(plan.items.map(item=>item.id)).size===plan.items.length,'Invalid plan items');
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(plan.project||'')&&id(plan.campaignId)&&id(plan.ownerId)&&typeof plan.campaignName==='string'&&plan.campaignName.trim(),'Invalid plan target');
 check(plan.allApproved===plan.items.every(item=>item.approved===true),'Inconsistent plan approvals');
 for(const item of plan.items){
  check(id(item.id)&&item.archiveId==='catalogue-'+digest(item.id).slice(0,32)&&fieldsHash(item.source.fields)===item.sourceSha256,'Invalid plan source');check(['publish','retire'].includes(item.action),'Invalid plan action');
  check(item.source.name===`projects/${plan.project}/databases/(default)/documents/items/${item.id}`&&typeof item.source.updateTime==='string','Invalid plan source path/version');
  if(item.action==='publish'){
   const payload=Object.fromEntries(Object.entries(item.replacement||{}).map(([key,value])=>[key,decodeValue(value)]));
   const replacement=Object.fromEntries(Object.entries(payload).filter(([key])=>!['rights','imageUrl','imageBaseId','thumbnailUrl','thumbUrl','artwork','catalogueStatus'].includes(key)));
   const validated=reviewedPayload({replacement,rights:payload.rights,reviewedBy:payload.rights?.reviewedBy,reviewedAt:payload.rights?.reviewedAt});
   check(fieldsHash(encodeFields(validated))===fieldsHash(item.replacement),'Replacement is not a clean reviewed publication payload');
  }else check(item.replacement===null,'Retired items cannot carry publication data');
 }
 return plan;
}
const cleanFields=['name','description','category','rarity','source','attunement','classes','properties','quote','mechanics','edition'];
export function privateDocuments(plan,item,assets=[]){
 const marker={sourceId:item.id,sourceSha256:item.sourceSha256,manifestSha256:plan.manifestSha256};
 const fields=Object.fromEntries(cleanFields.filter(key=>item.source.fields[key]!==undefined).map(key=>[key,item.source.fields[key]]));
 const archivedImage=assets[0]?{archivedImage:{path:assets[0].privatePath,sha256:assets[0].sha256}}:{};
 const copy={...fields,...encodeFields({campaignId:plan.campaignId,rootItemId:item.id,visible:false,highlighted:false,lootMode:'dm',imageUrl:'',imageBaseId:'',catalogueArchive:marker,...archivedImage})};
 const archive=encodeFields({...marker,originalUpdateTime:item.source.updateTime});
 archive.original={mapValue:{fields:item.source.fields}};
 archive.assets=encode(assets.map(asset=>({sourcePath:asset.sourcePath,privatePath:asset.privatePath,sha256:asset.sha256,generation:asset.generation})));
 for(const value of [copy,archive])check(Buffer.byteLength(JSON.stringify(value))<700000,'Private record is too large; use a separate durable export');
 return {copy,archive};
}

/** Port operations are injected, so dry-run and failure boundaries are testable. */
export async function migrateCatalogue(plan,port,{apply=false,confirmPlanSha256=''}={}){
 assertPlan(plan);
 if(apply){check(plan.allApproved&&plan.items.every(item=>item.approved),'Every decision must be explicitly approved');check(confirmPlanSha256===plan.planSha256,'Explicit plan digest confirmation required');check(plan.retireLegacyArtwork,'Legacy artwork retirement must be explicitly reviewed');}
 await port.verifyTarget(plan);
 await port.verifyExistingCampaigns(plan);
 const current=await port.listSources();
 const expected=new Set(plan.items.map(item=>item.id));
 check(current.every(doc=>doc.name.split('/').at(-1)==='catalog_meta'||expected.has(doc.name.split('/').at(-1))),'New root items appeared after review; rebuild the plan');
 for(const item of plan.items){
  const source=current.find(doc=>doc.name.split('/').at(-1)===item.id);
  // A resumed publish/delete must be proven by private journal + source state.
  if(await port.isCompleted(plan,item,source))continue;
  check(source&&source.updateTime===item.source.updateTime&&fieldsHash(source.fields)===item.sourceSha256,'Source changed after review: '+item.id);
 }
 const assets=await port.inspectArtwork(plan);
 const summary={items:plan.items.length,publish:plan.items.filter(item=>item.action==='publish').length,retire:plan.items.filter(item=>item.action==='retire').length,legacyArtwork:assets.length,unresolvedArtwork:assets.unresolved?.length||0,writes:0,dryRun:!apply,allApproved:plan.allApproved};
 if(!apply)return summary;
 // Backup includes every original document and legacy object before any database write.
 await port.backup(plan,assets);
 const copiedAssets=await port.copyAndVerifyArtwork(plan,assets);
 for(const item of plan.items){
  if(await port.isCompleted(plan,item,await port.readSource(item.id)))continue;
  const itemAssets=await port.assetsForItem(item,copiedAssets);
  const documents=privateDocuments(plan,item,itemAssets);
  await port.copyPrivate(plan,item,documents);
  await port.verifyPrivate(plan,item,documents);
 }
 // Finish all copies first. A copy failure cannot retire any root record.
 await port.verifyNoNewSources(plan);
 for(const item of plan.items){
  if(await port.isCompleted(plan,item,await port.readSource(item.id)))continue;
  await port.publishOrRetire(plan,item);
  summary.writes++;
 }
 await port.retireArtwork(plan,copiedAssets);
 await port.verifyFinal(plan);
 return {...summary,dryRun:false};
}
async function main(){
 const [mode,...args]=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i++){check(/^--[a-z-]+$/.test(args[i])&&args[i+1]&&!args[i+1].startsWith('--'),'Expected named option values');check(!options[args[i]],'Duplicate option');options[args[i]]=args[++i];}
 if(mode==='plan'){
  const allowed=['--snapshot','--manifest','--project','--campaign','--campaign-name','--owner','--output'];check(Object.keys(options).every(key=>allowed.includes(key)),'Unknown plan option');
  const snapshot=JSON.parse(await fs.readFile(options['--snapshot'],'utf8')),manifest=JSON.parse(await fs.readFile(options['--manifest'],'utf8'));
  const plan=buildMigrationPlan(snapshot,manifest,{project:options['--project'],campaignId:options['--campaign'],campaignName:options['--campaign-name'],ownerId:options['--owner']});
  await writePrivateFile(options['--output'],plan);console.log(JSON.stringify({planSha256:plan.planSha256,items:plan.items.length,allApproved:plan.allApproved,writes:0}));return;
 }
 check(['check','apply'].includes(mode),'Use plan, check or apply');
 check(!process.env.GITHUB_ACTIONS,'Production migration is a local operator action, never a public CI job');
 const allowed=['--plan','--bucket','--backup-dir','--confirm-plan'];check(Object.keys(options).every(key=>allowed.includes(key)),'Unknown migration option');
 const plan=assertPlan(JSON.parse(await fs.readFile(options['--plan'],'utf8')));
 const {createMigrationPort}=await import('./item-catalogue-migration-firebase.mjs');
 const port=await createMigrationPort({project:plan.project,bucket:options['--bucket'],backupDirectory:options['--backup-dir']});
 console.log(JSON.stringify(await migrateCatalogue(plan,port,{apply:mode==='apply',confirmPlanSha256:options['--confirm-plan']})));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
