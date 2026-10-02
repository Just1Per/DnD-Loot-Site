'use strict';
/* Adobe/MPMB base subclass parity data. Mechanical relationships only. */
var CharacterSubclassData = (() => {
  const rows = [
    ['berserker','barbarian','Path of the Berserker',3],
    ['lore','bard','College of Lore',3],
    ['life-domain','cleric','Life Domain',1],
    ['land','druid','Circle of the Land',2],
    ['champion','fighter','Champion',3],
    ['open-hand','monk','Way of the Open Hand',3],
    ['devotion','paladin','Oath of Devotion',3],
    ['hunter','ranger','Hunter',3],
    ['thief','rogue','Thief',3],
    ['draconic-bloodline','sorcerer','Draconic Bloodline',1],
    ['fiend','warlock','The Fiend',1],
    ['evocation','wizard','School of Evocation',2]
  ];
  const all = Object.fromEntries(rows.map(([id,classId,name,minimumLevel]) => [id, {
    id,classId,name,minimumLevel,edition:'2014',source:'PHB'
  }]));
  const forClass = classId => Object.values(all).filter(row => row.classId === classId);
  const eligible = (classId, level) => forClass(classId).filter(row => Number(level || 0) >= row.minimumLevel);
  const find = id => all[id] || null;
  return {all,forClass,eligible,find};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CharacterSubclassData;
