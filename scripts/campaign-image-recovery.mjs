/** Image-only recovery contracts. No Firebase SDK and no document-write capability. */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
const imageContext=vm.createContext({window:{},imageCache:new Map()});
vm.runInContext(fs.readFileSync(new URL('../js/modules/images.js',import.meta.url),'utf8'),imageContext);
export const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const ok=(condition,message)=>{if(!condition)throw Error(message);};
export const validId=value=>typeof value==='string'&&value.length>0&&value.length<=200&&!/[/\\\u0000-\u001f]/.test(value)&&!['.','..'].includes(value);
const bucketId=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(value);
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const generation=value=>typeof value==='string'&&/^[1-9][0-9]{0,29}$/.test(value);
export function validateOptions(options){
 const {project,bucket,campaignName,itemName,archiveBucket='auto'}=options;
 ok(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||'')&&[project+'.firebasestorage.app',project+'.appspot.com'].includes(bucket),'Use this project’s default Firebase image bucket.');
 ok(typeof campaignName==='string'&&campaignName.trim()&&campaignName.length<=200,'An exact campaign name is required.');
 ok(itemName===undefined||typeof itemName==='string'&&itemName.trim()&&itemName.length<=200,'Use an exact item name, or omit it to inspect the campaign.');
 ok(archiveBucket==='auto'||bucketId(archiveBucket),'Use a valid archive bucket or explicit auto discovery.');
}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export const itemFingerprint=row=>hash(canonical(Object.fromEntries(['id','version','name','visible','rootItemId','imageBaseId','imageUrl','thumbnailUrl','thumbUrl','artwork','archivedImage','catalogueArchive','campaignId'].map(k=>[k,row[k]??null]))));
export const campaignFingerprint=campaign=>hash(canonical({id:campaign.id,ownerId:campaign.ownerId,name:campaign.name,deletedAt:campaign.deletedAt??null}));
const sourceId=row=>row.rootItemId||row.catalogueArchive?.sourceId||row.id;
const candidates=row=>{const id=row.imageBaseId||row.rootItemId||row.id;return validId(id)?[...new Set([id,imageContext.getBaseImageId(id)])].map(id=>'dnd-item-images/'+id+'.png'):[];};
const mime=value=>['image/png','image/jpeg','image/webp'].includes(value);
function eligible(row,campaignId){return validId(row.id)&&row.visible===true&&!row.archivedImage&&row.artwork?.status!=='none'&&(!row.campaignId||row.campaignId===campaignId);}
function activeCampaign(campaign){ok(campaign&&validId(campaign.id)&&validId(campaign.ownerId)&&typeof campaign.name==='string'&&!Object.hasOwn(campaign,'deletedAt'),'The target must be one active campaign with an owner.');}
function assetIdentity(asset,campaign,row){
 if(!sha(asset?.sha256)||typeof asset?.sourcePath!=='string'||!candidates(row).includes(asset.sourcePath)||!bucketId(asset.bucket))return false;
 const suffix=hash(asset.sourcePath)+'/'+asset.sha256;
 return asset.privatePath==='private-item-library-images/'+campaign.ownerId+'/'+suffix||asset.privatePath==='campaign-catalogue-images/'+campaign.id+'/'+suffix;
}
function pinnedMetadata(meta){return{generation:meta.generation,metageneration:String(meta.metageneration||''),size:Number(meta.size),contentType:meta.contentType,sourceSha256:meta.metadata?.catalogueSourceSha256||'',hasTokens:!!meta.metadata?.firebaseStorageDownloadTokens};}
function validMetadata(meta,checksum){return meta?.exists&&generation(meta.generation)&&Number.isSafeInteger(Number(meta.size))&&Number(meta.size)>0&&Number(meta.size)<5*1024*1024&&mime(meta.contentType)&&!meta.metadata?.firebaseStorageDownloadTokens&&(!meta.metadata?.catalogueSourceSha256||meta.metadata.catalogueSourceSha256===checksum);}
function assertPolicy(policy){ok(policy?.private===true&&typeof policy.uniform==='boolean'&&/^[0-9]+$/.test(String(policy.projectNumber||'')),'Destination bucket privacy could not be verified; no recovery writes are allowed.');}
export function summary(plan){return {format:1,readOnly:true,productionWrites:0,scannedItems:plan.scanned,plannedCopies:plan.entries.length,plannedBytes:plan.entries.reduce((sum,e)=>sum+e.source.metadata.size,0),skipped:plan.skipped,archiveBytesVerified:false,memberAccess:'existing campaign members',firestoreWrites:0,rootCatalogueWrites:0,sourceDeletes:0,tokenCreation:0,planSha256:hash(plan)};}
export async function prepareRecovery(options,port,{now=Date.now()}={}){
 validateOptions(options);const campaigns=await port.findCampaigns(options.campaignName);ok(campaigns.length===1,'The exact campaign name must identify one campaign.');const campaign=campaigns[0];activeCampaign(campaign);
 const policy=await port.destinationPolicy(options.bucket);assertPolicy(policy);
 const rows=await port.findItems(campaign.id,options.itemName);ok(rows.length>0&&rows.length<=1000,'The item scope is empty or exceeds 1,000 records.');ok(new Set(rows.map(r=>r.id)).size===rows.length,'Repeated item IDs in the selected scope.');
 const plan={format:1,kind:'campaign-image-recovery',project:options.project,bucket:options.bucket,campaignId:campaign.id,ownerId:campaign.ownerId,campaignFingerprint:campaignFingerprint(campaign),createdAt:now,expiresAt:now+24*60*60*1000,policy,scanned:rows.length,skipped:{},entries:[]},buckets=new Set(),metadata=new Map(),archives=new Map(),projects=new Map();
 const skip=reason=>{plan.skipped[reason]=(plan.skipped[reason]||0)+1;};
 const object=(bucket,path)=>{const key=JSON.stringify([bucket,path]);if(!metadata.has(key))metadata.set(key,port.objectMetadata(bucket,path));return metadata.get(key);};
 for(const row of rows){
  if(!eligible(row,campaign.id)){skip('notPlayerVisibleOrPrivate');continue;}
  if([row.imageUrl,row.thumbnailUrl,row.thumbUrl].some(v=>typeof v==='string'&&/^https:\/\//i.test(v))){skip('directImageRequiresSeparateReview');continue;}
  const destination='campaign-item-images/'+campaign.id+'/'+row.id;
  if((await object(options.bucket,destination)).exists){skip('campaignImageAlreadyExists');continue;}
  let shared=false,unpublished=false;
  for(const path of candidates(row)){if((await object(options.bucket,path)).exists){const registry=await port.readRegistry(path.slice('dnd-item-images/'.length));if(registry?.status==='generated'&&registry.path===path)shared=true;else unpublished=true;}}
  if(shared||unpublished){skip(shared?'sharedImageAvailable':'sharedPublicationRequiresReview');continue;}
  const id=sourceId(row);if(!validId(id)){skip('invalidSourceIdentity');continue;}
  if(!archives.has(id))archives.set(id,port.findArchives(campaign.id,campaign.ownerId,id));
  const records=await archives.get(id);if(records.length>=21){skip('archiveSearchMayBeTruncated');continue;}
  const found=new Map();let invalid=false,missing=false;
  for(const record of records){if(record.sourceId!==id||!Array.isArray(record.assets)){invalid=true;continue;}for(const raw of record.assets){
   const asset={...raw,bucket:raw.bucket||options.bucket};
   if(!assetIdentity(asset,campaign,row)){invalid=true;continue;}
   if(options.archiveBucket&&options.archiveBucket!=='auto'&&![options.bucket,options.archiveBucket].includes(asset.bucket)){invalid=true;continue;}
   buckets.add(asset.bucket);ok(buckets.size<=4,'More than four archive buckets are referenced; narrow the recovery scope.');
   const meta=await object(asset.bucket,asset.privatePath);if(!meta.exists){missing=true;continue;}if(!validMetadata(meta,asset.sha256)){invalid=true;continue;}
   if(!projects.has(asset.bucket))projects.set(asset.bucket,port.bucketProjectNumber(asset.bucket));const projectNumber=await projects.get(asset.bucket);ok(String(projectNumber)===String(policy.projectNumber),'Archive bucket belongs to a different project.');
   found.set(asset.sha256,{bucket:asset.bucket,path:asset.privatePath,sourcePath:asset.sourcePath,sha256:asset.sha256,metadata:pinnedMetadata(meta)});
  }}
  if(invalid){skip('archiveReferenceRequiresReview');continue;}if(found.size!==1){skip(found.size>1?'ambiguousArchive':missing?'archiveObjectMissing':'noMatchingArchive');continue;}
  plan.entries.push({itemId:row.id,sourceId:id,itemFingerprint:itemFingerprint(row),destination,source:[...found.values()][0]});
 }
 return plan;
}
export function validatePlan(plan,{now=Date.now()}={}){
 ok(plan?.format===1&&plan.kind==='campaign-image-recovery'&&/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(plan.project||'')&&[plan.project+'.firebasestorage.app',plan.project+'.appspot.com'].includes(plan.bucket),'Invalid recovery plan.');
 ok(validId(plan.campaignId)&&validId(plan.ownerId)&&sha(plan.campaignFingerprint)&&Number.isSafeInteger(plan.createdAt)&&plan.createdAt<=now+5*60*1000&&plan.expiresAt===plan.createdAt+24*60*60*1000&&now<=plan.expiresAt,'Recovery plan has expired or its identity is invalid.');
 assertPolicy(plan.policy);ok(Array.isArray(plan.entries)&&plan.entries.length<=1000&&new Set(plan.entries.map(e=>e.itemId)).size===plan.entries.length,'Invalid recovery entries.');
 for(const entry of plan.entries){const s=entry.source;ok(validId(entry.itemId)&&validId(entry.sourceId)&&sha(entry.itemFingerprint)&&entry.destination==='campaign-item-images/'+plan.campaignId+'/'+entry.itemId&&bucketId(s?.bucket)&&sha(s?.sha256)&&generation(s?.metadata?.generation)&&Number.isSafeInteger(s?.metadata?.size)&&s.metadata.size>0&&s.metadata.size<5*1024*1024&&mime(s.metadata.contentType)&&s.metadata.hasTokens===false,'Invalid recovery entry.');}
 return plan;
}
export async function applyRecovery(plan,port,{confirmPlan,acknowledgeMemberAccess=false,now=Date.now()}={}){
 validatePlan(plan,{now});ok(acknowledgeMemberAccess===true&&confirmPlan===hash(plan),'Explicit plan checksum and campaign-member access acknowledgement are required.');
 let created=0,alreadyPresent=0;
 const current=async entry=>{const campaign=await port.readCampaign(plan.campaignId);activeCampaign(campaign);ok(campaignFingerprint(campaign)===plan.campaignFingerprint,'Campaign identity or access changed; prepare a fresh plan.');const row=await port.readItem(plan.campaignId,entry.itemId);ok(row&&eligible(row,plan.campaignId)&&itemFingerprint(row)===entry.itemFingerprint&&sourceId(row)===entry.sourceId&&assetIdentity({...entry.source,privatePath:entry.source.path},campaign,row),'The selected item or source reference changed; prepare a fresh plan.');};
 for(const entry of plan.entries){
  await current(entry);const policy=await port.destinationPolicy(plan.bucket);assertPolicy(policy);ok(String(policy.projectNumber)===String(plan.policy.projectNumber),'Destination project changed.');ok(String(await port.bucketProjectNumber(entry.source.bucket))===String(policy.projectNumber),'Archive project changed.');
  const before=await port.objectMetadata(plan.bucket,entry.destination);
  if(before.exists){ok(before.metadata?.campaignRecoveryPlan===confirmPlan&&before.metadata?.campaignRecoverySha256===entry.source.sha256&&!before.metadata?.firebaseStorageDownloadTokens,'An image already exists at the destination; never overwrite it.');const bytes=await port.readObject(plan.bucket,entry.destination,before.generation);ok(hash(bytes)===entry.source.sha256,'Existing recovery copy differs.');ok(await port.anonymousDenied(plan.bucket,entry.destination),'Campaign copy privacy could not be verified.');alreadyPresent++;continue;}
  const source=await port.objectMetadata(entry.source.bucket,entry.source.path);ok(validMetadata(source,entry.source.sha256)&&hash(pinnedMetadata(source))===hash(entry.source.metadata),'Archive object changed; prepare a fresh plan.');
  const bytes=await port.readObject(entry.source.bucket,entry.source.path,entry.source.metadata.generation),type=entry.source.metadata.contentType,signature=Buffer.isBuffer(bytes)&&(type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/jpeg'?bytes.subarray(0,3).equals(Buffer.from([255,216,255])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP');ok(signature&&bytes.length===entry.source.metadata.size&&hash(bytes)===entry.source.sha256,'Archive bytes do not match the recorded checksum.');
  await current(entry); // Recheck item/campaign immediately before the create-only operation.
  await port.createObject(plan.bucket,entry.destination,bytes,{contentType:entry.source.metadata.contentType,uniform:policy.uniform,planSha256:confirmPlan,sha256:entry.source.sha256});
  const saved=await port.objectMetadata(plan.bucket,entry.destination);ok(saved.exists&&saved.metadata?.campaignRecoveryPlan===confirmPlan&&saved.metadata?.campaignRecoverySha256===entry.source.sha256&&!saved.metadata?.firebaseStorageDownloadTokens,'New campaign copy verification failed.');
  ok(hash(await port.readObject(plan.bucket,entry.destination,saved.generation))===entry.source.sha256&&await port.anonymousDenied(plan.bucket,entry.destination),'New campaign copy checksum or privacy failed.');await current(entry);created++;
 }
 return {format:1,readOnly:false,created,alreadyPresent,firestoreWrites:0,rootCatalogueWrites:0,sourceDeletes:0,tokenCreation:0};
}
