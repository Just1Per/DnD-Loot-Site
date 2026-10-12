const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCampaignInformationStore}=require('../js/modules/campaign-information-store');
const {createCampaignWorkspaceStore}=require('../js/modules/campaign-workspace-store');

(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 let count=0;const check=async(name,fn)=>{await fn();console.log('PASS',name);count++;};
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{
   for(const [path,data]of Object.entries({'campaigns/a':{name:'Storm Coast',ownerId:'owner'},'campaigns/b':{name:'Other',ownerId:'other'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'},'users/admin':{role:['admin']}}))await sdk.setDoc(sdk.doc(context.firestore(),path),data);
  });
  const db=Object.fromEntries(['dm','owner','player','revoked','admin','outsider'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
  const workspace=createCampaignWorkspaceStore({...sdk,db:db.dm,auth:{currentUser:{uid:'dm'}}});
  const stores=Object.fromEntries(Object.keys(db).map(uid=>[uid,createCampaignInformationStore({...sdk,db:db[uid],auth:{currentUser:{uid}}},'creature')]));
  const source={campaignId:'a',kind:'creature',id:'north',revision:0,input:{title:'Captain Elowen',summary:'Harbor captain',content:'Elowen welcomes travellers to the harbor.',privateNotes:'The queen is an impostor',data:{category:'Story NPC',hp:99,goals:'Hidden betrayal',connections:'Secret tunnel',imagePath:'campaign-world-images/a/north/private-map'}}};
  await workspace.save(source);
  const publish={campaignId:'a',id:'north',sourceRevision:1,publishedRevision:0};
  await check('DM publishes only saved player text; active members can query snapshots',async()=>{
   await assertSucceeds(stores.dm.publish(publish));
   const [row]=await assertSucceeds(stores.player.list('a'));
   assert.equal(row.content,source.input.content);assert.equal(row.category,'Story NPC');
   assert.equal(row.privateNotes,undefined);assert.equal(row.data,undefined);assert.ok(!JSON.stringify(row).includes('impostor'));assert.ok(!JSON.stringify(row).includes('private-map'));
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/creatures/north')));
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/workspaceSecrets/creature-north')));
  });
  await check('Unrelated, removed and anonymous accounts cannot read shared information',async()=>{
   for(const uid of ['revoked','admin','outsider'])await assertFails(stores[uid].list('a'));
   await assertFails(sdk.getDocs(sdk.collection(env.unauthenticatedContext().firestore(),'campaigns/a/playerNPCs')));
   await assertFails(stores.player.list('b'));
  });
  await check('Player writes, global admin privileges and cross-campaign publication are denied',async()=>{
   for(const uid of ['player','revoked','admin','outsider'])await assertFails(stores[uid].publish({...publish,publishedRevision:1}));
   await assertFails(stores.dm.publish({...publish,campaignId:'b'}));
   await assertFails(stores.player.unpublish({...publish,publishedRevision:1}));
  });
  await check('Saved edits stay private until explicitly shared; stale versions cannot overwrite',async()=>{
   await workspace.save({...source,revision:1,input:{...source.input,content:'The party has discovered the old city.'}});
   assert.equal((await stores.player.load('a','north')).content,source.input.content);
   await assert.rejects(stores.dm.publish({...publish,publishedRevision:1}),/another window/);
   await assertSucceeds(stores.owner.publish({...publish,sourceRevision:2,publishedRevision:1}));
   assert.equal((await stores.player.load('a','north')).content,'The party has discovered the old city.');
   await assert.rejects(stores.dm.publish({...publish,sourceRevision:2,publishedRevision:1}),/another window/);
  });
  await check('Rules reject injected secrets, mismatched source text and unsupported extra fields',async()=>{
   const row=await stores.dm.load('a','north');delete row.id;
   for(const change of [{privateNotes:'Secret'},{imagePath:'private-map'},{content:source.input.privateNotes},{sourceRevision:1}])await assertFails(sdk.setDoc(sdk.doc(db.dm,'campaigns/a/playerNPCs/north'),{...row,revision:3,...change}));
  });
  await check('Archive atomically unpublishes; restoring never reveals the entry automatically',async()=>{
   await assertFails(sdk.updateDoc(sdk.doc(db.dm,'campaigns/a/creatures/north'),{archived:true,revision:3}));
   await workspace.save({...source,revision:2,input:{...source.input,archived:true}});
   assert.equal(await stores.player.load('a','north'),null);
   await assert.rejects(stores.dm.publish({...publish,sourceRevision:3}),/active entries/);
   await workspace.save({...source,revision:3,input:source.input});
   assert.equal(await stores.player.load('a','north'),null);
  });
  await check('Unpublishing keeps source records; membership revocation ends reads',async()=>{
   await stores.dm.publish({...publish,sourceRevision:4});
   await stores.dm.unpublish({...publish,publishedRevision:1});
   assert.ok((await sdk.getDoc(sdk.doc(db.dm,'campaigns/a/creatures/north'))).exists());
   assert.equal(await stores.player.load('a','north'),null);
   await stores.dm.publish({...publish,sourceRevision:4});
   await env.withSecurityRulesDisabled(context=>sdk.updateDoc(sdk.doc(context.firestore(),'campaigns/a/members/player'),{status:'inactive'}));
   await assertFails(stores.player.list('a'));
  });
  await check('Changing an NPC to a monster atomically hides it; returning to Story NPC does not reveal it',async()=>{
    const input={...source.input,data:{...source.input.data,category:'Monster'}};
    await assertFails(sdk.updateDoc(sdk.doc(db.dm,'campaigns/a/creatures/north'),{'data.category':'Monster',revision:5}));
    await workspace.save({...source,revision:4,input});
    assert.equal(await stores.owner.load('a','north'),null);
    await assert.rejects(stores.dm.publish({...publish,sourceRevision:5}),/Only Story NPCs/);
    await workspace.save({...source,revision:5,input:source.input});
    assert.equal(await stores.owner.load('a','north'),null);
  });
  console.log('SUCCESS',count,'NPC catalogue permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
