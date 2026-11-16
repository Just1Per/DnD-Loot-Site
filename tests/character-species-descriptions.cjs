'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const R = require('../js/modules/character-rules'), M = require('../js/modules/character-sheet-model');
const reference = require('../data/rules/species-feature-reference.json');
const {baselineRules, report} = require('../scripts/audit-species-descriptions.cjs');
const text = (race, edition = '2014', raceFeature = '', level = 4) => R.profile({race, edition, raceFeature}, level).traits.join('\n');
const mechanicPayload = value => JSON.parse(JSON.stringify(value, (key, item) => key === 'traits' ? undefined : item));

test('every selectable species has each source feature explained without cross-race instructions', () => {
  assert.equal(Object.keys(R.races).length, 105);
  assert.deepEqual(Object.keys(reference.races).sort(), Object.keys(R.races).sort());
  assert.equal(reference.revision, require('../data/rules/sources/5etools-v1.json').revision);
  for (const [id, race] of Object.entries(R.races)) {
    assert.ok(race.traits.length > 0, id);
    for (const name of reference.races[id].features) {
      const trait = race.traits.find(t => t.startsWith(name + ': '));
      assert.ok(trait, id + ' / ' + name);
      assert.ok(trait.slice(name.length + 2).length >= 18, id + ' / ' + name);
    }
    assert.doesNotMatch(race.traits.join(' '), /use the (normal|legacy)|check the source|see .+ for .+rules|details remain manual|\{@|\{darkvision\}|Within 0 ft/i, id);
  }
});

test('Shadar-kai and Sea Elf explain both Fey Ancestry and MPMM Trance independently', () => {
  for (const id of ['shadar-kai-mpmm', 'sea-elf-mpmm']) {
    const body = text(id);
    assert.match(body, /Fey Ancestry:.*advantage.*Charmed/);
    assert.match(body, /Trance:.*magic cannot put you to sleep.*Four hours.*long rest.*two temporary weapon or tool proficiencies.*next long rest/);
    assert.match(body, /Keen Senses:.*Perception/);
  }
  assert.match(text('shadar-kai-mpmm'), /30 ft.*PB times per long rest.*From level 3.*all damage.*start of your next turn/);
  assert.match(text('sea-elf-mpmm'), /Child of the Sea:.*air and water.*swimming.*Cold/);
  assert.match(text('sea-elf-mpmm'), /Friend of the Sea:.*Beasts.*swimming/);
});

test('printing-specific legacy, MPMM and revised rules do not bleed between species', () => {
  assert.doesNotMatch(text('high-elf').split('\n').find(t => t.startsWith('Trance:')), /weapon|tool/);
  assert.match(text('high-elf'), /Fey Ancestry:.*magic cannot put you to sleep/);
  assert.doesNotMatch(text('half-elf'), /Trance:/);
  assert.match(text('pallid-elf-egw'), /Incisive Sense:.*Investigation and Insight/);
  assert.match(text('pallid-elf-egw'), /Blessing of the Moon Weaver:.*level 3.*Sleep.*level 5.*Invisibility.*Wisdom/);
  assert.match(text('lotusden-halfling-egw'), /Timberwalk:.*nonmagical plants.*no extra movement/);
  assert.match(text('feral-tiefling-scag'), /Infernal Legacy:.*Hellish Rebuke.*spell level 2.*Darkness.*Charisma/);
  assert.match(text('satyr-mot'), /Magic Resistance:.*spells and other magical effects/);
  assert.doesNotMatch(text('satyr-mpmm'), /other magical effects/);
  assert.match(text('kalashtar-efota', '2024'), /Dual Mind:.*Wisdom and Charisma/);
  assert.doesNotMatch(text('kalashtar'), /Dual Mind:.*Charisma/);
  assert.match(text('hexblood-rthw', '2024'), /Hex Magic:.*Disguise Self and Hex.*always prepared/);
  assert.match(text('lorwyn-changeling-lfl', '2024'), /Darkvision: Within 120 ft/);
  assert.match(text('faerie-lfl', '2024'), /Faerie Lineage:.*Shadowmoor.*120-ft/);
  assert.match(text('kithkin-lfl', '2024'), /Kithkin Lineage:.*Shadowmoor.*120-ft/);
});

test('conditional traits keep source-specific timing and restrictions', () => {
  assert.match(text('firbolg-mpmm'), /Hidden Step:.*make a damage roll/);
  assert.match(text('hadozee'), /Glide:.*falling at least 10 ft above the ground.*reaction/);
  assert.doesNotMatch(text('hadozee'), /heavy armor/);
  assert.match(text('hobgoblin-mpmm'), /Fey Gift:.*first hit before your next turn starts.*next attack within 1 minute/);
  assert.match(text('ravenite-dragonborn-egw'), /Vengeful Assault:.*range of a weapon.*short or long rest/);
  assert.doesNotMatch(text('draconblood-dragonborn-egw'), /Damage Resistance:/);
  assert.match(text('plasmoid'), /Shape Self:.*Bonus action:.*10-ft pseudopod/);
});

test('selected options and unlock levels are explained without a stale Darkvision range', () => {
  assert.match(text('elf-2024', '2024', 'drow'), /Darkvision: Within 120 ft/);
  assert.match(text('elf-2024', '2024', 'high'), /Darkvision: Within 60 ft/);
  assert.doesNotMatch(text('aasimar-mpmm', '2014', 'soul', 2), /Selected option:/);
  assert.match(text('aasimar-mpmm', '2014', 'soul', 3), /Selected option: Radiant Soul/);
  assert.match(text('simic-hybrid', '2014', 'climb'), /Nimble Climber.*climb speed equal to walking speed/);
  assert.match(text('simic-hybrid', '2014', 'climb'), /Selected option: Nimble Climber/);
  assert.match(text('tiefling-2024', '2024', 'abyssal'), /Abyssal grants Poison resistance and Poison Spray.*Hold Person at 5/);
  assert.match(text('gnome-2024', '2024', 'rock'), /10 minutes.*three.*8 hours/);
});

test('all numerical effects, spells, source limits, choices and level traits stay unchanged', () => {
  const before = baselineRules();
  assert.deepEqual(mechanicPayload(R.races), mechanicPayload(before.races));
  for (const [id, race] of Object.entries(R.races)) {
    for (const level of [1, 2, 3, 5, 11, 20]) {
      for (const raceFeature of ['', ...Object.keys(race.optionChoices || {})]) {
        for (const raceFeature2 of ['', ...Object.keys(race.secondOptionChoices || {})]) {
          const build = {race: id, edition: race.edition, raceFeature, raceFeature2};
          assert.deepEqual(mechanicPayload(R.profile(build, level)), mechanicPayload(before.profile(build, level)), id);
        }
      }
    }
    if (race.edition === '2024') assert.equal(R.profile({race: id, edition: '2014'}, 20), null);
  }
});

test('deriving and switching species never writes descriptions or changes stored character data', () => {
  const d = M.normalize({hpMax:22, build:{edition:'2014', classId:'fighter', race:'shadar-kai-mpmm'}});
  const saved = JSON.stringify(d);
  assert.match(M.derive(d, 4).effects.race.traits.join(' '), /Trance:/);
  assert.equal(JSON.stringify(d), saved);
  d.build.race = 'half-orc';
  assert.doesNotMatch(M.derive(d, 4).effects.race.traits.join(' '), /Fey Ancestry|Trance|Raven Queen/);
  assert.deepEqual(M.normalize(JSON.parse(saved)), JSON.parse(saved));
});

test('committed audit stays complete and reproducible from shipped data', () => {
  assert.deepEqual(report(), require('../docs/species-description-audit.json'));
  assert.equal(report().totals.missingDescriptionsNow, 0);
  assert.equal(report().totals.sourceFeatures, 427);
  assert.equal(report().totals.speciesWithCrossRaceReferenceBefore, 3);
});
