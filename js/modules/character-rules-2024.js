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
  const BackgroundCatalog=(typeof CharacterBackgrounds!=='undefined'?CharacterBackgrounds:require('./character-backgrounds'));
  const backgrounds=BackgroundCatalog.modern;
  // Origin categories are restricted here; Magic Initiate choices live in the spell catalogue.
  const originFeats = [
    'Alert',
    'Crafter',
    'Healer',
    'Lucky',
    // The current catalogue chooses the class separately; retain qualified legacy saves too.
    'Magic Initiate',
    'Magic Initiate (Cleric)',
    'Magic Initiate (Druid)',
    'Magic Initiate (Wizard)',
    'Musician',
    'Savage Attacker',
    'Skilled',
    'Tavern Brawler',
    'Tough'
  ];
  let referencedOriginNames=null;
  function isOriginFeat(name){
    if(originFeats.includes(name))return true;
    const definitions=globalThis.CharacterFeatData||(typeof require==='function'?require('./character-feat-data'):null);
    const live=globalThis.CharacterCatalog?.data?.feats||[];
    if(live.some(feat=>feat.edition==='2024'&&(feat.category==='O'||String(feat.category).toLowerCase()==='origin')&&(definitions?.[feat.id]?.name||feat.name)===name))return true;
    if(!referencedOriginNames){
      const reference=globalThis.CharacterFeatReference||(typeof require==='function'?require('./character-feat-reference'):null);
      if(definitions&&reference)referencedOriginNames=new Set(Object.values(definitions).filter(def=>def.edition==='2024'&&reference.records?.[def.source+'|'+def.name]?.category==='O').map(def=>def.name));
    }
    return referencedOriginNames?.has(name)||false;
  }
  const featText = {
    Alert: 'Initiative includes PB; after rolling, you may swap with a willing ally unless either of you is incapacitated.',
    Skilled: 'Choose any three skill/tool proficiencies below. This feat is repeatable.',
    'Savage Attacker': 'Once per turn, on a weapon hit roll its damage dice twice and use either result.',
    Crafter: 'Three tool choices are in Feats; discounts and crafting are resolved manually.',
    Musician: 'Choose instrument proficiencies in Feats; grant inspiration to eligible allies after resting.',
    Lucky: 'Luck points are tracked in Combat; spending a point requires a permitted roll.',
    Healer: 'Use a healer’s kit with Hit Dice; healing rolls of 1 may be rerolled where the feat permits. Resolve healing manually.',
    'Tavern Brawler': 'Unarmed damage, rerolls, improvised weapons and a limited push; resolve these combat effects manually.',
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
      if (!r.edition) r.edition = '2014';
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
  // Derived warning locations are kept beside the rule that detects the problem.
  // They are presentation metadata, not saved character choices.
  function choiceWarning(e,message,category,target,source='',tab='builder'){
    e.warnings.push(message);
    (e.choiceIssues||=[]).push({message,category,target,source,tab});
  }
  function apply(e, b, data, level, skillNames, tools) {
    if (b.edition !== '2024')
      return;
    e.asi = {};
    const bg = BackgroundCatalog.get(b.background);
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
        choiceWarning(e,'Choose distinct background abilities from the permitted list.','Ability','[name="build.backgroundAbilities.'+i+'"]');
        return;
      }
      used.add(key);
      e.asi[key] = n;
    });
    for (const [index,lang] of b.standardLanguages.entries()) {
      if (!standardLanguages.includes(lang) || e.languages.includes(lang))
        choiceWarning(e,'Choose two different additional standard languages.','Language','[name="build.standardLanguages.'+index+'"]');
      else
        e.languages.push(lang);
    }
    if (!e.languages.includes('Common'))
      e.languages.unshift('Common');
    const feats = [];
    const bgFeat = bg?.featChoices?.length ? (bg.featChoices.includes(b.backgroundFeat)?b.backgroundFeat:'') : (bg?.feat || b.backgroundFeat);
    if (bgFeat)
      feats.push({
        name: bgFeat,
        choices: b.backgroundFeatChoices, key: 'origin-background'
      });
    else if (bg?.featChoices?.length)
      choiceWarning(e,'Choose the background feat on the Feats page: '+(bg.featLabel || bg.featChoices.join(' or '))+'.','Feat','[data-build-feat-field="backgroundFeat"]','origin-background','feats');
    else
      choiceWarning(e,'Choose an Origin feat for your custom / legacy background.','Feat','[data-build-feat-field="backgroundFeat"]','origin-background','feats');
    if (e.race?.originFeat) {
      if (b.humanOriginFeat && isOriginFeat(b.humanOriginFeat))
        feats.push({
          name: b.humanOriginFeat,
          choices: b.humanFeatChoices, key: 'origin-human'
        });
      else
        choiceWarning(e,b.humanOriginFeat?'The selected Human feat is unavailable or is not an Origin feat. Choose an available Origin feat on the Feats page.':'Choose the additional Human Origin feat.','Feat','[data-build-feat-field="humanOriginFeat"]','origin-human','feats');
    }
    const taken = new Set();
    e.originFeats = [];
    for (const {name, choices, key} of feats) {
      if (!originFeats.includes(name)) {
        if (name) {
          e.originFeats.push(name);
          e.traits.push(name+' (Origin feat): source-specific effects are not automated yet.');
          e.warnings.push(name+': selected on the Feats page; keep its source-specific effects as manual until an automation adapter is added.');
        }
        continue;
      }
      if (taken.has(name) && name !== 'Skilled') {
        choiceWarning(e,'This Origin feat cannot be taken twice; choose a different feat.','Feat','[data-build-feat-field="'+(key==='origin-human'?'humanOriginFeat':'backgroundFeat')+'"]',key,'feats');
        continue;
      }
      taken.add(name);
      e.originFeats.push(name);
      e.traits.push(`${ name } (2024 Origin feat): ${ featText[name] || 'Choose spells in the Feat catalogue below; other effects remain manual.' }`);
      if (name === 'Alert')
        e.initiativeBonus = Math.max(e.initiativeBonus, Math.ceil(level / 4) + 1);
      if (name === 'Tough') {
        e.hpBonus += 2 * level;
        (e.hpSources||=[]).push({kind:'feat',name:'Tough (2024 Origin feat)',value:2*level});
      }
      if (name === 'Skilled') {
        const selected = new Set();
        for (const [index,value] of choices.entries()) {
          if (selected.has(value)) {
            choiceWarning(e,'Choose three distinct untrained skills/tools for Skilled.','Feat','[data-build-feat-array="'+(key==='origin-human'?'humanFeatChoices':'backgroundFeatChoices')+'"][data-build-feat-index="'+index+'"]',key,'feats');
            continue;
          }
          selected.add(value);
          if (value.startsWith('skill:') && skillNames.includes(value.slice(6)) && !e.skills.includes(value.slice(6)))
            e.skills.push(value.slice(6));
          else if (value.startsWith('tool:') && tools.includes(value.slice(5)) && !e.proficiencies.includes(value.slice(5)))
            e.proficiencies.push(value.slice(5));
          else
            choiceWarning(e,'Choose three distinct untrained skills/tools for Skilled.','Feat','[data-build-feat-array="'+(key==='origin-human'?'humanFeatChoices':'backgroundFeatChoices')+'"][data-build-feat-index="'+index+'"]',key,'feats');
        }
      }
    }
  }
  return {
    extend,
    backgrounds,
    originFeats,
    isOriginFeat,
    choiceWarning,
    featSummary: name => featText[name] || '',
    standardLanguages,
    classProfile,
    apply
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterRules2024;
