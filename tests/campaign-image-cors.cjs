const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {prepare,BUCKET}=require('../scripts/prepare-campaign-image-cors.cjs');
const desired=require('../scripts/campaign-image-cors.json');
test('empty CORS gets production Hosting and the exact PR 100 preview GET origins',()=>{
 const result=prepare({name:BUCKET,cors_config:null},desired);
 assert.deepEqual(result,desired);assert.equal(result[0].method.join(','),'GET');
 assert.deepEqual(result[0].origin,['https://dnd-loot-site.firebaseapp.com','https://dnd-loot-site.web.app','https://dnd-loot-site--pr100-fix-campaign-cover-r-rwzl3lvf.web.app']);
});
test('existing write/read entries and response headers are preserved without mutation',()=>{
 const existing=[{origin:['https://other.example'],method:['PUT'],responseHeader:['Content-Type'],maxAgeSeconds:30},{origin:[desired[0].origin[0]],method:['GET'],responseHeader:['Content-Length']}];
 const bucket={name:BUCKET,cors:structuredClone(existing)},result=prepare(bucket,desired);
 assert.deepEqual(result.slice(0,2),existing);assert.deepEqual(bucket.cors,existing);assert.deepEqual(result[2].origin,desired[0].origin.slice(1));
});
test('repeating preparation or existing wildcard GET does not duplicate grants',()=>{
 assert.deepEqual(prepare({name:BUCKET,cors_config:desired},desired),desired);
 const existing=[{origin:['*'],method:['GET'],maxAgeSeconds:30}];assert.deepEqual(prepare({name:BUCKET,cors:existing},desired),existing);
});
test('null, wrong buckets, unknown CORS shapes and conflicting aliases are rejected',()=>{
 for(const bucket of [null,{}, {name:'another-bucket'},{name:BUCKET,cors:{}},{name:BUCKET,cors:[],cors_config:desired},{name:BUCKET,other_cors:desired}])assert.throws(()=>prepare(bucket,desired));
 assert.deepEqual(prepare({storage_url:'gs://'+BUCKET+'/'},desired),desired);
});
test('additions cannot grant write methods, wildcard origins or untrusted URL forms',()=>{
 for(const entry of [{origin:['*'],method:['GET']},{origin:['https://site.example'],method:['PUT']},{origin:['https://site.example/path'],method:['GET']},{origin:['https://name:secret@site.example'],method:['GET']}])assert.throws(()=>prepare({name:BUCKET},[entry]));
});
test('CLI prepares a reviewed local file and refuses to overwrite an existing output',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dnd-cors-test-'));
 try{
  const backup=path.join(dir,'before.json'),output=path.join(dir,'after.json');fs.writeFileSync(backup,JSON.stringify({name:BUCKET,cors_config:null}));
  const args=[path.join(__dirname,'../scripts/prepare-campaign-image-cors.cjs'),backup,path.join(__dirname,'../scripts/campaign-image-cors.json'),output];
  const first=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(first.status,0,first.stderr);assert.deepEqual(JSON.parse(fs.readFileSync(output,'utf8')),desired);
  const second=spawnSync(process.execPath,args,{encoding:'utf8'});assert.notEqual(second.status,0);assert.deepEqual(JSON.parse(fs.readFileSync(output,'utf8')),desired);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
