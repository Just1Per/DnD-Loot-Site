'use strict';
/** Private notes owned by the current user, scoped to a revealed chapter. */
function createChapterNotesStore(sdk) {
  const {db,auth,doc,getDoc,runTransaction}=sdk;
  const validId=value=>{if(!/^[A-Za-z0-9_-]{1,100}$/.test(value||''))throw Error('Invalid chapter ID.');return value;};
  const actor=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
  const parent=(campaignId,id)=>doc(db,'campaigns',validId(campaignId),'playerChapters',validId(id));
  const target=(campaignId,id,uid)=>doc(db,'campaigns',validId(campaignId),'playerChapters',validId(id),'notes',uid);
  async function load(campaignId,id){
    const uid=actor(),note=await getDoc(target(campaignId,id,uid));
    if(auth.currentUser?.uid!==uid)throw Error('Account changed. Reopen your notes.');
    return note.exists()?note.data():{text:'',revision:0};
  }
  async function save({campaignId,id,text,revision,isCurrent=()=>true}){
    const uid=actor();
    if(typeof text!=='string'||text.length>8000)throw Error('Notes must be at most 8,000 characters.');
    if(!Number.isInteger(revision)||revision<0)throw Error('Invalid notes revision.');
    return runTransaction(db,async tx=>{
      const chapter=await tx.get(parent(campaignId,id));
      if(!chapter.exists())throw Error('This chapter is no longer shared. Copy your draft before leaving.');
      const ref=target(campaignId,id,uid),old=await tx.get(ref);
      if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Campaign access changed. Reopen the chapter before saving notes.');
      if((old.data()?.revision||0)!==revision)throw Error('Your notes changed in another window. Copy your draft, then reload saved notes.');
      const next={text,revision:revision+1,updatedBy:uid,updatedAt:Date.now()};
      tx.set(ref,next);return next;
    });
  }
  return {load,save};
}
if(typeof module!=='undefined')module.exports={createChapterNotesStore};
