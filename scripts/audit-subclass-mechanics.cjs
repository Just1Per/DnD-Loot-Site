#!/usr/bin/env node
'use strict';
/* Mechanical implementation inventory. Feature names/levels come from the pinned local source audit. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const coverage=JSON.parse(fs.readFileSync(path.join(root,'docs/subclass-feature-coverage.json'),'utf8'));
const paths=require('../js/modules/character-barbarian-subclasses');
const barbarianIds=new Set(Object.values(paths.ids).flat());
const implemented=new Set([...barbarianIds,'berserker','life-domain','light-domain','nature-domain','knowledge-domain','tempest-domain','trickery-domain','war-domain']);
const rows=coverage.subclasses.map(row=>({
  id:row.id,classId:row.classId,name:row.name,edition:row.edition,source:row.source,minimumLevel:row.minimumLevel,
  featureLevels:row.runtimeFeatureLevels,
  mechanics:barbarianIds.has(row.id)?{resources:['ancestral-guardian','zealot','zealot-2024','beast','wild-magic-barbarian','berserker-2024','world-tree-2024'].includes(row.id),defense:['storm-herald','wild-heart-2024','totem-warrior','beast'].includes(row.id),spellcasting:['totem-warrior','ancestral-guardian','giant','wild-heart-2024'].includes(row.id),combat:true,builderChoices:paths.definitions.some(g=>g.id===row.id),manualGuidance:true}:{resources:false,defense:false,spellcasting:false,combat:false,builderChoices:false,manualGuidance:implemented.has(row.id)},
  ...(barbarianIds.has(row.id)?{sourceReview:{revision:'b9061583536101068b3a59d27e886d1fa664e366',path:'class/class-barbarian.json',levels:'3–20'},limitations:['Conditional attacks, temporary forms and auras are reported with explicit triggers, not automatically applied to every roll.','Combat condition tracking, automatic application to conditional rolls, and temporary form activation remain pending.']}:{}),
  status:implemented.has(row.id)?'partial-mechanics':'reference-only'
}));
const summary={total:rows.length,partialMechanics:rows.filter(row=>row.status==='partial-mechanics').length,referenceOnly:rows.filter(row=>row.status==='reference-only').length,byClass:Object.fromEntries([...new Set(rows.map(row=>row.classId))].map(classId=>[classId,{total:rows.filter(row=>row.classId===classId).length,partialMechanics:rows.filter(row=>row.classId===classId&&row.status==='partial-mechanics').length}]))};
const output={format:1,generatedAt:new Date().toISOString(),summary,subclasses:rows};
fs.writeFileSync(path.join(root,'docs/subclass-mechanics-audit.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(summary));
