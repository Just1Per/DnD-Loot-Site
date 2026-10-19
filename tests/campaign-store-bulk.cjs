const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCampaignStore}=require('../js/modules/campaign-store');

function harness(){
 const docs=new Map([
  ['campaigns/a',{ownerId:'dm',inventoryVersion:2}],
  ['campaigns/a/members/dm',{status:'active',role:'dm'}],
  ['campaigns/a/items/a',{name:'A',campaignId:'a',visible:false,lootMode:'dm'}],
  ['campaigns/a/items/b',{name:'B',campaignId:'a',visible:true,lootMode:'dm'}],
  ['campaigns/a/supply/a',{capacity:1,claimed:0,unlimited:false,revision:1,updatedAt:1}],
  ['campaigns/a/supply/b',{capacity:3,claimed:1,unlimited:false,revision:4,updatedAt:1}]
 ]);
 const snap=path=>({exists:()=>docs.has(path),data:()=>docs.get(path)});
 const sdk={
  auth:{currentUser:{uid:'dm'}},db:{},
  doc:(_, ...p)=>p.join('/'),collection:(_, ...p)=>p.join('/'),
  getDoc:async path=>snap(path),
  getDocs:async path=>{
   const prefix=typeof path==='string'?path:(path?.path||'');
   return {docs:[...docs].filter(([k])=>k.startsWith(prefix+'/')&&k.split('/').length===prefix.split('/').length+1).map(([k,v])=>({id:k.split('/').at(-1),data:()=>v}))};
  },
  query:x=>x,where:()=>null,limit:()=>null,orderBy:()=>null,startAfter:()=>null,documentId:()=>null,
  runTransaction:async(_,work)=>{const pending=[];const result=await work({get:async path=>snap(path),set:(path,data)=>pending.push([path,structuredClone(data)])});for(const [path,data]of pending)docs.set(path,data);return result;},
  increment:n=>({__inc:n}),
  writeBatch:()=>{const updates=[];return {update:(path,patch)=>updates.push([path,patch]),commit:async()=>{for(const [path,patch] of updates){const old=docs.get(path)||{},next={...old};for(const [k,v] of Object.entries(patch))next[k]=v&&typeof v==='object'&&'__inc' in v?(Number(old[k])||0)+v.__inc:v;docs.set(path,next);}}}}
 };
 return {docs,store:createCampaignStore(sdk)};
}
test('DM bulk player-loot policy makes every item visible and player lootable',async()=>{
 const {docs,store}=harness();const r=await store('vaultBulkItemPolicy',{campaignId:'a',mode:'player-loot'});assert.equal(r.changed,2);
 for(const id of ['a','b']){const item=docs.get('campaigns/a/items/'+id);assert.equal(item.visible,true);assert.equal(item.lootMode,'player');}
});
test('DM bulk off policy hides all items and returns them to DM assignment',async()=>{
 const {docs,store}=harness();await store('vaultBulkItemPolicy',{campaignId:'a',mode:'dm-only'});
 for(const id of ['a','b']){const item=docs.get('campaigns/a/items/'+id);assert.equal(item.visible,false);assert.equal(item.lootMode,'dm');}
});
test('DM bulk unlimited preserves stock counts while making all supplies unlimited',async()=>{
 const {docs,store}=harness();await store('vaultBulkItemPolicy',{campaignId:'a',mode:'unlimited'});
 assert.equal(docs.get('campaigns/a/supply/a').unlimited,true);assert.equal(docs.get('campaigns/a/supply/a').capacity,1);assert.equal(docs.get('campaigns/a/supply/a').claimed,0);assert.equal(docs.get('campaigns/a/supply/a').revision,2);
 assert.equal(docs.get('campaigns/a/supply/b').unlimited,true);assert.equal(docs.get('campaigns/a/supply/b').capacity,3);assert.equal(docs.get('campaigns/a/supply/b').claimed,1);assert.equal(docs.get('campaigns/a/supply/b').revision,5);
});

test('editing an imported private-library copy preserves its provenance and private artwork references',async()=>{
 const {docs,store}=harness(),item=docs.get('campaigns/a/items/a');
 item.librarySource={ownerId:'dm',entryId:'reviewed-template',sourceSha256:'a'.repeat(64),planSha256:'b'.repeat(64)};
 item.libraryImages=[{path:'campaign-catalogue-images/a/'+'c'.repeat(64)+'/'+'d'.repeat(64),sha256:'d'.repeat(64)}];item.archivedImage=item.libraryImages[0];
 const before=structuredClone(item);
 await store('vaultSaveCampaignItem',{campaignId:'a',itemId:'a',stockRevision:1,item:{...item,name:'Edited independent copy'},remaining:1,visible:false});
 const saved=docs.get('campaigns/a/items/a');assert.deepEqual(saved.librarySource,before.librarySource);assert.deepEqual(saved.libraryImages,before.libraryImages);assert.deepEqual(saved.archivedImage,before.archivedImage);assert.equal(saved.name,'Edited independent copy');
 assert.equal([...docs.keys()].some(key=>key.startsWith('privateItemLibraries/')),false);
});
