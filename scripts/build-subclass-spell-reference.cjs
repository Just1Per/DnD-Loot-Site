#!/usr/bin/env node
'use strict';
// Fixed spell names and levels only. Choices, expanded lists and source prose are excluded.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const S=require('../js/modules/character-subclass-data'),F=require('../js/modules/character-subclass-feature-data'),cache=path.join(__dirname,'.source-cache/5etools-v1/class'),norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),aliases={'purple-dragon-knight':'Purple Dragon Knight (Banneret)'};
const sources=fs.readdirSync(cache).filter(f=>f.endsWith('.json')&&f!=='index.json').flatMap(f=>JSON.parse(fs.readFileSync(path.join(cache,f),'utf8')).subclass||[]),records={};
for(const row of Object.values(S.all)){
 const candidates=sources.filter(s=>norm(s.className)===norm(row.classId)&&norm(s.name)===norm(aliases[row.id]||row.name)&&s.source===F.records[row.id].source),source=candidates.find(s=>s.additionalSpells)||candidates[0];if(!source)throw Error('Missing pinned subclass '+row.id);
 const grants=[];
 for(const group of source.additionalSpells||[])for(const kind of ['known','prepared'])for(const [at,spells]of Object.entries(group[kind]||{})){
  if(!/^\d+$/.test(at))continue;const values=Array.isArray(spells)?spells:Array.isArray(spells?._)?spells._:[];
  for(const spell of values)if(typeof spell==='string')grants.push({level:Number(at),name:spell.split('|')[0].split('#')[0],kind});
 }
 records[row.id]={source:source.source,edition:row.edition,grants};
}
const output=path.join(root,'js/modules/character-subclass-spell-data.js');fs.writeFileSync(output,"'use strict';\n// Generated pinned subclass spell names/levels only; no source entries.\nvar CharacterSubclassSpellData="+JSON.stringify(records)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSubclassSpellData;\n");console.log(JSON.stringify({subclasses:Object.keys(records).length,fixedGrants:Object.values(records).reduce((n,r)=>n+r.grants.length,0)}));
