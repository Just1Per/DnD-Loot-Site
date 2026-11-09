'use strict';
/* Private, explicitly initialized counters for owned inventory rows. */
var CharacterItemResources=(()=>{
 const emptyReference={definitions:[],source:{edition:'2014'}},cache=new WeakMap(),validId=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\/\r\n]/.test(id);
 const key=name=>String(name||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
 const reference=()=>typeof CharacterItemResourceReference!=='undefined'?CharacterItemResourceReference:typeof require==='function'?require('./character-item-resource-data'):emptyReference;
 function definitions(ref=reference()){
  if(!cache.has(ref))cache.set(ref,new Map((ref.definitions||[]).filter(row=>row&&typeof row.key==='string'&&Number.isInteger(row.max)&&row.max>0&&row.max<=10000&&['uses','charges','minutes','hours'].includes(row.unit)).map(row=>[row.key,row])));
  return cache.get(ref);
 }
 function normalize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return{};
  return Object.fromEntries(Object.entries(raw).filter(([id,row])=>validId(id)&&row&&typeof row.reference==='string'&&row.reference.length<=210&&/^(?:2014|2024):[^\r\n]{1,200}$/.test(row.reference)&&Number.isInteger(row.usedTicks)&&row.usedTicks>=0&&row.usedTicks<=6000000).slice(0,200).map(([id,row])=>[id,{reference:row.reference,usedTicks:row.usedTicks}]));
 }
 function state(data){return normalize(data.adobe?.itemResources??data.rulesChoices?.grants?.__adobe?.data?.itemResources);}
 function project(data,gear,ref=reference()){
  const saved=state(data),known=definitions(ref),seen=new Set();
  return (gear?.entries||[]).flatMap(entry=>{
   const id=entry.entry.id,definition=known.get(key(entry.item.name));if(!validId(id)||seen.has(id)||!definition||Number(entry.entry.quantity)<=0)return[];seen.add(id);
   // Durations use six-second ticks: one round is 0.1 minute. Never count
   // fractional charges, and never multiply a pool by inventory quantity.
   const duration=definition.unit==='minutes'||definition.unit==='hours',unit=duration?'minutes':definition.unit,max=definition.max*(definition.unit==='hours'?60:1),scale=duration?10:1,refKey=(ref.source?.edition||'2014')+':'+definition.key,record=saved[id],initialized=record?.reference===refKey;
   const usedTicks=initialized?record.usedTicks:null;
   return[{id,name:entry.item.name,reference:refKey,sourceEdition:ref.source?.edition||'2014',definition,max,scale,step:1/scale,unit,usedTicks,used:initialized?usedTicks/scale:null,remaining:initialized?Math.max(0,max*scale-usedTicks)/scale:null,initialized,quantity:Number(entry.entry.quantity)}];
  });
 }
 function current(data,gear,id,ref){const row=project(data,gear,ref).find(row=>row.id===id);if(!row)throw Error('This item is no longer carried by the opened character, or has no supported counter.');return row;}
 const numeric=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value));
 function ticks(value,row,{zero=true}={}){
  if(!numeric(value))throw Error('Enter the amount in '+row.unit+'.');
  const amount=Number(value)*row.scale,rounded=Math.round(amount);
  if(Math.abs(amount-rounded)>1e-7||rounded<(zero?0:1)||rounded>row.max*row.scale)throw Error('Enter '+(zero?'0':'at least '+row.step)+' to '+row.max+' '+row.unit+' in steps of '+row.step+'.');return rounded;
 }
 function record(data,row,usedTicks){const next=state(data);if(!Object.hasOwn(next,row.id)&&Object.keys(next).length>=200)throw Error('The sheet already has 200 item counters. Remove an unused counter first.');return {...next,[row.id]:{reference:row.reference,usedTicks}};}
 function initialize(data,gear,id,remaining,ref){const row=current(data,gear,id,ref);if(row.initialized)throw Error('This counter is already initialized. Adjust its Used value instead.');return record(data,row,row.max*row.scale-ticks(remaining,row));}
 function setUsed(data,gear,id,value,ref){const row=current(data,gear,id,ref);if(!row.initialized)throw Error('Set this item’s current remaining amount before tracking its uses.');if(numeric(value)&&Number(value)===row.used)return state(data);return record(data,row,ticks(value,row));}
 function change(data,gear,id,command,value=1,ref){
  const row=current(data,gear,id,ref);if(!row.initialized)throw Error('Set the current remaining amount first.');const amount=ticks(value,row,{zero:false});
  if(command==='spend'){if(amount>row.remaining*row.scale+1e-7)throw Error('This item does not have that amount remaining.');return record(data,row,row.usedTicks+amount);}
  if(command==='undo'){if(amount>row.usedTicks)throw Error('Undo only recorded expenditure.');return record(data,row,row.usedTicks-amount);}
  throw Error('Choose Use or Undo for this item counter.');
 }
 function recover(data,gear,event,plan,ref=reference()){
  if(!['dawn','short','long'].includes(event)||!plan||typeof plan!=='object'||Array.isArray(plan)||!Object.keys(plan).length)throw Error('Choose items to recover after the stated event.');
  const updates=[];
  for(const [id,value]of Object.entries(plan)){
   const row=current(data,gear,id,ref),rule=row.definition.recharge;if(!row.initialized||rule?.event!==event||rule.mode==='none')throw Error('Only initialized items with this recovery event can be restored.');
   let regained;
   if(rule.mode==='all'){if(value!==null)throw Error('Full recovery uses the listed maximum.');regained=row.max*row.scale;}
   else if(rule.mode==='roll'){
    const roll=rule.roll,min=Math.max(0,roll.count+roll.bonus),max=roll.count*roll.size+roll.bonus;
    if(!numeric(value)||!Number.isInteger(Number(value))||Number(value)<min||Number(value)>max)throw Error(row.name+': enter the total after rolling '+roll.count+'d'+roll.size+(roll.bonus?(roll.bonus<0?'':'+')+roll.bonus:'')+' ('+min+'–'+max+').');regained=Number(value)*row.scale;
   }else if(rule.mode==='manual')regained=ticks(value,row);else throw Error('This item’s recovery is not supported.');
   updates.push([row,Math.max(0,Math.min(row.usedTicks,row.max*row.scale)-regained)]);
  }
  let next=state(data);for(const [row,usedTicks]of updates)next={...next,[row.id]:{reference:row.reference,usedTicks}};return next;
 }
 function forget(data,id){if(!validId(id))throw Error('Choose an existing item counter.');const next=state(data);delete next[id];return next;}
 return{normalize,state,definitions,project,initialize,setUsed,change,recover,forget,key};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterItemResources;
