const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore'),storage=require('firebase/storage');
const {createCampaignDeletionStore}=require('../js/modules/campaign-deletion-store');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});let count=0;const check=async(name,work)=>{await work();count++;console.log('PASS',name)};
try{
 await env.clearFirestore();await env.clearStorage();
 await env.withSecurityRulesDisabled(async c=>{for(const [path,data] of Object.entries({
  'users/owner':{role:['dm']},'users/guestdm':{role:['dm']},'users/admin':{role:['admin']},'users/player':{role:['player']},
  'campaigns/a':{name:'Storm Coast',ownerId:'owner',dmId:'owner'},'campaigns/b':{name:'Other campaign',ownerId:'other',dmId:'other'},
  'campaigns/a/members/player':{uid:'player',role:'player',status:'active'},'campaigns/a/members/guestdm':{uid:'guestdm',role:'dm',status:'active'},
  'campaigns/a/items/item':{name:'Campaign item',visible:true},'campaigns/a/playerInformation/post':{title:'Shared post',content:'Public content'},
  'campaigns/a/workspaceSecrets/world-post':{notes:'Secret'},'campaigns/a/characters/sheet':{name:'Character',userId:'player'},
  'campaigns/a/campaignMaps/main':{title:'Map',imagePath:'campaign-maps/a/image',revision:1},
  'users/player/campaigns/a':{role:'player',status:'active'}
 }))await sdk.setDoc(sdk.doc(c.firestore(),path),data);});
 const contexts=Object.fromEntries(['owner','guestdm','admin','player','other'].map(uid=>[uid,env.authenticatedContext(uid)]));
 const stores=Object.fromEntries(Object.entries(contexts).map(([uid,c])=>[uid,createCampaignDeletionStore({...sdk,db:c.firestore(),auth:{currentUser:{uid}}})]));
 const ref=(uid,path)=>sdk.doc(contexts[uid].firestore(),path);
 await check('Only admins can list every campaign; members retain their normal root get',async()=>{assert.equal((await stores.admin.list()).length,2);for(const uid of ['owner','guestdm','player','other'])await assertFails(stores[uid].list());await assertSucceeds(sdk.getDoc(ref('player','campaigns/a')));});
 await check('Delegated campaign DMs and players cannot delete or forge deletion metadata',async()=>{for(const uid of ['guestdm','player','other']){await assert.rejects(stores[uid].remove({campaignId:'a'}));await assertFails(sdk.updateDoc(ref(uid,'campaigns/a'),{deletedAt:1,deletedBy:uid,updatedAt:1}));}await assertFails(sdk.updateDoc(ref('owner','campaigns/a'),{deletedAt:1,deletedBy:'admin',updatedAt:1}));});
 await check('Stale UI/account context prevents owner deletion',async()=>{await assert.rejects(stores.owner.remove({campaignId:'a',isCurrent:()=>false}),/changed/);assert.equal((await sdk.getDoc(ref('owner','campaigns/a'))).data().deletedAt,undefined);});
 await check('Campaign owner deletes only their own campaign and preserves recovery records',async()=>{
  await storage.uploadBytes(storage.ref(contexts.owner.storage(),'campaign-maps/a/image'),new Uint8Array([1,2,3]),{contentType:'image/png'});
  await assertSucceeds(storage.getBytes(storage.ref(contexts.player.storage(),'campaign-maps/a/image')));
  await stores.owner.remove({campaignId:'a'});await assertFails(sdk.getDoc(ref('owner','campaigns/a')));
  await env.withSecurityRulesDisabled(async c=>{const root=(await sdk.getDoc(sdk.doc(c.firestore(),'campaigns/a'))).data();assert.equal(root.deletedBy,'owner');assert.ok(root.deletedAt>0);assert.equal((await sdk.getDoc(sdk.doc(c.firestore(),'campaigns/a/characters/sheet'))).exists(),true);});
 });
 await check('Deletion ends member and DM Firestore/Storage access including old saved paths',async()=>{
  for(const uid of ['owner','guestdm','player']){
   for(const path of ['campaigns/a/items/item','campaigns/a/playerInformation/post','campaigns/a/characters/sheet','campaigns/a/members/'+(uid==='owner'?'player':uid)])await assertFails(sdk.getDoc(ref(uid,path)));
   await assertFails(storage.getBytes(storage.ref(contexts[uid].storage(),'campaign-maps/a/image')));
  }
  await assertFails(sdk.getDoc(ref('guestdm','campaigns/a/workspaceSecrets/world-post')));
 });
 await check('Deleted IDs cannot be recreated, hard-deleted or restored through client settings',async()=>{
  await assertFails(sdk.deleteDoc(ref('admin','campaigns/a')));await assertFails(sdk.deleteDoc(ref('owner','campaigns/a')));
  await assertFails(sdk.setDoc(ref('owner','campaigns/a'),{name:'Hijacked',ownerId:'owner',dmId:'owner'}));
  await assertFails(sdk.updateDoc(ref('admin','campaigns/a'),{deletedAt:sdk.deleteField(),deletedBy:sdk.deleteField()}));
  assert.deepEqual((await stores.admin.list()).map(c=>c.id),['b']);
 });
 await check('Admin can delete an unrelated campaign without acquiring its private data permissions',async()=>{await assertFails(sdk.getDoc(ref('admin','campaigns/b/workspaceSecrets/private')));await stores.admin.remove({campaignId:'b'});assert.equal((await stores.admin.list()).length,0);});
 console.log('SUCCESS',count,'campaign deletion Firestore/Storage checks');
}finally{await env.cleanup();}})().catch(error=>{console.error(error);process.exitCode=1});
