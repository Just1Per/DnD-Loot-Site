const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),E=require('../js/modules/character-equipment'),V=require('../js/modules/character-build-validation'),F=require('../js/modules/character-feat-data');
const data=(id='rogue',level=1,edition='2024')=>{const d=M.normalize({build:{classId:id,edition},abilities:{str:14,dex:14}});d.adobe={classLevels:[{classId:id,level}],classFeatureChoices:{}};return d;};
const context=(d,level)=>{const r=M.derive(d,level);return{level,effects:{...r.effects,proficiencies:r.weaponTraining.baseProficiencies},feats:r.feats}};
const choose=(d,id,index,value,level)=>C.setWeaponTraining(d,C.groupKey('2024',id,'weapon-mastery'),index,value,context(d,level));
test('mastery class allowances scale by actual class levels and edition',()=>{
 for(const [id,rows]of [['fighter',[[1,3],[4,4],[10,5],[16,6]]],['barbarian',[[1,2],[4,3],[10,4]]],['rogue',[[1,2],[20,2]]],['ranger',[[1,2],[20,2]]],['paladin',[[1,2],[20,2]]]])for(const [level,count]of rows){assert.equal(M.derive(data(id,level),level).weaponTraining.reports[0].allowed,count);assert.equal(M.derive(data(id,level,'2014'),level).weaponTraining.reports.length,0);}
 const d=data('wizard',3);d.adobe.classLevels.push({classId:'fighter',level:1});assert.equal(M.derive(d,4).weaponTraining.reports[0].allowed,3);assert.equal(M.derive(d,3).weaponTraining.reports.length,0);assert.equal(M.derive(data('fighter',1),10).weaponTraining.reports[0].allowed,3);
});
test('Rogue choices require proficiency and Barbarian excludes ranged weapons',()=>{
 const d=data();assert.equal(choose(d,'rogue',0,'dagger',1),true);assert.equal(choose(d,'rogue',1,'shortbow',1),true);assert.equal(choose(d,'rogue',0,'longbow',1),false);assert.equal(choose(d,'rogue',1,'dagger',1),false);
 assert.equal(choose(data('barbarian'),'barbarian',0,'longbow',1),false);assert.equal(choose(data('barbarian'),'barbarian',0,'handaxe',1),true);
 d.proficiencies='Longbow';assert.equal(choose(d,'rogue',0,'longbow',1),true,'manual weapon training is respected');
});
test('mastery never grants proficiency and saved higher-level, duplicate and forged choices stay inactive',()=>{
 const d=data('fighter',4);for(const [i,w]of ['dagger','shortbow','longbow','greatsword'].entries())assert.equal(choose(d,'fighter',i,w,4),true);
 const before=JSON.stringify(d.adobe.classFeatureChoices);d.adobe.classLevels[0].level=1;const r=M.derive(d,1);assert.equal(r.weaponTraining.masteries.length,3);assert.equal(r.weaponTraining.reports[0].overflow,1);assert.equal(JSON.stringify(d.adobe.classFeatureChoices),before);
 d.adobe.classLevels=[{classId:'rogue',level:1}];d.build.classId='rogue';d.adobe.classFeatureChoices['2024:rogue:weapon-mastery']=['longbow','forged'];assert.equal(M.derive(d,1).weaponTraining.masteries.length,0);assert.ok(!M.derive(d,1).effects.proficiencies.includes('Longbow'));
 assert.ok(V.check(d,M.derive(d,1),{level:1}).issues.some(i=>i.category==='Weapon training'&&i.tab==='skills'));
});
test('class and feat sources do not consume duplicate mastery choices',()=>{
 const d=data('fighter',1);d.adobe.classLevels.push({classId:'rogue',level:1});assert.equal(choose(d,'fighter',0,'dagger',2),true);assert.equal(choose(d,'rogue',0,'dagger',2),false);assert.equal(choose(d,'rogue',0,'shortbow',2),true);
});
test('Weapon Master editions have explicit different choices and disappear when feat is removed or ineligible',()=>{
 const id=edition=>Object.keys(F).find(id=>F[id].name==='Weapon Master'&&F[id].edition===edition);
 const d=data('wizard',4);d.rulesChoices.feats=[id('2024')];let r=M.derive(d,4);let group=r.weaponTraining.reports[0];assert.equal(group.kind,'mastery');assert.equal(group.allowed,1);assert.equal(C.setWeaponTraining(d,group.key,0,'dagger',context(d,4)),true);assert.equal(M.derive(d,4).weaponTraining.masteries[0].property,'Nick');
 assert.equal(M.derive(d,3).weaponTraining.reports.length,0,'feat level prerequisite still applies');d.rulesChoices.feats=[];assert.equal(M.derive(d,4).weaponTraining.masteries.length,0);assert.ok(Object.keys(d.adobe.classFeatureChoices).length,'inactive selection is retained');
 d.rulesChoices.feats=[id('2014')];r=M.derive(d,4);group=r.weaponTraining.reports[0];assert.equal(group.kind,'proficiency');assert.equal(group.allowed,4);assert.equal(C.setWeaponTraining(d,group.key,0,'longbow',context(d,4)),true);r=M.derive(d,4);assert.ok(r.effects.proficiencies.includes('Longbow'));assert.equal(r.weaponTraining.masteries.length,0);
});
test('weapon attacks distinguish unlocked, unselected and 2014 properties',()=>{
 const d=data();choose(d,'rogue',0,'dagger',1);const loot=[{id:'dagger',quantity:1,item:{name:'Dagger'}},{id:'bow',quantity:1,item:{name:'Shortbow'}}];d.equipmentState=E.choices({loadout:loot.map(e=>({id:e.id,equipped:true}))});let r=M.derive(d,1,loot);assert.match(r.gear.attacks.find(a=>a.id==='dagger').notes.join(' '),/Nick.*unlocked/);assert.match(r.gear.attacks.find(a=>a.id==='bow').notes.join(' '),/Vex.*not selected/);
 loot[0].item.mechanics=E.normalize({kind:'weapon',base:'dagger',edition:'2014'});r=M.derive(d,1,loot);assert.ok(!r.gear.attacks.find(a=>a.id==='dagger').notes.some(n=>n.startsWith('Mastery:')));
});

test('replacing a legacy proficiency cannot silently invalidate mastery that depends on it',()=>{
 const d=data();const id=Object.keys(F).find(id=>F[id].name==='Weapon Master'&&F[id].edition==='2014');d.rulesChoices.feats=[id];let group=M.derive(d,1).weaponTraining.reports.find(g=>g.kind==='proficiency');
 assert.equal(C.setWeaponTraining(d,group.key,0,'longbow',context(d,1)),true);assert.equal(choose(d,'rogue',0,'longbow',1),true);
 assert.equal(C.setWeaponTraining(d,group.key,0,'greatsword',context(d,1)),false);assert.equal(choose(d,'rogue',0,'',1),true);assert.equal(C.setWeaponTraining(d,group.key,0,'greatsword',context(d,1)),true);
});
