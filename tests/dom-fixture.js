// UI-only adapter: no production credentials, network calls, or browser process.
window.callLog=[];
window.__DND_VAULT_DEPS__.vaultCall=async(name,data)=>{
 callLog.push({name,data:JSON.parse(JSON.stringify(data))});
 if(testFailWrite)throw Error('Simulated denied operation');
 if(name==='vaultSaveCampaignItem') {
   const id=data.itemId||'new-item';const old=fixtureItems.find(i=>i.id===id);
   const item={...data.item,id,campaignId:data.campaignId,campaign:activeCampaign.name,visible:data.visible,lootMode:data.lootMode,available:data.unlimited||data.remaining>0};
   fixtureItems=fixtureItems.filter(i=>i.id!==id).concat(item);fixtureSupply[id]={capacity:data.remaining,claimed:0,unlimited:data.unlimited,revision:(fixtureSupply[id]?.revision||0)+1};return {itemId:id};
 }
 if(name==='vaultCopyCampaignItem') {
   const source=(data.source==='root'?rootItems:fixtureItems).find(i=>i.id===data.sourceId);const id='copied-item';fixtureItems.push({...source,id,campaignId:data.campaignId,campaign:activeCampaign.name,visible:false,lootMode:'dm',available:true});fixtureSupply[id]={capacity:1,claimed:0,unlimited:false,revision:1};return {itemId:id};
 }
 if(name==='vaultInventoryAction'){
   const item=fixtureItems.find(i=>i.id===data.itemId),character=characters.find(c=>c.id===data.characterId);
   let record=fixtureInventory.find(e=>e.itemId===data.itemId&&e.characterId===data.characterId);
   if(['claim','assign'].includes(data.action)){
     if(!record){record={id:'new-owned',characterId:data.characterId,itemId:data.itemId,userId:character.userId,quantity:0,item};fixtureInventory.push(record);}
     record.quantity+=data.quantity;
   } else if(record)record.quantity-=data.quantity;
   fixtureInventory=fixtureInventory.filter(e=>e.quantity>0);return {};
 }
 return {};
};
