const {test}=require('node:test'),assert=require('node:assert/strict');
const ready=import('../scripts/audit-storage-access.mjs');
function bucket(pages,uniform=false){let i=0;return {getMetadata:async options=>{assert.equal(options.projection,'full');return [{iamConfiguration:{uniformBucketLevelAccess:{enabled:uniform}},acl:[],defaultObjectAcl:[{entity:'allUsers',role:'READER'}]}]},iam:{getPolicy:async()=>[{bindings:[{role:'roles/storage.objectViewer',members:['projectViewer:private-project']}]}]},getFiles:async options=>{assert.equal(options.autoPaginate,false);assert.equal(options.projection,'full');if(i)assert.equal(options.pageToken,'next');return [[],null,pages[i++]];}};}
test('read-only paginated audit reports ACL risks and never discloses names, identities or download tokens',async()=>{
 const {auditStorageAccess}=await ready;
 const report=await auditStorageAccess(bucket([{items:[{name:'SECRET_PATH',acl:[{entity:'allUsers',role:'READER'},{entity:'user-SECRET_EMAIL',role:'OWNER'}],metadata:{firebaseStorageDownloadTokens:'SECRET_TOKEN'}}],nextPageToken:'next'},{items:[{acl:[{entity:'allAuthenticatedUsers',role:'OWNER'}]},{}]}]));
 assert.equal(report.productionWrites,0);assert.equal(report.scanComplete,true);assert.equal(report.defaultObjectAcl.publicRead,1);assert.equal(report.publicBucketIamBindings,0);
 assert.deepEqual(report.objects,{total:3,aclUnavailable:1,publicRead:1,publicWrite:1,individualOrGroupAcl:1,withFirebaseDownloadToken:1});
 assert.doesNotMatch(JSON.stringify(report),/SECRET|private-project/);
});
test('empty bucket and uniform access do not imply an ACL scan failure',async()=>{
 const {auditStorageAccess}=await ready;assert.equal((await auditStorageAccess(bucket([{}]))).objects.total,0);assert.equal((await auditStorageAccess(bucket([{items:[{}]}],true))).objects.aclUnavailable,0);
});
test('unavailable metadata, denied reads and repeated pagination stop without a successful report',async()=>{
 const {auditStorageAccess}=await ready;
 const missing=bucket([]);missing.getMetadata=async()=>[{}];await assert.rejects(auditStorageAccess(missing),/unavailable/);
 const denied=bucket([]);denied.getFiles=async()=>{throw Error('denied')};await assert.rejects(auditStorageAccess(denied),/denied/);
 await assert.rejects(auditStorageAccess(bucket([{nextPageToken:'next'},{nextPageToken:'next'}])),/Repeated/);
});
