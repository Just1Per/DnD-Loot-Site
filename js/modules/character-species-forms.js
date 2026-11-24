'use strict';
/* Explicit temporary species effects; elapsed game time and destinations stay with the table. */
var CharacterSpeciesForms=(()=>{
 const definitions={
  'shadar-kai-mpmm:raven-queen':{name:'Blessing of the Raven Queen',level:1,duration:'Until the start of your next turn',expiresOnShortRest:true,confirmation:'I chose a visible unoccupied destination within 30 ft.',detail:'Bonus Action teleport. From character level 3, resist all damage until your next turn starts. Position and teleport destination are resolved at the table.',effect:'raven'},
  'dwarf-2024:stonecunning':{name:'Stonecunning',level:1,duration:'10 minutes',expiresOnShortRest:true,confirmation:'I am on or touching a stone surface.',detail:'Bonus Action. Tremorsense 60 ft works only while on or touching stone. Update stone contact during the effect, and end it when its game duration expires.',effect:'stone'},
  'goliath-2024:large-form':{name:'Large Form',level:5,duration:'10 minutes',expiresOnShortRest:true,confirmation:'There is enough space to become Large.',detail:'Bonus Action. Become Large, gain +10 ft walking Speed and Advantage on Strength checks. Carrying capacity uses the larger size and Powerful Build. End freely; resolve conflicting size effects at the table.',effect:'large'},
  'dragonborn-2024:flight':{name:'Draconic Flight',level:5,duration:'10 minutes',expiresOnShortRest:true,detail:'Bonus Action. Gain flight equal to walking Speed; existing movement penalties still apply. End freely, on Incapacitated, or when the game duration expires.',effect:'flight',endsIncapacitated:true},
  'gem-dragonborn-ftd:flight':{name:'Gem Flight',level:5,duration:'1 minute',expiresOnShortRest:true,detail:'Bonus Action. Gain flight equal to walking Speed and hover. End when its game duration expires; this has no Concentration requirement.',effect:'flight',hover:true},
  'chromatic-dragonborn-ftd:warding':{name:'Chromatic Warding',level:5,duration:'1 minute',expiresOnShortRest:true,detail:'Action. Gain immunity only to the selected chromatic ancestry’s damage type. End when its game duration expires; other resistances remain unchanged.',effect:'warding'}
 };
 const species=()=>globalThis.CharacterSpeciesResources||(typeof require==='function'?require('./character-species-resources'):null),shared=()=>globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null),stored=data=>data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},activeKey=(race,id)=>'species:'+race+':'+id+'-active',stoneKey='species:dwarf-2024:stonecunning-stone';
 const damageTypes=['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder'];
 function consciousAtZero(data,level){if(Number(data.hpCurrent)>0)return false;const context=(globalThis.CharacterBarbarianSubclasses||(typeof require==='function'?require('./character-barbarian-subclasses'):null))?.context(data,{level});return !!context?.active&&context.id==='zealot'&&context.edition==='2014'&&context.level>=14&&context.raging;}
 const supported=(race,id,level=1)=>!!definitions[race+':'+id]&&Number(level)>=definitions[race+':'+id].level;
 function state(data,{level=1,mods={}}={}){
  const race=data.build?.race,definition=Object.entries(definitions).find(([key])=>key.startsWith(race+':'));
  if(!definition)return {available:false,active:false,canActivate:false};
  const [identity,def]=definition,id=identity.slice(race.length+1),resource=species().resources(data,{level,mods}).find(row=>row.featureId===id),key=activeKey(race,id),ledger=stored(data).classFeatureChoices||{},flag=ledger[key],rawActive=Array.isArray(flag)&&flag[0]==='active'&&(def.effect==='warding'?flag.length===2&&typeof flag[1]==='string':flag.length===1),available=!!resource&&supported(race,id,level),Carry=globalThis.CharacterCarrying||(typeof require==='function'?require('./character-carrying'):null),conditions=available?Carry.conditions(data):{recognized:[]},zeroRage=available&&consciousAtZero(data,level),incapacitated=conditions.recognized.some(name=>['incapacitated','paralyzed','petrified','stunned','unconscious'].includes(name))||(!Number.isFinite(Number(data.hpCurrent))||Number(data.hpCurrent)<=0&&!zeroRage),dead=conditions.exhaustion===6||Number(data.deathFailure)>=3&&!zeroRage||/(?:^|[,;|\n])\s*dead\s*(?:$|[,;|\n])/i.test(data.conditions||''),profile=available?(globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null)).profile(data.build,level):null,ancestry=def.effect==='warding'&&Object.hasOwn(profile?.optionChoices||{},data.build.raceFeature)?profile.resistances?.find(type=>damageTypes.includes(String(type).toLowerCase())):'',onStone=def.effect==='stone'&&Array.isArray(ledger[stoneKey])&&ledger[stoneKey].length===1&&ledger[stoneKey][0]==='stone',active=available&&resource.counterValid&&resource.used>0&&rawActive&&!(def.endsIncapacitated&&incapacitated)&&!(def.effect==='warding'&&(!ancestry||flag?.[1]!==data.build.raceFeature))&&!(def.effect==='raven'&&level<3);
  return{available,active,rawActive,key,race,id,resource,def,incapacitated,dead,ancestry,onStone,canActivate:available&&resource.counterValid&&resource.remaining>0&&!resource.useDisabled&&!incapacitated&&!dead&&(def.effect!=='warding'||!!ancestry)};
 }
 function activate(data,{level=1,mods={},confirmed=false,onStone=false}={}){
  const s=state(data,{level,mods});if(!s.canActivate||confirmed!==true||s.def.effect==='stone'&&onStone!==true)return false;
  const updates={[s.resource.key]:[String(s.resource.used+1)],[s.key]:s.def.effect==='raven'&&level<3?[]:s.def.effect==='warding'?['active',data.build.raceFeature]:['active']};if(s.def.effect==='stone')updates[stoneKey]=['stone'];return shared().save(data,updates);
 }
 function end(data,{level=1,mods={}}={}){const s=state(data,{level,mods});if(!s.key)return false;const updates={[s.key]:[]};if(s.def.effect==='stone'&&Object.hasOwn(stored(data).classFeatureChoices||{},stoneKey))updates[stoneKey]=[];return shared().save(data,updates);}
 function undo(data,context={}){const s=state(data,context);if(!s.available||!s.resource.counterValid||!s.resource.used)return false;const updates={[s.key]:[],[s.resource.key]:[String(s.resource.used-1)]};if(s.def.effect==='stone'&&Object.hasOwn(stored(data).classFeatureChoices||{},stoneKey))updates[stoneKey]=[];return shared().save(data,updates);}
 function setStone(data,value,context={}){const s=state(data,context);return typeof value==='boolean'&&s.active&&s.def.effect==='stone'&&shared().save(data,{[stoneKey]:value?['stone']:[]});}
 function endInvalid(data,context={}){
  const s=state(data,context),ledger=stored(data).classFeatureChoices||{},updates={};
  for(const identity of Object.keys(definitions)){const split=identity.lastIndexOf(':'),key=activeKey(identity.slice(0,split),identity.slice(split+1));if(Object.hasOwn(ledger,key)&&(!Array.isArray(ledger[key])||ledger[key].length)&&!(s.key===key&&s.active))updates[key]=[];}
  if(Object.hasOwn(updates,activeKey('dwarf-2024','stonecunning'))&&Object.hasOwn(ledger,stoneKey))updates[stoneKey]=[];
  return shared().save(data,updates);
 }
 function onEvent(data,event,context={}){if(event==='long'||event==='short'){const ledger=stored(data).classFeatureChoices||{},updates={};for(const [identity,def]of Object.entries(definitions)){if(event==='short'&&!def.expiresOnShortRest)continue;const split=identity.lastIndexOf(':'),key=activeKey(identity.slice(0,split),identity.slice(split+1));if(Object.hasOwn(ledger,key))updates[key]=[];}if(Object.hasOwn(ledger,stoneKey)&&(event==='long'||definitions['dwarf-2024:stonecunning'].expiresOnShortRest))updates[stoneKey]=[];return shared().save(data,updates);}if(event==='turn'&&data.build?.race==='shadar-kai-mpmm')return end(data,context);return endInvalid(data,context);}
 function apply(data,result,{level=1}={}){
  const s=state(data,{level,mods:result.mods});result.speciesForm={available:s.available,active:s.active,name:s.def?.name||'',effect:s.def?.effect||'',expiresOnShortRest:!!s.def?.expiresOnShortRest,duration:s.def?.duration||'',onStone:s.onStone};if(!s.active)return result;
  const e=result.effects,add=(field,value)=>e[field]=[...new Set([...(e[field]||[]),value])];add('traits',s.def.name+' active · '+s.def.duration+' · '+s.def.detail);
  if(s.def.effect==='raven')for(const type of damageTypes)add('resistances',type[0].toUpperCase()+type.slice(1));
  if(s.def.effect==='warding')add('immunities',s.ancestry+' damage');
  if(s.def.effect==='stone'&&s.onStone){e.tremorsense=Math.max(e.tremorsense||0,60);e.specialSenses=[...(e.specialSenses||[]).filter(row=>row.id!=='species-stonecunning'),{id:'species-stonecunning',name:'Stonecunning',detail:'Tremorsense 60 ft only while on or touching stone.'}];}
  if(s.def.effect==='large'){
   const Carry=globalThis.CharacterCarrying||(typeof require==='function'?require('./character-carrying'):null);result.carrying=Carry.limits(data,{scores:result.scores,effects:e});if(result.barbarianSubclass?.carryMultiplier)for(const key of ['capacity','pushDragLift'])result.carrying[key]*=result.barbarianSubclass.carryMultiplier;
   for(const row of result.magicItems?.active||[])if(row.magicActive&&row.meta.rule?.speed?.climb?.mode==='walking')e.climb=Math.max(e.climb||0,e.speed);
  }
  if(s.def.effect==='flight'){e.fly=Math.max(Number(e.fly)||0,Number(e.speed)||0);if(s.def.hover)e.hover=true;}
  return result;
 }
 function applyMovement(data,result,{level=1}={}){
  const s=state(data,{level,mods:result.mods});if(!s.active||s.def.effect!=='large')return result;
  const e=result.effects,sizes=['Tiny','Small','Medium','Large','Huge','Gargantuan'];e.size=sizes[Math.max(3,sizes.indexOf(e.size))];e.speed=(Number(e.speed)||0)+10;e.checkAdvantages=[...new Set([...(e.checkAdvantages||[]),'str'])];
  if(result.classMovement)result.classMovement={...result.classMovement,speed:e.speed,calculation:result.classMovement.calculation+' Large Form adds 10 ft walking Speed before conditional class effects.'};return result;
 }
 function onZeroHP(data){const key=activeKey('dragonborn-2024','flight');if(!Object.hasOwn(stored(data).classFeatureChoices||{},key))return true;return shared().save(data,{[key]:[]});}
 return{definitions,supported,state,activate,end,undo,setStone,endInvalid,onEvent,apply,applyMovement,onZeroHP};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterSpeciesForms=CharacterSpeciesForms;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpeciesForms;
