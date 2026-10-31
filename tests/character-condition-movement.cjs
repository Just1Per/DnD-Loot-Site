'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-carrying');
const make=(edition,conditions)=>{const d=M.normalize({speed:30,conditions,build:{edition,classId:'fighter',race:'human',scoreMode:'final'}});d.adobe={classLevels:[{classId:'fighter',level:5}],carrying:{mode:'basic'}};return d;};
test('canonical movement-stopping conditions override speed bonuses without changing saved values',()=>{
 for(const edition of ['2014','2024'])for(const condition of ['Grappled','Restrained','Paralyzed','Petrified','Unconscious']){const d=make(edition,condition+' (escape DC 15)');d.build.classId='monk';d.adobe.classLevels=[{classId:'monk',level:5}];const before=JSON.stringify(d);assert.equal(M.derive(d,5).effects.speed,0,edition+' '+condition);assert.equal(JSON.stringify(d),before);}
});
test('Stunned follows its edition while Prone and Incapacitated do not halve base Speed',()=>{
 assert.equal(M.derive(make('2014','Stunned'),5).effects.speed,0);assert.equal(M.derive(make('2024','Stunned'),5).effects.speed,30);
 for(const edition of ['2014','2024'])for(const condition of ['Prone','Incapacitated','Frightened'])assert.equal(M.derive(make(edition,condition),5).effects.speed,30);
});
test('both Exhaustion tables use explicit severity, never stack duplicate labels or overwrite resources',()=>{
 for(const edition of ['2014','2024'])for(let level=0;level<=6;level++){const d=make(edition,'Exhaustion '+level),before=JSON.stringify(d),r=M.derive(d,5),expected=level===6||edition==='2014'&&level>=5?0:edition==='2024'?Math.max(0,30-5*level):level>=2?15:30;assert.equal(r.effects.speed,expected,edition+' '+level);assert.equal(JSON.stringify(d),before);}
 assert.equal(C.conditions(make('2024','Exhaustion 1; Exhaustion (2)')).exhaustion,2);
});
test('free-form negations, immunity notes and missing levels do not silently activate conditions',()=>{
 for(const text of ['Not grappled','Immune to Restrained','Grappled ended','Exhaustion','Exhaustion 99','Grappled (ended)','Restrained (immune)','Exhaustion 2 (removed)'])assert.equal(M.derive(make('2024',text),5).effects.speed,30,text);
 assert.equal(C.conditions(make('2024','Exhaustion')).missingLevel,true);assert.equal(C.conditions(make('2024','Exhaustion level 3')).exhaustion,3);
});
test('flat load/armor reductions precede condition halving, with zero overriding all reductions',()=>{
 const d=make('2014','Exhaustion 2');d.abilities.str=10;d.adobe.carrying.mode='variant';const loot=[{id:'load',quantity:1,item:{name:'Burden',properties:[{title:'Weight per unit (lb)',text:'60'}]}}];assert.equal(M.derive(d,5,loot).effects.speed,10);d.conditions='Exhaustion 2, Grappled';assert.equal(M.derive(d,5,loot).effects.speed,0);
});

test('legacy halving rounds down whole feet without rounding unrelated custom speeds',()=>{
 const d=make('2014','Exhaustion 2');d.build.race='wood-elf';assert.equal(M.derive(d,5).effects.speed,17);const base={limits:C.limits(d,{scores:{str:10}}),effects:{speed:35.5,swim:45.5}};assert.equal(C.movement({...d,conditions:''},base).speed,35.5);assert.equal(C.movement(d,base).speeds.swim,22);
});

test('changing edition reinterprets the same saved condition without deleting it',()=>{
 const d=make('2014','Exhaustion 2');assert.equal(M.derive(d,5).effects.speed,15);d.build.edition='2024';assert.equal(M.derive(d,5).effects.speed,20);assert.equal(d.conditions,'Exhaustion 2');
});
