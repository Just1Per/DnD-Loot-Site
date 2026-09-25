/* Framework-independent character sheet data and calculations. */
var CharacterSheetModel = (() => {
  const Rules = typeof CharacterRules !== 'undefined' ? CharacterRules : require('./character-rules');
  const abilities = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };
  const skills = {
    acrobatics: [
      'Acrobatics',
      'dex'
    ],
    animalHandling: [
      'Animal Handling',
      'wis'
    ],
    arcana: [
      'Arcana',
      'int'
    ],
    athletics: [
      'Athletics',
      'str'
    ],
    deception: [
      'Deception',
      'cha'
    ],
    history: [
      'History',
      'int'
    ],
    insight: [
      'Insight',
      'wis'
    ],
    intimidation: [
      'Intimidation',
      'cha'
    ],
    investigation: [
      'Investigation',
      'int'
    ],
    medicine: [
      'Medicine',
      'wis'
    ],
    nature: [
      'Nature',
      'int'
    ],
    perception: [
      'Perception',
      'wis'
    ],
    performance: [
      'Performance',
      'cha'
    ],
    persuasion: [
      'Persuasion',
      'cha'
    ],
    religion: [
      'Religion',
      'int'
    ],
    sleightOfHand: [
      'Sleight of Hand',
      'dex'
    ],
    stealth: [
      'Stealth',
      'dex'
    ],
    survival: [
      'Survival',
      'wis'
    ]
  };
  const text = value => String(value ?? '').slice(0, 12000);
  const number = (value, fallback = 0, min = -1000, max = 1000000) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.trunc(Number(value)))) : fallback;
  const mod = value => Math.floor((number(value, 10, 1, 30) - 10) / 2);
  const proficiency = level => 2 + Math.floor((number(level, 1, 1, 20) - 1) / 4);
  const signed = value => (value >= 0 ? '+' : '') + value;
  const textFields = [
    'species',
    'background',
    'alignment',
    'experience',
    'appearance',
    'personality',
    'ideals',
    'bonds',
    'flaws',
    'backstory',
    'allies',
    'notes',
    'features',
    'languages',
    'proficiencies',
    'resistances',
    'conditions',
    'equipment',
    'hitDice',
    'resources'
  ];
  const numberFields = {
    ac: 10,
    speed: 30,
    hpMax: 0,
    hpCurrent: 0,
    hpTemp: 0,
    initiativeBonus: 0,
    spellAttackBonus: 0,
    spellDCBonus: 0,
    deathSuccess: 0,
    deathFailure: 0,
    passiveBonus: 0
  };
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const result = {
      build: Rules.normalize(raw.build),
      abilities: {},
      saves: {},
      skills: {},
      coins: {},
      slots: [],
      attacks: [],
      spells: [],
      inspiration: !!raw.inspiration,
      spellAbility: abilities[raw.spellAbility] ? raw.spellAbility : 'int'
    };
    for (const key of textFields)
      result[key] = text(raw[key]);
    for (const [key, defaultValue] of Object.entries(numberFields))
      result[key] = number(raw[key] ?? defaultValue, defaultValue, key.endsWith('Bonus') ? -1000 : 0, key.startsWith('death') ? 3 : 1000000);
    for (const key of Object.keys(abilities)) {
      result.abilities[key] = number(raw.abilities?.[key] ?? 10, 10, 1, 30);
      result.saves[key] = {
        proficient: !!raw.saves?.[key]?.proficient,
        bonus: number(raw.saves?.[key]?.bonus)
      };
    }
    for (const key of Object.keys(skills)) {
      const rank = Number(raw.skills?.[key]?.rank ?? 0);
      result.skills[key] = {
        rank: [
          0,
          0.5,
          1,
          2
        ].includes(rank) ? rank : 0,
        bonus: number(raw.skills?.[key]?.bonus)
      };
    }
    for (const key of [
        'cp',
        'sp',
        'ep',
        'gp',
        'pp'
      ])
      result.coins[key] = number(raw.coins?.[key], 0, 0);
    for (let i = 0; i < 9; i++) {
      const max = number(raw.slots?.[i]?.max, 0, 0, 99);
      result.slots.push({
        max,
        used: number(raw.slots?.[i]?.used, 0, 0, max)
      });
    }
    result.attacks = (Array.isArray(raw.attacks) ? raw.attacks : []).slice(0, 30).map(a => ({
      name: text(a?.name),
      ability: abilities[a?.ability] ? a.ability : 'str',
      proficient: !!a?.proficient,
      bonus: number(a?.bonus),
      damage: text(a?.damage),
      range: text(a?.range),
      notes: text(a?.notes)
    }));
    result.spells = (Array.isArray(raw.spells) ? raw.spells : []).slice(0, 150).map(s => ({
      name: text(s?.name),
      level: number(s?.level, 0, 0, 9),
      prepared: !!s?.prepared,
      casting: text(s?.casting),
      range: text(s?.range),
      duration: text(s?.duration),
      components: text(s?.components),
      notes: text(s?.notes)
    }));
    return result;
  }
  function derive(data, level) {
    const d = normalize(data), pb = proficiency(level), mods = {}, saves = {}, checks = {};
    const effects = Rules.evaluate(d, level, Object.keys(skills));
    const scores = {};
    for (const key of Object.keys(abilities)) {
      scores[key] = Math.min(30, d.abilities[key] + (d.build.scoreMode === 'base' ? Math.min(effects.asi[key] || 0, Math.max(0, 20 - d.abilities[key])) : 0));
      mods[key] = mod(scores[key]);
      saves[key] = mods[key] + (d.saves[key].proficient || effects.saves.includes(key) ? pb : 0) + d.saves[key].bonus;
    }
    for (const [key, [, ability]] of Object.entries(skills))
      checks[key] = mods[ability] + Math.floor(pb * Math.max(d.skills[key].rank, effects.skills.includes(key) ? 1 : 0)) + d.skills[key].bonus;
    return {
      effects,
      scores,
      hpMax: d.hpMax + (d.build.scoreMode === 'base' ? effects.hpBonus : 0),
      pb,
      mods,
      saves,
      skills: checks,
      initiative: mods.dex + d.initiativeBonus + (effects.initiativeBonus || 0),
      passive: 10 + checks.perception + d.passiveBonus,
      spellAttack: mods[d.spellAbility] + pb + d.spellAttackBonus,
      spellDC: 8 + mods[d.spellAbility] + pb + d.spellDCBonus,
      attacks: d.attacks.map(a => mods[a.ability] + (a.proficient ? pb : 0) + a.bonus)
    };
  }
  function damage(data, amount) {
    const d = normalize(data), n = number(amount, 0, 0);
    const absorbed = Math.min(n, d.hpTemp);
    d.hpTemp -= absorbed;
    d.hpCurrent = Math.max(0, d.hpCurrent - (n - absorbed));
    return d;
  }
  function heal(data, amount, level = 1) {
    const d = normalize(data);
    d.hpCurrent = Math.min(derive(d, level).hpMax, d.hpCurrent + number(amount, 0, 0));
    return d;
  }
  return {
    abilities,
    skills,
    textFields,
    numberFields,
    normalize,
    derive,
    mod,
    proficiency,
    signed,
    damage,
    heal
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterSheetModel;
