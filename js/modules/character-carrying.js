'use strict';
/* Shared carrying limits. Owned inventory supplies weight; paper references never add it. */
var CharacterCarrying=(()=>{
 const referenceLists=new WeakMap(),weightIndexes=new WeakMap();
 const sizes=['Tiny','Small','Medium','Large','Huge','Gargantuan'],factors=[.5,1,1,2,4,8];
 const stored=data=>data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{};
 function normalize(raw={}){const n=['string','number'].includes(typeof raw?.multiplier)?Number(raw.multiplier):NaN;return{mode:raw?.mode==='variant'?'variant':'basic',includeCoins:raw?.includeCoins!==false,multiplier:raw?.multiplier!==''&&raw?.multiplier!==null&&Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n*100)/100)):1};}
 function limits(data,{scores={},effects={}}={}){
  const settings=normalize(stored(data).carrying),value=String(effects.size||''),fallback=String(data?.profile?.size||''),size=sizes.find(s=>s.toLowerCase()===value.toLowerCase())||(!effects.race?sizes.find(s=>s.toLowerCase()===fallback.toLowerCase()):null)||'Medium';
  const strength=Math.max(0,Math.min(30,Number(scores.str)||0)),sizeIndex=sizes.indexOf(size),steps=effects.race?.carryingSizeSteps===1?1:0,effectiveSize=sizes[Math.min(sizes.length-1,sizeIndex+steps)],factor=factors[sizes.indexOf(effectiveSize)],unit=strength*factor*settings.multiplier;
  return{...settings,strength,size,effectiveSize,sizeFactor:factor,largerSize:steps===1,raceName:effects.race?.name||'',enabled:settings.multiplier>0,capacity:unit*15,pushDragLift:unit*30,encumbered:unit*5,heavilyEncumbered:unit*10};
 }
 function status(limits,weight={}){
  const invalid=!Number.isFinite(weight.total)||weight.total<0,total=invalid?0:weight.total,unknown=Math.max(invalid?1:0,Number(weight.unknown)||0),over=limits.enabled&&total>limits.capacity;
  const state=!limits.enabled?'disabled':over?'over':unknown?'unknown':limits.mode==='variant'&&total>limits.heavilyEncumbered?'heavy':limits.mode==='variant'&&total>limits.encumbered?'encumbered':'normal';
  const labels={disabled:'Capacity limits disabled',over:'Over carrying capacity',unknown:'Weight total incomplete',heavy:'Heavily encumbered',encumbered:'Encumbered',normal:'Within carrying capacity'};
  const detail=state==='over'?'This known load exceeds carrying capacity; remove or store weight before carrying it.':state==='unknown'?'Some carried items have no known weight. Complete their weights before judging the load.':state==='heavy'?'2014 variant guidance: speed reduced by 20 ft; disadvantage on physical ability checks, attacks and saves.':state==='encumbered'?'2014 variant guidance: speed reduced by 10 ft.':state==='disabled'?'Weights are still recorded; this sheet does not apply a capacity limit.':'The recorded load is within the selected limits.';
  return{...limits,total,unknown,state,label:labels[state],detail};
 }
 function edit(raw,field,value){const out=normalize(raw);if(field==='mode'){if(!['basic','variant'].includes(value))throw Error('Choose a carrying rule.');out.mode=value;}else if(field==='includeCoins'){if(typeof value!=='boolean')throw Error('Choose whether coins count.');out.includeCoins=value;}else if(field==='multiplier'){const n=['string','number'].includes(typeof value)?Number(value):NaN;if(String(value).trim()===''||!Number.isFinite(n)||n<0||n>100||Math.abs(n*100-Math.round(n*100))>1e-7)throw Error('Use a capacity multiplier from 0 to 100, with at most two decimals.');out.multiplier=n;}else throw Error('Choose an available carrying setting.');return out;}
 function references(){const data=globalThis.CharacterAdobeData||(typeof require==='function'?require('./character-adobe-data'):{});if(!referenceLists.has(data))referenceLists.set(data,[...(data.gear||[]),...(data.baseEquipment||[])]);return referenceLists.get(data);}
 function unitWeight(item={},baseGear=references()){
  const raw=item.properties?.find(p=>p.title==='Weight per unit (lb)')?.text;
  if(raw!==undefined&&raw!==null&&raw!==''&&Number.isFinite(Number(raw))&&Number(raw)>=0)return Number(raw);
  if(!weightIndexes.has(baseGear)){const index=new Map();for(const row of baseGear)for(const name of [row.name,row.unitName])if(name&&!index.has(name.toLowerCase()))index.set(name.toLowerCase(),row.weight);weightIndexes.set(baseGear,index);}
  const index=weightIndexes.get(baseGear),equipment=globalThis.CharacterEquipment||(typeof require==='function'?require('./character-equipment'):null),mechanics=equipment?.infer(item),baseName=mechanics?.kind==='shield'?'Shield':mechanics&&equipment.profile(mechanics,item.edition||'2014')?.name;
  const value=index.get(String(item.name||'').toLowerCase())??(baseName?index.get(baseName.toLowerCase()):undefined);
  return value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
 }
 function rowsWeight(entries,unit=entry=>entry.weight){
  let gear=0,unknown=0;for(const entry of entries){const quantity=Number(entry.quantity);if(!Number.isFinite(quantity)||quantity<=0)continue;const weight=unit(entry);if(weight===null||weight===undefined||weight===''||!Number.isFinite(Number(weight))||Number(weight)<0||!Number.isFinite(Number(weight)*quantity)||!Number.isFinite(gear+Number(weight)*quantity))unknown++;else gear+=Number(weight)*quantity;}return{gear,unknown};
 }
 function weight(data,entries,baseGear=references()){
  const seen=new Set(),scoped=entries.filter(entry=>!entry.id||!seen.has(entry.id)&&seen.add(entry.id)),row=rowsWeight(scoped,entry=>unitWeight(entry.item||{},baseGear));let coins=0;
  if(normalize(stored(data).carrying).includeCoins)for(const value of Object.values(data.coins||{})){const count=Number(value);if(!Number.isFinite(count)||count<0||!Number.isFinite(coins+count/50))row.unknown++;else coins+=count/50;}
  return{gear:row.gear,coins,total:row.gear+coins,unknown:row.unknown};
 }
 // Movement facts from SRD5.1/5.2; see docs/adobe-movement-and-load.md.
 // Retain free text, recognize complete labels only, and never end conditions on rest.
 function conditions(data){
  const edition=data.build?.edition==='2024'?'2024':'2014',recognized=new Set(),zero=['grappled','restrained','paralyzed','petrified','unconscious',...(edition==='2014'?['stunned']:[])];let exhaustion=0,missingLevel=false;
  for(const raw of String(data.conditions||'').split(/[,;|\n]+/)){
   const token=raw.trim().toLowerCase();if(/\((?:ended|inactive|immune\b|removed|cleared|expired|not active|no longer)[^)]*\)\s*$/.test(token))continue;const level=/^exhaustion\s*(?:(?:(?:level|lvl\.?)\s*|:\s*)?([0-6])|\(([0-6])\))(?:\s*\([^)]*\))?$/.exec(token),name=token.replace(/\s*\([^)]*\)\s*$/,'').trim();
   if(level){exhaustion=Math.max(exhaustion,Number(level[1]??level[2]));continue;}
   if(name==='exhaustion')missingLevel=true;
   if([...zero,'prone','frightened','stunned','incapacitated'].includes(name))recognized.add(name);
  }
  const stopped=[...recognized].find(name=>zero.includes(name))||((edition==='2014'&&exhaustion>=5)||exhaustion===6?'exhaustion':''),penalty=edition==='2024'?5*exhaustion:0,multiplier=edition==='2014'&&exhaustion>=2?.5:1,notes=[];
  if(stopped)notes.push(stopped[0].toUpperCase()+stopped.slice(1)+': movement is stopped.');
  if(exhaustion)notes.push(edition==='2024'?'Exhaustion '+exhaustion+': Speed −'+penalty+' ft. D20 tests also take −'+(2*exhaustion)+'; resolve that separate effect with your roll.':'Exhaustion '+exhaustion+': '+(exhaustion>=5?'Speed 0.':exhaustion>=2?'Speed halved.':'Speed unchanged.')+' Ability checks have Disadvantage.'+(exhaustion>=3?' Attacks and saves also have Disadvantage.':'')+(exhaustion>=4?' Maximum HP is also halved; resolve that separately.':''));
  if(exhaustion===6)notes.push('Exhaustion level 6 means death.');
  if(recognized.has('prone'))notes.push('Prone: crawl with extra movement cost, or spend half your Speed to stand. Speed 0 prevents standing.');
  if(recognized.has('frightened'))notes.push('Frightened: you cannot willingly move closer to the source of your fear.');
  if(edition==='2024'&&recognized.has('stunned'))notes.push('Stunned (2024): Speed is unchanged. Apply its other condition effects when resolving actions and rolls.');
  if(missingLevel&&!exhaustion)notes.push('Enter an explicit Exhaustion level, for example Exhaustion 2, to calculate its movement effect.');
  return{edition,recognized:[...recognized],exhaustion,missingLevel,stopped,penalty,multiplier,notes};
 }
 function movement(data,{limits:capacity,weight:load={total:0,unknown:0},scores={},effects={},gear={},magicItems={}}={}){
  const armor=(gear.entries||[]).find(row=>row.active&&row.mechanics.kind==='armor'),boots=(magicItems.active||[]).find(row=>row.magicActive&&row.meta.rule?.speed?.ignoreArmorAndEncumbrance),dwarf=effects.race?.ignoreHeavyArmorSpeed===true,baseSpeed=Math.max(0,Number(effects.speed)||0);
  const armorPenalty=capacity.mode!=='variant'&&armor?.profile?.group==='heavy'&&Number(scores.str)<armor.profile.strength&&!boots&&!dwarf?10:0,heavy=capacity.enabled&&capacity.mode==='variant'&&load.total>capacity.heavilyEncumbered,encumbered=capacity.enabled&&capacity.mode==='variant'&&load.total>capacity.encumbered,loadPenalty=boots?0:heavy?20:encumbered?10:0,overCapacity=capacity.enabled&&load.total>capacity.capacity,speeds={};
  const condition=conditions(data);for(const key of ['speed','climb','swim','fly','burrow'])if(Number.isFinite(effects[key])){const reduced=Math.max(0,effects[key]-armorPenalty-loadPenalty-condition.penalty);speeds[key]=condition.stopped?0:condition.multiplier===.5?Math.floor(reduced/2):reduced;}
  const speed=speeds.speed??baseSpeed,notes=[];if(armorPenalty)notes.push(armor.item.name+': STR '+scores.str+' is below '+armor.profile.strength+'; −10 ft.');if(loadPenalty)notes.push('2014 variant encumbrance: −'+loadPenalty+' ft.');if(capacity.mode==='variant'&&armor?.profile?.strength>Number(scores.str))notes.push('Variant encumbrance uses carried weight instead of the armor Strength requirement.');if(heavy)notes.push('Disadvantage on physical rolls: Strength, Dexterity and Constitution checks, attacks and saves.');if(boots)notes.push(boots.item.name+' prevents armor and encumbrance speed reductions.');if(dwarf&&capacity.mode!=='variant'&&armor?.profile?.strength>Number(scores.str))notes.push('Dwarven Speed prevents the Heavy armor speed reduction.');if(load.unknown)notes.push('Some weights are unknown; the known load gives only a minimum penalty.');if(overCapacity)notes.push('This load exceeds carrying capacity. The speed calculation does not permit carrying that load.');
  notes.push(...condition.notes);const summary='Walking speed '+speed+' ft · before armor/load/conditions '+baseSpeed+' ft.';
  return{speed,speeds,baseSpeed,armorPenalty,loadPenalty,physicalDisadvantage:heavy,unknownWeights:load.unknown,overCapacity,conditions:condition,notes,summary,detail:summary+' '+notes.join(' ')};
 }
 return{normalize,stored,limits,status,edit,unitWeight,rowsWeight,weight,movement,conditions,range:(a,b)=>Math.floor(a+1)+' – '+Math.floor(b)+' lb'};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterCarrying=CharacterCarrying;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterCarrying;
