'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),H=require('../js/modules/character-hit-point-options'),P=require('../js/modules/character-progression');
const make=(patch={})=>({classLevels:[{classId:'wizard',level:3}],constitution:10,hpMode:'fixed',hpRolls:[2,3],bonuses:0,...patch});
test('source menu totals share every class level and bonus calculation without changing character inputs',()=>{
 for(const classId of Object.keys(P.CLASS_HIT_DICE))for(let level=1;level<=20;level++)for(const constitution of [3,10,18]){const input=make({classLevels:[{classId,level}],constitution,bonuses:level*2}),before=JSON.stringify(input);for(const choice of H.choices(input))assert.equal(choice.max,P.calculateHP({...input,hpMode:choice.mode}).max);assert.equal(JSON.stringify(input),before);}
 assert.deepEqual(H.choices(make()).map(c=>c.max),[13,14,18]);
});
test('manual maximum is a final total and never gains automatic HP bonuses a second time',()=>{
 for(const constitution of [3,10,20])for(const bonuses of [0,6,100]){const input=make({constitution,bonuses}),state=H.project(input,{hpMode:'manual',hpMax:22});assert.equal(state.max,22);assert.equal(state.mode,'manual');assert.equal(state.manualAdjustment,state.max-state.automaticMax);assert.equal(state.base+state.bonuses+state.totalMinimumHP+state.manualAdjustment,state.max);assert.equal(state.once,false);}
});
test('one-shot choices preserve the selected automatic method and expire when an HP input changes',()=>{
 const input=make(),settings={hpMode:'fixed',hpOverride:H.setOnce(18,input)};assert.equal(H.project(input,settings).max,18);assert.equal(H.project(input,settings).once,true);assert.equal(H.project(input,settings).mode,'fixed');
 for(const patch of [{constitution:12},{bonuses:2},{classLevels:[{classId:'wizard',level:4}]}]){const changed={...input,...patch},state=H.project(changed,settings);assert.equal(state.once,false);assert.equal(state.max,P.calculateHP(changed).max);}
 assert.equal(H.project(input,{...settings,hpMode:'average'}).max,13);assert.equal(H.project(input,{...settings,hpMode:'manual',hpMax:30}).max,30);
});
test('irrelevant roll history and descriptive HP source labels do not drop fixed choices; rolled inputs do',()=>{
 const input=make(),settings={hpMode:'fixed',hpOverride:H.setOnce(18,input)};assert.equal(H.project({...input,hpRolls:[5,5],bonusSources:[{name:'Reworded',value:0}]},settings).once,true);
 const rolled=make({hpMode:'rolled'}),state={hpMode:'rolled',hpOverride:H.setOnce(30,rolled)};assert.equal(H.project({...rolled,hpRolls:[5,5]},state).once,false);
});
test('multiclass and zero final HP reconcile without changing current/temp/death counters or rolls',()=>{
 const input=make({classLevels:[{classId:'fighter',level:2},{classId:'wizard',level:2}],constitution:14,bonuses:8}),settings={hpMode:'average',hpOverride:H.setOnce(80,{...input,hpMode:'average'}),hpMax:3,hpCurrent:7,hpTemp:4,deathFailure:2},before=JSON.stringify({input,settings});const r=H.project(input,settings);assert.equal(r.max,80);assert.equal(r.base+r.bonuses+r.totalMinimumHP+r.manualAdjustment,r.max);assert.equal(H.project(input,{hpMode:'manual',hpMax:0}).max,0);assert.equal(JSON.stringify({input,settings}),before);
});
test('bounded manual edits and malformed saved overrides fail safely',()=>{
 for(const value of ['',null,true,NaN,Infinity,-1,1.5,1000001])assert.throws(()=>H.maximum(value));assert.equal(H.maximum('25'),25);assert.equal(H.mode('unknown'),'fixed');
 for(const override of [null,{},[],{value:'10',basis:'x'},{value:1,basis:'x'.repeat(4001)},{value:-1,basis:'x'}])assert.equal(H.normalizeOverride(override),null);
 for(const hpMax of [-1,1.5,Infinity,'bad'])assert.equal(H.project(make(),{hpMode:'manual',hpMax}).max,14);
 const override=H.setOnce(33,make());assert.deepEqual(H.normalizeOverride(JSON.parse(JSON.stringify(override))),override);assert.equal(H.project(make(),{hpMode:'fixed',hpOverride:{value:33,basis:'forged'},hpMax:0}).max,14);
});
