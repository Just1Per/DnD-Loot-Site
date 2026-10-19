'use strict';
/** One shared campaign map. Only campaign DMs may write maps or places. */
function createCampaignMapStore(sdk){
 const {db,auth,doc,collection,query,where,getDoc,getDocs,runTransaction}=sdk;
 const id=v=>{if(!/^[A-Za-z0-9_-]{1,128}$/.test(v||''))throw Error('Invalid map identifier.');return v;};
 const actor=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
 const mapRef=cid=>doc(db,'campaigns',id(cid),'campaignMaps','main');
 const pinRef=(cid,pid)=>doc(db,'campaigns',id(cid),'campaignMaps','main','pins',id(pid));
 const pinsQuery=(cid,imagePath)=>query(collection(db,'campaigns',id(cid),'campaignMaps','main','pins'),where('imagePath','==',imagePath));
 const rows=snapshot=>snapshot.docs.map(row=>({...row.data(),id:row.id}));
 function image(cid,path){if(typeof path!=='string'||!path.startsWith('campaign-maps/'+id(cid)+'/')||!/^[A-Za-z0-9_-]{1,100}$/.test(path.slice(('campaign-maps/'+cid+'/').length)))throw Error('Choose a map image from this campaign.');return path;}
 const check=(uid,isCurrent)=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Campaign access changed. Reopen the map.');};
 async function load(cid){actor();const snapshot=await getDoc(mapRef(cid));return snapshot.exists()?snapshot.data():null;}
 async function listPins(cid,imagePath){actor();return rows(await getDocs(pinsQuery(cid,image(cid,imagePath))));}
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
 return {load,listPins,watchMap,watchPins,saveMap,savePin,removePin};
}
if(typeof module!=='undefined')module.exports={createCampaignMapStore};
