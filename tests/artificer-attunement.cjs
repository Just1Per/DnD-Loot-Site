const {test}=require('node:test'),assert=require('node:assert/strict');
global.CharacterEquipment=require('../js/modules/character-equipment');global.CharacterMagicArmor=require('../js/modules/character-magic-armor');global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');global.CharacterMagicItems=require('../js/modules/character-magic-items');
const E=CharacterEquipment,Magic=CharacterMagicItems,M=require('../js/modules/character-sheet-model'),Rules=require('../js/modules/character-rules');
const make=(classId,level)=>{const d=M.normalize({build:{classId,edition:'2014'}});d.adobe={classLevels:[{classId,level}]};return d;};
const loot=Array.from({length:7},(_,i)=>({id:'item-'+i,quantity:1,item:{name:'Charm '+i,attunement:true,mechanics:E.normalize({kind:'accessory',acBonus:1})}}));
const equip=d=>{d.equipmentState.loadout=loot.map(entry=>({id:entry.id,equipped:true,attuned:true}));return d;};
test('every supported class is checked at levels 1–20 for source-specific attunement slots',()=>{
 for(const classId of Object.keys(Rules.classes))for(let level=1;level<=20;level++){const expected=classId==='artificer'?(level>=18?6:level>=14?5:level>=10?4:3):3;assert.equal(E.attunementLimit(make(classId,level),level),expected,classId+' '+level);}
});
test('Artificer caps use its actual class level and character-level bounds, never other class levels',()=>{
 const d=make('wizard',10);d.adobe.classLevels.push({classId:'artificer',level:9});assert.equal(E.attunementLimit(d,19),3);d.adobe.classLevels[1].level=10;assert.equal(E.attunementLimit(d,20),4);assert.equal(E.attunementLimit(d,19),3);d.adobe.classLevels=[{classId:'artificer',level:1},{classId:'wizard',level:19}];assert.equal(E.attunementLimit(d,20),3);
 const stored={build:d.build,rulesChoices:{grants:{__adobe:{data:{classLevels:[{classId:'artificer',level:14}]}}}}};assert.equal(E.attunementLimit(stored,14),5);
});
test('equipment and magic-item pipelines activate the same slots in saved loadout order',()=>{
 for(const [level,count]of [[9,3],[10,4],[14,5],[18,6]]){const d=equip(make('artificer',level)),r=M.derive(d,level,[...loot].reverse()),active=r.magicItems.active;assert.equal(r.gear.attunementLimit,count);assert.equal(r.ac,10+count);assert.equal(active.filter(row=>row.magicActive).length,count);assert.deepEqual(r.gear.entries.filter(row=>row.magicActive).map(row=>row.entry.id).sort(),active.filter(row=>row.magicActive).map(row=>row.entry.id).sort());}
});
test('unworn attuned items still consume slots; duplicates, missing items and quantity add no slots',()=>{
 const d=equip(make('fighter',20));d.equipmentState.loadout[0].equipped=false;const active=M.derive(d,20,loot).magicItems.active;assert.equal(active.filter(row=>row.magicActive).length,2);assert.equal(active.find(row=>row.entry.id==='item-3').magicActive,false);
 assert.equal(E.attunementState(d,[loot[0],loot[0],{...loot[1],quantity:20},{...loot[2],quantity:0}],20).count,2);
});
test('level reduction deactivates excess effects without deleting saved attunements',()=>{
 const d=equip(make('artificer',18)),before=JSON.stringify(d.equipmentState);assert.equal(M.derive(d,18,loot).ac,16);d.adobe.classLevels[0].level=9;const r=M.derive(d,9,loot);assert.equal(r.ac,13);assert.match(r.gear.warnings.join(' '),/exceeds three attunement/);assert.equal(JSON.stringify(d.equipmentState),before);
});
