'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-adobe-build-plan'),R=require('../js/modules/character-rules'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices');
const options={classes:R.classes},row=(classId,level=1,subclassId='')=>({classId,level,subclassId});
test('native class allocation uses every class at all twenty levels in either edition without touching resources',()=>{
 for(const edition of ['2014','2024'])for(const classId of Object.keys(R.classes))for(let level=1;level<=20;level++){
  const data=M.normalize({build:{edition,classId:'wizard',scoreMode:'final'},hpCurrent:7,hpTemp:3,coins:{gp:29},spells:[{name:'Kept spell'}]}),identity={level:1,name:'Kept name'},before=JSON.stringify({data,identity});data.adobe={classLevels:[],classFeatureChoices:{'keep:choice':['retained']}};const choices=structuredClone(data.adobe.classFeatureChoices),next=P.apply(data,identity,[row(classId,level)],options);
  assert.equal(next.identity.level,level);assert.equal(next.data.build.classId,classId);assert.equal(next.data.adobe.classLevels[0].level,level);assert.equal(next.data.hpCurrent,7);assert.equal(next.data.hpTemp,3);assert.deepEqual(next.data.coins,data.coins);assert.deepEqual(next.data.spells,data.spells);assert.deepEqual(next.data.adobe.classFeatureChoices,choices);assert.deepEqual(identity,{level:1,name:'Kept name'});assert.equal(data.build.classId,'wizard');assert.equal(M.derive(next.data,level).pb,Math.ceil(level/4)+1);assert.equal(JSON.stringify({data:{...data,adobe:undefined},identity}),before);
 }
});
test('allocation validates raw input before normalizing and rejects inherited class IDs, duplicates and overflow',()=>{
 for(const value of ['',null,true,0,21,1.5,'NaN','Infinity'])assert.throws(()=>P.allocate([row('wizard',value)],options));
 for(const id of ['constructor','__proto__','missing'])assert.throws(()=>P.allocate([row(id)],options));
 for(const raw of [[],null,[row('fighter'),row('fighter')],[row('fighter',19),row('wizard',2)],Array.from({length:9},()=>row('wizard'))])assert.throws(()=>P.allocate(raw,options));assert.equal(P.allocate([row('fighter','3'),row('wizard','2')],options).total,5);
});
test('XP and one-shot constraints must hold before a class draft can apply',()=>{
 assert.throws(()=>P.allocate([row('fighter',3)],{...options,xpLevel:4}));assert.throws(()=>P.allocate([row('fighter',3),row('wizard',2)],{...options,maxLevel:4}));assert.equal(P.allocate([row('fighter',3),row('wizard',2)],{...options,xpLevel:5,maxLevel:5}).total,5);assert.throws(()=>P.allocate([row('fighter',3,'unavailable')],{...options,subclassAllowed:()=>false}));
});
test('multiclass changes retain per-class choices and used resources, including inactive features',()=>{
 const d=M.normalize({build:{edition:'2014',classId:'warlock'},hpCurrent:4,hpTemp:3,slots:[{max:3,used:2}]});d.adobe={classLevels:[row('warlock',3,'fiend')],classFeatureChoices:{}};assert.equal(C.set(d,d.adobe.classLevels[0],'eldritch-invocations',0,'devil-s-sight'),true);d.adobe.pactUsed=1;const before=JSON.stringify(d),next=P.apply(d,{name:'Kept',level:3},[row('warlock',3,'fiend'),row('rogue',2)],options);assert.match(next.identity.class,/Warlock 3.*Rogue 2/);assert.deepEqual(next.data.slots,d.slots);assert.equal(next.data.adobe.pactUsed,1);assert.equal(M.derive(next.data,5).effects.specialSenses[0].range,120);const inactive=P.apply(next.data,next.identity,[row('fighter',5)],options);assert.equal(M.derive(inactive.data,5).effects.specialSenses.length,0);assert.deepEqual(inactive.data.adobe.classFeatureChoices,d.adobe.classFeatureChoices);assert.equal(JSON.stringify(d),before);
});
