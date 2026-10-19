const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCampaignWorkspaceStore}=require('../js/modules/campaign-workspace-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{
   for(const [p,d] of Object.entries({'campaigns/a':{ownerId:'owner'},'campaigns/b':{ownerId:'other'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'},'users/admin':{role:['admin']}}))await sdk.setDoc(sdk.doc(c.firestore(),p),d);
  });
  const store=uid=>createCampaignWorkspaceStore({...sdk,db:env.authenticatedContext(uid).firestore(),auth:{currentUser:{uid}}});
  const args={campaignId:'a',kind:'world',id:'religion',name:'Religion'};
  await assertSucceeds(store('dm').addCategory(args));
  await assertSucceeds(store('dm').addCategory(args));
  assert.equal((await store('owner').listCategories('a','world')).length,1);
  assert.equal((await store('dm').listCategories('a','chapter')).length,0);
  assert.equal((await store('dm').list('a','world')).length,0);
  await assertSucceeds(store('owner').addCategory({...args,id:'journeys',kind:'chapter',name:'Journeys'}));
  for(const uid of ['player','revoked','outsider','admin']){
   await assertFails(store(uid).listCategories('a','world'));
   await assertFails(store(uid).addCategory({...args,id:'forged-'+uid}));
  }
  await assertFails(store('dm').listCategories('b','world'));
  await assertFails(store('dm').addCategory({...args,campaignId:'b'}));
  const db=env.authenticatedContext('dm').firestore();
  for(const data of [{kind:'creature',name:'Invalid',createdBy:'dm',createdAt:1},{kind:'world',name:'x'.repeat(81),createdBy:'dm',createdAt:1},{kind:'world',name:'Valid',createdBy:'other',createdAt:1},{kind:'world',name:'Valid',createdBy:'dm',createdAt:1,secret:'extra'}])await assertFails(sdk.setDoc(sdk.doc(db,'campaigns/a/workspaceCategories/invalid'),data));
  await assertFails(sdk.updateDoc(sdk.doc(db,'campaigns/a/workspaceCategories/religion'),{name:'Overwrite'}));
  await assertFails(sdk.deleteDoc(sdk.doc(db,'campaigns/a/workspaceCategories/religion')));
  await assertFails(sdk.getDocs(sdk.collection(env.unauthenticatedContext().firestore(),'campaigns/a/workspaceCategories')));
  await assert.rejects(store('dm').addCategory({...args,id:'cancelled',isCurrent:()=>false}),/access changed/);
  console.log('PASS Empty categories persist without fake entries; retry IDs, campaign/kind scope, DM-only access, bounded schema and revoked requests');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
