/** Local operator diagnostic. Reads metadata only; never downloads or changes artwork. */
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';

const check=(ok,message)=>{if(!ok)throw Error(message);};
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=200&&!/[/\\]/.test(value);
const validBucket=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(value);
// Use the shipped renderer's exact/variant normalization, without an alternate rule.
const imageContext=vm.createContext({window:{},imageCache:new Map()});
vm.runInContext(fs.readFileSync(new URL('../js/modules/images.js',import.meta.url),'utf8'),imageContext);
function imageIdentity(row){return row.imageBaseId||row.rootItemId||row.id;}
function directReference(row,bucket){
 const raw=[row.imageUrl,row.thumbnailUrl,row.thumbUrl].find(v=>typeof v==='string'&&/^https:\/\//i.test(v));
 if(!raw)return {kind:'none'};
 try{
  const url=new URL(raw);let sourceBucket,object;
  if(url.hostname==='firebasestorage.googleapis.com'){
   const match=url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
   if(match){sourceBucket=decodeURIComponent(match[1]);object=decodeURIComponent(match[2]);}
  }else if(url.hostname==='storage.googleapis.com'){
   const parts=url.pathname.slice(1).split('/');sourceBucket=parts.shift();object=parts.map(decodeURIComponent).join('/');
  }
  if(!object)return {kind:'external-not-checked'};
  if(sourceBucket!==bucket)return {kind:'different-bucket-not-checked'};
  return {kind:'configured-bucket-object',object};
 }catch{return {kind:'invalid-url'};}
}
function validate(options){
 const {project,bucket,campaignName,itemName,archiveBucket=bucket}=options;
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||'')&&validBucket(bucket)&&validBucket(archiveBucket),'Specify the exact project and bucket names.');
 check(typeof campaignName==='string'&&campaignName.trim()&&campaignName.length<=200&&typeof itemName==='string'&&itemName.trim()&&itemName.length<=200,'Specify exact campaign and item names.');
}
export async function diagnoseCampaignItemImages(options,port){
 validate(options);
 const {bucket,campaignName,itemName,archiveBucket=bucket}=options;
 const campaigns=await port.findCampaigns(campaignName);
 check(campaigns.length===1&&!campaigns[0].deletedAt&&validId(campaigns[0].id)&&validId(campaigns[0].ownerId),'The exact campaign name must identify one active campaign with an owner.');
 const campaign=campaigns[0],rows=await port.findItems(campaign.id,itemName);
 check(rows.length>0&&rows.length<=20,'No matching campaign item, or more than 20 matches; narrow the exact item name.');
 const matches=[];
 for(const row of rows){
  const sourceId=row.rootItemId||row.catalogueArchive?.sourceId||row.id;
  const root=validId(sourceId)?await port.readRoot(sourceId):null;
  const identity=imageIdentity(row),candidates=validId(identity)?[...new Set([identity,imageContext.getBaseImageId(identity)])]:[];
  const fallbacks=[];
  for(const id of candidates){
   const object=`dnd-item-images/${id}.png`,metadata=await port.objectMetadata(bucket,object),registry=await port.readRegistry(id+'.png');
   fallbacks.push({exists:metadata.exists,publishedForPlayers:registry?.status==='generated'&&registry?.path===object});
  }
  const direct=directReference(row,bucket),directStatus={kind:direct.kind};
  if(direct.object)directStatus.exists=(await port.objectMetadata(bucket,direct.object)).exists;
  const archives=validId(sourceId)?await port.findArchives(campaign.id,campaign.ownerId,sourceId):[];
  let archivedAssets=0,existingArchiveAssets=0,unconfiguredArchiveAssets=0;
  for(const record of archives)for(const asset of (record.assets||[])){
   archivedAssets++;
   const assetBucket=asset.bucket||bucket;
   const allowedPath=typeof asset.privatePath==='string'&&(asset.privatePath.startsWith(`private-item-library-images/${campaign.ownerId}/`)||asset.privatePath.startsWith(`campaign-catalogue-images/${campaign.id}/`));
   if(![bucket,archiveBucket].includes(assetBucket)||!allowedPath){unconfiguredArchiveAssets++;continue;}
   if((await port.objectMetadata(assetBucket,asset.privatePath)).exists)existingArchiveAssets++;
  }
  matches.push({rootRecord:root?(root.catalogueStatus==='approved-v1'?'approved':'unapproved'):'missing',
   artworkDisabled:row.artwork?.status==='none',privateArchiveReference:!!row.archivedImage,
   direct:directStatus,fallbacks,archiveRecords:archives.length,archiveSearchMayBeTruncated:archives.length>=21,archivedAssets,existingArchiveAssets,unconfiguredArchiveAssets});
 }
 return {format:1,readOnly:true,productionWrites:0,matches};
}

async function main(){
 check(!process.env.GITHUB_ACTIONS,'Run the metadata diagnostic locally, not in public CI.');
 const args=process.argv.slice(2),flags={};
 for(let i=0;i<args.length;i+=2){check(['--project','--bucket','--archive-bucket','--campaign-name','--item-name'].includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')&&!flags[args[i]],'Use only the documented named options.');flags[args[i]]=args[i+1];}
 const options={project:flags['--project'],bucket:flags['--bucket'],archiveBucket:flags['--archive-bucket'],campaignName:flags['--campaign-name'],itemName:flags['--item-name']};
 // Validation happens before credentials or network access.
 validate(options);
 const require=createRequire(new URL('../functions/package.json',import.meta.url));
 const {initializeApp,applicationDefault,deleteApp}=require('firebase-admin/app'),{getFirestore,FieldPath}=require('firebase-admin/firestore'),{getStorage}=require('firebase-admin/storage');
 const app=initializeApp({credential:applicationDefault(),projectId:options.project},'item-image-diagnostic-'+Date.now());
 try{
  const db=getFirestore(app),storage=getStorage(app);
  const rows=async query=>(await query.get()).docs.map(doc=>({id:doc.id,...doc.data()}));
  const one=async(collection,id,fields)=>(await rows(db.collection(collection).where(FieldPath.documentId(),'==',id).select(...fields).limit(1)))[0]||null;
  const port={
   findCampaigns:name=>rows(db.collection('campaigns').where('name','==',name).select('ownerId','deletedAt').limit(2)),
   findItems:(id,name)=>rows(db.collection(`campaigns/${id}/items`).where('name','==',name).select('rootItemId','imageBaseId','imageUrl','thumbnailUrl','thumbUrl','artwork','archivedImage','catalogueArchive').limit(21)),
   readRoot:id=>one('items',id,['catalogueStatus']),readRegistry:id=>one('catalogueArtwork',id,['status','path']),
   findArchives:async(cid,owner,source)=>[...await rows(db.collection(`privateItemLibraries/${owner}/originals`).where('sourceId','==',source).select('assets').limit(21)),...await rows(db.collection(`campaigns/${cid}/catalogueArchives`).where('sourceId','==',source).select('assets').limit(21))],
   objectMetadata:async(bucket,object)=>{try{await storage.bucket(bucket).file(object).getMetadata();return {exists:true};}catch(error){if(Number(error.code)===404)return {exists:false};throw Error('Storage metadata read failed; check operator read access.');}}
  };
  console.log(JSON.stringify(await diagnoseCampaignItemImages(options,port),null,2));
 }finally{await deleteApp(app);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Read-only diagnostic could not complete. Check exact names, installed functions dependencies and Application Default Credentials with Firestore/Storage read access. No private values or server response bodies are logged.');process.exitCode=1;});
