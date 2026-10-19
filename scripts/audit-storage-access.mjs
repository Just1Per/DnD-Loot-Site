/** Read-only operator diagnostic. Prints aggregate counts, never object paths or tokens. */
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const publicEntities=new Set(['allUsers','allAuthenticatedUsers']);
function counts(rows){
 if(!Array.isArray(rows))return {available:false};
 return {available:true,entries:rows.length,publicRead:rows.filter(r=>publicEntities.has(r.entity)&&r.role==='READER').length,publicWrite:rows.filter(r=>publicEntities.has(r.entity)&&['OWNER','WRITER'].includes(r.role)).length,individualOrGroup:rows.filter(r=>/^(user-|group-|domain-)/.test(r.entity||'')).length};
}
export async function auditStorageAccess(bucket){
 const [metadata]=await bucket.getMetadata({projection:'full'});
 const uniform=metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled;
 if(typeof uniform!=='boolean')throw Error('Bucket access mode is unavailable; no conclusion is safe.');
 const [policy]=await bucket.iam.getPolicy({requestedPolicyVersion:3});
 if(!Array.isArray(policy.bindings))throw Error('Bucket IAM bindings are unavailable.');
 const result={format:1,productionWrites:0,uniformBucketLevelAccess:uniform,publicAccessPrevention:metadata.iamConfiguration?.publicAccessPrevention||'unknown',publicBucketIamBindings:policy.bindings.filter(r=>(r.members||[]).some(m=>publicEntities.has(m))).length,bucketAcl:counts(metadata.acl),defaultObjectAcl:counts(metadata.defaultObjectAcl),objects:{total:0,aclUnavailable:0,publicRead:0,publicWrite:0,individualOrGroupAcl:0,withFirebaseDownloadToken:0},scanComplete:false};
 const seen=new Set();let pageToken;
 do{
  const [,,response]=await bucket.getFiles({autoPaginate:false,maxResults:1000,projection:'full',fields:'nextPageToken,items(name,acl,metadata)',...(pageToken?{pageToken}:{})});
  if(!response||!Array.isArray(response.items)&&response.items!==undefined)throw Error('Invalid object metadata response.');
  for(const object of response.items||[]){
   const acl=counts(object.acl);result.objects.total++;
   if(!acl.available&&!uniform)result.objects.aclUnavailable++;
   if(acl.publicRead)result.objects.publicRead++;
   if(acl.publicWrite)result.objects.publicWrite++;
   if(acl.individualOrGroup)result.objects.individualOrGroupAcl++;
   if(object.metadata?.firebaseStorageDownloadTokens)result.objects.withFirebaseDownloadToken++;
  }
  pageToken=response.nextPageToken;
  if(pageToken){if(seen.has(pageToken))throw Error('Repeated page token; scan is incomplete.');seen.add(pageToken);}
 }while(pageToken);
 result.scanComplete=true;
 result.note='Metadata audit only. Does not authorize changing bucket access, deploying rules or applying the migration. Object ACLs do not capture all inherited project/organization IAM or application dependencies.';
 return result;
}
async function main(){
 if(process.argv.length!==2)throw Error('Run without arguments from the operator package.');
 const require=createRequire(new URL('../functions/package.json',import.meta.url));
 const {initializeApp,applicationDefault,deleteApp}=require('firebase-admin/app');
 const {getStorage}=require('firebase-admin/storage');
 const app=initializeApp({credential:applicationDefault(),projectId:'dnd-loot-site',storageBucket:'dnd-loot-site.firebasestorage.app'},'storage-access-audit');
 try{console.log(JSON.stringify(await auditStorageAccess(getStorage(app).bucket()),null,2));}finally{await deleteApp(app);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error('Read-only Storage audit failed (code '+String(error.code||'unavailable').replace(/[^a-zA-Z0-9_/-]/g,'').slice(0,60)+'). No access settings or production data were changed.');process.exitCode=1;});
