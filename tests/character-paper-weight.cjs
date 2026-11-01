'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),W=require('../js/modules/character-paper-weight');
test('all twelve original flags exist; original imperial defaults count coins and page-2 equipment only',()=>{
 assert.equal(W.sections.length,12);assert.deepEqual([...W.defaults].sort(),['cCoi','cP2L','cP2M','cP2R'].sort());
 const result=W.calculate({mode:'adobe'},{groups:{cArm:[{key:'armor',weight:65}],cP2L:[{weight:2,quantity:3}],cP3L:[{weight:99,quantity:1}]},coins:{gp:53}});assert.equal(result.weight.total,7);assert.equal(result.weight.coins,1);
});
test('source mode adds selected field sections exactly, including two independently selected representations',()=>{
 const groups={cArm:[{key:'armor',weight:65}],cP2L:[{weight:65,quantity:1}]};assert.equal(W.calculate({mode:'adobe',sections:['cArm','cP2L']},{groups}).weight.total,130);assert.equal(W.calculate({mode:'adobe',sections:['cArm']},{groups}).weight.total,65);
});
test('the existing physical Inventory weight remains the default and is unchanged by inactive source settings',()=>{
 const inventoryWeight={gear:65,coins:.06,total:65.06,unknown:0},result=W.calculate({sections:['cArm'],overrides:{armor:75}},{inventoryWeight,groups:{cArm:[{key:'armor',weight:65}]}});assert.equal(result.weight,inventoryWeight);assert.equal(result.adobe.total,75);
});
test('original ammunition uses the total remaining amount, not remaining plus loaded icons',()=>{
 const result=W.calculate({mode:'adobe',sections:['cAmL','cAmR']},{groups:{cAmL:[{key:'ammo:0',weight:.05,quantity:29,loaded:19}],cAmR:[{key:'ammo:1',weight:.075,quantity:20}]}});assert.ok(Math.abs(result.weight.total-2.95)<1e-9);
});
test('blank quantities on source reference copies add no weight, while known units and explicit overrides are respected',()=>{
 const raw={mode:'adobe',sections:['cP3L','cMaI'],overrides:{'magic:owned-wand':2.5}},before=JSON.stringify(raw),result=W.calculate(raw,{groups:{cP3L:[{key:'reference',weight:5,quantity:''}],cMaI:[{key:'magic:owned-wand',weight:1}]}});assert.equal(result.weight.total,2.5);assert.equal(JSON.stringify(raw),before);
});
test('source coin rounding and explicit zero/empty sections retain the original numerical behavior',()=>{
 for(const [count,expected]of [[0,0],[3,0],[5,.1],[49,.9],[50,1],[53,1],[55,1.1]])assert.equal(W.calculate({mode:'adobe',sections:['cCoi']},{coins:{gp:count}}).weight.total,expected);
 assert.equal(W.calculate({mode:'adobe',sections:[]},{groups:{cArm:[{weight:65}]},coins:{gp:100}}).weight.total,0);
});
test('unknown selected fields stay explicit and cannot remove known burden or produce NaN',()=>{
 const r=W.calculate({mode:'adobe',sections:['cArm','cP2L']},{groups:{cArm:[{key:'armor',weight:null}],cP2L:[{weight:60,quantity:1},{weight:null,quantity:2}]}});assert.equal(r.weight.total,60);assert.equal(r.weight.unknown,2);assert.equal(W.calculate({mode:'adobe',sections:['cP2L']},{groups:{cArm:[{weight:null}]}}).weight.unknown,0);
});
test('bounded numeric overrides and canonical flags reject executable strings and leave drafts unchanged on error',()=>{
 const raw={mode:'adobe',sections:['cArm'],overrides:{armor:65}},before=JSON.stringify(raw);assert.throws(()=>W.edit(raw,'weight','armor','2+2'));assert.throws(()=>W.edit(raw,'weight','armor',Infinity));assert.throws(()=>W.edit(raw,'weight','../file',5));assert.equal(JSON.stringify(raw),before);assert.equal(W.edit(raw,'weight','armor',0).overrides.armor,0);assert.equal(W.edit(raw,'weight','armor','2,5').overrides.armor,2.5);assert.equal(W.edit(raw,'automatic','armor').overrides.armor,undefined);assert.deepEqual(W.normalize({sections:['cArm','cArm','other']}).sections,['cArm']);
});
