'use strict';
/* Paper resource fields reference the same guarded class/feat counters as Combat. */
var CharacterPaperResources=(()=>{
 const feats=()=>typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
 const classes=()=>typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices');
 function rows(data,derived,level){return[
  ...(derived.classResources||[]).map(row=>({...row,resourceKey:'class:'+row.id,resourceType:'class',resourceId:row.id,editableUsed:!row.unlimited&&!row.managedSlots&&!row.managedWildShape&&!row.channelEffects})),
  ...(derived.feats?.reports||[]).flatMap(report=>{const pool=feats().resource(report.def,level);return pool?[{name:report.def.name+' · '+report.def.edition,max:pool.max,used:report.choice.used,remaining:Math.max(0,pool.max-report.choice.used),recovery:pool.resets.join(', '),resourceKey:'feat:'+report.key,resourceType:'feat',resourceId:report.key,editableUsed:true,warnings:report.warnings,description:pool.label}]:[];})
 ];}
 const validKey=key=>typeof key==='string'&&/^(?:class|feat):[^/\r\n]{1,200}$/.test(key);
 function normalizeSlots(raw){return Array.from({length:16},(_,i)=>{const row=raw?.[i];return{key:validKey(row?.key)?row.key:'',name:String(row?.name||'').slice(0,200),empty:row?.empty===true};});}
 function normalizeHidden(raw){return [...new Set((Array.isArray(raw)?raw:[]).filter(validKey))].slice(0,200);}
 function displayRows(data,derived,level){const all=rows(data,derived,level),slots=normalizeSlots(data.adobe?.paperCombat?.resourceSlots),reserved=new Set([...slots.map(row=>row.key).filter(Boolean),...normalizeHidden(data.adobe?.paperCombat?.hiddenResources)]),queue=all.filter(row=>!reserved.has(row.resourceKey));return slots.map(slot=>slot.empty?null:slot.key?all.find(row=>row.resourceKey===slot.key)||{name:(slot.name||'Saved feature')+' (unavailable)',resourceKey:slot.key,max:'',used:'',recovery:'',editableUsed:false,unavailable:true}:queue.shift()||null);}
 function operation(data,derived,level,index,command){
  if(!Number.isInteger(index)||index<0||index>15)throw Error('Choose an available paper feature row.');
  const visible=displayRows(data,derived,level),stored=normalizeSlots(data.adobe?.paperCombat?.resourceSlots),hidden=normalizeHidden(data.adobe?.paperCombat?.hiddenResources),slots=visible.map((row,i)=>row?{key:row.resourceKey,name:row.name,empty:false}:{...stored[i]});let selected=index;
  if(['clear','delete'].includes(command)&&visible[index]?.resourceKey&&!hidden.includes(visible[index].resourceKey)){if(hidden.length>=200)throw Error('Restore automatic rows before hiding more features.');hidden.push(visible[index].resourceKey);}
  if(command==='up'||command==='down'){selected=index+(command==='up'?-1:1);if(selected<0||selected>15)throw Error('This row is already at the edge.');[slots[index],slots[selected]]=[slots[selected],slots[index]];}
  else if(command==='insert'){if(!visible[index])throw Error('This row is already empty.');const end=visible.findIndex((row,i)=>i>index&&!row);if(end<0)throw Error('No empty row below this feature. Nothing was removed.');for(let i=end;i>index;i--)slots[i]=slots[i-1];slots[index]={key:'',name:'',empty:true};}
  else if(command==='delete'){const end=index<8&&!visible[7]?8:16;for(let i=index;i<end-1;i++)slots[i]=slots[i+1];slots[end-1]={key:'',name:'',empty:true};}
  else if(command==='clear')slots[index]={key:visible[index]?.resourceKey||'',name:visible[index]?.name||'',empty:true};else throw Error('Choose an available feature command.');
  return{slots:normalizeSlots(slots),hidden,index:selected};
 }
 function setUsed(data,derived,key,value,level){
  const row=rows(data,derived,level).find(row=>row.resourceKey===key);if(!row?.editableUsed)throw Error('Use this feature’s shared controls to apply its related effects.');
  if(!Number.isInteger(value)||value<0||value>row.max&&value!==row.used)throw Error('Enter used points or uses within this feature’s current allowance.');
  if(value===row.used)return data;const next=structuredClone(data);
  if(row.resourceType==='feat'){if(!feats().setUsed(next,row.resourceId,value,{level,reports:derived.feats.reports}))throw Error('This feat’s uses cannot be changed with the current character choices.');}
  else if(!classes().setClassResourceUsed(next,row.resourceId,value,{level,mods:derived.mods}))throw Error('This feature requires its shared controls. No changes were applied.');
  return next;
 }
 return{rows,displayRows,normalizeSlots,normalizeHidden,operation,setUsed};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperResources;
