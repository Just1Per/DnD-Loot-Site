'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-adobe-print-plan');
test('connected printing selects populated continuation ranges without duplicate source variants',()=>{
 const input={feats:13,magicItems:17,gear:150,equipmentNotes:4,notes:7,spells:132,spellPage:true,companions:[0,2],wildPage:true,wildForms:9,logEntries:13,logPage:true,reference:true},before=JSON.stringify(input),pages=P.create(input);
 assert.deepEqual(pages.slice(0,5).map(p=>p.page),['page-1','page-2','page-3','page-4','page-5']);assert.equal(pages.filter(p=>p.page==='template-ASfront').length,4);assert.deepEqual(pages.filter(p=>p.page==='template-ASnotes').map(p=>p.notesOffset),[2,4,6]);assert.deepEqual(pages.filter(p=>p.page==='template-SSmore').map(p=>p.spellPage),[0,1]);assert.deepEqual(pages.filter(p=>p.page==='template-AScomp').map(p=>p.companionIndex),[0,2]);assert.deepEqual(pages.filter(p=>p.page==='template-ALlog').map(p=>p.logPage),[0,1,2]);assert.deepEqual(pages.filter(p=>p.page==='template-WSfront').map(p=>p.wildPage),[0,1,2]);assert.equal(pages.at(-1).page,'page-6');assert.equal(JSON.stringify(input),before);
});
test('empty optional pages stay optional, selected blank pages remain printable and base ranges do not spill',()=>{
 assert.equal(P.create().length,5);assert.equal(P.create({feats:4,magicItems:5,gear:90,notes:2}).length,5);assert.equal(P.create({spellPage:true,spells:55}).filter(p=>p.page.startsWith('template-SS')).length,1);assert.equal(P.create({wildPage:true,logPage:true}).length,7);
});
test('invalid counts and excessive batches fail explicitly instead of silently dropping character data',()=>{
 for(const n of [-1,1.5,Infinity,NaN,100001])assert.throws(()=>P.create({notes:n}));assert.throws(()=>P.create({magicItems:100000}));assert.throws(()=>P.create({companions:[-1]}));assert.throws(()=>P.create({companions:[12]}));assert.throws(()=>P.create({equipmentNotes:99999}));
});
test('each caster gets its own header, continuation offsets and slot-pool presentation',()=>{
 const pages=P.create({spellPage:true,spellGroups:[{id:'wizard',count:132},{id:'warlock',count:5},{id:'unassigned',count:1}]}).filter(p=>p.page.startsWith('template-SS'));
 assert.deepEqual(pages.map(p=>[p.page,p.spellCaster,p.spellPage]),[['template-SSfront','wizard',undefined],['template-SSmore','wizard',0],['template-SSmore','wizard',1],['template-SSfront','warlock',undefined],['template-SSfront','unassigned',undefined]]);
 assert.throws(()=>P.create({spellGroups:[{id:'wizard',count:1},{id:'wizard',count:2}]}));assert.throws(()=>P.create({spellGroups:[{id:'wizard',count:-1}]}));
});
test('action overflow prints its original page only when populated, without repeating other lists',()=>{const pages=P.create({actionOverflow:true});assert.equal(pages.length,6);assert.deepEqual(pages.at(-1),{page:'template-ASoverflow',combatOnly:true});});

test('a fourth hit-die pool gets a read-only notes continuation instead of disappearing',()=>{const pages=P.create({hitDiceOverflow:true});assert.equal(pages.length,6);assert.deepEqual(pages.at(-1),{page:'template-ASnotes',hitDiceOverflow:true});});

test('limited-feature overflow shares one original combat page with action overflow',()=>{assert.deepEqual(P.create({resourceOverflow:true}).at(-1),{page:'template-ASoverflow',combatOnly:true});assert.equal(P.create({resourceOverflow:true,actionOverflow:true}).filter(row=>row.page==='template-ASoverflow').length,1);});

test('additional counter notes are independent of journal and fourth-hit-die continuation pages',()=>{const pages=P.create({resourceNotes:true,hitDiceOverflow:true,resourceOverflow:true});assert.equal(pages.filter(row=>row.resourceNotes).length,1);assert.equal(pages.filter(row=>row.hitDiceOverflow).length,1);assert.equal(pages.filter(row=>row.page==='template-ASoverflow').length,1);assert.equal(pages.length,8);});
