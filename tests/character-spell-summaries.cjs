'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../js/modules/character-spell-summaries'),M=require('../js/modules/character-sheet-model'),catalog=require('../data/rules/catalog.json');
test('every selectable spell has an original concise summary, including non-SRD source variants',()=>{
 assert.equal(catalog.spells.length,969);assert.equal(new Set(catalog.spells.map(s=>s.name)).size,583);
 for(const spell of catalog.spells){const text=S.get(spell);assert.ok(text.length>=10&&text.length<=130,spell.name+': '+text.length);assert.doesNotMatch(text,/\{@|consult.*source|reference entry/i);assert.notEqual(text,spell.description);}
});
test('edition-sensitive reminders retain changed saves, damage and conjuration mechanics',()=>{
 const old=name=>S.get({name,edition:'2014'}),now=name=>S.get({name,edition:'2024'});
 assert.match(old('Counterspell'),/check/);assert.match(now('Counterspell'),/CON save/);assert.doesNotMatch(now('Counterspell'),/level 3/);
 assert.match(old('Resistance'),/saving throw/);assert.match(now('Resistance'),/damage.*1d4/);
 assert.match(old('True Strike'),/next turn/);assert.match(now('True Strike'),/spellcasting ability/);
 assert.match(old('Conjure Animals'),/Summon beasts/);assert.match(now('Conjure Animals'),/spectral pack/);
 assert.match(old('Sleep'),/HP pool/);assert.match(now('Sleep'),/WIS saves/);
 assert.match(now('Inflict Wounds'),/2d10/);assert.match(old('Inflict Wounds'),/3d10/);
});
test('short sheet text persists independently of full rules, source identity and personal notes',()=>{
 const source=catalog.spells.find(s=>s.name==='Fireball'&&s.edition==='2024'),spell={...source,catalogId:source.id,notes:'Full private notes remain here.',shortDescription:'My area reminder.'},data=M.normalize({spells:[spell]});
 assert.equal(S.forRow(data.spells[0],source),'My area reminder.');const saved=M.normalize(JSON.parse(JSON.stringify(data)));assert.equal(saved.spells[0].notes,spell.notes);assert.equal(saved.spells[0].catalogId,source.id);assert.equal(saved.spells[0].shortDescription,'My area reminder.');saved.spells[0].shortDescription='';assert.match(S.forRow(saved.spells[0],source),/8d6 Fire/);assert.equal(saved.spells[0].notes,spell.notes);
 assert.equal(S.forRow({name:'My ritual',notes:'Lift a small lantern.'}),'Lift a small lantern.');assert.ok(S.forRow({name:'Personal'}).length);for(const name of ['constructor','__proto__','toString'])assert.equal(S.get({name}), '');assert.equal(M.normalize({spells:[{shortDescription:'x'.repeat(401)}]}).spells[0].shortDescription.length,400);
});
test('paper facts abbreviate long values without mutating saved text or dropping ritual and concentration context',()=>{
 assert.equal(S.compact('save','DEXTERITY, CONSTITUTION'),'DEX, CON');assert.equal(S.compact('school','Transmutation'),'Trans.');assert.equal(S.compact('time','1 reaction — after an enemy casts a spell'),'React.');assert.equal(S.compact('duration','Concentration, 1 minute'),'C: 1 min');assert.equal(S.compact('range','150 feet'),'150 ft');assert.equal(S.levelLabel(0),'Cantrips');assert.equal(S.levelLabel(1),'1st-level spells');assert.equal(S.levelLabel(9),'9th-level spells');
});
