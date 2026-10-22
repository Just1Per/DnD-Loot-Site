'use strict';

/** Deliberate snapshots of saved player descriptions, separate from DM preparation. */
function createCampaignInformationStore(sdk, kind = 'world') {
  const {db, auth, doc, collection, getDoc, getDocs, runTransaction} = sdk;
  const sources = {world:'worldEntries',creature:'creatures',chapter:'chapters'};
  const publications = {world:'playerInformation',creature:'playerNPCs',chapter:'playerChapters'};
  if (!Object.hasOwn(sources,kind)) throw Error('Unsupported player catalogue.');
  const validId = value => {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(value || '')) throw Error('Invalid campaign entry ID.');
    return value;
  };
  const target = (campaignId, id) => doc(db, 'campaigns', validId(campaignId), publications[kind], validId(id));
  const actor = () => {if (!auth.currentUser?.uid) throw Error('Sign in first.');return auth.currentUser.uid;};
  function snapshot(source) {
    if (source.kind !== kind || source.archived) throw Error('Only saved, active entries can be shared.');
    if (kind === 'creature' && source.data?.category !== 'Story NPC') throw Error('Only Story NPCs can be revealed in the NPC catalogue.');
    if (kind === 'chapter' && source.data?.status !== 'Completed') throw Error('Only completed chapters can be shared.');
    const fields = {title:source.title,summary:source.summary,content:source.content,category:source.data?.category || 'World',sourceRevision:source.revision};
    if(kind==='world'&&Object.hasOwn(source.data||{},'postLayout')){if(!['split','reverse','panorama','classic'].includes(source.data.postLayout))throw Error('Choose a supported World post layout.');fields.postLayout=source.data.postLayout;}
    if(kind==='chapter'){
      if(source.data.playerRecap&&source.content&&source.content!==source.data.playerRecap)fields.introduction=source.content;
      fields.content=source.data.playerRecap || source.content;fields.category='Completed';fields.order=source.data.order;
      if(!Number.isInteger(fields.order)||fields.order<0||fields.order>9999)throw Error('Set the chapter order before sharing.');
    }
    if(Object.hasOwn(fields,'introduction')&&(typeof fields.introduction!=='string'||fields.introduction.length>20000))throw Error('This entry has invalid chapter introduction text.');
    for (const [key,max] of Object.entries({title:160,summary:1000,content:20000,category:80})) {
      if (typeof fields[key] !== 'string' || fields[key].length > max) throw Error('This entry has invalid player-facing text.');
    }
    if (!fields.title.trim() || !Number.isInteger(fields.sourceRevision) || fields.sourceRevision < 1) throw Error('Save the entry before sharing it.');
    return fields;
  }
  async function load(campaignId, id) {
    actor();const result=await getDoc(target(campaignId,id));
    return result.exists() ? {...result.data(),id} : null;
  }
  async function list(campaignId) {
    actor();const result=await getDocs(collection(db,'campaigns',validId(campaignId),publications[kind]));
    return result.docs.map(row=>({...row.data(),id:row.id}));
  }
  function watch(campaignId, onRows, onError) {
    if (typeof sdk.onSnapshot !== 'function') return () => {};
    actor();return sdk.onSnapshot(collection(db,'campaigns',validId(campaignId),publications[kind]),result=>onRows(result.docs.map(row=>({...row.data(),id:row.id}))),onError);
  }
  function writePrepared(tx,campaignId,id,image,prepared){
    if(!prepared)return; // Existing metadata-only callers remain compatible.
    const valid=(copy,limit)=>image&&copy?.path===image.path&&['image/png','image/jpeg','image/webp'].includes(copy.contentType)&&typeof copy.data==='string'&&copy.data.length>0&&copy.data.length<=limit&&/^[A-Za-z0-9+/]+={0,2}$/.test(copy.data);
    if(!valid(prepared,700000))throw Error('Prepare a valid saved illustration before publishing.');
    if(prepared.thumbnail&&(!['world','creature'].includes(kind)||!valid(prepared.thumbnail,88000)))throw Error('Prepare a valid thumbnail before publishing.');
    tx.set(doc(db,'campaigns',campaignId,'playerIllustrations',kind,'entries',id),{path:prepared.path,contentType:prepared.contentType,data:prepared.data});
    if(prepared.thumbnail){
      const copy=prepared.thumbnail;
      tx.set(doc(db,'campaigns',campaignId,'playerIllustrationThumbnails',kind,'entries',id),{path:copy.path,contentType:copy.contentType,data:copy.data});
      image.thumbnail=true;
    }
  }
  async function publish({campaignId,id,sourceRevision,publishedRevision=0,includeImage=false,preparedImage=null,isCurrent=()=>true}) {
    const uid=actor();
    return runTransaction(db,async tx=>{
      const sourceRef=doc(db,'campaigns',validId(campaignId),sources[kind],validId(id));
      const source=await tx.get(sourceRef), destination=target(campaignId,id), previous=await tx.get(destination);
      if (auth.currentUser?.uid !== uid || !isCurrent()) throw Error('Campaign access changed. Reopen this entry before sharing.');
      if (!source.exists()) throw Error('The source entry no longer exists.');
      if (source.data().revision !== sourceRevision || (previous.data()?.revision || 0) !== publishedRevision) throw Error('This entry changed in another window. Reload before sharing; your draft is preserved.');
      const next={...snapshot(source.data()),revision:publishedRevision+1,updatedBy:uid,updatedAt:Date.now()};
      // Text updates retain the last explicitly shared image, never draft art.
      if(previous.data()?.image)next.image=previous.data().image;
      if(includeImage){
        delete next.image;
        const image=source.data().data?.journalImage;
        if(image){
          const prefix=`campaign-journal-images/${campaignId}/${kind}/${id}/`;
          if(!image.path?.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.path.slice(prefix.length))||typeof image.alt!=='string'||image.alt.length>200||typeof image.caption!=='string'||image.caption.length>500)throw Error('Save a valid illustration before releasing this post.');
          next.image={path:image.path,alt:image.alt,caption:image.caption};
        }
      }
      if(includeImage)writePrepared(tx,campaignId,id,next.image,preparedImage);
      tx.set(destination,next);return {...next,id};
    });
  }
  async function unpublish({campaignId,id,publishedRevision,isCurrent=()=>true}) {
    const uid=actor();
    return runTransaction(db,async tx=>{
      const destination=target(campaignId,id), previous=await tx.get(destination);
      if (auth.currentUser?.uid !== uid || !isCurrent()) throw Error('Campaign access changed. Reopen this entry before removing it.');
      if (!previous.exists() || previous.data().revision !== publishedRevision) throw Error('The shared version changed. Refresh sharing status before removing it.');
      tx.delete(destination);
    });
  }
  async function shareImage({campaignId,id,sourceRevision,publishedRevision,hide=false,preparedImage=null,isCurrent=()=>true}) {
    const uid=actor();
    return runTransaction(db,async tx=>{
      const source=await tx.get(doc(db,'campaigns',validId(campaignId),sources[kind],validId(id)));
      const destination=target(campaignId,id),previous=await tx.get(destination);
      if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Campaign access changed. Reopen this entry.');
      if(!previous.exists()||previous.data().revision!==publishedRevision)throw Error('Share the page first, or refresh its shared version.');
      if(!source.exists()||source.data().revision!==sourceRevision)throw Error('The saved entry changed. Reload before sharing its image.');
      snapshot(source.data()); // Check that the source is still eligible, without publishing its text.
      const next={...previous.data(),revision:publishedRevision+1,updatedBy:uid,updatedAt:Date.now()};
      delete next.image;
      if(!hide){
        const image=source.data().data?.journalImage;
        const prefix=`campaign-journal-images/${campaignId}/${kind}/${id}/`;
        if(!image||!image.path?.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.path.slice(prefix.length))||typeof image.alt!=='string'||image.alt.length>200||typeof image.caption!=='string'||image.caption.length>500)throw Error('Save a valid illustration before sharing it.');
        next.image={path:image.path,alt:image.alt,caption:image.caption};
      }
      if(!hide)writePrepared(tx,campaignId,id,next.image,preparedImage);
      tx.set(destination,next);return {...next,id};
    });
  }
  return {snapshot,load,list,watch,publish,unpublish,shareImage};
}
if(typeof module!=='undefined')module.exports={createCampaignInformationStore};
