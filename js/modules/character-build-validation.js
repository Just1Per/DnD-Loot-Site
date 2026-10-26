'use strict';
/* Central completeness check for unfinished character-builder choices. */
var CharacterBuildValidation=(()=>{
  const add=(rows,category,message,tab='builder',severity='warning',target='')=>{
    message=String(message||'').trim();
    const existing=rows.find(r=>r.message===message);if(existing){if(target)existing.target=[...new Set([existing.target,target].filter(Boolean))].join(',');return existing;}
    if(message){const row={category,message,tab,severity,target};rows.push(row);return row;}
  };
  const looksIncomplete=message=>{
    const m=String(message||'');
    if(/selected on the Feats page|source-specific effects as manual|automation adapter|partially automated|source-specific .*partially|manual entry|reference only/i.test(m)&&!/choose (?:a|an|your)|required|missing/i.test(m))return false;
    return /choose|select|required|missing|different|no longer qualif|confirm/i.test(m);
  };
  function check(data,derived,identity={}){
    const rows=[],effects=derived?.effects||{},progression=derived?.progression||{},warnings=effects.warnings||[];
    // Route warning *choices* to their owning form, not to a tab inferred from
    // the occurrence of words like "feat" in the message.
    const missingIndex=key=>Math.max(0,(data.build?.[key]||[]).findIndex(v=>!v));
    const routeWarning=message=>{
      const m=String(message||'').toLowerCase();
      const destination=(category,tab,target)=>({category,tab,target});
      if(/standard language/.test(m))return destination('Language','builder',`[name="build.standardLanguages.${missingIndex('standardLanguages')}"]`);
      if(/background language/.test(m))return destination('Language','builder',`[name="build.backgroundLanguages.${missingIndex('backgroundLanguages')}"]`);
      if(/language/.test(m))return destination('Language','builder','[name="build.extraLanguage"]');
      if(/background abilit/.test(m))return destination('Ability','builder',`[name="build.backgroundAbilities.${missingIndex('backgroundAbilities')}"]`);
      if(/background skill/.test(m))return destination('Skill','builder','[name="build.backgroundSkills.0"]');
      if(/racial skill/.test(m))return destination('Skill','builder',`[name="build.skillChoices.${missingIndex('skillChoices')}"]`);
      if(/skill/.test(m))return destination('Skill','builder',`[name="build.classSkills.${missingIndex('classSkills')}"]`);
      if(/background tool/.test(m))return destination('Proficiency','builder','[name="build.backgroundTool"]');
      if(/tool/.test(m))return destination('Proficiency','builder','[name="build.tool"]');
      if(/human.*feat|feat.*human/.test(m))return destination('Feat','builder','[data-build-feat-field="humanOriginFeat"]');
      if(/race.*feat|racial feat/.test(m))return destination('Feat','builder','[data-build-feat-field="raceFeat"]');
      if(/background feat|origin feat|feat/.test(m))return destination('Feat','builder','[name="build.backgroundFeat"]');
      if(/cantrip/.test(m))return destination('Spell','spells','#sheet-spells');
      if(/background/.test(m))return destination('Builder','builder','[name="build.background"]');
      return destination('Builder','builder','#sheetBuildControls');
    };
    const located=(effects.choiceIssues||[]).filter(issue=>issue.target&&looksIncomplete(issue.message));
    for(const issue of located){const row=add(rows,issue.category,issue.message,issue.tab||'builder','warning',issue.target);if(row)row.exactTargets=true;}
    const coveredFeatReports=(derived?.feats?.reports||[]).filter(r=>r.managedOrigin&&r.def?.name==='Skilled'&&located.some(issue=>issue.source===r.key));
    const coveredFeatWarnings=new Set(coveredFeatReports.flatMap(r=>(r.warnings||[]).map(w=>r.def.name+': '+w)));
    for(const warning of warnings){
      if(located.some(issue=>issue.message===warning)||coveredFeatWarnings.has(warning))continue;
      if(!looksIncomplete(warning))continue;
      const route=routeWarning(warning);
      add(rows,route.category,warning,route.tab,'warning',route.target);
    }
    for(const [index,entry] of (progression.classLevels||[]).entries()){
      const className=globalThis.CharacterAdobeEngine?.className?.(entry.classId)||entry.classId||'Class';
      const groups=globalThis.CharacterClassFeatureChoices?.status?.(data,entry,data?.build?.edition||'2014')||[];
      for(const group of groups){
        if(group.missing>0)add(rows,'Class feature',`${className}: choose ${group.missing} more ${group.name}.`,'builder','warning',`[data-class-feature-choice="${index}"][data-choice-group="${group.id}"]`);
        else if(!group.complete)add(rows,'Class feature',`${className}: review ${group.name}; one or more selections no longer qualify.`,'builder','warning',`[data-class-feature-choice="${index}"][data-choice-group="${group.id}"]`);
      }
    }
    if(derived?.cantripInvocations?.catalogReady)for(const report of derived.cantripInvocations.reports||[]){if(report.required&&!report.valid)add(rows,'Invocation cantrips',report.name+': choose an eligible known Warlock cantrip.','builder','warning','[data-invocation-cantrip="'+report.key+'"][data-invocation-slot="'+report.slot+'"]');}
    for(const group of derived?.classExpertise?.reports||[]){
      if(group.missing)add(rows,'Expertise',`${group.className}: choose ${group.missing} more ${group.name} option${group.missing===1?'':'s'}.`,'skills','warning',`[data-class-expertise="${group.key}"]`);
      else if(group.overflow)add(rows,'Expertise',`${group.className}: review saved Expertise choices after changing class levels.`,'skills','warning',`[data-class-expertise="${group.key}"]`);
    }
    for(const group of derived?.weaponTraining?.reports||[]){
      if(group.missing||group.overflow){const index=Math.max(0,group.slots.findIndex(slot=>!slot.valid));add(rows,'Weapon training',group.missing?`${group.name}: choose ${group.missing} more weapon${group.missing===1?'':'s'}.`:`${group.name}: review saved choices after changing class levels.`,'skills','warning',`[data-weapon-training="${group.key}"][data-weapon-slot="${index}"]`);}
    }
    const assigned=Number(progression.assignedLevel||0),target=Number(progression.targetLevel||identity.level||1);
    if(assigned<target)add(rows,'Class levels',`Assign ${target-assigned} remaining class level${target-assigned===1?'':'s'}.`,'builder','warning',assigned?'[data-up]':'[name="build.classId"]');
    for(const [index,entry] of (progression.classLevels||[]).entries()){
      const subclasses=globalThis.CharacterSubclassData,edition=data?.build?.edition||'2014',choices=globalThis.CharacterClassFeatureChoices,source=entry.classId==='artificer'?choices?.artificerSource(data):null;
      if(source&&!source.eligible){add(rows,'Artificer version','Choose a compatible Artificer version and core edition.','builder','warning','[data-artificer-source]');continue;}
      if(entry.subclassId){const row=subclasses?.find?.(entry.subclassId);if(source&&row&&subclasses.compatible&&!subclasses.compatible(row,edition,source.id))add(rows,'Subclass','Choose a subclass matching the selected Artificer version.','builder','warning',`[data-subclass="${index}"]`);continue;}
      const candidates=subclasses?.forClass?.(entry.classId)||[];
      const compatible=candidates.filter(row=>!subclasses.compatible||subclasses.compatible(row,edition,source?.id));
      const min=compatible.length?Math.min(...compatible.map(row=>Number(subclasses.effectiveMinimum?subclasses.effectiveMinimum(row,edition):row.minimumLevel)||99)):99;
      if(Number(entry.level)>=min)add(rows,'Subclass',`Choose a subclass for ${globalThis.CharacterAdobeEngine?.className?.(entry.classId)||entry.classId}.`,'builder','warning',`[data-subclass="${index}"]`);
    }
    const featWarnings=(derived?.feats?.reports||[]).filter(r=>!(r.managedOrigin&&r.def?.name==='Skilled'&&located.some(issue=>issue.source===r.key))).flatMap(r=>(r.warnings||[]).map(w=>({name:r.def?.displayName||r.def?.name||r.id,warning:w,key:r.key})));
    for(const {name,warning,key} of featWarnings)if(looksIncomplete(warning))add(rows,'Feat',`${name}: ${warning}`,'feats','warning',`[data-feat-key="${key}"]`);
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
