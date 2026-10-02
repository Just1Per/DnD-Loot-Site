const {test}=require('node:test'),assert=require('node:assert/strict');
const Ref=require('../js/modules/character-feat-reference');
const F=require('../js/modules/character-feat-data');

test('concise feat reference covers every bundled feat definition',()=>{
  assert.equal(Object.keys(Ref.records).length,302);
  for(const d of Object.values(F))assert.ok(Ref.records[d.source+'|'+d.name],d.source+' '+d.name);
});
test('Survivor has a useful non-placeholder summary',()=>{
  const s=Ref.records['RHW|Survivor'];assert.ok(s);assert.match(s.summary,/Initiative/i);assert.match(s.summary,/Charmed|Frightened/i);assert.deepEqual(s.features,['Hypervigilance','Steel Yourself']);
});
test('feat reference exposes filterable structured mechanics',()=>{
  const armored=Ref.records['PHB|Moderately Armored'];assert.ok(armored.tags.includes('armor'));assert.ok(armored.tags.includes('ability'));
  const magic=Object.values(Ref.records).find(r=>r.tags.includes('spells'));assert.ok(magic);
});
