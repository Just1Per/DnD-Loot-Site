/* 2024 calculations and original adaptations of SRD 5.2.1 (CC BY 4.0).
 * Aasimar is a separately sourced PHB summary. See rules-attribution.html. */
var CharacterRules2024 = (() => {
  const source = 'SRD 5.2.1 / 2024';
  const standardLanguages = [
    'Common Sign Language',
    'Draconic',
    'Dwarvish',
    'Elvish',
    'Giant',
    'Gnomish',
    'Goblin',
    'Halfling',
    'Orc'
  ];
  const backgrounds = {
    'acolyte-2024': {
      name: 'Acolyte',
      abilities: [
        'int',
        'wis',
        'cha'
      ],
      skills: [
        'insight',
        'religion'
      ],
      tool: 'Calligrapher\u2019s supplies',
      feat: 'Magic Initiate (Cleric)'
    },
    'criminal-2024': {
      name: 'Criminal',
      abilities: [
        'dex',
        'con',
        'int'
      ],
      skills: [
        'sleightOfHand',
        'stealth'
      ],
      tool: 'Thieves\u2019 tools',
      feat: 'Alert'
    },
    'sage-2024': {
      name: 'Sage',
      abilities: [
        'con',
        'int',
        'wis'
      ],
      skills: [
        'arcana',
        'history'
      ],
      tool: 'Calligrapher\u2019s supplies',
      feat: 'Magic Initiate (Wizard)'
    },
    'soldier-2024': {
      name: 'Soldier',
      abilities: [
        'str',
        'dex',
        'con'
      ],
      skills: [
        'athletics',
        'intimidation'
      ],
      tool: 'Choose one gaming set (record in additional proficiencies)',
      feat: 'Savage Attacker'
    }
  };
  // Origin categories are restricted here; feat spell selections and active effects remain manual.
  const originFeats = [
    'Alert',
    'Crafter',
    'Healer',
    'Lucky',
    'Magic Initiate (Cleric)',
    'Magic Initiate (Druid)',
    'Magic Initiate (Wizard)',
    'Musician',
    'Savage Attacker',
    'Skilled',
    'Tavern Brawler',
    'Tough'
  ];
  const featText = {
    Alert: 'Initiative includes PB; after rolling, you may swap with a willing ally unless either of you is incapacitated.',
    Skilled: 'Choose any three skill/tool proficiencies below. This feat is repeatable.',
    'Savage Attacker': 'Once per turn, on a weapon hit roll its damage dice twice and use either result.',
    Tough: 'Maximum HP increases by twice character level; calculated in Base scores / HP mode.'
  };
  const spell = (level, name, usage = 'once per long rest; may also use an appropriate spell slot') => ({
    level,
    name,
    usage,
    ability: 'choice'
  });
  const cantrip = name => spell(1, name, 'at will');
  function extend(races) {
    for (const r of Object.values(races))
      r.edition = '2014';
    const add = (id, name, extra = {}) => races[id + '-2024'] = {
      name,
      edition: '2024',
      source,
      book: '2024',
      category: '2024',
      asi: {},
      flexible: false,
      languages: [],
      creatureType: 'Humanoid',
      speed: 30,
      size: 'Medium',
      traits: [],
      ...extra
    };
    add('human', 'Human', {
      sizeChoice: true,
      skillCount: 1,
      skillPool: 'any',
      originFeat: true,
      traits: [
        'Resourceful: gain Heroic Inspiration after a long rest.',
        'Versatile: choose one Origin feat in addition to your background feat.'
      ]
    });
    add('dragonborn', 'Dragonborn', {
      darkvision: 60,
      traits: ['Breath replaces one attack during your Attack action; choose cone or line each use.'],
      levelTraits: [[
          5,
          'Bonus action: manifest wings for 10 minutes, granting flight at walking speed; once per long rest. Ends if incapacitated or dismissed.'
        ]]
    });
    add('dwarf', 'Dwarf', {
      darkvision: 120,
      resistances: ['Poison'],
      hpPerLevel: 1,
      traits: [
        'Poison-condition saves have advantage.',
        'Toughness adds 1 maximum HP per character level.',
        'On stone: bonus action grants 60-ft Tremorsense for 10 minutes; PB uses per long rest.'
      ]
    });
    add('elf', 'Elf', {
      darkvision: 60,
      skillCount: 1,
      skillPool: [
        'insight',
        'perception',
        'survival'
      ],
      spellChoice: true,
      traits: [
        'Charm-condition saves have advantage.',
        'No sleep or magical sleep; conscious 4-hour meditation completes a long rest.'
      ],
      optionChoices: {
        drow: {
          name: 'Drow',
          darkvision: 120,
          spells: [
            cantrip('Dancing Lights'),
            spell(3, 'Faerie Fire'),
            spell(5, 'Darkness')
          ]
        },
        high: {
          name: 'High Elf',
          defaultCantrip: 'Prestidigitation',
          cantripPool: [
            'Acid Splash',
            'Blade Ward',
            'Chill Touch',
            'Dancing Lights',
            'Fire Bolt',
            'Friends',
            'Light',
            'Mage Hand',
            'Mending',
            'Message',
            'Mind Sliver',
            'Minor Illusion',
            'Poison Spray',
            'Prestidigitation',
            'Ray of Frost',
            'Shocking Grasp',
            'True Strike'
          ],
          traits: ['High Elf starts with Prestidigitation. After a long rest you may replace it with another Wizard cantrip; update the selection here.'],
          spells: [
            spell(3, 'Detect Magic'),
            spell(5, 'Misty Step')
          ]
        },
        wood: {
          name: 'Wood Elf',
          speed: 35,
          spells: [
            cantrip('Druidcraft'),
            spell(3, 'Longstrider'),
            spell(5, 'Pass Without Trace')
          ]
        }
      }
    });
    add('gnome', 'Gnome', {
      size: 'Small',
      darkvision: 60,
      spellChoice: true,
      traits: ['INT, WIS and CHA saving throws have advantage.'],
      optionChoices: {
        forest: {
          name: 'Forest Gnome',
          spells: [
            cantrip('Minor Illusion'),
            spell(1, 'Speak with Animals', 'PB free castings per long rest; may also use a spell slot')
          ]
        },
        rock: {
          name: 'Rock Gnome',
          spells: [
            cantrip('Mending'),
            cantrip('Prestidigitation')
          ],
          traits: ['Spend 10 minutes to create a Tiny device reproducing a chosen Prestidigitation effect. Activate with a touching bonus action. Maximum three devices; each lasts 8 hours or until dismantled.']
        }
      }
    });
    add('goliath', 'Goliath', {
      speed: 35,
      traits: [
        'Escape-grapple checks have advantage; carrying capacity uses one larger size.',
        'Chosen giant power: PB uses per long rest.'
      ],
      optionChoices: {
        cloud: {
          name: 'Cloud Giant',
          traits: ['Bonus action: teleport 30 ft to a visible empty space.']
        },
        fire: {
          name: 'Fire Giant',
          traits: ['On a damaging attack-roll hit: deal +1d10 fire to the target.']
        },
        frost: {
          name: 'Frost Giant',
          traits: ['On a damaging attack-roll hit: deal +1d6 cold and reduce target speed by 10 ft until your next turn starts.']
        },
        hill: {
          name: 'Hill Giant',
          traits: ['On a damaging attack-roll hit against a Large or smaller creature: knock it prone.']
        },
        stone: {
          name: 'Stone Giant',
          traits: ['When damaged: reaction reduces damage by 1d12 + CON.']
        },
        storm: {
          name: 'Storm Giant',
          traits: ['When damaged by a creature within 60 ft: reaction deals 1d8 thunder to it.']
        }
      },
      levelTraits: [[
          5,
          'Bonus action: become Large in sufficient space for 10 minutes; advantage on STR checks and +10 ft speed. Once per long rest; dismiss freely.'
        ]]
    });
    add('halfling', 'Halfling', {
      size: 'Small',
      traits: [
        'Fear-condition saves have advantage.',
        'Move through larger creatures, but do not end there.',
        'Reroll a natural 1 on a d20 test; use the replacement.',
        'A creature at least one size larger can provide enough cover for hiding.'
      ]
    });
    add('orc', 'Orc', {
      darkvision: 120,
      traits: [
        'Bonus-action Dash grants PB temporary HP; PB uses per short or long rest.',
        'Once per long rest, falling to 0 HP without instant death can leave you at 1 HP instead.'
      ]
    });
    add('tiefling', 'Tiefling', {
      sizeChoice: true,
      darkvision: 60,
      spells: [cantrip('Thaumaturgy')],
      optionChoices: {
        abyssal: {
          name: 'Abyssal',
          resistances: ['Poison'],
          spells: [
            cantrip('Poison Spray'),
            spell(3, 'Ray of Sickness'),
            spell(5, 'Hold Person')
          ]
        },
        chthonic: {
          name: 'Chthonic',
          resistances: ['Necrotic'],
          spells: [
            cantrip('Chill Touch'),
            spell(3, 'False Life'),
            spell(5, 'Ray of Enfeeblement')
          ]
        },
        infernal: {
          name: 'Infernal',
          resistances: ['Fire'],
          spells: [
            cantrip('Fire Bolt'),
            spell(3, 'Hellish Rebuke'),
            spell(5, 'Darkness')
          ]
        }
      }
    });
    add('aasimar', 'Aasimar', {
      source: 'Player\u2019s Handbook (2024)',
      url: 'https://dnd2024.wikidot.com/species:aasimar',
      sizeChoice: true,
      darkvision: 60,
      resistances: [
        'Necrotic',
        'Radiant'
      ],
      spells: [{
          ...cantrip('Light'),
          ability: 'cha'
        }],
      traits: ['Healing: Magic action, touch, restore PB d4 HP; once per long rest.'],
      levelTraits: [
        [
          3,
          'Revelation: bonus action, 1 minute, once per long rest. Choose a form each activation; once per turn add PB damage to an attack/spell target.'
        ],
        [
          3,
          'Heavenly Wings: fly at walking speed; extra damage is radiant. Inner Radiance: radiant extra damage, emitted light and PB radiant to creatures within 10 ft at each turn end.'
        ],
        [
          3,
          'Necrotic Shroud: necrotic extra damage. On transformation, non-allies within 10 ft make CHA save (8 + PB + CHA) or fear you until your next turn ends.'
        ]
      ]
    });
  }
  function classProfile(id, base) {
    if (!base)
      return base;
    const c = {
      ...base,
      profs: [...base.profs],
      skills: Array.isArray(base.skills) ? [...base.skills] : base.skills
    };
    const profs = {
      bard: [
        'Light armor',
        'Simple weapons',
        'Choose three musical instruments'
      ],
      druid: [
        'Light armor',
        'Shields',
        'Simple weapons',
        'Herbalism kit'
      ],
      monk: [
        'Simple weapons',
        'Martial weapons with the Light property',
        'Choose one artisan tool or musical instrument'
      ],
      rogue: [
        'Light armor',
        'Simple weapons',
        'Martial weapons with the Finesse or Light property',
        'Thieves\u2019 tools'
      ],
      sorcerer: ['Simple weapons'],
      wizard: ['Simple weapons']
    };
    if (profs[id])
      c.profs = profs[id];
    if (id === 'wizard')
      c.skills.push('nature');
    if (id === 'rogue')
      c.skills = c.skills.filter(k => k !== 'performance');
    return c;
  }
  function apply(e, b, data, level, skillNames, tools) {
    if (b.edition !== '2024')
      return;
    e.asi = {};
    const bg = backgrounds[b.background];
    if (bg) {
      e.skills.push(...bg.skills);
      e.proficiencies.push(bg.tool);
    }
    if (b.background === 'acolyte')
      e.skills.push('insight', 'religion');
    const allowed = bg?.abilities || [
      'str',
      'dex',
      'con',
      'int',
      'wis',
      'cha'
    ];
    const used = new Set();
    (b.backgroundPattern === '111' ? [
      1,
      1,
      1
    ] : [
      2,
      1
    ]).forEach((n, i) => {
      const key = b.backgroundAbilities[i];
      if (!allowed.includes(key) || used.has(key)) {
        e.warnings.push('Choose distinct background abilities from the permitted list.');
        return;
      }
      used.add(key);
      e.asi[key] = n;
    });
    for (const lang of b.standardLanguages) {
      if (!standardLanguages.includes(lang) || e.languages.includes(lang))
        e.warnings.push('Choose two different additional standard languages.');
      else
        e.languages.push(lang);
    }
    if (!e.languages.includes('Common'))
      e.languages.unshift('Common');
    const feats = [];
    const bgFeat = bg?.feat || b.backgroundFeat;
    if (bgFeat)
      feats.push({
        name: bgFeat,
        choices: b.backgroundFeatChoices
      });
    else
      e.warnings.push('Choose an Origin feat for your custom / legacy background.');
    if (e.race?.originFeat) {
      if (b.humanOriginFeat)
        feats.push({
          name: b.humanOriginFeat,
          choices: b.humanFeatChoices
        });
      else
        e.warnings.push('Choose the additional Human Origin feat.');
    }
    const taken = new Set();
    e.originFeats = [];
    for (const {name, choices} of feats) {
      if (!originFeats.includes(name))
        continue;
      if (taken.has(name) && name !== 'Skilled') {
        e.warnings.push('This Origin feat cannot be taken twice; choose a different feat.');
        continue;
      }
      taken.add(name);
      e.originFeats.push(name);
      e.traits.push(`${ name } (2024 Origin feat): ${ featText[name] || 'Record spell selections and other feat effects manually in Features / Spells.' }`);
      if (name === 'Alert')
        e.initiativeBonus = Math.max(e.initiativeBonus, Math.ceil(level / 4) + 1);
      if (name === 'Tough')
        e.hpBonus += 2 * level;
      if (name === 'Skilled') {
        const selected = new Set();
        for (const value of choices) {
          if (selected.has(value)) {
            e.warnings.push('Choose three distinct untrained skills/tools for Skilled.');
            continue;
          }
          selected.add(value);
          if (value.startsWith('skill:') && skillNames.includes(value.slice(6)) && !e.skills.includes(value.slice(6)))
            e.skills.push(value.slice(6));
          else if (value.startsWith('tool:') && tools.includes(value.slice(5)) && !e.proficiencies.includes(value.slice(5)))
            e.proficiencies.push(value.slice(5));
          else
            e.warnings.push('Choose three distinct untrained skills/tools for Skilled.');
        }
      }
    }
  }
  return {
    extend,
    backgrounds,
    originFeats,
    standardLanguages,
    classProfile,
    apply
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterRules2024;
