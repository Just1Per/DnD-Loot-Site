'use strict';
/* Private carrier assignments. Ownership, attunement and item resources stay on the character. */
var CharacterCompanionEquipment=(()=>{
 const capacity=17,validId=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\r\n/]/.test(id);
 const dep=(name,file)=>globalThis[name]||(typeof require==='function'?require(file):null);
 const stored=data=>data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{};
 function fields(raw={}){
  const out={};for(const key of ['name','location'])if(typeof raw?.[key]==='string')out[key]=raw[key].slice(0,200);
  for(const key of ['quantity','weight'])if(Object.hasOwn(raw||{},key)){const value=raw[key],n=Number(String(value).replace(',','.'));if(value==='')out[key]='';else if(['number','string'].includes(typeof value)&&String(value).trim()&&Number.isFinite(n)&&n>=0&&n<=1000000)out[key]=n;}
  return out;
 }
 function normalize(raw={}){
  const ids=new Set(),rows=Array.from({length:capacity},(_,i)=>{const row=raw?.rows?.[i];if(!validId(row?.id)||ids.has(row.id))return null;ids.add(row.id);return{id:row.id,name:String(row.name||'Saved item').slice(0,200),fields:fields(row.fields)};});
  return{visible:raw?.visible===true||rows.some(Boolean),rows};
 }
 function carrier(data,id){if(!validId(id))return-1;const companions=stored(data).companions;return(Array.isArray(companions)?companions:[]).findIndex(c=>normalize(c.equipment).rows.some(row=>row?.id===id));}
 function decorate(data,rows){return rows.map(row=>({...row,companionCarried:carrier(data,row.id)>=0}));}
 function project(data,all,index){
  const c=stored(data).companions?.[index];if(!c)return[];const owned=new Map(all.map(row=>[row.id,row]));
  return normalize(c.equipment).rows.map(saved=>{if(!saved)return null;const row=owned.get(saved.id),unavailable=!row||Number(row.quantity)<=0;return{id:saved.id,key:'p:'+saved.id,name:row?.name||saved.name,quantity:row?.quantity??'',weight:row?.weight??null,location:row?.location||'',...saved.fields,...(unavailable?{unavailable:true,name:(saved.fields.name||saved.name)+' (unavailable)'}:{}),companionCarried:true};});
 }
 function load(data,all,index){
  const Carry=dep('CharacterCarrying','./character-carrying'),rows=project(data,all,index).filter(row=>row&&carrier(data,row.id)===index),owned=new Map(all.map(row=>[row.id,row]));
  const physical=Carry.rowsWeight(rows.map(row=>owned.get(row.id)).filter(Boolean)),paper=dep('CharacterPaperWeight','./character-paper-weight').columnWeight(rows.map(row=>({...row,companionCarried:false})));
  const c=stored(data).companions?.[index],creature=dep('CharacterCreatureData','./character-creature-data')?.find(c?.creature),burden=creature?.id==='mule'&&creature.traits?.includes('Beast of Burden'),limits=Carry.limits({profile:{size:c?.size},adobe:{carrying:{includeCoins:false}}},{scores:{str:c?.abilities?.str||10},effects:{size:c?.size||'Medium',...(burden?{race:{name:'Beast of Burden',carryingSizeSteps:1}}:{})}});
  return{physical:{...physical,total:physical.gear},paper,status:Carry.status(limits,{total:physical.gear,unknown:physical.unknown})};
 }
 function context(data,all){
  const adobe=stored(data);return{paperInventory:dep('CharacterPaperInventory','./character-paper-inventory').normalize(adobe.paperInventory),companions:(adobe.companions||[]).map(c=>({...c,equipment:normalize(c.equipment)})),all};
 }
 function target(out,index){if(out.companions[index]?.type==='wildshape')throw Error('A Wild Shape reference is not a separate equipment carrier.');if(!Number.isInteger(index)||index<0||!out.companions[index])throw Error('Choose an existing companion.');const slot=out.companions[index].equipment.rows.findIndex(row=>!row);if(slot<0)throw Error('This companion’s 17 equipment rows are full. Nothing was moved.');return slot;}
 function moveToCompanion(data,all,index,companionIndex){
  const Inventory=dep('CharacterPaperInventory','./character-paper-inventory'),out=context(data,all),slot=target(out,companionIndex),row=Inventory.gearRows(out.paperInventory,all)[index];
  if(!row||row.unavailable||row.header||row.automaticAttunement||row.reference||row.key!=='p:'+row.id)throw Error('Choose the item’s original owned equipment row, rather than a copied reference.');
  if(carrier(data,row.id)>=0)throw Error('This item is already carried by a companion.');
  if(data.equipmentState?.loadout?.some(choice=>choice.id===row.id&&choice.equipped))throw Error('Unequip this item before moving it to a companion. Attunement and recorded uses are retained.');
  const source=all.find(entry=>entry.id===row.id);if(!source||!(Number(source.quantity)>0))throw Error('This owned item is no longer available.');
  out.companions[companionIndex].equipment.rows[slot]={id:row.id,name:source.name,fields:fields(out.paperInventory.gearLayout.values[row.key])};out.companions[companionIndex].equipment.visible=true;
  out.paperInventory=Inventory.gearAction(out.paperInventory,all,index,'delete').state;
  return{...out,companionIndex,index:slot};
 }
 function moveBetween(data,all,from,index,to){
  const out=context(data,all),slot=target(out,to),source=out.companions[from]?.equipment.rows[index];if(!source||from===to)throw Error('Choose an item and a different companion.');
  if(!all.some(row=>row.id===source.id&&Number(row.quantity)>0))throw Error('This owned item is no longer available.');
  if(carrier(data,source.id)!==from)throw Error('This item is assigned to another companion.');
  out.companions[from].equipment.rows.splice(index,1);out.companions[from].equipment.rows.push(null);out.companions[to].equipment.rows[slot]=source;out.companions[to].equipment.visible=true;return{...out,companionIndex:to,index:slot};
 }
 function returnToCharacter(data,all,from,index,destination='gear'){
  const out=context(data,all),c=out.companions[from],saved=c?.equipment.rows[index],Inventory=dep('CharacterPaperInventory','./character-paper-inventory');if(!saved)throw Error('Choose a companion equipment row.');if(carrier(data,saved.id)!==from)throw Error('This item is assigned to another companion.');
  if(!['gear','extra','automatic'].includes(destination))throw Error('Choose Equipment or Extra Equipment.');
  const entries=Inventory.gearRows(out.paperInventory,all),start=destination==='extra'?54:0,end=destination==='automatic'?dep('CharacterPaperGearLayout','./character-paper-gear-layout').maxRows-1:destination==='extra'?89:out.paperInventory.attunedFooter?49:53;let slot=-1;
  for(let i=start;i<=end;i++)if(!(out.paperInventory.attunedFooter&&i>=50&&i<54)&&!entries[i]){slot=i;break;}if(slot<0)throw Error('The destination equipment page is full. Nothing was moved.');
  const key='p:'+saved.id,state=out.paperInventory.gearLayout;state.hidden=state.hidden.filter(id=>id!==key);state.layout=state.layout.filter(row=>row.key!==key&&row.slot!==slot);state.layout.push({slot,key,name:saved.name});state.values[key]={...(state.values[key]||{}),...saved.fields};
  c.equipment.rows.splice(index,1);c.equipment.rows.push(null);return{...out,index:slot};
 }
 function edit(data,all,companionIndex,index,field,value){
  const out=context(data,all),row=out.companions[companionIndex]?.equipment.rows[index];if(!row||!project(data,all,companionIndex)[index]||project(data,all,companionIndex)[index].unavailable)throw Error('Choose an available companion equipment row.');
  const parsed=dep('CharacterPaperGearRows','./character-paper-gear-rows').edit({},0,field,value).rows[0][field];row.fields[field]=parsed;if(field==='weight'&&parsed==='')delete row.fields.weight;return out;
 }
 function removeCompanion(data,all,index){
  let out=context(data,all);if(out.companions.length<=1||!out.companions[index])throw Error('Keep at least one companion card.');
  while(out.companions[index].equipment.rows.some(Boolean)){const slot=out.companions[index].equipment.rows.findIndex(Boolean);out=returnToCharacter({...data,adobe:{...stored(data),paperInventory:out.paperInventory,companions:out.companions}},all,index,slot,'automatic');}
  out.companions.splice(index,1);return out;
 }
 function physical(data,loot){const Carry=dep('CharacterCarrying','./character-carrying');return decorate(data,loot.map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:Carry.unitWeight(entry.item||{}),location:data.personalGear?.find(row=>row.id===entry.id)?.location||''})));}
 function carrierName(data,id){const i=carrier(data,id),c=stored(data).companions?.[i];return c?(c.name||c.creature||'Companion '+(i+1)):'';}
 return{carrierName,physical,capacity,normalize,carrier,decorate,project,load,moveToCompanion,moveBetween,returnToCharacter,edit,removeCompanion};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterCompanionEquipment=CharacterCompanionEquipment;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterCompanionEquipment;
