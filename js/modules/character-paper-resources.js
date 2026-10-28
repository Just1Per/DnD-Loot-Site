'use strict';
/* Paper resource fields reference the same guarded class/feat counters as Combat. */
var CharacterPaperResources=(()=>{
 const feats=()=>typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
 const classes=()=>typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices');
 function rows(data,derived,level){return[
  ...(derived.classResources||[]).map(row=>({...row,resourceKey:'class:'+row.id,resourceType:'class',resourceId:row.id,editableUsed:!row.unlimited&&!row.managedSlots&&!row.managedWildShape&&!row.channelEffects})),
  ...(derived.feats?.reports||[]).flatMap(report=>{const pool=feats().resource(report.def,level);return pool?[{name:report.def.name+' · '+report.def.edition,max:pool.max,used:report.choice.used,remaining:Math.max(0,pool.max-report.choice.used),recovery:pool.resets.join(', '),resourceKey:'feat:'+report.key,resourceType:'feat',resourceId:report.key,editableUsed:true,warnings:report.warnings,description:pool.label}]:[];})
 ];}
 function setUsed(data,derived,key,value,level){
  const row=rows(data,derived,level).find(row=>row.resourceKey===key);if(!row?.editableUsed)throw Error('Use this feature’s shared controls to apply its related effects.');
  if(!Number.isInteger(value)||value<0||value>row.max&&value!==row.used)throw Error('Enter used points or uses within this feature’s current allowance.');
  if(value===row.used)return data;const next=structuredClone(data);
  if(row.resourceType==='feat'){if(!feats().setUsed(next,row.resourceId,value,{level,reports:derived.feats.reports}))throw Error('This feat’s uses cannot be changed with the current character choices.');}
  else if(!classes().setClassResourceUsed(next,row.resourceId,value,{level,mods:derived.mods}))throw Error('This feature requires its shared controls. No changes were applied.');
  return next;
 }
 return{rows,setUsed};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperResources;
