'use strict';
/* Shared carrying limits. Owned inventory supplies weight; paper references never add it. */
var CharacterCarrying=(()=>{
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
 return{normalize,stored,limits,status,edit,range:(a,b)=>Math.floor(a+1)+' – '+Math.floor(b)+' lb'};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterCarrying=CharacterCarrying;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterCarrying;
