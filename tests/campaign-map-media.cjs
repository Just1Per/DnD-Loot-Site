'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCampaignMapMedia}=require('../js/modules/campaign-map-media');
function fixture() {
 const docs=new Map(),sdk={db:{},auth:{currentUser:{uid:'dm'}},doc:(_,...parts)=>parts.join('/'),ref:(_,p)=>p};
 sdk.getDoc=async path=>({exists:()=>docs.has(path),data:()=>structuredClone(docs.get(path))});
 sdk.runTransaction=async(_,work)=>{const writes=[],result=await work({get:sdk.getDoc,set:(p,d)=>writes.push([p,structuredClone(d)])});for(const [p,d] of writes)docs.set(p,d);return result;};
 sdk.getBlob=async()=>{throw Error('Unexpected original download');};
 return {sdk,docs,media:createCampaignMapMedia(sdk)};
}
test('Map image scopes distinguish main, named maps and identical pin IDs without accepting cross-campaign or nested paths',async()=>{
 const {media}=fixture();
 for(const mapId of ['main','north'])for(const kind of ['campaign-maps','campaign-map-place-images']){
  const path=kind+'/a/'+(mapId==='main'?'':mapId+'/')+(kind.includes('place')?'town/':'')+'image';
  assert.equal(media.scope('a',mapId,path).kind,kind.includes('place')?'place':'map');
  for(const [cid,mid,p] of [['b',mapId,path],['a',mapId==='main'?'north':'main',path],['a',mapId,path+'/extra'],['a',mapId,'https://example.test/image']])assert.throws(()=>media.scope(cid,mid,p),/image|belong/);
 }
 assert.notEqual((await media.reference('a','north','campaign-map-place-images/a/north/town/image')).ref,(await media.reference('a','south','campaign-map-place-images/a/south/town/image')).ref);
});
test('Chunked map originals are byte-for-byte identical across the chunk boundary and idempotent after completion',async()=>{
 const {media,sdk,docs}=fixture(),path='campaign-maps/a/original',bytes=Uint8Array.from({length:media.partSize+17},(_,i)=>i%251),blob=new Blob([bytes],{type:'image/png'});
 await media.ensure({campaignId:'a',path,blob});
 const bound=await media.reference('a','main',path),copy=docs.get(bound.ref);assert.equal(copy.parts,2);assert.equal(copy.ready,true);
 const original=await media.load({campaignId:'a',path});assert.deepEqual(new Uint8Array(await original.arrayBuffer()),bytes);assert.equal(original.type,'image/png');
 sdk.runTransaction=async()=>{throw Error('A ready copy should not be rewritten');};await media.ensure({campaignId:'a',path});
 await assert.rejects(media.load({campaignId:'a',path,limit:512*1024}),/invalid/);
 docs.get(bound.chunk(1)).data=btoa('bad');await assert.rejects(media.load({campaignId:'a',path}),/damaged/);
});
test('Interrupted repairs stay incomplete, resume safely and never finalize after account or campaign changes',async()=>{
 const {media,sdk,docs}=fixture(),path='campaign-maps/a/original',blob=new Blob([new Uint8Array(media.partSize*7)],{type:'image/png'});
 let current=true;
 await assert.rejects(media.ensure({campaignId:'a',path,blob,isCurrent:()=>current,onProgress:()=>{current=false;}}),/access changed/);
 const bound=await media.reference('a','main',path);assert.equal(docs.get(bound.ref).ready,false);await assert.rejects(media.load({campaignId:'a',path}),/finish Repair/);
 current=true;await media.ensure({campaignId:'a',path,blob});assert.equal((await media.load({campaignId:'a',path})).size,blob.size);
 const get=sdk.getDoc;sdk.getDoc=async p=>{const result=await get(p);sdk.auth.currentUser={uid:'other'};return result;};await assert.rejects(media.load({campaignId:'a',path}),/access changed/);
});
test('Missing, invalid, truncated and checksum-mismatched copies fail explicitly without Storage token fallback',async()=>{
 const {media,docs}=fixture(),path='campaign-maps/a/image';await assert.rejects(media.load({campaignId:'a',path}),/Repair image access/);
 const blob=new Blob(['original bytes'],{type:'image/webp'});await media.ensure({campaignId:'a',path,blob});const bound=await media.reference('a','main',path);
 docs.get(bound.chunk(0)).data=btoa('different data');await assert.rejects(media.load({campaignId:'a',path}),/checksum/);
 docs.delete(bound.chunk(0));await assert.rejects(media.load({campaignId:'a',path}),/incomplete/);
 for(const bad of [new Blob([],{type:'image/png'}),new Blob(['x'],{type:'text/plain'}),new Blob([new Uint8Array(5*1024*1024)],{type:'image/png'})])await assert.rejects(media.ensure({campaignId:'a',path:'campaign-map-place-images/a/town/bad',blob:bad}),/size limit/);
});

test('Legacy binary image headers recover missing, octet-stream and nonstandard MIME metadata without changing bytes or originals',async()=>{
 for(const [bytes,type]of [[new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]),'image/png'],[new Uint8Array([255,216,255,224,0,16]),'image/jpeg'],new Uint8Array([82,73,70,70,4,0,0,0,87,69,66,80])].map(row=>Array.isArray(row)?row:[row,'image/webp']))for(const declared of ['','application/octet-stream','image/jpg']){
  const {media,sdk}=fixture(),path='campaign-map-place-images/a/town/legacy',original=new Blob([bytes],{type:declared});sdk.getBlob=async()=>original;await media.ensure({campaignId:'a',path});const repaired=await media.load({campaignId:'a',path});assert.equal(repaired.type,type);assert.deepEqual(new Uint8Array(await repaired.arrayBuffer()),bytes);assert.equal(original.type,declared,'original metadata is never rewritten');
 }
});
test('Unsupported legacy pictures report actual type/size while keeping private byte and authentication bounds',async()=>{
 const {media,sdk,docs}=fixture();for(const blob of [new Blob(['<svg/>'],{type:'image/svg+xml'}),new Blob(['not a supported image'],{type:'application/octet-stream'})]){await assert.rejects(media.normalizeImageBlob(blob,{place:true}),error=>/Unsupported image type/.test(error.message)&&error.message.includes(blob.type)&&error.message.includes(blob.size+' bytes'));}assert.equal(docs.size,0);
 const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:''});const slice=png.slice.bind(png);png.slice=(...args)=>{sdk.auth.currentUser={uid:'other'};return slice(...args);};await assert.rejects(media.ensure({campaignId:'a',path:'campaign-maps/a/context',blob:png}),/access changed/);assert.equal(docs.size,0);
});

test('Repair verifies healthy copies without uploading and creates missing copies without replacing originals',async()=>{
 const {media,sdk,docs}=fixture(),path='campaign-maps/a/healthy',blob=new Blob(['valid image bytes'],{type:'image/png'});await media.ensure({campaignId:'a',path,blob});sdk.uploadBytes=async()=>{throw Error('Healthy copies must not be uploaded');};assert.equal((await media.repair({campaignId:'a',path})).status,'verified');
 sdk.getBlob=async()=>blob;const missing='campaign-map-place-images/a/town/missing';const result=await media.repair({campaignId:'a',path:missing});assert.deepEqual(result,{path:missing,status:'repaired',size:blob.size,publishRequired:false});assert.equal((await media.load({campaignId:'a',path:missing})).size,blob.size);
});
test('Repair rebuilds finalized missing/corrupt chunks or invalid manifests under a fresh scoped path',async()=>{
 for(const damage of ['missing','bad-chunk','metadata']){const {media,sdk,docs}=fixture(),path='campaign-map-place-images/a/town/broken',blob=new Blob(['original protected image'],{type:'image/png'}),uploads=[];await media.ensure({campaignId:'a',path,blob});const bound=await media.reference('a','main',path);if(damage==='missing')docs.delete(bound.chunk(0));else if(damage==='bad-chunk')docs.get(bound.chunk(0)).data=btoa('bad');else docs.get(bound.ref).contentType='application/octet-stream';const old=structuredClone([...docs]);sdk.getBlob=async original=>{assert.equal(original,path);return blob;};sdk.uploadBytes=async(p,b)=>{uploads.push(p);assert.equal(b.size,blob.size);};const repaired=await media.repair({campaignId:'a',path});assert.equal(repaired.status,'rebuilt');assert.equal(repaired.publishRequired,true);assert.notEqual(repaired.path,path);assert.ok(repaired.path.startsWith('campaign-map-place-images/a/town/'));assert.equal(uploads.length,1);assert.equal((await media.load({campaignId:'a',path:repaired.path})).size,blob.size);for(const [p,data]of old)assert.deepEqual(docs.get(p),data,'Finalized originals and old chunks remain immutable');}
});
test('Repair fails closed on denied/context changes, identifies unreadable originals and preserves old images',async()=>{
 const {media,sdk,docs}=fixture(),path='campaign-maps/a/broken';let uploads=0;sdk.uploadBytes=async()=>uploads++;sdk.getDoc=async()=>{throw Object.assign(Error('Denied'),{code:'permission-denied'});};await assert.rejects(media.repair({campaignId:'a',path}),error=>error.code==='permission-denied');assert.equal(uploads,0);
 sdk.getDoc=async()=>({exists:()=>false});sdk.getBlob=async()=>{throw Object.assign(Error('Gone'),{code:'storage/object-not-found'});};await assert.rejects(media.repair({campaignId:'a',path}),/original file could not be read.*storage\/object-not-found/);assert.equal(docs.size,0);
 sdk.getBlob=async()=>{sdk.auth.currentUser={uid:'other'};return new Blob(['original'],{type:'image/png'});};await assert.rejects(media.repair({campaignId:'a',path}),/access changed/);assert.equal(uploads,0);
});

test('Optional image decoding never reports malformed finalized bytes as healthy',async()=>{
 const {media,sdk}=fixture(),path='campaign-maps/a/undecodable',bad=new Blob(['bad'],{type:'image/png'}),good=new Blob(['good'],{type:'image/png'});await media.ensure({campaignId:'a',path,blob:bad});sdk.getBlob=async()=>good;sdk.uploadBytes=async()=>{};const validateImage=async blob=>{if(await blob.text()==='bad')throw Error('Decoder rejected image');};const result=await media.repair({campaignId:'a',path,validateImage});assert.equal(result.status,'rebuilt');assert.equal(await (await media.load({campaignId:'a',path:result.path})).text(),'good');
 sdk.getBlob=async()=>bad;await assert.rejects(media.repair({campaignId:'a',path,validateImage}),error=>error.code==='map-media/decode');
});
test('Late campaign changes during a rebuilt upload never create a protected replacement or rewrite originals',async()=>{
 const {media,sdk,docs}=fixture(),path='campaign-maps/a/context',blob=new Blob(['bytes'],{type:'image/png'});await media.ensure({campaignId:'a',path,blob});const bound=await media.reference('a','main',path);docs.delete(bound.chunk(0));const before=structuredClone([...docs]);let current=true;sdk.getBlob=async()=>blob;sdk.uploadBytes=async()=>{current=false;};await assert.rejects(media.repair({campaignId:'a',path,isCurrent:()=>current}),/access changed/);assert.deepEqual([...docs],before);
});
