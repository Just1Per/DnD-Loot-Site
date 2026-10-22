'use strict';
/** Published map snapshots and a separate DM-only working draft. */
function createCampaignMapStore(sdk){
 const {db,auth,doc,collection,query,where,getDoc,getDocs,runTransaction}=sdk;
 const id=v=>{if(!/^[A-Za-z0-9_-]{1,128}$/.test(v||''))throw Error('Invalid map identifier.');return v;};
 const actor=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
 const mapRef=cid=>doc(db,'campaigns',id(cid),'campaignMaps','main');
 const pinRef=(cid,pid)=>doc(db,'campaigns',id(cid),'campaignMaps','main','pins',id(pid));
 const pinsQuery=(cid,map)=>query(collection(db,'campaigns',id(cid),'campaignMaps','main','pins'),typeof map==='object'&&map.schemaVersion===2?where('publishedRevision','==',map.revision):where('imagePath','==',typeof map==='object'?map.imagePath:map));
 const rows=snapshot=>snapshot.docs.map(row=>({...row.data(),id:row.id}));
 function image(cid,path){if(typeof path!=='string'||!path.startsWith('campaign-maps/'+id(cid)+'/')||!/^[A-Za-z0-9_-]{1,100}$/.test(path.slice(('campaign-maps/'+cid+'/').length)))throw Error('Choose a map image from this campaign.');return path;}
 const check=(uid,isCurrent)=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Campaign access changed. Reopen the map.');};
 async function load(cid){actor();const snapshot=await getDoc(mapRef(cid));return snapshot.exists()?snapshot.data():null;}
 async function listPins(cid,imagePath){actor();return rows(await getDocs(pinsQuery(cid,typeof imagePath==='object'?imagePath:image(cid,imagePath))));}
 function watchMap(cid,next,error){return typeof sdk.onSnapshot==='function'?sdk.onSnapshot(mapRef(cid),snapshot=>next(snapshot.exists()?snapshot.data():null),error):()=>{};}
 function watchPins(cid,imagePath,next,error){return typeof sdk.onSnapshot==='function'?sdk.onSnapshot(pinsQuery(cid,imagePath),snapshot=>next(rows(snapshot)),error):()=>{};}
 async function saveMap({campaignId,title,imagePath,revision,isCurrent=()=>true}){
  const uid=actor();if(typeof title!=='string'||!title.trim()||title.length>160)throw Error('Give the map a name (up to 160 characters).');image(campaignId,imagePath);
  return runTransaction(db,async tx=>{const ref=mapRef(campaignId),old=await tx.get(ref);check(uid,isCurrent);if((old.data()?.revision||0)!==revision)throw Error('The map changed in another window. Copy your changes and reload before saving.');const next={title:title.trim(),imagePath,revision:revision+1,updatedBy:uid,updatedAt:Date.now()};tx.set(ref,next);return next;});
 }
 async function savePin({campaignId,id:pid,input,revision,isCurrent=()=>true}){
  const uid=actor();if(typeof input.name!=='string'||!input.name.trim()||input.name.length>100||typeof input.description!=='string'||input.description.length>2000)throw Error('Add a place name (up to 100 characters) and a description up to 2,000 characters.');
  for(const n of [input.x,input.y])if(!Number.isFinite(n)||n<0||n>100)throw Error('Choose a position on the map.');
  image(campaignId,input.imagePath);
  return runTransaction(db,async tx=>{const map=await tx.get(mapRef(campaignId)),ref=pinRef(campaignId,pid),old=await tx.get(ref);check(uid,isCurrent);
   if(!map.exists()||map.data().imagePath!==input.imagePath)throw Error('The map image changed. Reload before placing pins.');if((old.data()?.revision||0)!==revision)throw Error('This place changed in another window. Copy your text and reload before saving.');
   const next={name:input.name.trim(),description:input.description.trim(),x:input.x,y:input.y,imagePath:input.imagePath,revision:revision+1,updatedBy:uid,updatedAt:Date.now()};tx.set(ref,next);return {...next,id:pid};});
 }
 async function removePin({campaignId,id:pid,revision,isCurrent=()=>true}){const uid=actor();return runTransaction(db,async tx=>{const ref=pinRef(campaignId,pid),old=await tx.get(ref);check(uid,isCurrent);if(!old.exists()||old.data().revision!==revision)throw Error('This place changed. Reload before removing it.');tx.delete(ref);});}
 const markerStyles=['Location','City','Castle','Landmark','Point of interest'];
 function boundary(points,type){
  if(points===undefined||Array.isArray(points)&&points.length===0)return [];
  if(type!=='Region'||!Array.isArray(points)||points.length<3||points.length>12)throw Error('A region boundary needs 3–12 corners.');
  const normalized=points.map(point=>{
   if(!point||typeof point!=='object'||Array.isArray(point)||Object.keys(point).some(key=>!['x','y'].includes(key))||![point.x,point.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100))throw Error('Region corners must be positions between 0 and 100.');
   return {x:point.x,y:point.y};
  });
  if(new Set(normalized.map(p=>p.x+':'+p.y)).size!==normalized.length)throw Error('Use a different position for each region corner.');
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-8&&c.x>=Math.min(a.x,b.x)&&c.x<=Math.max(a.x,b.x)&&c.y>=Math.min(a.y,b.y)&&c.y<=Math.max(a.y,b.y);
  for(let i=0;i<normalized.length;i++)for(let j=i+1;j<normalized.length;j++){
   if(j===i+1||i===0&&j===normalized.length-1)continue;
   const a=normalized[i],b=normalized[(i+1)%normalized.length],c=normalized[j],d=normalized[(j+1)%normalized.length];
   if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))throw Error('Region edges must not cross. Undo a corner or redraw the boundary.');
  }
  const area=Math.abs(normalized.reduce((sum,p,i)=>{const next=normalized[(i+1)%normalized.length];return sum+p.x*next.y-next.x*p.y;},0))/2;
  if(area<0.01)throw Error('Draw an area with at least three distinct corners.');
  return normalized;
 }
 const draftRef=cid=>doc(db,'campaigns',id(cid),'campaignMapDrafts','main');
 async function loadDraft(cid){actor();const row=await getDoc(draftRef(cid));return row.exists()?row.data():null;}
 function normalizeDraft(cid,input){
  if(typeof input.title!=='string'||!input.title.trim()||input.title.length>160)throw Error('Give the map a name (up to 160 characters).');
  image(cid,input.imagePath);
  if(!Array.isArray(input.pins)||input.pins.length>100)throw Error('A map supports up to 100 places.');
  const seen=new Set();
  const pins=input.pins.map(pin=>{
   const pid=id(pin.id);if(seen.has(pid))throw Error('Place identifiers must be unique.');seen.add(pid);
   if(typeof pin.name!=='string'||!pin.name.trim()||pin.name.length>100||typeof pin.description!=='string'||pin.description.length>2000)throw Error('Each place needs a name up to 100 characters and a description up to 2,000 characters.');
   if(!['City','Region'].includes(pin.type)||typeof pin.revealed!=='boolean')throw Error('Choose a city or region and its visibility.');
   for(const n of [pin.x,pin.y])if(!Number.isFinite(n)||n<0||n>100)throw Error('Place coordinates must be between 0 and 100.');
   const markerStyle=pin.markerStyle===undefined?'City':pin.markerStyle;
   if(!markerStyles.includes(markerStyle))throw Error('Choose one of the five marker styles.');
   const regionBoundary=boundary(pin.boundary,pin.type);
   const picturePath=pin.picturePath||'',pictureAlt=pin.pictureAlt||'',worldEntryId=pin.worldEntryId||'';
   const prefix='campaign-map-place-images/'+cid+'/'+pid+'/';
   if(picturePath&&(!picturePath.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(picturePath.slice(prefix.length))))throw Error('Choose a place picture from this campaign.');
   if(typeof pictureAlt!=='string'||pictureAlt.length>200||(picturePath&&!pictureAlt.trim()))throw Error('Give each place picture a description (up to 200 characters).');
   if(worldEntryId)id(worldEntryId);
   return {id:pid,name:pin.name.trim(),description:pin.description.trim(),x:pin.x,y:pin.y,type:pin.type,markerStyle,boundary:regionBoundary,revealed:pin.revealed,picturePath,pictureAlt,worldEntryId};
  });
  const preview=input.previewPath===undefined||input.previewPath===''?{}:{previewPath:image(cid,input.previewPath)};
  return {title:input.title.trim(),imagePath:input.imagePath,pins,...preview};
 }
 async function saveDraft({campaignId,input,revision,sourceRevision,isCurrent=()=>true}){
  const uid=actor(),normalized=normalizeDraft(campaignId,input);
  return runTransaction(db,async tx=>{
   const ref=draftRef(campaignId),previous=await tx.get(ref),map=await tx.get(mapRef(campaignId));check(uid,isCurrent);
   if((previous.data()?.revision||0)!==revision)throw Error('The DM draft changed in another window. Copy your changes and refresh.');
   if((map.data()?.revision||0)!==sourceRevision)throw Error('Another DM published a map. Copy your changes and refresh before saving.');
   const next={...normalized,sourceRevision,revision:revision+1,updatedBy:uid,updatedAt:Date.now()};tx.set(ref,next);return next;
  });
 }
 async function publish({campaignId,draftRevision,isCurrent=()=>true}){
  const uid=actor();return runTransaction(db,async tx=>{
   const ref=draftRef(campaignId),draft=await tx.get(ref),destination=mapRef(campaignId),previous=await tx.get(destination);
   if(!draft.exists()||draft.data().revision!==draftRevision)throw Error('The saved DM draft changed. Refresh before publishing.');
   const source=draft.data(),normalized=normalizeDraft(campaignId,source),oldRevision=previous.data()?.revision||0;
   if(source.sourceRevision!==oldRevision)throw Error('The published map changed. Refresh before publishing.');
   const pins=normalized.pins.filter(pin=>pin.revealed),shared=new Set();
   for(const entryId of new Set(pins.map(pin=>pin.worldEntryId).filter(Boolean))){const entry=await tx.get(doc(db,'campaigns',id(campaignId),'playerInformation',id(entryId)));if(entry.exists())shared.add(entryId);}
   check(uid,isCurrent);
   const next={title:normalized.title,imagePath:normalized.imagePath,...(normalized.previewPath?{previewPath:normalized.previewPath}:{}),schemaVersion:2,revision:oldRevision+1,updatedBy:uid,updatedAt:Date.now()};
   tx.set(destination,next);
   for(const pin of pins){const {id:pid,revealed,...fields}=pin;tx.set(pinRef(campaignId,pid),{...fields,imagePath:next.imagePath,worldEntryId:shared.has(fields.worldEntryId)?fields.worldEntryId:'',schemaVersion:2,publishedRevision:next.revision,revision:next.revision,updatedBy:uid,updatedAt:next.updatedAt});}
   const savedDraft={...source,sourceRevision:next.revision,revision:source.revision+1,updatedBy:uid,updatedAt:next.updatedAt};tx.set(ref,savedDraft);
   return {map:next,draft:savedDraft,pins:pins.map(pin=>({...pin,worldEntryId:shared.has(pin.worldEntryId)?pin.worldEntryId:''}))};
  });
 }
 return {load,listPins,watchMap,watchPins,saveMap,savePin,removePin,loadDraft,normalizeDraft,saveDraft,publish,boundary,markerStyles};
}
if(typeof module!=='undefined')module.exports={createCampaignMapStore};
