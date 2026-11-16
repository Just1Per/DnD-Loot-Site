'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const Rules = require('../js/modules/character-rules');
const reference = require('../data/rules/species-feature-reference.json');

// Reconstruct the pre-description catalog from the unchanged mechanical modules.
// This also lets regression tests compare the entire numerical/choice payload.
function baselineRules() {
  const filename = path.join(root, 'js/modules/character-rules.js');
  const localRequire = createRequire(filename), module = {exports: {}};
  const requireBeforeDescriptions = name => name === './character-species-descriptions'
    ? {apply: races => races, profile: (_id, race) => race.traits}
    : localRequire(name);
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {module, require: requireBeforeDescriptions}, {filename});
  return module.exports;
}

function report() {
  const before = JSON.parse(JSON.stringify(baselineRules().races));
  const rows = Object.entries(Rules.races).map(([id, race]) => {
    const source = reference.races[id];
    if (!source) throw new Error('Unreviewed selectable species: ' + id);
    const namedExplanation = (traits, name) => traits.some(text => text.startsWith(name + ': ') && text.slice(name.length + 2).length >= 18);
    return {
      id, name: race.name, edition: race.edition, sources: source.sources,
      sourceFeatures: source.features,
      missingExplicitExplanationBefore: source.features.filter(name => !namedExplanation(before[id].traits, name)),
      missingExplanationNow: source.features.filter(name => !namedExplanation(race.traits, name)),
      crossRaceReferenceBefore: before[id].traits.filter(text => /use the (normal|legacy) .+ rules/i.test(text)),
      status: source.features.every(name => namedExplanation(race.traits, name)) ? 'described' : 'missing-description'
    };
  });
  return {
    revision: reference.revision,
    scope: 'Descriptions for every selectable species. Named options are explained within their parent feature; nested independent spell grants are included separately. This is not an automation audit.',
    beforeDefinition: 'A named explanation requires the exact source feature heading followed by explanatory text. Paraphrased or differently labeled earlier text can be counted here; these counts do not mean every listed rule was wholly absent.',
    totals: {
      species: rows.length, sourceFeatures: rows.reduce((n, r) => n + r.sourceFeatures.length, 0),
      speciesWithMissingNamedExplanationBefore: rows.filter(r => r.missingExplicitExplanationBefore.length).length,
      speciesWithCrossRaceReferenceBefore: rows.filter(r => r.crossRaceReferenceBefore.length).length,
      missingDescriptionsNow: rows.reduce((n, r) => n + r.missingExplanationNow.length, 0)
    },
    species: rows
  };
}

function write() {
  const audit = report();
  fs.writeFileSync(path.join(root, 'docs/species-description-audit.json'), JSON.stringify(audit, null, 2) + '\n');
  const lines = [
    '# Race/species description audit', '',
    `All **${audit.totals.species} selectable species** have original explanations for their **${audit.totals.sourceFeatures} source feature occurrences**. Remaining missing explanations: **${audit.totals.missingDescriptionsNow}**.`, '',
    'Pinned 5etools revision: `' + audit.revision + '`. Identity bindings retain the exact printing, including inherited/subrace features, replacement features and newer EFA/RHW/LFL versions. Only names, page/level metadata and original concise summaries are committed; source entries stay in the ignored cache.', '',
    'The earlier catalog had direct cross-race instructions for Shadar-kai, Sea Elf and Feral Tiefling; Pallid Elf, Lotusden Halfling, Fire Genasi, Simic Hybrid and revised Tiefling included empty trait lists. Several recent entries only listed names. Some earlier explanations used different headings: the “missing named explanation before” column records absent explicit source headings, not a count of wholly absent mechanics.', '',
    'Descriptions cover actions, range, saves, uses, recovery, level unlocks and available options where relevant. Legacy PHB, MPMM and revised traits are separate: for example MPMM Trance grants two temporary weapon/tool proficiencies; PHB Trance does not. Descriptions include future benefits with their required character levels. Selected options are identified, and selected Darkvision ranges follow the current profile.', '',
    '**Scope:** this completes descriptive coverage. It does not implement remaining race mechanics, add missing choice controls, or certify complete engine automation. Existing partial/manual indicators stay intact. Numerical effects, grants, spell resources, existing choices and saved characters are unchanged. In particular, newer lineage controls and source/engine differences such as EFA Khoravar’s one flexible skill/tool versus the older two-skill preset still need a separate mechanics review. Longer text uses the existing Notes continuation when printed.', '',
    'Regenerate with `python3 scripts/build-species-feature-reference.py` (pinned cache required), then `node scripts/audit-species-descriptions.cjs`. Check source reproducibility with `python3 scripts/build-species-feature-reference.py --check`. CI can test the shipped reference without downloading source entries.', '',
    '| Species | Rules | Source | Missing named explanation before | Missing now |',
    '| --- | --- | --- | --- | --- |'
  ];
  for (const row of audit.species) lines.push(`| ${row.name} | ${row.edition} | ${row.sources.map(s => s.source).join(' + ')} | ${row.missingExplicitExplanationBefore.length} | ${row.missingExplanationNow.length} |`);
  fs.writeFileSync(path.join(root, 'docs/species-description-audit.md'), lines.join('\n') + '\n');
  console.log(JSON.stringify(audit.totals));
}
if (require.main === module) write();
module.exports = {report, baselineRules};
