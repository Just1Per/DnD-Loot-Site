'use strict';
/* Source HP-menu semantics, using the shared progression calculator; no character mutation. */
var CharacterHitPointOptions=(()=>{
 const P=typeof CharacterProgression!=='undefined'?CharacterProgression:require('./character-progression');
 const automaticModes=['fixed','average','max','rolled'],modes=[...automaticModes,'manual'];
 const mode=value=>modes.includes(value)?value:'fixed';
 function maximum(value){if(value===null||typeof value==='boolean'||String(value).trim()===''||!Number.isSafeInteger(Number(value))||Number(value)<0||Number(value)>1000000)throw Error('Enter a whole maximum HP from 0 to 1,000,000.');return Number(value);}
 function normalizeOverride(value){return value&&Number.isSafeInteger(value.value)&&value.value>=0&&value.value<=1000000&&typeof value.basis==='string'&&value.basis.length>0&&value.basis.length<=4000?{value:value.value,basis:value.basis}:null;}
 function basis(options){return JSON.stringify({mode:mode(options.hpMode),classes:P.normalizeClassLevels(options.classLevels),constitution:Number(options.constitution),bonuses:Number(options.bonuses)||0,rolls:options.hpMode==='rolled'?(options.hpRolls||[]).slice(0,19):[]});}
 const setOnce=(value,options)=>({value:maximum(value),basis:basis(options)});
 function project(options,{hpMode,hpOverride,hpMax=0}={}){
  const selected=mode(hpMode),input={...options,hpMode:selected},calculated=P.calculateHP(input),override=normalizeOverride(hpOverride),once=selected!=='manual'&&override?.basis===basis(input);
  const manual=Number.isSafeInteger(hpMax)&&hpMax>=0&&hpMax<=1000000?hpMax:calculated.max;
  const max=selected==='manual'?manual:once?override.value:calculated.max;
  return {...calculated,mode:selected,referenceMode:calculated.mode,automaticMax:calculated.max,max,once:!!once,manualAdjustment:max-calculated.max};
 }
 const choices=options=>['average','fixed','max'].map(hpMode=>({mode:hpMode,max:P.calculateHP({...options,hpMode}).max}));
 return {modes,mode,maximum,normalizeOverride,basis,setOnce,project,choices};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterHitPointOptions;
