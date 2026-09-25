/* Original engine and structured adaptations of SRD 5.1 (CC BY 4.0).
 * See rules-attribution.html for source and license. No Acrobat scripts execute here. */
var CharacterRules = (() => {
  const races = {
    'dragonborn': {
      name: 'Dragonborn',
      asi: {
        str: 2,
        cha: 1
      },
      speed: 30,
      size: 'Medium',
      languages: [
        'Common',
        'Draconic'
      ],
      traits: [
        'Draconic Ancestry: your dragon choice determines breath weapon and resistance.',
        'Breath Weapon: use an action; regain after a short or long rest.'
      ]
    },
    'hill-dwarf': {
      name: 'Dwarf \u2014 Hill dwarf',
      asi: {
        con: 2,
        wis: 1
      },
      speed: 25,
      size: 'Medium',
      darkvision: 60,
      languages: [
        'Common',
        'Dwarvish'
      ],
      resistances: ['Poison'],
      proficiencies: [
        'Battleaxe',
        'Handaxe',
        'Light hammer',
        'Warhammer'
      ],
      traits: [
        'Dwarven Resilience: advantage on saving throws against poison.',
        'Dwarven Toughness: +1 maximum HP for each character level.',
        'Stonecunning: double proficiency on Intelligence (History) checks about the origin of stonework.',
        'Dwarven Speed: heavy armor does not reduce your walking speed.'
      ]
    },
    'high-elf': {
      name: 'Elf \u2014 High elf',
      asi: {
        dex: 2,
        int: 1
      },
      speed: 30,
      size: 'Medium',
      darkvision: 60,
      languages: [
        'Common',
        'Elvish'
      ],
      skills: ['perception'],
      proficiencies: [
        'Longsword',
        'Shortsword',
        'Shortbow',
        'Longbow'
      ],
      traits: [
        'Fey Ancestry: advantage on saves against charm; magic cannot put you to sleep.',
        'Trance: meditate deeply for 4 hours instead of sleeping.',
        'Keen Senses: proficiency in Perception.',
        'High Elf Cantrip: choose one wizard cantrip; Intelligence is its casting ability.'
      ]
    },
    'lightfoot-halfling': {
      name: 'Halfling \u2014 Lightfoot',
      asi: {
        dex: 2,
        cha: 1
      },
      speed: 25,
      size: 'Small',
      languages: [
        'Common',
        'Halfling'
      ],
      traits: [
        'Lucky: reroll a 1 on an attack roll, ability check or saving throw; use the new roll.',
        'Brave: advantage on saves against fear.',
        'Halfling Nimbleness: move through a larger creature\u2019s space.',
        'Naturally Stealthy: you may attempt to hide behind a creature at least one size larger.'
      ]
    },
    'human': {
      name: 'Human',
      asi: {
        str: 1,
        dex: 1,
        con: 1,
        int: 1,
        wis: 1,
        cha: 1
      },
      speed: 30,
      size: 'Medium',
      languages: ['Common'],
      traits: [
        'Versatile Ability Scores: +1 to each ability score.',
        'Extra Language: choose one additional language.'
      ]
    },
    'rock-gnome': {
      name: 'Gnome \u2014 Rock gnome',
      asi: {
        int: 2,
        con: 1
      },
      speed: 25,
      size: 'Small',
      darkvision: 60,
      languages: [
        'Common',
        'Gnomish'
      ],
      proficiencies: ['Tinker\u2019s tools'],
      traits: [
        'Gnome Cunning: advantage on Intelligence, Wisdom and Charisma saving throws against magic.',
        'Artificer\u2019s Lore: double proficiency on History checks about magic, alchemy and technology.',
        'Tinker: spend 1 hour and 10 gp to build a Tiny clockwork device; maintain or repair it daily. Up to three devices.'
      ]
    },
    'half-elf': {
      name: 'Half-Elf',
      asi: { cha: 2 },
      speed: 30,
      size: 'Medium',
      darkvision: 60,
      languages: [
        'Common',
        'Elvish'
      ],
      traits: [
        'Fey Ancestry: advantage on saves against charm; magic cannot put you to sleep.',
        'Ability Choices: +1 to two different abilities other than Charisma.',
        'Skill Versatility: choose two skill proficiencies.'
      ]
    },
    'half-orc': {
      name: 'Half-Orc',
      asi: {
        str: 2,
        con: 1
      },
      speed: 30,
      size: 'Medium',
      darkvision: 60,
      languages: [
        'Common',
        'Orc'
      ],
      skills: ['intimidation'],
      traits: [
        'Menacing: proficiency in Intimidation.',
        'Relentless Endurance: when reduced to 0 HP without being killed, drop to 1 HP instead; once per long rest.',
        'Savage Attacks: roll one extra weapon damage die on a critical hit with a melee weapon.'
      ]
    },
    'tiefling': {
      name: 'Tiefling',
      asi: {
        int: 1,
        cha: 2
      },
      speed: 30,
      size: 'Medium',
      darkvision: 60,
      languages: [
        'Common',
        'Infernal'
      ],
      resistances: ['Fire'],
      traits: [
        'Hellish Resistance: resistance to fire damage.',
        'Infernal Legacy: Charisma governs your racial spells. At level 3, Hellish Rebuke is cast at 2nd level once per long rest; at level 5, Darkness once per long rest.'
      ]
    }
  };
  const Catalog = typeof CharacterRaceCatalog !== 'undefined' ? CharacterRaceCatalog : require('./character-race-catalog');
  Catalog.extend(races);
  const Modern = typeof CharacterRules2024 !== 'undefined' ? CharacterRules2024 : require('./character-rules-2024');
  Modern.extend(races);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const abilityKeys = [
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha'
  ];
  const instruments = [
    'Bagpipes',
    'Drum',
    'Dulcimer',
    'Flute',
    'Lute',
    'Lyre',
    'Horn',
    'Pan flute',
    'Shawm',
    'Viol'
  ];
  const tools = [
    'Alchemist\u2019s supplies',
    'Brewer\u2019s supplies',
    'Calligrapher\u2019s supplies',
    'Carpenter\u2019s tools',
    'Cartographer\u2019s tools',
    'Cobbler\u2019s tools',
    'Cook\u2019s utensils',
    'Glassblower\u2019s tools',
    'Jeweler\u2019s tools',
    'Leatherworker\u2019s tools',
    'Mason\u2019s tools',
    'Painter\u2019s supplies',
    'Potter\u2019s tools',
    'Smith\u2019s tools',
    'Tinker\u2019s tools',
    'Weaver\u2019s tools',
    'Woodcarver\u2019s tools',
    'Disguise kit',
    'Forgery kit',
    'Herbalism kit',
    'Navigator\u2019s tools',
    'Poisoner\u2019s kit',
    'Thieves\u2019 tools',
    'Dice set',
    'Dragonchess set',
    'Playing card set',
    'Three-Dragon Ante set',
    ...instruments
  ];
  const weapons = [
    'Club',
    'Dagger',
    'Greatclub',
    'Handaxe',
    'Javelin',
    'Light hammer',
    'Mace',
    'Quarterstaff',
    'Sickle',
    'Spear',
    'Light crossbow',
    'Dart',
    'Shortbow',
    'Sling',
    'Battleaxe',
    'Flail',
    'Glaive',
    'Greataxe',
    'Greatsword',
    'Halberd',
    'Lance',
    'Longsword',
    'Maul',
    'Morningstar',
    'Pike',
    'Rapier',
    'Scimitar',
    'Shortsword',
    'Trident',
    'War pick',
    'Warhammer',
    'Whip',
    'Blowgun',
    'Hand crossbow',
    'Heavy crossbow',
    'Longbow',
    'Net'
  ];
  function profile(build, level = 1) {
    const r = own(races, build?.race) ? races[build.race] : null;
    if (!r || r.edition === '2024' && build.edition !== '2024')
      return null;
    const p = {
      ...r,
      traits: [...r.traits],
      spells: [...r.spells || []]
    };
    for (const [field, choices, min] of [
        [
          'raceFeature',
          r.optionChoices,
          r.optionLevel || 1
        ],
        [
          'raceFeature2',
          r.secondOptionChoices,
          r.secondOptionLevel || 1
        ]
      ]) {
      const key = build[field];
      if (level < min || !choices || !own(choices, key) || field === 'raceFeature2' && key === build.raceFeature)
        continue;
      const option = choices[key];
      Object.assign(p, {
        ...option,
        name: r.name,
        traits: [
          ...p.traits,
          ...option.traits || []
        ],
        spells: [
          ...p.spells,
          ...option.spells || []
        ]
      });
    }
    return p;
  }
  const classes = {
    barbarian: {
      name: 'Barbarian',
      die: 12,
      saves: [
        'str',
        'con'
      ],
      skills: [
        'animalHandling',
        'athletics',
        'intimidation',
        'nature',
        'perception',
        'survival'
      ],
      count: 2,
      profs: [
        'Light armor',
        'Medium armor',
        'Shields',
        'Simple weapons',
        'Martial weapons'
      ]
    },
    bard: {
      name: 'Bard',
      die: 8,
      saves: [
        'dex',
        'cha'
      ],
      skills: 'any',
      count: 3,
      caster: 'full',
      ability: 'cha',
      profs: [
        'Light armor',
        'Simple weapons',
        'Hand crossbows',
        'Longswords',
        'Rapiers',
        'Shortswords',
        'Choose three musical instruments'
      ]
    },
    cleric: {
      name: 'Cleric',
      die: 8,
      saves: [
        'wis',
        'cha'
      ],
      skills: [
        'history',
        'insight',
        'medicine',
        'persuasion',
        'religion'
      ],
      count: 2,
      caster: 'full',
      ability: 'wis',
      profs: [
        'Light armor',
        'Medium armor',
        'Shields',
        'Simple weapons'
      ]
    },
    druid: {
      name: 'Druid',
      die: 8,
      saves: [
        'int',
        'wis'
      ],
      skills: [
        'arcana',
        'animalHandling',
        'insight',
        'medicine',
        'nature',
        'perception',
        'religion',
        'survival'
      ],
      count: 2,
      caster: 'full',
      ability: 'wis',
      profs: [
        'Light armor',
        'Medium armor',
        'Shields (druids do not wear metal armor or use metal shields)',
        'Clubs',
        'Daggers',
        'Darts',
        'Javelins',
        'Maces',
        'Quarterstaffs',
        'Scimitars',
        'Sickles',
        'Slings',
        'Spears',
        'Herbalism kit'
      ]
    },
    fighter: {
      name: 'Fighter',
      die: 10,
      saves: [
        'str',
        'con'
      ],
      skills: [
        'acrobatics',
        'animalHandling',
        'athletics',
        'history',
        'insight',
        'intimidation',
        'perception',
        'survival'
      ],
      count: 2,
      profs: [
        'All armor',
        'Shields',
        'Simple weapons',
        'Martial weapons'
      ]
    },
    monk: {
      name: 'Monk',
      die: 8,
      saves: [
        'str',
        'dex'
      ],
      skills: [
        'acrobatics',
        'athletics',
        'history',
        'insight',
        'religion',
        'stealth'
      ],
      count: 2,
      profs: [
        'Simple weapons',
        'Shortswords',
        'Choose one artisan tool or musical instrument'
      ]
    },
    paladin: {
      name: 'Paladin',
      die: 10,
      saves: [
        'wis',
        'cha'
      ],
      skills: [
        'athletics',
        'insight',
        'intimidation',
        'medicine',
        'persuasion',
        'religion'
      ],
      count: 2,
      caster: 'half',
      ability: 'cha',
      profs: [
        'All armor',
        'Shields',
        'Simple weapons',
        'Martial weapons'
      ]
    },
    ranger: {
      name: 'Ranger',
      die: 10,
      saves: [
        'str',
        'dex'
      ],
      skills: [
        'animalHandling',
        'athletics',
        'insight',
        'investigation',
        'nature',
        'perception',
        'stealth',
        'survival'
      ],
      count: 3,
      caster: 'half',
      ability: 'wis',
      profs: [
        'Light armor',
        'Medium armor',
        'Shields',
        'Simple weapons',
        'Martial weapons'
      ]
    },
    rogue: {
      name: 'Rogue',
      die: 8,
      saves: [
        'dex',
        'int'
      ],
      skills: [
        'acrobatics',
        'athletics',
        'deception',
        'insight',
        'intimidation',
        'investigation',
        'perception',
        'performance',
        'persuasion',
        'sleightOfHand',
        'stealth'
      ],
      count: 4,
      profs: [
        'Light armor',
        'Simple weapons',
        'Hand crossbows',
        'Longswords',
        'Rapiers',
        'Shortswords',
        'Thieves\u2019 tools'
      ]
    },
    sorcerer: {
      name: 'Sorcerer',
      die: 6,
      saves: [
        'con',
        'cha'
      ],
      skills: [
        'arcana',
        'deception',
        'insight',
        'intimidation',
        'persuasion',
        'religion'
      ],
      count: 2,
      caster: 'full',
      ability: 'cha',
      profs: [
        'Daggers',
        'Darts',
        'Slings',
        'Quarterstaffs',
        'Light crossbows'
      ]
    },
    warlock: {
      name: 'Warlock',
      die: 8,
      saves: [
        'wis',
        'cha'
      ],
      skills: [
        'arcana',
        'deception',
        'history',
        'intimidation',
        'investigation',
        'nature',
        'religion'
      ],
      count: 2,
      caster: 'pact',
      ability: 'cha',
      profs: [
        'Light armor',
        'Simple weapons'
      ]
    },
    wizard: {
      name: 'Wizard',
      die: 6,
      saves: [
        'int',
        'wis'
      ],
      skills: [
        'arcana',
        'history',
        'insight',
        'investigation',
        'medicine',
        'religion'
      ],
      count: 2,
      caster: 'full',
      ability: 'int',
      profs: [
        'Daggers',
        'Darts',
        'Slings',
        'Quarterstaffs',
        'Light crossbows'
      ]
    }
  };
  const dragons = {
    black: [
      'Acid',
      '5 \xD7 30 ft line',
      'dex'
    ],
    blue: [
      'Lightning',
      '5 \xD7 30 ft line',
      'dex'
    ],
    brass: [
      'Fire',
      '5 \xD7 30 ft line',
      'dex'
    ],
    bronze: [
      'Lightning',
      '5 \xD7 30 ft line',
      'dex'
    ],
    copper: [
      'Acid',
      '5 \xD7 30 ft line',
      'dex'
    ],
    gold: [
      'Fire',
      '15 ft cone',
      'dex'
    ],
    green: [
      'Poison',
      '15 ft cone',
      'con'
    ],
    red: [
      'Fire',
      '15 ft cone',
      'dex'
    ],
    silver: [
      'Cold',
      '15 ft cone',
      'con'
    ],
    white: [
      'Cold',
      '15 ft cone',
      'con'
    ]
  };
  const languages = [
    'Abyssal',
    'Celestial',
    'Deep Speech',
    'Draconic',
    'Dwarvish',
    'Elvish',
    'Giant',
    'Gnomish',
    'Goblin',
    'Halfling',
    'Infernal',
    'Orc',
    'Primordial',
    'Sylvan',
    'Undercommon',
    'Aarakocra',
    'Aquan',
    'Auran',
    'Gith',
    'Grung',
    'Ignan',
    'Leonin',
    'Loxodon',
    'Quori',
    'Terran',
    'Vedalken'
  ];
  const cantrips = [
    'Acid Splash',
    'Chill Touch',
    'Dancing Lights',
    'Light',
    'Fire Bolt',
    'Light',
    'Mage Hand',
    'Mending',
    'Message',
    'Minor Illusion',
    'Poison Spray',
    'Prestidigitation',
    'Ray of Frost',
    'Shocking Grasp',
    'True Strike'
  ];
  const fullSlots = [
    [2],
    [3],
    [
      4,
      2
    ],
    [
      4,
      3
    ],
    [
      4,
      3,
      2
    ],
    [
      4,
      3,
      3
    ],
    [
      4,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      2
    ],
    [
      4,
      3,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2,
      1,
      1,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      3,
      1,
      1,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      3,
      2,
      1,
      1,
      1
    ],
    [
      4,
      3,
      3,
      3,
      3,
      2,
      2,
      1,
      1
    ]
  ];
  const halfSlots = [
    [],
    [2],
    [3],
    [3],
    [
      4,
      2
    ],
    [
      4,
      2
    ],
    [
      4,
      3
    ],
    [
      4,
      3
    ],
    [
      4,
      3,
      2
    ],
    [
      4,
      3,
      2
    ],
    [
      4,
      3,
      3
    ],
    [
      4,
      3,
      3
    ],
    [
      4,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      2
    ],
    [
      4,
      3,
      3,
      2
    ],
    [
      4,
      3,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      3,
      1
    ],
    [
      4,
      3,
      3,
      3,
      2
    ],
    [
      4,
      3,
      3,
      3,
      2
    ]
  ];
  const normalize = b => {
    b = b && typeof b === 'object' ? b : {};
    return {
      edition: b.edition === '2024' ? '2024' : '2014',
      race: own(races, b.race) ? b.race : '',
      classId: classes[b.classId] ? b.classId : '',
      background: b.background === 'acolyte' || own(Modern.backgrounds, b.background) ? b.background : '',
      backgroundPattern: b.backgroundPattern === '111' ? '111' : '21',
      backgroundAbilities: Array.from({ length: 3 }, (_, i) => abilityKeys.includes(b.backgroundAbilities?.[i]) ? b.backgroundAbilities[i] : ''),
      standardLanguages: Array.from({ length: 2 }, (_, i) => Modern.standardLanguages.includes(b.standardLanguages?.[i]) ? b.standardLanguages[i] : ''),
      humanOriginFeat: Modern.originFeats.includes(b.humanOriginFeat) ? b.humanOriginFeat : '',
      backgroundFeat: Modern.originFeats.includes(b.backgroundFeat) ? b.backgroundFeat : '',
      humanFeatChoices: Array.from({ length: 3 }, (_, i) => String(b.humanFeatChoices?.[i] || '').slice(0, 120)),
      backgroundFeatChoices: Array.from({ length: 3 }, (_, i) => String(b.backgroundFeatChoices?.[i] || '').slice(0, 120)),
      scoreMode: b.scoreMode === 'base' ? 'base' : 'total',
      autoSlots: !!b.autoSlots,
      asiPattern: b.asiPattern === '111' ? '111' : '21',
      flexibleChoices: Array.from({ length: 3 }, (_, i) => abilityKeys.includes(b.flexibleChoices?.[i]) ? b.flexibleChoices[i] : ''),
      raceSkills: Array.from({ length: 2 }, (_, i) => String(b.raceSkills?.[i] || '').slice(0, 40)),
      raceTools: Array.from({ length: 2 }, (_, i) => String(b.raceTools?.[i] || '').slice(0, 100)),
      raceSize: [
        'Small',
        'Medium'
      ].includes(b.raceSize) ? b.raceSize : '',
      raceAbility: [
        'int',
        'wis',
        'cha'
      ].includes(b.raceAbility) ? b.raceAbility : '',
      raceFeature: String(b.raceFeature || '').slice(0, 40),
      raceFeature2: String(b.raceFeature2 || '').slice(0, 40),
      raceCantrip: String(b.raceCantrip || '').slice(0, 100),
      raceFeat: String(b.raceFeat || '').slice(0, 200),
      dragon: dragons[b.dragon] ? b.dragon : 'red',
      abilityChoices: [
        String(b.abilityChoices?.[0] || ''),
        String(b.abilityChoices?.[1] || '')
      ],
      skillChoices: [
        String(b.skillChoices?.[0] || ''),
        String(b.skillChoices?.[1] || '')
      ],
      classSkills: Array.from({ length: 4 }, (_, i) => String(b.classSkills?.[i] || '')),
      extraLanguage: String(b.extraLanguage || '').slice(0, 100),
      backgroundLanguages: [
        String(b.backgroundLanguages?.[0] || ''),
        String(b.backgroundLanguages?.[1] || '')
      ],
      cantrip: cantrips.includes(b.cantrip) ? b.cantrip : '',
      tool: [
        'Smith\u2019s tools',
        'Brewer\u2019s supplies',
        'Mason\u2019s tools'
      ].includes(b.tool) ? b.tool : ''
    };
  };
  function evaluate(data, level, skillNames = []) {
    const b = normalize(data.build), lvl = Math.max(1, Math.min(20, Math.trunc(Number(level)) || 1)), r = profile(b, lvl), c = b.edition === '2024' ? Modern.classProfile(b.classId, classes[b.classId]) : classes[b.classId];
    const result = {
      race: r,
      classData: c,
      asi: { ...r?.asi || {} },
      traits: [...r?.traits || []],
      languages: [...r?.languages || []],
      proficiencies: [
        ...r?.proficiencies || [],
        ...c?.profs || []
      ],
      skills: [...r?.skills || []],
      saves: c?.saves || [],
      resistances: [...r?.resistances || []],
      speed: r?.speed ?? data.speed,
      size: r?.sizeChoice ? b.raceSize || 'Choose size' : lvl >= 5 && r?.sizeAt5 ? r.sizeAt5 : r?.size || '\u2014',
      fly: r?.fly || 0,
      swim: r?.swim || 0,
      climb: r?.climb || 0,
      immunities: [...r?.immunities || []],
      naturalArmor: r?.naturalArmor || null,
      initiativeBonus: r?.initiativePB ? Math.ceil(lvl / 4) + 1 : 0,
      darkvision: r?.darkvision || 0,
      hpBonus: b.race === 'hill-dwarf' ? lvl : (r?.hpPerLevel || 0) * lvl,
      innate: [],
      warnings: [],
      slotMax: null,
      pact: null
    };
    if (r) {
      const bonuses = b.edition === '2024' ? [] : r.flexible ? b.asiPattern === '111' ? [
        1,
        1,
        1
      ] : [
        2,
        1
      ] : r.choiceBonuses || [];
      const used = new Set();
      bonuses.forEach((n, i) => {
        const key = b.flexibleChoices[i];
        if (!abilityKeys.includes(key) || used.has(key) || r.excludeAbilities?.includes(key)) {
          result.warnings.push('Choose distinct permitted abilities for each racial bonus.');
          return;
        }
        used.add(key);
        result.asi[key] = (result.asi[key] || 0) + n;
      });
      const allowedSkills = r.skillPool === 'any' ? skillNames : r.skillPool || [];
      const selectedSkills = new Set();
      for (const key of b.raceSkills.slice(0, r.skillCount || 0)) {
        if (!allowedSkills.includes(key) || selectedSkills.has(key) || result.skills.includes(key))
          result.warnings.push('Choose different racial skills from the available list.');
        else {
          selectedSkills.add(key);
          result.skills.push(key);
        }
      }
      const allowedTools = r.instrumentOnly ? instruments : r.weaponTool ? [
        ...tools,
        ...weapons
      ] : tools;
      const selectedTools = new Set();
      for (const key of b.raceTools.slice(0, r.toolCount || 0)) {
        if (!allowedTools.includes(key) || selectedTools.has(key))
          result.warnings.push('Choose distinct permitted racial tools or weapons.');
        else {
          selectedTools.add(key);
          result.proficiencies.push(key);
        }
      }
      if (r.sizeChoice && !b.raceSize)
        result.warnings.push('Choose Small or Medium for this race.');
      const base = races[b.race];
      if (base.optionChoices && lvl >= (base.optionLevel || 1) && !own(base.optionChoices, b.raceFeature))
        result.warnings.push('Choose your racial feature.');
      if (base.secondOptionChoices && lvl >= (base.secondOptionLevel || 1) && (!own(base.secondOptionChoices, b.raceFeature2) || b.raceFeature2 === b.raceFeature))
        result.warnings.push('Choose a different second racial feature.');
      if (r.spellChoice || r.spells?.some(s => s.ability === 'choice') || r.cantripPool) {
        if (!b.raceAbility)
          result.warnings.push('Choose Intelligence, Wisdom or Charisma for racial magic / feature DC.');
        result.raceAbility = b.raceAbility;
      }
      for (const s of r.spells || [])
        if (lvl >= s.level)
          result.innate.push(`${ s.name } — ${ s.usage }; ${ (s.ability === 'choice' ? b.raceAbility || 'choose ability' : s.ability).toUpperCase() }`);
      if (r.cantripPool) {
        const pool = r.cantripPool === 'sorcerer' ? [
          ...cantrips,
          'Blade Ward',
          'Friends'
        ] : r.cantripPool;
        const selectedCantrip = pool.includes(b.raceCantrip) ? b.raceCantrip : r.defaultCantrip;
        if (selectedCantrip)
          result.innate.push(`${ selectedCantrip } — at will; ${ b.raceAbility.toUpperCase() || 'choose ability' }`);
        else
          result.warnings.push('Choose a racial cantrip.');
      }
      for (const [min, text] of r.levelTraits || [])
        if (lvl >= min)
          result.traits.push(text);
      if (r.feat) {
        if (b.raceFeat)
          result.traits.push(`Chosen feat (effects entered manually): ${ b.raceFeat }`);
        else
          result.warnings.push('Record your racial feat; apply its effects manually.');
      }
    }
    if (b.race === 'half-elf') {
      const used = new Set();
      for (const key of b.edition === '2014' ? b.abilityChoices : []) {
        if (![
            'str',
            'dex',
            'con',
            'int',
            'wis'
          ].includes(key) || used.has(key)) {
          result.warnings.push('Choose two different Half-Elf abilities other than Charisma.');
          continue;
        }
        used.add(key);
        result.asi[key] = (result.asi[key] || 0) + 1;
      }
      const choices = new Set();
      for (const key of b.skillChoices) {
        if (!skillNames.includes(key) || choices.has(key)) {
          result.warnings.push('Choose two different Half-Elf skills.');
          continue;
        }
        choices.add(key);
        result.skills.push(key);
      }
    }
    if ([
        'human',
        'half-elf',
        'high-elf'
      ].includes(b.race) || r?.extraLanguage) {
      if (b.extraLanguage && (r?.languagePool || languages).includes(b.extraLanguage) && !result.languages.includes(b.extraLanguage))
        result.languages.push(b.extraLanguage);
      else
        result.warnings.push('Choose one additional race language.');
    }
    if ([
        'hill-dwarf',
        'mountain-dwarf'
      ].includes(b.race)) {
      if (b.tool)
        result.proficiencies.push(b.tool);
      else
        result.warnings.push('Choose your Dwarven tool proficiency.');
    }
    if (b.race === 'high-elf') {
      if (b.cantrip)
        result.innate.push(`${ b.cantrip } — at will; Intelligence`);
      else
        result.warnings.push('Choose a wizard cantrip for your High Elf.');
    }
    if (b.race === 'dragonborn-2024' && r) {
      result.resistances.push(dragons[b.dragon][0]);
      result.breath = {
        type: dragons[b.dragon][0],
        area: '15 ft cone or 5 \xD7 30 ft line (choose each use)',
        save: 'dex',
        dice: lvl >= 17 ? 4 : lvl >= 11 ? 3 : lvl >= 5 ? 2 : 1,
        die: 10,
        usage: 'PB uses per long rest; replaces one attack'
      };
    }
    if (b.race === 'dragonborn') {
      const [type, area, save] = dragons[b.dragon];
      result.resistances.push(type);
      result.breath = {
        type,
        area,
        save,
        dice: lvl >= 16 ? 5 : lvl >= 11 ? 4 : lvl >= 6 ? 3 : 2
      };
    }
    if (b.race === 'tiefling') {
      result.innate.push('Thaumaturgy \u2014 at will; Charisma');
      if (lvl >= 3)
        result.innate.push('Hellish Rebuke \u2014 2nd-level casting, once per long rest; Charisma');
      if (lvl >= 5)
        result.innate.push('Darkness \u2014 once per long rest; Charisma');
    }
    if (c) {
      const available = c.skills === 'any' ? skillNames : c.skills, chosen = new Set();
      for (const key of b.classSkills.slice(0, c.count)) {
        if (!available.includes(key) || chosen.has(key)) {
          result.warnings.push(`Choose ${ c.count } different ${ c.name } class skills.`);
          continue;
        }
        chosen.add(key);
        result.skills.push(key);
      }
      if (b.autoSlots) {
        result.slotMax = Array(9).fill(0);
        if (c.caster === 'full' || c.caster === 'half') {
          const row = (c.caster === 'full' ? fullSlots : halfSlots)[lvl - 1];
          row.forEach((n, i) => result.slotMax[i] = n);
          if (b.edition === '2024' && c.caster === 'half' && lvl === 1)
            result.slotMax[0] = 2;
        }
        if (c.caster === 'pact') {
          const slotLevel = lvl >= 9 ? 5 : lvl >= 7 ? 4 : lvl >= 5 ? 3 : lvl >= 3 ? 2 : 1, count = lvl >= 17 ? 4 : lvl >= 11 ? 3 : lvl >= 2 ? 2 : 1;
          result.slotMax[slotLevel - 1] = count;
          result.pact = {
            level: slotLevel,
            count
          };
        }
      }
    }
    if (b.background === 'acolyte' && b.edition === '2014') {
      result.skills.push('insight', 'religion');
      result.traits.push('Shelter of the Faithful: receive support from temples of your faith; discuss available aid with your DM.');
      for (const lang of b.backgroundLanguages) {
        if (lang && !result.languages.includes(lang))
          result.languages.push(lang);
        else
          result.warnings.push('Choose two different additional background languages.');
      }
    }
    if (b.edition === '2014' && races[b.race]?.edition === '2024')
      result.warnings.push('This species requires 2024 rules. Change rules version or select a 2014 race.');
    if (b.edition === '2014' && Modern.backgrounds[b.background])
      result.warnings.push('This background requires 2024 rules.');
    Modern.apply(result, b, data, lvl, skillNames, tools);
    result.skills = [...new Set(result.skills)];
    result.languages = [...new Set(result.languages)];
    result.warnings = [...new Set(result.warnings)];
    return result;
  }
  return {
    races,
    modern: Modern,
    profile,
    tools,
    weapons,
    instruments,
    classes,
    dragons,
    languages,
    cantrips,
    normalize,
    evaluate
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterRules;
