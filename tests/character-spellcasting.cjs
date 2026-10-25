const assert=require('node:assert/strict');
const S=require('../js/modules/character-spellcasting');

let p=S.profile('sorcerer',16,'2014',{cha:18});
assert.equal(p.cantrips,6);
assert.equal(p.spellCount,14);
assert.equal(p.mode,'known');
assert.equal(p.maxSpellLevel,8);

p=S.profile('druid',10,'2014',{wis:18});
assert.equal(p.cantrips,4);
assert.equal(p.spellCount,14);
assert.equal(p.mode,'prepared');
assert.equal(p.changeTiming,'long-rest');

p=S.profile('wizard',16,'2014',{int:18});
assert.equal(p.cantrips,5);
assert.equal(p.spellCount,20);
assert.equal(p.bookMinimum,36);
assert.equal(p.mode,'spellbook');

p=S.profile('sorcerer',16,'2024',{cha:18});
assert.equal(p.cantrips,6);
assert.equal(p.spellCount,18);
assert.equal(p.mode,'fixed-prepared');
assert.equal(p.changeTiming,'level');

p=S.profile('ranger',5,'2024',{wis:18});
assert.equal(p.spellCount,6);
assert.equal(p.mode,'prepared');
assert.equal(p.maxSpellLevel,2);

p=S.profile('wizard',1,'2014',{int:16});
assert.equal(p.bookMinimum,6);
assert.equal(p.spellCount,4);

console.log('SUCCESS class-aware spell counts, preparation modes and reachable spell levels');

const data={build:{edition:'2014'},adobe:{classLevels:[{classId:'druid',level:2},{classId:'cleric',level:3},{classId:'wizard',level:1},{classId:'warlock',level:2}]}};
const profiles=S.profiles(data,8,{wis:16,int:18,cha:14});
assert.equal(profiles.find(p=>p.classId==='druid').spellCount,5);
assert.equal(profiles.find(p=>p.classId==='cleric').spellCount,6);
assert.deepEqual(S.castingStats(profiles.find(p=>p.classId==='wizard'),{mods:{int:4,cha:2},pb:3}),{ability:'int',modifier:4,attack:7,dc:15});
assert.deepEqual(S.castingStats(profiles.find(p=>p.classId==='warlock'),{mods:{int:4,cha:2},pb:3}),{ability:'cha',modifier:2,attack:5,dc:13});
assert.equal(S.castingStats(profiles[0],{mods:{wis:3},pb:3},{spellAttackBonus:1,spellDCBonus:2}).dc,16);
const paladin=S.profile('paladin',2,'2024'),catalogue=[{id:'smite',name:'Divine Smite',edition:'2024',level:1}];
assert.deepEqual(S.selectionCounts(paladin,[{catalogId:'smite',level:1,prepared:true},{catalogId:'cure',level:1,prepared:true},{level:0}],catalogue),{cantrips:1,leveled:1,prepared:1,automatic:1});
console.log('SUCCESS separate multiclass allowances, casting statistics and automatic spell counts');

// Druidic's revised spell grant is additional, source-specific and class-scoped.
const druidCatalogue=require('../data/rules/catalog.json').spells;
for(let level=1;level<=20;level++){
 const modern=S.profile('druid',level,'2024',{wis:16}),legacy=S.profile('druid',level,'2014',{wis:16}),grants=S.automaticGrants(modern,druidCatalogue);
 const speech=grants.find(s=>s.name==='Speak with Animals');assert.ok(speech);assert.equal(speech.edition,'2024');assert.equal(speech.level,1);assert.equal(S.automaticGrants(legacy,druidCatalogue).some(s=>s.name==='Speak with Animals'),false);
 const rows=[{catalogId:speech.id,classId:'druid',level:1,prepared:true},{catalogId:'ordinary',classId:'druid',level:1,prepared:true}];assert.deepEqual(S.selectionCounts(modern,rows,druidCatalogue),{cantrips:0,leveled:1,prepared:1,automatic:1});
}
const dip={build:{classId:'wizard',edition:'2024'},adobe:{classLevels:[{classId:'wizard',level:19},{classId:'druid',level:1}]}};
const dipProfile=S.profiles(dip,20,{wis:16}).find(p=>p.classId==='druid');assert.equal(S.automaticGrants(dipProfile,druidCatalogue).filter(s=>s.name==='Speak with Animals').length,1);dip.adobe.classLevels[0].level=20;assert.equal(S.profiles(dip,20,{wis:16}).some(p=>p.classId==='druid'),false);
assert.equal(S.automaticGrants(S.profile('wizard',20,'2024',{int:20}),druidCatalogue).some(s=>s.name==='Speak with Animals'),false);
console.log('SUCCESS Druidic extra spell: levels 1–20, edition, preparation allowance and capped multiclass source');

const capped={build:{classId:'druid',edition:'2024'},adobe:{classLevels:[{classId:'fighter',level:19},{classId:'druid',level:5}]}},saved=JSON.stringify(capped);
assert.equal(S.profiles(capped,20,{wis:16}).find(p=>p.classId==='druid').level,1);assert.equal(JSON.stringify(capped),saved);
capped.adobe.classLevels[0].level=20;assert.deepEqual(S.profiles(capped,20,{wis:16}),[]);
capped.adobe.classLevels=[{classId:'druid',level:1},{classId:'druid',level:19}];assert.deepEqual(S.classEntries(capped,20).map(p=>p.level),[1]);
capped.adobe.classLevels=[{classId:'druid',level:0}];assert.deepEqual(S.classEntries(capped,20),[]);
console.log('SUCCESS spell profiles cap all assigned levels, count martial levels, reject duplicates and preserve saved class choices');
