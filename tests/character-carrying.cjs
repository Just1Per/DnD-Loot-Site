'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../js/modules/character-carrying'),M=require('../js/modules/character-sheet-model');
const make=(race='human',edition='2014')=>M.normalize({build:{classId:'fighter',race,edition,scoreMode:'final'},abilities:{str:10},coins:{gp:50}});
test('standard limits use final shared Strength and exact size categories without mutating state',()=>{
 for(const [size,factor]of [['Tiny',.5],['Small',1],['Medium',1],['Large',2],['Huge',4],['Gargantuan',8]]){
  const data={adobe:{carrying:{}}},before=JSON.stringify(data),r=C.limits(data,{scores:{str:13},effects:{size}});assert.equal(r.capacity,13*15*factor);assert.equal(r.pushDragLift,13*30*factor);assert.equal(JSON.stringify(data),before);
 }
 const d=make(),before=JSON.stringify(d);assert.equal(M.derive(d,5).carrying.capacity,150);d.abilities.str=18;assert.equal(M.derive(d,5).carrying.capacity,270);d.abilities.str=10;assert.equal(JSON.stringify(d),before);
});
test('known source-specific larger-size build traits apply once and never leak after race or edition changes',()=>{
 const races=['firbolg-mpmm','goliath-mpmm','bugbear-mpmm','centaur-mpmm','orc-mpmm','loxodon','giff','goliath-2024'];
 for(const race of races){const d=make(race,race.endsWith('2024')?'2024':'2014'),r=M.derive(d,5);assert.equal(r.carrying.capacity,r.scores.str*30,race);assert.equal(r.carrying.effectiveSize,'Large');d.build.race='human';d.build.edition='2014';assert.equal(M.derive(d,5).carrying.largerSize,false);}
 const blocked=make('goliath-2024','2014');assert.equal(M.derive(blocked,5).carrying.largerSize,false);
});
test('Small is not half Medium; the one-larger-size trait and custom fallback size use actual categories',()=>{
 const d={profile:{size:'large'}};assert.equal(C.limits(d,{scores:{str:10},effects:{size:'Small',race:{carryingSizeSteps:1}}}).capacity,150);
 assert.equal(C.limits(d,{scores:{str:10},effects:{size:'—'}}).capacity,300);assert.equal(C.limits(d,{scores:{str:10},effects:{size:'Medium',race:{}}}).capacity,150);
});
test('strict fractional thresholds distinguish optional variant guidance from basic capacity',()=>{
 const d={adobe:{carrying:{mode:'variant'}}},r=C.limits(d,{scores:{str:10}}),state=n=>C.status(r,{total:n,unknown:0}).state;
 for(const [n,expected]of [[0,'normal'],[50,'normal'],[50.01,'encumbered'],[100,'encumbered'],[100.01,'heavy'],[150,'heavy'],[150.01,'over']])assert.equal(state(n),expected,String(n));
 assert.equal(C.status({...r,mode:'basic'},{total:120}).state,'normal');assert.equal(C.range(150,300),'151 – 300 lb');
});
test('unknown weights never confirm a safe load, while a known excess still proves overcapacity',()=>{
 const r=C.limits({}, {scores:{str:10}});assert.equal(C.status(r,{total:20,unknown:1}).state,'unknown');assert.equal(C.status(r,{total:160,unknown:1}).state,'over');for(const total of [NaN,Infinity,-1])assert.equal(C.status(r,{total}).state,'unknown');
});
test('multipliers, coin choices and zero-disable round-trip in the existing envelope with bounded edits',()=>{
 let s=C.edit({},'multiplier','1.25');s=C.edit(s,'includeCoins',false);s=C.edit(s,'mode','variant');const data={rulesChoices:{grants:{__adobe:{data:{carrying:s}}}}},r=C.limits(data,{scores:{str:10}});assert.equal(r.capacity,187.5);assert.equal(r.includeCoins,false);assert.equal(r.mode,'variant');
 s=C.edit(s,'multiplier','0');assert.equal(C.status(C.limits({adobe:{carrying:s}},{scores:{str:10}}),{total:999}).state,'disabled');
 for(const value of ['',null,true,'NaN',Infinity,-1,100.01,1.001])assert.throws(()=>C.edit({},'multiplier',value));for(const field of ['__proto__','capacity','strength'])assert.throws(()=>C.edit({},field,2));assert.throws(()=>C.edit({},'includeCoins','false'));
 assert.equal(C.normalize(null).multiplier,1);assert.equal(C.normalize({multiplier:false}).multiplier,1);
});
test('every class level and multiclass shares limits without changing combat values or spending resources',()=>{
 for(const classId of ['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'])for(let level=1;level<=20;level++){
  const d=make();d.build.classId=classId;d.adobe={classLevels:[{classId,level}],carrying:{mode:'variant',multiplier:2}};const before=JSON.stringify(d),r=M.derive(d,level);assert.equal(r.carrying.capacity,r.scores.str*30);assert.equal(JSON.stringify(d),before);
 }
 const d=make();d.adobe={classLevels:[{classId:'fighter',level:3},{classId:'wizard',level:2}],carrying:{}};const before=M.derive(d,5);d.adobe.carrying={mode:'variant',multiplier:2};const after=M.derive(d,5);for(const key of ['scores','hpMax','ac','saves','skills','attacks','effects'])assert.deepEqual(after[key],before[key]);
});

test('live settings override stale saved envelopes and removing them restores the saved source',()=>{const d=make();d.adobe={carrying:{mode:'variant',multiplier:2}};d.rulesChoices.grants.__adobe={data:{carrying:{mode:'basic',multiplier:.5}}};assert.equal(M.derive(d,5).carrying.capacity,300);delete d.adobe;assert.equal(M.derive(d,5).carrying.capacity,75);});
