const assert = require('node:assert/strict');
const S = require('../js/modules/character-subclass-data');

assert.equal(Object.keys(S.all).length, 186, 'The complete selectable catalogue loads in standalone rule modules');
assert.equal(S.forClass('fighter')[0].name, 'Champion');
assert.equal(S.forClass('sorcerer')[0].minimumLevel, 1);
assert.equal(S.forClass('wizard')[0].minimumLevel, 2);
assert.equal(S.forClass('barbarian')[0].minimumLevel, 3);
assert.equal(S.eligible('wizard', 1).length, 0);
assert.equal(S.eligible('wizard', 2)[0].id, 'evocation');
for (const [classId,id] of Object.entries({barbarian:'berserker',bard:'lore',cleric:'life-domain',druid:'land',fighter:'champion',monk:'open-hand',paladin:'devotion',ranger:'hunter',rogue:'thief',sorcerer:'draconic-bloodline',warlock:'fiend',wizard:'evocation'}))
  assert.ok(S.forClass(classId).some(row=>row.id===id&&row.edition==='2014'), `${classId} retains its Adobe base subclass`);
assert.equal(S.find('war-domain').minimumLevel, 1);

console.log('SUCCESS Adobe base subclass parity catalogue');
