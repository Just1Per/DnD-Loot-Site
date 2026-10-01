/* Character advancement engine: XP, class levels, HP and multiclass spell-slot progression.
 * Kept framework-independent so builder, overview and tests share one source of truth. */
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
  const THIRD_CASTERS = new Set(['eldritch-knight','arcane-trickster']);

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
    [4,3,3,3,3,1,1,1,1],
    [4,3,3,3,3,2,1,1,1],
    [4,3,3,3,3,2,2,1,1],
    [4,3,3,3,3,2,2,2,1]
  ]);

  const clampLevel = value => Math.max(1, Math.min(20, Math.trunc(Number(value) || 1)));
  const key = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const abilityMod = score => Math.floor((Number(score || 10) - 10) / 2);

  function levelFromXP(value) {
    const xp = Math.max(0, Math.trunc(Number(value) || 0));
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      if (xp < XP_THRESHOLDS[i]) break;
      level = i + 1;
    }
    return level;
  }

  function xpProgress(value) {
    const xp = Math.max(0, Math.trunc(Number(value) || 0));
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
      const level = clampLevel(entry?.level);
      result.push({classId, level, subclassId:key(entry?.subclassId || entry?.subclass)});
    }
    let total = result.reduce((sum, entry) => sum + entry.level, 0);
    while (total > 20 && result.length) {
      const last = result[result.length - 1];
      const reduce = Math.min(last.level - 1, total - 20);
      last.level -= reduce;
      total -= reduce;
      if (last.level < 1) result.pop();
    }
    return result.length ? result : [{classId:'adventurer', level:clampLevel(fallbackLevel)}];
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

  /*
   * hpMode:
   * - fixed: maximum die at character level 1, fixed average thereafter
   * - max: maximum die at every level
   * - rolled: maximum die at character level 1, supplied hpRolls thereafter
   * hpRolls is indexed by character level after first (level 2 => hpRolls[0]).
   */
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

  function casterLevel(classLevels) {
    let total = 0;
    for (const entry of normalizeClassLevels(classLevels)) {
      if (FULL_CASTERS.has(entry.classId)) total += entry.level;
      else if (entry.classId === 'artificer') total += Math.ceil(entry.level / 2);
      else if (HALF_CASTERS.has(entry.classId)) total += Math.floor(entry.level / 2);
      else if (THIRD_CASTERS.has(entry.subclassId)) total += Math.floor(entry.level / 3);
    }
    return Math.max(0, Math.min(20, total));
  }

  function spellSlots(classLevels) {
    const level = casterLevel(classLevels);
    return level ? [...MULTICLASS_SLOTS[level]] : [0,0,0,0,0,0,0,0,0];
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
    spellSlots
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CharacterProgression;
