'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCampaignMapMedia}=require('../js/modules/campaign-map-media'),{createCampaignMapStore}=require('../js/modules/campaign-map-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(process.env.MAP_RULES_FILE||'firestore.rules','utf8')}});
 let count=0;const check=async(name,work)=>{await work();console.log('PASS',name);count++;};
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{for(const [p,d] of Object.entries({
   'campaigns/a':{ownerId:'owner'},'campaigns/b':{ownerId:'outsider'},'users/admin':{role:['admin']},
   'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'}
  }))await sdk.setDoc(sdk.doc(c.firestore(),p),d);});
  const contexts=Object.fromEntries(['owner','dm','player','outsider','revoked','admin'].map(uid=>[uid,env.authenticatedContext(uid)]));contexts.anonymous=env.unauthenticatedContext();
  const deps=uid=>({...sdk,db:contexts[uid].firestore(),auth:{currentUser:uid==='anonymous'?null:{uid}},getBlob:async()=>{throw Error('Published reader must not use Storage');}});
  const media=Object.fromEntries(Object.keys(contexts).map(uid=>[uid,createCampaignMapMedia(deps(uid))]));
  const map=(uid,mapId='main')=>createCampaignMapStore(deps(uid),{mapId});
  const original='campaign-maps/a/original',overview='campaign-maps/a/overview',picture='campaign-map-place-images/a/town/original',secret='campaign-map-place-images/a/secret/original';
  const blob=new Blob([new Uint8Array(3*1024*1024+17).fill(71)],{type:'image/png'}),small=new Blob(['map image bytes'],{type:'image/webp'});
  const ref=async(uid,path,mapId='main')=>media[uid].reference('a',mapId,path);
  const prepare=async(path,mapId='main',bytes=small)=>media.dm.ensure({campaignId:'a',mapId,path,blob:bytes});
  const canLoad=async(uid,path,mapId='main')=>media[uid].load({campaignId:'a',mapId,path});
  const pin={id:'town',name:'Town',description:'Shared town',type:'City',x:30,y:40,revealed:true,picturePath:picture,pictureAlt:'Town picture',worldEntryId:''};
  await check('Owner and active DM prepare bounded private copies; pending copies and chunks stay private',async()=>{
   await prepare(original,'main',blob);for(const path of [overview,picture,secret])await prepare(path);
   const bound=await ref('dm',original);assert.equal((await canLoad('dm',original)).size,blob.size);
   for(const uid of ['player','outsider','revoked','admin','anonymous']){await assertFails(sdk.getDoc((await ref(uid,original)).ref));await assertFails(sdk.getDoc((await ref(uid,original)).chunk(0)));}
   await assertSucceeds(sdk.getDoc((await ref('owner',original)).ref));await assertFails(sdk.getDocs(sdk.collection(contexts.player.firestore(),'campaigns/a/campaignMapMedia/main/assets')));
   for(const uid of ['player','outsider','revoked','admin'])await assertFails(media[uid].ensure({campaignId:'a',path:'campaign-maps/a/'+uid,blob:small}));
   assert.equal((await sdk.getDoc(bound.ref)).data().parts,7);
  });
  let publication;
  await check('Published originals, overviews and exact pin pictures load without Storage, even when Storage always denies the player',async()=>{
   const draft=await map('dm').saveDraft({campaignId:'a',input:{title:'Coast',imagePath:original,previewPath:overview,pins:[pin,{...pin,id:'secret',revealed:false,picturePath:secret}]},revision:0,sourceRevision:0});
   publication=await map('dm').publish({campaignId:'a',draftRevision:draft.revision});
   assert.deepEqual(new Uint8Array(await (await canLoad('player',original)).arrayBuffer()),new Uint8Array(await blob.arrayBuffer()));
   for(const path of [overview,picture])assert.equal((await canLoad('player',path)).size,small.size);
   await assertFails(sdk.getDoc((await ref('player',secret)).ref));await assertFails(sdk.getDoc((await ref('player',secret)).chunk(0)));
   for(const uid of ['outsider','revoked','admin','anonymous'])for(const path of [original,picture])await assertFails(sdk.getDoc((await ref(uid,path)).ref));
  });
  await check('Rules bound schema, MIME, size, chunk count, base64 length, scope and immutable finalized copies',async()=>{
   const bound=await ref('dm',original),copy=(await sdk.getDoc(bound.ref)).data(),db=contexts.dm.firestore();
   for(const change of [{path:'campaign-maps/b/original'},{kind:'place'},{pinId:'town'},{contentType:'text/plain'},{size:0},{size:50*1024*1024+1},{parts:101},{parts:1},{sha256:'bad'},{privateNotes:'SECRET'}]){
    await assertFails(sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMapMedia/main/assets/'+'a'.repeat(64)),{...copy,ready:false,...change}));
   }
   await assertFails(sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMapMedia/main/assets/'+'b'.repeat(64)),copy));
   await assertFails(sdk.updateDoc(bound.ref,{ready:false}));await assertFails(sdk.updateDoc(bound.ref,{sha256:'c'.repeat(64)}));
   const chunk=(await sdk.getDoc(bound.chunk(0))).data();await assertSucceeds(sdk.setDoc(bound.chunk(0),chunk));await assertFails(sdk.setDoc(bound.chunk(0),{data:'AAAA'}));await assertFails(sdk.deleteDoc(bound.chunk(0)));await assertFails(sdk.deleteDoc(bound.ref));
   const pending=sdk.doc(db,'campaigns/a/campaignMapMedia/main/assets/'+'c'.repeat(64));await sdk.setDoc(pending,{...copy,parts:1,size:1,ready:false});
   for(const [key,data] of [['1',{data:'YQ=='}],['00',{data:'YQ=='}],['0',{data:'YWE='}],['0',{data:'%%%='}],['0',{data:'YQ==',privateNotes:'SECRET'}]])await assertFails(sdk.setDoc(sdk.doc(pending,'mapImageChunks',key),data));
   await assertSucceeds(sdk.setDoc(sdk.doc(pending,'mapImageChunks','0'),{data:'YQ=='}));
   const max=sdk.doc(db,'campaigns/a/campaignMapMedia/main/assets/'+'d'.repeat(64));await assertSucceeds(sdk.setDoc(max,{...copy,size:50*1024*1024,parts:100,ready:false}));
   const finalChunk={data:Buffer.alloc(512*1024).toString('base64')};await assertSucceeds(sdk.setDoc(sdk.doc(max,'mapImageChunks','99'),finalChunk));await assertFails(sdk.setDoc(sdk.doc(max,'mapImageChunks','100'),finalChunk));
   const previewCopy=(await sdk.getDoc((await ref('dm',overview)).ref)).data();await assertFails(sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMapMedia/main/assets/'+'e'.repeat(64)),{...previewCopy,kind:'place',pinId:'town',path:picture,size:5*1024*1024,parts:10,ready:false}));
  });
  await check('Named maps and identical pin IDs remain isolated; a private second map cannot expose its media',async()=>{
   for(const mid of ['north','south']){
    const imagePath='campaign-maps/a/'+mid+'/original',picturePath='campaign-map-place-images/a/'+mid+'/town/original';await prepare(imagePath,mid);await prepare(picturePath,mid);
    const draft=await map('dm',mid).saveDraft({campaignId:'a',input:{title:mid,imagePath,pins:[{...pin,picturePath}]},revision:0,sourceRevision:0});if(mid==='north')await map('dm',mid).publish({campaignId:'a',draftRevision:draft.revision});
   }
   await assertSucceeds(canLoad('player','campaign-maps/a/north/original','north'));await assertSucceeds(canLoad('player','campaign-map-place-images/a/north/town/original','north'));
   for(const path of ['campaign-maps/a/south/original','campaign-map-place-images/a/south/town/original'])await assertFails(sdk.getDoc((await ref('player',path,'south')).ref));
   const db=contexts.dm.firestore(),source=(await sdk.getDoc((await ref('dm','campaign-maps/a/north/original','north')).ref)).data();await assertFails(sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMapMedia/south/assets/'+'f'.repeat(64)),{...source,ready:false}));
  });
  await check('Legacy published pin pictures use their image binding without requiring a v2 revision; stale/foreign/private media stay denied',async()=>{
   const mid='legacy',imagePath='campaign-maps/a/legacy/original',picturePath='campaign-map-place-images/a/legacy/town/original';await prepare(imagePath,mid);await prepare(picturePath,mid);
   await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMaps/'+mid),{title:'Old map',imagePath,revision:3,updatedBy:'dm',updatedAt:1});await sdk.setDoc(sdk.doc(db,'campaigns/a/campaignMaps/'+mid+'/pins/town'),{name:'Old town',description:'Published town',imagePath,picturePath,x:20,y:30,type:'City',revision:1,updatedBy:'dm',updatedAt:1});});
   await assertSucceeds(canLoad('player',imagePath,mid));await assertSucceeds(canLoad('player',picturePath,mid));await assertSucceeds(sdk.getDoc((await ref('player',picturePath,mid)).chunk(0)));
   for(const uid of ['outsider','revoked','admin','anonymous'])await assertFails(sdk.getDoc((await ref(uid,picturePath,mid)).ref));
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/campaignMaps/'+mid+'/pins/town'),{imagePath:'campaign-maps/a/legacy/old-background'}));await assertFails(sdk.getDoc((await ref('player',picturePath,mid)).ref));await assertFails(sdk.getDoc((await ref('player',picturePath,mid)).chunk(0)));
  });
  await check('A finalized damaged pin copy rebuilds privately and becomes player-readable only after explicit publication',async()=>{
   const mid='north',path='campaign-map-place-images/a/north/town/original',old=await ref('dm',path,mid);await env.withSecurityRulesDisabled(c=>sdk.deleteDoc(sdk.doc(c.firestore(),old.chunk(0).path)));
   await assert.rejects(canLoad('player',path,mid),{code:'map-media/invalid'});
   const uploads=[],repairer=createCampaignMapMedia({...deps('dm'),storage:{},ref:(_storage,path)=>path,getBlob:async source=>{assert.equal(source,path);return small;},uploadBytes:async(target,bytes)=>uploads.push({target,bytes})});
   const result=await repairer.repair({campaignId:'a',mapId:mid,path});assert.equal(result.status,'rebuilt');assert.equal(uploads.length,1);assert.equal(uploads[0].target,result.path);assert.equal((await sdk.getDoc(old.chunk(0))).exists(),false);
   const replacement=await ref('player',result.path,mid);await assertFails(sdk.getDoc(replacement.ref));await assertFails(sdk.getDoc(replacement.chunk(0)));
   const source=map('dm',mid),draft=await source.loadDraft('a'),saved=await source.saveDraft({campaignId:'a',input:{...draft,pins:draft.pins.map(p=>({...p,picturePath:result.path}))},revision:draft.revision,sourceRevision:draft.sourceRevision});
   await assertFails(sdk.getDoc(replacement.ref));await source.publish({campaignId:'a',draftRevision:saved.revision});assert.equal((await canLoad('player',result.path,mid)).size,small.size);await assertFails(sdk.getDoc((await ref('player',path,mid)).ref));await assertFails(sdk.getDoc((await ref('player',path,mid)).chunk(0)));
  });
  await check('Replacement and hidden/removed pins immediately deny old metadata and direct chunk reads',async()=>{
   const replacement='campaign-maps/a/replacement';await prepare(replacement);
   const draft=await map('dm').saveDraft({campaignId:'a',input:{...publication.draft,imagePath:replacement,previewPath:'',pins:[{...pin,revealed:false}]},revision:publication.draft.revision,sourceRevision:publication.draft.sourceRevision});await map('dm').publish({campaignId:'a',draftRevision:draft.revision});
   for(const path of [original,overview,picture]){const bound=await ref('player',path);await assertFails(sdk.getDoc(bound.ref));await assertFails(sdk.getDoc(bound.chunk(0)));await assertSucceeds(canLoad('dm',path));}
   await assertSucceeds(canLoad('player',replacement));
  });
  await check('Membership revocation and campaign deletion deny every copy and chunk for players, DMs and owner',async()=>{
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/members/player'),{status:'inactive'}));
   for(const mid of ['main','north']){const path='campaign-maps/a/'+(mid==='main'?'replacement':'north/original'),bound=await ref('player',path,mid);await assertFails(sdk.getDoc(bound.ref));await assertFails(sdk.getDoc(bound.chunk(0)));}
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a'),{deletedAt:Date.now(),deletedBy:'owner'}));
   for(const uid of ['owner','dm','player']){const bound=await ref(uid,original);await assertFails(sdk.getDoc(bound.ref));await assertFails(sdk.getDoc(bound.chunk(0)));await assertFails(media[uid].ensure({campaignId:'a',path:'campaign-maps/a/new',blob:small}));}
  });
  console.log('SUCCESS',count,'map image permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
