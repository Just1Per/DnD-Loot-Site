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
    'Undercommon'
  ];
  const cantrips = [
    'Acid Splash',
    'Chill Touch',
    'Dancing Lights',
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
      edition: '2014',
      race: races[b.race] ? b.race : '',
      classId: classes[b.classId] ? b.classId : '',
      background: b.background === 'acolyte' ? 'acolyte' : '',
      scoreMode: b.scoreMode === 'base' ? 'base' : 'total',
      autoSlots: !!b.autoSlots,
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
    const b = normalize(data.build), r = races[b.race], c = classes[b.classId], lvl = Math.max(1, Math.min(20, Math.trunc(Number(level)) || 1));
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
      size: r?.size || '\u2014',
      darkvision: r?.darkvision || 0,
      hpBonus: b.race === 'hill-dwarf' ? lvl : 0,
      innate: [],
      warnings: [],
      slotMax: null,
      pact: null
    };
    if (b.race === 'half-elf') {
      const used = new Set();
      for (const key of b.abilityChoices) {
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
      ].includes(b.race)) {
      if (b.extraLanguage && !result.languages.includes(b.extraLanguage))
        result.languages.push(b.extraLanguage);
      else
        result.warnings.push('Choose one additional race language.');
    }
    if (b.race === 'hill-dwarf') {
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
    if (b.background === 'acolyte') {
      result.skills.push('insight', 'religion');
      result.traits.push('Shelter of the Faithful: receive support from temples of your faith; discuss available aid with your DM.');
      for (const lang of b.backgroundLanguages) {
        if (lang && !result.languages.includes(lang))
          result.languages.push(lang);
        else
          result.warnings.push('Choose two different additional background languages.');
      }
    }
    result.skills = [...new Set(result.skills)];
    result.languages = [...new Set(result.languages)];
    result.warnings = [...new Set(result.warnings)];
    return result;
  }
  return {
    races,
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
