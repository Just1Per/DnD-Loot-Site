'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../js/modules/character-size-guidance'),D=require('../js/modules/character-race-size-data');
const project=(id,name,source='SRD 5.1 / 2014')=>G.project({build:{race:id}},{races:{[id]:{name,source}}});
test('source dice produce true min/max outcomes rather than treating the base as a minimum',()=>{
 const human=project('human','Human');assert.deepEqual([human.height.min,human.height.max,human.weight.min,human.weight.max],[58,76,114,270]);assert.equal(human.height.cmMin,58*2.54);assert.equal(human.weight.kgMax,270*0.45359237);
 const dwarf=project('hill-dwarf','Dwarf — Hill dwarf');assert.deepEqual([dwarf.height.min,dwarf.height.max,dwarf.weight.min,dwarf.weight.max],[46,52,119,211]);assert.equal(dwarf.tables.length,1);
 const dragon=project('dragonborn','Dragonborn');assert.deepEqual([dragon.height.min,dragon.height.max,dragon.weight.min,dragon.weight.max],[68,82,179,367]);
 const gnome=project('rock-gnome','Gnome — Rock gnome');assert.deepEqual([gnome.weight.min,gnome.weight.max],[37,43]);
});
test('all 44 table fact rows have finite ordered bounds; constant multipliers are supported without evaluation',()=>{
 assert.equal(D.records.length,44);for(const row of D.records){const r=G.bounds(row);assert.ok(Number.isFinite(r.heightMin)&&r.heightMin<=r.heightMax);assert.ok(Number.isFinite(r.weightMin)&&r.weightMin<=r.weightMax);}
 const forged=()=>G.dice('1d6;process.exit()');assert.throws(forged,/Unsupported/);assert.deepEqual(G.dice('4'),[4,4]);
});
test('revised species get a clearly labelled earlier-printing reference, while unknown sources never receive invented ranges',()=>{
 const revised=project('human-2024','Human','SRD 5.2.1 / 2024');assert.equal(revised.available,true);assert.equal(revised.legacy,true);assert.match(G.text({build:{race:'human-2024'}},'height',{races:{'human-2024':{name:'Human',source:'SRD 5.2.1 / 2024'}}}).lines.join(' '),/Earlier-printing.*outside this range/);
 const unknown=project('fairy','Fairy','Monsters of the Multiverse');assert.equal(unknown.available,false);assert.equal(unknown.height,undefined);assert.match(unknown.lines.join(' '),/No verified/);
});
