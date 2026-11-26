'use strict';
// Authenticated, byte-for-byte copies. Storage rules cannot check live campaign,
// membership and publication together: their cross-service limit is two documents.
// Firestore can enforce all three, including the exact current pin publication.
function createCampaignMapMedia(sdk) {
 const partSize=512*1024, maxSize=50*1024*1024;
 const types=['image/png','image/jpeg','image/webp'];
 const safe=(value,max=100)=>typeof value==='string'&&new RegExp('^[A-Za-z0-9_-]{1,'+max+'}$').test(value);
 const error=(code,message)=>Object.assign(Error(message),{code:'map-media/'+code});
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 function scope(campaignId,mapId,path) {
  if(!safe(campaignId,128)||!safe(mapId)||typeof path!=='string')throw error('scope','Invalid campaign map image.');
  const base=campaignId+'/'+(mapId==='main'?'':mapId+'/');
  if(path.startsWith('campaign-maps/'+base)&&safe(path.slice(('campaign-maps/'+base).length)))return {kind:'map',pinId:''};
  const prefix='campaign-map-place-images/'+base;
  if(path.startsWith(prefix)) {
   const parts=path.slice(prefix.length).split('/');
   if(parts.length===2&&safe(parts[0],128)&&safe(parts[1]))return {kind:'place',pinId:parts[0]};
  }
  throw error('scope','This image does not belong to the selected campaign map.');
 }
 async function reference(campaignId,mapId,path) {
  const bound=scope(campaignId,mapId,path),key=await hash(new TextEncoder().encode(path));
  const segments=['campaigns',campaignId,'campaignMapMedia',mapId,'assets',key];
  return {...bound,ref:sdk.doc(sdk.db,...segments),chunk:index=>sdk.doc(sdk.db,...segments,'mapImageChunks',String(index))};
 }
 function validate(copy,path,bound,limit=maxSize) {
  if(!copy||copy.path!==path||copy.kind!==bound.kind||copy.pinId!==bound.pinId||!types.includes(copy.contentType)
    ||!Number.isInteger(copy.size)||copy.size<1||copy.size>limit||copy.size>maxSize||(copy.kind==='place'&&copy.size>=5*1024*1024)
    ||copy.parts!==Math.ceil(copy.size/partSize)||typeof copy.ready!=='boolean'||!/^[a-f0-9]{64}$/.test(copy.sha256||''))throw error('invalid','The saved map image is invalid. Ask the DM to repair image access.');
  return copy;
 }
 function guard(isCurrent) {
  const uid=sdk.auth.currentUser?.uid;
  const check=()=>{if(!uid||sdk.auth.currentUser?.uid!==uid||!isCurrent())throw error('context','Campaign access changed. Reopen the map.');};
  check();return check;
 }
 function encode(bytes) {
  let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);
 }
 async function normalizeImageBlob(blob,{place=false}={}) {
  const size=Number(blob?.size),reported=typeof blob?.type==='string'?blob.type:'',limit=place?'under 5 MB':'up to 50 MB';
  if(!Number.isFinite(size)||size<1||size>maxSize||place&&size>=5*1024*1024)throw error('invalid','Image size '+(Number.isFinite(size)?size+' bytes':'unknown')+' is outside the size limit ('+limit+').');
  if(types.includes(reported))return blob;
  // Older Storage objects may have no content type or application/octet-stream.
  // Detect only the three supported binary formats; preserve every source byte.
  const head=new Uint8Array(await blob.slice(0,12).arrayBuffer()),at=(...values)=>values.every((value,index)=>head[index]===value);
  const detected=at(137,80,78,71,13,10,26,10)?'image/png':at(255,216,255)?'image/jpeg':at(82,73,70,70)&&head[8]===87&&head[9]===69&&head[10]===66&&head[11]===80?'image/webp':'';
  if(!detected)throw error('invalid','Unsupported image type '+(reported||'(missing)')+' ('+size+' bytes). Use PNG, JPEG or WebP within the size limit ('+limit+').');
  return new Blob([blob],{type:detected});
 }
 async function ensure({campaignId,mapId='main',path,blob,isCurrent=()=>true,onProgress=()=>{}}) {
  const check=guard(isCurrent),bound=await reference(campaignId,mapId,path);check();
  const snapshot=await sdk.getDoc(bound.ref);check();
  if(snapshot.exists()&&validate(snapshot.data(),path,bound).ready)return;
  if(!blob)blob=await sdk.getBlob(sdk.ref(sdk.storage,path),bound.kind==='place'?5*1024*1024:maxSize);
  check();
  blob=await normalizeImageBlob(blob,{place:bound.kind==='place'});check();
  const bytes=new Uint8Array(await blob.arrayBuffer());check();
  const sha256=await hash(bytes);check();
  const copy={path,kind:bound.kind,pinId:bound.pinId,contentType:blob.type,size:bytes.length,parts:Math.ceil(bytes.length/partSize),sha256,ready:false};
  const ready=await sdk.runTransaction(sdk.db,async tx=>{
   const previous=await tx.get(bound.ref);check();
   if(previous.exists()) {
    const value=validate(previous.data(),path,bound);
    if(Object.keys(copy).some(key=>key!=='ready'&&copy[key]!==value[key]))throw error('conflict','This map image copy differs from its original. Choose a new upload.');
    return value.ready;
   }
   tx.set(bound.ref,copy);return false;
  });check();if(ready)return;
  // Four chunks fit both the 4 MiB emulator transport and Firestore's 10 MiB limit.
  for(let start=0;start<copy.parts;start+=4) {
   check();await sdk.runTransaction(sdk.db,async tx=>{
    const previous=await tx.get(bound.ref);check();
    const value=validate(previous.data(),path,bound);
    if(value.sha256!==copy.sha256)throw error('conflict','The map image copy changed. Refresh before repairing it.');
    if(value.ready)return;
    for(let i=start;i<Math.min(start+4,copy.parts);i++)tx.set(bound.chunk(i),{data:encode(bytes.subarray(i*partSize,Math.min((i+1)*partSize,bytes.length)))});
   });check();onProgress(Math.min(start+4,copy.parts),copy.parts);
  }
  check();await sdk.runTransaction(sdk.db,async tx=>{const previous=await tx.get(bound.ref);check();if(validate(previous.data(),path,bound).sha256!==copy.sha256)throw error('conflict','The map image copy changed. Refresh before repairing it.');tx.set(bound.ref,{...copy,ready:true});});check();
 }
 async function load({campaignId,mapId='main',path,limit=maxSize,isCurrent=()=>true}) {
  const check=guard(isCurrent),bound=await reference(campaignId,mapId,path);check();
  const snapshot=await sdk.getDoc(bound.ref);check();
  if(!snapshot.exists())throw error('missing','Ask the DM to use Repair image access in Manage map, then refresh.');
  const copy=validate(snapshot.data(),path,bound,limit);
  if(!copy.ready)throw error('incomplete','Ask the DM to finish Repair image access in Manage map, then refresh.');
  const parts=[];
  for(let start=0;start<copy.parts;start+=4) {
   const group=await Promise.all(Array.from({length:Math.min(4,copy.parts-start)},async(_,offset)=>{
    check();const index=start+offset,row=await sdk.getDoc(bound.chunk(index));check();
    const data=row.exists()?row.data().data:null;
    if(typeof data!=='string'||!data.length||data.length>699052||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw error('invalid','The map image copy is incomplete. Ask the DM to repair image access.');
    const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    if(bytes.length!==Math.min(partSize,copy.size-index*partSize)||encode(bytes)!==data)throw error('invalid','The map image copy is damaged. Ask the DM to repair image access.');
    return bytes;
   }));check();parts.push(...group);
  }
  const blob=new Blob(parts,{type:copy.contentType}),digest=await hash(await blob.arrayBuffer());check();
  if(digest!==copy.sha256)throw error('invalid','The map image copy differs from its checksum. Ask the DM to repair image access.');
  return blob;
 }
 // Repair verifies bytes, rather than trusting ready metadata. Missing/incomplete
 // copies can resume in place; finalized damaged copies need a fresh immutable key.
 async function repair({campaignId,mapId='main',path,isCurrent=()=>true,onProgress=()=>{},validateImage}){
  const check=guard(isCurrent),bound=await reference(campaignId,mapId,path);check();let problem;
  const decoded=async blob=>{if(validateImage)try{await validateImage(blob);}catch{throw error('decode','The image bytes could not be decoded. Replace this picture or upload a valid PNG, JPEG or WebP original again.');}check();};
  try{const blob=await load({campaignId,mapId,path,isCurrent});await decoded(blob);check();return {path,status:'verified',size:blob.size,publishRequired:false};}
  catch(error){check();if(error.code==='permission-denied'||error.code==='unauthenticated'||error.code==='map-media/context'||error.code==='map-media/scope')throw error;problem=error;}
  let blob;try{blob=await sdk.getBlob(sdk.ref(sdk.storage,path),bound.kind==='place'?5*1024*1024:maxSize);check();}
  catch(error){check();throw Object.assign(error,{message:'The player copy could not be verified ('+(problem.code||'read failed')+'), and the original file could not be read ('+(error.code||'read failed')+'). Replace this picture or upload its original again.'});}
  blob=await normalizeImageBlob(blob,{place:bound.kind==='place'});await decoded(blob);check();
  if(problem.code==='map-media/missing'||problem.code==='map-media/incomplete'){
   try{await ensure({campaignId,mapId,path,blob,isCurrent,onProgress});await load({campaignId,mapId,path,isCurrent});check();return {path,status:'repaired',size:blob.size,publishRequired:false};}
   catch(error){check();if(!['map-media/invalid','map-media/conflict'].includes(error.code))throw error;}
  }
  const replacement=path.slice(0,path.lastIndexOf('/')+1)+crypto.randomUUID();
  await sdk.uploadBytes(sdk.ref(sdk.storage,replacement),blob,{contentType:blob.type});check();
  await ensure({campaignId,mapId,path:replacement,blob,isCurrent,onProgress});await load({campaignId,mapId,path:replacement,isCurrent});check();
  return {path:replacement,previousPath:path,status:'rebuilt',size:blob.size,publishRequired:true};
 }
 return {scope,reference,normalizeImageBlob,ensure,load,repair,partSize,maxSize};
}
if(typeof module!=='undefined')module.exports={createCampaignMapMedia};
