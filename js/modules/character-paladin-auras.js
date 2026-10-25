'use strict';
/* Own-aura contributions only; allies and competing auras are resolved at the table. */
var CharacterPaladinAuras=(()=>{
 const Choices=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null);
 const key=edition=>edition+':paladin:aura-protection-suppressed';
 function derive(data,{level=1,mods={}}={}){
  const actual=Choices.paladinLevels(data,level),edition=data.build?.edition==='2024'?'2024':'2014',available=actual>=6,stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},suppressed=Choices.normalize(stored.classFeatureChoices)[key(edition)]?.[0]==='1';
  const conditions=String(data.conditions||'').split(/[,;|\n]+/).map(value=>value.trim().replace(/\s*\([^)]*\)\s*$/,'').trim().toLowerCase()),blocking=edition==='2024'?['incapacitated','paralyzed','petrified','stunned','unconscious']:['unconscious'],condition=conditions.find(value=>blocking.includes(value))||'',active=available&&!suppressed&&!condition,modifier=Math.max(-5,Math.min(10,Math.trunc(Number(mods.cha)||0))),baseBonus=available?Math.max(1,modifier):0;
  return{level:actual,edition,key:key(edition),available,enabled:!suppressed,active,condition,bonus:active?baseBonus:0,baseBonus,range:available?(actual>=18?30:10):0,courageAvailable:actual>=10,courageActive:active&&actual>=10,reason:!available?'Requires Paladin level 6.':suppressed?'Own aura is not applied.':condition?'Inactive while '+condition+'.':'Included in your saving throws.'};
 }
 function setEnabled(data,enabled,context={}){
  if(typeof enabled!=='boolean'||!derive(data,context).available)return false;const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},edition=data.build?.edition==='2024'?'2024':'2014';data.adobe={...stored,classFeatureChoices:{...Choices.normalize(stored.classFeatureChoices),[key(edition)]:[enabled?'0':'1']}};return true;
 }
 function describe(aura){return !aura?.available?'':`Aura of Protection · ${aura.range} ft · ${aura.active?'+'+aura.bonus+' to all your saving throws.':aura.reason}${aura.courageAvailable?' Aura of Courage: '+(aura.courageActive?'you and eligible allies in range cannot be Frightened.':'inactive with the aura.'):''} Other Paladins’ Aura of Protection bonuses do not stack.`;}
 return{derive,setEnabled,describe};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaladinAuras;
