const assert = require('node:assert/strict');
const P = require('../js/modules/character-progression');

assert.equal(P.levelFromXP(0), 1, '0 XP should be level 1');
assert.equal(P.levelFromXP(299), 1, '299 XP should remain level 1');
assert.equal(P.levelFromXP(300), 2, '300 XP should be level 2');
assert.equal(P.levelFromXP(355000), 20, '355000 XP should be level 20');
const xp = P.xpProgress(47999);
assert.equal(xp.level, 8);
assert.equal(xp.current, 34000);
assert.equal(xp.next, 48000);
assert.equal(xp.remaining, 1);
assert.ok(xp.percent > 99 && xp.percent < 100);

const sorcerer16 = P.calculateHP({classLevels:[{classId:'sorcerer',level:16}],constitution:14,hpMode:'fixed'});
assert.equal(sorcerer16.max, 98, 'level 16 Sorcerer with CON 14 fixed HP should be 98');
assert.equal(P.calculateHP({classLevels:[{classId:'fighter',level:1}],constitution:14,hpMode:'fixed'}).max, 12, 'level 1 Fighter should use max hit die plus CON');
assert.equal(P.calculateHP({classLevels:[{classId:'sorcerer',level:2}],constitution:14,hpMode:'max'}).max, 16, 'maximum HP mode should use maximum hit die at every level');
assert.equal(P.calculateHP({classLevels:[{classId:'wizard',level:2}],constitution:8,hpMode:'rolled',hpRolls:[1]}).max, 6, 'each level should add at least one HP after CON');

const multi = [{classId:'sorcerer',level:7},{classId:'wizard',level:3}];
assert.equal(P.totalLevel(multi), 10);
assert.equal(P.casterLevel(multi,'2014'), 10);
assert.deepEqual(P.spellSlots(multi,'2014'), [4,3,3,3,2,0,0,0,0]);
assert.equal(P.casterLevel([{classId:'paladin',level:1}],'2014'), 0, '2014 Paladin multiclass rounds half level down');
assert.equal(P.casterLevel([{classId:'paladin',level:1}],'2024'), 1, '2024 Paladin multiclass begins Spellcasting at level 1');
assert.equal(P.hitDiceSummary([{classId:'fighter',level:3},{classId:'wizard',level:2}]), '3d10 + 2d6');

console.log('SUCCESS character progression: XP, HP, hit dice and multiclass slots');

for(const hpMode of ['fixed','max','rolled']) {
 const hp=P.calculateHP({classLevels:[{classId:'fighter',level:2},{classId:'wizard',level:2}],constitution:8,hpMode,hpRolls:[3,2,1],bonuses:8,bonusSources:[{kind:'feat',name:'Tough',value:8}]});
 assert.equal(hp.classHP+hp.constitutionHP+hp.minimumHP+hp.bonuses+hp.totalMinimumHP,hp.max);
 assert.equal(hp.bonusSources[0].name,'Tough');
 assert.equal(hp.bonusSources.reduce((sum,s)=>sum+s.value,0),hp.bonuses);
}
const low=P.calculateHP({classLevels:[{classId:'wizard',level:2}],constitution:1,hpMode:'rolled',hpRolls:[1]});
assert.equal(low.minimumHP,5);assert.equal(low.max,2);
console.log('SUCCESS HP source totals reconcile fixed, rolled, multiclass and minimum HP');
