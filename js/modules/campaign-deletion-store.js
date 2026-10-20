'use strict';
// Recoverable deletion revokes campaign access without removing its recovery records.
function createCampaignDeletionStore(sdk){
 const {db,auth,doc,collection,getDocs,runTransaction}=sdk;
 const actor=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
 async function list(){actor();const result=await getDocs(collection(db,'campaigns'));return result.docs.map(row=>({...row.data(),id:row.id})).filter(row=>!row.deletedAt).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));}
 async function remove({campaignId,isCurrent=()=>true}){
  const uid=actor();if(!/^[A-Za-z0-9_-]{1,100}$/.test(campaignId||''))throw Error('Invalid campaign.');
  return runTransaction(db,async tx=>{
   const ref=doc(db,'campaigns',campaignId),snapshot=await tx.get(ref);
   if(!snapshot.exists()||snapshot.data().deletedAt)throw Error('Campaign is no longer available.');
   const campaign=snapshot.data();
   if(campaign.ownerId!==uid){const profile=await tx.get(doc(db,'users',uid));if(!profile.exists()||!Array.isArray(profile.data().role)||!profile.data().role.includes('admin'))throw Error('Only the campaign owner or an administrator can delete it.');}
   if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account or campaign changed. Reopen the campaign list.');
   tx.update(ref,{deletedAt:Date.now(),deletedBy:uid,updatedAt:Date.now()});return {id:campaignId,name:campaign.name};
  });
 }
 return{list,remove};
}
if(typeof module!=='undefined')module.exports={createCampaignDeletionStore};
