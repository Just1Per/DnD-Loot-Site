const assert=require('node:assert/strict');
const Equipment=require('../js/modules/character-equipment');
globalThis.CharacterEquipment=Equipment;
const MagicArmor=require('../js/modules/character-magic-armor');

let m=MagicArmor.infer({name:'Breastplate +2'});
assert.equal(m.kind,'armor');
assert.equal(m.base,'breastplate');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),16,'Breastplate +2 should store 14 base AC +2 magic');

m=MagicArmor.infer({name:'+3 Plate'});
assert.equal(m.base,'plate');
assert.equal(m.acBonus,3);
assert.equal(MagicArmor.expectedAC(m),21);

m=MagicArmor.infer({name:'Dwarven Plate'});
assert.equal(m.base,'plate');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),20);

m=MagicArmor.infer({name:'Dragon Scale Mail'});
assert.equal(m.base,'scale-mail');
assert.equal(m.acBonus,1);
assert.equal(MagicArmor.expectedAC(m),15);

m=MagicArmor.infer({name:'Shield +2'});
assert.equal(m.kind,'shield');
assert.equal(m.acBonus,2);
assert.equal(MagicArmor.expectedAC(m),4,'magic shield bonus is in addition to normal +2 shield AC');

assert.equal(Equipment.infer({name:'Demon Armor'}).acBonus,1,'runtime equipment inference should use Adobe special armor mapping');
console.log('SUCCESS Adobe magic armor AC mechanics');

const Model=require('../js/modules/character-sheet-model');
const ac=(item,dex=14,attuned=false,equipped=true)=>{
 const data=Model.normalize({build:{edition:'2024',classId:'fighter'},abilities:{dex},equipmentState:{loadout:[{id:'armor',equipped,attuned}]}});
 return Model.derive(data,5,[{id:'armor',quantity:1,item}]);
};
// Reproduce campaign items saved with empty mechanics and legacy AC properties.
for(const [id,row] of Object.entries(Equipment.armor))for(const bonus of [1,2,3]){
 const item={name:`${row.name} Armor +${bonus}`,mechanics:{kind:'none'},properties:[{title:'AC',text:`+${bonus}`} ]};
 const r=ac(item,20);assert.equal(r.ac,row.baseAC+bonus+(row.group==='heavy'?0:row.group==='medium'?2:5),id+' magic AC');
 assert.equal(r.gear.entries[0].mechanics.base,id);
 const total={...item,properties:[{title:'Armor Class',text:String(row.baseAC+bonus)+(row.group==='heavy'?'':' + Dex modifier')} ]};
 assert.equal(ac(total,20).ac,r.ac,id+' total AC must not double-count enhancement');
 assert.equal(ac(item,8).ac,row.baseAC+bonus+(row.group==='heavy'?0:-1),id+' negative DEX');
 assert.equal(ac(item,14,false,false).ac,12,id+' carried armor gives no AC');
}
assert.equal(ac({name:'Half-Plate Armour +1',mechanics:{kind:'none'}}).ac,18);
assert.equal(ac({name:'Halfplate +1',mechanics:{kind:'armor',base:''},ac:16}).ac,18);
assert.equal(ac({name:'Half Plate +1',mechanics:{kind:'armor',base:'half-plate',acBonus:1},ac:'16 + Dex modifier (max 2)'}).ac,18);
assert.equal(ac({name:'Half Plate +1',mechanics:{kind:'armor',base:'half-plate',acBonus:1},properties:[{title:'AC',text:'+2'}]}).ac,19);
assert.equal(ac({name:'Half Plate +1',attunement:true,properties:[{title:'AC',text:'16 + DEX (max 2)'}]}).ac,17);
assert.equal(ac({name:'Half Plate +1',attunement:true,properties:[{title:'AC',text:'16 + DEX (max 2)'}]},14,true).ac,18);
assert.equal(ac({name:'Dwarven Plate',mechanics:{kind:'none'}}).ac,20);
assert.equal(ac({name:'Shield +1',mechanics:{kind:'none'},properties:[{title:'AC',text:'3'}]}).ac,15);
assert.equal(Equipment.infer({name:'Dragon ring',properties:[{title:'AC',text:'+1'}]}).kind,'none','AC alone cannot invent an armor type');
assert.equal(Equipment.infer({name:'Half Plate',properties:[{title:'AC',text:'When attacked by dragons gain +5'}]}).acBonus,0,'conditional prose is not an unconditional attribute');
console.log('SUCCESS all armor types, item AC attributes and worn/attuned calculations');
