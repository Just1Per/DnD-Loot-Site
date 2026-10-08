const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,deleteDoc,updateDoc}=require('firebase/firestore');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});let count=0;
 const check=async(name,fn)=>{await fn();count++;console.log('PASS',name);};
 try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [p,data] of Object.entries({'campaigns/a':{ownerId:'owner',name:'Coast'},'campaigns/b':{ownerId:'other-owner',name:'Other'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/inactive':{role:'player',status:'pending'}}))await setDoc(doc(db,p),data);});
 const db=Object.fromEntries(['owner','dm','player','outsider','inactive'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
 const feat={name:'Campaign Ward',description:'Our custom feat',edition:'2024',hidden:false,custom:true,minimumLevel:0,hpPerLevel:2,speedBonus:5,armorTraining:['medium']};
 await check('Campaign owner and DM can save allowed editions',async()=>{await assertSucceeds(updateDoc(doc(db.owner,'campaigns/a'),{allowedEditions:['2014']}));await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a'),{allowedEditions:['2014','2024']}));});
 await check('Players and outsiders cannot change campaign editions',async()=>{for(const uid of ['player','outsider','inactive'])await assertFails(updateDoc(doc(db[uid],'campaigns/a'),{allowedEditions:['2024']}));});
 await check('Invalid or empty allowed edition lists are denied',async()=>{for(const allowedEditions of [[],['2014','2014'],['2025'],['2014','2024','2014'],'2024'])await assertFails(updateDoc(doc(db.dm,'campaigns/a'),{allowedEditions}));});
 await check('DM custom and standard overrides stay campaign-local',async()=>{await assertSucceeds(setDoc(doc(db.dm,'campaigns/a/featCatalog/custom-ward'),feat));await assertSucceeds(setDoc(doc(db.owner,'campaigns/a/featCatalog/phb-tough'),{...feat,custom:false,name:'Renamed Tough'}));await assertFails(setDoc(doc(db.dm,'campaigns/b/featCatalog/custom-ward'),feat));});
 await check('Active players can read the policy but cannot create, edit, hide or delete feats',async()=>{await assertSucceeds(getDocs(collection(db.player,'campaigns/a/featCatalog')));await assertSucceeds(getDoc(doc(db.player,'campaigns/a')));await assertFails(setDoc(doc(db.player,'campaigns/a/featCatalog/custom-forged'),feat));await assertFails(updateDoc(doc(db.player,'campaigns/a/featCatalog/custom-ward'),{hidden:true}));await assertFails(deleteDoc(doc(db.player,'campaigns/a/featCatalog/custom-ward')));});
 await check('Outsiders and inactive members cannot read campaign feat records',async()=>{for(const uid of ['outsider','inactive'])await assertFails(getDoc(doc(db[uid],'campaigns/a/featCatalog/custom-ward')));});
 await check('Malformed names, effects and unexpected fields are denied',async()=>{for(const change of [{name:''},{description:'x'.repeat(12001)},{hpPerLevel:11},{speedBonus:-1},{minimumLevel:21},{armorTraining:['forged']},{hpPerLevel:1.5},{edition:'2025'},{hidden:'yes'},{forgedMechanics:{ac:99}}])await assertFails(setDoc(doc(db.dm,'campaigns/a/featCatalog/custom-invalid'),{...feat,...change}));});
 await check('DM hide, archive and reset operations preserve custom references',async()=>{await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a/featCatalog/custom-ward'),{hidden:true}));assert.equal((await getDoc(doc(db.player,'campaigns/a/featCatalog/custom-ward'))).data().hpPerLevel,2);await assertSucceeds(deleteDoc(doc(db.dm,'campaigns/a/featCatalog/phb-tough')));assert.equal((await getDoc(doc(db.player,'campaigns/a/featCatalog/custom-ward'))).exists(),true);});
 await check('DM can assign custom feats through a private sheet; player cannot forge its protected allowance',async()=>{
  const M=require('../js/modules/character-sheet-model'),{createCharacterSheetStore}=require('../js/modules/character-sheet-store');
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'campaigns/a/characters/c1'),{name:'Arden',class:'Wizard',level:6,userId:'player'}));
  const sdk=require('firebase/firestore'),store=createCharacterSheetStore({...sdk,db:db.dm,auth:{currentUser:{uid:'dm'}}}),identity={name:'Arden',class:'Wizard',level:6};
  const data=M.normalize({rulesChoices:{feats:['custom-ward'],grants:{__dm:{bonusFeats:1}}},notes:'Private note'});
  await store.save({campaignId:'a',characterId:'c1',revision:0,data,identity,previousIdentity:identity});
  const saved=(await assertSucceeds(getDoc(doc(db.player,'campaigns/a/characterSheets/c1')))).data();assert.equal(saved.data.rulesChoices.feats[0],'custom-ward');assert.equal(saved.data.rulesChoices.grants.__dm.bonusFeats,1);
  await assertFails(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:2,updatedBy:'player','data.rulesChoices.grants.__dm.bonusFeats':2}));
  await assertSucceeds(updateDoc(doc(db.player,'campaigns/a/characterSheets/c1'),{revision:2,updatedBy:'player','data.notes':'Player changed notes'}));
  assert.equal((await getDoc(doc(db.player,'campaigns/a/characters/c1'))).data().notes,undefined);await assertFails(getDoc(doc(db.outsider,'campaigns/a/characterSheets/c1')));
 });
 console.log('SUCCESS',count,'campaign policy permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
