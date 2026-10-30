/** Owner-run preparation/apply. Defaults to metadata-only preparation, never implicit writes. */
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {prepareRecovery,applyRecovery,validateOptions,validatePlan,summary,hash,validId} from './campaign-image-recovery.mjs';
import {privateOutputBase,createPrivateDirectory,writePrivateBytes,assertPrivateDirectory,assertPrivateFile} from './private-output.mjs';
const check=(condition,message)=>{if(!condition)throw Error(message);};
const itemFields=['name','visible','rootItemId','imageBaseId','imageUrl','thumbnailUrl','thumbUrl','artwork','archivedImage','catalogueArchive','campaignId'];
const version=snapshot=>snapshot.updateTime?snapshot.updateTime.seconds+':'+snapshot.updateTime.nanoseconds:'';
export async function createRecoveryPort({project,bucket,services}={}){
 check(!services||project.startsWith('demo-'),'Injected services are restricted to local demo tests.');
 let app,db,storage,close=async()=>{};
 if(services){({db,storage}=services);}else{
  const require=createRequire(new URL('../functions/package.json',import.meta.url)),{initializeApp,applicationDefault,deleteApp}=require('firebase-admin/app');
  app=initializeApp({credential:applicationDefault(),projectId:project},'campaign-image-recovery-'+Date.now());db=require('firebase-admin/firestore').getFirestore(app);storage=require('firebase-admin/storage').getStorage(app);close=()=>deleteApp(app);
 }
 const rows=async query=>(await query.get()).docs.map(doc=>({id:doc.id,...doc.data(),version:version(doc)}));
 const one=async(ref,fieldMask)=>{const [doc]=await db.getAll(ref,{fieldMask});return doc.exists?{id:doc.id,...doc.data(),version:version(doc)}:null;};
 const bucketMeta=async name=>(await storage.bucket(name).getMetadata())[0];
 return{
  close,
  findCampaigns:name=>rows(db.collection('campaigns').where('name','==',name).select('name','ownerId','deletedAt').limit(2)),
  findItems:(cid,name)=>{let query=db.collection('campaigns/'+cid+'/items');if(name!==undefined)query=query.where('name','==',name);return rows(query.select(...itemFields).limit(1001));},
  readCampaign:cid=>{check(validId(cid),'Invalid campaign');return one(db.doc('campaigns/'+cid),['name','ownerId','deletedAt']);},
  readItem:(cid,id)=>{check(validId(cid)&&validId(id),'Invalid item');return one(db.doc('campaigns/'+cid+'/items/'+id),itemFields);},
  readRegistry:id=>{check(validId(id),'Invalid artwork registry key');return one(db.doc('catalogueArtwork/'+id),['status','path']);},
  findArchives:async(cid,owner,id)=>[...await rows(db.collection('privateItemLibraries/'+owner+'/originals').where('sourceId','==',id).select('sourceId','assets').limit(21)),...await rows(db.collection('campaigns/'+cid+'/catalogueArchives').where('sourceId','==',id).select('sourceId','assets').limit(21))],
  bucketProjectNumber:async name=>String((await bucketMeta(name)).projectNumber||''),
  destinationPolicy:async name=>{
   check(name===bucket,'Destination bucket mismatch');const metadata=await bucketMeta(name),[iam]=await storage.bucket(name).iam.getPolicy({requestedPolicyVersion:3});
   const privateAccess=Array.isArray(iam.bindings)&&!iam.bindings.some(binding=>(binding.members||[]).some(member=>['allUsers','allAuthenticatedUsers'].includes(member)));
   return{private:privateAccess,uniform:metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled===true,projectNumber:String(metadata.projectNumber||'')};
  },
  objectMetadata:async(name,object)=>{try{const [meta]=await storage.bucket(name).file(object).getMetadata();return{exists:true,...meta};}catch(error){if(Number(error.code)===404)return{exists:false};throw Error('Object metadata could not be read; missing access is not a missing image.');}},
  readObject:async(name,object,generation)=>{
   const file=storage.bucket(name).file(object,{generation}),[meta]=await file.getMetadata();check(Number(meta.size)>0&&Number(meta.size)<5*1024*1024,'Image size changed or exceeds the bounded read.');
   return(await file.download({validation:'crc32c'}))[0];
  },
  createObject:async(name,object,bytes,options)=>{
   check(name===bucket&&/^campaign-item-images\/[^/]+\/[^/]+$/.test(object),'Recovery only creates campaign image objects.');
   await storage.bucket(name).file(object).save(bytes,{resumable:false,validation:'crc32c',preconditionOpts:{ifGenerationMatch:0},...(!options.uniform?{predefinedAcl:'private'}:{}),metadata:{contentType:options.contentType,cacheControl:'private, no-store',metadata:{campaignRecoveryPlan:options.planSha256,campaignRecoverySha256:options.sha256}}});
  },
  anonymousDenied:async(name,object)=>{
   const fetcher=services?.fetcher||fetch;
   for(const url of ['https://storage.googleapis.com/'+name+'/'+object.split('/').map(encodeURIComponent).join('/'),'https://firebasestorage.googleapis.com/v0/b/'+encodeURIComponent(name)+'/o/'+encodeURIComponent(object)+'?alt=media']){
    const response=await fetcher(url,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(30000)});if(![401,403].includes(response.status))return false;
   }return true;
  }
 };
}
async function outsideCheckout(directory){
 let current=await fs.realpath(directory),root=await fs.realpath(new URL('..',import.meta.url));const norm=value=>process.platform==='win32'?value.toLowerCase():value;
 check(norm(current)!==norm(root)&&!norm(current).startsWith(norm(root+path.sep)),'Private plans must be outside the downloaded project.');
 for(;;){try{const git=path.join(current,'.git'),stat=await fs.lstat(git);if(stat.isFile())throw Error('Private plans must be outside every Git checkout.');await fs.lstat(path.join(git,'HEAD'));throw Error('Private plans must be outside every Git checkout.');}catch(error){if(error.code!=='ENOENT')throw error;}const parent=path.dirname(current);if(parent===current)break;current=parent;}
}
export async function savePrivatePlan(plan,{base}={}){
 const directory=base||path.join(await privateOutputBase(),'ImageRecovery');if(!base)await createPrivateDirectory(directory,{allowExisting:true});await assertPrivateDirectory(directory);await outsideCheckout(directory);
 const output=path.join(directory,'CampaignAtlas-ImageRecovery-'+randomUUID());await createPrivateDirectory(output);const file=path.join(output,'recovery-plan.json');await writePrivateBytes(file,JSON.stringify(plan,null,2)+'\n');return file;
}
export async function readPrivatePlan(file){
 await assertPrivateFile(file);await outsideCheckout(path.dirname(file));const stat=await fs.stat(file);check(stat.size>0&&stat.size<2*1024*1024,'Invalid private plan size.');return JSON.parse(await fs.readFile(file,'utf8'));
}
async function main(){
 check(!process.env.GITHUB_ACTIONS,'Run the recovery tool locally, not in public CI.');
 const flags={},args=process.argv.slice(2),allowed=['--project','--bucket','--archive-bucket','--campaign-name','--item-name','--apply-plan','--confirm-plan','--acknowledge-campaign-member-access'];
 for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')&&!flags[args[i]],'Use only the documented named options.');flags[args[i]]=args[i+1];}
 if(flags['--apply-plan']){
  check(Object.keys(flags).every(key=>['--apply-plan','--confirm-plan','--acknowledge-campaign-member-access'].includes(key)),'Apply uses only the saved plan, never overridable destinations.');
  const plan=await readPrivatePlan(path.resolve(flags['--apply-plan']));validatePlan(plan);check(flags['--confirm-plan']===hash(plan)&&flags['--acknowledge-campaign-member-access']==='yes','Review the saved plan and acknowledge campaign-member access before applying.');
  const port=await createRecoveryPort(plan);try{console.log(JSON.stringify(await applyRecovery(plan,port,{confirmPlan:flags['--confirm-plan'],acknowledgeMemberAccess:true}),null,2));}finally{await port.close();}return;
 }
 check(!flags['--confirm-plan']&&!flags['--acknowledge-campaign-member-access'],'Apply confirmations require a saved plan.');
 const options={project:flags['--project'],bucket:flags['--bucket'],archiveBucket:flags['--archive-bucket']||'auto',campaignName:flags['--campaign-name'],itemName:flags['--item-name']};validateOptions(options);
 const port=await createRecoveryPort(options);try{const plan=await prepareRecovery(options,port);const file=await savePrivatePlan(plan);console.error('Private plan saved: '+file);console.error('Preparation only: no production changes. Share the JSON summary, not the private plan file.');console.log(JSON.stringify(summary(plan),null,2));}finally{await port.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Image recovery stopped. Check scope, installed dependencies, read/write permissions and verified destination privacy. Preparation changes no production data. An interrupted Apply can leave new copies; keep the same private plan for review/retry. No private values or server response bodies are logged.');process.exitCode=1;});
