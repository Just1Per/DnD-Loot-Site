const assert = require('node:assert/strict');
const S = require('../js/modules/character-subclass-data');

assert.equal(Object.keys(S.all).length, 12, 'Adobe base subclass parity should include all 12 PHB classes');
assert.equal(S.forClass('fighter')[0].name, 'Champion');
assert.equal(S.forClass('sorcerer')[0].minimumLevel, 1);
assert.equal(S.forClass('wizard')[0].minimumLevel, 2);
assert.equal(S.forClass('barbarian')[0].minimumLevel, 3);
assert.equal(S.eligible('wizard', 1).length, 0);
assert.equal(S.eligible('wizard', 2)[0].id, 'evocation');
for (const classId of ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'])
  assert.equal(S.forClass(classId).length, 1, `${classId} should have its Adobe base subclass`);

console.log('SUCCESS Adobe base subclass parity catalogue');
