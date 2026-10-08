'use strict';
/* Central completeness check for unfinished character-builder choices. */
var CharacterBuildValidation=(()=>{
  const add=(rows,category,message,tab='builder',severity='warning',target='')=>{
    message=String(message||'').trim();
    const existing=rows.find(r=>r.message===message);if(existing){if(target)existing.target=target;return;}
    if(message)rows.push({category,message,tab,severity,target});
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
    for(const [index,entry] of (progression.classLevels||[]).entries()){
      const className=globalThis.CharacterAdobeEngine?.className?.(entry.classId)||entry.classId||'Class';
      const groups=globalThis.CharacterClassFeatureChoices?.status?.(data,entry,data?.build?.edition||'2014')||[];
      for(const group of groups){
        if(group.missing>0)add(rows,'Class feature',`${className}: choose ${group.missing} more ${group.name}.`,'builder','warning',`[data-class-feature-choice="${index}"][data-choice-group="${group.id}"]`);
        else if(!group.complete)add(rows,'Class feature',`${className}: review ${group.name}; one or more selections no longer qualify.`,'builder','warning',`[data-class-feature-choice="${index}"][data-choice-group="${group.id}"]`);
      }
    }
    const assigned=Number(progression.assignedLevel||0),target=Number(progression.targetLevel||identity.level||1);
    if(assigned<target)add(rows,'Class levels',`Assign ${target-assigned} remaining class level${target-assigned===1?'':'s'}.`,'builder','warning',assigned?'[data-up]':'[name="build.classId"]');
    for(const [index,entry] of (progression.classLevels||[]).entries()){
      if(entry.subclassId)continue;
      const candidates=globalThis.CharacterSubclassData?.forClass?.(entry.classId)||[];
      const compatible=candidates.filter(row=>!globalThis.CharacterSubclassData?.compatible||globalThis.CharacterSubclassData.compatible(row,data?.build?.edition||'2014'));
      const min=compatible.length?Math.min(...compatible.map(r=>Number(r.minimumLevel)||99)):99;
      if(Number(entry.level)>=min)add(rows,'Subclass',`Choose a subclass for ${globalThis.CharacterAdobeEngine?.className?.(entry.classId)||entry.classId}.`,'builder','warning',`[data-subclass="${index}"]`);
    }
    const featWarnings=(derived?.feats?.reports||[]).flatMap(r=>(r.warnings||[]).map(w=>({name:r.def?.displayName||r.def?.name||r.id,warning:w,key:r.key})));
    for(const {name,warning,key} of featWarnings)if(looksIncomplete(warning))add(rows,'Feat',`${name}: ${warning}`,'feats','warning',`[data-feat-key="${key}"]`);
    const missingIndex=key=>Math.max(0,(data.build?.[key]||[]).findIndex(v=>!v));
    for(const issue of rows)if(!issue.target){
      const m=issue.message.toLowerCase();
      issue.target=issue.category==='Feat'?(m.includes('human')?'[data-build-feat-field="humanOriginFeat"]':m.includes('race')?'[data-build-feat-field="raceFeat"]':'[data-build-feat-field="backgroundFeat"]'):
       m.includes('background ability')||m.includes('background abilities')?`[name="build.backgroundAbilities.${missingIndex('backgroundAbilities')}"]`:
       m.includes('background skill')?'[name="build.backgroundSkills.0"]':
       m.includes('standard language')?`[name="build.standardLanguages.${missingIndex('standardLanguages')}"]`:
       m.includes('background language')?`[name="build.backgroundLanguages.${missingIndex('backgroundLanguages')}"]`:
       m.includes('language')?'[name="build.extraLanguage"]':
       m.includes('racial skill')?`[name="build.skillChoices.${missingIndex('skillChoices')}"]`:
       m.includes('skill')?`[name="build.classSkills.${missingIndex('classSkills')}"]`:
       m.includes('background tool')?'[name="build.backgroundTool"]':
       m.includes('tool')?'[name="build.tool"]':m.includes('cantrip')?'[name="build.cantrip"]':m.includes('background')?'[name="build.background"]':'#sheetBuildControls';
    }

    return {complete:rows.length===0,count:rows.length,issues:rows};
  }
  return{check};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBuildValidation;
