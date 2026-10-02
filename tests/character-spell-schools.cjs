const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
global.CharacterFeatData=require('../js/modules/character-feat-data');
global.CharacterFeatRules=require('../js/modules/character-feat-rules');
const C=require('../js/modules/character-catalog');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/rules/catalog.json'),'utf8'));
C.set(data);

const schools=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
assert.deepEqual([...C.schools],schools);
assert.ok(data.spells.length>=900,'expected the full spell catalogue, not a reduced fixture');
assert.equal(data.spells.filter(spell=>!spell.school).length,0,'every spell must have a school of magic');
assert.deepEqual([...new Set(data.spells.map(spell=>spell.school))].sort(),[...schools].sort(),'only the eight D&D schools of magic should be used');

for(const school of schools){
  const rows=C.spells({school});
  assert.ok(rows.length>0,school+' should return spells');
  assert.ok(rows.every(spell=>spell.school===school),school+' filter must be exact');
}
const necrotic=C.spells({search:'necrotic'});
assert.ok(necrotic.length>0,'damage-type search should find necrotic spells');
assert.ok(necrotic.every(spell=>
  spell.name.toLowerCase().includes('necrotic') ||
  spell.school.toLowerCase().includes('necrotic') ||
  (spell.combat?.types||[]).some(type=>String(type).toLowerCase().includes('necrotic')) ||
  String(spell.source||'').toLowerCase().includes('necrotic') ||
  String(spell.book||'').toLowerCase().includes('necrotic') ||
  String(spell.save||'').toLowerCase().includes('necrotic') ||
  String(spell.casting||'').toLowerCase().includes('necrotic') ||
  String(spell.range||'').toLowerCase().includes('necrotic')
),'search results must match the expanded search index');

console.log('SUCCESS all spells have one of eight schools; school and damage-type filters work');
