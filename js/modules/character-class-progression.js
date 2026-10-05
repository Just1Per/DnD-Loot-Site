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
  const detailedClasses={fighter:{'2014':fighter2014,'2024':fighter2024}};
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
  function classFeatures(classId,edition='2014'){
    const detailed=detailedClasses[classId]?.[editionOf(edition)];
    return detailed||((classes[classId]?.features||[]).map(([name,level])=>feature(name,level,'Detailed rules text has not been added to the web catalogue yet.',{incomplete:true})));
  }
  function subclassFeatures(classId,subclassId,edition='2014'){
    const detailed=detailedSubclasses[subclassId];
    if(detailed&&detailed.classId===classId&&(!detailed.edition||detailed.edition===editionOf(edition)))return detailed.features;
    const old=subclasses[subclassId];
    if(old?.classId===classId)return old.features.map(([name,level])=>feature(name,level,'Detailed rules text has not been added to the web catalogue yet.',{incomplete:true}));
    return[];
  }
  const subclassLevel=id=>{
    const detailed=detailedSubclasses[id]?.features;
    const rows=detailed||subclasses[id]?.features||[];
    return rows.length?Math.min(...rows.map(row=>Array.isArray(row)?row[1]:row.level)):99;
  };
  function unlocked(classId,level,subclassId='',edition='2014'){
    const base=classFeatures(classId,edition).filter(row=>row.level<=level).map(row=>({...row,source:'class'}));
    const sub=subclassFeatures(classId,subclassId,edition).filter(row=>row.level<=level).map(row=>({...row,source:'subclass'}));
    return [...base,...sub].sort((a,b)=>a.level-b.level||a.source.localeCompare(b.source)||a.name.localeCompare(b.name));
  }
  function gainedAt(classId,level,subclassId='',edition='2014'){return unlocked(classId,level,subclassId,edition).filter(row=>row.level===Number(level));}
  function byLevel(classId,level,subclassId='',edition='2014'){
    const out={};for(const row of unlocked(classId,level,subclassId,edition))(out[row.level]||=[]).push(row);return out;
  }
  function coverage(classId,subclassId='',edition='2014'){
    const rows=unlocked(classId,20,subclassId,edition),complete=rows.filter(x=>!x.incomplete).length;
    return{records:rows.length,complete,incomplete:rows.length-complete,percent:rows.length?Math.round(complete/rows.length*100):0};
  }
  return {classes,subclasses,detailedClasses,detailedSubclasses,classFeatures,subclassFeatures,subclassLevel,unlocked,gainedAt,byLevel,coverage};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassProgression;
