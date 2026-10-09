'use strict';
/* Structured Adobe magic-armor facts used to store AC mechanics on root items. */
var CharacterMagicArmor = (() => {
  const E=CharacterEquipment,baseInfer=E.infer.bind(E);
  const special={
    'demon armor':{kind:'armor',base:'plate',acBonus:1,source:'Adobe: Demon Armor'},
    'dragon scale mail':{kind:'armor',base:'scale-mail',acBonus:1,source:'Adobe: Dragon Scale Mail'},
    'dwarven plate':{kind:'armor',base:'plate',acBonus:2,source:'Adobe: Dwarven Plate'},
    'elven chain':{kind:'armor',base:'chain-shirt',acBonus:1,source:'Adobe: Elven Chain'},
    'glamoured studded leather':{kind:'armor',base:'studded-leather',acBonus:1,source:'Adobe: Glamoured Studded Leather'},
    'armor of invulnerability':{kind:'armor',base:'plate',acBonus:0,source:'Adobe: Armor of Invulnerability'},
    'armor of vulnerability':{kind:'armor',base:'plate',acBonus:0,source:'Adobe: Armor of Vulnerability'},
    'plate armor of etherealness':{kind:'armor',base:'plate',acBonus:0,source:'Adobe: Plate Armor of Etherealness'},
    'animated shield':{kind:'shield',base:'',acBonus:0,source:'Adobe: Animated Shield'},
    'arrow-catching shield':{kind:'shield',base:'',acBonus:0,source:'Adobe: Arrow-Catching Shield'},
    'shield of missile attraction':{kind:'shield',base:'',acBonus:0,source:'Adobe: Shield of Missile Attraction'},
    'spellguard shield':{kind:'shield',base:'',acBonus:0,source:'Adobe: Spellguard Shield'}
  };
  const armorNames=Object.entries(E.armor).sort((a,b)=>b[1].name.length-a[1].name.length);
  const clean=value=>String(value||'').trim().toLowerCase().replace(/[‐‑–—-]/g,' ').replace(/halfplate/g,'half plate').replace(/\s+/g,' ');
  function bonusFromName(name){
    const a=name.match(/(?:^|\s|,|\()\+([123])(?:\s|$|\))/),b=name.match(/^\+([123])\s+/);
    return Number((a||b)?.[1]||0);
  }
  function baseFromName(name){
    const normalized=name.replace(/armour/g,'armor');
    for(const [id,row] of armorNames)if(new RegExp(`(?:^|[^a-z])${row.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^a-z])`).test(normalized))return id;
    return '';
  }
  function infer(item={}){
    const name=clean(item.name);
    if(!name)return null;
    if(special[name])return {...E.normalize({...special[name],edition:'character'}),source:special[name].source};
    if(/shield/.test(name)){
      const bonus=bonusFromName(name);
      if(bonus)return {...E.normalize({kind:'shield',acBonus:bonus,edition:'character'}),source:'Adobe: magic shield AC bonus'};
      return null;
    }
    const base=baseFromName(name),bonus=bonusFromName(name);
    if(base&&bonus)return {...E.normalize({kind:'armor',base,acBonus:bonus,edition:'character'}),source:'Adobe: magic armor AC bonus'};
    if(base&&/(adamantine|mithral|resistance)/.test(name))return {...E.normalize({kind:'armor',base,acBonus:0,edition:'character'}),source:'Adobe: magic armor base type'};
    return null;
  }
  function expectedAC(mechanics){
    if(!mechanics)return null;
    if(mechanics.kind==='shield')return 2+Number(mechanics.acBonus||0);
    const base=E.armor[mechanics.base];
    return base?base.baseAC+Number(mechanics.acBonus||0):null;
  }
  // Legacy item properties are structured attributes, not free-form description rules.
  function acAttribute(item){
    const property=(item.properties||[]).find(p=>/^(ac|armor class|armour class|ac bonus|armor class bonus)$/i.test(String(p?.title||'').trim()));
    const value=item.ac ?? item.armorClass ?? property?.text;
    if(value===undefined||value===null||String(value).trim()==='')return null;
    const raw=String(value).trim(),match=raw.match(/^(?:AC\s*[:=]?\s*)?([+]?[0-9]+)(?:\s*(?:$|[+(]|bonus|to\b))/i);
    if(!match)return null;
    const amount=Number(match[1]);
    if(amount<0||amount>30)return null;
    return {amount,bonus:match[1].startsWith('+')||/bonus/i.test(property?.title||'')};
  }
  function resolve(item={}){
    const stored=baseInfer(item),name=clean(item.name),attribute=acAttribute(item);
    const candidate=infer(item);
    // Longest-name matching keeps Half Plate distinct from Plate.
    const type=(item.properties||[]).find(p=>/^(armor type|armour type|base armor|base armour)$/i.test(String(p?.title||'').trim()))?.text;
    const base=baseFromName(clean(item.armorType||type||name));
    const shield=/\bshield\b/.test(name);
    let mechanics=!item.mechanics&&candidate?candidate:stored;
    if(stored.kind==='armor'&&!E.armor[stored.base]&&base)mechanics={...stored,base};
    if(stored.kind==='none'&&(candidate||attribute&&(base||shield)))mechanics={...E.normalize({kind:shield?'shield':'armor',base:base||candidate?.base||'',acBonus:candidate?.acBonus||bonusFromName(name)}),source:candidate?.source,inferred:true};
    if(!['armor','shield'].includes(mechanics.kind))return mechanics;
    if(attribute){
      const normal=mechanics.kind==='shield'?2:E.armor[mechanics.base]?.baseAC;
      if(normal!==undefined){
        // A total such as 16 + DEX already contains Half Plate's +1.
        // Store its difference from mundane armor to avoid counting it twice.
        mechanics={...mechanics,acBonus:attribute.bonus||attribute.amount<(mechanics.kind==='shield'?2:4)?attribute.amount:attribute.amount-normal};
      }
    }
    return mechanics;
  }
  E.infer=resolve;
  return {special,infer,expectedAC,acAttribute};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicArmor=CharacterMagicArmor;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicArmor;
