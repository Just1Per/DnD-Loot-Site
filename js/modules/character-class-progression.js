/* Structured class/subclass progression catalogue.
 * Public/SRD mechanics are summarized in original wording. Non-SRD expansion records use
 * concise original summaries rather than copied source-book prose. */
var CharacterClassProgression=(()=>{
  const legacyClasses={
    barbarian:{name:'Barbarian',subclassTitle:'Primal Path',subclass:'berserker',features:[['Rage',1],['Unarmored Defense',1],['Reckless Attack',2],['Danger Sense',2],['Primal Path',3],['Fast Movement',5],['Feral Instinct',7],['Brutal Critical',9],['Relentless Rage',11],['Persistent Rage',15],['Indomitable Might',18],['Primal Champion',20]]},
    bard:{name:'Bard',subclassTitle:'Bard College',subclass:'lore',features:[['Spellcasting',1],['Bardic Inspiration',1],['Jack of All Trades',2],['Song of Rest',2],['Bard College',3],['Expertise',3],['Font of Inspiration',5],['Countercharm',6],['Magical Secrets',10],['Superior Inspiration',20]]},
    cleric:{name:'Cleric',subclassTitle:'Divine Domain',subclass:'life-domain',features:[['Spellcasting',1],['Divine Domain',1],['Channel Divinity',2],['Channel Divinity: Turn Undead',2],['Destroy Undead',5],['Divine Intervention',10]]},
    druid:{name:'Druid',subclassTitle:'Druid Circle',subclass:'land',features:[['Druidic',1],['Spellcasting',1],['Druid Circle',2],['Wild Shape',2],['Timeless Body',18],['Beast Spells',18],['Archdruid',20]]},
    fighter:{name:'Fighter',subclassTitle:'Martial Archetype',subclass:'champion',features:[['Fighting Style',1],['Second Wind',1],['Action Surge',2],['Martial Archetype',3],['Indomitable',9]]},
    monk:{name:'Monk',subclassTitle:'Monastic Tradition',subclass:'open-hand',features:[['Unarmored Defense',1],['Martial Arts',1],['Ki',2],['Unarmored Movement',2],['Monastic Tradition',3],['Deflect Missiles',3],['Slow Fall',4],['Ki-Empowered Strikes',6],['Evasion',7],['Stillness of Mind',7],['Purity of Body',10],['Tongue of the Sun and Moon',13],['Diamond Soul',14],['Timeless Body',15],['Empty Body',18],['Perfect Self',20]]},
    paladin:{name:'Paladin',subclassTitle:'Sacred Oath',subclass:'devotion',features:[['Divine Sense',1],['Lay on Hands',1],['Fighting Style',2],['Spellcasting',2],['Divine Smite',2],['Channel Divinity',3],['Sacred Oath',3],['Divine Health',3],['Aura of Protection',6],['Aura of Courage',10],['Improved Divine Smite',11],['Cleansing Touch',14]]},
    ranger:{name:'Ranger',subclassTitle:'Ranger Archetype',subclass:'hunter',features:[['Favored Enemy',1],['Natural Explorer',1],['Fighting Style',2],['Spellcasting',2],['Ranger Archetype',3],['Primeval Awareness',3],["Land's Stride",8],['Hide in Plain Sight',10],['Vanish',14],['Feral Senses',18],['Foe Slayer',20]]},
    rogue:{name:'Rogue',subclassTitle:'Roguish Archetype',subclass:'thief',features:[['Expertise',1],['Sneak Attack',1],["Thieves' Cant",1],['Cunning Action',2],['Roguish Archetype',3],['Uncanny Dodge',5],['Evasion',7],['Reliable Talent',11],['Blindsense',14],['Slippery Mind',15],['Elusive',18],['Stroke of Luck',20]]},
    sorcerer:{name:'Sorcerer',subclassTitle:'Sorcerous Origin',subclass:'draconic-bloodline',features:[['Spellcasting',1],['Sorcerous Origin',1],['Font of Magic',2],['Metamagic',3],['Sorcerous Restoration',20]]},
    warlock:{name:'Warlock',subclassTitle:'Otherworldly Patron',subclass:'fiend',features:[['Pact Magic',1],['Otherworldly Patron',1],['Eldritch Invocations',2],['Pact Boon',3],['Mystic Arcanum',11],['Eldritch Master',20]]},
    wizard:{name:'Wizard',subclassTitle:'Arcane Tradition',subclass:'evocation',features:[['Spellcasting',1],['Arcane Recovery',1],['Arcane Tradition',2],['Spell Mastery',18],['Signature Spell',20]]}
  };
  const legacySubclasses={
    'berserker':{classId:'barbarian',name:'Path of the Berserker',features:[['Frenzy',3],['Mindless Rage',6],['Intimidating Presence',10],['Retaliation',14]]},
    'lore':{classId:'bard',name:'College of Lore',features:[['Bonus Proficiencies',3],['Cutting Words',3],['Additional Magical Secrets',6],['Peerless Skill',14]]},
    'life-domain':{classId:'cleric',name:'Life Domain',features:[['Bonus Proficiency',1],['Disciple of Life',1],['Channel Divinity: Preserve Life',2],['Blessed Healer',6],['Divine Strike',8],['Supreme Healing',17]]},
    'land':{classId:'druid',name:'Circle of the Land',features:[['Bonus Cantrip',2],['Natural Recovery',2],['Circle Spells',3],["Land's Stride",6],["Nature's Ward",10],["Nature's Sanctuary",14]]},
    'champion':{classId:'fighter',name:'Champion',features:[['Improved Critical',3],['Remarkable Athlete',7],['Superior Critical',15],['Survivor',18]]},
    'open-hand':{classId:'monk',name:'Way of the Open Hand',features:[['Hand Technique',3],['Wholeness of Body',6],['Tranquility',11]]},
    'devotion':{classId:'paladin',name:'Oath of Devotion',features:[['Channel Divinity: Sacred Weapon',3],['Channel Divinity: Turn the Unholy',3],['Aura of Devotion',7],['Purity of Spirit',15],['Holy Nimbus',20]]},
    'hunter':{classId:'ranger',name:'Hunter',features:[["Hunter's Prey",3],['Defensive Tactics',7],['Multiattack',11],["Superior Hunter's Defense",15]]},
    'thief':{classId:'rogue',name:'Thief',features:[['Fast Hands',3],['Second-Story Work',3],['Supreme Sneak',9],['Use Magic Device',13],["Thief's Reflexes",17]]},
    'draconic-bloodline':{classId:'sorcerer',name:'Draconic Bloodline',features:[['Dragon Ancestor',1],['Draconic Resilience',1],['Elemental Affinity',6],['Dragon Wings',14],['Draconic Presence',18]]},
    'fiend':{classId:'warlock',name:'The Fiend',features:[["Dark One's Blessing",1],["Dark One's Own Luck",6],['Fiendish Resilience',10],['Hurl Through Hell',14]]},
    'evocation':{classId:'wizard',name:'School of Evocation',features:[['Evocation Savant',2],['Sculpt Spells',2],['Potent Cantrip',6],['Empowered Evocation',10],['Overchannel',14]]}
  };
  const feature=(name,level,summary='',extra={})=>({name,level,summary,...extra});
  const fighter2014=[
    feature('Fighting Style',1,'Choose a Fighting Style that represents your martial training.'),
    feature('Second Wind',1,'Use a bonus action to regain 1d10 + your Fighter level HP; refreshes after a short or long rest.',{action:'bonus action',recharge:'short or long rest'}),
    feature('Action Surge',2,'Take one additional action on your turn. One use until level 17, then two uses between rests.',{recharge:'short or long rest'}),
    feature('Martial Archetype',3,'Choose a Fighter subclass; it grants features as your Fighter level increases.'),
    feature('Ability Score Improvement',4,'Increase ability scores or choose a feat, following your rules edition.'),feature('Extra Attack',5,'Attack twice when you take the Attack action.'),
    feature('Ability Score Improvement',6,'Increase ability scores or choose a feat, following your rules edition.'),feature('Martial Archetype feature',7,'Gain the level 7 feature from your chosen Fighter subclass.'),
    feature('Ability Score Improvement',8,'Increase ability scores or choose a feat, following your rules edition.'),feature('Indomitable',9,'Reroll a failed saving throw. Uses increase at Fighter levels 13 and 17.',{recharge:'long rest'}),
    feature('Martial Archetype feature',10,'Gain the level 10 feature from your chosen Fighter subclass.'),feature('Extra Attack (2)',11,'Attack three times when you take the Attack action.'),
    feature('Ability Score Improvement',12,'Increase ability scores or choose a feat, following your rules edition.'),feature('Indomitable (two uses)',13,'You can use Indomitable twice between long rests.'),
    feature('Ability Score Improvement',14,'Increase ability scores or choose a feat, following your rules edition.'),feature('Martial Archetype feature',15,'Gain the level 15 feature from your chosen Fighter subclass.'),
    feature('Ability Score Improvement',16,'Increase ability scores or choose a feat, following your rules edition.'),feature('Action Surge (two uses)',17,'You can use Action Surge twice between rests, but not twice on the same turn.'),feature('Indomitable (three uses)',17,'You can use Indomitable three times between long rests.'),
    feature('Martial Archetype feature',18,'Gain the level 18 feature from your chosen Fighter subclass.'),feature('Ability Score Improvement',19,'Increase ability scores or choose a feat, following your rules edition.'),feature('Extra Attack (3)',20,'Attack four times when you take the Attack action.')
  ];
  const fighter2024=[
    feature('Fighting Style',1,'Gain a Fighting Style feat and you can replace it when you gain a Fighter level.'),
    feature('Second Wind',1,'As a Bonus Action, regain 1d10 + Fighter level HP. You begin with two uses and gain more uses at higher Fighter levels.',{action:'bonus action',recharge:'short/long rest'}),
    feature('Weapon Mastery',1,'Choose three Simple or Martial weapon kinds whose mastery properties you can use; the number grows with Fighter level.'),
    feature('Action Surge',2,'Take one additional action on your turn, except the Magic action. Uses increase at Fighter level 17.',{recharge:'short or long rest'}),
    feature('Tactical Mind',2,'After failing an ability check, spend Second Wind to add 1d10; if the check still fails, that use is not spent.'),
    feature('Fighter Subclass',3,'Choose a Fighter subclass. Its later features arrive at Fighter levels 7, 10, 15, and 18.'),
    feature('Ability Score Improvement',4,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Extra Attack',5,'Attack twice instead of once when you take the Attack action.'),feature('Tactical Shift',5,'When you activate Second Wind as a Bonus Action, move up to half your Speed without provoking Opportunity Attacks.'),
    feature('Ability Score Improvement',6,'Gain Ability Score Improvement or another feat you qualify for.'),feature('Subclass feature',7,'Gain the level 7 feature from your chosen Fighter subclass.'),
    feature('Ability Score Improvement',8,'Gain Ability Score Improvement or another feat you qualify for.'),feature('Indomitable (one use)',9,'Reroll a failed saving throw and add your Fighter level to the reroll.',{recharge:'long rest'}),feature('Tactical Master',9,'For an attack with a mastered weapon, you can substitute Push, Sap, or Slow for its mastery property.'),
    feature('Subclass feature',10,'Gain the level 10 feature from your chosen Fighter subclass.'),feature('Two Extra Attacks',11,'Attack three times instead of once when you take the Attack action.'),
    feature('Ability Score Improvement',12,'Gain Ability Score Improvement or another feat you qualify for.'),feature('Indomitable (two uses)',13,'You can use Indomitable twice between Long Rests.'),feature('Studied Attacks',13,'After you miss a creature with an attack roll, gain Advantage on your next attack against it before the end of your next turn.'),
    feature('Ability Score Improvement',14,'Gain Ability Score Improvement or another feat you qualify for.'),feature('Subclass feature',15,'Gain the level 15 feature from your chosen Fighter subclass.'),
    feature('Ability Score Improvement',16,'Gain Ability Score Improvement or another feat you qualify for.'),feature('Action Surge (two uses)',17,'You have two Action Surge uses between rests, but can use it only once on a turn.'),feature('Indomitable (three uses)',17,'You can use Indomitable three times between Long Rests.'),
    feature('Subclass feature',18,'Gain the level 18 feature from your chosen Fighter subclass.'),feature('Epic Boon',19,'Gain an Epic Boon feat or another feat you qualify for.'),feature('Three Extra Attacks',20,'Attack four times instead of once when you take the Attack action.')
  ];
  const warlock2014=[
    feature('Otherworldly Patron',1,'Choose your Warlock patron; patron features are added at Warlock levels 1, 6, 10, and 14.'),
    feature('Pact Magic',1,'Cast Warlock spells using pact slots. Pact slots share one slot level and return after a short or long rest.'),
    feature('Eldritch Invocations',2,'Choose supernatural invocations. Your number of known invocations increases as your Warlock level rises.'),
    feature('Pact Boon',3,'Choose your pact boon, granting a defining pact benefit.'),
    feature('Ability Score Improvement',4,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Otherworldly Patron feature',6,'Gain the level 6 feature from your chosen patron.'),
    feature('Ability Score Improvement',8,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Otherworldly Patron feature',10,'Gain the level 10 feature from your chosen patron.'),
    feature('Mystic Arcanum (6th level)',11,'Choose a 6th-level Warlock spell as an arcanum you can cast once per long rest.',{recharge:'long rest'}),
    feature('Ability Score Improvement',12,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Mystic Arcanum (7th level)',13,'Choose a 7th-level Warlock spell as an arcanum you can cast once per long rest.',{recharge:'long rest'}),
    feature('Otherworldly Patron feature',14,'Gain the level 14 feature from your chosen patron.'),
    feature('Mystic Arcanum (8th level)',15,'Choose an 8th-level Warlock spell as an arcanum you can cast once per long rest.',{recharge:'long rest'}),
    feature('Ability Score Improvement',16,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Mystic Arcanum (9th level)',17,'Choose a 9th-level Warlock spell as an arcanum you can cast once per long rest.',{recharge:'long rest'}),
    feature('Ability Score Improvement',19,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Eldritch Master',20,'Spend a minute entreating your patron to recover expended Pact Magic slots.',{recharge:'long rest'})
  ];
  const warlock2024=[
    feature('Eldritch Invocations',1,'Gain an Eldritch Invocation; your available invocation count increases with Warlock level.'),
    feature('Pact Magic',1,'Cast prepared Warlock spells using pact slots that return after a short or long rest.'),
    feature('Magical Cunning',2,'Perform a short ritual to recover expended Pact Magic slots without completing a Short Rest.',{recharge:'long rest'}),
    feature('Warlock Subclass',3,'Choose a Warlock patron subclass; later subclass features arrive at levels 6, 10, and 14.'),
    feature('Ability Score Improvement',4,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Subclass feature',6,'Gain the level 6 feature from your chosen Warlock subclass.'),
    feature('Ability Score Improvement',8,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Contact Patron',9,'You can contact your patron through Contact Other Plane with special reliability and usage.'),
    feature('Subclass feature',10,'Gain the level 10 feature from your chosen Warlock subclass.'),
    feature('Mystic Arcanum (level 6 spell)',11,'Choose a level 6 Warlock spell as a Mystic Arcanum.',{recharge:'long rest'}),
    feature('Ability Score Improvement',12,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Mystic Arcanum (level 7 spell)',13,'Choose a level 7 Warlock spell as a Mystic Arcanum.',{recharge:'long rest'}),
    feature('Subclass feature',14,'Gain the level 14 feature from your chosen Warlock subclass.'),
    feature('Mystic Arcanum (level 8 spell)',15,'Choose a level 8 Warlock spell as a Mystic Arcanum.',{recharge:'long rest'}),
    feature('Ability Score Improvement',16,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Mystic Arcanum (level 9 spell)',17,'Choose a level 9 Warlock spell as a Mystic Arcanum.',{recharge:'long rest'}),
    feature('Epic Boon',19,'Gain an Epic Boon feat or another feat you qualify for.'),
    feature('Eldritch Master',20,'Magical Cunning improves so it restores all expended Pact Magic slots.')
  ];
  const wizard2014=[
    feature('Spellcasting',1,'Use Intelligence to prepare and cast Wizard spells recorded in your spellbook.'),
    feature('Arcane Recovery',1,'Once per day after a short rest, recover expended spell-slot levels based on your Wizard level.',{recharge:'long rest'}),
    feature('Arcane Tradition',2,'Choose a Wizard tradition; it grants additional features as your Wizard level rises.'),
    feature('Ability Score Improvement',4,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Arcane Tradition feature',6,'Gain the level 6 feature from your chosen Wizard tradition.'),
    feature('Ability Score Improvement',8,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Arcane Tradition feature',10,'Gain the level 10 feature from your chosen Wizard tradition.'),
    feature('Ability Score Improvement',12,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Arcane Tradition feature',14,'Gain the level 14 feature from your chosen Wizard tradition.'),
    feature('Ability Score Improvement',16,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Spell Mastery',18,'Choose a level 1 and level 2 Wizard spell to cast at their lowest level without spending spell slots.'),
    feature('Ability Score Improvement',19,'Increase ability scores or choose a feat, following the 2014 rules.'),
    feature('Signature Spells',20,'Choose two level 3 Wizard spells as signature spells with special preparation and free-cast benefits.')
  ];
  const wizard2024=[
    feature('Spellcasting',1,'Use Intelligence to prepare and cast Wizard spells from your spellbook; add two Wizard spells whenever you gain a Wizard level.'),
    feature('Ritual Adept',1,'Cast eligible Wizard spells from your spellbook as rituals without preparing them.'),
    feature('Arcane Recovery',1,'After a Short Rest, recover expended spell-slot levels based on your Wizard level.',{recharge:'long rest'}),
    feature('Scholar',2,'Gain Expertise in one eligible scholarly skill (Arcana, History, Investigation, Medicine, Nature or Religion) in which you are proficient.'),
    feature('Wizard Subclass',3,'Choose a Wizard subclass; later subclass features arrive at levels 6, 10, and 14.'),
    feature('Ability Score Improvement',4,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Memorize Spell',5,'After a Short Rest, replace one prepared level 1+ Wizard spell with another eligible spell from your spellbook.'),
    feature('Subclass feature',6,'Gain the level 6 feature from your chosen Wizard subclass.'),
    feature('Ability Score Improvement',8,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Subclass feature',10,'Gain the level 10 feature from your chosen Wizard subclass.'),
    feature('Ability Score Improvement',12,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Subclass feature',14,'Gain the level 14 feature from your chosen Wizard subclass.'),
    feature('Ability Score Improvement',16,'Gain Ability Score Improvement or another feat you qualify for.'),
    feature('Spell Mastery',18,'Choose a level 1 and level 2 action-casting spell in your spellbook to cast at their lowest level without slots.'),
    feature('Epic Boon',19,'Gain an Epic Boon feat or another feat you qualify for.'),
    feature('Signature Spells',20,'Choose two level 3 Wizard spells as signature spells with special preparation and free-cast benefits.')
  ];
  // Legacy Artificer facts in original wording; this is not a revised Artificer source.
  const artificerLegacy=[
    feature('Magical Tinkering',1,'Create small ongoing effects on nonmagical objects. Your Intelligence modifier sets the number you can maintain, with a minimum of one.'),
    feature('Spellcasting',1,'Prepare Artificer spells using Intelligence. Tools act as your focus; your Artificer level determines the class spell progression.'),
    feature('Infuse Item',2,'Learn infusions and assign them to eligible nonmagical objects. Known and active infusion limits increase with Artificer level.'),
    feature('Artificer Specialist',3,'Choose a specialist; it grants further features at Artificer levels 5, 9 and 15.'),
    feature('The Right Tool for the Job',3,"Use tinker’s tools and an hour of work to create a temporary set of artisan’s tools."),
    feature('Ability Score Improvement',4,'Choose an ability score improvement or an eligible feat.'),
    feature('Artificer Specialist feature',5,"Gain your specialist’s level 5 feature."),
    feature('Tool Expertise',6,'Double your proficiency contribution to checks using tools you are proficient with. Choose the check ability in Abilities & Skills.'),
    feature('Flash of Genius',7,'Use a reaction to add your Intelligence modifier to one eligible check or save. Uses depend on Intelligence and recover on a Long Rest.'),
    feature('Ability Score Improvement',8,'Choose an ability score improvement or an eligible feat.'),
    feature('Artificer Specialist feature',9,"Gain your specialist’s level 9 feature."),
    feature('Magic Item Adept',10,'Attune to up to four items. Common and uncommon magic-item crafting uses less time and gold under the class rules.'),
    feature('Spell-Storing Item',11,'Store an eligible level 1 or 2 Artificer spell in an object. Intelligence determines its number of activations.'),
    feature('Ability Score Improvement',12,'Choose an ability score improvement or an eligible feat.'),
    feature('Magic Item Savant',14,'Attune to up to five items. The feature also relaxes specified item-use and attunement prerequisites.'),
    feature('Artificer Specialist feature',15,"Gain your specialist’s level 15 feature."),
    feature('Ability Score Improvement',16,'Choose an ability score improvement or an eligible feat.'),
    feature('Magic Item Master',18,'Attune to up to six magic items.'),
    feature('Ability Score Improvement',19,'Choose an ability score improvement or an eligible feat.'),
    feature('Soul of Artifice',20,"Attuned magic items improve your saving throws. You can end an infusion to avoid being reduced to 0 HP under the feature’s conditions.")
  ].map(row=>({...row,sourceBook:'TCE',sourceEdition:'2014'}));
  // Revised Eberron class facts, kept separate from the legacy Tasha’s chassis.
  const artificerEfa=[
    feature('Spellcasting',1,'Use Intelligence and the prepared-spell counts in the revised Artificer table; tools serve as your focus.'),
    feature("Tinker's Magic",1,'Know Mending in addition to your chosen cantrips. Create temporary mundane gear with a Magic action; uses follow Intelligence, minimum one, and recover on a Long Rest.'),
    feature('Replicate Magic Item',2,'Choose plans and replicate magic items after a Long Rest. Known-plan and active-item limits follow Artificer levels.'),
    feature('Artificer Subclass',3,'Choose a subclass for the revised Artificer source.'),
    feature('Ability Score Improvement',4,'Choose an ability score improvement or an eligible feat.'),
    feature('Subclass feature',5,'Gain your subclass’s level 5 feature.'),
    feature('Magic Item Tinker',6,'Use the feature’s charge, drain and transmute options with replicated items; follow their spell-slot and recovery conditions.'),
    feature('Flash of Genius',7,'After a failed ability check or saving throw within 30 feet, use a Reaction to add Intelligence, minimum +1. Uses follow Intelligence, minimum one.'),
    feature('Ability Score Improvement',8,'Choose an ability score improvement or an eligible feat.'),
    feature('Subclass feature',9,'Gain your subclass’s level 9 feature.'),
    feature('Magic Item Adept',10,'Attune to up to four magic items.'),
    feature('Spell-Storing Item',11,'Store a qualifying Artificer spell of level 1–3 in an object for others to use under the feature’s conditions.'),
    feature('Ability Score Improvement',12,'Choose an ability score improvement or an eligible feat.'),
    feature('Advanced Artifice',14,'Attune to up to five magic items. A Short Rest restores one expended Flash of Genius use.'),
    feature('Subclass feature',15,'Gain your subclass’s level 15 feature.'),
    feature('Ability Score Improvement',16,'Choose an ability score improvement or an eligible feat.'),
    feature('Magic Item Master',18,'Attune to up to six magic items.'),
    feature('Epic Boon',19,'Choose an Epic Boon or another eligible feat.'),
    feature('Soul of Artifice',20,'End qualifying replicated items to avoid 0 HP. While attuned to a magic item, a Short Rest restores all Flash of Genius uses.')
  ].map(row=>({...row,sourceBook:'EFOTA',sourceEdition:'2024'}));
  legacyClasses.artificer={name:'Artificer',subclassTitle:'Artificer Specialist',features:artificerLegacy.map(row=>[row.name,row.level])};
  const detailedClasses={
    artificer:{'2014':artificerLegacy,'2024':artificerLegacy},
    fighter:{'2014':fighter2014,'2024':fighter2024},
    warlock:{'2014':warlock2014,'2024':warlock2024},
    wizard:{'2014':wizard2014,'2024':wizard2024}
  };
  const detailedSubclasses={
    undead:{classId:'warlock',name:'The Undead',edition:'2014',source:'VRGR',features:[
      feature('Expanded Spell List',1,'Your patron expands the Warlock spell options associated with this subclass.'),
      feature('Form of Dread',1,'Assume a dreadful form for 1 minute, gaining temporary HP and additional fear-related benefits.',{action:'bonus action'}),
      feature('Grave Touched',6,'Your connection to undeath changes your body and magic: you no longer need to eat, drink, or breathe, and Form of Dread improves your damage interaction.'),
      feature('Necrotic Husk',10,'Gain resistance to necrotic damage and an emergency death-defying burst tied to your patron.'),
      feature('Spirit Projection',14,'Project your spirit from your body, gaining supernatural movement and other benefits while projected.')
    ]}
  };
  const classes=legacyClasses,subclasses=legacySubclasses;
  const editionOf=e=>e==='2024'?'2024':'2014';
  const srdSubclassAliases={
    berserker:'path-of-the-berserker',lore:'college-of-lore','life-domain':'life-domain',land:'circle-of-the-land',
    champion:'champion','open-hand':'way-of-the-open-hand',devotion:'oath-of-devotion',hunter:'hunter',thief:'thief',
    'draconic-bloodline':'draconic-bloodline',fiend:'the-fiend',evocation:'school-of-evocation',
    'berserker-2024':'path-of-the-berserker','lore-2024':'college-of-lore','life-domain-2024':'life-domain',
    'land-2024':'circle-of-the-land','champion-2024':'champion','open-hand-2024':'warrior-of-the-open-hand',
    'devotion-2024':'oath-of-devotion','hunter-2024':'hunter','thief-2024':'thief',
    'draconic-sorcery-2024':'draconic-sorcery','fiend-2024':'fiend-patron','evoker-2024':'evoker'
  };
  function srdClassFeatures(classId,edition){
    return globalThis.CharacterSrdClassData?.editions?.[editionOf(edition)]?.classes?.[classId]?.features||null;
  }
  function srdSubclassFeatures(subclassId,edition){
    const rows=globalThis.CharacterSrdClassData?.editions?.[editionOf(edition)]?.subclasses||{};
    const alias=srdSubclassAliases[subclassId]||subclassId;
    return rows[alias]?.features||null;
  }
  function classFeatures(classId,edition='2014',classSource='tce'){
    if(classId==='artificer')return classSource==='efa'?(editionOf(edition)==='2024'?artificerEfa:[]):classSource==='tce'?artificerLegacy:[];
    const srd=srdClassFeatures(classId,edition);
    if(Array.isArray(srd)&&srd.length)return srd;
    const detailed=detailedClasses[classId]?.[editionOf(edition)];
    return detailed||((classes[classId]?.features||[]).map(([name,level])=>feature(name,level,'Detailed rules text has not been added to the web catalogue yet.',{incomplete:true})));
  }
  function subclassFeatures(classId,subclassId,edition='2014',classSource='tce'){
    if(classId==='artificer'){const row=globalThis.CharacterSubclassData?.find?.(subclassId),owner=row?.edition==='2024'||/-efota$|-rthw$/.test(subclassId)?'efa':'tce';if(owner!==classSource||classSource==='efa'&&editionOf(edition)!=='2024')return[];}
    const detailed=detailedSubclasses[subclassId];
    if(detailed&&detailed.classId===classId&&(!detailed.edition||detailed.edition===editionOf(edition)))return detailed.features;
    const srd=srdSubclassFeatures(subclassId,edition);
    if(Array.isArray(srd)&&srd.length)return srd;
    const old=subclasses[subclassId];
    if(old?.classId===classId)return old.features.map(([name,level])=>feature(name,level,'Detailed rules text has not been added to the web catalogue yet.',{incomplete:true}));
    return[];
  }
  const subclassLevel=id=>{
    const detailed=detailedSubclasses[id]?.features;
    const rows=detailed||subclasses[id]?.features||[];
    return rows.length?Math.min(...rows.map(row=>Array.isArray(row)?row[1]:row.level)):99;
  };
  function unlocked(classId,level,subclassId='',edition='2014',classSource='tce'){
    const base=classFeatures(classId,edition,classSource).filter(row=>row.level<=level).map(row=>({...row,source:'class'}));
    const sub=subclassFeatures(classId,subclassId,edition,classSource).filter(row=>row.level<=level).map(row=>({...row,source:'subclass'}));
    return [...base,...sub].sort((a,b)=>a.level-b.level||a.source.localeCompare(b.source)||a.name.localeCompare(b.name));
  }
  function gainedAt(classId,level,subclassId='',edition='2014',classSource='tce'){return unlocked(classId,level,subclassId,edition,classSource).filter(row=>row.level===Number(level));}
  function byLevel(classId,level,subclassId='',edition='2014',classSource='tce'){
    const out={};for(const row of unlocked(classId,level,subclassId,edition,classSource))(out[row.level]||=[]).push(row);return out;
  }
  function coverage(classId,subclassId='',edition='2014',classSource='tce'){
    const rows=unlocked(classId,20,subclassId,edition,classSource),complete=rows.filter(x=>!x.incomplete).length;
    return{records:rows.length,complete,incomplete:rows.length-complete,percent:rows.length?Math.round(complete/rows.length*100):0};
  }
  // Keep older remote catalogues from restoring known defects in the pinned SRD import.
  function correctedReference(classId,edition,rows){return rows.map(row=>{
    if(editionOf(edition)==='2024'&&classId==='monk'){
      if(row.name==='Unarmoed Movement')return{...row,name:'Unarmored Movement'};
      if(row.name==='Stunning Strike'&&row.level===3)return{...row,name:'Deflect Attacks',summary:'Use a Reaction to reduce Bludgeoning, Piercing or Slashing damage from an attack by 1d10 plus your Dexterity modifier and Monk level. If reduced to 0, you can spend 1 Focus Point to redirect energy under the feature’s conditions.'};
    }
    if(editionOf(edition)==='2024'&&classId==='fighter'&&row.name==='Studdied Attacks')return{...row,name:'Studied Attacks'};
    if(classId==='warlock'&&row.name==='Mystic Arcanum'&&[11,13,15,17].includes(row.level))return{...row,summary:'Choose one level '+((row.level+1)/2)+' Warlock spell as this arcanum. Cast it once without a spell slot, then regain that use after a Long Rest. Each arcanum has its own use.'};
    return row;
  });}
  const remote={2014:null,2024:null};
  function installReference(edition,data){remote[editionOf(edition)]=data||null;}
  const localClassFeatures=classFeatures,localSubclassFeatures=subclassFeatures;
  classFeatures=function(classId,edition='2014',classSource='tce'){
    if(classId==='artificer')return localClassFeatures(classId,edition,classSource);
    const e=editionOf(edition),rows=remote[e]?.classes?.[classId]?.features;
    return correctedReference(classId,e,Array.isArray(rows)&&rows.length?rows:localClassFeatures(classId,e));
  };
  subclassFeatures=function(classId,subclassId,edition='2014',classSource='tce'){
    if(classId==='artificer')return localSubclassFeatures(classId,subclassId,edition,classSource);
    const e=editionOf(edition),row=remote[e]?.subclasses?.[subclassId],rows=row?.features;
    return row?.classId===classId&&Array.isArray(rows)&&rows.length?rows:localSubclassFeatures(classId,subclassId,e);
  };
  const overviewKey=(entry,row,edition)=>[editionOf(edition),entry.classId,row.source==='subclass'?entry.subclassId:'class',row.level,String(row.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)].join(':');
  function normalizeOverview(raw={}){
    const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
    for(const [key,value] of Object.entries(raw).slice(0,150)){
      if(!/^(2014|2024):[a-z0-9:-]{1,250}$/.test(key)||!value||typeof value!=='object')continue;
      out[key]={enabled:value.enabled===true,showName:value.showName!==false,showDescription:value.showDescription===true};
    }
    return out;
  }
  function overviewFeatures(data,entries){
    const choices=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null),artificerSource=choices?.artificerSource(data).id||'tce';
    const edition=data.build?.edition||'2014',preferences=normalizeOverview(data.adobe?.overviewFeatures),seen=new Set();
    return (entries||[]).flatMap(entry=>unlocked(entry.classId,entry.level,entry.subclassId,edition,entry.classId==='artificer'?artificerSource:undefined).map(row=>({
      ...row,classId:entry.classId,key:overviewKey(entry,row,edition)
    }))).filter(row=>{const pref=preferences[row.key];if(!pref?.enabled||!pref.showName&&!pref.showDescription||seen.has(row.key))return false;seen.add(row.key);return true;}).map(row=>({...row,...preferences[row.key]}));
  }
  return {overviewKey,normalizeOverview,overviewFeatures,classes,subclasses,detailedClasses,detailedSubclasses,classFeatures:(...a)=>classFeatures(...a),subclassFeatures:(...a)=>subclassFeatures(...a),subclassLevel,unlocked,gainedAt,byLevel,coverage,installReference};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassProgression;
