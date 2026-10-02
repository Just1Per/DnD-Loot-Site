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

  function isPreparedToggleUseful(p){
    return !!p && (p.mode==='prepared'||p.mode==='spellbook');
  }
  function modeLabel(p){
    if(!p)return'';
    if(p.mode==='known')return'Spells known';
    if(p.mode==='fixed-prepared')return'Prepared list (change on level-up)';
    if(p.mode==='spellbook')return'Spellbook / prepared';
    if(p.mode==='prepared')return'Prepared spells';
    return'Spells';
  }

  return {profile,profiles,classEntries,maxSpellLevel,isPreparedToggleUseful,modeLabel,ability,labels};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpellcasting;
