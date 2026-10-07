/* Framework-independent character sheet data and calculations. */
var CharacterSheetModel = (() => {
  const Actions=typeof CharacterActions!=='undefined'?CharacterActions:require('./character-actions');
  const Play=typeof CharacterPlayRules!=='undefined'?CharacterPlayRules:require('./character-play-rules');
  const Rules = typeof CharacterRules !== 'undefined' ? CharacterRules : require('./character-rules');
  const Catalog = typeof CharacterCatalog !== 'undefined' ? CharacterCatalog : require('./character-catalog');
  const Feats=typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
  const Equipment=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
  const Magic=typeof CharacterMagicItems!=='undefined'?CharacterMagicItems:null;
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
    'enemies',
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
      personalGear: (Array.isArray(raw.personalGear)?raw.personalGear:[]).filter(g=>g&&typeof g==='object').slice(0,200).map((g,i)=>({
        id: 'personal-'+String(g.id||i).replace(/^personal-/, '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80),
        name: String(g.name||'Item').slice(0,160), quantity: number(g.quantity,1,0,9999),
        weight: Math.max(0,Math.min(99999,Number(g.weight)||0)), location: String(g.location||'Backpack').slice(0,80),
        carried: g.carried!==false, notes: String(g.notes||'').slice(0,500),
        edition: g.edition==='2024'?'2024':'2014'
      })).filter((g,i,a)=>a.findIndex(x=>x.id===g.id)===i),
      actions: Actions.normalize(raw.actions),
      profile: Play.normalizeProfile(raw.profile),
      advancement: Play.normalizeAdvancement(raw.advancement),
      equipmentState: Equipment.choices(raw.equipmentState),
      build: Rules.normalize(raw.build),
      rulesChoices: Catalog.normalize(raw.rulesChoices),
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
      rangedWeapon: !!a?.rangedWeapon,
      bonus: number(a?.bonus),
      damage: text(a?.damage),
      range: text(a?.range),
      notes: text(a?.notes)
    }));
    result.spells = (Array.isArray(raw.spells) ? raw.spells : []).slice(0, 150).map(s => ({
      name: text(s?.name),
      catalogId: text(s?.catalogId),
      classId: String(s?.classId||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60),
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
  function pointBuy(abilities={}) {
    const costs={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
    const rows=Object.keys(CharacterSheetModel.abilities).map(key=>({key,score:Number(abilities[key]),cost:costs[abilities[key]]??null}));
    const invalid=rows.filter(r=>r.cost===null).map(r=>r.key),spent=rows.reduce((n,r)=>n+(r.cost||0),0);
    return {rows,invalid,spent,remaining:27-spent,budget:27,valid:!invalid.length&&spent<=27};
  }
  function derive(data, level, loot = []) {
    const d = normalize(data), pb = proficiency(level), mods = {}, saves = {}, checks = {};
    // Keep class assignments available to core rules before feats/equipment are calculated.
    const assigned=(data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classLevels;
    if(Array.isArray(assigned))d.adobe={classLevels:assigned.filter(entry=>entry&&typeof entry.classId==='string').slice(0,8).map(entry=>({classId:entry.classId,level:number(entry.level,1,1,20),subclassId:String(entry.subclassId||'')}))};
    const effects = Rules.evaluate(d, level, Object.keys(skills));
    const scores = {};
    for (const key of Object.keys(abilities)) {
      scores[key] = Math.min(30, d.abilities[key] + (d.build.scoreMode === 'base' ? Math.min(effects.asi[key] || 0, Math.max(0, 20 - d.abilities[key])) : 0));
    }
    const originCon = scores.con;
    const feats=Feats.apply(d,level,effects,scores,Object.keys(skills),Rules.tools);
    const magicItems=Magic?Magic.apply(d,scores,effects,loot):{active:[],reports:[],warnings:[]};
    if(d.build.scoreMode==='base')effects.hpBonus+=Math.max(1,Math.min(20,Number(level)||1))*(mod(scores.con)-mod(originCon));
    for (const key of Object.keys(abilities)) {
      mods[key] = mod(scores[key]);
      saves[key] = mods[key] + (d.saves[key].proficient || effects.saves.includes(key) ? pb : 0) + d.saves[key].bonus;
    }
    for (const [key, [, ability]] of Object.entries(skills))
      checks[key] = mods[ability] + Math.floor(pb * Math.max(d.skills[key].rank, effects.skills.includes(key) ? 1 : 0, feats.expertise.includes(key) ? 2 : 0)) + d.skills[key].bonus;
    const result = {
      effects,
      feats,
      ac: d.ac + feats.acBonus,
      scores,
      hpMax: d.hpMax + (d.build.scoreMode === 'base' ? effects.hpBonus : 0),
      pb,
      mods,
      saves,
      skills: checks,
      initiative: mods.dex + d.initiativeBonus + (effects.initiativeBonus || 0),
      passive: 10 + checks.perception + d.passiveBonus + feats.passiveBonus,
      spellAttack: mods[d.spellAbility] + pb + d.spellAttackBonus,
      spellDC: 8 + mods[d.spellAbility] + pb + d.spellDCBonus,
      attacks: d.attacks.map(a => mods[a.ability] + (a.proficient ? pb : 0) + a.bonus + (a.rangedWeapon ? feats.rangedBonus : 0))
    };
    result.magicItems=magicItems;
    result.gear=Equipment.derive(d,result,loot);
    if(Magic)result.gear=Magic.augmentGear(d,result.gear,magicItems);
    result.ac=result.gear.ac;
    result.actions=Actions.derive(d,level,result,loot,Catalog.data?.spells||[]);
    return result;
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
    pointBuy,
    signed,
    damage,
    heal
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterSheetModel;
