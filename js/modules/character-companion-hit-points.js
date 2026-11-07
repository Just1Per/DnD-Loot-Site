'use strict';
/* Creature Hit Dice never maximize a character's first level. No source-script execution. */
var CharacterCompanionHitPoints=(()=>{
 const H=typeof CharacterHitPointOptions!=='undefined'?CharacterHitPointOptions:require('./character-hit-point-options'),modes=['manual','average','fixed','max'];
 const bounded=(value,fallback,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.trunc(Number(value)))):fallback;
 function settings(raw={}){const override=H.normalizeOverride(raw.hpOverride);return{hpMode:modes.includes(raw.hpMode)?raw.hpMode:'manual',hpAdjustment:bounded(raw.hpAdjustment,0,-100000,100000),hpOverride:override&&override.value<=100000?override:null};}
 function inputs(companion,creature){const count=Number(creature?.hd?.[0]),die=Number(creature?.hd?.[1]),con=Number(companion.abilities?.con),known=Number.isSafeInteger(count)&&count>0&&count<=1000&&Number.isSafeInteger(die)&&die>0&&die<=100&&Number.isFinite(con)&&con>=1&&con<=30;return{known,count,die,con,conMod:known?Math.floor((con-10)/2):0,creature:creature?.id||creature?.name||''};}
 const basis=(c,meta)=>{const state=inputs(c,meta),s=settings(c);return JSON.stringify({creature:state.creature,count:state.count,die:state.die,con:state.con,mode:s.hpMode,adjustment:s.hpAdjustment});};
 function project(companion,creature){
  const state=inputs(companion,creature),s=settings(companion),manual=bounded(companion.hpMax,1,0,100000);let choices=[];
  if(state.known)choices=[['average',(state.die+1)/2],['fixed',Math.ceil((state.die+1)/2)],['max',state.die]].map(([mode,value])=>({mode,max:Math.max(0,Math.min(100000,Math.round(Math.max(1,value+state.conMod)*state.count+s.hpAdjustment)))}));
  const automatic=choices.find(row=>row.mode===s.hpMode),once=!!automatic&&s.hpOverride?.basis===basis(companion,creature),max=s.hpMode==='manual'||!automatic?manual:once?s.hpOverride.value:automatic.max;
  return{...state,...s,choices,max,once,automaticMax:automatic?.max??manual,basis:basis(companion,creature),available:!!automatic};
 }
 function normalize(companion,creature){const s=settings(companion),r=project({...companion,...s},creature);return{...companion,...s,hpMax:r.max,hpOverride:s.hpMode==='manual'||r.known&&!r.once?null:s.hpOverride};}
 function maximum(companion,value,creature){const max=H.maximum(value);if(max>100000)throw Error('Companion maximum HP cannot exceed 100,000.');const s=settings(companion),r=project(companion,creature);if(s.hpMode!=='manual'&&!r.known)throw Error('Choose a creature with known Hit Dice or select Manual maximum HP.');return normalize({...companion,...s,hpMax:max,hpOverride:s.hpMode==='manual'?null:{value:max,basis:r.basis}},creature);}
 function choose(companion,mode,adjustment,value,creature){if(!modes.includes(mode))throw Error('Choose an available companion HP method.');if(adjustment===null||typeof adjustment==='boolean'||String(adjustment).trim()===''||!Number.isSafeInteger(Number(adjustment))||Math.abs(Number(adjustment))>100000)throw Error('Enter a whole additional HP adjustment from −100,000 to 100,000.');const next={...companion,hpMode:mode,hpAdjustment:Number(adjustment),hpOverride:null};if(mode==='manual'){next.hpMax=H.maximum(value);if(next.hpMax>100000)throw Error('Companion maximum HP cannot exceed 100,000.');}else if(!inputs(next,creature).known)throw Error('This creature has no known Hit Dice. Keep Manual maximum HP.');return normalize(next,creature);}
 return{modes,settings,inputs,basis,project,normalize,maximum,choose};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterCompanionHitPoints;
