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
