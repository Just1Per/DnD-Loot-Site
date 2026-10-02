const assert=require('node:assert/strict');

// Background catalogue
global.CharacterBackgroundData=require('../js/modules/character-background-data');
require('../js/modules/character-expanded-background-data');
const Backgrounds=require('../js/modules/character-backgrounds');
assert.ok(Object.keys(Backgrounds.expanded||{}).length>=120,'expanded background catalogue should contain broad first-party book coverage');
for(const id of [
  'city-watch-scag','archaeologist-toa','marine-gos','feylost-wbtw',
  'lorehold-student-scc','knight-of-solamnia-dsotdq',
  'harper-frhof','house-cannith-heir-efota','haunted-one-rthw',
  'lorwyn-expert-lfl','house-agent-cannith-wgte','acolyte-bgdia'
]) assert.ok(Backgrounds.get(id),id+' should be selectable');
assert.equal(Backgrounds.get('harper-frhof').edition,'2024');
assert.equal(Backgrounds.get('city-watch-scag').edition,'2014');

// Subclass catalogue
global.CharacterSubclassData=require('../js/modules/character-subclass-data');
require('../js/modules/character-expanded-subclass-data');
const Subclasses=global.CharacterSubclassData;
const phb24=Object.values(Subclasses.all).filter(row=>row.source==='PHB24');
assert.equal(phb24.length,48,'2024 Player’s Handbook should contribute four subclasses for each of 12 classes');
for(const classId of ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'])
  assert.equal(phb24.filter(row=>row.classId===classId).length,4,classId+' should have four 2024 PHB subclasses');
assert.equal(Subclasses.optionsFor('sorcerer',2,'2024').length,0,'2024 subclasses should not unlock before class level 3');
const sorcerer3=Subclasses.optionsFor('sorcerer',3,'2024').map(row=>row.id);
assert.ok(sorcerer3.includes('draconic-sorcery-2024'));
assert.ok(sorcerer3.includes('draconic-bloodline'),'legacy subclass should remain explicitly selectable on a 2024 class');
assert.ok(Subclasses.find('hexblade'));
assert.ok(Subclasses.find('echo-knight'));
assert.ok(Subclasses.find('spellfire-sorcery-frhof'));
assert.ok(Subclasses.find('hollow-warden-rthw'));
assert.ok(Subclasses.find('cartographer-efota').classPending);

// Race/species catalogue
global.CharacterRaceCatalog=require('../js/modules/character-race-catalog');
require('../js/modules/character-expanded-race-data');
const races={human:{name:'Human',asi:{},languages:['Common'],traits:[]}};
global.CharacterBackgrounds=Backgrounds;
const Modern=require('../js/modules/character-rules-2024');
CharacterRaceCatalog.extend(races);
Modern.extend(races);
for(const id of [
  'sea-elf-mpmm','shadar-kai-mpmm','feral-tiefling-scag',
  'chromatic-dragonborn-ftd','gem-dragonborn-ftd','metallic-dragonborn-ftd',
  'pallid-elf-egw','khoravar-efota','lupin-rthw','boggart-lfl'
]) assert.ok(races[id],id+' should be selectable');
assert.equal(races['khoravar-efota'].edition,'2024','current expanded species should not be downgraded to legacy');
assert.equal(races['sea-elf-mpmm'].edition,'2014');
assert.equal(races['human-2024'].edition,'2024');

console.log('SUCCESS expanded first-party backgrounds, subclasses and species catalogues');
