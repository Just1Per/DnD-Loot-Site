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
  const stores=Object.fromEntries(Object.keys(db).map(uid=>[uid,createCampaignInformationStore({...sdk,db:db[uid],auth:{currentUser:{uid}}})]));
  const source={campaignId:'a',kind:'world',id:'north',revision:0,input:{title:'The Northern Kingdom',summary:'Snow-covered roads',content:'The northern roads lead to an ancient city.',privateNotes:'The queen is an impostor',data:{category:'Region',connections:'Secret tunnel',imagePath:'campaign-world-images/a/north/private-map'}}};
  await workspace.save(source);
  const publish={campaignId:'a',id:'north',sourceRevision:1,publishedRevision:0};
  await check('DM publishes only saved player text; active members can query snapshots',async()=>{
   await assertSucceeds(stores.dm.publish(publish));
   const [row]=await assertSucceeds(stores.player.list('a'));
   assert.equal(row.content,source.input.content);assert.equal(row.category,'Region');
   assert.equal(row.privateNotes,undefined);assert.equal(row.data,undefined);assert.ok(!JSON.stringify(row).includes('impostor'));assert.ok(!JSON.stringify(row).includes('private-map'));
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/worldEntries/north')));
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/workspaceSecrets/world-north')));
  });
  await check('Unrelated, removed and anonymous accounts cannot read shared information',async()=>{
   for(const uid of ['revoked','admin','outsider'])await assertFails(stores[uid].list('a'));
   await assertFails(sdk.getDocs(sdk.collection(env.unauthenticatedContext().firestore(),'campaigns/a/playerInformation')));
   await assertFails(stores.player.list('b'));
  });
  await check('DM custom World categories publish as plain text without granting player editing or secret access',async()=>{
   const input={...source.input,title:'The Old Faith',data:{...source.input.data,category:'Religion & traditions'}};
   await workspace.save({...source,id:'faith',input});
   await assertSucceeds(stores.dm.publish({campaignId:'a',id:'faith',sourceRevision:1,publishedRevision:0}));
   const row=await assertSucceeds(stores.player.load('a','faith'));
   assert.equal(row.category,'Religion & traditions');assert.equal(row.privateNotes,undefined);
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/worldEntries/faith')));
   await assertFails(sdk.getDoc(sdk.doc(db.player,'campaigns/a/workspaceSecrets/world-faith')));
   await assertFails(sdk.updateDoc(sdk.doc(db.player,'campaigns/a/playerInformation/faith'),{category:'My category'}));
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
   for(const change of [{privateNotes:'Secret'},{imagePath:'private-map'},{content:source.input.privateNotes},{category:'Different category'},{sourceRevision:1}])await assertFails(sdk.setDoc(sdk.doc(db.dm,'campaigns/a/playerInformation/north'),{...row,revision:3,...change}));
  });
  await check('Archive atomically unpublishes; restoring never reveals the entry automatically',async()=>{
   await assertFails(sdk.updateDoc(sdk.doc(db.dm,'campaigns/a/worldEntries/north'),{archived:true,revision:3}));
   await workspace.save({...source,revision:2,input:{...source.input,archived:true}});
   assert.equal(await stores.player.load('a','north'),null);
   await assert.rejects(stores.dm.publish({...publish,sourceRevision:3}),/active entries/);
   await workspace.save({...source,revision:3,input:source.input});
   assert.equal(await stores.player.load('a','north'),null);
  });
  await check('Unpublishing keeps source records; membership revocation ends reads',async()=>{
   await stores.dm.publish({...publish,sourceRevision:4});
   await stores.dm.unpublish({...publish,publishedRevision:1});
   assert.ok((await sdk.getDoc(sdk.doc(db.dm,'campaigns/a/worldEntries/north'))).exists());
   assert.equal(await stores.player.load('a','north'),null);
   await stores.dm.publish({...publish,sourceRevision:4});
   await env.withSecurityRulesDisabled(context=>sdk.updateDoc(sdk.doc(context.firestore(),'campaigns/a/members/player'),{status:'inactive'}));
   await assertFails(stores.player.list('a'));
  });
  await check('One-action World release publishes the saved image atomically and retains private notes',async()=>{
   const input={title:'Harbour',summary:'',content:'A city by the sea',privateNotes:'Secret keeper',data:{category:'Location',journalImage:{path:'campaign-journal-images/a/world/harbour/first',alt:'Harbour lights',caption:'At dusk',uploadedBy:'dm',uploadedAt:1}}};
   await workspace.save({campaignId:'a',kind:'world',id:'harbour',revision:0,input});
   const result=await assertSucceeds(stores.dm.publish({campaignId:'a',id:'harbour',sourceRevision:1,includeImage:true}));
   assert.equal(result.image.path,input.data.journalImage.path);assert.ok(!JSON.stringify(result).includes('Secret keeper'));
   await assertFails(stores.outsider.publish({campaignId:'a',id:'harbour',sourceRevision:1,includeImage:true}));
  });
  console.log('SUCCESS',count,'campaign information permission checks');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
