const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const ready=Promise.all([import('../scripts/item-catalogue-migration.mjs'),import('../scripts/item-catalogue-migration-firebase.mjs'),import('../scripts/archive-storage.mjs')]);
function storage(name,{uniform,projectNumber='123',pap='enforced'}={}){
 const objects=new Map(),events=[];let generation=1;
 const metadata={projectNumber,iamConfiguration:{uniformBucketLevelAccess:{enabled:uniform},publicAccessPrevention:pap}},policy={bindings:[]};
 const bucket={getMetadata:async()=>[metadata],iam:{getPolicy:async()=>[policy]},getFiles:async({prefix})=>[[...objects.keys()].filter(key=>key.startsWith(prefix)).map(key=>bucket.file(key))],file:(key,settings={})=>({name:key,exists:async()=>[objects.has(key)],getMetadata:async()=>{assert.ok(objects.has(key));return [structuredClone(objects.get(key).metadata)]},download:async()=>{const row=objects.get(key);assert.ok(row);if(settings.generation)assert.equal(settings.generation,row.metadata.generation);return [row.bytes]},save:async(bytes,options)=>{assert.equal(options.preconditionOpts.ifGenerationMatch,0);assert.equal(options.validation,'crc32c');assert.ok(!objects.has(key));events.push('save:'+key);objects.set(key,{bytes:Buffer.from(bytes),metadata:{...options.metadata,generation:String(generation++),metageneration:'1',size:String(bytes.length)}})},delete:async options=>{assert.equal(String(options.ifGenerationMatch),objects.get(key).metadata.generation);events.push('delete:'+key);objects.delete(key)}})};
 return {bucket,metadata,policy,objects,events};
}
async function fixture(){
 const [M,F]=await ready,source=storage('demo-source',{uniform:false}),archive=storage('demo-archive',{uniform:true}),directory=await fs.mkdtemp(path.join(os.tmpdir(),'separate-archive-'));
 for(const id of ['a','b'])source.objects.set('dnd-item-images/'+id+'.png',{bytes:Buffer.from(id),metadata:{generation:'1',metageneration:'1',contentType:'image/png',size:'1',metadata:{firebaseStorageDownloadTokens:'old-token'}}});
 const project='demo-vault-test',documents=['a','b'].map(id=>({name:`projects/${project}/databases/(default)/documents/items/${id}`,updateTime:'2026-10-16T10:00:00Z',fields:M.encodeFields({name:id,description:'Original',imageUrl:`https://storage.googleapis.com/demo-source/dnd-item-images/${id}.png`})}));
 const manifest={format:1,targetLibraryOwnerId:'owner',retireLegacyArtwork:true,artworkPolicy:{mode:'preserve-generated',origin:'ChatGPT-generated',evidence:'Synthetic instruction'},decisions:documents.map((doc,i)=>({id:i?'b':'a',sourceSha256:M.fieldsHash(doc.fields),action:i?'retire':'publish',approved:true,reviewedBy:'Synthetic owner',reviewedAt:'2026-10-16T12:00:00Z',...i?{}:{replacement:{name:'Original',description:'New text'},rights:{license:'ORIGINAL',attribution:'Author',evidence:'Synthetic'}}}))};
 const plan=M.buildMigrationPlan({project,collection:'items',documents},manifest,{project,libraryOwnerId:'owner',storage:{sourceBucket:'demo-source',archiveBucket:'demo-archive'}}),heads=[];
 let status=403;
 const port=await F.createMigrationPort({project,bucket:'demo-source',archiveBucket:'demo-archive',backupDirectory:path.join(directory,'backup'),services:{bucket:source.bucket,archiveBucket:archive.bucket,firestoreOrigin:'http://127.0.0.1:8080',credential:{},fetcher:async(url,options)=>{assert.equal(options.method,'HEAD');assert.equal(options.headers,undefined);heads.push(url);return {status}}}});
 return {M,source,archive,plan,port,heads,setStatus:n=>status=n,cleanup:()=>fs.rm(directory,{recursive:true,force:true})};
}
test('fine-grained source remains unchanged while archive bytes, token removal and bucket references verify before retirement',async()=>{
 const h=await fixture();try{
 const assets=await h.port.inspectArtwork(h.plan);assert.equal(assets.length,2);assert.deepEqual(h.source.events,[]);assert.deepEqual(h.archive.events,[]);
 await assert.rejects(h.port.copyAndVerifyArtwork(h.plan,assets),/backup/);
 await h.port.backup(h.plan,assets);await h.port.copyAndVerifyArtwork(h.plan,assets);
 assert.equal(h.archive.objects.size,2);assert.equal(h.source.objects.size,2);assert.ok(h.heads.every(url=>url.startsWith('https://storage.googleapis.com/demo-archive/')));
 for(const item of h.plan.items){const subset=await h.port.assetsForItem(item,assets),docs=h.M.privateDocuments(h.plan,item,subset);assert.equal(docs.copy.archivedImage.mapValue.fields.bucket.stringValue,'demo-archive');assert.equal(docs.archive.assets.arrayValue.values[0].mapValue.fields.bucket.stringValue,'demo-archive');}
 await h.port.retireArtwork(h.plan,assets);assert.ok(h.source.objects.has('dnd-item-images/a.png'));assert.ok(!h.source.objects.has('dnd-item-images/b.png'));assert.equal(h.source.metadata.iamConfiguration.uniformBucketLevelAccess.enabled,false);assert.equal(h.archive.objects.size,2);
 }finally{await h.cleanup()}
});
test('mismatched destination, project, missing PAP or public IAM stops without writes',async()=>{
 const h=await fixture();try{
 await assert.rejects(h.port.inspectArtwork({...h.plan,storage:{sourceBucket:'demo-source',archiveBucket:'wrong-bucket'}}),/pinned/);
 h.archive.metadata.projectNumber='999';await assert.rejects(h.port.inspectArtwork(h.plan),/source project/);h.archive.metadata.projectNumber='123';
 h.archive.metadata.iamConfiguration.publicAccessPrevention='inherited';await assert.rejects(h.port.inspectArtwork(h.plan),/prevention/);h.archive.metadata.iamConfiguration.publicAccessPrevention='enforced';
 h.archive.policy.bindings=[{members:['allUsers']}];await assert.rejects(h.port.inspectArtwork(h.plan),/public/);
 assert.deepEqual(h.source.events,[]);assert.deepEqual(h.archive.events,[]);
 const changed=structuredClone(h.plan);changed.storage.archiveBucket='other-private';assert.throws(()=>h.M.assertPlan(changed),/digest/);
 }finally{await h.cleanup()}
});
test('changed private bytes, tokens, anonymous access and changed source generation prevent deletion',async()=>{
 for(const failure of ['bytes','token','public','missing','generation']){
 const h=await fixture();try{
 const assets=await h.port.inspectArtwork(h.plan);await h.port.backup(h.plan,assets);await h.port.copyAndVerifyArtwork(h.plan,assets);
 const row=h.archive.objects.get(assets[0].privatePath);
 if(failure==='bytes')row.bytes=Buffer.from('changed');if(failure==='token')row.metadata.metadata.firebaseStorageDownloadTokens='must-stop';if(failure==='public')h.setStatus(200);if(failure==='missing')h.setStatus(404);if(failure==='generation')h.source.objects.get('dnd-item-images/b.png').metadata.generation='999';
 await assert.rejects(h.port.retireArtwork(h.plan,assets));assert.equal(h.source.objects.size,2);
 }finally{await h.cleanup()}
 }
});
test('only the exact zero-byte root folder marker is skipped and left untouched during retirement',async()=>{
 const h=await fixture();try{
 h.source.objects.set('dnd-item-images/',{bytes:Buffer.alloc(0),metadata:{size:'0',generation:'9',contentType:'application/x-www-form-urlencoded;charset=UTF-8'}});
 const assets=await h.port.inspectArtwork(h.plan);assert.equal(assets.length,2);assert.ok(assets.every(asset=>asset.sourcePath!=='dnd-item-images/'));
 await h.port.backup(h.plan,assets);await h.port.copyAndVerifyArtwork(h.plan,assets);await h.port.retireArtwork(h.plan,assets);
 assert.ok(h.source.objects.has('dnd-item-images/'));assert.ok(!h.source.events.includes('delete:dnd-item-images/'));assert.equal(h.archive.objects.size,2);
 }finally{await h.cleanup()}
});
test('nonempty markers and other unexpected objects still block; a changed marker prevents retirement',async()=>{
 for(const name of ['dnd-item-images/','dnd-item-images/other']){
 const h=await fixture();try{
 h.source.objects.set(name,{bytes:Buffer.from('x'),metadata:{size:name.endsWith('/')?'1':'0',contentType:'application/x-www-form-urlencoded;charset=UTF-8'}});
 await assert.rejects(h.port.inspectArtwork(h.plan),/Unexpected legacy object type/);assert.deepEqual(h.source.events,[]);
 }finally{await h.cleanup()}
 }
 const h=await fixture();try{
 const assets=await h.port.inspectArtwork(h.plan);await h.port.backup(h.plan,assets);await h.port.copyAndVerifyArtwork(h.plan,assets);
 h.source.objects.set('dnd-item-images/',{bytes:Buffer.from('x'),metadata:{size:'1'}});
 await assert.rejects(h.port.retireArtwork(h.plan,assets),/folder marker changed/);assert.equal(h.source.objects.size,3);assert.deepEqual(h.source.events,[]);
 }finally{await h.cleanup()}
});
