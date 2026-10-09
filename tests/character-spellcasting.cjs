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
