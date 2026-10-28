const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {doc,setDoc,getDoc,deleteDoc}=sdk;
const M=require('../js/modules/character-sheet-model');
const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');

(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{
   const db=c.firestore();
   const seed={
     'campaigns/a':{ownerId:'dm',dmId:'dm',name:'Coast',inventoryVersion:2},
     'campaigns/a/members/dm':{uid:'dm',status:'active',role:'dm'},
     'campaigns/a/members/player':{uid:'player',status:'active',role:'player'},
     'campaigns/a/characters/c1':{name:'Arden',class:'Druid',level:5,userId:'player'},
     'campaigns/a/items/visible':{campaignId:'a',name:'Potion',visible:true,highlighted:false,lootMode:'player'},
     'campaigns/a/items/hidden':{campaignId:'a',name:'Secret',visible:false,highlighted:false,lootMode:'player'},
     'campaigns/a/items/dmOnly':{campaignId:'a',name:'DM Loot',visible:true,highlighted:false,lootMode:'dm'},
     'campaigns/a/supply/visible':{capacity:5,claimed:0,unlimited:false,revision:1,lastClaim:{entryId:'',actorId:'',quantity:0},updatedAt:1},
     'campaigns/a/supply/hidden':{capacity:5,claimed:0,unlimited:false,revision:1,lastClaim:{entryId:'',actorId:'',quantity:0},updatedAt:1},
     'campaigns/a/supply/dmOnly':{capacity:5,claimed:0,unlimited:false,revision:1,lastClaim:{entryId:'',actorId:'',quantity:0},updatedAt:1}
   };
   for(const [p,d] of Object.entries(seed))await setDoc(doc(db,p),d);
 });
 const player=env.authenticatedContext('player').firestore(),dm=env.authenticatedContext('dm').firestore();
 await assertSucceeds(getDoc(doc(player,'campaigns/a/supply/visible')));
 await assertFails(getDoc(doc(player,'campaigns/a/supply/hidden')));
 await assertFails(getDoc(doc(player,'campaigns/a/supply/dmOnly')));
 await assertSucceeds(getDoc(doc(dm,'campaigns/a/supply/hidden')));

 const store=createCharacterSheetStore({...sdk,db:player,auth:{currentUser:{uid:'player'}}});
 const identity={name:'Arden',class:'Druid',level:5};
 const data=M.normalize({notes:'schema 14'});
 await store.save({campaignId:'a',characterId:'c1',revision:0,data,identity,previousIdentity:identity});
 const raw=(await getDoc(doc(player,'campaigns/a/characterSheets/c1'))).data();
 assert.equal(raw.schemaVersion,14);
 assert.equal(raw.data.rulesChoices.grants.__adobe.data.companion.type,'companion');
 assert.equal(raw.data.rulesChoices.grants.__adobe.data.pages.companion,false);
 assert.ok(Array.isArray(raw.data.rulesChoices.grants.__adobe.data.tabOrder));
 // Artificer source/subclass caches stay inside the existing stable grants envelope.
 const C=require('../js/modules/character-class-feature-choices');
 const artificer=M.normalize({build:{classId:'artificer',edition:'2024'}});artificer.adobe={classLevels:[{classId:'artificer',level:5,subclassId:'armorer-legacy'}],classFeatureChoices:{}};
 assert.equal(C.setArtificerSource(artificer,'efa'),true);artificer.adobe.classLevels[0].subclassId='cartographer-efota';artificer.adobe.classFeatureChoices['2024:artificer:flash-of-genius-uses']=['2'];const Log=require('../js/modules/character-adventure-log');artificer.adobe.adventureLog=Log.edit({},6,'gold','-0.25','gain');
 const artificerIdentity={...identity,class:'Artificer'};await store.save({campaignId:'a',characterId:'c1',revision:1,data:artificer,identity:artificerIdentity,previousIdentity:identity});
 const savedArtificer=await store.load('a','c1');assert.equal(savedArtificer.data.rulesChoices.grants.__adobe.data.classFeatureChoices[C.artificerSourceKey][0],'efa');assert.equal(savedArtificer.data.rulesChoices.grants.__adobe.data.classFeatureChoices['2014:artificer:tce-subclass'][0],'armorer-legacy');assert.equal(C.artificerSource(savedArtificer.data).id,'efa');
 assert.equal(savedArtificer.data.rulesChoices.grants.__adobe.data.adventureLog.rows[6].gain.gold,-0.25);await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'campaigns/a/characterSheets/c1')));
 assert.equal(raw.data.advancement.hpMode,'fixed');
 assert.ok(Array.isArray(raw.data.advancement.classLevels));
 // Owners may delete their own character under the current lifecycle rules.
 await assertFails(deleteDoc(doc(env.authenticatedContext('other').firestore(),'campaigns/a/characters/c1')));
 await assertSucceeds(deleteDoc(doc(player,'campaigns/a/characters/c1')));
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'campaigns/a/characters/c1'),{...identity,userId:'player'}));
 await assertSucceeds(deleteDoc(doc(dm,'campaigns/a/characterSheets/c1')));
 await assertSucceeds(deleteDoc(doc(dm,'campaigns/a/characters/c1')));
 await env.cleanup();
 console.log('SUCCESS Adobe schema 14 tab layout, campaign supply permissions and DM character deletion');
})().catch(error=>{console.error(error);process.exit(1)});
