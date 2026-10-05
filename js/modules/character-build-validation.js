'use strict';
/* Central completeness check for unfinished character-builder choices. */
var CharacterBuildValidation=(()=>{
  const add=(rows,category,message,tab='builder',severity='warning')=>{
    message=String(message||'').trim();
    if(message&&!rows.some(r=>r.message===message))rows.push({category,message,tab,severity});
  };
  const looksIncomplete=message=>{
    const m=String(message||'');
    if(/partially automated|source-specific .*partially|manual entry|reference only/i.test(m)&&!/choose|select|required/i.test(m))return false;
    return /choose|select|required|missing|different|no longer qualif|confirm/i.test(m);
  };
  function check(data,derived,identity={}){
    const rows=[],effects=derived?.effects||{},progression=derived?.progression||{},warnings=effects.warnings||[];
    for(const warning of warnings){
      if(!looksIncomplete(warning))continue;
      const lower=warning.toLowerCase();
      const category=lower.includes('language')?'Language':lower.includes('skill')?'Skill':lower.includes('feat')?'Feat':lower.includes('tool')?'Proficiency':'Builder';
      add(rows,category,warning,category==='Feat'?'feats':'builder');
    }
    for(const group of progression.classFeatureChoices||[]){
      const className=globalThis.CharacterAdobeEngine?.className?.(group.classId)||group.classId||'Class';
      if(group.missing>0)add(rows,'Class feature',`${className}: choose ${group.missing} more ${group.name}.`,'builder');
      else if(!group.complete)add(rows,'Class feature',`${className}: review ${group.name}; one or more selections no longer qualify.`,'builder');
    }
    const assigned=Number(progression.assignedLevel||0),target=Number(progression.targetLevel||identity.level||1);
    if(assigned<target)add(rows,'Class levels',`Assign ${target-assigned} remaining class level${target-assigned===1?'':'s'}.`,'builder');
    for(const entry of progression.classLevels||[]){
      if(entry.subclassId)continue;
      const candidates=globalThis.CharacterSubclassData?.forClass?.(entry.classId)||[];
      const compatible=candidates.filter(row=>!globalThis.CharacterSubclassData?.compatible||globalThis.CharacterSubclassData.compatible(row,data?.build?.edition||'2014'));
      const min=compatible.length?Math.min(...compatible.map(r=>Number(r.minimumLevel)||99)):99;
      if(Number(entry.level)>=min)add(rows,'Subclass',`Choose a subclass for ${globalThis.CharacterAdobeEngine?.className?.(entry.classId)||entry.classId}.`,'builder');
    }
    const featWarnings=(derived?.feats?.reports||[]).flatMap(r=>(r.warnings||[]).map(w=>({name:r.def?.name||r.id,warning:w})));
    for(const {name,warning} of featWarnings)if(looksIncomplete(warning))add(rows,'Feat',`${name}: ${warning}`,'feats');
    return {complete:rows.length===0,count:rows.length,issues:rows};
  }
  return{check};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBuildValidation;
