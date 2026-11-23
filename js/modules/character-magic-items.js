'use strict';
/* Adobe/MPMB magic-item bridge.
   The source reference is mechanical metadata only: no Acrobat execution and no long item prose.
   Items still require the player to mark them Equipped / worn, and attunement is enforced here
   when the Adobe reference marks a supported item as requiring it. */
var CharacterMagicItems=(()=>{
  const Pinned=typeof CharacterPinnedItems!=='undefined'?CharacterPinnedItems:require('./character-pinned-items');
  const ItemChoices=typeof CharacterMagicItemChoices!=='undefined'?CharacterMagicItemChoices:require('./character-magic-item-choices');
  const E=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
  const priorInfer=E.infer.bind(E);
  const reference=typeof CharacterMagicItemReference!=='undefined'?CharacterMagicItemReference:typeof require==='function'?require('./character-magic-item-data'):{names:[],automation:{}};
  const clean=value=>String(value||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9+]+/g,' ').replace(/\s+/g,' ').trim();
  const knownNames=new Set((reference.names||[]).map(clean));
  const rules=new Map(Object.entries(reference.automation||{}).map(([name,rule])=>[clean(name),rule]));
  const resistanceTypes=['acid','cold','fire','force','lightning','necrotic','poison','psychic','radiant','thunder'];
  // Holding/wearing uses the explicit Equipped control. Spell scope is independent of attunement class.
  const castingFamilies={
    'all purpose tool':['artificer'], 'arcane grimoire':['wizard'], 'bloodwell vial':['sorcerer'],
    'moon sickle':['druid','ranger'], 'rhythm maker s drum':['bard'], 'rod of the pact keeper':['warlock'],
    'amulet of the devout':null, 'fate dealer s deck':null, 'wand of the war mage':null,
    'reveler s concertina':['bard'], 'robe of the archmagi':null, 'staff of power':null, 'staff of the magi':null,
    'staff of the woodlands':null, 'skyblinder staff':null, 'staff of the ivory claw':null, 'voyager staff':null
  };
  const passiveStats=new Set(['ring of protection','cloak of protection','robe of stars','staff of power','stone of good luck','netherese ring of protection']);
  const passiveImmunities=new Set(['efreeti chain','matalotok','periapt of proof against poison','ring of winter']);
  function classes(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},rows=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],out={},seen=new Set();let left=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    for(const row of rows){const amount=Math.min(left,Math.max(0,Math.trunc(Number(row.level)||0)));left-=amount;if(amount&&typeof row.classId==='string'&&!seen.has(row.classId)){out[row.classId]=amount;seen.add(row.classId);}}return out;
  }
  function eligibility(data,fact,effects,level){
    if(!fact?.reqAttuneTags?.length)return true;
    const selected=classes(data,level),C=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null);
    if((selected.artificer||0)>=14&&C?.artificerSource(data).id==='tce')return true;
    const caster=Object.entries(selected).some(([id,n])=>['bard','cleric','druid','sorcerer','warlock','wizard','artificer'].includes(id)||['paladin','ranger'].includes(id)&&n>=(data.build?.edition==='2024'?1:2)||['fighter','rogue'].includes(id)&&n>=3&&((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classLevels||[]).some(row=>row.classId===id&&/eldritch-knight|arcane-trickster/.test(row.subclassId||'')))||!!effects.innate?.length||effects.featSpellcasting===true||!!data.spells?.length;
    return fact.reqAttuneTags.some(group=>Object.entries(group).every(([key,value])=>key==='class'?!!selected[String(value).split('|')[0].toLowerCase()]:key==='spellcasting'?value===true&&caster:false));
  }
  function automationCoverage(fact={}){
    const family=Pinned.key(fact.spellBonusFamily||fact.name).replace(/^[123] /,'');
    return{spellScope:Object.hasOwn(castingFamilies,family)?castingFamilies[family]||['global']:[],passiveSaveChecks:passiveStats.has(family),passiveImmunities:passiveImmunities.has(family)};
  }
  function spellBonuses(effects={},classId=''){
    const all=effects.itemSpellBonuses||{},global=all.global||{},specific=all[classId]||{};
    return {attack:(global.attack||0)+(specific.attack||0),dc:(global.dc||0)+(specific.dc||0)};
  }

  function variantRule(name){
    const key=clean(name);
    if(rules.has(key))return rules.get(key);
    for(const type of resistanceTypes){
      if(key===`armor of ${type} resistance`||key===`armor of resistance ${type}`)return {attunement:true,resistances:[type[0].toUpperCase()+type.slice(1)]};
      if(key===`ring of ${type} resistance`||key===`ring of resistance ${type}`)return {attunement:true,resistances:[type[0].toUpperCase()+type.slice(1)]};
    }
    return null;
  }
  function info(itemOrName){
    const name=typeof itemOrName==='string'?itemOrName:itemOrName?.name;
    const key=clean(name),f=typeof itemOrName==='object'?Pinned.find(itemOrName):null,structured=f?{attunement:!!f.reqAttune,resistances:(f.resist||[]).filter(x=>typeof x==='string').map(x=>x[0].toUpperCase()+x.slice(1)),acBonus:Number(f.bonusAc)||0}:null,rule=variantRule(name)||structured;
    return {key,known:knownNames.has(key)||!!variantRule(name)||!!f&&!!f.rarity&&!['none','unknown'].includes(f.rarity),rule,attunement:!!rule?.attunement};
  }
  function attunementMetadata(value){return value===true||value===1||typeof value==='string'&&/^(?:true\b|yes\b|required\b|requires? attunement(?:\b|$)|by (?:a|an|the)\b|\(requires? attunement\b)/i.test(value.trim());}
  function isMagical(item={}){
    const metadata=info(item),mechanics=E.infer(item),category=String(item.category||'').trim().toLowerCase(),rarity=String(item.rarity||'').replace(/[ -]/g,'').toLowerCase();
    return metadata.known||attunementMetadata(item.attunement)||attunementMetadata(item.reqAttune)||['potion','ring','rod','scroll','staff','wand','wondrous item'].includes(category)||['uncommon','rare','veryrare','legendary','artifact'].includes(rarity)||!!(mechanics.acBonus||mechanics.attackBonus||mechanics.damageBonus||mechanics.extraDamage);
  }
  function requiresAttunement(item={}){
    return attunementMetadata(item.attunement)||attunementMetadata(item.reqAttune)||info(item).attunement||ItemChoices.options(item).some(option=>option.attunement!==false);
  }
  function infer(item={}){
    if(item?.mechanics)return priorInfer(item);
    const rule=info(item).rule;
    const f=Pinned.find(item);if(f?.baseItem){const base=priorInfer({name:f.baseItem.split('|')[0]});if(base.kind!=='none')return{...base,edition:f.edition,attackBonus:Number(f.bonusWeapon||f.bonusWeaponAttack)||base.attackBonus,damageBonus:Number(f.bonusWeapon||f.bonusWeaponDamage)||base.damageBonus,acBonus:Number(f.bonusAc)||base.acBonus};}
    if(rule?.weapon){
      const w=rule.weapon;
      return {...E.normalize({
        kind:'weapon',base:w.base||'',edition:'character',
        acBonus:Number(rule.acBonus||0),attackBonus:Number(w.attackBonus||0),damageBonus:Number(w.damageBonus||0),
        damage:w.damage||'',damageType:w.damageType||'',notes:w.notes||''
      }),inferred:true,source:'Adobe magic-item reference'};
    }
    if(rule?.acBonus&&!rule.conditionalAC){
      return {...E.normalize({kind:'accessory',edition:'character',acBonus:Number(rule.acBonus||0)}),inferred:true,source:'Adobe magic-item reference'};
    }
    return priorInfer(item);
  }

  function activeEntries(data,loot=[],level){
    loot=ItemChoices.project(loot,data?.equipmentState?.loadout);
    const choices=Array.isArray(data?.equipmentState?.loadout)?data.equipmentState.loadout:[];
    const owned=new Map();
    for(const entry of loot||[]){
      if(!entry||Number(entry.quantity)<=0||!entry.id||owned.has(entry.id))continue;
      owned.set(entry.id,entry);
    }
    const attunement=E.attunementState(data,loot,level);
    const result=[];
    for(const choice of choices){
      if(!choice?.id||!choice.equipped||(globalThis.CharacterCompanionEquipment||(typeof require==='function'?require('./character-companion-equipment'):null))?.carrier(data,choice.id)>=0)continue;
      const entry=owned.get(choice.id);if(!entry)continue;
      const item=entry.item||{},meta=info(item),needs=requiresAttunement(item);
      let magicActive=!needs;
      if(needs&&choice.attuned===true){magicActive=attunement.active.has(choice.id);}
      result.push({entry,item,choice,meta,magicActive,needsAttunement:needs});
    }
    return result;
  }
  function addUnique(list,value){
    const key=clean(value);
    if(!key||list.some(v=>clean(v)===key))return;
    list.push(value);
  }
  function apply(data,scores,effects,loot=[],level){
    const active=activeEntries(data,loot,level),reports=[],warnings=[],seen=new Set();
    for(const row of active){
      const rule=row.meta.rule;
      if(!rule||!row.magicActive)continue;
      const itemKey=clean(row.item.name);
      if(seen.has(itemKey))continue;
      seen.add(itemKey);
      const changed=[],abilityChanges=[],fact=Pinned.find(row.item),eligible=eligibility(data,fact,effects,level);
      if(fact&&eligible){
        const family=Pinned.key(fact.spellBonusFamily||row.item.name).replace(/^[123] /,''),attack=Number(fact.bonusSpellAttack)||0,dc=Number(fact.bonusSpellSaveDc)||0;
        if(Object.hasOwn(castingFamilies,family)&&(attack||dc)){
          const targets=castingFamilies[family]||['global'];effects.itemSpellSources||={};
          const previous=effects.itemSpellSources[family]||{attack:0,dc:0};effects.itemSpellSources[family]={attack:Math.max(previous.attack,attack),dc:Math.max(previous.dc,dc),targets};
          changed.push('spell attack '+(attack>=0?'+':'')+attack+' · spell DC '+(dc>=0?'+':'')+dc+' · '+(targets.includes('global')?'all spell sources':targets.join('/')+' spells only'));
        }
        if(passiveStats.has(family))for(const [field,target]of [['bonusSavingThrow','itemSavingThrowBonus'],['bonusAbilityCheck','itemAbilityCheckBonus']]){const value=family==='netherese ring of protection'&&field==='bonusSavingThrow'?1:Number(fact[field]);if(Number.isSafeInteger(value)&&Math.abs(value)<=10&&value){effects[target]=(effects[target]||0)+value;changed.push((field==='bonusSavingThrow'?'saving throws ':'ability checks ')+(value>=0?'+':'')+value);}}
        if(family==='netherese ring of protection')warnings.push('Netherese Ring of Protection: the +4 applies only to avoiding dropping or being disarmed of an item in the ring hand; resolve that check at the table.');
        if(family==='stone of ill luck')warnings.push('Stone of Ill Luck: the DM resolves its apparent luck bonus and concealed curse penalties; no unconditional save/check adjustment is applied.');
        if(passiveImmunities.has(family))for(const value of (fact.immune||[]).filter(value=>typeof value==='string'&&resistanceTypes.includes(value))){effects.immunities||=[];addUnique(effects.immunities,value[0].toUpperCase()+value.slice(1)+' damage');changed.push('immunity: '+value+' damage');}
      }else if(fact&&(fact.bonusSpellAttack||fact.bonusSpellSaveDc||fact.bonusSavingThrow||fact.bonusAbilityCheck))warnings.push(row.item.name+': source requirements are not met or need table review; additional spell/save/check bonuses are inactive.');
      if(rule.abilityBonus)for(const [ability,bonus] of Object.entries(rule.abilityBonus)){
        if(!(ability in scores))continue;
        const before=scores[ability],next=before>20?before:Math.min(20,before+Number(bonus||0));
        if(next!==before){scores[ability]=next;abilityChanges.push({ability,before,after:next});changed.push(`${ability.toUpperCase()} ${before}→${next}`);}
      }
      if(rule.abilityOverride)for(const [ability,value] of Object.entries(rule.abilityOverride)){
        if(!(ability in scores))continue;
        const before=scores[ability],next=Math.max(before,Number(value)||before);
        if(next!==before){scores[ability]=next;abilityChanges.push({ability,before,after:next});changed.push(`${ability.toUpperCase()} ${before}→${next}`);}
      }
      for(const resistance of rule.resistances||[]){addUnique(effects.resistances,resistance);changed.push(`resistance: ${resistance}`);}
      if(rule.darkvision){
        const before=Number(effects.darkvision||0),value=Number(rule.darkvision.value||0);
        effects.darkvision=rule.darkvision.mode==='add-or-set'?(before>0?before+value:value):Math.max(before,value);
        if(effects.darkvision!==before)changed.push(`darkvision ${effects.darkvision} ft`);
      }
      if(rule.speed?.walk){
        const value=Number(rule.speed.walk.value||0),before=Number(effects.speed||0);
        effects.speed=Math.max(before,value);if(effects.speed!==before)changed.push(`walking speed ${effects.speed} ft`);
      }
      if(rule.speed?.swim){
        const value=Number(rule.speed.swim.value||0),before=Number(effects.swim||0);
        effects.swim=Math.max(before,value);if(effects.swim!==before)changed.push(`swim speed ${effects.swim} ft`);
      }
      if(rule.speed?.climb?.mode==='walking'){
        const before=Number(effects.climb||0),value=Number(effects.speed||0);
        effects.climb=Math.max(before,value);if(effects.climb!==before)changed.push(`climb speed ${effects.climb} ft`);
      }
      if(changed.length)reports.push({name:row.item.name,effects:changed,abilityChanges});
    }
    const overAttuned=active.filter(row=>row.needsAttunement&&row.choice.attuned&&!row.magicActive);
    for(const row of overAttuned)warnings.push(row.item.name+': exceeds '+(E.attunementLimit(data,level)===3?'three':E.attunementLimit(data,level))+' attunement slots; Adobe magic-item effects are inactive.');
    effects.itemSpellBonuses={};for(const source of Object.values(effects.itemSpellSources||{}))for(const target of source.targets){const entry=effects.itemSpellBonuses[target]||={attack:0,dc:0};entry.attack+=source.attack;entry.dc+=source.dc;}
    const primary=spellBonuses(effects,data.build?.classId);effects.itemSpellAttackBonus=primary.attack;effects.itemSpellDCBonus=primary.dc;
    return {active,reports,warnings};
  }
  function augmentGear(data,gear,magic){
    if(!gear||!magic)return gear;
    const result={...gear,sources:[...(gear.sources||[])],warnings:[...(gear.warnings||[])]};
    for(const row of magic.active||[]){
      const conditional=row.meta.rule?.conditionalAC;
      if(!row.magicActive||!conditional)continue;
      if(conditional.when==='no-armor-or-shield'){
        const hasArmor=(gear.entries||[]).some(e=>e.active&&['armor','shield'].includes(e.mechanics?.kind));
        if(hasArmor)continue;
      }
      const bonus=Number(conditional.bonus||0);if(!bonus)continue;
      if(result.sources.some(s=>clean(s.name)===clean(row.item.name)))continue;
      result.bonus=Number(result.bonus||0)+bonus;
      result.ac=Number(result.ac||0)+bonus;
      result.sources.push({name:row.item.name,value:bonus});
    }
    for(const warning of magic.warnings||[])if(!result.warnings.includes(warning))result.warnings.push(warning);
    return result;
  }

  // The host installs the bridge; a plain Node metadata import must not mutate another model.
  if(typeof CharacterEquipment!=='undefined')E.infer=infer;
  return {reference,info,isMagical,requiresAttunement,infer,apply,augmentGear,spellBonuses,automationCoverage};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicItems=CharacterMagicItems;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicItems;
