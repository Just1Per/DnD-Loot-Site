// Current schema tests: server rules enforce access, revisions and DM advancement.
// Nested sheet choices are normalized by the core, rather than duplicated in rules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore'),M=require('../js/modules/character-sheet-model');
const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');
const {doc,setDoc,getDoc,getDocs,collection,deleteDoc,updateDoc}=sdk;
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 let count=0;const check=async(name,fn)=>{await fn();count++;console.log('PASS',name)};
 try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{
  for(const [key,value] of Object.entries({'campaigns/a':{ownerId:'owner',name:'Coast'},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/other':{status:'active',role:'player'},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/characters/c1':{name:'Arden',class:'Bard',level:5,userId:'player'},'users/admin':{role:['admin']}}))await setDoc(doc(context.firestore(),key),value);
 });
 const users=['owner','dm','player','other','admin','outsider'];
 const db=Object.fromEntries(users.map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
 const stores=Object.fromEntries(users.map(uid=>[uid,createCharacterSheetStore({...sdk,db:db[uid],auth:{currentUser:{uid}}})]));
 const identity={name:'Arden',class:'Bard',level:5};
 const data=M.normalize({notes:'Private notes',build:{race:'fairy-mpmm',scoreMode:'base',asiPattern:'111',flexibleChoices:['dex','con','wis'],raceAbility:'wis'}});
 const payload={campaignId:'a',characterId:'c1',revision:0,data,identity,previousIdentity:identity};
 const ref=uid=>doc(db[uid],'campaigns/a/characterSheets/c1');
 await check('owner can open a missing sheet',async()=>assert.equal((await stores.player.load('a','c1')).revision,0));
 await check('owner saves identity and sheet atomically',async()=>assert.equal(await stores.player.save(payload),1));
 await check('current schema and private choices reload',async()=>{const saved=await stores.player.load('a','c1');assert.equal(saved.schemaVersion,14);assert.equal(saved.data.notes,'Private notes');assert.deepEqual(saved.data.build.flexibleChoices,['dex','con','wis']);});
 await check('campaign DM and owner can read the sheet',async()=>{await assertSucceeds(getDoc(ref('dm')));await assertSucceeds(getDoc(ref('owner')));});
 await check('other player, global admin and outsider cannot read',async()=>{for(const uid of ['other','admin','outsider'])await assertFails(getDoc(ref(uid)));});
 await check('shared roster does not contain private sheet data',async()=>{const row=(await getDoc(doc(db.other,'campaigns/a/characters/c1'))).data();assert.equal(row.notes,undefined);assert.equal(row.data,undefined);});
 await check('bulk sheet listing is denied',()=>assertFails(getDocs(collection(db.player,'campaigns/a/characterSheets'))));
 await check('DM can update the sheet',async()=>assert.equal(await stores.dm.save({...payload,revision:1,data:M.normalize({notes:'DM edit'})}),2));
 await check('stale saves preserve newer data',async()=>{await assert.rejects(stores.player.save({...payload,revision:1}),/changed/);assert.equal((await stores.player.load('a','c1')).data.notes,'DM edit');});
 await check('simultaneous saves have one winner',async()=>{const saves=await Promise.allSettled([stores.player.save({...payload,revision:2}),stores.dm.save({...payload,revision:2})]);assert.equal(saves.filter(r=>r.status==='fulfilled').length,1);});
 for(const uid of ['other','admin','outsider'])await check(uid+' cannot forge a sheet update',()=>assertFails(updateDoc(ref(uid),{revision:4,updatedBy:uid})));
 await check('forged author is rejected',()=>assertFails(updateDoc(ref('player'),{revision:4,updatedBy:'dm'})));
 await check('unsupported schema envelope is rejected',()=>assertFails(updateDoc(ref('player'),{revision:4,updatedBy:'player',schemaVersion:101})));
 await check('non-map sheet data is rejected',()=>assertFails(updateDoc(ref('player'),{revision:4,updatedBy:'player',data:[]})));
 await check('legacy client cannot downgrade schema',()=>assertFails(updateDoc(ref('player'),{revision:4,updatedBy:'player',schemaVersion:1})));
 await check('skipped revisions are rejected',()=>assertFails(updateDoc(ref('player'),{revision:5,updatedBy:'player'})));
 await check('2024 choices persist through the core store',async()=>{const modern=M.normalize({build:{edition:'2024',race:'human-2024',humanOriginFeat:'Tough',background:'criminal-2024',backgroundAbilities:['dex','con']}});assert.equal(await stores.player.save({...payload,revision:3,data:modern}),4);const saved=await stores.player.load('a','c1');assert.equal(saved.schemaVersion,14);assert.equal(saved.data.build.humanOriginFeat,'Tough');});
 await check('returning to 2014 retains schema protection',async()=>{assert.equal(await stores.player.save({...payload,revision:4}),5);assert.equal((await stores.player.load('a','c1')).schemaVersion,14);});
 await check('concurrent identity changes are preserved',async()=>{await updateDoc(doc(db.dm,'campaigns/a/characters/c1'),{name:'Renamed'});await assert.rejects(stores.player.save({...payload,revision:5}),/Character details changed/);});
 await check('archived characters retain private sheets',async()=>{await updateDoc(doc(db.dm,'campaigns/a/characters/c1'),{active:false});await assertSucceeds(getDoc(ref('player')));});
 await check('orphan sheets cannot be created',()=>assertFails(setDoc(doc(db.owner,'campaigns/a/characterSheets/missing'),{schemaVersion:14,revision:1,data,updatedAt:1,updatedBy:'owner'})));
 await check('removed membership revokes access',async()=>{await deleteDoc(doc(db.owner,'campaigns/a/members/player'));await assertFails(getDoc(ref('player')));});
 await check('rules catalogue is root-writable and signed-in-readable',async()=>{await assertSucceeds(setDoc(doc(db.admin,'rulesCatalog/current'),{format:1,release:'test'}));await assertSucceeds(getDoc(doc(db.player,'rulesCatalog/current')));for(const uid of ['player','dm','owner'])await assertFails(setDoc(doc(db[uid],'rulesCatalog/current'),{release:'forged'}));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'rulesCatalog/current')));});
 console.log('SUCCESS',count,'current sheet permission/persistence checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
