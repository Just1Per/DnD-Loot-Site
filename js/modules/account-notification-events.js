'use strict';
// References only: private DM text is read from its existing protected sheet.
var AccountNotificationEvents=(()=>{
 const base=(campaignId,adventureId)=>adventureId?['campaigns',campaignId,'oneShots',adventureId]:['campaigns',campaignId];
 function put(sdk,tx,{campaignId,characterId,adventureId,recipient,kind,sourceId,version,createdAt,quantity=0}){
  const actorId=sdk.auth.currentUser?.uid;
  if(!actorId||!sdk.notificationsAvailable?.()||!recipient||recipient===actorId)return;
  const id=kind==='dm-notes'?'notes_'+version:'loot_'+crypto.randomUUID();
  tx.set(sdk.doc(sdk.db,...base(campaignId,adventureId),'characterNotifications',characterId,'entries',id),{kind,sourceId,version,createdAt,actorId,quantity});
 }
 return{base,put};
})();
if(typeof module!=='undefined')module.exports=AccountNotificationEvents;
