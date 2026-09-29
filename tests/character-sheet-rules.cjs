const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');const {doc,setDoc,getDoc,getDocs,collection,deleteDoc,updateDoc}=sdk;
const M=require('../js/modules/character-sheet-model');const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});let n=0;const check=async(name,f)=>{await f();n++;console.log('PASS',name)};
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();for(const [p,d] of Object.entries({'campaigns/a':{ownerId:'owner',name:'Coast'},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/other':{status:'active',role:'player'},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/characters/c1':{name:'Arden',class:'Bard',level:5,userId:'player'},'users/admin':{role:['admin']}}))await setDoc(doc(db,p),d);});
 const db={},store={};for(const uid of ['owner','dm','player','other','admin','outsider']){db[uid]=env.authenticatedContext(uid).firestore();store[uid]=createCharacterSheetStore({...sdk,db:db[uid],auth:{currentUser:{uid}}});}
 const identity={name:'Arden',class:'Bard',level:5},payload={campaignId:'a',characterId:'c1',revision:0,data:M.normalize({hpCurrent:30,hpMax:30,notes:'Private notes',build:{race:'fairy-mpmm',scoreMode:'base',asiPattern:'111',flexibleChoices:['dex','con','wis'],raceAbility:'wis'}}),identity,previousIdentity:identity};
 await check('owner can open a missing sheet',async()=>assert.equal((await store.player.load('a','c1')).revision,0));
 await check('player saves identity and private sheet atomically',async()=>assert.equal(await store.player.save(payload),1));
 await check('owner can reload saved sheet',async()=>assert.equal((await store.player.load('a','c1')).data.notes,'Private notes'));
 await check('expanded race choices persist under existing rules',async()=>{const b=(await store.player.load('a','c1')).data.build;assert.equal(b.race,'fairy-mpmm');assert.deepEqual(b.flexibleChoices,['dex','con','wis']);assert.equal(b.raceAbility,'wis');});
 await check('DM and campaign owner can read sheet',async()=>{assert.equal((await store.dm.load('a','c1')).revision,1);assert.equal((await store.owner.load('a','c1')).revision,1);});
 await check('other player, global admin and outsider cannot read sheet',async()=>{for(const u of ['other','admin','outsider'])await assertFails(getDoc(doc(db[u],'campaigns/a/characterSheets/c1')));});
 await check('private notes are absent from shared roster',async()=>{const c=await getDoc(doc(db.other,'campaigns/a/characters/c1'));assert.equal(c.data().notes,undefined);assert.equal(c.data().data,undefined);});
 await check('bulk sheet listing is denied',()=>assertFails(getDocs(collection(db.player,'campaigns/a/characterSheets'))));
 await check('DM can edit player sheet',async()=>assert.equal(await store.dm.save({...payload,revision:1,data:M.normalize({notes:'DM edit'})}),2));
 await check('stale revision preserves newer data',async()=>{await assert.rejects(store.player.save({...payload,revision:1}),/changed/);assert.equal((await store.player.load('a','c1')).data.notes,'DM edit');});
 await check('simultaneous DM and player saves produce one winner',async()=>{const r=await Promise.allSettled([store.player.save({...payload,revision:2}),store.dm.save({...payload,revision:2})]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
 await check('other player cannot forge sheet writes',()=>assertFails(setDoc(doc(db.other,'campaigns/a/characterSheets/c1'),{schemaVersion:1,revision:4,data:M.normalize(),updatedAt:1,updatedBy:'other'})));
 await check('global admin gets no campaign write bypass',()=>assertFails(setDoc(doc(db.admin,'campaigns/a/characterSheets/c1'),{schemaVersion:1,revision:4,data:M.normalize(),updatedAt:1,updatedBy:'admin'})));
 await check('forged author and unsupported versions denied',async()=>{await assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:4,updatedBy:'dm'}));await assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:4,schemaVersion:99}));});
 await check('unbounded or malformed row containers denied',()=>assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:4,'data.spells':Array(151).fill({})})));
 await check('old clients cannot downgrade a rules-engine sheet',()=>assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:4,schemaVersion:1})));
 await check('2024 sheets save and reload with schema-eleven protection',async()=>{const modern=M.normalize({build:{edition:'2024',race:'human-2024',humanOriginFeat:'Tough',background:'criminal-2024',backgroundAbilities:['dex','con']}});await store.player.save({...payload,revision:3,data:modern});const saved=await store.player.load('a','c1');assert.equal(saved.schemaVersion,11);assert.equal(saved.data.build.humanOriginFeat,'Tough');});
 await check('legacy clients cannot downgrade a 2024 sheet or forge its edition',async()=>{await assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:5,schemaVersion:2,'data.build.edition':'2014'}));await assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:5,'data.build.edition':'2099'}));});
 await check('switching rules back to 2014 retains schema-eleven protection',async()=>{await store.player.save({...payload,revision:4});assert.equal((await store.player.load('a','c1')).schemaVersion,11);});
 await check('concurrent identity changes are not overwritten',async()=>{await updateDoc(doc(db.dm,'campaigns/a/characters/c1'),{name:'Renamed'});await assert.rejects(store.player.save({...payload,revision:5}),/Character details changed/);});
 await check('archived character retains private sheet',async()=>{await updateDoc(doc(db.dm,'campaigns/a/characters/c1'),{active:false});await assertSucceeds(getDoc(doc(db.player,'campaigns/a/characterSheets/c1')));});
 await check('missing character cannot receive an orphan sheet',()=>assertFails(setDoc(doc(db.owner,'campaigns/a/characterSheets/missing'),{schemaVersion:1,revision:1,data:M.normalize(),updatedAt:1,updatedBy:'owner'})));
 await check('removed member loses access to own sheet',async()=>{await deleteDoc(doc(db.owner,'campaigns/a/members/player'));await assertFails(getDoc(doc(db.player,'campaigns/a/characterSheets/c1')));});
 await check('catalogue is writable only by root admin and readable by signed-in players',async()=>{
   await assertSucceeds(setDoc(doc(db.admin,'rulesCatalog/current'),{format:1,release:'test'}));
   await assertSucceeds(setDoc(doc(db.admin,'rulesCatalog/test/parts/0000'),{text:'reference data'}));
   await assertSucceeds(getDoc(doc(db.player,'rulesCatalog/current')));
   await assertSucceeds(getDoc(doc(db.player,'rulesCatalog/test/parts/0000')));
   for(const u of ['player','dm','owner'])await assertFails(setDoc(doc(db[u],'rulesCatalog/current'),{release:'forged'}));
   await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'rulesCatalog/current')));
 });
 await check('old version-three clients cannot erase catalogue choices',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:6,schemaVersion:3}));
 });
 await check('version-four clients cannot overwrite feat effects and malformed effects are denied',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:6,schemaVersion:4}));
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:6,'data.rulesChoices.effects':[]}));
 });
 await check('schema-five clients cannot truncate multi-use feat resources',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:6,schemaVersion:5}));
   await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:6,updatedBy:'dm','data.rulesChoices.effects':{'origin-human':{used:3}}}));
   assert.equal((await getDoc(doc(db.dm,'campaigns/a/characterSheets/c1'))).data().data.rulesChoices.effects['origin-human'].used,3);
 });
 await check('schema-six clients cannot erase equipped state',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:7,schemaVersion:6}));
   await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:7,'data.equipmentState':{acMode:'equipment',acAdjustment:1,loadout:[{id:'c1__blade',equipped:true,attuned:true}]}}));
   assert.equal((await getDoc(doc(db.dm,'campaigns/a/characterSheets/c1'))).data().data.equipmentState.loadout[0].equipped,true);
 });
 await check('unbounded equipment state and forged mechanics on the sheet are denied',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,'data.equipmentState.loadout':Array(201).fill({})}));
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,'data.equipmentState.mechanics':{acBonus:99}}));
 });
 await check('schema-nine cannot erase automatic actions',async()=>{await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,schemaVersion:9}));await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,'data.actions':Array(61).fill({})}));});
 await check('schema-eight cannot erase new profile data',async()=>{await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,schemaVersion:8}));});
 await check('schema-seven clients cannot erase expanded background choices',async()=>{
   await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,schemaVersion:7}));
   await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:8,'data.build.background':'artisan-2024','data.build.backgroundTools':['Smith’s tools',''],'data.build.backgroundReplacementSkills':['arcana','']}));
   const saved=(await getDoc(doc(db.dm,'campaigns/a/characterSheets/c1'))).data();assert.equal(saved.schemaVersion,11);assert.equal(saved.data.build.backgroundTools[0],'Smith’s tools');
 });
 await check('automatic action references persist in schema eleven',async()=>{const actions=[{kind:'weapon',ref:'battleaxe',mode:'twoHanded',ability:'auto',slot:0,name:'Battleaxe'}];await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:9,'data.actions':actions}));assert.deepEqual((await getDoc(doc(db.dm,'campaigns/a/characterSheets/c1'))).data().data.actions,actions);});
 await check('schema ten cannot erase personal inventory',async()=>{await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:10,schemaVersion:10}));await assertFails(updateDoc(doc(db.dm,'campaigns/a/characterSheets/c1'),{revision:10,'data.personalGear':Array(201).fill({})}));});
 await check('private personal inventory persists with owner access',async()=>{await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'campaigns/a/members/player'),{status:'active',role:'player'}));const gear=M.normalize({personalGear:[{id:'personal-rope',name:'Rope',quantity:2,weight:10,location:'Backpack',carried:true}]}).personalGear;await assertSucceeds(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:10,updatedBy:'player','data.personalGear':gear}));assert.deepEqual((await getDoc(doc(db.player,'campaigns/a/characterSheets/c1'))).data().data.personalGear,gear);});
 await env.cleanup();console.log(`SUCCESS ${n} sheet permission/persistence checks`);
})().catch(e=>{console.error(e);process.exit(1)});
