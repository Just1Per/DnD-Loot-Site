#!/usr/bin/env node
'use strict';
// Inventory the shipped references; an entry in this report is not proof of full automation.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');global.CharacterSrdClassData=require('../js/modules/character-srd-class-data');
const Progression=require('../js/modules/character-class-progression'),Rules=require('../js/modules/character-rules');
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const status=require('../docs/character-class-feature-status.json');
function review(){
 const classes=[];
 for(const edition of ['2014','2024'])for(const [classId,info]of Object.entries(Rules.classes)){
  const sourceEdition=classId==='artificer'?'2014':edition;
  const features=Progression.classFeatures(classId,edition).map(row=>{
   const key=[sourceEdition,classId,slug(row.name)].join(':'),verified=status[key]||status['*:'+slug(row.name)]||{state:'unreviewed',scope:'Source-rule comparison and structured fields still need review.',evidence:[]};
   return{id:[edition,classId,row.level,slug(row.name)].join(':'),name:row.name,level:row.level,source:classId==='artificer'?'TCE / legacy Artificer':row.source||'Shipped SRD reference',...verified};
  });
  classes.push({classId,name:info.name,edition,sourceEdition,features,levels:Array.from({length:20},(_,index)=>({level:index+1,newFeatures:features.filter(row=>row.level===index+1).map(row=>row.id)}))});
 }
 return{format:1,scope:'Shipped base-class reference inventory; subclass features and external source completeness require separate review.',classes};
}
function markdown(data){
 const lines=['# Class features: level-by-level review','','This inventory covers every supported base class at levels 1–20 using the references shipped with the app. It does **not** certify that every source-book feature is imported or automated. Subclass features require their own pass. The legacy Artificer source remains labelled when used on a compatible 2024 sheet.','','- **Implemented**: the stated scope has structured controls/calculations and named test evidence.','- **Partial**: some support exists; the remaining scope is explicit.','- **Unreviewed**: source comparison and complete field coverage are still outstanding.','','The runtime matrix separately checks that core derivation succeeds for every class/level and preserves values across multiclass/save-envelope cases. Passing that matrix does not make unreviewed features implemented.',''];
 for(const row of data.classes){
  lines.push('## '+row.name+' · '+row.edition+(row.sourceEdition!==row.edition?' core / legacy '+row.sourceEdition+' source':''),'','| Class level | Features arriving at this level |','| --- | --- |');
  for(const level of row.levels){const arriving=row.features.filter(feature=>level.newFeatures.includes(feature.id));lines.push('| '+level.level+' | '+(arriving.map(feature=>feature.name+' **['+feature.state+']**').join('<br>')||'No new named base-class feature in the shipped reference; check scaling and subclass progression separately.')+' |');}
  lines.push('','| Feature / level | Review scope | Test evidence |','| --- | --- | --- |');
  for(const feature of row.features)lines.push('| '+feature.name+' · '+feature.level+' | '+feature.scope.replaceAll('|','/')+' | '+(feature.evidence.map(file=>'['+file+'](../'+file+')').join(', ')||'Pending')+' |');
  lines.push('');
 }
 return lines.join('\n')+'\n';
}
if(require.main===module){const data=review();fs.writeFileSync(path.join(root,'docs/character-class-level-review.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(root,'docs/character-class-level-review.md'),markdown(data));const features=data.classes.flatMap(row=>row.features);console.log(JSON.stringify({classes:new Set(data.classes.map(row=>row.classId)).size,coreEditionCases:data.classes.length,levels:data.classes.length*20,featureRows:features.length,states:Object.fromEntries(['implemented','partial','unreviewed'].map(state=>[state,features.filter(row=>row.state===state).length]))}));}
module.exports={review,markdown};
