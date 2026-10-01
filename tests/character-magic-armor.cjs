const assert=require('node:assert/strict');
const Equipment=require('../js/modules/character-equipment');
globalThis.CharacterEquipment=Equipment;
const MagicArmor=require('../js/modules/character-magic-armor');

let m=MagicArmor.infer({name:'Breastplate +2'});
assert.equal(m.kind,'armor');
assert.equal(m.base,'breastplate');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),16,'Breastplate +2 should store 14 base AC +2 magic');

m=MagicArmor.infer({name:'+3 Plate'});
assert.equal(m.base,'plate');
assert.equal(m.acBonus,3);
assert.equal(MagicArmor.expectedAC(m),21);

m=MagicArmor.infer({name:'Dwarven Plate'});
assert.equal(m.base,'plate');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),20);

m=MagicArmor.infer({name:'Dragon Scale Mail'});
assert.equal(m.base,'scale-mail');
assert.equal(m.acBonus,1);
assert.equal(MagicArmor.expectedAC(m),15);

m=MagicArmor.infer({name:'Shield +2'});
assert.equal(m.kind,'shield');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),4,'magic shield bonus is in addition to normal +2 shield AC');

assert.equal(Equipment.infer({name:'Demon Armor'}).acBonus,1,'runtime equipment inference should use Adobe special armor mapping');
console.log('SUCCESS Adobe magic armor AC mechanics');
