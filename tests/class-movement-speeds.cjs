'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
global.CharacterEquipment=require('../js/modules/character-equipment');
global.CharacterMagicArmor=require('../js/modules/character-magic-armor');
global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');
global.CharacterMagicItems=require('../js/modules/character-magic-items');
const M=require('../js/modules/character-sheet-model'),E=CharacterEquipment,P=require('../js/modules/character-class-progression');
const make=(classId,level,edition='2024',race='human')=>{
 const d=M.normalize({speed:30,build:{classId,edition,race}});
 d.adobe={classLevels:[{classId,level}],classFeatureChoices:{'keep:choice':['saved']}};return d;
};
function equip(d,names){
 const loot=names.map((name,i)=>({id:'gear-'+i,quantity:1,item:{name}}));
 d.equipmentState=E.choices({loadout:loot.map(e=>({id:e.id,equipped:true,attuned:true}))});return loot;
}
test('actual Monk and Barbarian levels 1–20 drive both edition tables without changing saved base values',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++)for(const id of ['monk','barbarian']){
  const d=make(id,level,edition),before=JSON.stringify(d),r=M.derive(d,level),bonus=id==='barbarian'?(level>=5?10:0):level>=18?30:level>=14?25:level>=10?20:level>=6?15:level>=2?10:0;
  assert.equal(r.effects.speed,30+bonus,edition+' '+id+' '+level);assert.equal(r.classMovement.bonus,bonus);assert.equal(JSON.stringify(d),before);
 }
});
test('physical worn armor and readied shields gate class movement independently of attunement or AC mode',()=>{
 for(const edition of ['2014','2024'])for(const name of ['Leather','Chain Shirt','Plate','Shield']){
  const d=make('monk',10,edition),loot=equip(d,[name]);d.equipmentState.acMode='manual';
  assert.equal(M.derive(d,10,loot).effects.speed,30,name);d.equipmentState.loadout[0].attuned=false;assert.equal(M.derive(d,10,loot).effects.speed,30);
  d.equipmentState.loadout[0].equipped=false;assert.equal(M.derive(d,10,loot).effects.speed,50);
  d.equipmentState.loadout[0].equipped=true;loot[0].quantity=0;assert.equal(M.derive(d,10,loot).effects.speed,50);
 }
});
test('Fast Movement allows light/medium armor and shields, but not Heavy armor',()=>{
 for(const edition of ['2014','2024'])for(const name of ['Leather','Chain Shirt','Plate','Shield']){
  const d=make('barbarian',5,edition),loot=equip(d,[name]);assert.equal(M.derive(d,5,loot).effects.speed,name==='Plate'?30:40);
 }
});
test('multiclass bonuses combine once at capped class levels and do not unlock from total level',()=>{
 const d=make('fighter',10);d.adobe.classLevels=[{classId:'fighter',level:9},{classId:'monk',level:1}];assert.equal(M.derive(d,10).effects.speed,30);
 d.adobe.classLevels=[{classId:'monk',level:10},{classId:'barbarian',level:5}];assert.equal(M.derive(d,15).effects.speed,60);assert.equal(M.derive(d,12).effects.speed,50);
 d.adobe.classLevels=[{classId:'barbarian',level:5},{classId:'monk',level:2},{classId:'monk',level:10}];assert.equal(M.derive(d,17).effects.speed,50);
 const loot=equip(d,['Shield']);assert.equal(M.derive(d,17,loot).effects.speed,40);
});
test('walking-speed minima compare against the class-adjusted racial speed; inactive items grant nothing',()=>{
 const d=make('monk',2,'2014','lightfoot-halfling'),loot=equip(d,['Boots of Striding and Springing']);
 assert.equal(M.derive(d,2,loot).effects.speed,35);d.adobe.classLevels[0].level=1;assert.equal(M.derive(d,1,loot).effects.speed,30);
 d.equipmentState.loadout[0].attuned=false;assert.equal(M.derive(d,1,loot).effects.speed,25);
 d.adobe.classLevels[0].level=2;assert.equal(M.derive(d,2,loot).effects.speed,35);
});
test('walking-derived magical climbing speed follows the final class-adjusted walking speed',()=>{
 const d=make('monk',10),loot=equip(d,['Slippers of Spider Climbing']);const r=M.derive(d,10,loot);assert.equal(r.effects.speed,50);assert.equal(r.effects.climb,50);
 d.equipmentState.loadout[0].attuned=false;assert.equal(M.derive(d,10,loot).effects.climb||0,0);
});
test('live assignments override old envelopes; source changes and unrelated values are retained',()=>{
 const d=make('monk',18);d.hpCurrent=17;d.rulesChoices.grants.__adobe={data:{classLevels:[{classId:'monk',level:20}]}};
 d.adobe.classLevels=[{classId:'monk',level:1}];assert.equal(M.derive(d,20).effects.speed,30);
 delete d.adobe;assert.equal(M.derive(d,20).effects.speed,60);
 const plain=make('wizard',20),before=JSON.stringify(plain);assert.equal(M.derive(plain,20).classMovement.rows.length,0);assert.equal(JSON.stringify(plain),before);
});
test('legacy reference and old remote imports retain Unarmored Movement at level 2 without duplicating or mutating records',()=>{
 assert.equal(P.unlocked('monk',1,'','2014').some(r=>r.name==='Unarmored Movement'),false);
 assert.equal(P.unlocked('monk',2,'','2014').filter(r=>r.name==='Unarmored Movement').length,1);
 const remote={classes:{monk:{features:[{name:'Unarmored Defense',level:1,summary:'Existing'}]}}},before=JSON.stringify(remote);P.installReference('2014',remote);
 try{assert.equal(P.classFeatures('monk','2014').filter(r=>r.name==='Unarmored Movement').length,1);assert.equal(JSON.stringify(remote),before);}finally{P.installReference('2014',null);}
});
