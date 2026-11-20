'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCharacterSheetStore}=require('../js/modules/character-sheet-store'),{createCampaignStore}=require('../js/modules/campaign-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.resolve(__dirname,'../firestore.rules'),'utf8')}});let count=0;
 const check=async(name,work)=>{await work();console.log('PASS',name);count++;};
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c=>{for(const [p,d] of Object.entries({
   'campaigns/a':{ownerId:'owner',inventoryVersion:2},'campaigns/b':{ownerId:'outsider'},'users/admin':{role:['admin']},
   'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/other':{role:'player',status:'active'},'campaigns/a/members/host':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'},
   'campaigns/a/characters/c1':{userId:'player',name:'Thorin',class:'Wizard',level:4,active:true},'campaigns/a/characters/c2':{userId:'other',name:'Elara',class:'Cleric',level:4,active:true},
   'campaigns/a/items/sword':{name:'Private sword name',visible:true,lootMode:'player',campaignId:'a',highlighted:false},'campaigns/a/supply/sword':{capacity:100,claimed:0,unlimited:false,revision:1,updatedAt:1}
  }))await sdk.setDoc(sdk.doc(c.firestore(),p),d);});
  const contexts=Object.fromEntries(['owner','dm','player','other','host','outsider','revoked','admin'].map(uid=>[uid,env.authenticatedContext(uid)]));contexts.anonymous=env.unauthenticatedContext();
  const deps=uid=>({...sdk,db:contexts[uid].firestore(),auth:{currentUser:uid==='anonymous'?null:{uid}},notificationsAvailable:()=>true});
  const ref=(uid,...p)=>sdk.doc(contexts[uid].firestore(),...p),event=(uid,char,id)=>ref(uid,'campaigns','a','characterNotifications',char,'entries',id);
  const sheet=uid=>createCharacterSheetStore(deps(uid)),identity={name:'Thorin',class:'Wizard',level:4};
  const save=(uid,revision,notes,extra={})=>sheet(uid).save({campaignId:'a',characterId:'c1',revision,data:{dmNotes:notes},identity,previousIdentity:identity,...extra});
  await check('DM-note events commit with the actual note change; entries contain references and no private prose',async()=>{
   await assertSucceeds(save('dm',0,'PRIVATE NOTE ONE'));
   const value=(await sdk.getDoc(event('player','c1','notes_1'))).data();assert.equal(value.kind,'dm-notes');assert.equal(value.version,1);assert.ok(!JSON.stringify(value).includes('PRIVATE'));
   await assertSucceeds(sdk.getDocs(sdk.collection(contexts.player.firestore(),'campaigns/a/characterNotifications/c1/entries')));
   for(const uid of ['other','outsider','revoked','admin','anonymous']){await assertFails(sdk.getDoc(event(uid,'c1','notes_1')));await assertFails(sdk.getDocs(sdk.collection(contexts[uid].firestore(),'campaigns/a/characterNotifications/c1/entries')));}
   await assertSucceeds(save('dm',1,'PRIVATE NOTE ONE'));assert.equal((await sdk.getDocs(sdk.collection(contexts.dm.firestore(),'campaigns/a/characterNotifications/c1/entries'))).size,1);
   await assertSucceeds(save('dm',2,'PRIVATE NOTE TWO'));await assertSucceeds(sdk.getDoc(event('player','c1','notes_3')));
  });
  await check('Players and unrelated admins cannot forge, alter or delete events; even a DM needs the atomic source mutation',async()=>{
   const value=(await sdk.getDoc(event('dm','c1','notes_3'))).data();
   for(const uid of ['player','other','outsider','admin','revoked'])await assertFails(sdk.setDoc(event(uid,'c1','notes_4'),{...value,version:4,actorId:uid}));
   await assertFails(sdk.setDoc(event('dm','c1','notes_4'),{...value,version:4}));await assertFails(sdk.setDoc(event('dm','c2','notes_3'),value));
   await assertFails(sdk.updateDoc(event('dm','c1','notes_3'),{quantity:1}));await assertFails(sdk.deleteDoc(event('dm','c1','notes_3')));
   await assertFails(save('player',3,'FORGED DM NOTE'));assert.equal((await sheet('player').load('a','c1')).revision,3);
  });
  await check('DM loot assignment/transfer notify only receivers; claim, consume and unloot preserve the ordinary stock rules',async()=>{
   const call=uid=>createCampaignStore(deps(uid)),request={campaignId:'a',characterId:'c1',itemId:'sword',quantity:2};
   await assertSucceeds(call('dm')('vaultInventoryAction',{...request,action:'assign'}));
   let values=await sdk.getDocs(sdk.collection(contexts.player.firestore(),'campaigns/a/characterNotifications/c1/entries'));const loot=values.docs.map(d=>d.data()).filter(d=>d.kind==='loot');assert.equal(loot.length,1);assert.equal(loot[0].quantity,2);assert.ok(!JSON.stringify(loot).includes('Private sword'));
   await assertSucceeds(call('dm')('vaultInventoryAction',{...request,action:'transfer',quantity:1,targetCharacterId:'c2'}));
   const received=await sdk.getDocs(sdk.collection(contexts.other.firestore(),'campaigns/a/characterNotifications/c2/entries'));assert.equal(received.size,1);assert.equal(received.docs[0].data().quantity,1);
   await assertSucceeds(call('player')('vaultInventoryAction',{...request,action:'claim',quantity:1}));await assertSucceeds(call('player')('vaultInventoryAction',{...request,action:'use',quantity:1}));await assertSucceeds(call('dm')('vaultInventoryAction',{...request,action:'unloot',quantity:1}));
   values=await sdk.getDocs(sdk.collection(contexts.player.firestore(),'campaigns/a/characterNotifications/c1/entries'));assert.equal(values.docs.filter(d=>d.data().kind==='loot').length,1);
   await assertFails(sdk.setDoc(event('dm','c2','loot_forged'),{kind:'loot',sourceId:'c2__sword',version:1,createdAt:1,actorId:'dm',quantity:1}));
  });
  await check('Only the account itself can read/write bounded read and dismissal state; source and role fields cannot be smuggled in',async()=>{
   const target=ref('player','users','player','notificationState','character~a~main~c1'),state={read:['notes_3'],dismissed:[],updatedAt:1};
   await assertSucceeds(sdk.getDoc(ref('player','users','player','notificationState','_capability')));await assertSucceeds(sdk.setDoc(target,state));
   for(const uid of ['other','admin','anonymous']){const p=ref(uid,'users','player','notificationState','character~a~main~c1');await assertFails(sdk.getDoc(p));await assertFails(sdk.setDoc(p,state));}
   for(const change of [{role:['admin']},{read:'notes_3'},{read:Array(201).fill('x')},{dismissed:Array(201).fill('x')},{updatedAt:'now'},{privateNotes:'SECRET'}])await assertFails(sdk.setDoc(target,{...state,...change}));
   assert.deepEqual((await sdk.getDoc(target)).data(),state);
  });
  await check('Adventure-host notes use the separate roster namespace and accepted-participant boundary',async()=>{
   await env.withSecurityRulesDisabled(async c=>{for(const [p,d] of Object.entries({
    'campaigns/a/oneShots/shot':{createdBy:'dm',data:{approved:true,hostUid:'host',participantUids:['player'],targetLevel:4,rosterMode:'Mixed'}},
    'campaigns/a/oneShots/shot/participants/player':{uid:'player',status:'accepted'},
    'campaigns/a/oneShots/shot/characters/c1':{...identity,userId:'player',active:true,createdBy:'dm',createdAt:1,sequence:1}
   }))await sdk.setDoc(sdk.doc(c.firestore(),p),d);});
   await assertSucceeds(save('host',0,'PRIVATE ADVENTURE NOTE',{adventureId:'shot'}));
   const p=uid=>ref(uid,'campaigns','a','oneShots','shot','characterNotifications','c1','entries','notes_1');await assertSucceeds(sdk.getDoc(p('player')));await assertFails(sdk.getDoc(p('other')));await assertFails(sdk.getDoc(p('admin')));
   assert.equal((await sdk.getDoc(event('player','c1','notes_1'))).data().actorId,'dm');assert.equal((await sdk.getDoc(p('player'))).data().actorId,'host');
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/oneShots/shot/participants/player'),{status:'declined'}));await assertFails(sdk.getDoc(p('player')));
  });
  await check('Ownership changes, archive, membership revocation and deleted campaigns terminate private notification access',async()=>{
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/characters/c1'),{userId:'other'}));await assertFails(sdk.getDoc(event('player','c1','notes_1')));await assertSucceeds(sdk.getDoc(event('other','c1','notes_1')));
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/characters/c1'),{active:false}));await assertFails(sdk.getDoc(event('other','c1','notes_1')));
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/members/other'),{status:'inactive'}));await assertFails(sdk.getDocs(sdk.collection(contexts.other.firestore(),'campaigns/a/characterNotifications/c2/entries')));
   await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a'),{deletedAt:Date.now(),deletedBy:'owner'}));for(const uid of ['owner','dm','player'])await assertFails(sdk.getDoc(event(uid,'c1','notes_1')));
  });
  console.log('SUCCESS',count,'account notification permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
