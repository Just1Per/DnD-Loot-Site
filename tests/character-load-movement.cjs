'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
global.CharacterEquipment=require('../js/modules/character-equipment');
global.CharacterMagicArmor=require('../js/modules/character-magic-armor');
global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');
global.CharacterMagicItems=require('../js/modules/character-magic-items');
const M=require('../js/modules/character-sheet-model'),E=CharacterEquipment;
const make=(edition='2014',race='human')=>{const d=M.normalize({speed:30,build:{edition,race,classId:'fighter',scoreMode:'final'},abilities:{str:10,dex:14,con:12,int:10,wis:10,cha:10}});d.adobe={classLevels:[{classId:'fighter',level:5}],carrying:{mode:'variant'}};return d;};
const load=weight=>({id:'load',quantity:1,item:{name:'Declared burden',properties:[{title:'Weight per unit (lb)',text:String(weight)}]}});
test('recognized enhancements retain physical base weight while explicit weights take precedence',()=>{
 const C=require('../js/modules/character-carrying');assert.equal(C.unitWeight({name:'Plate +1'}),65);assert.equal(C.unitWeight({name:'Shield +2'}),6);assert.equal(C.unitWeight({name:'+3 Longsword'}),3);assert.equal(C.unitWeight({name:'Plate +1',properties:[{title:'Weight per unit (lb)',text:'40'}]}),40);assert.equal(C.unitWeight({name:'Unknown artifact'}),null);
});
test('selected variant applies exact burden boundaries to walking speed without changing saved data',()=>{
 for(const edition of ['2014','2024'])for(const [weight,speed] of [[50,30],[50.01,20],[100,20],[100.01,10],[150,10]]){
  const d=make(edition),before=JSON.stringify(d),r=M.derive(d,5,[load(weight)]);assert.equal(r.effects.speed,speed,edition+' '+weight);assert.equal(r.movement.physicalDisadvantage,weight>100);assert.equal(JSON.stringify(d),before);
 }
});
test('standard capacity does not invent an overload speed; coins and the capacity multiplier are shared',()=>{
 const d=make();d.adobe.carrying.mode='basic';let r=M.derive(d,5,[load(151)]);assert.equal(r.effects.speed,30);assert.equal(r.movement.overCapacity,true);
 d.adobe.carrying.mode='variant';d.coins.gp=2501;r=M.derive(d,5);assert.equal(r.effects.speed,20);assert.equal(r.weight.total,2501/50);
 d.adobe.carrying.includeCoins=false;assert.equal(M.derive(d,5).effects.speed,30);d.adobe.carrying.multiplier=2;assert.equal(M.derive(d,5,[load(101)]).effects.speed,20);
});
test('unknown weights stay explicit while known lower-bound penalties still apply',()=>{
 const d=make(),unknown={id:'unknown',quantity:1,item:{name:'Unknown weight'}};
 let r=M.derive(d,5,[load(101),unknown]);assert.equal(r.effects.speed,10);assert.equal(r.movement.unknownWeights,1);
 r=M.derive(d,5,[unknown]);assert.equal(r.effects.speed,30);assert.equal(r.movement.unknownWeights,1);
});
test('worn Heavy armor uses final Strength, with only the legacy dwarf trait exempt',()=>{
 for(const edition of ['2014','2024']){const d=make(edition);d.adobe.carrying.mode='basic';d.equipmentState=E.choices({loadout:[{id:'armor',equipped:true}]});const armor={id:'armor',quantity:1,item:{name:'Plate'}};
  assert.equal(M.derive(d,5,[armor]).effects.speed,20);d.abilities.str=15;assert.equal(M.derive(d,5,[armor]).effects.speed,30);d.abilities.str=10;d.equipmentState.loadout[0].equipped=false;assert.equal(M.derive(d,5,[armor]).effects.speed,30);
 }
 for(const race of ['hill-dwarf','mountain-dwarf']){const d=make('2014',race);d.adobe.carrying.mode='basic';d.equipmentState=E.choices({loadout:[{id:'armor',equipped:true}]});assert.equal(M.derive(d,5,[{id:'armor',quantity:1,item:{name:'Plate'}}]).effects.speed,25);}
 const modern=make('2024','dwarf-2024');modern.adobe.carrying.mode='basic';modern.equipmentState=E.choices({loadout:[{id:'armor',equipped:true}]});assert.equal(M.derive(modern,5,[{id:'armor',quantity:1,item:{name:'Plate'}}]).effects.speed,20);
});
test('active attuned Striding boots ignore load/armor slowing, not capacity or stored uses',()=>{
 const d=make(),loot=[load(105),{id:'armor',quantity:1,item:{name:'Plate',properties:[{title:'Weight per unit (lb)',text:'0'}]}},{id:'boots',quantity:1,item:{name:'Boots of Striding and Springing',attunement:true,properties:[{title:'Weight per unit (lb)',text:'0'}]}}];
 d.equipmentState=E.choices({loadout:[{id:'armor',equipped:true},{id:'boots',equipped:true,attuned:true}]});const before=JSON.stringify(d);const active=M.derive(d,5,loot);assert.equal(active.effects.speed,30);assert.equal(active.movement.physicalDisadvantage,true,'boots prevent slowing, not the variant physical-roll disadvantage');assert.equal(JSON.stringify(d),before);
 d.equipmentState.loadout[1].attuned=false;assert.equal(M.derive(d,5,loot).effects.speed,10);
});

test('class bonuses, capacity traits and magical Strength feed the same load/armor result',()=>{
 const d=make('2024');d.adobe.classLevels=[{classId:'monk',level:2},{classId:'barbarian',level:5}];let r=M.derive(d,7,[load(60)]);assert.equal(r.effects.speed,40);assert.equal(r.classMovement.bonus,20);
 d.build.race='goliath-2024';assert.equal(M.derive(d,7,[load(60)]).effects.speed,55);
 const strong=make();strong.adobe.carrying.mode='basic';strong.equipmentState=E.choices({loadout:[{id:'armor',equipped:true},{id:'gloves',equipped:true,attuned:true}]});r=M.derive(strong,5,[{id:'armor',quantity:1,item:{name:'Plate'}},{id:'gloves',quantity:1,item:{name:'Gauntlets of Ogre Power',attunement:true}}]);assert.equal(r.scores.str,19);assert.equal(r.effects.speed,30);
});

test('the optional variant replaces the armor Strength column rather than stacking two penalties',()=>{
 for(const edition of ['2014','2024']){const d=make(edition),plate={id:'armor',quantity:1,item:{name:'Plate'}};d.equipmentState=E.choices({loadout:[{id:'armor',equipped:true}]});let r=M.derive(d,5,[plate]);assert.equal(r.effects.speed,20);assert.equal(r.movement.armorPenalty,0);assert.equal(r.gear.warnings.some(w=>w.includes('strength requirement')),false);d.abilities.str=5;assert.equal(M.derive(d,5,[plate]).effects.speed,10);}
});
