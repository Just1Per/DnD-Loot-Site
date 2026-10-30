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
const planError=(code,message)=>Object.assign(Error(message),{recoveryCode:code});
const shaPattern=/^[a-f0-9]{64}$/;
export async function findPrivatePlan(checksum,{base}={}){
 check(shaPattern.test(checksum||''),'Use the exact plan checksum.');
 const directory=base||path.join(await privateOutputBase(),'ImageRecovery');await assertPrivateDirectory(directory);await outsideCheckout(directory);
 const dirs=(await fs.readdir(directory,{withFileTypes:true})).filter(entry=>/^CampaignAtlas-ImageRecovery-[a-f0-9-]{36}$/.test(entry.name));
 check(dirs.length<=100,'More than 100 saved plans; select a private plan explicitly.');const matches=[];
 for(const entry of dirs){
  check(entry.isDirectory()&&!entry.isSymbolicLink(),'Automatic plan discovery refuses links and unexpected entries.');
  await assertPrivateDirectory(path.join(directory,entry.name));const candidate=path.join(directory,entry.name,'recovery-plan.json');
  try{if(hash(await readPrivatePlan(candidate))===checksum)matches.push(candidate);}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)continue;throw error;}
 }
 if(matches.length===0)throw planError('PLAN_NOT_FOUND','No private saved plan matches that checksum. Keep the original plan and review its location.');
 if(matches.length!==1)throw planError('PLAN_AMBIGUOUS','Several private files match; select the original plan explicitly. No newest-file guess is made.');
 return matches[0];
}
const phases={findCampaigns:'find-campaign',findItems:'read-items',readCampaign:'verify-campaign',readItem:'verify-item',readRegistry:'read-artwork-registry',findArchives:'read-archive-references',bucketProjectNumber:'verify-bucket-project',destinationPolicy:'verify-destination-privacy',objectMetadata:'read-object-metadata',readObject:'read-image-bytes',createObject:'create-campaign-image',anonymousDenied:'verify-anonymous-denial'};
export function trackRecoveryPort(port,state){return Object.fromEntries(Object.entries(port).map(([key,work])=>[key,phases[key]?async(...args)=>{state.stage=phases[key];if(key==='createObject')state.createAttempts++;const result=await work(...args);if(key==='createObject')state.completedCreates++;return result;}:work]));}
export function recoveryFailure(error,state){
 const ownCodes=['PLAN_NOT_FOUND','PLAN_AMBIGUOUS','PLAN_EXPIRED','PLAN_CONFIRMATION_REQUIRED'];
 const code=ownCodes.includes(error?.recoveryCode)?error.recoveryCode:error?.code==='ENOENT'&&['plan-file','plan-discovery'].includes(state.stage)?'PLAN_FILE_NOT_FOUND':[401,403,7,'permission-denied','storage/unauthorized'].includes(error?.code)?'PERMISSION_DENIED':'RECOVERY_STOPPED';
 const attempts=Number.isSafeInteger(state.createAttempts)?state.createAttempts:0,completed=Number.isSafeInteger(state.completedCreates)?state.completedCreates:0;
 return{format:1,error:code,stage:state.stage,storageCreateAttempts:attempts,storageCreatesCompleted:completed,...(attempts===0?{productionWrites:0}:{}),mayHaveCreatedCopies:attempts>0,keepSamePlan:true};
}
const execution={stage:'arguments',createAttempts:0,completedCreates:0};
async function main(){
 check(!process.env.GITHUB_ACTIONS,'Run the recovery tool locally, not in public CI.');
 const flags={},args=process.argv.slice(2),allowed=['--project','--bucket','--archive-bucket','--campaign-name','--item-name','--apply-plan','--check-plan','--confirm-plan','--acknowledge-campaign-member-access'];
 for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')&&!flags[args[i]],'Use only the documented named options.');flags[args[i]]=args[i+1];}
 if(flags['--apply-plan']||flags['--check-plan']){
  const apply=!!flags['--apply-plan'],selection=flags[apply?'--apply-plan':'--check-plan'];execution.stage='plan-confirmation';
  const permitted=apply?['--apply-plan','--confirm-plan','--acknowledge-campaign-member-access']:['--check-plan','--confirm-plan'];
  check(Object.keys(flags).every(key=>permitted.includes(key)),'Use only the saved plan and its documented confirmation flags.');
  if(!shaPattern.test(flags['--confirm-plan']||'')||apply&&flags['--acknowledge-campaign-member-access']!=='yes')throw planError('PLAN_CONFIRMATION_REQUIRED','The exact plan checksum and explicit Apply acknowledgement are required.');
  execution.stage=selection==='auto'?'plan-discovery':'plan-file';const file=selection==='auto'?await findPrivatePlan(flags['--confirm-plan']):path.resolve(selection);
  execution.stage='plan-file';const plan=await readPrivatePlan(file);execution.stage='plan-validation';
  check(hash(plan)===flags['--confirm-plan'],'Saved plan checksum does not match the reviewed summary.');
  if(Number.isSafeInteger(plan.expiresAt)&&Date.now()>plan.expiresAt)throw planError('PLAN_EXPIRED','The plan expired; prepare and review a new plan.');validatePlan(plan);
  if(!apply){console.log(JSON.stringify({...summary(plan),check:'local-plan-only',planFileFound:true,planHashMatches:true,planUnexpired:true,productionMetadataRechecked:false},null,2));return;}
  execution.stage='initialize-sdk';const port=trackRecoveryPort(await createRecoveryPort(plan),execution);
  try{console.log(JSON.stringify(await applyRecovery(plan,port,{confirmPlan:flags['--confirm-plan'],acknowledgeMemberAccess:true}),null,2));}finally{await port.close();}return;
 }
 check(!flags['--confirm-plan']&&!flags['--acknowledge-campaign-member-access'],'Apply confirmations require a saved plan.');
 const options={project:flags['--project'],bucket:flags['--bucket'],archiveBucket:flags['--archive-bucket']||'auto',campaignName:flags['--campaign-name'],itemName:flags['--item-name']};validateOptions(options);
 execution.stage='initialize-sdk';const port=trackRecoveryPort(await createRecoveryPort(options),execution);
 try{const plan=await prepareRecovery(options,port);execution.stage='save-private-plan';const file=await savePrivatePlan(plan);console.error('Private plan saved: '+file);console.error('Preparation only: no production changes. Share the JSON summary, not the private plan file.');console.log(JSON.stringify(summary(plan),null,2));}finally{await port.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify(recoveryFailure(error,execution),null,2));console.error('Stopped at the reported stage. Keep the same private plan. No paths, credentials or provider response bodies are logged. Use --check-plan auto with the exact checksum for a local-only check.');process.exitCode=1;});
