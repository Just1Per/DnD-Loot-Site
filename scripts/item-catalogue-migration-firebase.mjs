/** Operator-only Firebase adapter. Never imported by the website or public CI. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {digest} from './build-srd-item-hashes.mjs';
import {documentsToRows} from './audit-item-catalogue.mjs';
import {fieldsHash,encodeFields,POLICY} from './item-catalogue-migration.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message);};
const exists=async file=>{try{await fs.access(file);return true;}catch{return false;}};
const baseImageId=value=>{
 let base=String(value||'').toLowerCase().replace(/\+/g,'').replace(/[0-9]/g,'');
 for(const word of ['common','uncommon','rare','very-rare','veryrare','legendary','artifact','minor','major','grey','gray','red','blue','green','black','white','yellow','purple','orange','bronze','silver','gold','plus'])base=base.replace(new RegExp(`(?<=^|[-_\\s])${word}(?=[-_\\s]|$)`,'gi'),'');
 return base.replace(/[-_\s]+/g,'-').replace(/^[-_]+|[-_]+$/g,'')||value;
};
export async function createMigrationPort({project,bucket:bucketName,backupDirectory,services}){
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||''),'Invalid project');
 check(typeof bucketName==='string'&&/^[a-z0-9][a-z0-9._-]+$/.test(bucketName),'Specify the exact Storage bucket');
 check(backupDirectory&&path.isAbsolute(backupDirectory),'Specify an absolute private backup directory');
 // Refuse repository-local exports. Original data and tokens must remain private.
 let parent=path.resolve(backupDirectory),tail=[];
 while(!await exists(parent)){tail.unshift(path.basename(parent));parent=path.dirname(parent);}
 let resolved=path.join(await fs.realpath(parent),...tail);
 const checkout=await fs.realpath(new URL('..',import.meta.url));
 check(resolved!==checkout&&!resolved.startsWith(checkout+path.sep),'Backup must be outside the repository');
 parent=resolved;
 while(parent!==path.dirname(parent)){
  const git=path.join(parent,'.git');
  if(await exists(git)){const stat=await fs.lstat(git);check(!stat.isFile()&&!await exists(path.join(git,'HEAD')),'Backup must be outside every Git checkout');}
  parent=path.dirname(parent);
 }
 let credential,bucket;
 if(services){
  check(project.startsWith('demo-')&&/^http:\/\/127\.0\.0\.1:\d+$/.test(services.firestoreOrigin||''),'Injected services are for local demo-project tests only');
  credential=services.credential;bucket=services.bucket;
 }else{
  const require=createRequire(new URL('../functions/package.json',import.meta.url));
  const {initializeApp,applicationDefault}=require('firebase-admin/app');
  const {getStorage}=require('firebase-admin/storage');
  credential=applicationDefault();const app=initializeApp({credential,projectId:project,storageBucket:bucketName},'catalogue-migration-'+Date.now());bucket=getStorage(app).bucket();
 }
 const fetcher=services?.fetcher||fetch;
 const prefix=`projects/${project}/databases/(default)/documents/`,api=(services?services.firestoreOrigin:'https://firestore.googleapis.com')+'/v1/';
 async function request(suffix,{method='GET',body,missing=false}={}){
  const token=await credential.getAccessToken();
  const response=await fetcher(api+suffix,{method,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  if(response.status===404&&missing)return null;
  check(response.ok,'Firestore operation failed ('+response.status+'); no response body is logged');
  return response.status===204?{}:response.json();
 }
 const read=(relative,transaction='')=>request(prefix+relative+(transaction?'?transaction='+encodeURIComponent(transaction):''),{missing:true});
 async function list(relative){
  const result=[],seen=new Set();let page='';
  do{const suffix=prefix+relative+'?pageSize=1000'+(page?'&pageToken='+encodeURIComponent(page):'');const data=await request(suffix);result.push(...(data.documents||[]));page=data.nextPageToken||'';check(!page||!seen.has(page),'Repeated page token');if(page)seen.add(page);}while(page);
  return result;
 }
 const database=`projects/${project}/databases/(default)/documents`;
 const commit=(writes,transaction)=>request(database+':commit',{method:'POST',body:{writes,...(transaction?{transaction}:{})}});
 async function transact(work){
  const {transaction}=await request(database+':beginTransaction',{method:'POST',body:{options:{readWrite:{}}}});
  let committed=false;
  const get=async relative=>{
   const records=await request(database+':batchGet',{method:'POST',body:{documents:[prefix+relative],transaction}});
   check(Array.isArray(records)&&records.length===1,'Incomplete transactional document read');
   const record=records[0];check(record.found?.name===prefix+relative||record.missing===prefix+relative,'Unexpected transactional document');
   return record.found||null;
  };
  try{const writes=await work(get);if(writes.length){await commit(writes,transaction);committed=true;}}
  finally{if(!committed)await request(database+':rollback',{method:'POST',body:{transaction}}).catch(()=>{});}
 }
 const archivePath=(plan,item)=>`campaigns/${plan.campaignId}/catalogueArchives/${item.archiveId}`;
 const copyPath=(plan,item)=>`campaigns/${plan.campaignId}/items/${item.archiveId}`;
 const marker=item=>({sourceId:item.id,sourceSha256:item.sourceSha256});
 let artwork=[],backupReady=false;
 async function privateFile(file,content){
  if(await exists(file)){const stat=await fs.lstat(file);check(stat.isFile()&&!stat.isSymbolicLink()&&(stat.mode&0o077)===0,'Existing backup file is not private');const old=await fs.readFile(file);check(digest(old)===digest(content),'Backup content differs; refusing overwrite');return;}
  await fs.writeFile(file,content,{flag:'wx',mode:0o600});
 }
 function itemAssetPaths(item){
  const data=documentsToRows([item.source])[0].data;
  const names=new Set();
  for(const key of ['imageUrl','thumbnailUrl','thumbUrl','image'])if(typeof data[key]==='string'&&data[key]){
   const value=data[key];let found='';
   try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname==='firebasestorage.googleapis.com'){
    const match=url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);if(match&&decodeURIComponent(match[1])===bucketName)found=decodeURIComponent(match[2]);
   }else if(url.protocol==='https:'&&url.hostname==='storage.googleapis.com'&&url.pathname.startsWith('/'+bucketName+'/'))found=decodeURIComponent(url.pathname.slice(bucketName.length+2));}catch{}
   if(found.startsWith('dnd-item-images/'))names.add(found);else if(!/^\.?\/?placeholder\.png$/.test(value))names.add('UNRESOLVED:'+key);
  }
  return new Set([...names,`dnd-item-images/${baseImageId(data.imageBaseId||item.id)}.png`,`dnd-item-images/${item.id}.png`]);
 }
 const port={
  async verifyTarget(plan){
   const target=await read('campaigns/'+plan.campaignId),fields=target?.fields||{};
   check(fields.ownerId?.stringValue===plan.ownerId&&fields.name?.stringValue===plan.campaignName,'Target campaign name/owner do not match the pinned plan');
   check(Number(fields.inventoryVersion?.integerValue)===2,'Upgrade the target campaign inventory before migration');
  },
  async verifyExistingCampaigns(){
   for(const campaign of await list('campaigns'))if(Number(campaign.fields?.inventoryVersion?.integerValue)!==2){
    check(!(await list(campaign.name.slice(prefix.length)+'/itemState')).length,'A legacy campaign still has itemState records; upgrade it before restricting the root catalogue');
   }
  },
  listSources:()=>list('items'),
  readSource:id=>read('items/'+id),
  async isCompleted(plan,item,source){
   const journal=await read(archivePath(plan,item));if(!journal)return false;
   const f=journal.fields||{};check(f.sourceSha256?.stringValue===item.sourceSha256&&f.manifestSha256?.stringValue===plan.manifestSha256,'Archive collision or a different manifest');
   if(f.completed?.booleanValue!==true)return false;
   const copy=await read(copyPath(plan,item));check(copy&&fieldsHash(copy.fields)===f.copySha256?.stringValue,'Completed private copy changed; manual review required');
   check(item.action==='retire'?!source:!!source&&fieldsHash(source.fields)===fieldsHash(item.replacement),'Completed root record changed; manual review required');
   return true;
  },
  async inspectArtwork(plan){
   const [metadata]=await bucket.getMetadata();check(metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled===true,'Private archive requires uniform bucket-level access');
   const [policy]=await bucket.iam.getPolicy({requestedPolicyVersion:3});
   check(!(policy.bindings||[]).some(binding=>(binding.members||[]).some(member=>['allUsers','allAuthenticatedUsers'].includes(member))),'Bucket has a public IAM grant; archive privacy cannot be guaranteed');
   const [files]=await bucket.getFiles({prefix:'dnd-item-images/'});
   const metadataBackup=path.join(backupDirectory,'artwork-metadata.json');
   artwork=await exists(metadataBackup)?JSON.parse(await fs.readFile(metadataBackup,'utf8')):[];
   if(artwork.length){const saved=JSON.parse(await fs.readFile(path.join(backupDirectory,'plan.json'),'utf8'));check(saved.planSha256===plan.planSha256,'Backup belongs to a different plan');}
   for(const file of files){const [meta]=await file.getMetadata();check(Number(meta.size)<10*1024*1024,'Legacy object requires separate large-file backup');check(/^image\/(png|jpeg|webp|gif)$/.test(meta.contentType||''),'Unexpected legacy object type; review before migration');
    const old=artwork.find(asset=>asset.sourcePath===file.name);
    if(old)check(old.generation===String(meta.generation),'Legacy artwork changed since backup');
    else{check(!await exists(metadataBackup),'New artwork appeared after backup');artwork.push({sourcePath:file.name,generation:String(meta.generation),metageneration:String(meta.metageneration),metadata:meta});}}
   artwork.unresolved=[];
   for(const item of plan.items)for(const asset of itemAssetPaths(item))if(asset.startsWith('UNRESOLVED:'))artwork.unresolved.push({id:item.id,field:asset.slice(11)});
   return artwork;
  },
  async backup(plan,assets){
   check(!assets.unresolved?.length,'Some external/unknown artwork needs private backup before apply');
   try{await fs.mkdir(backupDirectory,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}
   const stat=await fs.lstat(backupDirectory);check(stat.isDirectory()&&!stat.isSymbolicLink()&&(stat.mode&0o077)===0,'Backup directory must be private (0700) and not a symlink');
   await privateFile(path.join(backupDirectory,'plan.json'),Buffer.from(JSON.stringify(plan,null,2)));
   await privateFile(path.join(backupDirectory,'artwork-metadata.json'),Buffer.from(JSON.stringify(assets,null,2)));
   for(const asset of assets){const backup=path.join(backupDirectory,digest(asset.sourcePath)+'.bin');const data=await exists(backup)?await fs.readFile(backup):(await bucket.file(asset.sourcePath,{generation:asset.generation}).download({validation:'crc32c'}))[0];asset.sha256=digest(data);await privateFile(backup,data);}
   // Flush the backup files before performing any destructive operation.
   for(const name of await fs.readdir(backupDirectory)){const handle=await fs.open(path.join(backupDirectory,name),'r');try{await handle.sync();}finally{await handle.close();}}
   backupReady=true;
  },
  async copyAndVerifyArtwork(plan,assets){
   check(backupReady,'Private backup must complete first');
   for(const asset of assets){
    const data=await fs.readFile(path.join(backupDirectory,digest(asset.sourcePath)+'.bin'));check(digest(data)===asset.sha256,'Artwork backup checksum mismatch');
    asset.privatePath=`campaign-catalogue-images/${plan.campaignId}/${digest(asset.sourcePath)}/${asset.sha256}`;
    const destination=bucket.file(asset.privatePath),[present]=await destination.exists();
    if(!present)await destination.save(data,{resumable:false,validation:'crc32c',preconditionOpts:{ifGenerationMatch:0},metadata:{contentType:asset.metadata.contentType,cacheControl:'private, no-store',metadata:{catalogueSourceSha256:asset.sha256}}});
    const [stored]=await destination.download({validation:'crc32c'}),[meta]=await destination.getMetadata();
    check(digest(stored)===asset.sha256&&!meta.metadata?.firebaseStorageDownloadTokens,'Private artwork verification failed or download tokens exist');
    const anonymous=await fetcher('https://storage.googleapis.com/'+bucketName+'/'+asset.privatePath.split('/').map(encodeURIComponent).join('/'),{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(30000)});
    check([401,403,404].includes(anonymous.status),'Private artwork is anonymously readable or privacy check is inconclusive');
   }
   return assets;
  },
  async assetsForItem(item,assets){return [...itemAssetPaths(item)].map(name=>assets.find(asset=>asset.sourcePath===name)).filter(Boolean);},
  async copyPrivate(plan,item,documents){
   await transact(async get=>{
    const source=await get('items/'+item.id),old=await get(copyPath(plan,item)),journal=await get(archivePath(plan,item));
    check(source?.updateTime===item.source.updateTime&&fieldsHash(source.fields)===item.sourceSha256,'Source changed during private copy');
    if(old||journal){check(old&&journal&&fieldsHash(old.fields)===fieldsHash(documents.copy)&&journal.fields.sourceSha256?.stringValue===item.sourceSha256&&journal.fields.manifestSha256?.stringValue===plan.manifestSha256,'Existing archive differs; never overwrite an edited private item');return [];}
    const archive={...documents.archive,...encodeFields({copySha256:fieldsHash(documents.copy),completed:false})};
    return [{update:{name:prefix+copyPath(plan,item),fields:documents.copy},currentDocument:{exists:false}},
     {update:{name:prefix+archivePath(plan,item),fields:archive},currentDocument:{exists:false}}];
   });
  },
  async verifyPrivate(plan,item,documents){
   const copy=await read(copyPath(plan,item)),journal=await read(archivePath(plan,item));
   check(copy&&fieldsHash(copy.fields)===fieldsHash(documents.copy)&&journal?.fields.original?.mapValue&&fieldsHash(journal.fields.original.mapValue.fields)===item.sourceSha256,'Original/private-copy verification failed');
  },
  async verifyNoNewSources(plan){const ids=new Set(plan.items.map(item=>item.id));check((await list('items')).every(doc=>doc.name.split('/').at(-1)==='catalog_meta'||ids.has(doc.name.split('/').at(-1))),'New root items appeared; stop and rebuild review');},
  async publishOrRetire(plan,item){
   await transact(async get=>{
    const copy=await get(copyPath(plan,item)),journal=await get(archivePath(plan,item)),source=await get('items/'+item.id);
    check(copy&&journal&&fieldsHash(copy.fields)===journal.fields.copySha256?.stringValue,'Private copy is missing or changed');
    check(source?.updateTime===item.source.updateTime&&fieldsHash(source.fields)===item.sourceSha256,'Source changed before retirement');
    const root=item.action==='publish'?{update:{name:item.source.name,fields:item.replacement},currentDocument:{updateTime:item.source.updateTime}}:{delete:item.source.name,currentDocument:{updateTime:item.source.updateTime}};
    return [root,
     {update:{name:journal.name,fields:{...journal.fields,...encodeFields({completed:true})}},currentDocument:{updateTime:journal.updateTime}},
     {update:{name:prefix+'items/catalog_meta',fields:encodeFields({_type:'catalog-meta',policy:POLICY,updatedAt:Date.now()})},updateMask:{fieldPaths:['_type','policy','updatedAt']},updateTransforms:[{fieldPath:'version',increment:{integerValue:'1'}}]}];
   });
  },
  async retireArtwork(plan,assets){
   // Delete only the exact backed-up generations, after all root copies verify.
   const expected=new Set(assets.map(asset=>asset.sourcePath));const [fresh]=await bucket.getFiles({prefix:'dnd-item-images/'});
   check(fresh.every(file=>expected.has(file.name)),'New legacy artwork appeared; review before retirement');
   for(const asset of assets){const [bytes]=await bucket.file(asset.privatePath).download({validation:'crc32c'});check(digest(bytes)===asset.sha256,'Private artwork changed; refusing legacy deletion');
    const source=bucket.file(asset.sourcePath),[present]=await source.exists();if(present)await source.delete({ifGenerationMatch:asset.generation});}
  },
  async verifyFinal(plan){
   const all=await list('items'),byId=new Map(all.map(doc=>[doc.name.split('/').at(-1),doc]));
   for(const item of plan.items)check(item.action==='retire'?!byId.has(item.id):fieldsHash(byId.get(item.id)?.fields||{})===fieldsHash(item.replacement),'Final root verification failed');
   const expected=new Set(plan.items.map(item=>item.id));check([...byId.keys()].every(id=>id==='catalog_meta'||expected.has(id)),'Unreviewed items appeared during migration');
   const count=plan.items.filter(item=>item.action==='publish').length;
   await commit([{update:{name:prefix+'items/catalog_meta',fields:encodeFields({itemCount:count,policy:POLICY,updatedAt:Date.now()})},updateMask:{fieldPaths:['itemCount','policy','updatedAt']},updateTransforms:[{fieldPath:'version',increment:{integerValue:'1'}}]}]);
  }
 };
 return port;
}
