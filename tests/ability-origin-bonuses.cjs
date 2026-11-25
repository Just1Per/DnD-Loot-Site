'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),R=require('../js/modules/character-rules'),B=require('../js/modules/character-backgrounds');
const keys=Object.keys(M.abilities),make=build=>M.normalize({hpMax:12,abilities:Object.fromEntries(keys.map(key=>[key,10])),build:{edition:'2014',classId:'fighter',scoreMode:'base',...build}});
test('all selectable 2014 races have fixed or selectable starting increases and lose them under 2024 rules',()=>{
 for(const [id,race]of Object.entries(R.races).filter(([,r])=>r.edition!=='2024')){
  assert.ok(Object.keys(race.asi||{}).length||race.flexible||race.choiceBonuses?.length,id);
  const choices=keys.filter(key=>!race.excludeAbilities?.includes(key)),data=make({race:id,flexibleChoices:choices.slice(0,3),abilityChoices:['str','dex']});
  const legacy=M.derive(data,4);assert.ok(Object.values(legacy.effects.asi).some(n=>n>0),id);
  data.build.edition='2024';data.build.background='acolyte-2024';data.build.backgroundAbilities=['int','wis'];
  assert.deepEqual(M.derive(data,4).effects.asi,{int:2,wis:1},id);
 }
});
test('Wildemount starting increases match pinned parent/subrace ability facts, including replacements',()=>{
 // 5etools b9061583: PHB Elf/Halfling + EGW Pallid/Lotusden; EGW
 // Draconblood/Ravenite replace the PHB Dragonborn package; EGW Orc of Exandria.
 for(const [race,expected]of Object.entries({'pallid-elf-egw':{dex:2,wis:1},'lotusden-halfling-egw':{dex:2,wis:1},'draconblood-dragonborn-egw':{int:2,cha:1},'ravenite-dragonborn-egw':{str:2,con:1},'orc-of-exandria-egw':{str:2,con:1}})){
  const data=make({race,flexibleChoices:['cha','con','int']});assert.equal(R.profile(data.build).flexible,false,race);assert.deepEqual(M.derive(data,4).effects.asi,expected,race);
 }
});
test('all 57 selectable 2024 backgrounds support both patterns only within pinned permitted abilities',()=>{
 const rows=Object.keys({...B.modern,...B.expanded}).map(id=>[id,B.get(id)]).filter(([,row])=>row.edition==='2024');assert.equal(rows.length,57);
 for(const [background,row]of rows)for(const pattern of ['21','111']){
  assert.equal(row.abilities?.length,3,background);
  const choices=row.abilities,data=make({edition:'2024',race:'human',background,backgroundPattern:pattern,backgroundAbilities:choices});
  const expected=Object.fromEntries(choices.slice(0,pattern==='111'?3:2).map((key,i)=>[key,pattern==='21'&&i===0?2:1]));
  assert.deepEqual(M.derive(data,4).effects.asi,expected,background+' '+pattern);
  data.build.backgroundAbilities=[choices[0],choices[0],keys.find(key=>!choices.includes(key))];
  assert.deepEqual(M.derive(data,4).effects.asi,{[choices[0]]:pattern==='21'?2:1});
 }
});
test('legacy fields, distinct choices, caps, inactive picks and final totals do not stack bonuses',()=>{
 const data=make({race:'half-elf',abilityChoices:['str','dex'],flexibleChoices:['wis','con'],background:'farmer-2024',backgroundAbilities:['str','con']});
 assert.deepEqual(M.derive(data,4).effects.asi,{cha:2,str:1,dex:1});data.build.abilityChoices=['str','str'];assert.deepEqual(M.derive(data,4).effects.asi,{cha:2,str:1});
 data.build.race='warforged';data.build.flexibleChoices=['con'];assert.deepEqual(M.derive(data,4).effects.asi,{con:2});data.build.flexibleChoices=['int'];assert.deepEqual(M.derive(data,4).effects.asi,{con:2,int:1});
 data.build.race='githyanki-mpmm';data.build.asiPattern='111';data.build.flexibleChoices=['str','dex','con'];assert.deepEqual(M.derive(data,4).effects.asi,{str:1,dex:1,con:1});data.build.asiPattern='21';assert.deepEqual(M.derive(data,4).effects.asi,{str:2,dex:1});
 data.abilities.str=19;assert.equal(M.derive(data,4).scores.str,20);assert.equal(M.derive(data,4).scores.str,20);assert.equal(data.abilities.str,19);
 data.build.scoreMode='total';assert.equal(M.derive(data,4).scores.str,19);assert.equal(M.derive(M.normalize(data),4).scores.str,19);
 data.build.edition='2024';data.build.background='soldier-2014';data.build.backgroundAbilities=['int','cha'];data.build.scoreMode='base';assert.deepEqual(M.derive(data,4).effects.asi,{int:2,cha:1});
 data.adobe={classLevels:[{classId:'fighter',level:2},{classId:'wizard',level:2}]};assert.deepEqual(M.derive(data,4).effects.asi,{int:2,cha:1});
});
