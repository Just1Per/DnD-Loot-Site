"use strict";
// Permanent walking-speed bonuses only. Conditions and temporary forms remain separate.
var CharacterClassMovement = (() => {
  function levels(data, level) {
    const stored = data.adobe || data.rulesChoices?.grants?.__adobe?.data || {};
    const entries = stored.classLevels?.length ? stored.classLevels : [{classId:data.build?.classId, level}];
    let remaining = Math.max(1, Math.min(20, Math.trunc(Number(level) || 1)));
    const result = {}, seen = new Set();
    for (const entry of entries) {
      const count = Math.min(remaining, Math.max(0, Math.trunc(Number(entry?.level) || 0)));
      remaining -= count;
      if (!entry || seen.has(entry.classId)) continue;
      seen.add(entry.classId);
      result[entry.classId] = count;
    }
    return result;
  }
  function apply(data, {level=1, effects, gear, baseSpeed, magicItems} = {}) {
    const actual = levels(data, level), rows = [];
    const physical = (gear?.entries || []).filter(row => row.active);
    const armor = physical.find(row => row.mechanics.kind === 'armor');
    const shield = physical.some(row => row.mechanics.kind === 'shield');
    if (actual.monk >= 2) {
      const bonus = actual.monk >= 18 ? 30 : actual.monk >= 14 ? 25 : actual.monk >= 10 ? 20 : actual.monk >= 6 ? 15 : 10;
      const reason = armor ? 'Worn armor prevents this bonus.' : shield ? 'A readied shield prevents this bonus.' : '';
      rows.push({id:'unarmored-movement', name:'Unarmored Movement', level:actual.monk, bonus, active:!reason,
        detail:'Monk '+actual.monk+': +'+bonus+' ft while not wearing armor or wielding a shield. '+(reason || 'Included in walking speed.')});
    }
    if (actual.barbarian >= 5) {
      const reason = armor?.profile?.group === 'heavy' ? 'Worn Heavy armor prevents this bonus.' : '';
      rows.push({id:'fast-movement', name:'Fast Movement', level:actual.barbarian, bonus:10, active:!reason,
        detail:'Barbarian '+actual.barbarian+': +10 ft while not wearing Heavy armor. '+(reason || 'Included in walking speed; a shield does not prevent it.')});
    }
    const base = Math.max(0, Number(baseSpeed) || 0), bonus = rows.reduce((n,row) => n+(row.active ? row.bonus : 0),0);
    // Item walking-speed minima compare against the class-adjusted speed; they
    // must not turn a 25 ft base plus 10 ft into 30 + 10 ft.
    effects.speed = Math.max(Number(effects.speed) || 0, base+bonus);
    if (bonus) for (const row of magicItems?.active || []) {
      if (row.magicActive && row.meta.rule?.speed?.climb?.mode === 'walking') effects.climb = Math.max(Number(effects.climb) || 0, effects.speed);
    }
    const calculation = 'Walking speed '+effects.speed+' ft. Base and other permanent bonuses: '+base+' ft; eligible class bonuses: +'+bonus+' ft. Item speed minima apply to this total.';
    const detail = rows.length ? calculation+' '+rows.map(row=>row.name+': '+row.detail).join(' ') : '';
    return {rows, base, bonus, speed:effects.speed, calculation, detail};
  }
  return {apply};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterClassMovement=CharacterClassMovement;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassMovement;
