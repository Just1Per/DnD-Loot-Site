'use strict';
const assert=require('node:assert/strict');

global.CharacterEquipment=require('../js/modules/character-equipment');
global.CharacterMagicArmor=require('../js/modules/character-magic-armor');
global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');
global.CharacterMagicItems=require('../js/modules/character-magic-items');

assert.equal(CharacterMagicItemReference.count,239);
assert.equal(CharacterMagicItemReference.names.length,239);
assert.ok(CharacterMagicItems.info('Amulet of Health').known);
assert.ok(CharacterMagicItems.requiresAttunement({name:'Amulet of Health'}));

{
  const data={equipmentState:{loadout:[{id:'amulet',equipped:true,attuned:true}]}};
  const scores={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  const effects={resistances:[],darkvision:0,speed:30,swim:0,climb:0};
  const result=CharacterMagicItems.apply(data,scores,effects,[{id:'amulet',quantity:1,item:{name:'Amulet of Health'}}]);
  assert.equal(scores.con,19);
  assert.equal(result.reports.length,1);
}

{
  const data={equipmentState:{loadout:[{id:'cloak',equipped:true,attuned:true}]}};
  const scores={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  const effects={resistances:[],darkvision:0,speed:30,swim:0,climb:0};
  const magic=CharacterMagicItems.apply(data,scores,effects,[{id:'cloak',quantity:1,item:{name:'Cloak of Protection'}}]);
  const mechanics=CharacterEquipment.infer({name:'Cloak of Protection'});
  assert.equal(mechanics.kind,'accessory');
  assert.equal(mechanics.acBonus,1);
  assert.equal(magic.active[0].magicActive,true);
}

{
  const data={equipmentState:{loadout:[{id:'bracers',equipped:true,attuned:true}]}};
  const scores={str:10,dex:16,con:10,int:10,wis:10,cha:10};
  const effects={resistances:[],darkvision:0,speed:30,swim:0,climb:0};
  const magic=CharacterMagicItems.apply(data,scores,effects,[{id:'bracers',quantity:1,item:{name:'Bracers of Defense'}}]);
  const gear=CharacterMagicItems.augmentGear(data,{entries:[],sources:[],warnings:[],bonus:0,ac:13},magic);
  assert.equal(gear.ac,15);
  assert.equal(gear.bonus,2);
}

{
  const data={equipmentState:{loadout:[{id:'belt',equipped:true,attuned:true}]}};
  const scores={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  const effects={resistances:[],darkvision:0,speed:30,swim:0,climb:0};
  CharacterMagicItems.apply(data,scores,effects,[{id:'belt',quantity:1,item:{name:'Belt of Hill Giant Strength'}}]);
  assert.equal(scores.str,21);
}

{
  const data={equipmentState:{loadout:[{id:'goggles',equipped:true,attuned:false}]}};
  const scores={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  const effects={resistances:[],darkvision:60,speed:30,swim:0,climb:0};
  CharacterMagicItems.apply(data,scores,effects,[{id:'goggles',quantity:1,item:{name:'Goggles of Night'}}]);
  assert.equal(effects.darkvision,120);
}

console.log('SUCCESS Adobe magic-item reference and automatic effects');
