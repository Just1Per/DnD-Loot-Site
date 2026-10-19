import {assertArchiveStorage,verifyArchiveBucket,validBucket} from './archive-storage.mjs';
import {createPrivateDirectory,assertPrivateFile,writePrivateBytes} from './private-output.mjs';
/** Operator-only Firebase adapter. Never imported by the website or public CI. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {digest} from './build-srd-item-hashes.mjs';
import {documentsToRows,decodeValue} from './audit-item-catalogue.mjs';
import {assertLibraryImportPlan} from './private-item-library.mjs';
import {fieldsHash,encodeFields,POLICY,isLibraryPlan} from './item-catalogue-migration.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message);};
const emptyLegacyMarker=(file,meta)=>file.name==='dnd-item-images/'&&String(meta.size)==='0';
const exists=async file=>{try{await fs.access(file);return true;}catch{return false;}};
const baseImageId=value=>{
 let base=String(value||'').toLowerCase().replace(/\+/g,'').replace(/[0-9]/g,'');
 for(const word of ['common','uncommon','rare','very-rare','veryrare','legendary','artifact','minor','major','grey','gray','red','blue','green','black','white','yellow','purple','orange','bronze','silver','gold','plus'])base=base.replace(new RegExp(`(?<=^|[-_\\s])${word}(?=[-_\\s]|$)`,'gi'),'');
 return base.replace(/[-_\s]+/g,'-').replace(/^[-_]+|[-_]+$/g,'')||value;
};
/** Retry only idempotent GET responses; transaction/commit POSTs are never replayed. */
export async function firestoreReadResponse(fetcher,url,options,{sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onRetry=message=>console.error(message)}={}){
 const retryable=new Set([429,502,503,504]);
 for(let attempt=0;;attempt++){
  const response=await fetcher(url,{...options,signal:AbortSignal.timeout(60000)});
  if((options.method||'GET')!=='GET'||!retryable.has(response.status)||attempt>=3)return response;
  try{await response.body?.cancel();}catch{} // Release a failed response without logging its body.
  const delay=1000*2**attempt;
  onRetry('Firestore read temporarily unavailable ('+response.status+'); retry '+(attempt+1)+'/3 in '+delay/1000+' s.');
  await sleep(delay);
 }
}
export async function createMigrationPort({project,bucket:bucketName,archiveBucket:archiveBucketName=bucketName,backupDirectory,services}){
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||''),'Invalid project');
 check(typeof bucketName==='string'&&/^[a-z0-9][a-z0-9._-]+$/.test(bucketName),'Specify the exact Storage bucket');
 check(backupDirectory&&path.isAbsolute(backupDirectory),'Specify an absolute private backup directory');
 check(validBucket(archiveBucketName),'Specify the exact private archive bucket');
 const separate=archiveBucketName!==bucketName;
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
 let credential,bucket,archiveBucket;
 if(services){
  check(project.startsWith('demo-')&&/^http:\/\/127\.0\.0\.1:\d+$/.test(services.firestoreOrigin||''),'Injected services are for local demo-project tests only');
  credential=services.credential;bucket=services.bucket;archiveBucket=separate?services.archiveBucket:bucket;check(archiveBucket,'Missing private archive service');
 }else{
  const require=createRequire(new URL('../functions/package.json',import.meta.url));
  const {initializeApp,applicationDefault}=require('firebase-admin/app');
  const {getStorage}=require('firebase-admin/storage');
  credential=applicationDefault();const app=initializeApp({credential,projectId:project,storageBucket:bucketName},'catalogue-migration-'+Date.now());bucket=getStorage(app).bucket();archiveBucket=separate?getStorage(app).bucket(archiveBucketName):bucket;
 }
 const fetcher=services?.fetcher||fetch;
 const prefix=`projects/${project}/databases/(default)/documents/`,api=(services?services.firestoreOrigin:'https://firestore.googleapis.com')+'/v1/';
 async function request(suffix,{method='GET',body,missing=false}={}){
  const token=await credential.getAccessToken();
  const response=await firestoreReadResponse(fetcher,api+suffix,{method,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
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
 const libraryRoot=ownerId=>`privateItemLibraries/${ownerId}`;
 const archivePath=(plan,item)=>isLibraryPlan(plan)?`${libraryRoot(plan.ownerId)}/originals/${item.archiveId}`:`campaigns/${plan.campaignId}/catalogueArchives/${item.archiveId}`;
 const copyPath=(plan,item)=>isLibraryPlan(plan)?`${libraryRoot(plan.ownerId)}/records/${item.archiveId}`:`campaigns/${plan.campaignId}/items/${item.archiveId}`;
 const templatePath=(plan,item)=>`${libraryRoot(plan.ownerId)}/templates/${item.archiveId}`;
 const marker=item=>({sourceId:item.id,sourceSha256:item.sourceSha256});
 let artwork=[],backupReady=false;
 async function privateFile(file,content){
  if(await exists(file)){await assertPrivateFile(file);const old=await fs.readFile(file);check(digest(old)===digest(content),'Backup content differs; refusing overwrite');return;}
  await writePrivateBytes(file,content);
 }
 function itemAssetPaths(item,{explicitOnly=false}={}){
  const data=documentsToRows([item.source])[0].data;
  const names=new Set();
  for(const key of ['imageUrl','thumbnailUrl','thumbUrl'])if(typeof data[key]==='string'&&data[key]){
   const value=data[key];let found='';
   try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname==='firebasestorage.googleapis.com'){
    const match=url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);if(match&&decodeURIComponent(match[1])===bucketName)found=decodeURIComponent(match[2]);
   }else if(url.protocol==='https:'&&url.hostname==='storage.googleapis.com'&&url.pathname.startsWith('/'+bucketName+'/'))found=decodeURIComponent(url.pathname.slice(bucketName.length+2));}catch{}
   if(/^dnd-item-images\/[^/]+$/.test(found))names.add(found);else if(!/^\.?\/?placeholder\.png$/.test(value))names.add('UNRESOLVED:'+key);
  }
  // The website does not render the legacy `image` metadata field. Preserve it
  // in archive.original, but do not fetch external metadata links or require them.
  return explicitOnly?names:new Set([...names,`dnd-item-images/${baseImageId(data.imageBaseId||item.id)}.png`,`dnd-item-images/${item.id}.png`]);
 }
 const port={
  async importLibraryTemplate(plan,{apply=false}={}){
   assertLibraryImportPlan(plan);check(plan.project===project,'Import project does not match the connected project');
   const sourceRelative=plan.source.name.slice(prefix.length),destinationRelative=`campaigns/${plan.campaignId}/items/${plan.itemId}`;
   const source=await read(sourceRelative),campaign=await read('campaigns/'+plan.campaignId),owner=await read('users/'+plan.ownerId);
   check(owner&&campaign?.fields.ownerId?.stringValue===plan.ownerId&&campaign.fields.name?.stringValue===plan.campaignName,'Import is restricted to the library owner’s exact own campaign');
   check(Number(campaign.fields.inventoryVersion?.integerValue)===2,'Upgrade the destination inventory before importing');
   check(source?.updateTime===plan.source.updateTime&&fieldsHash(source.fields)===plan.sourceSha256,'Reviewed library template changed; rebuild the import plan');
   const assets=decodeValue(source.fields.assets),copies=[];
   if(assets.length){
    await verifyArchiveBucket(bucket,archiveBucket,{separate});
   }
   for(const asset of assets){
    check((asset.bucket||bucketName)===archiveBucketName,'Library illustration bucket differs from the connected private archive');
    const file=archiveBucket.file(asset.privatePath),[meta]=await file.getMetadata(),[bytes]=await file.download({validation:'crc32c'});
    check(bytes.length<10*1024*1024&&/^image\/(png|jpeg|webp|gif)$/.test(meta.contentType||'')&&!meta.metadata?.firebaseStorageDownloadTokens&&digest(bytes)===asset.sha256,'Library illustration changed, has tokens or is not a verified bounded image');
    copies.push({...asset,path:`campaign-catalogue-images/${plan.campaignId}/${digest(asset.privatePath)}/${asset.sha256}`,bytes,contentType:meta.contentType});
   }
   const fields={...source.fields.item.mapValue.fields,...encodeFields({campaignId:plan.campaignId,rootItemId:null,visible:false,highlighted:false,lootMode:'dm',imageUrl:'',imageBaseId:'',librarySource:{ownerId:plan.ownerId,entryId:plan.entryId,sourceSha256:plan.sourceSha256,planSha256:plan.planSha256},...copies[0]?{archivedImage:{path:copies[0].path,sha256:copies[0].sha256}}:{},libraryImages:copies.map(asset=>({path:asset.path,sha256:asset.sha256}))})};
   check(Buffer.byteLength(JSON.stringify(fields))<700000,'Imported item is too large');
   const old=await read(destinationRelative);
   if(old){
    check(fieldsHash(old.fields)===fieldsHash(fields),'Existing import was edited; never overwrite it');
    for(const asset of copies){const file=bucket.file(asset.path),[bytes]=await file.download({validation:'crc32c'}),[meta]=await file.getMetadata();check(digest(bytes)===asset.sha256&&!meta.metadata?.firebaseStorageDownloadTokens,'Existing imported illustration is missing or changed');}
    return {itemId:plan.itemId,writes:0,dryRun:!apply,alreadyImported:true};
   }
   if(!apply)return {itemId:plan.itemId,writes:0,dryRun:true,images:copies.length};
   await createPrivateDirectory(backupDirectory,{allowExisting:true});
   const audit=path.join(backupDirectory,'library-import-'+plan.planSha256+'.json');await privateFile(audit,Buffer.from(JSON.stringify(plan,null,2)));
   const handle=await fs.open(audit,'r');try{await handle.sync();}finally{await handle.close();}
   for(const asset of copies){
    const destination=bucket.file(asset.path),[present]=await destination.exists();
    if(!present)await destination.save(asset.bytes,{resumable:false,validation:'crc32c',preconditionOpts:{ifGenerationMatch:0},metadata:{contentType:asset.contentType,cacheControl:'private, no-store',metadata:{librarySha256:asset.sha256}}});
    const [bytes]=await destination.download({validation:'crc32c'}),[meta]=await destination.getMetadata();
    check(digest(bytes)===asset.sha256&&!meta.metadata?.firebaseStorageDownloadTokens,'Campaign illustration verification failed');
    const anonymous=await fetcher('https://storage.googleapis.com/'+bucketName+'/'+asset.path.split('/').map(encodeURIComponent).join('/'),{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(30000)});
    check([401,403,404].includes(anonymous.status),'Imported illustration is anonymously readable or privacy is inconclusive');
   }
   let writes=0;
   await transact(async get=>{
    const current=await get(sourceRelative),target=await get('campaigns/'+plan.campaignId),account=await get('users/'+plan.ownerId),previous=await get(destinationRelative);
    check(account&&target?.fields.ownerId?.stringValue===plan.ownerId&&target.fields.name?.stringValue===plan.campaignName&&Number(target.fields.inventoryVersion?.integerValue)===2,'Destination identity or readiness changed');
    check(current?.updateTime===plan.source.updateTime&&fieldsHash(current.fields)===plan.sourceSha256,'Library template changed during import');
    if(previous){check(fieldsHash(previous.fields)===fieldsHash(fields),'Existing import was edited; never overwrite it');return [];}
    writes=1;return [{update:{name:prefix+destinationRelative,fields},currentDocument:{exists:false}}];
   });
   const saved=await read(destinationRelative);check(saved&&fieldsHash(saved.fields)===fieldsHash(fields),'Imported campaign copy could not be verified');
   return {itemId:plan.itemId,writes,dryRun:false,images:copies.length};
  },
  readLibraryTemplate:(ownerId,entryId)=>{check(typeof ownerId==='string'&&ownerId&&!ownerId.includes('/')&&typeof entryId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(entryId),'Exact library owner and template ID required');return read(`${libraryRoot(ownerId)}/templates/${entryId}`);},
  async inspectTarget(campaignId){
   check(typeof campaignId==='string'&&campaignId.length>0&&campaignId.length<200&&!campaignId.includes('/'),'Exact campaign ID required');
   const target=await read('campaigns/'+campaignId),fields=target?.fields||{};
   check(typeof fields.name?.stringValue==='string'&&fields.name.stringValue&&typeof fields.ownerId?.stringValue==='string'&&fields.ownerId.stringValue,'Target campaign name/owner are unavailable');
   return {campaignId,campaignName:fields.name.stringValue,ownerId:fields.ownerId.stringValue,inventoryVersion:Number(fields.inventoryVersion?.integerValue)||0};
  },
  async verifyTarget(plan){
   if(isLibraryPlan(plan)){check((await read('users/'+plan.ownerId))?.name===prefix+'users/'+plan.ownerId,'Private library owner account does not exist');return;}
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
   if(isLibraryPlan(plan)&&item.action==='publish'){const template=await read(templatePath(plan,item));check(template&&fieldsHash(template.fields)===f.templateSha256?.stringValue,'Completed reusable template changed or is missing');}
   check(item.action==='retire'?!source:!!source&&fieldsHash(source.fields)===fieldsHash(item.replacement),'Completed root record changed; manual review required');
   return true;
  },
  async inspectArtwork(plan){
   if(plan.storage){assertArchiveStorage(plan.storage);check(plan.storage.sourceBucket===bucketName&&plan.storage.archiveBucket===archiveBucketName,'Connected buckets differ from the pinned migration plan');}
   else check(!separate,'Separate archive must be bound into a fresh migration plan');
   await verifyArchiveBucket(bucket,archiveBucket,{separate});
   const [files]=await bucket.getFiles({prefix:'dnd-item-images/'});
   const metadataBackup=path.join(backupDirectory,'artwork-metadata.json');
   artwork=await exists(metadataBackup)?JSON.parse(await fs.readFile(metadataBackup,'utf8')):[];
   if(artwork.length){const saved=JSON.parse(await fs.readFile(path.join(backupDirectory,'plan.json'),'utf8'));check(saved.planSha256===plan.planSha256,'Backup belongs to a different plan');}
   for(const file of files){const [meta]=await file.getMetadata();if(emptyLegacyMarker(file,meta))continue;check(Number(meta.size)<10*1024*1024,'Legacy object requires separate large-file backup');check(/^image\/(png|jpeg|webp|gif)$/.test(meta.contentType||''),'Unexpected legacy object type; review before migration');
    const old=artwork.find(asset=>asset.sourcePath===file.name);
    if(old)check(old.generation===String(meta.generation),'Legacy artwork changed since backup');
    else{check(!await exists(metadataBackup),'New artwork appeared after backup');artwork.push({sourcePath:file.name,generation:String(meta.generation),metageneration:String(meta.metageneration),metadata:meta});}}
   artwork.unresolved=[];
   for(const item of plan.items){
    for(const asset of itemAssetPaths(item,{explicitOnly:true})){
     if(asset.startsWith('UNRESOLVED:'))artwork.unresolved.push({id:item.id,field:asset.slice(11)});
     else if(!artwork.some(row=>row.sourcePath===asset))artwork.unresolved.push({id:item.id,field:'missing referenced object'});
    }
    const data=documentsToRows([item.source])[0].data;
    if(data.imageBaseId&&![...itemAssetPaths(item)].some(name=>artwork.some(row=>row.sourcePath===name)))artwork.unresolved.push({id:item.id,field:'missing imageBaseId object'});
   }
   // Shared illustrations may be used by several variants. Preserve every asset
   // used by a retained item, even when another item using it is retired.
   for(const asset of artwork){
    const users=plan.items.filter(item=>itemAssetPaths(item).has(asset.sourcePath));
    asset.shared=users.some(item=>item.action==='publish');
    asset.retired=users.some(item=>item.action==='retire');
   }
   const unresolvedByReason={};for(const issue of artwork.unresolved)unresolvedByReason[issue.field]=(unresolvedByReason[issue.field]||0)+1;
   let legacyImageMetadata=0,itemsWithStoredArtwork=0;
   for(const item of plan.items){
    const data=documentsToRows([item.source])[0].data;
    if(typeof data.image==='string'&&data.image)legacyImageMetadata++;
    if([...itemAssetPaths(item)].some(name=>artwork.some(asset=>asset.sourcePath===name)))itemsWithStoredArtwork++;
   }
   artwork.diagnostics={policy:'website-image-fields-and-id-fallback-v1',legacyImageMetadataPreserved:legacyImageMetadata,storedArtwork:artwork.length,itemsWithStoredArtwork,itemsWithoutStoredArtwork:plan.items.length-itemsWithStoredArtwork,unresolvedByReason};
   return artwork;
  },
  async backup(plan,assets){
   check(!assets.unresolved?.length,'Some external/unknown artwork needs private backup before apply');
   await createPrivateDirectory(backupDirectory,{allowExisting:true});
   await privateFile(path.join(backupDirectory,'plan.json'),Buffer.from(JSON.stringify(plan,null,2)));
   await privateFile(path.join(backupDirectory,'artwork-metadata.json'),Buffer.from(JSON.stringify(assets,null,2)));
   for(const asset of assets){const backup=path.join(backupDirectory,digest(asset.sourcePath)+'.bin');const data=await exists(backup)?await fs.readFile(backup):(await bucket.file(asset.sourcePath,{generation:asset.generation}).download({validation:'crc32c'}))[0];asset.sha256=digest(data);await privateFile(backup,data);}
   // Flush the backup files before performing any destructive operation.
   for(const name of await fs.readdir(backupDirectory)){const handle=await fs.open(path.join(backupDirectory,name),'r');try{await handle.sync();}finally{await handle.close();}}
   backupReady=true;
  },
  async copyAndVerifyArtwork(plan,assets){
   check(backupReady,'Private backup must complete first');
   await verifyArchiveBucket(bucket,archiveBucket,{separate});
   for(const asset of assets){
    const data=await fs.readFile(path.join(backupDirectory,digest(asset.sourcePath)+'.bin'));check(digest(data)===asset.sha256,'Artwork backup checksum mismatch');
    asset.privatePath=isLibraryPlan(plan)?`private-item-library-images/${plan.ownerId}/${digest(asset.sourcePath)}/${asset.sha256}`:`campaign-catalogue-images/${plan.campaignId}/${digest(asset.sourcePath)}/${asset.sha256}`;
    if(separate)asset.bucket=archiveBucketName;
    const destination=archiveBucket.file(asset.privatePath),[present]=await destination.exists();
    if(!present)await destination.save(data,{resumable:false,validation:'crc32c',preconditionOpts:{ifGenerationMatch:0},metadata:{contentType:asset.metadata.contentType,cacheControl:'private, no-store',metadata:{catalogueSourceSha256:asset.sha256}}});
    const [stored]=await destination.download({validation:'crc32c'}),[meta]=await destination.getMetadata();
    check(digest(stored)===asset.sha256&&!meta.metadata?.firebaseStorageDownloadTokens,'Private artwork verification failed or download tokens exist');
    const anonymous=await fetcher('https://storage.googleapis.com/'+archiveBucketName+'/'+asset.privatePath.split('/').map(encodeURIComponent).join('/'),{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(30000)});
    check((separate?[401,403]:[401,403,404]).includes(anonymous.status),'Private artwork is anonymously readable or privacy check is inconclusive');
   }
   return assets;
  },
  async assetsForItem(item,assets){return [...itemAssetPaths(item)].map(name=>assets.find(asset=>asset.sourcePath===name)).filter(Boolean);},
  async copyPrivate(plan,item,documents){
   await transact(async get=>{
    const source=await get('items/'+item.id),old=await get(copyPath(plan,item)),journal=await get(archivePath(plan,item));
    const template=documents.template?await get(templatePath(plan,item)):null;
    check(source?.updateTime===item.source.updateTime&&fieldsHash(source.fields)===item.sourceSha256,'Source changed during private copy');
    if(old||journal){check(old&&journal&&fieldsHash(old.fields)===fieldsHash(documents.copy)&&journal.fields.sourceSha256?.stringValue===item.sourceSha256&&journal.fields.manifestSha256?.stringValue===plan.manifestSha256,'Existing archive differs; never overwrite an edited private item');if(documents.template)check(template&&fieldsHash(template.fields)===fieldsHash(documents.template),'Existing library template differs');return [];}
    const archive={...documents.archive,...encodeFields({copySha256:fieldsHash(documents.copy),completed:false,...documents.template?{templateSha256:fieldsHash(documents.template)}:{}})};
    return [{update:{name:prefix+copyPath(plan,item),fields:documents.copy},currentDocument:{exists:false}},
     {update:{name:prefix+archivePath(plan,item),fields:archive},currentDocument:{exists:false}},
     ...documents.template?[{update:{name:prefix+templatePath(plan,item),fields:documents.template},currentDocument:{exists:false}}]:[]];
   });
  },
  async verifyPrivate(plan,item,documents){
   const copy=await read(copyPath(plan,item)),journal=await read(archivePath(plan,item));
   check(copy&&fieldsHash(copy.fields)===fieldsHash(documents.copy)&&journal?.fields.original?.mapValue&&fieldsHash(journal.fields.original.mapValue.fields)===item.sourceSha256,'Original/private-copy verification failed');
   check(fieldsHash({assets:journal.fields.assets})===fieldsHash({assets:documents.archive.assets}),'Private image references were not preserved exactly');
   if(documents.template){const template=await read(templatePath(plan,item));check(template&&fieldsHash(template.fields)===fieldsHash(documents.template),'Reusable library template was not verified');}
  },
  async verifyNoNewSources(plan){await verifyArchiveBucket(bucket,archiveBucket,{separate});const ids=new Set(plan.items.map(item=>item.id));check((await list('items')).every(doc=>doc.name.split('/').at(-1)==='catalog_meta'||ids.has(doc.name.split('/').at(-1))),'New root items appeared; stop and rebuild review');},
  async publishOrRetire(plan,item){
   await transact(async get=>{
    const copy=await get(copyPath(plan,item)),journal=await get(archivePath(plan,item)),source=await get('items/'+item.id);
    check(copy&&journal&&fieldsHash(copy.fields)===journal.fields.copySha256?.stringValue,'Private copy is missing or changed');
    if(isLibraryPlan(plan)&&item.action==='publish'){const template=await get(templatePath(plan,item));check(template&&fieldsHash(template.fields)===journal.fields.templateSha256?.stringValue,'Reusable library template is missing or changed');}
    check(source?.updateTime===item.source.updateTime&&fieldsHash(source.fields)===item.sourceSha256,'Source changed before retirement');
    const root=item.action==='publish'?{update:{name:item.source.name,fields:item.replacement},currentDocument:{updateTime:item.source.updateTime}}:{delete:item.source.name,currentDocument:{updateTime:item.source.updateTime}};
    const sharedArtwork=item.action==='publish'?artwork.filter(asset=>asset.shared&&itemAssetPaths(item).has(asset.sourcePath)).map(asset=>({update:{name:prefix+'catalogueArtwork/'+asset.sourcePath.slice('dnd-item-images/'.length),fields:encodeFields({status:'generated',path:asset.sourcePath,sha256:asset.sha256,origin:plan.artworkPolicy.origin,evidence:plan.artworkPolicy.evidence})}})):[];
    const hiddenArtwork=item.action==='retire'?artwork.filter(asset=>!asset.shared&&asset.retired&&itemAssetPaths(item).has(asset.sourcePath)).map(asset=>({delete:prefix+'catalogueArtwork/'+asset.sourcePath.slice('dnd-item-images/'.length)})):[];
    return [root,...sharedArtwork,...hiddenArtwork,
     {update:{name:journal.name,fields:{...journal.fields,...encodeFields({completed:true})}},currentDocument:{updateTime:journal.updateTime}},
     {update:{name:prefix+'items/catalog_meta',fields:encodeFields({_type:'catalog-meta',policy:POLICY,updatedAt:Date.now()})},updateMask:{fieldPaths:['_type','policy','updatedAt']},updateTransforms:[{fieldPath:'version',increment:{integerValue:'1'}}]}];
   });
  },
  async retireArtwork(plan,assets){
   await verifyArchiveBucket(bucket,archiveBucket,{separate});
   // Move only exclusively retired artwork out of shared Storage. Retained and
   // unrelated generated illustrations stay in place, including their URLs.
   const expected=new Set(assets.map(asset=>asset.sourcePath));const [fresh]=await bucket.getFiles({prefix:'dnd-item-images/'});
   for(const file of fresh){
    if(file.name==='dnd-item-images/'){const [meta]=await file.getMetadata();check(emptyLegacyMarker(file,meta),'Legacy folder marker changed; review before retirement');continue;}
    check(expected.has(file.name),'New legacy artwork appeared; review before retirement');
   }
   for(const asset of assets){const destination=archiveBucket.file(asset.privatePath),[bytes]=await destination.download({validation:'crc32c'}),[meta]=await destination.getMetadata();check(digest(bytes)===asset.sha256&&!meta.metadata?.firebaseStorageDownloadTokens,'Private artwork changed; refusing shared-object removal');
    const anonymous=await fetcher('https://storage.googleapis.com/'+archiveBucketName+'/'+asset.privatePath.split('/').map(encodeURIComponent).join('/'),{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(30000)});
    check([401,403].includes(anonymous.status),'Private artwork privacy must be verified before shared-object removal');
    const source=bucket.file(asset.sourcePath),[present]=await source.exists();
    if(asset.shared){check(present,'Retained generated artwork is missing');const [sharedBytes]=await source.download({validation:'crc32c'});check(digest(sharedBytes)===asset.sha256,'Retained generated artwork changed');}
    else if(asset.retired&&present)await source.delete({ifGenerationMatch:asset.generation});}
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
