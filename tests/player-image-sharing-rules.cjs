const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore'),storageSDK=require('firebase/storage');
const {createCampaignInformationStore}=require('../js/modules/campaign-information-store');
const {createCampaignWorkspaceStore}=require('../js/modules/campaign-workspace-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});
 try{
  await env.clearFirestore();await env.clearStorage();
  await env.withSecurityRulesDisabled(async c=>{
   for(const [path,data] of Object.entries({'campaigns/a':{ownerId:'owner'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'}}))await sdk.setDoc(sdk.doc(c.firestore(),path),data);
  });
  const dm=env.authenticatedContext('dm'),player=env.authenticatedContext('player'),db=dm.firestore(),auth={currentUser:{uid:'dm'}},workspace=createCampaignWorkspaceStore({...sdk,db,auth});
  for(const [kind,publication] of [['world','playerInformation'],['creature','playerNPCs'],['chapter','playerChapters']]){
   const store=createCampaignInformationStore({...sdk,db,auth},kind),id=kind+'-one',path=`campaign-journal-images/a/${kind}/${id}/first`,second=path.replace('/first','/second');
   const image={path,alt:'First illustration',caption:'First caption',uploadedBy:'dm',uploadedAt:1};
   const input={title:'Public title',summary:'Public summary',content:'Original player text',privateNotes:'SECRET PRIVATE NOTES',data:{category:kind==='creature'?'Story NPC':'Lore',status:'Completed',order:1,journalImage:image,hp:99,actions:'SECRET STAT BLOCK'}};
   let saved=await workspace.save({campaignId:'a',kind,id,revision:0,input});
   for(const name of [path,second])await storageSDK.uploadBytes(storageSDK.ref(dm.storage(),name),new Uint8Array([1,2,3]),{contentType:'image/png'});
   const read=(context,name=path)=>storageSDK.getBytes(storageSDK.ref(context.storage(),name));
   const params={campaignId:'a',id,sourceRevision:1,publishedRevision:0};
   await assert.rejects(store.shareImage(params),/Share the page first/);
   let published=await assertSucceeds(store.publish(params));
   assert.equal(published.image,undefined);await assertFails(read(player));
   published=await assertSucceeds(store.shareImage({...params,publishedRevision:1}));
   await assertSucceeds(read(player));await assertFails(read(player,second));
   for(const uid of ['outsider','revoked'])await assertFails(read(env.authenticatedContext(uid)));
   await assertFails(read(env.unauthenticatedContext()));
   const playerStore=createCampaignInformationStore({...sdk,db:player.firestore(),auth:{currentUser:{uid:'player'}}},kind);
   await assertFails(playerStore.shareImage({...params,publishedRevision:2}));
   const ref=sdk.doc(db,`campaigns/a/${publication}/${id}`),current=(await sdk.getDoc(ref)).data();
   await assertFails(sdk.setDoc(ref,{...current,image:{...current.image,path:'campaign-journal-images/b/world/foreign/picture'},revision:3}));
   await assertFails(sdk.setDoc(ref,{...current,image:{...current.image,caption:'not saved'},revision:3}));
   saved=await workspace.save({campaignId:'a',kind,id,revision:1,input:{...input,content:'New private draft text',data:{...input.data,journalImage:{...image,path:second,caption:'New caption'}}}});
   assert.equal((await store.load('a',id)).image.path,path);
   published=await store.shareImage({...params,sourceRevision:2,publishedRevision:2});
   assert.equal(published.content,'Original player text');assert.equal(published.image.path,second);
   assert.ok(!JSON.stringify(published).includes('SECRET'));
   await assertFails(read(player));await assertSucceeds(read(player,second));
   await assert.rejects(store.shareImage({...params,sourceRevision:2,publishedRevision:2}),/refresh/);
   published=await store.publish({...params,sourceRevision:2,publishedRevision:3});
   assert.equal(published.image.path,second);assert.equal(published.content,'New private draft text');
   published=await store.shareImage({...params,sourceRevision:2,publishedRevision:4,hide:true});
   assert.equal(published.image,undefined);assert.equal(published.content,'New private draft text');await assertFails(read(player,second));
   published=await store.shareImage({...params,sourceRevision:2,publishedRevision:5});
   // Direct source-image removal must not bypass the atomic unshare requirement.
   const sourceRef=sdk.doc(db,`campaigns/a/${{world:'worldEntries',creature:'creatures',chapter:'chapters'}[kind]}/${id}`);
   const source=(await sdk.getDoc(sourceRef)).data(),without={...source.data};delete without.journalImage;
   await assertFails(sdk.setDoc(sourceRef,{...source,data:without,revision:3}));
   saved=await workspace.save({campaignId:'a',kind,id,revision:2,input:{...input,data:without}});
   assert.equal((await store.load('a',id)).image,undefined);await assertFails(read(player,second));
   saved=await workspace.save({campaignId:'a',kind,id,revision:3,input});
   published=await store.load('a',id);
   published=await store.shareImage({...params,sourceRevision:4,publishedRevision:published.revision});
   await store.unpublish({campaignId:'a',id,publishedRevision:published.revision});
   await assertFails(read(player));
   published=await store.publish({...params,sourceRevision:4});assert.equal(published.image,undefined);
   console.log('PASS',kind,'independent image/text snapshots, exact Storage reads, stale writes, private fields, atomic removal and hide/reveal');
  }
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
