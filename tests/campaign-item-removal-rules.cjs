const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');const {createCampaignStore}=require('../js/modules/campaign-store');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{for(const [p,d] of Object.entries({'campaigns/a':{ownerId:'owner',inventoryVersion:2},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/members/player':{status:'active',role:'player'},'users/admin':{role:['admin']},'items/root':{name:'Original template'},'campaigns/b':{ownerId:'other'},'campaigns/b/items/copy':{name:'Other copy'},'campaigns/a/items/copy':{name:'Imported potion',visible:false,rootItemId:'root'},'campaigns/a/supply/copy':{claimed:0,revision:1}}))await sdk.setDoc(sdk.doc(c.firestore(),p),d);});
 const contexts=Object.fromEntries(['owner','dm','player','admin','other'].map(uid=>[uid,env.authenticatedContext(uid)]));const stores=Object.fromEntries(Object.entries(contexts).map(([uid,c])=>[uid,createCampaignStore({...sdk,db:c.firestore(),auth:{currentUser:{uid}}})]));
 for(const uid of ['player','admin','other'])await assertFails(stores[uid]('vaultDeleteCampaignItem',{campaignId:'a',itemId:'copy'}));
 await assertFails(stores.dm('vaultDeleteCampaignItem',{campaignId:'b',itemId:'copy'}));
 await assertSucceeds(stores.dm('vaultDeleteCampaignItem',{campaignId:'a',itemId:'copy'}));
 await env.withSecurityRulesDisabled(async c=>{assert.equal((await sdk.getDoc(sdk.doc(c.firestore(),'items/root'))).exists(),true);assert.equal((await sdk.getDoc(sdk.doc(c.firestore(),'campaigns/b/items/copy'))).exists(),true);assert.equal((await sdk.getDoc(sdk.doc(c.firestore(),'campaigns/a/items/copy'))).exists(),false);assert.equal((await sdk.getDoc(sdk.doc(c.firestore(),'campaigns/a/supply/copy'))).exists(),false);});
 console.log('PASS Actual rules allow campaign DM removal and deny player/admin/foreign-campaign removal; shared template and other copies remain');
}finally{await env.cleanup();}})().catch(error=>{console.error(error);process.exitCode=1});
