'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const ready=import('../scripts/campaign-image-recovery.mjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64');
async function fixture(){
 const C=await ready,options={project:'demo-vault-test',bucket:'demo-vault-test.firebasestorage.app',archiveBucket:'auto',campaignName:'PRIVATE_CAMPAIGN'},campaign={id:'campaign',ownerId:'owner',name:'PRIVATE_CAMPAIGN'},row={id:'copy',name:'PRIVATE_ITEM',visible:true,rootItemId:'retired-item',campaignId:'campaign',version:'1:1',damage:'PRIVATE_STATS'};
 const sourcePath='dnd-item-images/retired-item.png',checksum=C.hash(png),privatePath='private-item-library-images/owner/'+C.hash(sourcePath)+'/'+checksum,asset={bucket:'demo-private',privatePath,sourcePath,sha256:checksum},archives=[{sourceId:'retired-item',assets:[asset]}],objects=new Map(),reads=[],writes=[];
 objects.set(asset.bucket+'/'+privatePath,{bytes:png,meta:{exists:true,generation:'100',metageneration:'1',size:String(png.length),contentType:'image/png',metadata:{catalogueSourceSha256:checksum}}});
 const port={findCampaigns:async()=>[campaign],findItems:async()=>[row],destinationPolicy:async()=>({private:true,uniform:false,projectNumber:'123'}),bucketProjectNumber:async()=> '123',readRegistry:async()=>null,findArchives:async()=>archives,objectMetadata:async(b,p)=>{reads.push([b,p]);return objects.get(b+'/'+p)?.meta||{exists:false};},readCampaign:async()=>campaign,readItem:async()=>row,readObject:async(b,p,g)=>{reads.push(['bytes',b,p,g]);const v=objects.get(b+'/'+p);assert.equal(v.meta.generation,g);return v.bytes;},createObject:async(b,p,bytes,options)=>{assert.equal(objects.has(b+'/'+p),false);writes.push([b,p,options]);objects.set(b+'/'+p,{bytes,meta:{exists:true,generation:'200',metageneration:'1',size:String(bytes.length),contentType:options.contentType,metadata:{campaignRecoveryPlan:options.planSha256,campaignRecoverySha256:options.sha256}}});},anonymousDenied:async()=>true};
 return{C,options,campaign,row,asset,archives,objects,reads,writes,port};
}
test('metadata-only plan finds the proven private image and redacts names, paths, buckets and original data',async()=>{
 const f=await fixture(),before=JSON.stringify({row:f.row,archives:f.archives}),plan=await f.C.prepareRecovery(f.options,f.port),report=f.C.summary(plan);
 assert.equal(plan.entries.length,1);assert.equal(report.productionWrites,0);assert.equal(report.readOnly,true);assert.equal(report.archiveBytesVerified,false);assert.equal(report.plannedCopies,1);assert.equal(plan.entries[0].destination,'campaign-item-images/campaign/copy');assert.equal(f.writes.length,0);assert.ok(!f.reads.some(r=>r[0]==='bytes'));assert.equal(JSON.stringify({row:f.row,archives:f.archives}),before);assert.doesNotMatch(JSON.stringify(report),/PRIVATE|demo-private|retired-item|private-item-library|\/campaign\//);
});
test('apply requires explicit reviewed hash and member-access acknowledgement before any reads or creates',async()=>{
 const f=await fixture(),plan=await f.C.prepareRecovery(f.options,f.port);for(const options of [{},{confirmPlan:f.C.hash(plan)},{confirmPlan:'x',acknowledgeMemberAccess:true}])await assert.rejects(f.C.applyRecovery(plan,{},options));assert.equal(f.writes.length,0);
});
test('image-only apply verifies bytes, creates a campaign-local copy and safely resumes without document/root/source changes',async()=>{
 const f=await fixture(),before=JSON.stringify({row:f.row,campaign:f.campaign,archives:f.archives}),plan=await f.C.prepareRecovery(f.options,f.port),opts={confirmPlan:f.C.hash(plan),acknowledgeMemberAccess:true};
 const a=await f.C.applyRecovery(plan,f.port,opts);assert.equal(a.created,1);assert.equal(a.firestoreWrites,0);assert.equal(a.rootCatalogueWrites,0);assert.equal(a.sourceDeletes,0);assert.equal(a.tokenCreation,0);assert.equal(f.writes[0][1],'campaign-item-images/campaign/copy');assert.equal(f.writes[0][2].sha256,f.asset.sha256);assert.equal(f.objects.size,2);
 const b=await f.C.applyRecovery(plan,f.port,opts);assert.equal(b.created,0);assert.equal(b.alreadyPresent,1);assert.equal(f.writes.length,1);assert.equal(JSON.stringify({row:f.row,campaign:f.campaign,archives:f.archives}),before);
});
test('private, opted-out, direct-image and different-campaign records are excluded without asset reads',async()=>{
 for(const patch of [{visible:false},{visible:undefined},{archivedImage:{path:'private'}},{artwork:{status:'none'}},{imageUrl:'https://private.invalid/?token=SECRET'},{campaignId:'other'}]){const f=await fixture();Object.assign(f.row,patch);const plan=await f.C.prepareRecovery(f.options,f.port);assert.equal(plan.entries.length,0);assert.equal(f.reads.length,0);assert.doesNotMatch(JSON.stringify(f.C.summary(plan)),/SECRET|PRIVATE/);}
});
test('existing campaign artwork is never planned or overwritten',async()=>{
 const f=await fixture();f.objects.set(f.options.bucket+'/campaign-item-images/campaign/copy',{meta:{exists:true,generation:'999'}});assert.equal((await f.C.prepareRecovery(f.options,f.port)).entries.length,0);
 f.objects.delete(f.options.bucket+'/campaign-item-images/campaign/copy');const plan=await f.C.prepareRecovery(f.options,f.port);f.objects.set(f.options.bucket+'/campaign-item-images/campaign/copy',{meta:{exists:true,generation:'999',metadata:{}}});await assert.rejects(f.C.applyRecovery(plan,f.port,{confirmPlan:f.C.hash(plan),acknowledgeMemberAccess:true}),/never overwrite/);assert.equal(f.writes.length,0);
});
test('shared generated artwork stays authoritative; missing publication needs separate review',async()=>{
 for(const published of [true,false]){const f=await fixture();f.objects.set(f.options.bucket+'/dnd-item-images/retired-item.png',{meta:{exists:true}});f.port.readRegistry=async()=>published?{status:'generated',path:'dnd-item-images/retired-item.png'}:null;const plan=await f.C.prepareRecovery(f.options,f.port);assert.equal(plan.entries.length,0);assert.equal(plan.skipped[published?'sharedImageAvailable':'sharedPublicationRequiresReview'],1);}
});
test('foreign paths, mismatched source identities/checksums and unsafe archive metadata cannot become candidates',async()=>{
 for(const patch of [{privatePath:'private-item-library-images/other/a/b'},{sourcePath:'dnd-item-images/unrelated.png'},{sha256:'a'.repeat(64)},{bucket:'not/a/bucket'}]){const f=await fixture();Object.assign(f.asset,patch);const plan=await f.C.prepareRecovery(f.options,f.port);assert.equal(plan.entries.length,0);assert.equal(plan.skipped.archiveReferenceRequiresReview,1);assert.ok(!f.reads.some(r=>String(r[1]).includes('other/a/b')));}
 for(const patch of [{size:'0'},{size:String(5*1024*1024)},{contentType:'image/svg+xml'},{generation:'bad'},{metadata:{firebaseStorageDownloadTokens:'SECRET'}}]){const f=await fixture();Object.assign(f.objects.values().next().value.meta,patch);assert.equal((await f.C.prepareRecovery(f.options,f.port)).entries.length,0);}
});
test('missing objects and denied reads remain distinct; truncation and ambiguous artwork stop automatic selection',async()=>{
 const f=await fixture();f.objects.clear();let plan=await f.C.prepareRecovery(f.options,f.port);assert.equal(plan.skipped.archiveObjectMissing,1);f.port.objectMetadata=async()=>{throw Error('Synthetic metadata permission failure')};await assert.rejects(f.C.prepareRecovery(f.options,f.port),/permission/);
 const t=await fixture();t.port.findArchives=async()=>Array.from({length:21},()=>t.archives[0]);plan=await t.C.prepareRecovery(t.options,t.port);assert.equal(plan.skipped.archiveSearchMayBeTruncated,1);
 const a=await fixture(),other={...a.asset,sha256:'a'.repeat(64)};other.privatePath='private-item-library-images/owner/'+a.C.hash(other.sourcePath)+'/'+other.sha256;a.archives[0].assets.push(other);a.objects.set(other.bucket+'/'+other.privatePath,{meta:{exists:true,generation:'102',size:'100',contentType:'image/png'}});plan=await a.C.prepareRecovery(a.options,a.port);assert.equal(plan.skipped.ambiguousArchive,1);
});
test('explicit archive scopes, bucket limits and project boundaries are enforced',async()=>{
 const f=await fixture();const plan=await f.C.prepareRecovery({...f.options,archiveBucket:'different-archive'},f.port);assert.equal(plan.skipped.archiveReferenceRequiresReview,1);
 const wrong=await fixture();wrong.port.bucketProjectNumber=async()=> '456';await assert.rejects(wrong.C.prepareRecovery(wrong.options,wrong.port),/different project/);
 const many=await fixture();for(let i=1;i<=4;i++){const asset={...many.asset,bucket:'archive-'+i};many.archives[0].assets.push(asset);many.objects.set(asset.bucket+'/'+asset.privatePath,many.objects.values().next().value);}await assert.rejects(many.C.prepareRecovery(many.options,many.port),/four archive buckets/);
});
test('malformed scopes and publicly readable/inconclusive destination policies stop before asset reads',async()=>{
 for(const patch of [{project:'bad'},{bucket:'another-project.firebasestorage.app'},{campaignName:''},{itemName:''}]){const f=await fixture();await assert.rejects(f.C.prepareRecovery({...f.options,...patch},{}));assert.equal(f.writes.length,0);}
 for(const policy of [{private:false,uniform:false,projectNumber:'1'},{private:true,projectNumber:'1'},{private:true,uniform:true}]){const f=await fixture();f.port.destinationPolicy=async()=>policy;await assert.rejects(f.C.prepareRecovery(f.options,f.port),/privacy/);assert.equal(f.reads.length,0);}
 const f=await fixture();f.port.findCampaigns=async()=>[{...f.campaign,deletedAt:null}];await assert.rejects(f.C.prepareRecovery(f.options,f.port),/active campaign/);
});
test('changed item visibility/identity, campaign ownership, source generation and corrupt bytes stop before a create',async()=>{
 for(const change of [f=>f.row.visible=false,f=>f.row.version='2:1',f=>f.row.imageUrl='https://new.invalid/image',f=>f.campaign.ownerId='other',f=>f.campaign.deletedAt=1,f=>f.objects.values().next().value.meta.generation='101',f=>f.objects.values().next().value.bytes=Buffer.alloc(png.length)]){const f=await fixture(),plan=await f.C.prepareRecovery(f.options,f.port);change(f);await assert.rejects(f.C.applyRecovery(plan,f.port,{confirmPlan:f.C.hash(plan),acknowledgeMemberAccess:true}));assert.equal(f.writes.length,0);}
});
test('item changes while source bytes load are rechecked before create; public destination and tokens fail verification',async()=>{
 const f=await fixture(),plan=await f.C.prepareRecovery(f.options,f.port),read=f.port.readObject;f.port.readObject=async(...args)=>{f.row.visible=false;return read(...args)};await assert.rejects(f.C.applyRecovery(plan,f.port,{confirmPlan:f.C.hash(plan),acknowledgeMemberAccess:true}),/changed/);assert.equal(f.writes.length,0);
 const p=await fixture(),reviewed=await p.C.prepareRecovery(p.options,p.port);p.port.anonymousDenied=async()=>false;await assert.rejects(p.C.applyRecovery(reviewed,p.port,{confirmPlan:p.C.hash(reviewed),acknowledgeMemberAccess:true}),/privacy/);assert.equal(p.objects.size,2); // Source and attributable new copy remain; no silent deletes.
});
test('expired or forged destinations are rejected without calling Firebase',async()=>{
 const f=await fixture(),plan=await f.C.prepareRecovery(f.options,f.port);await assert.rejects(f.C.applyRecovery(plan,{}, {now:plan.expiresAt+1,confirmPlan:f.C.hash(plan),acknowledgeMemberAccess:true}));plan.entries[0].destination='dnd-item-images/retired-item.png';assert.throws(()=>f.C.validatePlan(plan));
});
test('private plan files are durable, outside checkouts and never contain original item prose',async()=>{
 const f=await fixture(),P=await import('../scripts/recover-campaign-item-images.mjs'),privateOutput=await import('../scripts/private-output.mjs'),base=path.join(os.tmpdir(),'campaign-image-private-'+f.C.hash(String(Math.random())));await privateOutput.createPrivateDirectory(base);
 try{const plan=await f.C.prepareRecovery(f.options,f.port),file=await P.savePrivatePlan(plan,{base}),loaded=await P.readPrivatePlan(file);assert.equal(f.C.hash(plan),f.C.hash(loaded));assert.doesNotMatch(await fs.readFile(file,'utf8'),/PRIVATE_STATS|PRIVATE_ITEM|PRIVATE_CAMPAIGN/);const inside=path.join(base,'checkout');await privateOutput.createPrivateDirectory(inside);await fs.mkdir(path.join(inside,'.git'));await fs.writeFile(path.join(inside,'.git','HEAD'),'ref: refs/heads/main');await assert.rejects(P.savePrivatePlan(plan,{base:inside}),/Git checkout/);await fs.rm(path.join(inside,'.git'),{recursive:true});await fs.writeFile(path.join(inside,'.git'),'gitdir: somewhere');await assert.rejects(P.savePrivatePlan(plan,{base:inside}),/Git checkout/);}
 finally{await fs.rm(base,{recursive:true,force:true});}
});
