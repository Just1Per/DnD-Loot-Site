'use strict';
global.CharacterBackgroundData=require('../js/modules/character-background-data');
require('../js/modules/character-expanded-background-data');
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),F=require('../js/modules/character-background-features');
const base=()=>{const d=M.normalize({build:{background:'folk-hero-2014',edition:'2014',classId:'fighter'}});d.adobe={};return d;};
test('default legacy feature has an actionable summary and retains its source reference',()=>{const d=base(),p=F.project(d);assert.equal(p.name,'Rustic Hospitality');assert.match(p.description,/shelter.*immediate danger/);assert.match(p.reference,/p\. 131/);assert.doesNotMatch(p.description,/See .*rules/);assert.notEqual(p.description,p.name);assert.equal(p.selection,'auto');});
test('original feature names form independent choices without changing skills, tools, coins or origin feats',()=>{const d=base(),before=JSON.stringify({build:d.build,coins:d.coins,skills:d.skills});F.set(d,'feature:Researcher');assert.equal(F.project(d).name,'Researcher');assert.match(F.project(d).description,/piece of lore/);assert.match(F.project(d).reference,/137/);assert.equal(JSON.stringify({build:d.build,coins:d.coins,skills:d.skills}),before);assert.ok(M.derive(d,3).effects.traits.some(s=>s.startsWith('Researcher — background feature')));assert.ok(!M.derive(d,3).effects.traits.some(s=>s.startsWith('Rustic Hospitality — background feature')));});
test('custom feature and edited descriptions survive normalization and changing away from a background',()=>{const d=base();F.set(d,'custom',{name:'Local hero',description:'My table’s rules.',edited:true});assert.equal(F.project(d).description,'My table’s rules.');d.build.background='acolyte';assert.equal(F.project(d).name,'Shelter of the Faithful');d.build.background='folk-hero-2014';assert.equal(F.project(d).name,'Local hero');F.describe(d,'Changed writing');d.adobe.backgroundFeatures=F.normalize(d.adobe.backgroundFeatures);assert.equal(F.project(d).description,'Changed writing');});
test('new legacy selections are hidden under revised rules while recorded choices and free notes are retained',()=>{const d=base();F.set(d,'feature:Researcher');d.build.edition='2024';const options=F.choices(d,['Rustic Hospitality']);assert.equal(options.some(r=>r.value==='feature:Rustic Hospitality'),false);assert.equal(options.find(r=>r.value==='feature:Researcher').disabled,true);F.describe(d,'Retained reference.');assert.equal(F.project(d).description,'Retained reference.');assert.throws(()=>F.set(d,'feature:Rustic Hospitality',{names:['Rustic Hospitality']}),/available/);});
test('malformed maps, forbidden keys and oversized writing are bounded before saving',()=>{assert.deepEqual(F.normalize([]),{});assert.deepEqual(F.normalize(JSON.parse('{"__proto__":{"selection":"custom","name":"bad"}}')),{});const d=base(),before=JSON.stringify(d);assert.throws(()=>F.set(d,'custom',{name:'x'.repeat(161)}),/160/);assert.equal(JSON.stringify(d),before);assert.equal(F.normalize({custom:{selection:'custom',description:'x'.repeat(7000)}}).custom.description.length,6000);});

test('every named background has a nonempty automatic summary in its own edition',()=>{
 const B=require('../js/modules/character-backgrounds');
 for(const [id,bg] of Object.entries({...B.legacy,...B.modern,...B.expanded})){
  const d=M.normalize({build:{background:id,edition:bg.edition}}),before=JSON.stringify(d),p=F.project(d);
  assert.ok(p.name,id);assert.ok(p.description.length>30,id);assert.doesNotMatch(p.description,/See .*for the rules|Choose one: \./,id);
  assert.equal(JSON.stringify(d),before,'projection must not mutate '+id);
 }
});
test('2024 shows its actual feat and edition summary without adding a narrative trait or a duplicate grant',()=>{
 const B=require('../js/modules/character-backgrounds');
 for(const [id,bg] of Object.entries(B.modern)){
  const d=M.normalize({build:{background:id,edition:'2024'}}),before=JSON.stringify(M.derive(d,3)),p=F.project(d);
  assert.equal(p.name,'Background feat: '+bg.feat,id);assert.match(p.description,/2024 backgrounds grant a feat/,id);assert.ok(p.description.includes(bg.feat),id);
  assert.equal(F.choices(d)[0].label,p.name);assert.equal(M.derive(d,3).effects.originFeats.filter(name=>name===bg.feat).length,1,id);
  assert.ok(!M.derive(d,3).effects.traits.some(s=>s.includes('Background feat:')),id);
  F.describe(d,'My own notes.');assert.equal(F.project(d).description,'My own notes.');assert.equal(JSON.stringify(M.derive(d,3)),before,'description must not change effects');
 }
});
test('2024 selectable feats require an eligible saved choice and refresh when changed',()=>{
 const d=M.normalize({build:{background:'haunted-one-rthw',edition:'2024'}});
 d.build.backgroundFeat='Tough';assert.equal(F.project(d).name,'Background feat choice');assert.match(F.project(d).description,/Choose one: Survivor, Aberrant Anatomy/);assert.doesNotMatch(F.project(d).description,/Tough/);
 d.build.backgroundFeat='Survivor';assert.equal(F.project(d).name,'Background feat: Survivor');assert.match(F.project(d).description,/Configure Survivor/);
 d.build.backgroundFeat='Aberrant Anatomy';assert.equal(F.project(d).name,'Background feat: Aberrant Anatomy');
 F.describe(d,'Table agreement.');d.build.backgroundFeat='Survivor';assert.equal(F.project(d).description,'Table agreement.');
});
test('edited and intentionally empty 2024 descriptions survive background changes and normalization',()=>{
 let d=M.normalize({build:{background:'farmer-2024',edition:'2024'}});
 const reopen=raw=>({...M.normalize(raw),adobe:{...raw.adobe,backgroundFeatures:F.normalize(raw.adobe.backgroundFeatures)}});
 F.describe(d,'');d.build.background='sage-2024';assert.match(F.project(d).description,/Wizard cantrips/);
 d.build.background='farmer-2024';d=reopen(d);assert.equal(F.project(d).description,'');assert.equal(F.project(d).edited,true);
 d.build.background='sage-2024';F.describe(d,'Own spell notes.');d=reopen(d);assert.equal(F.project(d).description,'Own spell notes.');
});
