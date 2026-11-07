'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),A=require('../js/modules/character-actions'),catalog=require('../data/rules/catalog.json');
const make=(level=1,wis=16)=>{const d=M.normalize({build:{classId:'cleric',edition:'2014'},abilities:{wis}});d.adobe={classLevels:[{classId:'cleric',subclassId:'light-domain',level}],classFeatureChoices:{}};return d;};
const ctx=(d,level)=>({level,mods:M.derive(d,level).mods});
test('2014 Light Domain tracks Warding Flare with the correct Wisdom-based recovery pool',()=>{
 for(const [wis,max] of [[8,1],[10,1],[16,3],[20,5]]){const d=make(1,wis),row=()=>M.derive(d,1).classResources.find(r=>r.id==='cleric-warding-flare');assert.equal(row().max,max);for(let i=0;i<max;i++)assert.equal(C.changeClassResource(d,row().id,1,ctx(d,1)),true);assert.equal(C.changeClassResource(d,row().id,1,ctx(d,1)),false);C.resetClassResources(d,'short',ctx(d,1));assert.equal(row().remaining,0);C.resetClassResources(d,'long',ctx(d,1));assert.equal(row().remaining,max);}
});
test('Light Domain uses the precise Radiance of the Dawn Channel Divinity and no generic domain placeholder',()=>{
 for(const [level,available] of [[1,false],[2,true],[20,true]]){const d=make(level),row=M.derive(d,level).classResources.find(r=>r.id==='legacy-channel-divinity'),effects=row?.channelEffects||[];assert.equal(!!effects.find(effect=>effect.id==='light-radiance-of-the-dawn'),available);assert.equal(effects.some(effect=>effect.id==='cleric-subclass'),false);if(available)assert.match(effects.find(effect=>effect.id==='light-radiance-of-the-dawn').detail,new RegExp('2d10 \\+ '+level));}
});
test('Light Domain adds Wisdom to damaging Cleric cantrips from Cleric 8 and shows its higher-level features',()=>{
 const d=make(8,16);d.spells=[{catalogId:'Spell-phb-42a97600d519fa06',classId:'cleric'}];let s=M.derive(d,8),a=A.resolve({kind:'spell',ref:'Spell-phb-42a97600d519fa06::cleric'},d,8,s,[],catalog.spells);assert.match(a.damage,/\+ 3/);assert.ok(s.effects.traits.some(detail=>detail.startsWith('Potent Spellcasting')));d.adobe.classLevels[0].level=6;s=M.derive(d,6);assert.ok(s.effects.traits.some(detail=>detail.startsWith('Improved Flare')));d.adobe.classLevels[0].level=17;s=M.derive(d,17);assert.ok(s.effects.traits.some(detail=>detail.startsWith('Corona of Light')));
});
