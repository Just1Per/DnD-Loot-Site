'use strict';
/** Author-owned drafts and explicitly shared snapshots. Never reads DM source records. */
function createCampaignJournalStore(sdk) {
  const {db,auth,doc,collection,getDocs,runTransaction}=sdk;
  const validId=value=>{if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(value))throw Error('Invalid journal ID.');return value;};
  const actor=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
  const drafts=(campaignId,uid)=>collection(db,'campaigns',validId(campaignId),'journalDrafts',validId(uid),'entries');
  const draftRef=(campaignId,uid,id)=>doc(db,'campaigns',validId(campaignId),'journalDrafts',validId(uid),'entries',validId(id));
  const sharedRef=(campaignId,id)=>doc(db,'campaigns',validId(campaignId),'journalRecaps',validId(id));
  const rows=result=>result.docs.map(row=>({...row.data(),id:row.id}));
  function normalize(input){
    const result={};
    for(const [key,max] of Object.entries({title:160,body:12000,authorName:100,characterName:100,remember:2000,nextTime:2000,sessionDate:10})){
      if(typeof input[key]!=='string'||input[key].length>max)throw Error('Check the length of your journal fields.');
      result[key]=input[key].trim();
    }
    if(!result.title||!result.body||!result.authorName)throw Error('Add a title, your name and a recap before saving.');
    if(!Number.isInteger(input.sessionNumber)||input.sessionNumber<1||input.sessionNumber>9999)throw Error('Session number must be between 1 and 9999.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(result.sessionDate)||!Number.isFinite(Date.parse(result.sessionDate+'T12:00:00Z'))||new Date(result.sessionDate+'T12:00:00Z').toISOString().slice(0,10)!==result.sessionDate)throw Error('Choose a valid session date.');
    return {...result,sessionNumber:input.sessionNumber};
  }
  function check(uid,isCurrent){if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account or campaign changed. Reopen your journal.');}
  async function list(campaignId){const uid=actor();const [privateRows,sharedRows]=await Promise.all([getDocs(drafts(campaignId,uid)),getDocs(collection(db,'campaigns',validId(campaignId),'journalRecaps'))]);check(uid,()=>true);return {drafts:rows(privateRows),shared:rows(sharedRows)};}
  function watch(campaignId,onDrafts,onShared,onError){
    const uid=actor();if(typeof sdk.onSnapshot!=='function')return()=>{};
    const subscriptions=[sdk.onSnapshot(drafts(campaignId,uid),snapshot=>onDrafts(rows(snapshot)),onError),sdk.onSnapshot(collection(db,'campaigns',validId(campaignId),'journalRecaps'),snapshot=>onShared(rows(snapshot)),onError)];
    return()=>subscriptions.forEach(stop=>stop());
  }
  async function save({campaignId,id,input,revision,isCurrent=()=>true}){
    const uid=actor(),fields=normalize(input);if(!Number.isInteger(revision)||revision<0)throw Error('Invalid draft revision.');
    return runTransaction(db,async tx=>{
      const ref=draftRef(campaignId,uid,id),previous=await tx.get(ref);check(uid,isCurrent);
      if((previous.data()?.revision||0)!==revision)throw Error('This draft changed in another window. Copy your text before reopening the saved draft.');
      const next={...fields,authorId:uid,revision:revision+1,updatedAt:Date.now()};tx.set(ref,next);return {...next,id};
    });
  }
  async function publish({campaignId,id,revision,publishedRevision=0,isCurrent=()=>true}){
    const uid=actor();return runTransaction(db,async tx=>{
      const saved=await tx.get(draftRef(campaignId,uid,id)),ref=sharedRef(campaignId,id),previous=await tx.get(ref);check(uid,isCurrent);
      if(!saved.exists()||saved.data().revision!==revision||(previous.data()?.revision||0)!==publishedRevision)throw Error('The saved or shared version changed. Refresh the journal before sharing.');
      if(previous.exists()&&previous.data().authorId!==uid)throw Error('Only the author can share this recap.');
      const next={...normalize(saved.data()),authorId:uid,sourceRevision:revision,revision:publishedRevision+1,updatedAt:Date.now()};tx.set(ref,next);return {...next,id};
    });
  }
  async function unpublish({campaignId,id,publishedRevision,isCurrent=()=>true}){
    const uid=actor();return runTransaction(db,async tx=>{const ref=sharedRef(campaignId,id),previous=await tx.get(ref);check(uid,isCurrent);
      if(!previous.exists()||previous.data().authorId!==uid||previous.data().revision!==publishedRevision)throw Error('The shared version changed. Refresh before making it private.');
      tx.delete(ref);
    });
  }
  return {list,watch,normalize,save,publish,unpublish};
}
if(typeof module!=='undefined')module.exports={createCampaignJournalStore};
