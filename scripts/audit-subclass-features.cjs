#!/usr/bin/env node
'use strict';
/* Inventory selectable subclass feature coverage without copying source prose. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cache=path.join(__dirname,'.source-cache','5etools-v1','class');
const Subclasses=require('../js/modules/character-subclass-data');
global.CharacterSubclassData=Subclasses;
global.CharacterSrdClassData=require('../js/modules/character-srd-class-data');
require('../js/modules/character-expanded-subclass-data');
const Progression=require('../js/modules/character-class-progression');
const classNames={artificer:'Artificer',barbarian:'Barbarian',bard:'Bard',cleric:'Cleric',druid:'Druid',fighter:'Fighter',monk:'Monk',paladin:'Paladin',ranger:'Ranger',rogue:'Rogue',sorcerer:'Sorcerer',warlock:'Warlock',wizard:'Wizard'};
const sourceAliases={PHB24:'XPHB',EFOTA:'EFA'},nameAliases={'purple-dragon-knight':'Purple Dragon Knight (Banneret)'};
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function sourceRows(){
  if(!fs.existsSync(cache))throw Error('5etools source cache is missing. Run build-5etools-metadata.py first.');
  return fs.readdirSync(cache).filter(file=>file.endsWith('.json')&&file!=='index.json').flatMap(file=>{
    const data=JSON.parse(fs.readFileSync(path.join(cache,file),'utf8'));
    return Array.isArray(data.subclass)?data.subclass:[];
  });
}
function sourceMatch(row,source){
  const expectedSource=sourceAliases[row.source]||row.source,expectedName=nameAliases[row.id]||row.name;
  const candidates=source.filter(candidate=>candidate.className===classNames[row.classId]&&norm(candidate.name)===norm(expectedName));
  return {exact:candidates.find(candidate=>candidate.source===expectedSource)||null,alternate:candidates[0]||null};
}
function state(row,features){
  const mechanics=require('../docs/subclass-mechanics-audit.json').subclasses.find(r=>r.id===row.id);if(mechanics?.status==='partial-mechanics'&&features.length)return 'partial-mechanics';
  return features.length?'reference-only':'not-in-runtime';
}
function review(){
  const source=sourceRows(),rows=Object.values(Subclasses.all).sort((a,b)=>a.classId.localeCompare(b.classId)||a.name.localeCompare(b.name)).map(row=>{
    const classSource=row.classId==='artificer'?(row.edition==='2024'?'efa':'tce'):undefined;
    const features=Progression.subclassFeatures(row.classId,row.id,row.edition,classSource);
    const levels=[...new Set(features.map(feature=>Number(feature.level)).filter(level=>Number.isInteger(level)&&level>=1&&level<=20))].sort((a,b)=>a-b);
    const raw=sourceMatch(row,source),sourceStatus=raw.exact?'verified':raw.alternate?'alternate-source':'not-in-pinned-source';
    return {id:row.id,name:row.name,classId:row.classId,edition:row.edition,source:row.source,minimumLevel:row.minimumLevel,sourceStatus,...(raw.alternate?{matchedSource:raw.alternate.source}:{}),runtimeFeatureRecords:features.length,runtimeFeatureLevels:levels,coverage:state(row,features)};
  });
  const classes=Object.keys(classNames).map(classId=>{
    const entries=rows.filter(row=>row.classId===classId),counts=Object.fromEntries(['partial-mechanics','reference-only','not-in-runtime'].map(key=>[key,entries.filter(row=>row.coverage===key).length]));
    return {classId,total:entries.length,sourceVerified:entries.filter(row=>row.sourceStatus==='verified').length,alternateSource:entries.filter(row=>row.sourceStatus==='alternate-source').length,notInPinnedSource:entries.filter(row=>row.sourceStatus==='not-in-pinned-source').length,runtimeFeatureLists:entries.filter(row=>row.runtimeFeatureRecords).length,...counts};
  });
  return {format:1,generatedAt:new Date().toISOString(),source:{repository:'5etools-mirror-3/5etools-src',revision:JSON.parse(fs.readFileSync(path.join(root,'data/rules/sources/5etools-v1.json'),'utf8')).revision,policy:'Compared against local pinned cache; no source prose is emitted.'},summary:{selectableSubclasses:rows.length,sourceVerified:rows.filter(row=>row.sourceStatus==='verified').length,alternateSource:rows.filter(row=>row.sourceStatus==='alternate-source').length,notInPinnedSource:rows.filter(row=>row.sourceStatus==='not-in-pinned-source').length,runtimeFeatureLists:rows.filter(row=>row.runtimeFeatureRecords).length,partialMechanics:rows.filter(row=>row.coverage==='partial-mechanics').length,referenceOnly:rows.filter(row=>row.coverage==='reference-only').length,notInRuntime:rows.filter(row=>row.coverage==='not-in-runtime').length},classes,subclasses:rows};
}
function markdown(report){
  const lines=['# Subclass feature coverage audit','','Generated from the selectable subclass catalogue and the pinned 5etools cache. The audit compares source identity only: it never copies source entries or feature prose.','','A source match does **not** mean that feature rules are present in the application. “Alternate source” means the same class/subclass exists in the pinned cache, but under a different book identifier.','','- **Partial mechanics**: a source-reviewed class adapter implements concrete resources, choices and/or effects. Target state, timing, positions and other declared table decisions remain manual; this status does not claim full encounter automation.','- **Reference only**: the sheet has a level-by-level feature list, but no complete source-specific mechanic adapter.','- **Not in runtime**: selectable in Character Builder, but has no subclass feature rows at runtime.','','## Summary','','| Selectable subclasses | Exact source match | Alternate source | Missing from pinned source | Runtime feature lists | Partial mechanics | Reference only | Not in runtime |','| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',`| ${report.summary.selectableSubclasses} | ${report.summary.sourceVerified} | ${report.summary.alternateSource} | ${report.summary.notInPinnedSource} | ${report.summary.runtimeFeatureLists} | ${report.summary.partialMechanics} | ${report.summary.referenceOnly} | ${report.summary.notInRuntime} |`,'','## By class','','| Class | Selectable | Exact source | Alternate source | Missing pinned source | Runtime feature list | Partial mechanics | Reference only | Not in runtime |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
  for(const row of report.classes)lines.push(`| ${classNames[row.classId]} | ${row.total} | ${row.sourceVerified} | ${row.alternateSource} | ${row.notInPinnedSource} | ${row.runtimeFeatureLists} | ${row['partial-mechanics']} | ${row['reference-only']} | ${row['not-in-runtime']} |`);
  lines.push('','## Every selectable subclass','','| Class | Subclass | Rules | Configured source | Pinned source status | Runtime levels | Coverage |','| --- | --- | --- | --- | --- | --- | --- |');
  for(const row of report.subclasses)lines.push(`| ${classNames[row.classId]} | ${row.name} | ${row.edition} | ${row.source} | ${row.sourceStatus}${row.matchedSource&&row.sourceStatus!=='verified'?' ('+row.matchedSource+')':''} | ${row.runtimeFeatureLevels.join(', ')||'—'} | ${row.coverage.replace(/-/g,' ')} |`);
  lines.push('','## Findings','','1. The imported/staged 5etools metadata is correctly suited to source identity and catalogue browsing. It intentionally does not include feature entries or mechanics, so it cannot fill the runtime gaps by itself.','2. Every selectable subclass now has a feature list and concrete adapter. Per-feature implementation boundaries and source-review details are recorded in subclass-mechanics-audit.json and the class mechanics documents; do not execute or display upstream source entries.','3. Base-class features are inventoried separately in [character-class-level-review.md](character-class-level-review.md). Its current base-class review contains 27 edition/source cases and 540 class-level checks, but does not certify subclass mechanics.');
  return lines.join('\n')+'\n';
}
if(require.main===module){const report=review();fs.writeFileSync(path.join(root,'docs/subclass-feature-coverage.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(root,'docs/subclass-feature-coverage.md'),markdown(report));console.log(JSON.stringify(report.summary));}
module.exports={review,markdown};
