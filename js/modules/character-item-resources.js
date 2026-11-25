'use strict';
/* Private, explicitly initialized counters for owned inventory rows. */
var CharacterItemResources=(()=>{
 const Pinned=typeof CharacterPinnedItems!=='undefined'?CharacterPinnedItems:require('./character-pinned-items');
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
 function powerId(ownerId,source,power){
  // Lookup key only: the complete owner ID is also checked in the reference.
  let hash=0xcbf29ce484222325n;for(let i=0;i<ownerId.length;i++)hash=((hash^BigInt(ownerId.charCodeAt(i)))*0x100000001b3n)&0xffffffffffffffffn;
  return 'whelm-'+source.toLowerCase()+'-'+power+'-'+hash.toString(16).padStart(16,'0');
 }
 function powerDefinitions(item){
  const fact=Pinned.find(item);if(!fact||!['DMG','XDMG'].includes(fact.source)||Pinned.key(fact.name)!=='whelm'||fact.reqAttune!==true||Number(fact.bonusWeapon)!==3||Pinned.key(String(fact.baseItem||'').split('|')[0])!=='warhammer')return[];
  const modern=fact.source==='XDMG',edition=modern?'2024':'2014',common={max:1,unit:'uses',edition,recovery:'Dawn',recharge:{event:'dawn',mode:'all'},requiresAttunement:true,recordOnly:true};
  return[{...common,power:'shock',source:fact.source,key:'whelm-shock-wave',name:'Shock Wave',reminder:(modern?'Magic action':'Action')+' · chosen grounded creatures within 60 ft of impact · DC '+(modern?20:15)+' CON or Stunned for 1 minute; repeat at turn end. Requires the held, attuned weapon. Recording a use does not apply target conditions.'},{...common,power:'spells',source:fact.source,key:'whelm-divination',name:'Divination spells',reminder:'One shared use for Detect Evil and Good or Locate Object; the source spell’s casting time and Concentration still apply. Attune and hold the weapon to use its powers. Recording a use does not cast, spend a spell slot or learn a spell.'}];
 }
 function powerRecord(id,record){
  const match=/^whelm-(dmg|xdmg)-(shock|spells)-[0-9a-f]{16}$/.exec(id||'');if(!match||!record)return null;
  const source=match[1].toUpperCase(),edition=source==='XDMG'?'2024':'2014',prefix=edition+':',ownerId=record.reference?.startsWith(prefix)?record.reference.slice(prefix.length):'';
  return validId(ownerId)&&powerId(ownerId,source,match[2])===id?{ownerId,name:'Whelm · '+(match[2]==='shock'?'Shock Wave':'Divination spells')}:null;
 }
 function archiveLabel(id,record){const power=powerRecord(id,record);return power?power.name+' · Inventory row '+power.ownerId:record.reference.replace(/^(2014|2024):/,'')+' · Inventory row '+id;}
 function project(data,gear,ref=reference()){
  const saved=state(data),known=definitions(ref),seen=new Set(),ownedIds=new Set((gear?.entries||[]).filter(row=>row?.entry&&Number.isFinite(Number(row.entry.quantity))&&Number(row.entry.quantity)>0).map(row=>row.entry.id));
  return (gear?.entries||[]).flatMap(entry=>{
   const id=entry?.entry?.id;if(!validId(id)||seen.has(id)||!Number.isFinite(Number(entry.entry.quantity))||Number(entry.entry.quantity)<=0)return[];seen.add(id);
   const powers=ref===reference()?powerDefinitions(entry.item):[];
   if(powers.length)return powers.map(definition=>{
    const poolId=powerId(id,definition.source,definition.power),refKey=definition.edition+':'+id,record=saved[poolId],storageConflict=poolId!==id&&ownedIds.has(poolId),initialized=!storageConflict&&record?.reference===refKey&&Number.isInteger(record.usedTicks)&&record.usedTicks<=1,usedTicks=initialized?record.usedTicks:null;
    return{id:poolId,ownerId:id,name:entry.item.name+' · '+definition.name,reference:refKey,sourceEdition:definition.edition,definition,max:1,scale:1,step:1,unit:'uses',usedTicks,used:usedTicks,remaining:initialized?1-usedTicks:null,initialized,storageConflict,quantity:Number(entry.entry.quantity)};
   });
   const pinned=ref===reference()?Pinned.resource(entry.item):null,definition=pinned?.edition==='2024'?pinned:known.get(key(entry.item?.name))||pinned;if(!definition)return[];
   // Durations use six-second ticks: one round is 0.1 minute. Never count
   // fractional charges, and never multiply a pool by inventory quantity.
   const duration=definition.unit==='minutes'||definition.unit==='hours',unit=duration?'minutes':definition.unit,baseRef=(definition.edition||ref.source?.edition||'2014')+':'+definition.key,customMatch=saved[id]?.reference?.startsWith(baseRef+':max:')?/^\d{1,5}$/.exec(saved[id].reference.slice((baseRef+':max:').length)):null,customMax=customMatch?Number(customMatch[0]):0,max=(definition.customMaximum?customMax>=Math.max(1,definition.maximumRange?.min||1)&&customMax<=Math.min(10000,definition.maximumRange?.max||10000)?customMax:0:definition.max)*(definition.unit==='hours'?60:1),scale=duration?10:1,refKey=definition.customMaximum&&max?baseRef+':max:'+max:baseRef,record=saved[id],initialized=record?.reference===refKey&&!powerRecord(id,record);
   const usedTicks=initialized?record.usedTicks:null;
   return[{id,name:entry.item.name,reference:refKey,sourceEdition:definition.edition||ref.source?.edition||'2014',definition,max,scale,step:1/scale,unit,usedTicks,used:initialized?usedTicks/scale:null,remaining:initialized?Math.max(0,max*scale-usedTicks)/scale:null,initialized,quantity:Number(entry.entry.quantity)}];
  });
 }
 function current(data,gear,id,ref){const row=project(data,gear,ref).find(row=>row.id===id);if(!row)throw Error('This item is no longer carried by the opened character, or has no supported counter.');return row;}
 const numeric=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value));
 function ticks(value,row,{zero=true}={}){
  if(!numeric(value))throw Error('Enter the amount in '+row.unit+'.');
  const amount=Number(value)*row.scale,rounded=Math.round(amount);
  if(Math.abs(amount-rounded)>1e-7||rounded<(zero?0:1)||rounded>row.max*row.scale)throw Error('Enter '+(zero?'0':'at least '+row.step)+' to '+row.max+' '+row.unit+' in steps of '+row.step+'.');return rounded;
 }
 function record(data,row,usedTicks){const next=state(data);if(row.storageConflict||row.ownerId&&next[row.id]&&next[row.id].reference!==row.reference||!row.ownerId&&powerRecord(row.id,next[row.id]))throw Error('This counter key conflicts with another item record. Keep the existing record and resolve the inventory ID conflict before starting this counter.');if(!Object.hasOwn(next,row.id)&&Object.keys(next).length>=200)throw Error('The sheet already has 200 item counters. Remove an unused counter first.');return {...next,[row.id]:{reference:row.reference,usedTicks}};}
 function initialize(data,gear,id,remaining,ref,customMax){let row=current(data,gear,id,ref);if(row.definition.customMaximum&&!row.initialized){const max=Number(customMax);const min=Math.max(1,row.definition.maximumRange?.min||1),limit=Math.min(10000,row.definition.maximumRange?.max||10000);if(!Number.isSafeInteger(max)||max<min||max>limit)throw Error('Enter the item’s determined maximum from '+min+' to '+limit+' charges.');row={...row,max,reference:row.reference+':max:'+max};}if(row.initialized)throw Error('This counter is already initialized. Adjust its Used value instead.');return record(data,row,row.max*row.scale-ticks(remaining,row));}
 function setUsed(data,gear,id,value,ref){const row=current(data,gear,id,ref);if(!row.initialized)throw Error('Set this item’s current remaining amount before tracking its uses.');if(numeric(value)&&Number(value)===row.used)return state(data);return record(data,row,ticks(value,row));}
 function change(data,gear,id,command,value=1,ref){
  const row=current(data,gear,id,ref);if(!row.initialized)throw Error('Set the current remaining amount first.');const amount=ticks(value,row,{zero:false});
  if(command==='spend'){if(amount>row.remaining*row.scale+1e-7)throw Error('This item does not have that amount remaining.');return record(data,row,row.usedTicks+amount);}
  if(command==='undo'){if(amount>row.usedTicks)throw Error('Undo only recorded expenditure.');return record(data,row,row.usedTicks-amount);}
  throw Error('Choose Use or Undo for this item counter.');
 }
 function recover(data,gear,event,plan,ref=reference()){
  if(!['dawn','dusk','midnight','short','long'].includes(event)||!plan||typeof plan!=='object'||Array.isArray(plan)||!Object.keys(plan).length)throw Error('Choose items to recover after the stated event.');
  const updates=[];
  for(const [id,value]of Object.entries(plan)){
   const row=current(data,gear,id,ref),rule=row.definition.recharge;if(!row.initialized||!recovers(row.definition,event)||rule.mode==='none')throw Error('Only initialized items with this recovery event can be restored.');
   let regained;
   if(rule.mode==='all'){if(value!==null)throw Error('Full recovery uses the listed maximum.');regained=row.max*row.scale;}
   else if(rule.mode==='fixed'){if(value!==null)throw Error('Fixed recovery uses the listed amount.');regained=rule.amount*row.scale;}
   else if(rule.mode==='roll'){
    const roll=rule.roll,min=Math.max(0,roll.count+roll.bonus),max=roll.count*roll.size+roll.bonus;
    if(!numeric(value)||!Number.isInteger(Number(value))||Number(value)<min||Number(value)>max)throw Error(row.name+': enter the total after rolling '+roll.count+'d'+roll.size+(roll.bonus?(roll.bonus<0?'':'+')+roll.bonus:'')+' ('+min+'–'+max+').');regained=Number(value)*row.scale;
   }else if(rule.mode==='manual')regained=ticks(value,row);else throw Error('This item’s recovery is not supported.');
   updates.push([row,Math.max(0,Math.min(row.usedTicks,row.max*row.scale)-regained)]);
  }
  let next=state(data);for(const [row,usedTicks]of updates)next={...next,[row.id]:{reference:row.reference,usedTicks}};return next;
 }
 function forget(data,id){if(!validId(id))throw Error('Choose an existing item counter.');const next=state(data);delete next[id];return next;}
 const recovers=(definition,event)=>definition.recharge?.event===event||definition.recharge?.events?.includes(event)===true;
 return{normalize,state,definitions,powerDefinitions,archiveLabel,project,initialize,setUsed,change,recover,forget,key,recovers};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterItemResources;
