'use strict';
/* Presentation only. Source identities and authored text are reviewed separately
 * from numerical effects, spell grants and the character's saved choices. */
const CharacterSpeciesDescriptions = (() => {
  const Data = typeof CharacterSpeciesFeatureData !== 'undefined' ? CharacterSpeciesFeatureData : require('./character-species-feature-data');
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function traits(id, race) {
    if (!own(Data.races, id)) return [...race.traits || []];
    const row = Data.races[id];
    return row.features.map(index => {
      const [name, summary] = Data.features[index];
      return name + ': ' + summary.replaceAll('{darkvision}', String(race.darkvision || row.darkvision));
    });
  }

  function apply(races) {
    for (const [id, race] of Object.entries(races)) race.traits = traits(id, race);
    return races;
  }

  function profile(id, race, selected = []) {
    const result = traits(id, race);
    for (const option of selected) {
      // The base explanation covers all available options. Identify the actual
      // selection even when that option supplies only a numerical/spell grant.
      result.push('Selected option: ' + option.name + '.');
      for (const text of option.traits || []) {
        const line = option.name + ': ' + text;
        if (!result.includes(line)) result.push(line);
      }
    }
    return result;
  }

  return { apply, profile, traits };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CharacterSpeciesDescriptions;
