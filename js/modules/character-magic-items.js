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
  const passiveStats=new Set(['ring of protection','cloak of protection','robe of stars','staff of power','stone of good luck','netherese ring of protection','blackstaff']);
  const passiveImmunities=new Set(['efreeti chain','matalotok','periapt of proof against poison','ring of winter']);
  const namedDefenses={
    'WDMM|shield of the uven rune':{note:'While held and attuned: immunity to Cold damage. Deadly Rebuke spends your Reaction after a melee hit against you to deal 3d6 Necrotic to the attacker, without a save. Bane has one use per Short or Long Rest: Action, fixed DC 17, 1 minute, no Concentration or spell slot. Track its use in Item uses & charges. The eight-hour rune transfer destroys this shield and creates a separately configured weapon; it does not give this shield a +1 weapon bonus.'}
  };
  const defensePolicy=fact=>fact&&namedDefenses[fact.source+'|'+Pinned.key(fact.name)];
  const scopedPassives={
    'CoA|wrought iron tower':{saves:'all',carried:true,ac:2,note:'While attuned and carried: +2 AC and +2 to all saves, including death saves; holding/Equipped is not required. It remains a +3 warhammer. Charges: 10, fully restored at dawn. On an attack, spend charges for +2 Fire damage each on a hit; misses still spend them. After staff damage, a Bonus Action and 1 charge can replace that damage with your total AC. Rulership costs 3 charges: visible chosen creatures within 120 ft, DC 18 Wisdom or Charmed for 8 hours; harm by your side or a contrary command ends that charm. Retain the inherited dawn limit; a successful save also grants 24-hour immunity. Searing Smite costs 1 charge at spell level 6, Fire or Acid, no Concentration and a one-minute duration. Resolve target vulnerability conversion, extra 3d6 Fire against Good creatures, charge spending and recipient HP at the table. The DM assigns two minor beneficial artifact properties and handles the Dis-specific powers and destruction.'},
    'IMR|ioun stone of vitality':{saves:'death',note:'Equipped means the attuned stone is orbiting your head. Only death saves gain +1; stowing the stone ends this benefit.'},
    'LLK|ioun stone self preservation':{saves:'int',note:'Equipped means the attuned stone is orbiting your head. Only Intelligence saves gain +1; stowing the stone ends this benefit.'},
    'CoS|statuette of saint markovia':{saves:'all',alignment:'G',carried:true,note:'A Good-aligned bearer gains +1 to all saves, including death saves. Carrying is enough; no attunement or Equipped selection is needed. A companion carrying it does not benefit its owner.'},
    'VRGR|harkon s bite':{saves:'all',checks:1,note:'While worn and attuned, gain +1 to saves and ability checks. The DM tracks the source’s werewolf curse, which is not removed by unequipping; Remove Curse or Harkon removing the necklace can release its attunement curse.'},
    'RHW|harkon s bite':{saves:'all',checks:1,note:'Humanoid attunement or an eligible Magic Item Savant exception is required. While worn and attuned, gain +1 to saves and ability checks. Its curse persists until Harkon Lukas dies; the DM controls the full-moon werewolf transformation. Unequipping does not remove the curse.'}
  };
  const passivePolicy=fact=>fact&&scopedPassives[fact.source+'|'+Pinned.key(fact.name)];
  // Reviewed named records are source-bound: the two talisman editions have different requirements.
  const namedCasting={
    'WDH|blackstaff':{prerequisite:{key:'item:wdh:blackstaff-heir',label:'The DM confirms I am the rightful Blackstaff heir and its non-weapon powers are functioning.',note:'Keep this unchecked if the staff rejects its owner or loses its non-weapon powers after using its last charge. Wizard eligibility or a valid Magic Item Savant exception, holding and attunement are still required.'},note:'The active staff gives +2 AC, saves and spell attacks while held. Its quarterstaff is +2; use charges explicitly. Dawn restores 2d8 + 4 charges. Last-charge outcomes, sentience, Enchantment checks, statue commands and other triggered powers are table decisions.'},
    "BMT|jester s mask":{ability:'cha',note:'Only spell attacks and save DCs using Charisma gain +3. Marvelous Escape and Topsy-Turvy each recover at dawn; resolve their triggers at the table.'},
    'CM|radiance':{note:'Spell attacks ignore half cover. Its self-only Enhance Ability use recovers at dawn; dim light applies only in darkness.'},
    'AUD|robe of thayan arcana':{note:'When rolling spell damage, treat a damage die showing 1 as 2; this changes rolled dice, not the displayed damage formula.'},
    'KftGV|shard of xeluan':{note:'While carried and attuned, add 4 Strength, to a maximum of 22, using an ability modifier override. On a natural 1, resolve the curse and any existing misfortune at the table; unequipping does not remove the curse.'},
    'DMG|talisman of pure good':{alignment:'G',classes:['cleric','paladin'],note:'The +2 spell attack bonus requires a Good Cleric or Paladin. Touch/carry damage, target alignment and the DC 20 fissure are table decisions; spend 1 of 7 nonrecovering charges and destroy the item after its last charge.'},
    'DMG|talisman of ultimate evil':{alignment:'E',classes:['cleric','paladin'],note:'The +2 spell attack bonus requires an Evil Cleric or Paladin. Touch/carry damage, target alignment and the DC 20 fissure are table decisions; spend 1 of 6 nonrecovering charges and destroy the item after its last charge.'},
    'XDMG|talisman of pure good':{note:'The bonus has no alignment restriction. Resolve Fiend/Undead touch damage and Pure Rebuke at the table: Magic action, 120 ft, DC 20 Dexterity, Fiend/Undead Disadvantage, 4d6 Psychic on a success; spend 1 of 7 nonrecovering charges and destroy the item after its last charge.'},
    'XDMG|talisman of ultimate evil':{note:'The bonus has no class or alignment restriction. Resolve non-Fiend/Undead touch damage and Ultimate End at the table: Magic action, 120 ft, DC 20 Dexterity, Celestial Disadvantage, 4d6 Psychic on a success; spend 1 of 6 nonrecovering charges and destroy the item after its last charge.'}
  };
  const namedPolicy=fact=>namedCasting[fact.source+'|'+Pinned.key(fact.name)];
  const instructions=item=>{const fact=Pinned.find(item);return fact?passivePolicy(fact)?.note||namedPolicy(fact)?.note||defensePolicy(fact)?.note||'':'';};
  const prerequisite=item=>{const fact=Pinned.find(item);return fact?namedPolicy(fact)?.prerequisite||null:null;};
  function prerequisiteConfirmed(data,item){
    const rule=prerequisite(item);if(!rule)return true;
    const value=(data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices?.[rule.key];
    return Array.isArray(value)&&value.length===1&&value[0]==='confirmed';
  }
  function setPrerequisite(data,loot,id,confirmed){
    const entry=(loot||[]).find(row=>row?.id===id&&Number(row.quantity)>0),rule=entry&&prerequisite(entry.item);
    if(!rule||typeof confirmed!=='boolean')throw Error('Choose an available item and explicitly confirm or clear its requirement.');
    const Shared=globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null);
    if(!Shared?.save(data,{[rule.key]:confirmed?['confirmed']:[]}))throw Error('Character choices are full. Remove an unused choice before recording item approval.');
    return true;
  }
  function alignment(value){
    const key=clean(value),values={'lawful good':'G','neutral good':'G','chaotic good':'G',lg:'G',ng:'G',cg:'G',good:'G','lawful evil':'E','neutral evil':'E','chaotic evil':'E',le:'E',ne:'E',ce:'E',evil:'E'};
    return Object.hasOwn(values,key)?values[key]:'';
  }
  function castingPolicy(fact,data,level){
    const policy=namedPolicy(fact);
    if(policy){
      if(policy.alignment&&(alignment(data.alignment)!==policy.alignment||!policy.classes.some(id=>classes(data,level)[id])))return null;
      return {targets:policy.ability?[]:['global'],ability:policy.ability};
    }
    const family=Pinned.key(fact.spellBonusFamily||fact.name).replace(/^[123] /,'');
    return Object.hasOwn(castingFamilies,family)?{targets:castingFamilies[family]||['global']}:null;
  }
  function classes(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},rows=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],out={},seen=new Set();let left=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    for(const row of rows){const amount=Math.min(left,Math.max(0,Math.trunc(Number(row.level)||0)));left-=amount;if(amount&&typeof row.classId==='string'&&!seen.has(row.classId)){out[row.classId]=amount;seen.add(row.classId);}}return out;
  }
  function eligibility(data,fact,effects,level){
    if(fact&&!prerequisiteConfirmed(data,{pinnedItemFacts:fact}))return false;
    if(!fact?.reqAttuneTags?.length)return true;
    const selected=classes(data,level),C=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null);
    if((selected.artificer||0)>=14&&C?.artificerSource(data).id==='tce')return true;
    const caster=Object.entries(selected).some(([id,n])=>['bard','cleric','druid','sorcerer','warlock','wizard','artificer'].includes(id)||['paladin','ranger'].includes(id)&&n>=(data.build?.edition==='2024'?1:2)||['fighter','rogue'].includes(id)&&n>=3&&((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classLevels||[]).some(row=>row.classId===id&&/eldritch-knight|arcane-trickster/.test(row.subclassId||'')))||!!effects.innate?.length||effects.featSpellcasting===true||!!data.spells?.length;
    return fact.reqAttuneTags.some(group=>Object.entries(group).every(([key,value])=>key==='class'?!!selected[String(value).split('|')[0].toLowerCase()]:key==='spellcasting'?value===true&&caster:key==='creatureType'?clean((globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null))?.profile(data.build,level)?.creatureType)===clean(value):key==='alignment'&&namedPolicy(fact)?.alignment?Array.isArray(value)&&value.length===1&&value[0]===alignment(data.alignment):false));
  }
  function automationCoverage(fact={}){
    const family=Pinned.key(fact.spellBonusFamily||fact.name).replace(/^[123] /,'');
    const policy=namedPolicy(fact);
    const passive=passivePolicy(fact);
    return{spellScope:policy?[policy.ability?'ability:'+policy.ability:'global']:Object.hasOwn(castingFamilies,family)?castingFamilies[family]||['global']:[],...(policy?.alignment||policy?.prerequisite?{spellRequirements:{...(policy.alignment?{alignment:policy.alignment,classes:policy.classes}:{}),...(policy.prerequisite?{explicitApproval:policy.prerequisite.key}:{})}}:{}),passiveSaveChecks:passiveStats.has(family)||!!passive,...(passive?{saveCheckScope:{saves:passive.saves,checks:!!passive.checks,carried:!!passive.carried,attunement:!!fact.reqAttune,...(passive.ac?{armorClassBonus:passive.ac}:{}),...(passive.alignment?{alignment:passive.alignment}:{})}}:{}),passiveImmunities:passiveImmunities.has(family)||!!defensePolicy(fact),...(defensePolicy(fact)?{immunityScope:{types:fact.immune,equipped:true,attunement:true},itemUseScope:{max:1,recovery:['short','long'],spell:'Bane',saveDC:17,concentration:false}}:{})};
  }
  function spellBonuses(effects={},classId='',ability=''){
    const all=effects.itemSpellBonuses||{},global=all.global||{},specific=all[classId]||{},byAbility=effects.itemSpellAbilityBonuses?.[ability]||{};
    return {attack:(global.attack||0)+(specific.attack||0)+(byAbility.attack||0),dc:(global.dc||0)+(specific.dc||0)+(byAbility.dc||0)};
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
    if(prerequisite(item)?.key==='item:wdh:blackstaff-heir')return {...E.normalize({kind:'weapon',base:'quarterstaff',attackBonus:2,damageBonus:2}),inferred:true,source:'Reviewed pinned item facts'};
    if(defensePolicy(Pinned.find(item)))return {...E.normalize({kind:'shield',base:'shield',edition:'2014'}),inferred:true,source:'Reviewed pinned shield facts'};
    const rule=info(item).rule;
    const f=Pinned.find(item);if(f?.baseItem){const base=priorInfer({name:f.baseItem.split('|')[0]});if(base.kind!=='none')return{...base,edition:f.edition,attackBonus:Number(f.bonusWeapon||f.bonusWeaponAttack)||base.attackBonus,damageBonus:Number(f.bonusWeapon||f.bonusWeaponDamage)||base.damageBonus,acBonus:passivePolicy(f)?.ac?0:Number(f.bonusAc)||base.acBonus};}
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
  function applyScopedPassives(data,effects,loot,level,reports,warnings){
    const attunement=E.attunementState(data,loot,level),seen=new Set(),owned=new Set(),carrier=globalThis.CharacterCompanionEquipment||(typeof require==='function'?require('./character-companion-equipment'):null);
    for(const entry of ItemChoices.project(loot,data.equipmentState?.loadout)){
      if(!entry?.id||owned.has(entry.id)||!(Number(entry.quantity)>0))continue;owned.add(entry.id);
      const fact=Pinned.find(entry.item),policy=passivePolicy(fact),choice=data.equipmentState?.loadout?.find(row=>row.id===entry.id);
      if(!policy||carrier?.carrier(data,entry.id)>=0||!policy.carried&&!choice?.equipped||fact.reqAttune&&!attunement.active.has(entry.id))continue;
      const family=Pinned.key(fact.name);if(seen.has(family))continue;
      effects.traits||=[];addUnique(effects.traits,fact.name+' · '+policy.note);
      if(!eligibility(data,fact,effects,level)||policy.alignment&&alignment(data.alignment)!==policy.alignment){warnings.push(fact.name+': the bearer does not meet its represented type or alignment requirement; save/check bonuses are inactive.');continue;}
      const value=Number(fact.bonusSavingThrow);if(!Number.isSafeInteger(value)||Math.abs(value)>10)continue;
      seen.add(family);
      if(policy.saves==='all')effects.itemSavingThrowBonus=(effects.itemSavingThrowBonus||0)+value;
      else if(policy.saves==='death')effects.itemDeathSaveBonus=(effects.itemDeathSaveBonus||0)+value;
      else {effects.itemAbilitySaveBonuses||={};effects.itemAbilitySaveBonuses[policy.saves]=(effects.itemAbilitySaveBonuses[policy.saves]||0)+value;}
      if(policy.checks)effects.itemAbilityCheckBonus=(effects.itemAbilityCheckBonus||0)+policy.checks;
      if(policy.ac){effects.itemPassiveAC||=[];effects.itemPassiveAC.push({name:fact.name,value:policy.ac});}
      reports.push({name:fact.name,effects:[(value>=0?'+':'')+value+' '+(policy.saves==='all'?'all saves':policy.saves==='death'?'death saves only':policy.saves.toUpperCase()+' saves only'),...(policy.checks?['+'+policy.checks+' ability checks']:[]),...(policy.ac?['+'+policy.ac+' AC']:[])],abilityChanges:[]});
    }
  }
  function apply(data,scores,effects,loot=[],level){
    const active=activeEntries(data,loot,level),reports=[],warnings=[],seen=new Set(),abilityFloors=new Map();
    for(const row of active){
      const rule=row.meta.rule;
      if(!rule||!row.magicActive)continue;
      const itemKey=clean(row.item.name);
      if(seen.has(itemKey))continue;
      seen.add(itemKey);
      const changed=[],abilityChanges=[],report={name:row.item.name,effects:changed,abilityChanges},fact=Pinned.find(row.item),eligible=eligibility(data,fact,effects,level);row.eligible=eligible;let hasAbilityFloor=false;
      if(fact&&eligible){
        const family=Pinned.key(fact.spellBonusFamily||row.item.name).replace(/^[123] /,''),attack=Number(fact.bonusSpellAttack)||0,dc=Number(fact.bonusSpellSaveDc)||0;
        const policy=castingPolicy(fact,data,level);
        if(policy&&(attack||dc)){
          const {targets,ability}=policy;effects.itemSpellSources||={};
          const previous=effects.itemSpellSources[family]||{attack:0,dc:0};effects.itemSpellSources[family]={attack:Math.max(previous.attack,attack),dc:Math.max(previous.dc,dc),targets,...(ability?{ability}:{})};
          changed.push('spell attack '+(attack>=0?'+':'')+attack+' · spell DC '+(dc>=0?'+':'')+dc+' · '+(ability?ability.toUpperCase()+' spellcasting only':targets.includes('global')?'all spell sources':targets.join('/')+' spells only'));
        }
        if(namedPolicy(fact)?.alignment&&!policy)warnings.push(row.item.name+': the spell attack bonus requires a '+(namedPolicy(fact).alignment==='G'?'Good':'Evil')+' Cleric or Paladin; confirm the character alignment and actual class levels.');
        if(passiveStats.has(family))for(const [field,target]of [['bonusSavingThrow','itemSavingThrowBonus'],['bonusAbilityCheck','itemAbilityCheckBonus']]){const value=family==='netherese ring of protection'&&field==='bonusSavingThrow'?1:Number(fact[field]);if(Number.isSafeInteger(value)&&Math.abs(value)<=10&&value){effects[target]=(effects[target]||0)+value;changed.push((field==='bonusSavingThrow'?'saving throws ':'ability checks ')+(value>=0?'+':'')+value);}}
        if(family==='netherese ring of protection')warnings.push('Netherese Ring of Protection: the +4 applies only to avoiding dropping or being disarmed of an item in the ring hand; resolve that check at the table.');
        if(family==='stone of ill luck')warnings.push('Stone of Ill Luck: the DM resolves its apparent luck bonus and concealed curse penalties; no unconditional save/check adjustment is applied.');
        if(passiveImmunities.has(family)||defensePolicy(fact))for(const value of (fact.immune||[]).filter(value=>typeof value==='string'&&resistanceTypes.includes(value))){effects.immunities||=[];addUnique(effects.immunities,value[0].toUpperCase()+value.slice(1)+' damage');changed.push('immunity: '+value+' damage');}
      }else if(fact&&(fact.bonusSpellAttack||fact.bonusSpellSaveDc||fact.bonusSavingThrow||fact.bonusAbilityCheck))warnings.push(row.item.name+': source requirements are not met or need table review; additional spell/save/check bonuses are inactive.');
      if(fact&&namedPolicy(fact)?.note){effects.traits||=[];addUnique(effects.traits,row.item.name+' · '+namedPolicy(fact).note);}
      if(fact&&defensePolicy(fact)?.note){effects.traits||=[];addUnique(effects.traits,row.item.name+' · '+defensePolicy(fact).note);}
      if(rule.abilityBonus)for(const [ability,bonus] of Object.entries(rule.abilityBonus)){
        if(!(ability in scores))continue;
        const before=scores[ability],next=before>20?before:Math.min(20,before+Number(bonus||0));
        if(next!==before){scores[ability]=next;abilityChanges.push({ability,before,after:next});changed.push(`${ability.toUpperCase()} ${before}→${next}`);}
      }
      if(rule.abilityOverride)for(const [ability,value] of Object.entries(rule.abilityOverride)){
        if(!(ability in scores))continue;
        const floor=Number(value);if(!Number.isFinite(floor)||floor<=0)continue;
        hasAbilityFloor=true;if(!abilityFloors.has(ability)||floor>abilityFloors.get(ability).value)abilityFloors.set(ability,{value:floor,report});
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
      if(changed.length||hasAbilityFloor)reports.push(report);
    }
    const overAttuned=active.filter(row=>row.needsAttunement&&row.choice.attuned&&!row.magicActive);
    for(const row of overAttuned)warnings.push(row.item.name+': exceeds '+(E.attunementLimit(data,level)===3?'three':E.attunementLimit(data,level))+' attunement slots; Adobe magic-item effects are inactive.');
    applyScopedPassives(data,effects,loot,level,reports,warnings);
    // An item that sets a score has no effect when the score without it is higher.
    // Resolve ordinary increases first, then the highest active floor per ability.
    for(const [ability,{value,report}]of abilityFloors){const before=scores[ability];if(before>=value)continue;scores[ability]=value;report.abilityChanges.push({ability,before,after:value});report.effects.push(`${ability.toUpperCase()} ${before}→${value}`);}
    effects.itemSpellBonuses={};effects.itemSpellAbilityBonuses={};for(const source of Object.values(effects.itemSpellSources||{})){const entries=source.ability?[effects.itemSpellAbilityBonuses[source.ability]||={attack:0,dc:0}]:source.targets.map(target=>effects.itemSpellBonuses[target]||={attack:0,dc:0});for(const entry of entries){entry.attack+=source.attack;entry.dc+=source.dc;}}
    const primary=spellBonuses(effects,data.build?.classId,data.spellAbility);effects.itemSpellAttackBonus=primary.attack;effects.itemSpellDCBonus=primary.dc;
    return {active,reports:reports.filter(row=>row.effects.length||row.abilityChanges.length),warnings,...(effects.itemPassiveAC?.length?{passiveAC:effects.itemPassiveAC}:{})};
  }
  function augmentGear(data,gear,magic){
    if(!gear||!magic)return gear;
    const result={...gear,sources:[...(gear.sources||[])],warnings:[...(gear.warnings||[])]};
    for(const source of magic.passiveAC||[]){if(result.sources.some(row=>clean(row.name)===clean(source.name)))continue;result.bonus=Number(result.bonus||0)+source.value;result.ac+=source.value;result.sources.push({...source});}
    for(const row of magic.active||[]){
      if(row.magicActive&&row.eligible&&prerequisite(row.item)?.key==='item:wdh:blackstaff-heir'&&!result.sources.some(source=>clean(source.name)===clean(row.item.name))){result.bonus+=2;result.ac+=2;result.sources.push({name:row.item.name,value:2});}
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
  return {reference,info,isMagical,requiresAttunement,infer,apply,augmentGear,spellBonuses,automationCoverage,prerequisite,prerequisiteConfirmed,setPrerequisite,instructions};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicItems=CharacterMagicItems;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicItems;
