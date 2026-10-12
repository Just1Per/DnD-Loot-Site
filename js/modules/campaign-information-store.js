'use strict';

/** Deliberate snapshots of saved player descriptions, separate from DM preparation. */
function createCampaignInformationStore(sdk) {
  const {db, auth, doc, collection, getDoc, getDocs, runTransaction} = sdk;
  const validId = value => {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(value || '')) throw Error('Invalid campaign entry ID.');
    return value;
  };
  const target = (campaignId, id) => doc(db, 'campaigns', validId(campaignId), 'playerInformation', validId(id));
  const actor = () => {if (!auth.currentUser?.uid) throw Error('Sign in first.');return auth.currentUser.uid;};
  function snapshot(source) {
    if (source.kind !== 'world' || source.archived) throw Error('Only saved, active world entries can be shared.');
    const fields = {title:source.title,summary:source.summary,content:source.content,category:source.data?.category || 'World',sourceRevision:source.revision};
    for (const [key,max] of Object.entries({title:160,summary:1000,content:20000,category:80})) {
      if (typeof fields[key] !== 'string' || fields[key].length > max) throw Error('This entry has invalid player-facing text.');
    }
    if (!fields.title.trim() || !Number.isInteger(fields.sourceRevision) || fields.sourceRevision < 1) throw Error('Save the world entry before sharing it.');
    return fields;
  }
  async function load(campaignId, id) {
    actor();const result=await getDoc(target(campaignId,id));
    return result.exists() ? {...result.data(),id} : null;
  }
  async function list(campaignId) {
    actor();const result=await getDocs(collection(db,'campaigns',validId(campaignId),'playerInformation'));
    return result.docs.map(row=>({...row.data(),id:row.id}));
  }
  function watch(campaignId, onRows, onError) {
    if (typeof sdk.onSnapshot !== 'function') return () => {};
    actor();return sdk.onSnapshot(collection(db,'campaigns',validId(campaignId),'playerInformation'),result=>onRows(result.docs.map(row=>({...row.data(),id:row.id}))),onError);
  }
  async function publish({campaignId,id,sourceRevision,publishedRevision=0,isCurrent=()=>true}) {
    const uid=actor();
    return runTransaction(db,async tx=>{
      const sourceRef=doc(db,'campaigns',validId(campaignId),'worldEntries',validId(id));
      const source=await tx.get(sourceRef), destination=target(campaignId,id), previous=await tx.get(destination);
      if (auth.currentUser?.uid !== uid || !isCurrent()) throw Error('Campaign access changed. Reopen this entry before sharing.');
      if (!source.exists()) throw Error('The world entry no longer exists.');
      if (source.data().revision !== sourceRevision || (previous.data()?.revision || 0) !== publishedRevision) throw Error('This entry changed in another window. Reload before sharing; your draft is preserved.');
      const next={...snapshot(source.data()),revision:publishedRevision+1,updatedBy:uid,updatedAt:Date.now()};
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
  return {snapshot,load,list,watch,publish,unpublish};
}
if(typeof module!=='undefined')module.exports={createCampaignInformationStore};
