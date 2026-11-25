'use strict';
/** Copy private map drafts with newly scoped, immutable image paths. Never publish. */
function createCampaignMapTransfer(sdk){
 const factory=typeof createCampaignMapStore==='function'?createCampaignMapStore:require('./campaign-map-store').createCampaignMapStore;
 const media=(typeof createCampaignMapMedia==='function'?createCampaignMapMedia:require('./campaign-map-media').createCampaignMapMedia)(sdk);
 async function copy({campaignId,sourceMapId,source,sourceMapRevision=0,destinationMapId,selectedIds,clone=false,title='',includePictures=true,replacement,preparePreview,isCurrent=()=>true,onProgress=()=>{}}){
  const uid=sdk.auth.currentUser?.uid,check=()=>{if(!uid||sdk.auth.currentUser?.uid!==uid||!isCurrent())throw Error('Campaign access changed. Reopen the map.');};check();
  if(!Number.isInteger(sourceMapRevision)||sourceMapRevision<0||!Number.isInteger(source?.revision??0)||(source?.revision??0)<0)throw Error('Invalid source revision.');
  if(sourceMapId===destinationMapId)throw Error('Choose another map.');
  if(typeof clone!=='boolean'||typeof includePictures!=='boolean')throw Error('Choose a supported copy option.');
  const from=factory(sdk,{mapId:sourceMapId}),to=factory(sdk,{mapId:destinationMapId}),snapshot=from.normalizeDraft(campaignId,structuredClone(source));
  if(!Array.isArray(selectedIds)||new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!snapshot.pins.some(pin=>pin.id===id)))throw Error('Choose places from this source map.');
  const pins=snapshot.pins.filter(pin=>selectedIds.includes(pin.id));if(!clone&&!pins.length)throw Error('Select at least one place.');
  const [published,saved]=await Promise.all([to.load(campaignId,{includeDeleted:true}),to.loadDraft(campaignId)]);check();
  if(published?.deletedAt)throw Error('The destination map was deleted. Choose another map.');
  if(saved&&(saved.sourceRevision||0)!==(published?.revision||0))throw Error('The destination draft is behind its publication. Refresh and save that map before copying places.');
  if(clone&&(published||saved))throw Error('The destination map already exists. Start a new clone.');
  const existing=saved||(!clone&&published?{title:published.title,imagePath:published.imagePath,...(published.previewPath?{previewPath:published.previewPath}:{}),pins:(await to.listPins(campaignId,published)).map(pin=>({...pin,revealed:true})),revision:0,sourceRevision:published.revision}:null);check();
  if(!clone&&!existing)throw Error('Choose a saved destination map.');
  if((existing?.pins.length||0)+pins.length>100)throw Error('The destination would exceed 100 places. Select fewer places.');
  const next=clone?{title:title.trim(),pins:[]}:structuredClone(existing);
  if(clone&&(!next.title||next.title.length>160))throw Error('Give the copy a name of 1–160 characters.');
  const imageJobs=(clone?1:0)+(includePictures?pins.filter(pin=>pin.picturePath).length:0);let done=0;
  const read=async(path,limit)=>{check();let blob;try{blob=await media.load({campaignId,mapId:sourceMapId,path,limit,isCurrent});}catch(error){check();blob=await sdk.getBlob(sdk.ref(sdk.storage,path),limit);}check();return blob;};
  const upload=async(path,blob,place=false)=>{check();blob=await media.normalizeImageBlob(blob,{place});check();if(!blob||!['image/png','image/jpeg','image/webp'].includes(blob.type)||blob.size<=0||blob.size>(place?5*1024*1024-1:50*1024*1024))throw Error('Choose a supported image within the map/picture size limit.');await sdk.uploadBytes(sdk.ref(sdk.storage,path),blob,{contentType:blob.type});check();await media.ensure({campaignId,mapId:destinationMapId,path,blob,isCurrent});check();return path;};
  if(clone){
   const blob=replacement||await read(snapshot.imagePath,50*1024*1024);next.imagePath=await upload(to.imagePrefix(campaignId)+crypto.randomUUID(),blob);onProgress(++done,imageJobs);
   if(replacement&&preparePreview){const preview=await preparePreview(replacement);check();if(preview)next.previewPath=await upload(to.imagePrefix(campaignId)+crypto.randomUUID(),preview);}
   else if(!replacement&&snapshot.previewPath){try{const preview=await read(snapshot.previewPath,512*1024);next.previewPath=await upload(to.imagePrefix(campaignId)+crypto.randomUUID(),preview);}catch(error){check();/* Original remains usable without an optional overview. */}}
  }
  const usedIds=new Set(next.pins.map(pin=>pin.id));
  for(const pin of pins){
   check();let id=crypto.randomUUID();while(usedIds.has(id))id=crypto.randomUUID();usedIds.add(id);
   const row={...structuredClone(pin),id,revealed:false,picturePath:'',pictureAlt:''};
   if(includePictures&&pin.picturePath){const blob=await read(pin.picturePath,5*1024*1024-1);row.picturePath=await upload(to.picturePrefix(campaignId,id)+crypto.randomUUID(),blob,true);row.pictureAlt=pin.pictureAlt;onProgress(++done,imageJobs);}
   next.pins.push(row);
  }
  check();onProgress(imageJobs,imageJobs);
  const draft=await to.saveDraft({campaignId,input:next,revision:existing?.revision||0,sourceRevision:published?.revision||0,sourceGuard:{mapId:sourceMapId,mapRevision:sourceMapRevision,draftRevision:source.revision||0},isCurrent});check();
  return {mapId:destinationMapId,draft,count:pins.length,private:true};
 }
 return {copy};
}
if(typeof module!=='undefined')module.exports={createCampaignMapTransfer};
