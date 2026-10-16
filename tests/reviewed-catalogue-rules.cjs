const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCampaignStore}=require('../js/modules/campaign-store');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 let n=0;const check=async(name,work)=>{await work();console.log('PASS',name);n++;};
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{
   for(const [p,data] of Object.entries({
    'users/admin':{role:['admin']},'campaigns/a':{ownerId:'owner',inventoryVersion:2},'campaigns/b':{ownerId:'other',inventoryVersion:2},
    'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/removed':{status:'inactive',role:'dm'},
    'items/reviewed':{name:'Synthetic shared item',catalogueStatus:'approved-v1',edition:'2024',description:'Original test text',artwork:{status:'none'},rights:{license:'ORIGINAL',attribution:'Test author'}},
    'items/unreviewed':{name:'Unreviewed original'},'items/catalog_meta':{_type:'catalog-meta',version:1},
    'campaigns/a/catalogueArchives/original':{original:{name:'Private original'}},
    'campaigns/a/items/private':{campaignId:'a',name:'Private original',visible:false,highlighted:false,lootMode:'dm'}
   }))await sdk.setDoc(sdk.doc(ctx.firestore(),p),data);
  });
  const db=Object.fromEntries(['owner','dm','player','removed','other','admin'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));db.anon=env.unauthenticatedContext().firestore();
  await check('anonymous and other DMs can read only reviewed root items and metadata',async()=>{
   for(const uid of ['anon','owner','dm','player','removed','other']){await assertSucceeds(sdk.getDoc(sdk.doc(db[uid],'items/reviewed')));await assertFails(sdk.getDoc(sdk.doc(db[uid],'items/unreviewed')));await assertSucceeds(sdk.getDoc(sdk.doc(db[uid],'items/catalog_meta')));}
   await assertSucceeds(sdk.getDoc(sdk.doc(db.admin,'items/unreviewed')));
  });
  await check('unfiltered queries fail; the publication-marker query remains available',async()=>{
   for(const uid of ['anon','dm','other']){await assertFails(sdk.getDocs(sdk.collection(db[uid],'items')));const records=await assertSucceeds(sdk.getDocs(sdk.query(sdk.collection(db[uid],'items'),sdk.where('catalogueStatus','==','approved-v1'))));assert.deepEqual(records.docs.map(doc=>doc.id),['reviewed']);}
   await assertSucceeds(sdk.getDocs(sdk.collection(db.admin,'items')));
  });
  await check('DM import preserves approved mechanics/attribution and cannot import unreviewed roots',async()=>{
   const call=createCampaignStore({...sdk,db:db.dm,auth:{currentUser:{uid:'dm'}}});
   const copied=await call('vaultCopyCampaignItem',{campaignId:'a',source:'root',sourceId:'reviewed'});const item=(await sdk.getDoc(sdk.doc(db.dm,'campaigns/a/items',copied.itemId))).data();
   assert.equal(item.visible,false);assert.equal(item.rights.attribution,'Test author');assert.equal(item.artwork.status,'none');assert.equal(item.imageBaseId,'');
   assert.equal(item.edition,'2024');
   await assert.rejects(call('vaultCopyCampaignItem',{campaignId:'a',source:'root',sourceId:'unreviewed'}));
  });
  await check('original archives are DM-only, including against unrelated global administrators',async()=>{
   for(const uid of ['owner','dm'])await assertSucceeds(sdk.getDoc(sdk.doc(db[uid],'campaigns/a/catalogueArchives/original')));
   for(const uid of ['anon','player','removed','other','admin'])await assertFails(sdk.getDoc(sdk.doc(db[uid],'campaigns/a/catalogueArchives/original')));
   for(const uid of ['owner','dm','admin'])await assertFails(sdk.setDoc(sdk.doc(db[uid],'campaigns/a/catalogueArchives/forged'),{original:{}}));
  });
  await check('a normal DM cannot grant a public approval marker or read another campaign private item',async()=>{
   await assertFails(sdk.setDoc(sdk.doc(db.dm,'items/forged'),{name:'Forged',catalogueStatus:'approved-v1'}));
   await assertFails(sdk.getDoc(sdk.doc(db.other,'campaigns/a/items/private')));
  });
  console.log('SUCCESS',n,'reviewed catalogue permission groups');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
