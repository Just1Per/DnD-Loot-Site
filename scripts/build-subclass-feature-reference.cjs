#!/usr/bin/env node
'use strict';
/* Generate names/levels only from the pinned 5etools cache; never emit entries or prose. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cache=path.join(__dirname,'.source-cache','5etools-v1','class');
const S=require('../js/modules/character-subclass-data');global.CharacterSubclassData=S;require('../js/modules/character-expanded-subclass-data');
const classes={artificer:'Artificer',barbarian:'Barbarian',bard:'Bard',cleric:'Cleric',druid:'Druid',fighter:'Fighter',monk:'Monk',paladin:'Paladin',ranger:'Ranger',rogue:'Rogue',sorcerer:'Sorcerer',warlock:'Warlock',wizard:'Wizard'},sourceAliases={PHB24:'XPHB',EFOTA:'EFA'},nameAliases={'purple-dragon-knight':'Purple Dragon Knight (Banneret)'},norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
if(!fs.existsSync(cache))throw Error('5etools source cache is missing. Run build-5etools-metadata.py first.');
const files=fs.readdirSync(cache).filter(file=>file.endsWith('.json')&&file!=='index.json').map(file=>JSON.parse(fs.readFileSync(path.join(cache,file),'utf8'))),subclasses=files.flatMap(data=>data.subclass||[]),features=files.flatMap(data=>data.subclassFeature||[]),records={};
for(const row of Object.values(S.all)){
 const expected=nameAliases[row.id]||row.name,possible=subclasses.filter(candidate=>candidate.className===classes[row.classId]&&norm(candidate.name)===norm(expected)),subclass=possible.find(candidate=>candidate.source===(sourceAliases[row.source]||row.source))||possible[0];
 if(!subclass)throw Error('Pinned source has no matching subclass: '+row.id);
 const seen=new Set(),list=features.filter(feature=>feature.className===subclass.className&&feature.subclassShortName===subclass.shortName&&feature.subclassSource===subclass.source).map(feature=>({name:String(feature.name||''),level:Number(feature.level)})).filter(feature=>feature.name&&Number.isInteger(feature.level)&&feature.level>=1&&feature.level<=20).filter(feature=>!seen.has(feature.level+'|'+feature.name)&&seen.add(feature.level+'|'+feature.name)).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
 if(!list.length)throw Error('Pinned source has no feature metadata: '+row.id);records[row.id]={source:subclass.source,features:list};
}
const body="'use strict';\n/* Generated from pinned 5etools feature metadata: names and levels only. */\nvar CharacterSubclassFeatureData=(()=>{const records="+JSON.stringify(records)+";const features=id=>records[String(id||'')]?.features||[];return{records,features};})();\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSubclassFeatureData;\n";
const output=path.join(root,'js/modules/character-subclass-feature-data.js');fs.writeFileSync(output,body);console.log(JSON.stringify({output,subclasses:Object.keys(records).length,features:Object.values(records).reduce((sum,row)=>sum+row.features.length,0)}));
