'use strict';
/* Only this campaign's owner/active DMs may save appearance; no character writes. */
function createCampaignAppearanceStore(sdk){
 const model=typeof CampaignAppearance!=='undefined'?CampaignAppearance:require('./campaign-appearance');
 return {async save(campaignId,input){
  if(typeof campaignId!=='string'||!campaignId||campaignId.includes('/'))throw Error('Invalid campaign.');
  const uid=sdk.auth.currentUser?.uid;if(!uid)throw Error('Sign in first.');
  const draft=model.normalize(input);
  return sdk.runTransaction(sdk.db,async tx=>{
   if(sdk.auth.currentUser?.uid!==uid)throw Error('Account changed. Reopen appearance settings.');
   const ref=sdk.doc(sdk.db,'campaigns',campaignId),record=await tx.get(ref);
   const member=await tx.get(sdk.doc(sdk.db,'campaigns',campaignId,'members',uid));
   if(!record.exists()||record.data().deletedAt)throw Error('Campaign no longer exists.');
   if(record.data().ownerId!==uid&&!(member.exists()&&member.data().status==='active'&&member.data().role==='dm'))throw Error('Only this campaign’s DM may change its appearance.');
   const revision=record.data().appearance?.revision||0;
   if(draft.revision!==revision)throw Error('Campaign appearance changed in another window. Close and reopen this editor before saving.');
   if(sdk.auth.currentUser?.uid!==uid)throw Error('Account changed. Reopen appearance settings.');
   const appearance={...draft,revision:revision+1};
   tx.update(ref,{appearance,updatedAt:Date.now()});return appearance;
  });
 }};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCampaignAppearanceStore};
