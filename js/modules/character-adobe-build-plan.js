'use strict';
/* Native Adobe class allocation. Input is validated before the shared normalizer. */
var CharacterAdobeBuildPlan=(()=>{
 function allocate(raw,{classes,maxLevel=20,xpLevel=null,subclassAllowed=()=>true}={}){
  if(!Array.isArray(raw)||!raw.length||raw.length>8)throw Error('Choose one to eight distinct classes.');const seen=new Set();let total=0;
  const rows=raw.map(row=>{if(!row||typeof row.classId!=='string'||!Object.hasOwn(classes||{},row.classId))throw Error('Choose an available class.');if(seen.has(row.classId))throw Error('Each class can appear once. Add levels to its existing row.');seen.add(row.classId);const level=Number(row.level);if(row.level===null||typeof row.level==='boolean'||String(row.level).trim()===''||!Number.isSafeInteger(level)||level<1||level>20)throw Error('Each class needs a whole level from 1 to 20.');const subclassId=typeof row.subclassId==='string'?row.subclassId:'';if(subclassId&&!subclassAllowed({...row,level,subclassId}))throw Error('Choose a subclass available for this class, level and rules.');total+=level;return{classId:row.classId,level,subclassId};});
  if(total>Math.min(20,maxLevel))throw Error('The combined class levels cannot exceed '+Math.min(20,maxLevel)+'.');if(xpLevel!==null&&total!==xpLevel)throw Error('Assign exactly '+xpLevel+' class levels to match your XP level.');return{rows,total};
 }
 function apply(data,identity,raw,options){const plan=allocate(raw,options),next=structuredClone(data),nextIdentity={...identity};next.adobe.classLevels=plan.rows;next.build.classId=plan.rows[0].classId;if(data.build.classId!==next.build.classId&&options.classes[next.build.classId]?.ability)next.spellAbility=options.classes[next.build.classId].ability;nextIdentity.level=plan.total;nextIdentity.class=plan.rows.map(row=>(options.classes[row.classId].name||row.classId)+(plan.rows.length>1?' '+row.level:'')).join(' / ').slice(0,120);return{data:next,identity:nextIdentity};}
 return{allocate,apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeBuildPlan;
