#!/usr/bin/env node
'use strict';
/* Mechanical implementation inventory. Feature names/levels come from the pinned local source audit. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const coverage=JSON.parse(fs.readFileSync(path.join(root,'docs/subclass-feature-coverage.json'),'utf8'));
const implemented=new Set(['berserker','life-domain','light-domain','nature-domain','knowledge-domain','tempest-domain','trickery-domain','war-domain']);
const rows=coverage.subclasses.map(row=>({
  id:row.id,classId:row.classId,name:row.name,edition:row.edition,source:row.source,minimumLevel:row.minimumLevel,
  featureLevels:row.runtimeFeatureLevels,
  mechanics:{resources:false,defense:false,spellcasting:false,combat:false,builderChoices:false,manualGuidance:implemented.has(row.id)},
  status:implemented.has(row.id)?'partial-mechanics':'reference-only'
}));
const summary={total:rows.length,partialMechanics:rows.filter(row=>row.status==='partial-mechanics').length,referenceOnly:rows.filter(row=>row.status==='reference-only').length,byClass:Object.fromEntries([...new Set(rows.map(row=>row.classId))].map(classId=>[classId,{total:rows.filter(row=>row.classId===classId).length,partialMechanics:rows.filter(row=>row.classId===classId&&row.status==='partial-mechanics').length}]))};
const output={format:1,generatedAt:new Date().toISOString(),summary,subclasses:rows};
fs.writeFileSync(path.join(root,'docs/subclass-mechanics-audit.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(summary));
