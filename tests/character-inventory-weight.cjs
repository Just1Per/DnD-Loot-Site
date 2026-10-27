'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={CharacterAdobeData:{gear:[{id:'abacus',name:'Abacus',weight:2,edition:'2014'}],baseEquipment:[]},CampaignRules:{allowed:()=>true}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/character-inventory-ui.js'),'utf8'),context);
const weight=(data,entries)=>JSON.parse(JSON.stringify(context.characterInventoryWeight(data,entries)));
const item=(quantity,name,unit)=>({quantity,item:{name,properties:unit===undefined?[]:[{title:'Weight per unit (lb)',text:String(unit)}]}});
test('carried weight combines declared unit weights, recognized equipment and every coin type',()=>{
 assert.deepEqual(weight({coins:{cp:10,sp:10,ep:10,gp:10,pp:10}},[item(2,'Custom gear',1.5),item(3,'Abacus'),item(1,'Unknown')]),{gear:9,coins:1,total:10,unknown:1});
});
test('the projection uses only the caller’s scoped carried entries',()=>{
 context.inventory=[item(99,'Another campaign item',50)];
 assert.deepEqual(weight({coins:{gp:50},personalGear:[{carried:false,weight:999,quantity:100}]},[]),{gear:0,coins:1,total:1,unknown:0});
});
test('zero or invalid quantities do not create NaN totals and unknown weights stay explicit',()=>{
 assert.deepEqual(weight({coins:{}},[item(0,'Uncarried',100),item(Infinity,'Invalid',2),item(NaN,'Invalid',2),item(1,'Unknown',-5)]),{gear:0,coins:0,total:0,unknown:1});
});
test('computing weight never changes inventory records or currency',()=>{
 const data={coins:{gp:3}},entries=[item('2','Abacus')],before=JSON.stringify({data,entries});
 assert.deepEqual(weight(data,entries),{gear:4,coins:.06,total:4.06,unknown:0});assert.equal(JSON.stringify({data,entries}),before);
});
