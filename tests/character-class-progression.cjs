const assert = require('node:assert/strict');
const P = require('../js/modules/character-class-progression');

assert.equal(Object.keys(P.classes).length, 12, 'Adobe baseline should include 12 base classes');
assert.equal(Object.keys(P.subclasses).length, 12, 'Adobe baseline should include 12 base subclasses');

const fighter3 = P.unlocked('fighter',3,'champion').map(x=>x.name);
for (const name of ['Fighting Style','Second Wind','Action Surge','Martial Archetype','Improved Critical'])
  assert.ok(fighter3.includes(name), 'Fighter 3 / Champion should include '+name);

const sorcerer1 = P.unlocked('sorcerer',1,'draconic-bloodline').map(x=>x.name);
for (const name of ['Spellcasting','Sorcerous Origin','Dragon Ancestor','Draconic Resilience'])
  assert.ok(sorcerer1.includes(name), 'Sorcerer 1 / Draconic Bloodline should include '+name);

assert.equal(P.subclassLevel('life-domain'),1);
assert.equal(P.subclassLevel('champion'),3);

console.log('SUCCESS character class progression: 12 classes, 12 subclasses and unlock levels');
