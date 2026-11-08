#!/usr/bin/env node
'use strict';
/* Mechanical implementation inventory. Feature names/levels come from the pinned local source audit. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const coverage=JSON.parse(fs.readFileSync(path.join(root,'docs/subclass-feature-coverage.json'),'utf8'));
const paths=require('../js/modules/character-barbarian-subclasses');
const colleges=require('../js/modules/character-bard-subclasses');
const domains=require('../js/modules/character-cleric-subclasses');
const circles=require('../js/modules/character-druid-subclasses');
const druidIds=new Set(Object.values(circles.ids).flat());
const clericIds=new Set(Object.values(domains.ids).flat());
const bardIds=new Set(Object.values(colleges.ids).flat());
const barbarianIds=new Set(Object.values(paths.ids).flat());
const implemented=new Set([...barbarianIds,...bardIds,...clericIds,...druidIds,'berserker','life-domain','light-domain','nature-domain','knowledge-domain','tempest-domain','trickery-domain','war-domain']);
const rows=coverage.subclasses.map(row=>({
  id:row.id,classId:row.classId,name:row.name,edition:row.edition,source:row.source,minimumLevel:row.minimumLevel,
  featureLevels:row.runtimeFeatureLevels,
  mechanics:barbarianIds.has(row.id)?{resources:['ancestral-guardian','zealot','zealot-2024','beast','wild-magic-barbarian','berserker-2024','world-tree-2024'].includes(row.id),defense:['storm-herald','wild-heart-2024','totem-warrior','beast'].includes(row.id),spellcasting:['totem-warrior','ancestral-guardian','giant','wild-heart-2024'].includes(row.id),combat:true,builderChoices:paths.definitions.some(g=>g.id===row.id),manualGuidance:true}:bardIds.has(row.id)?{resources:true,defense:['dance-2024','swords'].includes(row.id),spellcasting:['lore','lore-2024','glamour','glamour-2024','spirits','spirits-rthw','college-of-the-moon-frhof'].includes(row.id),combat:true,builderChoices:['lore','lore-2024','swords','spirits','college-of-the-moon-frhof'].includes(row.id),manualGuidance:true}:clericIds.has(row.id)?{resources:true,defense:['forge-domain','twilight-domain','war-domain-2024','knowledge-domain-frhof'].includes(row.id),spellcasting:true,combat:true,builderChoices:true,manualGuidance:true}:druidIds.has(row.id)?{resources:true,defense:['land','land-2024','moon','moon-2024','stars','stars-2024','spores','sea-2024'].includes(row.id),spellcasting:true,combat:true,builderChoices:['land','land-2024','stars','stars-2024','shepherd'].includes(row.id),manualGuidance:true}:{resources:false,defense:false,spellcasting:false,combat:false,builderChoices:false,manualGuidance:implemented.has(row.id)},
  ...(barbarianIds.has(row.id)?{sourceReview:{revision:'b9061583536101068b3a59d27e886d1fa664e366',path:'class/class-barbarian.json',levels:'3–20'},limitations:['Targets, aura membership, reaction timing and duration remain table decisions.','Ally events and externally applied temporary HP are resolved using the feature instructions; the sheet does not observe another character’s state.']}:{}),
  ...(bardIds.has(row.id)?{sourceReview:{revision:'b9061583536101068b3a59d27e886d1fa664e366',path:'class/class-bard.json',levels:'3–20'},limitations:['Targets, recipient Inspiration dice, spell focus eligibility and reaction timing remain table decisions.','Companion command turns and external ally effects are described but not applied to another character automatically.']}:{}),
  ...(clericIds.has(row.id)?{sourceReview:{revision:'b9061583536101068b3a59d27e886d1fa664e366',path:'class/class-cleric.json',levels:row.edition==='2024'?'3–20':'1–20'},limitations:['Target saves, aura membership, ally reactions and recipient HP/conditions remain explicit table decisions.','Duration controls must be ended at the table-specified time; there is no encounter clock.']}:{}),
  ...(druidIds.has(row.id)?{sourceReview:{revision:'b9061583536101068b3a59d27e886d1fa664e366',path:'class/class-druid.json',levels:row.edition==='2024'?'3–20':'2–20'},limitations:['Recipient effects, summon stat blocks/commands, visibility, lighting and durations remain table decisions.','Symbiotic temporary-HP replacement and other externally applied temporary HP require the explicit form/end controls.']}:{}),
  status:implemented.has(row.id)?'partial-mechanics':'reference-only'
}));
const summary={total:rows.length,partialMechanics:rows.filter(row=>row.status==='partial-mechanics').length,referenceOnly:rows.filter(row=>row.status==='reference-only').length,byClass:Object.fromEntries([...new Set(rows.map(row=>row.classId))].map(classId=>[classId,{total:rows.filter(row=>row.classId===classId).length,partialMechanics:rows.filter(row=>row.classId===classId&&row.status==='partial-mechanics').length}]))};
const output={format:1,generatedAt:new Date().toISOString(),summary,subclasses:rows};
fs.writeFileSync(path.join(root,'docs/subclass-mechanics-audit.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(summary));
