/* Structured game facts and original short reminders. Source/version on every entry.
 * Supplement entries are not represented as SRD-licensed book text. */
var CharacterRaceCatalog = (() => {
  const sources = {
    PHB: 'Player\'s Handbook (2014)',
    MPMM: 'Monsters of the Multiverse (2022)',
    SCC: 'Strixhaven: A Curriculum of Chaos',
    LR: 'Locathah Rising',
    OGA: 'One Grung Above',
    AI: 'Acquisitions Incorporated',
    ERLW: 'Eberron: Rising from the Last War',
    VRGR: 'Van Richten\u2019s Guide to Ravenloft',
    GGR: 'Guildmasters\u2019 Guide to Ravnica',
    AAG: 'Astral Adventurer\u2019s Guide',
    MOT: 'Mythic Odysseys of Theros',
    DSotDQ: 'Dragonlance: Shadow of the Dragon Queen',
    TCE: 'Tasha\u2019s Cauldron of Everything'
  };
  const nature = [
    'animalHandling',
    'medicine',
    'nature',
    'perception',
    'stealth',
    'survival'
  ];
  const mental = 'Spell saves: advantage on INT, WIS and CHA saves.';
  const charm = 'Charm: advantage on saves to prevent or end the condition.';
  const powerful = 'Carrying: count as one size larger for carrying, pushing, dragging and lifting.';
  const flight = 'Flight matches walking speed; unavailable in medium or heavy armor.';
  const trance = 'No sleep; immune to magical sleep. A conscious 4-hour trance completes a long rest. Choose two temporary weapon/tool proficiencies after each trance; record them manually.';
  const spell = (level, name, ability = 'choice', usage = 'once per long rest; may also use an appropriate spell slot') => ({
    level,
    name,
    ability,
    usage
  });
  const cantrip = (name, ability = 'choice') => spell(1, name, ability, 'at will');
  function extend(races) {
    for (const r of Object.values(races))
      Object.assign(r, {
        source: 'SRD 5.1 / 2014',
        category: 'Common',
        creatureType: 'Humanoid'
      });
    const add = (id, name, extra = {}, book = 'MPMM', category = 'Exotic') => {
      races[id] = {
        name,
        asi: {},
        flexible: true,
        speed: 30,
        size: 'Medium',
        languages: ['Common'],
        extraLanguage: true,
        traits: [],
        creatureType: 'Humanoid',
        source: sources[book],
        book,
        category,
        url: 'https://dnd5e.wikidot.com/lineage:' + id.replace(/-mpmm$/, ''),
        ...extra,
        name
      };
    };
    // PHB alternatives preserve the original nine IDs and their existing saved data.
    add('mountain-dwarf', 'Dwarf \u2014 Mountain dwarf', {
      ...races['hill-dwarf'],
      asi: {
        str: 2,
        con: 2
      },
      flexible: false,
      extraLanguage: false,
      traits: races['hill-dwarf'].traits.filter(t => !t.startsWith('Dwarven Toughness')),
      proficiencies: [
        ...races['hill-dwarf'].proficiencies,
        'Light armor',
        'Medium armor'
      ],
      url: 'https://dnd5e.wikidot.com/lineage:dwarf',
      source: sources.PHB
    }, 'PHB', 'Common');
    add('wood-elf', 'Elf \u2014 Wood elf', {
      ...races['high-elf'],
      asi: {
        dex: 2,
        wis: 1
      },
      flexible: false,
      extraLanguage: false,
      speed: 35,
      traits: [
        ...races['high-elf'].traits.slice(0, 3),
        'Natural cover: light obscurity from foliage or weather can suffice for hiding.'
      ],
      url: 'https://dnd5e.wikidot.com/lineage:elf',
      source: sources.PHB
    }, 'PHB', 'Common');
    add('drow', 'Elf \u2014 Drow', {
      ...races['high-elf'],
      asi: {
        dex: 2,
        cha: 1
      },
      flexible: false,
      extraLanguage: false,
      darkvision: 120,
      proficiencies: [
        'Rapier',
        'Shortsword',
        'Hand crossbow'
      ],
      traits: [
        ...races['high-elf'].traits.slice(0, 3),
        'Direct sunlight: disadvantage on attacks and sight-based Perception involving you or your target.'
      ],
      spells: [
        cantrip('Dancing Lights', 'cha'),
        spell(3, 'Faerie Fire', 'cha', 'once per long rest'),
        spell(5, 'Darkness', 'cha', 'once per long rest')
      ],
      url: 'https://dnd5e.wikidot.com/lineage:elf',
      source: sources.PHB
    }, 'PHB', 'Common');
    add('forest-gnome', 'Gnome \u2014 Forest gnome', {
      ...races['rock-gnome'],
      asi: {
        int: 2,
        dex: 1
      },
      flexible: false,
      extraLanguage: false,
      proficiencies: [],
      traits: [
        races['rock-gnome'].traits[0],
        'Exchange simple ideas with Small or Tiny beasts using sounds and gestures.'
      ],
      spells: [cantrip('Minor Illusion', 'int')],
      url: 'https://dnd5e.wikidot.com/lineage:gnome',
      source: sources.PHB
    }, 'PHB', 'Common');
    add('stout-halfling', 'Halfling \u2014 Stout', {
      ...races['lightfoot-halfling'],
      asi: {
        dex: 2,
        con: 1
      },
      flexible: false,
      extraLanguage: false,
      resistances: ['Poison'],
      traits: [
        ...races['lightfoot-halfling'].traits.slice(0, 3),
        'Poison saves have advantage.'
      ],
      url: 'https://dnd5e.wikidot.com/lineage:halfling',
      source: sources.PHB
    }, 'PHB', 'Common');
    add('variant-human', 'Human \u2014 Variant', {
      flexible: false,
      choiceBonuses: [
        1,
        1
      ],
      skillCount: 1,
      skillPool: 'any',
      feat: true,
      traits: ['One feat: enter the choice and its effects manually; DM approval required.'],
      url: 'https://dnd5e.wikidot.com/lineage:human'
    }, 'PHB', 'Common');
    add('aarakocra-mpmm', 'Aarakocra', {
      fly: 30,
      traits: [
        flight,
        'Talons: unarmed slashing damage 1d6 + STR.'
      ],
      spells: [spell(3, 'Gust of Wind (no material component)')]
    });
    add('aasimar-mpmm', 'Aasimar', {
      sizeChoice: true,
      darkvision: 60,
      resistances: [
        'Necrotic',
        'Radiant'
      ],
      traits: ['Healing: action, touch, restore PB d4 HP; once per long rest.'],
      spells: [cantrip('Light', 'cha')],
      optionLevel: 3,
      optionChoices: {
        shroud: {
          name: 'Necrotic Shroud',
          traits: ['Revelation: bonus action, 1 minute, once per long rest. Non-allies within 10 ft who see you make CHA save (8 + PB + CHA) or fear you until your next turn ends. Once each turn, add PB necrotic damage to one attack/spell target.']
        },
        consumption: {
          name: 'Radiant Consumption',
          traits: ['Revelation: bonus action, 1 minute, once per long rest. Emit light; creatures within 10 ft take PB radiant at the end of your turns. Once each turn, add PB radiant damage to one attack/spell target.']
        },
        soul: {
          name: 'Radiant Soul',
          traits: ['Revelation: bonus action, 1 minute, once per long rest. Fly at walking speed; once each turn, add PB radiant damage to one attack/spell target.']
        }
      }
    });
    add('changeling-mpmm', 'Changeling', {
      creatureType: 'Fey',
      sizeChoice: true,
      skillCount: 2,
      skillPool: [
        'deception',
        'insight',
        'intimidation',
        'performance',
        'persuasion'
      ],
      traits: ['Shape: action to change appearance/voice, including Small or Medium. Statistics and equipment stay unchanged. Copy only seen individuals with a compatible limb arrangement; persists until reverted or death.']
    });
    add('deep-gnome-mpmm', 'Deep Gnome', {
      size: 'Small',
      darkvision: 120,
      traits: [
        mental,
        'Stealth: choose advantage PB times per long rest.'
      ],
      spells: [
        spell(3, 'Disguise Self'),
        spell(5, 'Nondetection (no material component)')
      ]
    });
    add('duergar-mpmm', 'Duergar', {
      darkvision: 120,
      resistances: ['Poison'],
      traits: ['Saves against poison, charm and stun have advantage.'],
      spells: [
        spell(3, 'Enlarge/Reduce (self; no material component)'),
        spell(5, 'Invisibility (self; no material component)')
      ]
    });
    add('eladrin-mpmm', 'Eladrin', {
      darkvision: 60,
      skills: ['perception'],
      spellChoice: true,
      traits: [
        charm,
        trance,
        'Teleport: bonus action, 30 ft to a visible empty space; PB uses per long rest. Seasonal additions start at level 3.'
      ],
      optionLevel: 3,
      optionChoices: {
        autumn: {
          name: 'Autumn',
          traits: ['After teleport: up to two visible creatures within 10 ft make WIS saves (racial DC) or are charmed for 1 minute, ending if your group damages them.']
        },
        winter: {
          name: 'Winter',
          traits: ['Before teleport: one visible creature within 5 ft makes a WIS save (racial DC) or fears you until your next turn ends.']
        },
        spring: {
          name: 'Spring',
          traits: ['Teleport a willing creature you touch within 5 ft instead of yourself.']
        },
        summer: {
          name: 'Summer',
          traits: ['After teleport: chosen visible creatures within 5 ft take PB fire damage.']
        }
      }
    });
    add('fairy-mpmm', 'Fairy', {
      creatureType: 'Fey',
      size: 'Small',
      fly: 30,
      traits: [flight],
      spells: [
        cantrip('Druidcraft'),
        spell(3, 'Faerie Fire'),
        spell(5, 'Enlarge/Reduce')
      ]
    });
    add('firbolg-mpmm', 'Firbolg', {
      traits: [
        powerful,
        'Concealment: bonus action invisibility until your next turn starts; ends on attacking, dealing damage or forcing a save. PB uses per long rest.',
        'Beasts and plants understand your speech; influence them with advantage on CHA checks.'
      ],
      spells: [
        spell(1, 'Detect Magic'),
        spell(1, 'Disguise Self (height may differ by up to 3 ft)')
      ]
    });
    add('genasi-air-mpmm', 'Genasi \u2014 Air', {
      speed: 35,
      sizeChoice: true,
      darkvision: 60,
      resistances: ['Lightning'],
      traits: ['Hold your breath indefinitely unless incapacitated.'],
      spells: [
        cantrip('Shocking Grasp'),
        spell(3, 'Feather Fall (no material component)'),
        spell(5, 'Levitate (no material component)')
      ]
    });
    add('genasi-earth-mpmm', 'Genasi \u2014 Earth', {
      sizeChoice: true,
      darkvision: 60,
      traits: [
        'Ground or floor difficult terrain costs no extra walking movement.',
        'Blade Ward may also use a bonus action PB times per long rest.'
      ],
      spells: [
        cantrip('Blade Ward'),
        spell(5, 'Pass Without Trace (no material component)')
      ]
    });
    add('genasi-fire-mpmm', 'Genasi \u2014 Fire', {
      sizeChoice: true,
      darkvision: 60,
      resistances: ['Fire'],
      spells: [
        cantrip('Produce Flame'),
        spell(3, 'Burning Hands'),
        spell(5, 'Flame Blade (no material component)')
      ]
    });
    add('genasi-water-mpmm', 'Genasi \u2014 Water', {
      sizeChoice: true,
      darkvision: 60,
      swim: 30,
      resistances: ['Acid'],
      traits: ['Breathe both air and water.'],
      spells: [
        cantrip('Acid Splash'),
        spell(3, 'Create or Destroy Water'),
        spell(5, 'Water Walk (no material component)')
      ]
    });
    add('githyanki-mpmm', 'Githyanki', {
      resistances: ['Psychic'],
      skillCount: 1,
      skillPool: 'any',
      toolCount: 1,
      weaponTool: true,
      traits: [
        'After each long rest, choose one temporary skill and one weapon/tool proficiency. Update the selections here.',
        'Racial psionics require no components; the summoned hand is invisible.'
      ],
      spells: [
        cantrip('Mage Hand'),
        spell(3, 'Jump'),
        spell(5, 'Misty Step')
      ]
    });
    add('githzerai-mpmm', 'Githzerai', {
      resistances: ['Psychic'],
      traits: [
        'Saves against charm and fear have advantage.',
        'Racial psionics require no components; the summoned hand is invisible.'
      ],
      spells: [
        cantrip('Mage Hand'),
        spell(3, 'Shield'),
        spell(5, 'Detect Thoughts')
      ]
    });
    add('goliath-mpmm', 'Goliath', {
      skills: ['athletics'],
      resistances: ['Cold'],
      traits: [
        powerful,
        'Adapted to high altitude.',
        'When damaged: reaction to reduce damage by 1d12 + CON; PB uses per long rest.'
      ]
    });
    add('harengon-mpmm', 'Harengon', {
      sizeChoice: true,
      skills: ['perception'],
      initiativePB: true,
      traits: [
        'Initiative includes proficiency bonus.',
        'Failed DEX save: reaction to add 1d4, unless prone or speed is zero.',
        'Hop: bonus action jump 5 \xD7 PB ft without opportunity attacks; requires positive speed. PB uses per long rest.'
      ]
    });
    add('kenku-mpmm', 'Kenku', {
      sizeChoice: true,
      skillCount: 2,
      skillPool: 'any',
      traits: [
        'Copying writing or craftwork: advantage on duplication checks.',
        'Before rolling a proficient skill check, choose advantage; PB uses per long rest.',
        'Imitate heard sounds and voices. Insight against 8 + PB + CHA detects imitation.'
      ]
    });
    add('locathah', 'Locathah', {
      flexible: false,
      extraLanguage: false,
      asi: {
        str: 2,
        dex: 1
      },
      languages: [
        'Common',
        'Aquan'
      ],
      swim: 30,
      skills: [
        'athletics',
        'perception'
      ],
      naturalArmor: {
        base: 12,
        ability: 'dex'
      },
      traits: [
        'Saves against charm, fear, paralysis, poison, stun and sleep have advantage.',
        'Breathe air/water, but submerge at least every 4 hours or begin suffocating.'
      ]
    }, 'LR');
    add('owlin', 'Owlin', {
      sizeChoice: true,
      darkvision: 120,
      fly: 30,
      skills: ['stealth'],
      traits: [flight]
    }, 'SCC');
    add('satyr-mpmm', 'Satyr', {
      creatureType: 'Fey',
      speed: 35,
      skills: [
        'performance',
        'persuasion'
      ],
      toolCount: 1,
      instrumentOnly: true,
      traits: [
        'Ram: unarmed bludgeoning damage 1d6 + STR.',
        'Spell saves have advantage.',
        'Jumps gain 1d8 ft, including standing jumps; movement cost still applies.'
      ]
    });
    for (const [id, name, resistance] of [
        [
          'sea-elf',
          'Sea Elf',
          'Cold'
        ],
        [
          'shadar-kai',
          'Shadar-Kai',
          'Necrotic'
        ]
      ])
      add(id + '-mpmm', name, {
        darkvision: 60,
        skills: ['perception'],
        resistances: [resistance],
        traits: [
          charm,
          trance
        ]
      });
    Object.assign(races['sea-elf-mpmm'], {
      swim: 30,
      traits: [
        ...races['sea-elf-mpmm'].traits,
        'Breathe air/water; swimming beasts understand simple ideas you communicate.'
      ]
    });
    races['shadar-kai-mpmm'].traits.push('Teleport: bonus action, 30 ft to a visible empty space; PB uses per long rest.');
    races['shadar-kai-mpmm'].levelTraits = [[
        3,
        'After teleporting, all-damage resistance lasts until your next turn starts.'
      ]];
    add('tabaxi-mpmm', 'Tabaxi', {
      sizeChoice: true,
      darkvision: 60,
      climb: 30,
      skills: [
        'perception',
        'stealth'
      ],
      traits: [
        'Claws: unarmed slashing damage 1d6 + STR.',
        'On your turn, double speed until turn ends. Recharge by moving zero feet on a later turn.'
      ]
    });
    add('tortle-mpmm', 'Tortle', {
      sizeChoice: true,
      skillCount: 1,
      skillPool: nature,
      naturalArmor: { base: 17 },
      traits: [
        'Claws: unarmed slashing damage 1d6 + STR. Hold breath for 1 hour.',
        'Cannot wear armor; a shield can improve shell AC.',
        'Retreat into shell as an action: +4 AC and advantage on STR/CON saves. You are prone, speed 0, DEX saves have disadvantage, and reactions are unavailable; only a bonus action to emerge is possible.'
      ]
    });
    add('triton-mpmm', 'Triton', {
      darkvision: 60,
      swim: 30,
      resistances: ['Cold'],
      traits: [
        'Breathe air and water.',
        'Swimming beasts, elementals and monstrosities understand your simple messages.'
      ],
      spells: [
        spell(1, 'Fog Cloud'),
        spell(3, 'Gust of Wind'),
        spell(5, 'Water Walk')
      ]
    });
    add('verdan', 'Verdan', {
      flexible: false,
      asi: {
        cha: 2,
        con: 1
      },
      languages: [
        'Common',
        'Goblin'
      ],
      size: 'Small',
      sizeAt5: 'Medium',
      skills: ['persuasion'],
      traits: [
        'Short-rest Hit Dice showing 1 or 2 may be rerolled; keep the replacement.',
        'Communicate simple ideas telepathically with a visible creature within 30 ft that understands any language.',
        'WIS and CHA saves have advantage.'
      ]
    }, 'AI');
    const monstrous = (id, name, extra) => add(id + '-mpmm', name, extra, 'MPMM', 'Monstrous');
    monstrous('bugbear', 'Bugbear', {
      darkvision: 60,
      skills: ['stealth'],
      traits: [
        charm,
        powerful,
        'Melee reach increases 5 ft during your turn. Fit in Small spaces without squeezing.',
        'A hit against a creature that has not yet taken a turn this combat deals +2d6 damage.'
      ]
    });
    monstrous('centaur', 'Centaur', {
      creatureType: 'Fey',
      speed: 40,
      skillCount: 1,
      skillPool: [
        'animalHandling',
        'medicine',
        'nature',
        'survival'
      ],
      traits: [
        'Carrying, pushing and dragging use one larger size. Hand-and-foot climbing costs 5 ft per foot.',
        'Hooves: unarmed bludgeoning damage 1d6 + STR.',
        'Move 30 ft straight toward a target and hit it with a melee weapon on that turn: bonus action hoof attack.'
      ]
    });
    monstrous('goblin', 'Goblin', {
      size: 'Small',
      darkvision: 60,
      traits: [
        charm,
        'Bonus action: Hide or Disengage.',
        'Against a larger creature, add PB damage to an attack/spell; at most once per turn, PB uses per long rest.'
      ]
    });
    add('grung', 'Grung', {
      flexible: false,
      extraLanguage: false,
      asi: {
        dex: 2,
        con: 1
      },
      size: 'Small',
      speed: 25,
      climb: 25,
      languages: ['Grung'],
      skills: ['perception'],
      immunities: [
        'Poison damage',
        'Poisoned'
      ],
      traits: [
        'Breathe air and water.',
        'Skin contact: DC 12 CON or poisoned for 1 minute; repeat saves after contact ends. Piercing weapon poison: DC 12 CON or +2d4 poison damage.',
        'Standing jumps: 25 ft long or 15 ft high.',
        'Immerse for 1 hour daily or gain exhaustion; only immersion or magic removes this exhaustion.'
      ]
    }, 'OGA', 'Monstrous');
    monstrous('hobgoblin', 'Hobgoblin', {
      darkvision: 60,
      traits: [
        charm,
        'Bonus-action Help: PB uses per long rest.',
        'After a failed attack, check or save: add nearby visible allies within 30 ft (maximum +3); PB uses per long rest.'
      ],
      levelTraits: [[
          3,
          'Help may also grant both creatures 1d6 + PB temporary HP, +10 ft walking speed until your next turn, or let the ally\u2019s next hit hinder the target\u2019s next attack within 1 minute. Choose per use.'
        ]]
    });
    monstrous('kobold', 'Kobold', {
      size: 'Small',
      darkvision: 60,
      optionChoices: {
        craftiness: {
          name: 'Craftiness',
          skillCount: 1,
          skillPool: [
            'arcana',
            'investigation',
            'medicine',
            'sleightOfHand',
            'survival'
          ]
        },
        defiance: {
          name: 'Defiance',
          traits: ['Fear saves have advantage.']
        },
        sorcery: {
          name: 'Draconic Sorcery',
          cantripPool: 'sorcerer',
          spellChoice: true
        }
      },
      traits: ['Cry: bonus action; attacks by you and allies have advantage against enemies within 10 ft that heard it, until your next turn starts. PB uses per long rest.']
    });
    monstrous('lizardfolk', 'Lizardfolk', {
      swim: 30,
      skillCount: 2,
      skillPool: nature,
      naturalArmor: {
        base: 13,
        ability: 'dex'
      },
      traits: [
        'Hold breath 15 minutes. Bite: unarmed slashing damage 1d6 + STR.',
        'Hungry bite: bonus action attack; a hit grants PB temporary HP. PB uses per long rest.'
      ]
    });
    monstrous('minotaur', 'Minotaur', {
      traits: [
        'Horns: unarmed piercing damage 1d6 + STR.',
        'After Dashing and moving 20 ft: bonus-action horn attack.',
        'After a melee hit during the Attack action: bonus action push up to 10 ft; target within 5 ft and at most one size larger makes STR save (8 + PB + STR).',
        'Know north; navigation and tracking Survival checks have advantage.'
      ]
    });
    monstrous('orc', 'Orc', {
      darkvision: 60,
      traits: [
        powerful,
        'Bonus-action Dash grants PB temporary HP; PB uses per long rest.',
        'Once per long rest, falling to 0 HP without instant death can leave you at 1 HP instead.'
      ]
    });
    monstrous('shifter', 'Shifter', {
      darkvision: 60,
      skillCount: 1,
      skillPool: [
        'acrobatics',
        'athletics',
        'intimidation',
        'survival'
      ],
      traits: ['Shift: bonus action, 1 minute, grants 2 \xD7 PB temporary HP; PB uses per long rest.'],
      optionChoices: {
        beasthide: {
          name: 'Beasthide',
          traits: ['While shifted: +1 AC; shifting grants an additional 1d6 temporary HP.']
        },
        longtooth: {
          name: 'Longtooth',
          traits: ['On shifting and with later bonus actions while shifted: bite for 1d6 + STR piercing.']
        },
        swiftstride: {
          name: 'Swiftstride',
          traits: ['While shifted: +10 ft walking speed. Reaction move 10 ft without opportunity attacks when a creature ends its turn within 5 ft.']
        },
        wildhunt: {
          name: 'Wildhunt',
          traits: ['While shifted: advantage on WIS checks. Unless incapacitated, attacks against you from within 30 ft cannot have advantage.']
        }
      }
    });
    monstrous('yuan-ti', 'Yuan-Ti', {
      sizeChoice: true,
      darkvision: 60,
      resistances: ['Poison'],
      traits: ['Spell saves and saves to prevent/end poison have advantage.'],
      spells: [
        cantrip('Poison Spray'),
        spell(1, 'Animal Friendship (snakes only)', 'choice', 'at will'),
        spell(3, 'Suggestion')
      ]
    });
    // Published setting options. Planeshift and UA playtest variants remain manual.
    const setting = (id, name, extra, book) => add(id, name, extra, book, 'Setting specific');
    setting('kender', 'Kender', {
      size: 'Small',
      skillCount: 1,
      skillPool: [
        'insight',
        'investigation',
        'sleightOfHand',
        'stealth',
        'survival'
      ],
      spellChoice: true,
      traits: [
        'Fear saves have advantage; turn one failure into success per long rest.',
        'Taunt: bonus action, a hearing and understanding target within 60 ft makes WIS save (racial DC). Failure hinders attacks against others until your next turn starts; PB uses per long rest.'
      ]
    }, 'DSotDQ');
    setting('kalashtar', 'Kalashtar', {
      flexible: false,
      asi: {
        wis: 2,
        cha: 1
      },
      languages: [
        'Common',
        'Quori'
      ],
      resistances: ['Psychic'],
      traits: [
        'WIS saves have advantage.',
        'No dreams; immune to effects requiring dreams.',
        'Telepathy reaches 10 \xD7 level ft to a visible creature with a language. Action: let it reply for 1 hour while in range; one recipient at a time.'
      ]
    }, 'ERLW');
    setting('warforged', 'Warforged', {
      flexible: false,
      asi: { con: 2 },
      choiceBonuses: [1],
      excludeAbilities: ['con'],
      skillCount: 1,
      skillPool: 'any',
      toolCount: 1,
      resistances: ['Poison'],
      immunities: [
        'Disease',
        'Magical sleep'
      ],
      traits: [
        'No eating, drinking or breathing. Poison saves have advantage.',
        'Rest consciously and motionless for 6 hours instead of sleeping.',
        'AC +1 (apply manually). Only integrate armor you are proficient with; attaching/removing takes 1 hour. Armor cannot be removed against your will while alive.'
      ]
    }, 'ERLW');
    for (const id of [
        'dhampir',
        'hexblood',
        'reborn'
      ])
      setting(id, id[0].toUpperCase() + id.slice(1), {
        sizeChoice: true,
        skillCount: 2,
        skillPool: 'any',
        lineage: true,
        traits: ['Ancestral legacy: this preset grants two skills for a newly created character. For a transformation retaining earlier skills, movement or languages, use Custom / manual with your DM.']
      }, 'VRGR');
    Object.assign(races.dhampir, {
      speed: 35,
      climb: 35,
      darkvision: 60,
      levelTraits: [[
          3,
          'Climb walls and ceilings with hands free.'
        ]]
    });
    races.dhampir.traits.push('No breathing needed. Bite: proficient simple melee weapon, 1d4 piercing using CON; advantage when at or below half HP.', 'On a non-Construct/non-Undead bite hit, heal or boost your next attack/check by piercing damage dealt; PB empowered hits per long rest.');
    Object.assign(races.hexblood, {
      creatureType: 'Fey',
      darkvision: 60,
      spells: [
        spell(1, 'Disguise Self'),
        spell(1, 'Hex')
      ]
    });
    races.hexblood.traits.push('Token: bonus action, once per long rest. Within 10 miles, use an action to send its holder 25 words or perceive through it for up to 1 minute. Viewing blinds/deafens your own senses and consumes the token.');
    Object.assign(races.reborn, {
      resistances: ['Poison'],
      immunities: ['Magical sleep']
    });
    races.reborn.traits.push('No food, water, breathing or sleep. Conscious inactive 4-hour long rest. Disease, poison and death saves have advantage.', 'After rolling a skill check, add 1d6; PB uses per long rest.');
    setting('loxodon', 'Loxodon', {
      flexible: false,
      extraLanguage: false,
      asi: {
        con: 2,
        wis: 1
      },
      languages: [
        'Common',
        'Loxodon'
      ],
      naturalArmor: {
        base: 12,
        ability: 'con'
      },
      traits: [
        powerful,
        'Charm/fear saves have advantage. Smell-based Perception, Survival and Investigation have advantage.',
        'Trunk: reach 5 ft, lift 5 \xD7 STR pounds; simple handling and grappling, but no weapons, shields, tools or somatic spell components.'
      ]
    }, 'GGR');
    setting('simic-hybrid', 'Simic Hybrid', {
      flexible: false,
      asi: { con: 2 },
      choiceBonuses: [1],
      excludeAbilities: ['con'],
      languagePool: [
        'Elvish',
        'Vedalken'
      ],
      darkvision: 60,
      optionChoices: {
        glide: {
          name: 'Manta Glide',
          traits: ['While not incapacitated, reduce fall distance for damage by 100 ft; glide 2 ft horizontally per foot fallen.']
        },
        climb: {
          name: 'Nimble Climber',
          climb: 30
        },
        water: {
          name: 'Underwater Adaptation',
          swim: 30,
          traits: ['Breathe air and water.']
        }
      },
      secondOptionLevel: 5,
      secondOptionChoices: {
        glide: {
          name: 'Manta Glide',
          traits: ['While not incapacitated, reduce fall distance for damage by 100 ft; glide 2 ft horizontally per foot fallen.']
        },
        climb: {
          name: 'Nimble Climber',
          climb: 30
        },
        water: {
          name: 'Underwater Adaptation',
          swim: 30,
          traits: ['Breathe air and water.']
        },
        grapple: {
          name: 'Grappling Appendages',
          traits: ['Appendages: action grapple or 1d6 + STR bludgeoning unarmed hit followed by bonus-action grapple; cannot use equipment.']
        },
        carapace: {
          name: 'Carapace',
          traits: ['AC +1 unless wearing heavy armor; apply manually.']
        },
        acid: {
          name: 'Acid Spit',
          traits: ['Action, 30 ft, DEX save (8 + PB + CON) or 2d10 acid; 3d10 at level 11, 4d10 at 17. CON-modifier uses per long rest.']
        }
      }
    }, 'GGR');
    setting('vedalken', 'Vedalken', {
      flexible: false,
      asi: {
        int: 2,
        wis: 1
      },
      languages: [
        'Common',
        'Vedalken'
      ],
      skillCount: 1,
      skillPool: [
        'arcana',
        'history',
        'investigation',
        'medicine',
        'performance',
        'sleightOfHand'
      ],
      toolCount: 1,
      traits: [
        'INT, WIS and CHA saves have advantage.',
        'Add 1d4 to checks with the racial skill and tool you choose here.',
        'Breathe underwater up to 1 hour per long rest.'
      ]
    }, 'GGR');
    setting('astral-elf', 'Astral Elf', {
      darkvision: 60,
      skills: ['perception'],
      skillCount: 1,
      skillPool: 'any',
      toolCount: 1,
      weaponTool: true,
      cantripPool: [
        'Dancing Lights',
        'Light',
        'Sacred Flame'
      ],
      spellChoice: true,
      url: 'https://dnd5e.wikidot.com/lineage:elf-astral',
      traits: [
        charm,
        'Bonus-action teleport: 30 ft to a visible empty space; PB uses per long rest.',
        'No sleep or magical sleep. Conscious 4-hour trance completes a long rest; select one temporary skill and weapon/tool proficiency here after each trance.'
      ]
    }, 'AAG');
    setting('autognome', 'Autognome', {
      creatureType: 'Construct',
      size: 'Small',
      toolCount: 2,
      resistances: ['Poison'],
      immunities: ['Disease'],
      naturalArmor: {
        base: 13,
        ability: 'dex'
      },
      traits: [
        'After a d20 roll but before resolution, add 1d4 to an attack/check/save; PB uses per long rest.',
        'Mending allows spending a Hit Die to heal die + CON (minimum 1). Cure Wounds, Healing Word, their mass versions and Spare the Dying can affect you.',
        'No food, drink or breathing; conscious 6-hour inactive rest. Paralysis/poison saves have advantage.'
      ]
    }, 'AAG');
    setting('giff', 'Giff', {
      swim: 30,
      proficiencies: ['Firearms'],
      traits: [
        powerful,
        'STR checks and saves have advantage.',
        'Firearms ignore loading and long-range disadvantage.',
        'On a simple/martial weapon hit: +PB force damage; once per turn, PB uses per long rest.'
      ]
    }, 'AAG');
    setting('hadozee', 'Hadozee', {
      sizeChoice: true,
      climb: 30,
      traits: [
        'Feet can handle objects or doors with a bonus action.',
        'Fall at least 10 ft: reaction glide horizontally up to walking speed and take no falling damage.',
        'Damage reaction: reduce by 1d6 + PB; PB uses per long rest.'
      ]
    }, 'AAG');
    setting('plasmoid', 'Plasmoid', {
      creatureType: 'Ooze',
      sizeChoice: true,
      darkvision: 60,
      resistances: [
        'Acid',
        'Poison'
      ],
      traits: [
        'While carrying/wearing nothing, pass through 1-inch gaps. Initiating/escaping grapple checks have advantage.',
        'Hold breath 1 hour; poison saves have advantage.',
        'Action: reshape limbs or become a blob. Bonus action: extend a 10-ft pseudopod to handle small objects; cannot attack, sense, activate magic or lift over 10 pounds.'
      ]
    }, 'AAG');
    setting('thri-kreen', 'Thri-kreen', {
      creatureType: 'Monstrosity',
      sizeChoice: true,
      darkvision: 60,
      naturalArmor: {
        base: 13,
        ability: 'dex'
      },
      traits: [
        'Action camouflage grants advantage on hiding in matching surroundings.',
        'Secondary arms handle small objects or light weapons. No sleep required; long rests still restrict activity.',
        'Cannot speak other languages without magic. Telepathy links willing creatures within 120 ft that know any language; ends out of range, on incapacity or when dismissed.'
      ]
    }, 'AAG');
    setting('leonin', 'Leonin', {
      flexible: false,
      extraLanguage: false,
      asi: {
        con: 2,
        str: 1
      },
      speed: 35,
      darkvision: 60,
      languages: [
        'Common',
        'Leonin'
      ],
      skillCount: 1,
      skillPool: [
        'athletics',
        'intimidation',
        'perception',
        'survival'
      ],
      traits: [
        'Claws: unarmed slashing damage 1d4 + STR.',
        'Roar: bonus action, chosen listeners within 10 ft make WIS save (8 + PB + CON) or fear you until your next turn ends; once per short/long rest.'
      ]
    }, 'MOT');
    add('custom-lineage', 'Custom Lineage', {
      flexible: false,
      choiceBonuses: [2],
      sizeChoice: true,
      feat: true,
      optionChoices: {
        vision: {
          name: 'Darkvision',
          darkvision: 60
        },
        skill: {
          name: 'Skill proficiency',
          skillCount: 1,
          skillPool: 'any'
        }
      },
      traits: ['One qualifying feat: enter its choice and effects manually with your DM.']
    }, 'TCE', 'Custom');
    return races;
  }
  return {
    extend,
    sources
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterRaceCatalog;
