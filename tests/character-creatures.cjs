const assert=require('node:assert/strict');
const C=require('../js/modules/character-creature-data');
for(let i=1;i<=4;i++)require(`../js/modules/character-creature-data-${i}`);

assert.equal(C.rows.length,127,'Adobe base creature catalogue should contain all 127 creatures');
const air=C.find('air-elemental');
assert.equal(air.name,'Air Elemental');
assert.equal(air.ac,15);
assert.equal(air.hp,90);
assert.deepEqual(air.scores,[14,20,14,6,10,6]);
const bear=C.find('brown-bear');
assert.equal(bear.type,'Beast');
assert.equal(bear.cr,'1');
assert.equal(bear.hp,34);
assert.ok(C.search('owl').some(row=>row.id==='owl'));
assert.ok(C.search('beast').length>50,'type search should find the Adobe beast catalogue');
assert.equal(new Set(C.rows.map(row=>row.id)).size,127,'creature IDs must be unique');

console.log('SUCCESS Adobe creature parity catalogue: 127 creatures');
