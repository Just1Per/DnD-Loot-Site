'use strict';
/* A planned selection is persistent; only subclassId is exposed to existing effect rules. */
var CharacterSubclassPlanning=(()=>{
 const facts=typeof CharacterRuleChoiceData!=='undefined'?CharacterRuleChoiceData:require('./character-rule-choice-data');
 const selected=row=>row?.subclassId||row?.plannedSubclassId||'';
 function minimum(classId,edition='2014',id=''){
  const S=globalThis.CharacterSubclassData,row=S?.find?.(id),base=facts[edition==='2024'?'2024':'2014']?.[classId]?.subclassLevel||3;
  return row&&row.classId===classId?Math.max(base,Number(S.effectiveMinimum?.(row,edition)||row.minimumLevel||base)):base;
 }
 function sync(row,edition='2014'){
  const id=selected(row),S=globalThis.CharacterSubclassData,known=S?.find?.(id),active=!!id&&(!known||known.classId===row.classId)&&Number(row.level)>=minimum(row.classId,edition,id);
  const {plannedSubclassId,...rest}=row;return{...rest,subclassId:active?id:'',...(!active&&id?{plannedSubclassId:id}:{})};
 }
 const classes=edition=>Object.entries(facts[edition==='2024'?'2024':'2014']).map(([id,row])=>({id,...row}));
 return{selected,minimum,sync,classes};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterSubclassPlanning=CharacterSubclassPlanning;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSubclassPlanning;
