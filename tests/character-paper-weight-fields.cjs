'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),W=require('../js/modules/character-paper-weight'),F=require('../js/modules/character-paper-weight-fields'),Combat=require('../js/modules/character-paper-combat');
global.CharacterEquipment=require('../js/modules/character-equipment');global.CharacterMagicArmor=require('../js/modules/character-magic-armor');global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');global.CharacterMagicItems=require('../js/modules/character-magic-items');
const make=()=>{const data=M.normalize({build:{edition:'2014',classId:'fighter',race:'human',scoreMode:'final'},abilities:{str:15,dex:10},coins:{gp:53}});data.adobe={classLevels:[{classId:'fighter',level:5}],paperCombat:Combat.normalize()};data.equipmentState.acMode='equipment';return data;};
const item=(id,name,weight)=>({id,quantity:1,item:{name,properties:weight===undefined?[]:[{title:'Weight per unit (lb)',text:String(weight)}]}});
test('source fields use worn armor/shield and recognized weapon weights without extra inventory records',()=>{
 const data=make(),entries=[item('plate','Plate +1'),item('shield','Shield +1'),item('sword','Longsword +1')];data.equipmentState.loadout=entries.map(row=>({id:row.id,equipped:true}));const before=JSON.stringify({data,entries}),derived=M.derive(data,5,entries),fields=F.collect(data,derived);assert.equal(fields.groups.cArm[0].weight,65);assert.equal(fields.groups.cShi[0].weight,6);assert.equal(fields.groups.cWea[0].weight,3);assert.equal(W.calculate({mode:'adobe',sections:['cArm','cShi','cWea']},fields).weight.total,74);assert.equal(JSON.stringify({data,entries}),before);
});
test('the first three physical columns and later two-column continuations keep original section identities',()=>{
 const data=make(),entries=Array.from({length:100},(_,i)=>item('gear-'+i,'Supply '+i,1)),fields=F.collect(data,M.derive(data,5,entries));assert.equal(fields.groups.cP2L.length,18);assert.equal(fields.groups.cP2M.length,18);assert.equal(fields.groups.cP2R.length,18);assert.equal(fields.groups.cP3L.length,28);assert.equal(fields.groups.cP3R.length,18);assert.equal(W.calculate({mode:'adobe',sections:['cP3L','cP3R']},fields).weight.total,46);
});
test('the original footer displaces real gear but its blank reference quantity adds no column weight',()=>{
 const data=make(),entries=Array.from({length:56},(_,i)=>item('gear-'+i,'Supply '+i,1));data.adobe.paperInventory={attunedFooter:true,footer:[{id:'gear-0',name:'Supply 0'}]};const fields=F.collect(data,M.derive(data,5,entries)),r=W.calculate({mode:'adobe',sections:['cP2L','cP2M','cP2R']},fields);assert.equal(r.weight.total,50);assert.equal(fields.groups.cP2R.find(row=>row.key==='inventory:gear-0:51').quantity,'');assert.equal(W.calculate({mode:'adobe',sections:['cP3L','cP3R']},fields).weight.total,6);
});
test('left/right ammunition uses original aliases and actual total, without adding loaded icons',()=>{
 const data=make();data.adobe.paperCombat.ammunition=[{name:'Arrows',amount:29,loaded:19},{name:'Bolts',amount:20,loaded:20}];const fields=F.collect(data,M.derive(data,5));assert.equal(fields.groups.cAmL[0].weight,.05);assert.equal(fields.groups.cAmR[0].weight,.075);assert.ok(Math.abs(W.calculate({mode:'adobe',sections:['cAmL','cAmR']},fields).weight.total-2.95)<1e-9);
});
test('magic source weights follow item references, including custom order and intentional empty rows',()=>{
 const data=make(),entries=[item('wand','Wand of magic missiles',1),item('ring','Ring of protection',.1)];data.adobe.paperMagicOrder=['ring','wand'];data.adobe.paperMagic={slots:[{id:'ring',name:'Ring',empty:false},{empty:true},{id:'wand',name:'Wand',empty:false}]};const fields=F.collect(data,M.derive(data,5,entries));assert.equal(fields.groups.cMaI[0].field,'Extra.Magic Item Weight 1');assert.equal(fields.groups.cMaI[1].field,'Extra.Magic Item Weight 3');assert.equal(fields.groups.cMaI[1].key,'magic:wand');assert.equal(W.calculate({mode:'adobe',sections:['cMaI'],overrides:{'magic:wand':2}},fields).weight.total,2.1);
});
test('empty armor, no physical attacks and missing ammo are zero source fields; unknown custom gear stays marked',()=>{
 const data=make(),entries=[item('custom','Unknown custom gear')],fields=F.collect(data,M.derive(data,5,entries));assert.equal(fields.groups.cArm[0].weight,0);assert.equal(W.calculate({mode:'adobe',sections:['cArm','cAmL','cAmR']},fields).weight.unknown,0);assert.equal(W.calculate({mode:'adobe',sections:['cP2L']},fields).weight.unknown,1);
});

test('the selected source total drives movement while Inventory mass, base speed and resources remain unchanged',()=>{
 const data=make();data.coins={gp:0};data.abilities.str=10;data.adobe.carrying={mode:'variant'};data.adobe.paperInventory={attunedFooter:true};const entries=Array.from({length:56},(_,i)=>item('gear-'+i,'Supply '+i,1));
 assert.equal(M.derive(data,5,entries).effects.speed,20);data.adobe.paperWeight={mode:'adobe'};const before=JSON.stringify(data),r=M.derive(data,5,entries);assert.equal(r.inventoryWeight.total,56);assert.equal(r.weight.total,50);assert.equal(r.effects.speed,30);assert.equal(JSON.stringify(data),before);assert.equal(data.speed,30);
});
test('source field weights are additive and apply the variant only once, including explicit zero overrides',()=>{
 const data=make();data.coins={gp:0};data.abilities.str=10;data.adobe.carrying={mode:'variant'};data.equipmentState.loadout=[{id:'plate',equipped:true}];data.adobe.paperWeight={mode:'adobe',sections:['cArm','cP2L']};const entries=[item('plate','Plate +1')],r=M.derive(data,5,entries);assert.equal(r.inventoryWeight.total,65);assert.equal(r.weight.total,130);assert.equal(r.effects.speed,10);assert.equal(r.movement.armorPenalty,0);data.adobe.paperWeight.overrides={armor:0};assert.equal(M.derive(data,5,entries).weight.total,65);
});
test('weight preferences in the private grants envelope preserve the same physical and source calculation',()=>{
 const data=make();data.coins={gp:0};data.adobe.paperInventory={attunedFooter:true};data.adobe.paperWeight={mode:'adobe'};data.rulesChoices.grants.__adobe={schema:14,data:data.adobe};delete data.adobe;const entries=Array.from({length:56},(_,i)=>item('gear-'+i,'Supply '+i,1)),r=M.derive(data,5,entries);assert.equal(r.weight.total,50);assert.equal(r.inventoryWeight.total,56);
});

test('collecting source metadata without a host does not change later model derivation',()=>{
 const {execFileSync}=require('node:child_process');execFileSync(process.execPath,['-e',`const assert=require('node:assert/strict'),M=require('./js/modules/character-sheet-model'),E=require('./js/modules/character-equipment');const data=M.normalize({build:{classId:'fighter',race:'human',scoreMode:'base'}});data.adobe={paperWeight:{mode:'adobe',sections:['cMaI']}};const entries=[{id:'wand',quantity:1,item:{name:'Wand of magic missiles',properties:[{title:'Weight per unit (lb)',text:'1'}]}}],before=E.infer,first=M.derive(data,5,entries),second=M.derive(data,5,entries);assert.deepEqual(second.weight,first.weight);assert.equal(first.weight.total,1);assert.equal(E.infer,before);`],{cwd:require('node:path').join(__dirname,'..')});
});
