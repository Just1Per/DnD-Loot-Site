/* Character advancement engine: XP, class levels, HP and multiclass spell-slot progression.
 * Framework-independent so builder, overview and tests share one source of truth. */
var CharacterProgression = (() => {
  const XP_THRESHOLDS = Object.freeze([
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
    305000, 355000
  ]);

  const CLASS_HIT_DICE = Object.freeze({
    barbarian: 12,
    fighter: 10,
    paladin: 10,
    ranger: 10,
    bard: 8,
    cleric: 8,
    druid: 8,
    monk: 8,
    rogue: 8,
    warlock: 8,
    artificer: 8,
    sorcerer: 6,
    wizard: 6
  });

  const FULL_CASTERS = new Set(['bard','cleric','druid','sorcerer','wizard']);
  const HALF_CASTERS = new Set(['artificer','paladin','ranger']);
  const THIRD_CASTER_SUBCLASSES = new Set(['eldritch-knight','arcane-trickster']);

  // Standard full-caster/multiclass Spellcasting slot progression, levels 0-20.
  const MULTICLASS_SLOTS = Object.freeze([
    [0,0,0,0,0,0,0,0,0],
    [2,0,0,0,0,0,0,0,0],
    [3,0,0,0,0,0,0,0,0],
    [4,2,0,0,0,0,0,0,0],
    [4,3,0,0,0,0,0,0,0],
    [4,3,2,0,0,0,0,0,0],
    [4,3,3,0,0,0,0,0,0],
    [4,3,3,1,0,0,0,0,0],
    [4,3,3,2,0,0,0,0,0],
    [4,3,3,3,1,0,0,0,0],
    [4,3,3,3,2,0,0,0,0],
    [4,3,3,3,2,1,0,0,0],
    [4,3,3,3,2,1,0,0,0],
    [4,3,3,3,2,1,1,0,0],
    [4,3,3,3,2,1,1,0,0],
    [4,3,3,3,2,1,1,1,0],
    [4,3,3,3,2,1,1,1,0],
    [4,3,3,3,2,1,1,1,1],
    [4,3,3,3,3,1,1,1,1],
    [4,3,3,3,3,2,1,1,1],
    [4,3,3,3,3,2,2,1,1]
  ]);

  const clampLevel = value => Math.max(1, Math.min(20, Math.trunc(Number(value) || 1)));
  const key = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const abilityMod = score => Math.floor((Number(score || 10) - 10) / 2);

  function levelFromXP(value) {
    const xp = Math.max(0, Math.trunc(Number(String(value ?? '').replace(/,/g,'')) || 0));
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      if (xp < XP_THRESHOLDS[i]) break;
      level = i + 1;
    }
    return level;
  }

  function xpProgress(value) {
    const xp = Math.max(0, Math.trunc(Number(String(value ?? '').replace(/,/g,'')) || 0));
    const level = levelFromXP(xp);
    const current = XP_THRESHOLDS[level - 1];
    const next = level < 20 ? XP_THRESHOLDS[level] : null;
    return {
      xp,
      level,
      current,
      next,
      remaining: next == null ? 0 : Math.max(0, next - xp),
      percent: next == null ? 100 : Math.max(0, Math.min(100, ((xp - current) / (next - current)) * 100))
    };
  }

  function normalizeClassLevels(raw, fallbackClass = '', fallbackLevel = 1) {
    const source = Array.isArray(raw) && raw.length ? raw : [{classId:fallbackClass, level:fallbackLevel}];
    const result = [];
    for (const entry of source) {
      const classId = key(entry?.classId || entry?.class || entry?.name);
      if (!classId) continue;
      result.push({
        classId,
        level: clampLevel(entry?.level),
        subclassId: key(entry?.subclassId || entry?.subclass)
      });
    }
    let total = result.reduce((sum, entry) => sum + entry.level, 0);
    for (let i = result.length - 1; i >= 0 && total > 20; i--) {
      const remove = Math.min(result[i].level, total - 20);
      result[i].level -= remove;
      total -= remove;
      if (result[i].level <= 0) result.splice(i,1);
    }
    return result.length ? result : [{classId:key(fallbackClass)||'adventurer', level:clampLevel(fallbackLevel), subclassId:''}];
  }

  function totalLevel(classLevels) {
    return Math.max(1, Math.min(20, normalizeClassLevels(classLevels).reduce((sum, entry) => sum + entry.level, 0)));
  }

  function hitDieFor(classId) {
    return CLASS_HIT_DICE[key(classId)] || 8;
  }

  function fixedHitPointsForDie(hitDie) {
    return Math.floor(Number(hitDie || 8) / 2) + 1;
  }

  function calculateHP({classLevels, constitution = 10, hpMode = 'fixed', hpRolls = [], bonuses = 0} = {}) {
    const levels = normalizeClassLevels(classLevels);
    const conMod = abilityMod(constitution);
    const mode = ['fixed','max','rolled'].includes(hpMode) ? hpMode : 'fixed';
    let characterLevel = 0;
    let base = 0;
    const breakdown = [];
    for (const entry of levels) {
      const die = hitDieFor(entry.classId);
      for (let classLevel = 1; classLevel <= entry.level; classLevel++) {
        characterLevel += 1;
        let dieHP;
        if (characterLevel === 1) dieHP = die;
        else if (mode === 'max') dieHP = die;
        else if (mode === 'rolled') {
          const supplied = Math.trunc(Number(hpRolls[characterLevel - 2]));
          dieHP = Number.isFinite(supplied) && supplied >= 1 && supplied <= die ? supplied : fixedHitPointsForDie(die);
        } else dieHP = fixedHitPointsForDie(die);
        const gained = Math.max(1, dieHP + conMod);
        base += gained;
        breakdown.push({characterLevel,classId:entry.classId,classLevel,hitDie:die,dieHP,conMod,gained});
      }
    }
    const extra = Math.trunc(Number(bonuses) || 0);
    return {max:Math.max(1, base + extra),base,bonuses:extra,conMod,mode,breakdown};
  }

  function casterLevel(classLevels, edition='2014') {
    let total = 0;
    for (const entry of normalizeClassLevels(classLevels)) {
      if (FULL_CASTERS.has(entry.classId)) total += entry.level;
      else if (entry.classId === 'artificer') total += Math.ceil(entry.level / 2);
      else if (entry.classId === 'paladin' || entry.classId === 'ranger') {
        // 2014 multiclass rules round these classes down. The 2024 classes begin
        // spellcasting at level 1, so round up when using the revised rules.
        total += edition === '2024' ? Math.ceil(entry.level / 2) : Math.floor(entry.level / 2);
      } else if (THIRD_CASTER_SUBCLASSES.has(entry.subclassId)) total += Math.floor(entry.level / 3);
    }
    return Math.max(0, Math.min(20, total));
  }

  function spellSlots(classLevels, edition='2014') {
    const level = casterLevel(classLevels,edition);
    return level ? [...MULTICLASS_SLOTS[level]] : [0,0,0,0,0,0,0,0,0];
  }

  function hitDiceSummary(classLevels) {
    const totals = new Map();
    for (const entry of normalizeClassLevels(classLevels)) {
      const die = hitDieFor(entry.classId);
      totals.set(die,(totals.get(die)||0)+entry.level);
    }
    return [...totals.entries()].sort((a,b)=>b[0]-a[0]).map(([die,count])=>`${count}d${die}`).join(' + ');
  }

  return {
    XP_THRESHOLDS,
    CLASS_HIT_DICE,
    MULTICLASS_SLOTS,
    abilityMod,
    levelFromXP,
    xpProgress,
    normalizeClassLevels,
    totalLevel,
    hitDieFor,
    fixedHitPointsForDie,
    calculateHP,
    casterLevel,
    spellSlots,
    hitDiceSummary
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CharacterProgression;
