/* Adobe parity: factual 2014 class/subclass progression from the user-supplied sheet.
 * Names and unlock levels only; no copied rules prose. */
var CharacterClassProgression=(()=>{
  const classes={
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
  const subclasses={
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
  const subclassLevel=id=>Math.min(...(subclasses[id]?.features||[[99,99]]).map(([,level])=>level));
  function unlocked(classId,level,subclassId=''){
    const base=(classes[classId]?.features||[]).filter(([,at])=>at<=level).map(([name,at])=>({name,level:at,source:'class'}));
    const sub=(subclasses[subclassId]?.classId===classId?subclasses[subclassId].features:[]).filter(([,at])=>at<=level).map(([name,at])=>({name,level:at,source:'subclass'}));
    return [...base,...sub].sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  }
  return {classes,subclasses,subclassLevel,unlocked};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassProgression;
