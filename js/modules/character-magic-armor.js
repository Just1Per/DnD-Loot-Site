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
  const clean=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
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
  // Prefer explicit stored mechanics. For legacy root/campaign items, provide
  // the Adobe magic-armor mapping before falling back to the generic name parser.
  E.infer=item=>item?.mechanics?baseInfer(item):(infer(item)||baseInfer(item));
  return {special,infer,expectedAC};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicArmor=CharacterMagicArmor;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicArmor;
