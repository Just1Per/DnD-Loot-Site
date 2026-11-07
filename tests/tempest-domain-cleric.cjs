'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),A=require('../js/modules/character-actions'),catalog=require('../data/rules/catalog.json');
const make=(level=1,wis=16)=>{const d=M.normalize({build:{classId:'cleric',edition:'2014'},abilities:{wis}});d.adobe={classLevels:[{classId:'cleric',subclassId:'tempest-domain',level}],classFeatureChoices:{}};return d;};
const ctx=(d,level)=>({level,mods:M.derive(d,level).mods});
test('2014 Tempest Domain grants armor and weapons and resets Wrath of the Storm only on a Long Rest',()=>{
 const d=make(1,16),profs=M.derive(d,1).effects.proficiencies,row=()=>M.derive(d,1).classResources.find(r=>r.id==='cleric-wrath-of-the-storm');assert.ok(profs.includes('Heavy armor'));assert.ok(profs.includes('Martial weapons'));assert.equal(row().max,3);assert.equal(C.changeClassResource(d,row().id,1,ctx(d,1)),true);C.resetClassResources(d,'short',ctx(d,1));assert.equal(row().used,1);C.resetClassResources(d,'long',ctx(d,1));assert.equal(row().used,0);assert.match(row().description,/2d8 Lightning or Thunder/);
});
test('Tempest Domain exposes Destructive Wrath through the shared legacy Channel Divinity resource',()=>{
 for(const [level,available] of [[1,false],[2,true],[20,true]]){const d=make(level),effects=M.derive(d,level).classResources.find(r=>r.id==='legacy-channel-divinity')?.channelEffects||[];assert.equal(!!effects.find(effect=>effect.id==='tempest-destructive-wrath'),available);assert.equal(effects.some(effect=>effect.id==='cleric-subclass'),false);}
});
test('Tempest Domain shows Thunderbolt Strike, Divine Strike scaling and conditional Stormborn flight at their levels',()=>{
 const d=make(6);let s=M.derive(d,6);assert.ok(s.effects.traits.some(t=>t.startsWith('Thunderbolt Strike')));d.adobe.classLevels[0].level=8;s=M.derive(d,8);let a=A.resolve({kind:'weapon',ref:'longsword'},d,8,s,[],catalog.spells);assert.match(a.notes.join(' '),/1d8 thunder/);d.adobe.classLevels[0].level=14;s=M.derive(d,14);a=A.resolve({kind:'weapon',ref:'longsword'},d,14,s,[],catalog.spells);assert.match(a.notes.join(' '),/2d8 thunder/);d.adobe.classLevels[0].level=17;s=M.derive(d,17);assert.ok(s.effects.conditionalSpeeds.some(speed=>speed.type==='fly'&&speed.condition.includes('not underground')));
});
