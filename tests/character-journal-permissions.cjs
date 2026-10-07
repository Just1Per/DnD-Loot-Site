const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 try{
 await env.clearFirestore();const identity={name:'Arden',class:'Wizard',level:6};
 await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [key,value] of Object.entries({'campaigns/a':{ownerId:'dm',name:'Coast'},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/other':{status:'active',role:'player'},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/characters/c1':{...identity,userId:'player'},'campaigns/a/characters/c2':{...identity,userId:'player'}}))await sdk.setDoc(sdk.doc(db,key),value);});
 const db=Object.fromEntries(['dm','player','other'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));const stores=Object.fromEntries(Object.keys(db).map(uid=>[uid,createCharacterSheetStore({...sdk,db:db[uid],auth:{currentUser:{uid}}})]));
 const data={advancement:{asiSpent:0},rulesChoices:{feats:[],effects:{},grants:{__adobe:{used:0,data:{notesMigrated:true,journal:[{id:'npc',title:'Jamna',category:'NPCs',text:'Caravan contact'}],portrait:'data:image/jpeg;base64,/9j/AA==',showPortraitOnOverview:true}}}}};
 const payload={campaignId:'a',characterId:'c1',revision:0,data,identity,previousIdentity:identity};
 assert.equal(await stores.player.save(payload),1);const loaded=await stores.player.load('a','c1');assert.equal(loaded.data.rulesChoices.grants.__adobe.data.journal[0].text,'Caravan contact');console.log('PASS owner can save categorized notes and portrait');
 await assertFails(stores.other.load('a','c1'));console.log('PASS notes and portraits remain private to owner and DM');
 const forged=structuredClone(data);forged.rulesChoices.grants.__dm={bonusFeats:2,bonusAsis:1,usedAsis:0};
 await assertFails(stores.player.save({...payload,revision:1,data:forged}));await assertFails(stores.player.save({...payload,characterId:'c2',data:forged}));console.log('PASS player cannot forge extra advancement on update or initial creation');
 const asi=structuredClone(data);asi.advancement.asiSpent=1;await assertFails(stores.player.save({...payload,revision:1,data:asi}));console.log('PASS normal ASI reservations are DM managed');
 assert.equal(await stores.dm.save({...payload,revision:1,data:forged}),2);const preserved=structuredClone(forged);preserved.rulesChoices.grants.__adobe.data.journal[0].text='Updated private note';assert.equal(await stores.player.save({...payload,revision:2,data:preserved}),3);console.log('PASS DM grants persist through ordinary player note edits');
 const altered=structuredClone(preserved);altered.rulesChoices.grants.__dm.usedAsis=1;await assertFails(stores.player.save({...payload,revision:3,data:altered}));console.log('PASS players cannot consume or alter DM bonus ASI reservations');
 console.log('SUCCESS 6 journal and advancement permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
