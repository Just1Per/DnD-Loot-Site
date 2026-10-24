const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),F=require('../js/modules/character-feat-rules'),Catalog=require('../js/modules/character-catalog');
const make=(level=7,int=16)=>{const d=M.normalize({abilities:{int},build:{classId:'artificer',edition:'2014'}});d.adobe={classLevels:[{classId:'artificer',level}],classFeatureChoices:{}};return d;};
const context=(d,level)=>({level,mods:M.derive(d,level).mods});
const change=(d,delta,level=7)=>C.changeClassResource(d,'artificer-flash-of-genius',delta,context(d,level));
test('Flash of Genius unlocks at actual Artificer 7 and scales only with Intelligence',()=>{
 for(let level=1;level<=20;level++){const rows=M.derive(make(level),level).classResources;assert.equal(rows.length,level>=7?1:0);if(rows.length){assert.equal(rows[0].max,3);assert.equal(rows[0].bonus,3);}}
 for(const [int,bonus,max]of [[8,-1,1],[10,0,1],[12,1,1],[20,5,5],[30,10,10]]){const row=M.derive(make(7,int),7).classResources[0];assert.equal(row.bonus,bonus);assert.equal(row.max,max);}
 const d=make(6);d.adobe.classLevels.push({classId:'wizard',level:14});assert.equal(M.derive(d,20).classResources.length,0);assert.equal(change(d,1,20),false);
});
test('finite uses can be spent and undone without adding a permanent skill or save bonus',()=>{
 const d=make(),before=M.derive(d,7);for(let i=0;i<3;i++)assert.equal(change(d,1),true);assert.equal(change(d,1),false);let after=M.derive(d,7);assert.equal(after.classResources[0].remaining,0);assert.deepEqual(after.skills,before.skills);assert.deepEqual(after.saves,before.saves);assert.equal(change(d,-1),true);assert.equal(M.derive(d,7).classResources[0].remaining,1);assert.equal(change(d,2),false);assert.equal(C.changeClassResource(d,'forged',1,context(d,7)),false);
});
test('only Long Rest recovers uses and saved uses persist across editions and level changes',()=>{
 const d=make();change(d,1);F.reset(d,'short');assert.equal(M.derive(d,7).classResources[0].used,1);d.build.edition='2024';assert.equal(M.derive(d,7).classResources[0].used,1);const saved=JSON.stringify(d.adobe.classFeatureChoices);d.adobe.classLevels[0].level=6;assert.equal(M.derive(d,6).classResources.length,0);assert.equal(JSON.stringify(d.adobe.classFeatureChoices),saved);d.adobe.classLevels[0].level=7;const hp=d.hpCurrent;d.slots[0]={max:2,used:1};F.reset(d,'long');assert.equal(M.derive(d,7).classResources[0].remaining,3);assert.equal(d.hpCurrent,hp);assert.equal(d.slots[0].used,1);change(d,1);Catalog.longRest(d);assert.equal(M.derive(d,7).classResources[0].remaining,3);
});
test('Intelligence reductions preserve spent uses and never create negative availability',()=>{
 const d=make();change(d,1);change(d,1);d.abilities.int=10;const r=M.derive(d,7).classResources[0];assert.equal(r.used,2);assert.equal(r.remaining,0);assert.equal(change(d,1),false);assert.equal(change(d,-1),true);assert.equal(change(d,-1),true);assert.equal(change(d,-1),false);
});
