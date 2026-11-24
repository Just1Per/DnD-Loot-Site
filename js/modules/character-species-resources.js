'use strict';
/* Source-specific counters; recording a use never applies another creature's HP or a temporary form. */
var CharacterSpeciesResources=(()=>{
 const D=typeof CharacterSpeciesResourceData!=='undefined'?CharacterSpeciesResourceData:require('./character-species-resource-data');
 const definitions=D.species,stored=data=>data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},key=(race,id)=>'species:'+race+':'+id+'-used';
 const choiceKey=(race,id)=>'species:'+race+':'+id+'-turn';
 const counterKeys=new Set(),turnKeys=new Set();for(const [race,row]of Object.entries(definitions))for(const feature of row.resources){counterKeys.add(key(race,feature.id));if(feature.oncePerTurn)turnKeys.add(choiceKey(race,feature.id));}
 function invalidChoice(key,value){if(!counterKeys.has(key)&&!turnKeys.has(key))return false;return !Array.isArray(value)||value.length>1||value.length===1&&(typeof value[0]!=='string'||!(turnKeys.has(key)?/^[01]$/:/^\d{1,4}$/).test(value[0]));}
 function resources(data,{level=1,mods={}}={}){
  const R=globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null),race=data.build?.race,profile=R?.profile(data.build,level),definition=definitions[race];if(!profile||!definition)return[];
  const total=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),Modifiers=globalThis.CharacterModifiers||(typeof require==='function'?require('./character-modifiers'):null),pb=Modifiers?Modifiers.proficiency(data,Math.ceil(total/4)+1):Math.ceil(total/4)+1,con=Math.max(-5,Math.min(10,Math.trunc(Number(mods.con)||0))),ability=data.build.raceAbility,choices=stored(data).classFeatureChoices||{},option=Object.hasOwn(profile.optionChoices||{},data.build.raceFeature)?profile.optionChoices[data.build.raceFeature]:null,validAbility=['int','wis','cha'].includes(ability);
  const values={pb,twicePB:2*pb,hop:5*pb,conDC:8+pb+con,conSign:(con<0?'−':'+')+' '+Math.abs(con),legacyBreath:(total>=16?5:total>=11?4:total>=6?3:2)+'d6',modernBreath:(total>=17?4:total>=11?3:total>=5?2:1)+'d10',healingAction:profile.edition==='2024'?'Magic action':'Action',featureDC:validAbility?8+pb+(Number(mods[ability])||0):'8 + '+pb+' + your chosen INT/WIS/CHA modifier',breathShape:race==='chromatic-dragonborn-ftd'?'30 ft line, 5 ft wide; Dexterity save':race==='dragonborn-2024'?'15 ft cone or 30 ft line, 5 ft wide; Dexterity save':'15 ft cone; Dexterity save'};
  const render=(text,extra={})=>String(text||'').replace(/\{([a-zA-Z]+)\}/g,(_,name)=>extra[name]??values[name]??'');
  return definition.resources.filter(row=>row.level<=total).map(row=>{
   const ledger=key(race,row.id),raw=choices[ledger],valid=raw===undefined||Array.isArray(raw)&&(raw.length===0||raw.length===1&&typeof raw[0]==='string'&&/^\d{1,4}$/.test(raw[0])),max=row.uses==='pb'?pb:row.uses,used=valid?Math.min(10000,Number(raw?.[0])||0):max,turnKey=choiceKey(race,row.id),turnSpent=choices[turnKey],blocked=!!row.requiresOption&&!option||!!row.oncePerTurn&&turnSpent!==undefined&&!(Array.isArray(turnSpent)&&turnSpent.length===0||Array.isArray(turnSpent)&&turnSpent.length===1&&turnSpent[0]==='0');
   const detail=[render(row.detail,{optionName:option?.name||'species',optionDetail:render(option&&Object.hasOwn(row.optionDetails||{},data.build.raceFeature)?row.optionDetails[data.build.raceFeature]:'Choose an option in Origins.')}),...(row.afterLevel||[]).filter(note=>note.level<=total).map(note=>render(note.detail)),...(!valid?['The saved counter needs correction or its recovery event before another use.']:[]),...(row.requiresOption&&!option?['Choose this species feature in Origins before recording a use.']:[])].join(' ');
   return{id:'species-'+row.id,key:ledger,name:row.name,source:profile.name+' · '+row.reference.source,className:profile.name,level:total,levelSummary:'Character level '+total,max,used,remaining:Math.max(0,max-used),resets:row.resets,recovery:row.resets.includes('short')?'Short or Long Rest recovery':'Long Rest recovery',unit:'uses',useLabel:'Record '+row.name+' use',undoLabel:'Undo recorded use',description:detail,speciesResource:true,species:race,featureId:row.id,useDisabled:!valid||blocked,maxSpend:1,...(row.oncePerTurn?{turnKey,turnBlocked:blocked}:{})};
  });
 }
 function setUsed(data,id,value,context={}){
  const row=resources(data,context).find(row=>row.id===id);
  if(!row||!Number.isInteger(value)||value<0||value>row.used&&(row.useDisabled||value-row.used!==1||value>row.max))return false;
  const Shared=globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null),updates={[row.key]:[String(value)]};if(row.turnKey&&value!==row.used)updates[row.turnKey]=value>row.used?['1']:[];
  return Shared.save(data,updates);
 }
 function onEvent(data,event){
  if(!['short','long','turn'].includes(event))return false;
  const choices=stored(data).classFeatureChoices||{},updates={};
  for(const [race,definition]of Object.entries(definitions))for(const row of definition.resources){const ledger=key(race,row.id),turnKey=choiceKey(race,row.id);if(row.resets.includes(event)&&Object.hasOwn(choices,ledger))updates[ledger]=['0'];if(row.oncePerTurn&&['turn','short','long'].includes(event)&&Object.hasOwn(choices,turnKey))updates[turnKey]=[];}
  return(globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null)).save(data,updates);
 }
 function newTurn(data,id,context={}){const row=resources(data,context).find(row=>row.id===id);if(!row?.turnKey)return false;return(globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null)).save(data,{[row.turnKey]:[]});}
 return{definitions,resources,setUsed,onEvent,newTurn,invalidChoice};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterSpeciesResources=CharacterSpeciesResources;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpeciesResources;
