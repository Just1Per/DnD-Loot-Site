'use strict';
/* Adobe/MPMB magic-item bridge.
   The source reference is mechanical metadata only: no Acrobat execution and no long item prose.
   Items still require the player to mark them Equipped / worn, and attunement is enforced here
   when the Adobe reference marks a supported item as requiring it. */
var CharacterMagicItems=(()=>{
  const E=CharacterEquipment;
  const priorInfer=E.infer.bind(E);
  const reference=typeof CharacterMagicItemReference!=='undefined'?CharacterMagicItemReference:{names:[],automation:{}};
  const clean=value=>String(value||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9+]+/g,' ').replace(/\s+/g,' ').trim();
  const knownNames=new Set((reference.names||[]).map(clean));
  const rules=new Map(Object.entries(reference.automation||{}).map(([name,rule])=>[clean(name),rule]));
  const resistanceTypes=['acid','cold','fire','force','lightning','necrotic','poison','psychic','radiant','thunder'];

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
    const key=clean(name),rule=variantRule(name);
    return {key,known:knownNames.has(key)||!!rule,rule,attunement:!!rule?.attunement};
  }
  function requiresAttunement(item={}){
    return item.attunement===true||info(item).attunement;
  }
  function infer(item={}){
    if(item?.mechanics)return priorInfer(item);
    const rule=variantRule(item?.name);
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

  function activeEntries(data,loot=[]){
    const choices=Array.isArray(data?.equipmentState?.loadout)?data.equipmentState.loadout:[];
    const owned=new Map();
    for(const entry of loot||[]){
      if(!entry||Number(entry.quantity)<=0||!entry.id||owned.has(entry.id))continue;
      owned.set(entry.id,entry);
    }
    let attuned=0;
    const result=[];
    for(const choice of choices){
      if(!choice?.id||!choice.equipped)continue;
      const entry=owned.get(choice.id);if(!entry)continue;
      const item=entry.item||{},meta=info(item),needs=requiresAttunement(item);
      let magicActive=!needs;
      if(needs&&choice.attuned===true){attuned++;magicActive=attuned<=3;}
      result.push({entry,item,choice,meta,magicActive,needsAttunement:needs});
    }
    return result;
  }
  function addUnique(list,value){
    const key=clean(value);
    if(!key||list.some(v=>clean(v)===key))return;
    list.push(value);
  }
  function apply(data,scores,effects,loot=[]){
    const active=activeEntries(data,loot),reports=[],warnings=[],seen=new Set();
    for(const row of active){
      const rule=row.meta.rule;
      if(!rule||!row.magicActive)continue;
      const itemKey=clean(row.item.name);
      if(seen.has(itemKey))continue;
      seen.add(itemKey);
      const changed=[],abilityChanges=[];
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
    for(const row of overAttuned)warnings.push(row.item.name+': exceeds three attunement slots; Adobe magic-item effects are inactive.');
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

  E.infer=infer;
  return {reference,info,requiresAttunement,infer,apply,augmentGear};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicItems=CharacterMagicItems;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicItems;
