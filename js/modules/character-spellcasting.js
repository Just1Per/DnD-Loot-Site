'use strict';
/* Class-aware spell progression for the web character sheet.
 * Numeric progression is implemented from the published 2014/2024 class tables.
 * This module stores mechanics only; spell rules text remains in the rules catalogue. */
var CharacterSpellcasting=(()=>{
  const clampLevel=value=>Math.max(1,Math.min(20,Math.trunc(Number(value)||1)));
  const at=(rows,level)=>rows[clampLevel(level)-1]??0;
  const ability={
    artificer:'int',bard:'cha',cleric:'wis',druid:'wis',paladin:'cha',
    ranger:'wis',sorcerer:'cha',warlock:'cha',wizard:'int'
  };
  const labels={
    artificer:'Artificer',bard:'Bard',cleric:'Cleric',druid:'Druid',paladin:'Paladin',
    ranger:'Ranger',sorcerer:'Sorcerer',warlock:'Warlock',wizard:'Wizard'
  };

  const C2014={
    bard:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    cleric:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    druid:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    sorcerer:[4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
    warlock:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    wizard:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    artificer:[2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,4,4,4,4,4]
  };
  const KNOWN2014={
    bard:[4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
    sorcerer:[2,3,4,5,6,7,8,8,9,10,11,11,12,13,14,14,15,15,15,15],
    warlock:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
    ranger:[0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11]
  };

  const FULL2024=[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  const SORCERER2024=[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  const WIZARD2024=[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25];
  const HALF2024=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
  const WARLOCK2024=[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15];
  const C2024={
    bard:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    cleric:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    druid:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    sorcerer:[4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
    warlock:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    wizard:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    artificer:[2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,4,4,4,4,4]
  };

  function abilityMod(scores,key){
    const score=Number(scores?.[key]??10);
    return Math.floor((score-10)/2);
  }
  function maxSpellLevel(classId,level,edition='2014'){
    level=clampLevel(level);
    if(['bard','cleric','druid','sorcerer','wizard'].includes(classId))return Math.min(9,Math.ceil(level/2));
    if(classId==='warlock')return Math.min(5,Math.ceil(level/2));
    if(classId==='artificer')return Math.min(5,Math.floor((level+3)/4));
    if(['paladin','ranger'].includes(classId)){
      if(edition==='2014'&&level<2)return 0;
      return Math.min(5,Math.floor((level+3)/4));
    }
    return 0;
  }

  function profile(classId,level,edition='2014',scores={}){
    classId=String(classId||'').toLowerCase();level=clampLevel(level);edition=edition==='2024'?'2024':'2014';
    if(!ability[classId])return null;
    const mod=abilityMod(scores,ability[classId]);
    const base={classId,name:labels[classId],level,edition,ability:ability[classId],cantrips:0,spellCount:0,mode:'none',maxSpellLevel:maxSpellLevel(classId,level,edition),bookMinimum:0,changeTiming:'level'};
    if(edition==='2014'){
      base.cantrips=at(C2014[classId]||[],level);
      if(Object.hasOwn(KNOWN2014,classId)){
        base.mode='known';base.spellCount=at(KNOWN2014[classId],level);base.changeTiming='level';
      } else if(classId==='cleric'||classId==='druid'){
        base.mode='prepared';base.spellCount=Math.max(1,level+mod);base.changeTiming='long-rest';
      } else if(classId==='paladin'){
        base.mode='prepared';base.spellCount=level<2?0:Math.max(1,Math.floor(level/2)+mod);base.changeTiming='long-rest';
      } else if(classId==='artificer'){
        base.mode='prepared';base.spellCount=Math.max(1,Math.floor(level/2)+mod);base.changeTiming='long-rest';
      } else if(classId==='wizard'){
        base.mode='spellbook';base.spellCount=Math.max(1,level+mod);base.bookMinimum=6+Math.max(0,level-1)*2;base.changeTiming='long-rest';
      }
      return base;
    }
    base.cantrips=at(C2024[classId]||[],level);
    if(['bard','cleric','druid'].includes(classId)){base.mode=classId==='bard'?'fixed-prepared':'prepared';base.spellCount=at(FULL2024,level);base.changeTiming=classId==='bard'?'level':'long-rest';}
    else if(classId==='sorcerer'){base.mode='fixed-prepared';base.spellCount=at(SORCERER2024,level);base.changeTiming='level';}
    else if(classId==='wizard'){base.mode='spellbook';base.spellCount=at(WIZARD2024,level);base.bookMinimum=6+Math.max(0,level-1)*2;base.changeTiming='long-rest';}
    else if(classId==='warlock'){base.mode='fixed-prepared';base.spellCount=at(WARLOCK2024,level);base.changeTiming='level';}
    else if(classId==='paladin'||classId==='ranger'||classId==='artificer'){base.mode='prepared';base.spellCount=at(HALF2024,level);base.changeTiming='long-rest';}
    return base;
  }

  function classEntries(data,targetLevel){
    const raw=data?.adobe?.classLevels||data?.rulesChoices?.grants?.__adobe?.data?.classLevels||[];
    const normalized=(Array.isArray(raw)?raw:[]).filter(e=>e&&ability[e.classId]).map(e=>({classId:e.classId,level:clampLevel(e.level),subclassId:e.subclassId||''}));
    if(normalized.length)return normalized;
    const id=data?.build?.classId;
    return ability[id]?[{classId:id,level:clampLevel(targetLevel),subclassId:''}]:[];
  }

  function profiles(data,targetLevel,scores={}){
    const edition=data?.build?.edition==='2024'?'2024':'2014';
    return classEntries(data,targetLevel).map(entry=>({...profile(entry.classId,entry.level,edition,scores),subclassId:entry.subclassId||''})).filter(Boolean).filter(p=>p.maxSpellLevel>0||p.cantrips>0||p.classId==='artificer');
  }

  // Always-prepared grants are separate from the player's preparation allowance.
  // Source: published class/subclass progression tables (Basic Rules 2014/2024).
  const grantTables={
    '2014':{
      devotion:[[3,'Protection from Evil and Good','Sanctuary'],[5,'Lesser Restoration','Zone of Truth'],[9,'Beacon of Hope','Dispel Magic'],[13,'Freedom of Movement','Guardian of Faith'],[17,'Commune','Flame Strike']],
      ancients:[[3,'Ensnaring Strike','Speak with Animals'],[5,'Moonbeam','Misty Step'],[9,'Plant Growth','Protection from Energy'],[13,'Ice Storm','Stoneskin'],[17,'Commune with Nature','Tree Stride']],
      vengeance:[[3,'Bane',"Hunter’s Mark"],[5,'Hold Person','Misty Step'],[9,'Haste','Protection from Energy'],[13,'Banishment','Dimension Door'],[17,'Hold Monster','Scrying']],
      'life-domain':[[1,'Bless','Cure Wounds'],[3,'Lesser Restoration','Spiritual Weapon'],[5,'Beacon of Hope','Revivify'],[7,'Death Ward','Guardian of Faith'],[9,'Mass Cure Wounds','Raise Dead']]
    },
    '2024':{
      devotion:[[3,'Protection from Evil and Good','Shield of Faith'],[5,'Aid','Zone of Truth'],[9,'Beacon of Hope','Dispel Magic'],[13,'Freedom of Movement','Guardian of Faith'],[17,'Commune','Flame Strike']],
      ancients:[[3,'Ensnaring Strike','Speak with Animals'],[5,'Moonbeam','Misty Step'],[9,'Plant Growth','Protection from Energy'],[13,'Ice Storm','Stoneskin'],[17,'Commune with Nature','Tree Stride']],
      vengeance:[[3,'Bane',"Hunter’s Mark"],[5,'Hold Person','Misty Step'],[9,'Haste','Protection from Energy'],[13,'Banishment','Dimension Door'],[17,'Hold Monster','Scrying']],
      'life-domain':[[3,'Aid','Bless','Cure Wounds','Lesser Restoration'],[5,'Mass Healing Word','Revivify'],[7,'Aura of Life','Death Ward'],[9,'Greater Restoration','Mass Cure Wounds']],
      fiend:[[3,'Burning Hands','Command','Scorching Ray','Suggestion'],[5,'Fireball','Stinking Cloud'],[7,'Fire Shield','Wall of Fire'],[9,'Geas','Insect Plague']],
      'draconic-bloodline':[[3,'Alter Self','Chromatic Orb','Command',"Dragon’s Breath"],[5,'Fear','Fly'],[7,'Arcane Eye','Charm Monster'],[9,'Legend Lore','Summon Dragon']]
    }
  };
  Object.assign(grantTables['2014'],{
    'knowledge-domain':[[1,'Command','Identify'],[3,'Augury','Suggestion'],[5,'Nondetection','Speak with Dead'],[7,'Arcane Eye','Confusion'],[9,'Legend Lore','Scrying']],
    'light-domain':[[1,'Burning Hands','Faerie Fire'],[3,'Flaming Sphere','Scorching Ray'],[5,'Daylight','Fireball'],[7,'Guardian of Faith','Wall of Fire'],[9,'Flame Strike','Scrying']],
    'nature-domain':[[1,'Animal Friendship','Speak with Animals'],[3,'Barkskin','Spike Growth'],[5,'Plant Growth','Wind Wall'],[7,'Dominate Beast','Grasping Vine'],[9,'Insect Plague','Tree Stride']],
    'tempest-domain':[[1,'Fog Cloud','Thunderwave'],[3,'Gust of Wind','Shatter'],[5,'Call Lightning','Sleet Storm'],[7,'Control Water','Ice Storm'],[9,'Destructive Wave','Insect Plague']],
    'trickery-domain':[[1,'Charm Person','Disguise Self'],[3,'Mirror Image','Pass without Trace'],[5,'Blink','Dispel Magic'],[7,'Dimension Door','Polymorph'],[9,'Dominate Person','Modify Memory']],
    'war-domain':[[1,'Divine Favor','Shield of Faith'],[3,'Magic Weapon','Spiritual Weapon'],[5,'Crusader’s Mantle','Spirit Guardians'],[7,'Freedom of Movement','Stoneskin'],[9,'Flame Strike','Hold Monster']],
    oathbreaker:[[3,'Hellish Rebuke','Inflict Wounds'],[5,'Crown of Madness','Darkness'],[9,'Animate Dead','Bestow Curse'],[13,'Blight','Confusion'],[17,'Contagion','Dominate Person']],
    crown:[[3,'Command','Compelled Duel'],[5,'Warding Bond','Zone of Truth'],[9,'Aura of Vitality','Spirit Guardians'],[13,'Banishment','Guardian of Faith'],[17,'Circle of Power','Geas']],
    conquest:[[3,'Armor of Agathys','Command'],[5,'Hold Person','Spiritual Weapon'],[9,'Bestow Curse','Fear'],[13,'Dominate Beast','Stoneskin'],[17,'Cloudkill','Dominate Person']],
    redemption:[[3,'Sanctuary','Sleep'],[5,'Calm Emotions','Hold Person'],[9,'Counterspell','Hypnotic Pattern'],[13,'Otiluke’s Resilient Sphere','Stoneskin'],[17,'Hold Monster','Wall of Force']],
    glory:[[3,'Guiding Bolt','Heroism'],[5,'Enhance Ability','Magic Weapon'],[9,'Haste','Protection from Energy'],[13,'Compulsion','Freedom of Movement'],[17,'Commune','Flame Strike']],
    watchers:[[3,'Alarm','Detect Magic'],[5,'Moonbeam','See Invisibility'],[9,'Counterspell','Nondetection'],[13,'Aura of Purity','Banishment'],[17,'Hold Monster','Scrying']]
  });
  Object.assign(grantTables['2024'],{
    glory:[[3,'Guiding Bolt','Heroism'],[5,'Enhance Ability','Magic Weapon'],[9,'Haste','Protection from Energy'],[13,'Compulsion','Freedom of Movement'],[17,'Legend Lore','Yolande’s Regal Presence']],
    'light-domain':[[3,'Burning Hands','Faerie Fire','Scorching Ray','See Invisibility'],[5,'Daylight','Fireball'],[7,'Arcane Eye','Wall of Fire'],[9,'Flame Strike','Scrying']],
    'trickery-domain':[[3,'Charm Person','Disguise Self','Invisibility','Pass without Trace'],[5,'Hypnotic Pattern','Nondetection'],[7,'Confusion','Dimension Door'],[9,'Dominate Person','Modify Memory']],
    'war-domain':[[3,'Guiding Bolt','Shield of Faith','Magic Weapon','Spiritual Weapon'],[5,'Crusader’s Mantle','Spirit Guardians'],[7,'Fire Shield','Freedom of Movement'],[9,'Hold Monster','Steel Wind Strike']],
    archfey:[[3,'Calm Emotions','Faerie Fire','Misty Step','Phantasmal Force','Sleep'],[5,'Blink','Plant Growth'],[7,'Dominate Beast','Greater Invisibility'],[9,'Dominate Person','Seeming']],
    celestial:[[3,'Aid','Cure Wounds','Guiding Bolt','Lesser Restoration','Light','Sacred Flame'],[5,'Daylight','Revivify'],[7,'Guardian of Faith','Wall of Fire'],[9,'Greater Restoration','Summon Celestial']],
    'great-old-one':[[3,'Detect Thoughts','Dissonant Whispers','Phantasmal Force','Tasha’s Hideous Laughter'],[5,'Clairvoyance','Hunger of Hadar'],[7,'Confusion','Summon Aberration'],[9,'Modify Memory','Telekinesis']]
  });
  const spellKey=name=>String(name||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
  function automaticGrants(p,catalogue=[]){
    if(!p)return[];
    const names=[];
    if(p.edition==='2024'&&p.classId==='paladin'){if(p.level>=2)names.push('Divine Smite');if(p.level>=5)names.push('Find Steed');}
    if(p.edition==='2024'&&p.classId==='ranger')names.push('Hunter’s Mark');
    if(p.edition==='2024'&&p.classId==='warlock'&&p.level>=9)names.push('Contact Other Plane');
    const subclass=String(p.subclassId||'').replace(/-2024$/,'').replace(/-patron$/,'').replace('draconic-sorcery','draconic-bloodline');
    const tableEdition=String(p.subclassId||'').endsWith('-2024')?'2024':'2014';
    for(const [minimum,...spells] of grantTables[tableEdition]?.[subclass]||[])if(p.level>=Math.max(minimum,p.edition==='2024'?3:1))names.push(...spells);
    const seen=new Set();
    return names.flatMap(name=>{const key=spellKey(name);if(seen.has(key))return[];seen.add(key);const spell=catalogue.find(s=>spellKey(s.name)===key&&s.edition===p.edition)||catalogue.find(s=>spellKey(s.name)===key&&s.edition===tableEdition);return spell?[{...spell,grantSource:p.classId+' / '+(p.subclassId||'class')}]:[];});
  }
  function castingStats(p,derived,adjustments={}){
    const modifier=Number(derived?.mods?.[p?.ability]||0),pb=Number(derived?.pb||0);
    return {ability:p?.ability||'',modifier,attack:pb+modifier+(Number(adjustments.spellAttackBonus)||0),dc:8+pb+modifier+(Number(adjustments.spellDCBonus)||0)};
  }
  function selectionCounts(p,rows,catalogue=[]){
    const ordinary=countedSelections(p,rows,catalogue);
    return {cantrips:ordinary.filter(s=>s.level===0).length,leveled:ordinary.filter(s=>s.level>0).length,prepared:ordinary.filter(s=>s.level>0&&s.prepared).length,automatic:rows.filter(s=>s.level>0&&!ordinary.includes(s)).length};
  }
  function countedSelections(p,rows,catalogue=[]){const ids=new Set(automaticGrants(p,catalogue).map(s=>s.id));return rows.filter(s=>!ids.has(s.catalogId));}

  function isPreparedToggleUseful(p){
    return !!p && (p.mode==='prepared'||p.mode==='spellbook');
  }
  function modeLabel(p){
    if(!p)return'';
    if(p.mode==='known')return'Spells known';
    if(p.mode==='fixed-prepared')return'Spells available (change on level-up)';
    if(p.mode==='spellbook')return'Spellbook / prepared';
    if(p.mode==='prepared')return'Prepared spells';
    return'Spells';
  }

  return {castingStats,selectionCounts,automaticGrants,countedSelections,grantTables,profile,profiles,classEntries,maxSpellLevel,isPreparedToggleUseful,modeLabel,ability,labels};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpellcasting;
