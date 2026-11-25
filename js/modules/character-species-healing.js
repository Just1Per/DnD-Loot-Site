'use strict';
/* Explicit Healing Hands payment; other recipients remain table-owned. */
var CharacterSpeciesHealing=(()=>{
 const definitions={'aasimar-mpmm':{source:'MPMM',action:'Action'},'aasimar-2024':{source:'XPHB',action:'Magic action'}};
 const resources=()=>globalThis.CharacterSpeciesResources||(typeof require==='function'?require('./character-species-resources'):null);
 const model=()=>globalThis.CharacterSheetModel||(typeof require==='function'?require('./character-sheet-model'):null);
 const forms=()=>globalThis.CharacterSpeciesForms||(typeof require==='function'?require('./character-species-forms'):null);
 const shared=()=>globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null);
 const supported=(race,id)=>Object.hasOwn(definitions,race)&&id==='healing-hands';
 function state(data,{level=1,loot=[],stats}={}){
  level=resources().effectiveLevel(data,level);const race=data.build?.race;
  if(!supported(race,'healing-hands'))return{available:false,canUse:false};
  const resource=resources().resources(data,{level}).find(row=>row.featureId==='healing-hands');
  if(!resource)return{available:false,canUse:false};
  const actual=stats||model().derive(data,level,loot),pb=actual.pb,validPB=Number.isSafeInteger(pb)&&pb>=1&&pb<=20,Wild=globalThis.CharacterWildShape||(typeof require==='function'?require('./character-wild-shape'):null),wild=Wild?.state(data,level),shaped=!!wild?.available&&!!wild.activeId,profile=shaped&&!wild.modern?Wild.profile(data,{level,loot}):null;
  const selfPool=profile?.valid?'wild-shape':'body',selfHP=selfPool==='wild-shape'?profile.hp:data.hpCurrent,hpMax=selfPool==='wild-shape'?profile.hpMax:actual.hpMax,actor=forms().actorState(selfPool==='wild-shape'?{...data,hpCurrent:selfHP}:data,level),shapeReason=shaped?(wild.modern?'Species traits are not retained during 2024 Wild Shape. Return to normal form to use Healing Hands.':!profile?.valid||!Number.isSafeInteger(selfHP)?'Load and resolve the active Wild Shape under Companions before using Healing Hands.':''):'';
  const key='species:'+race+':healing-hands-last',raw=shared().stored(data).classFeatureChoices?.[key];
  let last=null;if(Array.isArray(raw)&&raw.length===3&&['self','other','form'].includes(raw[0])&&/^\d{1,3}$/.test(raw[1])&&(raw[2]==='table'||/^\d{1,3}$/.test(raw[2]))){const rolled=Number(raw[1]),applied=raw[2]==='table'?null:Number(raw[2]);if(rolled>=1&&rolled<=80&&(raw[0]==='other'&&applied===null||['self','form'].includes(raw[0])&&Number.isInteger(applied)&&applied>=0&&applied<=rolled))last={recipient:raw[0]==='form'?'self':raw[0],rolled,applied,...(raw[0]==='form'?{pool:'wild-shape'}:{})};}
  return{available:true,race,level,definition:definitions[race],resource,key,pb,validPB,min:validPB?pb:0,max:validPB?4*pb:0,hpMax,selfHP,selfPool,...(selfPool==='wild-shape'?{formName:profile.name,formKey:wild.keys.hp}:{}),reason:shapeReason,last,...actor,canUse:validPB&&!shapeReason&&resource.counterValid&&resource.remaining>0&&!actor.dead&&!actor.incapacitated};
 }
 function use(data,{level=1,loot=[],roll,recipient,confirmed=false}={}){
  const s=state(data,{level,loot});if(!s.canUse||confirmed!==true||!['self','other'].includes(recipient)||!Number.isSafeInteger(roll)||roll<s.min||roll>s.max)return false;
  const hp=Number(s.selfHP);if(recipient==='self'&&(!Number.isSafeInteger(hp)||!Number.isSafeInteger(s.hpMax)||s.hpMax<0))return false;
  const applied=recipient==='self'?Math.max(0,Math.min(roll,s.hpMax-hp)):null;
  const form=recipient==='self'&&s.selfPool==='wild-shape',updates={[s.resource.key]:[String(s.resource.used+1)],[s.key]:[form?'form':recipient,String(roll),applied===null?'table':String(applied)],...(form?{[s.formKey]:[String(hp+applied)]}:{})};
  if(!shared().save(data,updates))return false;
  if(recipient==='self'&&!form)model().restoreHP(data,roll,s.hpMax);
  return{recipient,rolled:roll,applied,...(form?{pool:'wild-shape'}:{})};
 }
 function undo(data,context={}){
  const s=state(data,context);if(!s.available||!s.resource.counterValid||!s.resource.used)return false;
  return shared().save(data,{[s.resource.key]:[String(s.resource.used-1)],[s.key]:[]});
 }
 return{definitions,supported,state,use,undo};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterSpeciesHealing=CharacterSpeciesHealing;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpeciesHealing;
