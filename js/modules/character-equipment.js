/* Equipment mechanics are explicit DM data; descriptions are never executable rules.
   Factual weapon/armor statistics: SRD 5.1 / 5.2. See docs/character-equipment.md. */
var CharacterEquipment = (() => {
  const n=(v,min=-30,max=30)=>Math.max(min,Math.min(max,Math.trunc(Number(v)||0)));
  const text=v=>String(v??'').slice(0,200);
  const rows=[
    ['Club','simple','melee','1d4','bludgeoning','light','','','Slow'],
    ['Dagger','simple','melee','1d4','piercing','finesse light thrown','20/60','','Nick'],
    ['Greatclub','simple','melee','1d8','bludgeoning','twoHanded','','','Push'],
    ['Handaxe','simple','melee','1d6','slashing','light thrown','20/60','','Vex'],
    ['Javelin','simple','melee','1d6','piercing','thrown','30/120','','Slow'],
    ['Light Hammer','simple','melee','1d4','bludgeoning','light thrown','20/60','','Nick'],
    ['Mace','simple','melee','1d6','bludgeoning','','','','Sap'],
    ['Quarterstaff','simple','melee','1d6','bludgeoning','','','1d8','Topple'],
    ['Sickle','simple','melee','1d4','slashing','light','','','Nick'],
    ['Spear','simple','melee','1d6','piercing','thrown','20/60','1d8','Sap'],
    ['Dart','simple','ranged','1d4','piercing','finesse thrown','20/60','','Vex'],
    ['Light Crossbow','simple','ranged','1d8','piercing','ammunition loading twoHanded','80/320','','Slow'],
    ['Shortbow','simple','ranged','1d6','piercing','ammunition twoHanded','80/320','','Vex'],
    ['Sling','simple','ranged','1d4','bludgeoning','ammunition','30/120','','Slow'],
    ['Battleaxe','martial','melee','1d8','slashing','','','1d10','Topple'],
    ['Flail','martial','melee','1d8','bludgeoning','','','','Sap'],
    ['Glaive','martial','melee','1d10','slashing','heavy reach twoHanded','','','Graze'],
    ['Greataxe','martial','melee','1d12','slashing','heavy twoHanded','','','Cleave'],
    ['Greatsword','martial','melee','2d6','slashing','heavy twoHanded','','','Graze'],
    ['Halberd','martial','melee','1d10','slashing','heavy reach twoHanded','','','Cleave'],
    ['Lance','martial','melee','1d10','piercing','heavy reach twoHanded','','','Topple'],
    ['Longsword','martial','melee','1d8','slashing','','','1d10','Sap'],
    ['Maul','martial','melee','2d6','bludgeoning','heavy twoHanded','','','Topple'],
    ['Morningstar','martial','melee','1d8','piercing','','','','Sap'],
    ['Pike','martial','melee','1d10','piercing','heavy reach twoHanded','','','Push'],
    ['Rapier','martial','melee','1d8','piercing','finesse','','','Vex'],
    ['Scimitar','martial','melee','1d6','slashing','finesse light','','','Nick'],
    ['Shortsword','martial','melee','1d6','piercing','finesse light','','','Vex'],
    ['Trident','martial','melee','1d8','piercing','thrown','20/60','1d10','Topple'],
    ['Warhammer','martial','melee','1d8','bludgeoning','','','1d10','Push'],
    ['War Pick','martial','melee','1d8','piercing','','','1d10','Sap'],
    ['Whip','martial','melee','1d4','slashing','finesse reach','','','Slow'],
    ['Blowgun','martial','ranged','1','piercing','ammunition loading','25/100','','Vex'],
    ['Hand Crossbow','martial','ranged','1d6','piercing','light ammunition loading','30/120','','Vex'],
    ['Heavy Crossbow','martial','ranged','1d10','piercing','heavy ammunition loading twoHanded','100/400','','Push'],
    ['Longbow','martial','ranged','1d8','piercing','heavy ammunition twoHanded','150/600','','Slow'],
    ['Musket','martial','ranged','1d12','piercing','ammunition loading twoHanded','40/120','','Slow'],
    ['Pistol','martial','ranged','1d10','piercing','ammunition loading','30/90','','Vex'],
    ['Net','martial','ranged','','','special thrown','5/15','','']
  ];
  const key=s=>s.toLowerCase().replaceAll(' ','-');
  const weapons=Object.fromEntries(rows.map(([name,group,rangeType,damage,damageType,props,range,versatile,mastery])=>[key(name),{name,group,rangeType,damage,damageType,props:props.split(' ').filter(Boolean),range,versatile,mastery}]));
  const armor=Object.fromEntries([
    ['Padded','light',11,0,true],['Leather','light',11,0,false],['Studded Leather','light',12,0,false],
    ['Hide','medium',12,0,false],['Chain Shirt','medium',13,0,false],['Scale Mail','medium',14,0,true],['Breastplate','medium',14,0,false],['Half Plate','medium',15,0,true],
    ['Ring Mail','heavy',14,0,true],['Chain Mail','heavy',16,13,true],['Splint','heavy',17,15,true],['Plate','heavy',18,15,true]
  ].map(([name,group,baseAC,strength,stealth])=>[key(name),{name,group,baseAC,strength,stealth}]));
  function normalize(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    return {version:1,kind:['none','weapon','armor','shield','accessory'].includes(raw.kind)?raw.kind:'none',base:Object.hasOwn(weapons,raw.base)||Object.hasOwn(armor,raw.base)?raw.base:'',edition:['2014','2024'].includes(raw.edition)?raw.edition:'character',acBonus:n(raw.acBonus),attackBonus:n(raw.attackBonus),damageBonus:n(raw.damageBonus),damage:text(raw.damage),damageType:text(raw.damageType),extraDamage:text(raw.extraDamage),notes:text(raw.notes)};
  }
  function infer(item={}) {
    if(item.mechanics)return {...normalize(item.mechanics),inferred:false};
    let name=String(item.name||'').trim().toLowerCase(),bonus=0;
    const match=name.match(/^(.*?)\s*,?\s*\+([123])$/);
    if(match){name=match[1].replace(/,\s*$/,'').trim();bonus=Number(match[2]);}
    name=name.replace(/ armour$| armor$/,'');
    const id=key(name),kind=Object.hasOwn(weapons,id)?'weapon':Object.hasOwn(armor,id)?'armor':name==='shield'?'shield':'none';
    return {...normalize({kind,base:id,acBonus:kind==='armor'||kind==='shield'?bonus:0,attackBonus:kind==='weapon'?bonus:0,damageBonus:kind==='weapon'?bonus:0}),inferred:kind!=='none'};
  }
  function profile(m,edition) {
    const e=m.edition==='character'?edition:m.edition;
    if(m.kind==='armor')return armor[m.base]||null;
    if(m.kind!=='weapon'||!weapons[m.base])return null;
    const w=structuredClone(weapons[m.base]);
    if(e==='2014'){
      w.mastery='';
      if(m.base==='lance'){w.damage='1d12';w.props=['reach','special'];}
      if(m.base==='trident'){w.damage='1d6';w.versatile='1d8';}
      if(m.base==='war-pick')w.versatile='';
    }else if(m.base==='net'){w.rangeType='gear';w.damage='';w.props=['special'];w.range='15';}
    w.damage=m.damage||w.damage;w.damageType=m.damageType||w.damageType;
    return {...w,edition:e};
  }
  function choices(raw={}) {
    const seen=new Set();
    return {acMode:'equipment',acAdjustment:0,loadout:(Array.isArray(raw?.loadout)?raw.loadout:[]).filter(v=>v&&typeof v.id==='string'&&v.id.length<=200&&!seen.has(v.id)&&seen.add(v.id)).slice(0,200).map(v=>({id:v.id,equipped:v.equipped===true,attuned:v.attuned===true,ability:['str','dex','con','int','wis','cha'].includes(v.ability)?v.ability:'auto',proficiency:['yes','no'].includes(v.proficiency)?v.proficiency:'auto',mode:['twoHanded','thrown','offhand','mounted'].includes(v.mode)?v.mode:'normal'}))};
  }
  function trained(w,profs) {
    const entries=profs.map(p=>p.toLowerCase());
    return entries.some(p=>p===w.name.toLowerCase()||p===w.name.toLowerCase()+'s'||p===w.group+' weapons'||w.group==='martial'&&((p==='martial weapons with the light property'&&w.props.includes('light'))||(p==='martial weapons with the finesse or light property'&&(w.props.includes('light')||w.props.includes('finesse')))));
  }
  function derive(data,stats,loot=[]) {
    const c=choices(data.equipmentState),warnings=[],sources=[],attacks=[],seen=new Set(),names=new Set();
    const owned=loot.filter(e=>e&&Number(e.quantity)>0&&typeof e.id==='string'&&!seen.has(e.id)&&seen.add(e.id));
    const entries=owned.map(e=>({entry:e,item:e.item||{},choice:c.loadout.find(v=>v.id===e.id)||{id:e.id,equipped:false,attuned:false,ability:'auto',proficiency:'auto',mode:'normal'},mechanics:infer(e.item)}));
    let armorEntry=null,shieldEntry=null,attuned=0,bonus=0;
    // Only owned items can consume an attunement slot. Quantity never multiplies bonuses.
    for(const r of entries){
      r.profile=profile(r.mechanics,data.build.edition);
      r.requiresAttunement=(typeof CharacterMagicItems!=='undefined'&&CharacterMagicItems.requiresAttunement(r.item))||!!r.item.attunement;
      r.magicActive=!r.requiresAttunement;
      if(r.requiresAttunement&&r.choice.attuned){attuned++;r.magicActive=attuned<=3;if(!r.magicActive)warnings.push(r.item.name+': exceeds three attunement slots; magic inactive.');}
      r.active=r.choice.equipped;
      if(!r.active)continue;
      const kind=r.mechanics.kind;
      if(kind==='armor'){
        if(armorEntry||!r.profile){r.active=false;warnings.push(r.item.name+': only one valid suit of armor can apply.');continue;}
        armorEntry=r;
      }
      if(kind==='shield'){
        if(shieldEntry){r.active=false;warnings.push(r.item.name+': only one shield can apply.');continue;}
        shieldEntry=r;
      }
      const name=String(r.item.name||r.entry.itemId).trim().toLowerCase();
      if(r.magicActive&&r.mechanics.acBonus){
        if(names.has(name)){warnings.push(r.item.name+': duplicate item AC bonus ignored.');}
        else {bonus+=r.mechanics.acBonus;sources.push({name:r.item.name,value:r.mechanics.acBonus});names.add(name);}
      }
      if(r.requiresAttunement&&!r.magicActive)warnings.push(r.item.name+': magical bonuses require attunement.');
    }
    let base=10+stats.mods.dex,baseLabel='Unarmored: 10 + DEX';
    if(armorEntry){
      const p=armorEntry.profile;
      base=p.baseAC+(p.group==='heavy'?0:p.group==='medium'?Math.min(2,stats.mods.dex):stats.mods.dex);
      baseLabel=p.name;
    } else {
      const adobe=data.rulesChoices?.grants?.__adobe?.data||data.adobe||{};
      const classLevels=(Array.isArray(adobe.classLevels)&&adobe.classLevels.length?adobe.classLevels:[{classId:data.build?.classId,level:1,subclassId:''}]).filter(Boolean);
      const hasClass=id=>classLevels.some(entry=>entry.classId===id&&Number(entry.level||0)>=1);
      const subclass=(id,sub,min=1)=>classLevels.some(entry=>entry.classId===id&&entry.subclassId===sub&&Number(entry.level||0)>=min);
      const alternatives=[{value:10+stats.mods.dex,label:'Unarmored: 10 + DEX',shield:true}];
      const race=stats.effects?.race||(typeof CharacterRules!=='undefined'?CharacterRules.races?.[data.build?.race]:null);
      if(race?.naturalArmor){
        const ability=race.naturalArmor.ability,mod=ability?Number(stats.mods?.[ability]||0):0;
        alternatives.push({value:Number(race.naturalArmor.base||10)+mod,label:(race.name||'Racial')+' natural armor',shield:true});
      }
      if(hasClass('barbarian'))alternatives.push({value:10+stats.mods.dex+stats.mods.con,label:'Barbarian Unarmored Defense',shield:true});
      if(hasClass('monk')&&!shieldEntry)alternatives.push({value:10+stats.mods.dex+stats.mods.wis,label:'Monk Unarmored Defense',shield:false});
      if(data.build?.edition==='2014'&&subclass('sorcerer','draconic-bloodline',1))alternatives.push({value:13+stats.mods.dex,label:'Draconic Resilience',shield:true});
      if(data.build?.edition==='2024'&&subclass('sorcerer','draconic-bloodline',3))alternatives.push({value:10+stats.mods.dex+stats.mods.cha,label:'Draconic Resilience',shield:true});
      const best=alternatives.sort((a,b)=>b.value-a.value)[0];
      base=best.value;baseLabel=best.label;
    }
    const profs=stats.effects.proficiencies;
    if(armorEntry){
      const p=armorEntry.profile;
      if(!profs.some(v=>v.toLowerCase()===p.group+' armor'))warnings.push(p.name+': armor training not found; check STR/DEX penalties and spellcasting restrictions.');
      if(p.stealth)warnings.push(p.name+': disadvantage on Stealth.');
      if(p.strength>stats.scores.str)warnings.push(p.name+': strength requirement not met; apply speed penalty unless exempt.');
    }
    let shield=shieldEntry?2:0;
    const raceForAC=stats.effects?.race||(typeof CharacterRules!=='undefined'?CharacterRules.races?.[data.build?.race]:null);
    if(raceForAC?.acBonus){
      const condition=raceForAC.acBonusCondition||'always',heavy=armorEntry?.profile?.group==='heavy';
      if(condition==='always'||condition==='not-heavy'&&!heavy)bonus+=Number(raceForAC.acBonus)||0;
    }
    if(shieldEntry&&!profs.some(v=>v.toLowerCase()==='shields')){
      warnings.push('Shield training not found'+(data.build.edition==='2024'?'; shield AC is inactive.':'; check armor penalties.'));
      if(data.build.edition==='2024'){shield=0;if(shieldEntry.magicActive){const source=sources.find(s=>s.name===shieldEntry.item.name);if(source){bonus-=source.value;sources.splice(sources.indexOf(source),1);}}}
    }
    for(const r of entries){
      const w=r.profile,m=r.mechanics,ch=r.choice;
      if(m.kind!=='weapon'||!w)continue;
      const notes=[];
      let ability=ch.ability==='auto'?(w.props.includes('finesse')?(stats.mods.dex>stats.mods.str?'dex':'str'):w.rangeType==='ranged'?'dex':'str'):ch.ability;
      let useTwo=w.props.includes('twoHanded')||ch.mode==='twoHanded'&&!!w.versatile;
      if(m.base==='lance')useTwo=ch.mode!=='mounted';
      const isThrown=ch.mode==='thrown'&&w.props.includes('thrown');
      const useVersatile=ch.mode==='twoHanded'&&w.versatile&&!isThrown;
      const trainedAuto=trained(w,profs),proficient=ch.proficiency==='yes'||ch.proficiency!=='no'&&trainedAuto;
      const offhand=ch.mode==='offhand'&&w.props.includes('light');
      const ab=stats.mods[ability],extra=offhand?Math.min(0,ab):ab;
      const attack=ab+(proficient?stats.pb:0)+(r.magicActive?m.attackBonus:0)+(w.rangeType==='ranged'?stats.feats.rangedBonus:0);
      const damageBonus=extra+(r.magicActive?m.damageBonus:0);
      const damage=w.damage?`${useVersatile?w.versatile:w.damage}${damageBonus?' '+(damageBonus<0?'−':'+')+' '+Math.abs(damageBonus):''} ${w.damageType}${r.magicActive&&m.extraDamage?' + '+m.extraDamage:''}`:'Special action — resolve manually';
      if(useTwo&&shieldEntry)notes.push('Two hands required: stow shield before attacking.');
      if(w.props.includes('ammunition'))notes.push('Requires ammunition; consumption is manual.');
      if(w.props.includes('loading'))notes.push('Loading limits attacks.');
      if(w.props.includes('heavy')&&(w.edition==='2024'?stats.scores[w.rangeType==='ranged'?'dex':'str']<13:stats.effects.size==='Small'))notes.push('Heavy: disadvantage.');
      if(m.base==='lance')notes.push(w.edition==='2014'?'Disadvantage against targets within 5 ft; two hands unless mounted.':'Two hands unless mounted.');
      if(offhand)notes.push('Extra Light-weapon attack: confirm eligibility; positive ability damage omitted.');
      if(m.base==='net')notes.push(w.edition==='2024'?'2024 Net uses an action/attack replacement and a save; no weapon attack roll.':'2014 Net special attack restrictions apply.');
      if(w.mastery)notes.push('Mastery: '+w.mastery+' (only if unlocked; effect manual).');
      attacks.push({id:r.entry.id,name:r.item.name,equipped:r.active,ability,proficient,attack:w.rangeType==='gear'?null:attack,damage,range:isThrown||w.rangeType!=='melee'?w.range:(w.props.includes('reach')?'10':'5')+' ft',properties:w.props.join(', '),notes:[...notes,m.notes].filter(Boolean),edition:w.edition});
    }
    // Defense follows the owned armor actually worn, independent of the manual feat reminder.
    const defense=armorEntry&&stats.feats.reports.some(r=>r.def.name==='Defense'&&r.automated?.length)?1:0;
    return {entries,attacks,warnings,attuned,base,baseLabel,shield,bonus,defense,adjustment:0,sources,ac:base+shield+bonus+defense};
  }
  return {weapons,armor,normalize,infer,profile,choices,derive};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterEquipment;
