const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,deleteField}=require('firebase/firestore');
const M=require('../js/modules/campaign-appearance');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{
   for(const [path,value]of Object.entries({'campaigns/a':{name:'Coast',ownerId:'owner',dmId:'owner'},'campaigns/b':{name:'Other',ownerId:'other'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'},'users/admin':{role:['admin']},'campaigns/a/characters/c1':{userId:'player',name:'Keep character'},'campaigns/a/members/creator':{role:'dm',status:'active'},'users/creator':{role:['dm']}}))await setDoc(doc(context.firestore(),path),value);
  });
  const db=Object.fromEntries(['owner','dm','player','revoked','admin','outsider','creator'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
  const write=(uid,appearance,campaign='a',extra={})=>updateDoc(doc(db[uid],'campaigns',campaign),{appearance,updatedAt:Date.now(),...extra});
  await assertSucceeds(write('owner',M.preset('ocean',1)));
  assert.equal((await assertSucceeds(getDoc(doc(db.player,'campaigns/a')))).data().appearance.preset,'ocean');
  await assertSucceeds(write('dm',M.preset('horror',2)));
  console.log('PASS Owner/active DM save campaign colours; active players read the shared look');
  for(const uid of ['player','revoked','admin','outsider'])await assertFails(write(uid,M.preset('forest',3)));
  await assertFails(write('dm',M.preset('ocean',1),'b'));await assertFails(getDoc(doc(db.outsider,'campaigns/a')));
  console.log('PASS Players, removed DMs, unrelated campaigns, admins and outsiders cannot change appearance');
  for(const patch of [{primary:'red'},{background:'url(https://example.test)'},{accent:'#fff'},{primary:'#123456;display:none'},{preset:'other'},{schemaVersion:2},{extra:'css'},{revision:2},{revision:4},{revision:3.5}])await assertFails(write('dm',{...M.preset('forest',3),...patch}));
  await assertFails(write('dm',deleteField()));await assertFails(write('dm',M.preset('forest',3),'a',{ownerId:'dm'}));
  console.log('PASS Invalid CSS, schema fields, deleted appearance and stale/skipped revisions fail');
  await assertSucceeds(write('dm',{...M.preset('ocean',3),preset:'custom',primary:'#FFFFFF',background:'#000000',accent:'#12AbEF'}));
  await assertSucceeds(write('dm',M.preset('classic',4)));
  assert.equal((await getDoc(doc(db.owner,'campaigns/a'))).data().name,'Coast');
  assert.equal((await getDoc(doc(db.owner,'campaigns/a/characters/c1'))).data().name,'Keep character');
  console.log('PASS Arbitrary hex colours and Reset to Classic preserve campaign and character records');
  const created={name:'New coast',ownerId:'creator',dmId:'creator',appearance:M.preset('ocean',1)};
  await assertSucceeds(setDoc(doc(db.creator,'campaigns/new'),created));
  await assertFails(setDoc(doc(db.creator,'campaigns/invalid'),{...created,appearance:{...created.appearance,primary:'red'}}));
  console.log('PASS Newly created campaigns validate optional appearance too');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
