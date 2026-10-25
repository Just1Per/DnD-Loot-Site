'use strict';
/* Attack-action counts are derived from actual class levels, never added across classes.
 * These counts do not multiply damage or grant attacks to a spell/Bonus Action/Reaction. */
var CharacterAttackProgression=(()=>{
  const Choices=typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices');
  const names={barbarian:'Barbarian',fighter:'Fighter',monk:'Monk',paladin:'Paladin',ranger:'Ranger',artificer:'Artificer',bard:'Bard',wizard:'Wizard',warlock:'Warlock'};
  const subclasses=Object.freeze(Object.fromEntries([
    ['valor','bard','College of Valor','2014','PHB',6],
    ['swords','bard','College of Swords','2014','XGE',6],
    ['valor-2024','bard','College of Valor','2024','PHB24',6],
    ['bladesinging','wizard','Bladesinging','2014','SCAG',6],
    ['bladesinger-frhof','wizard','Bladesinger','2024','FRHOF',6],
    ['armorer-legacy','artificer','Armorer','2014','TCE',5,'tce'],
    ['battle-smith-legacy','artificer','Battle Smith','2014','ERLW',5,'tce'],
    ['armorer-efota','artificer','Armorer','2024','EFOTA',5,'efa'],
    ['battle-smith-efota','artificer','Battle Smith','2024','EFOTA',5,'efa']
  ].map(([id,classId,name,edition,source,minimum,artificerSource])=>[id,Object.freeze({id,classId,name,edition,source,minimum,artificerSource})])));
  const integer=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
  function derive(data,level=1){
    const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},local={...data,adobe:stored},rows=Array.isArray(stored.classLevels)&&stored.classLevels.length?stored.classLevels:[{classId:data.build?.classId,level}],reports=[],seen=new Set();let remaining=Math.max(1,Math.min(20,integer(level,1)));
    for(const raw of rows){
      if(!raw||typeof raw!=='object')continue;const actual=Math.min(remaining,Math.max(0,integer(raw.level)));remaining-=actual;if(!actual||seen.has(raw.classId))continue;seen.add(raw.classId);const classId=raw.classId;
      const add=(count,name='Extra Attack',scope='normal',source='')=>reports.push({classId,className:names[classId]||classId,level:actual,count,name,scope,source});
      if(classId==='fighter'&&actual>=5)add(actual>=20?4:actual>=11?3:2);
      else if(['barbarian','monk','paladin','ranger'].includes(classId)&&actual>=5)add(2);
      const sub=Object.hasOwn(subclasses,raw.subclassId||'')?subclasses[raw.subclassId]:null;
      if(sub&&sub.classId===classId&&actual>=sub.minimum&&(edition==='2024'||sub.edition==='2014')){
        const source=classId==='artificer'?Choices.artificerSource(local):null;
        if(!source||source.eligible&&source.id===sub.artificerSource)add(2,'Extra Attack · '+sub.name,'normal',sub.source);
      }
      if(classId==='warlock'&&actual>=5){
        const groups=Choices.status(local,{...raw,level:actual},edition),invocations=groups.find(row=>row.id==='eldritch-invocations')?.valid||[],pact=edition==='2024'?invocations.includes('pact-of-the-blade'):groups.find(row=>row.id==='pact-boon')?.valid.includes('pact-of-the-blade');
        if(pact&&invocations.includes('thirsting-blade')){const devouring=edition==='2024'&&actual>=12&&invocations.includes('devouring-blade');add(devouring?3:2,devouring?'Devouring Blade':'Thirsting Blade','pact','Warlock '+edition);}
      }
    }
    const count=Math.max(1,...reports.filter(row=>row.scope==='normal').map(row=>row.count)),pactWeaponCount=Math.max(count,...reports.filter(row=>row.scope==='pact').map(row=>row.count));
    return{count,pactWeaponCount,reports,visible:count>1||pactWeaponCount>1};
  }
  function describe(result){
    if(!result?.visible)return[];
    const sources=result.reports.filter(row=>row.scope==='normal'&&row.count===result.count).map(row=>row.className+' '+row.level+(row.source?' · '+row.source:''));
    const lines=['Attack action: '+result.count+' attack'+(result.count===1?'':'s')+' on your turn.'];
    if(sources.length)lines.push(sources.join(' / ')+' · Extra Attack.');
    if(result.pactWeaponCount>result.count){const sources=result.reports.filter(row=>row.scope==='pact'&&row.count===result.pactWeaponCount).map(row=>row.name+' · Warlock '+row.level);lines.push('With your pact weapon: '+result.pactWeaponCount+' attacks ('+sources.join(' / ')+').');}
    lines.push('Extra Attack sources do not stack. Resolve each attack separately; Loading and special actions can impose their own limits.');
    return lines;
  }
  return{subclasses,derive,describe};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAttackProgression;
