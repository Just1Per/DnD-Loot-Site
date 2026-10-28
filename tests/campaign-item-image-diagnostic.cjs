const {test}=require('node:test'),assert=require('node:assert/strict');
const ready=import('../scripts/diagnose-campaign-item-images.mjs');
const options={project:'demo-vault-test',bucket:'demo-source',archiveBucket:'demo-archive',campaignName:'PRIVATE_CAMPAIGN',itemName:'PRIVATE_ITEM'};
function fixture(){
 const reads=[],objects=new Set(['demo-source/dnd-item-images/PRIVATE_ITEM-red-2.png']);
 const port={
  findCampaigns:async()=>[{id:'campaign',ownerId:'owner'}],
  findItems:async()=>[{id:'copy',rootItemId:'PRIVATE_ITEM',imageBaseId:'PRIVATE_ITEM-red-2',imageUrl:'https://firebasestorage.googleapis.com/v0/b/demo-source/o/dnd-item-images%2FPRIVATE_ITEM-red-2.png?token=SECRET'}],
  readRoot:async()=>({catalogueStatus:'approved-v1'}),readRegistry:async()=>({status:'generated',path:'dnd-item-images/PRIVATE_ITEM-red-2.png'}),
  findArchives:async()=>[],objectMetadata:async(bucket,object)=>{reads.push([bucket,object]);return {exists:objects.has(bucket+'/'+object)}}
 };
 return {port,reads,objects};
}
test('read-only image diagnostic distinguishes exact asset, variant and publication registry without exposing values',async()=>{
 const {diagnoseCampaignItemImages}=await ready,{port,reads}=fixture();
 const result=await diagnoseCampaignItemImages(options,port);
 assert.equal(result.productionWrites,0);assert.equal(result.readOnly,true);
 assert.equal(result.matches[0].rootRecord,'approved');assert.deepEqual(result.matches[0].fallbacks,[{exists:true,publishedForPlayers:true},{exists:false,publishedForPlayers:false}]);
 assert.deepEqual(result.matches[0].direct,{kind:'configured-bucket-object',exists:true});
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE|SECRET|token|demo-source|demo-archive/);assert.equal(reads.length,3);
});
test('retired/missing shared art with preserved private bytes is reported without copying or publication',async()=>{
 const {diagnoseCampaignItemImages}=await ready,{port,objects}=fixture();objects.clear();
 port.readRoot=async()=>null;port.readRegistry=async()=>null;
 const privatePath='private-item-library-images/owner/private/digest';objects.add('demo-archive/'+privatePath);
 port.findArchives=async()=>[{assets:[{bucket:'demo-archive',privatePath}]}];
 const result=await diagnoseCampaignItemImages(options,port),row=result.matches[0];
 assert.equal(row.rootRecord,'missing');assert.ok(row.fallbacks.every(f=>!f.exists&&!f.publishedForPlayers));assert.equal(row.existingArchiveAssets,1);assert.equal(result.productionWrites,0);
});
test('external URLs and unconfigured/private foreign assets are never fetched or probed',async()=>{
 const {diagnoseCampaignItemImages}=await ready,{port,reads}=fixture();
 port.findItems=async()=>[{id:'copy',imageUrl:'https://external.invalid/PRIVATE?token=SECRET',artwork:{status:'none'},archivedImage:{path:'foreign'}}];
 port.findArchives=async()=>[{assets:[{bucket:'foreign-bucket',privatePath:'private-item-library-images/owner/a/b'},{bucket:'demo-archive',privatePath:'private-item-library-images/another/a/b'}]}];
 const result=await diagnoseCampaignItemImages(options,port),row=result.matches[0];
 assert.deepEqual(row.direct,{kind:'external-not-checked'});assert.equal(row.artworkDisabled,true);assert.equal(row.privateArchiveReference,true);assert.equal(row.unconfiguredArchiveAssets,2);
 assert.ok(reads.every(([bucket,object])=>bucket==='demo-source'&&object.startsWith('dnd-item-images/')));
});
test('invalid scope and ambiguous/deleted campaigns stop without image reads',async()=>{
 const {diagnoseCampaignItemImages}=await ready;
 for(const patch of [{project:'bad'},{bucket:'bad/bucket'},{campaignName:''},{itemName:''}]){
  let read=false;await assert.rejects(diagnoseCampaignItemImages({...options,...patch},{findCampaigns:async()=>{read=true;return []}}));assert.equal(read,false);
 }
 for(const campaigns of [[],[{id:'a',ownerId:'o'},{id:'b',ownerId:'o'}],[{id:'a',ownerId:'o',deletedAt:1}]]){
  const {port,reads}=fixture();port.findCampaigns=async()=>campaigns;await assert.rejects(diagnoseCampaignItemImages(options,port));assert.equal(reads.length,0);
 }
});
test('metadata authorization failures remain failures rather than reports claiming missing artwork',async()=>{
 const {diagnoseCampaignItemImages}=await ready,{port}=fixture();port.objectMetadata=async()=>{throw Error('Synthetic read denied')};
 await assert.rejects(diagnoseCampaignItemImages(options,port),/read denied/);
});
