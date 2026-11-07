"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),A=require('../js/modules/character-actions'),S=require('../js/modules/character-spellcasting'),catalog=require('../data/rules/catalog.json');
const make=(level=1,wis=16)=>{const d=M.normalize({build:{classId:'cleric',edition:'2014',autoSlots:true},abilities:{wis}});d.adobe={classLevels:[{classId:'cleric',subclassId:'war-domain',level}],classFeatureChoices:{}};return d;};
const ctx=(d,level)=>({level,mods:M.derive(d,level).mods});
test('2014 War Domain grants Heavy armor and Martial weapons only while the actual Cleric level is valid',()=>{
 for(const level of [1,6,20]){const d=make(level),p=M.derive(d,level).effects.proficiencies;assert.ok(p.includes('Heavy armor'));assert.ok(p.includes('Martial weapons'));}
 const d=make(1);d.build.edition='2024';assert.ok(!M.derive(d,1).effects.proficiencies.includes('Heavy armor'));
 d.build.edition='2014';d.adobe.classLevels=[{classId:'fighter',level:20},{classId:'cleric',subclassId:'war-domain',level:1}];assert.ok(!M.derive(d,20).effects.proficiencies.includes('Heavy armor'));
});
test('War Priest has Wisdom-modifier uses with a minimum of one, persists spending and refreshes only on a Long Rest',()=>{
 for(const [wis,max] of [[8,1],[10,1],[16,3],[20,5]]){const d=make(1,wis),row=()=>M.derive(d,1).classResources.find(r=>r.id==='cleric-war-priest');assert.equal(row().max,max);for(let i=0;i<max;i++)assert.equal(C.changeClassResource(d,row().id,1,ctx(d,1)),true);assert.equal(C.changeClassResource(d,row().id,1,ctx(d,1)),false);C.resetClassResources(d,'short',ctx(d,1));assert.equal(row().remaining,0);C.resetClassResources(d,'long',ctx(d,1));assert.equal(row().remaining,max);}
});
test('War Domain Channel Divinity exposes Guided Strike at level 2 and War God’s Blessing at level 6 through the shared legacy pool',()=>{
 for(const [level,expected] of [[1,[]],[2,['war-guided-strike']],[5,['war-guided-strike']],[6,['war-guided-strike','war-gods-blessing']]]){const d=make(level),row=M.derive(d,level).classResources.find(r=>r.id==='legacy-channel-divinity');assert.deepEqual((row?.channelEffects||[]).filter(e=>e.id.startsWith('war-')).map(e=>e.id),expected);if(row&&expected.length){assert.equal(C.useChannelDivinity(d,row.id,expected[0],ctx(d,level)),true);assert.equal(M.derive(d,level).classResources.find(r=>r.id===row.id).used,1);}}
});
test('Divine Strike is a weapon-only conditional note, scales at Cleric 14, and Avatar of Battle adds the nonmagical resistance reminder',()=>{
 const d=make(8),weapon={kind:'weapon',ref:'longsword'};let stats=M.derive(d,8),action=A.resolve(weapon,d,8,stats,[],catalog.spells);assert.match(action.notes.join(' '),/Divine Strike.*1d8/);d.adobe.classLevels[0].level=14;stats=M.derive(d,14);action=A.resolve(weapon,d,14,stats,[],catalog.spells);assert.match(action.notes.join(' '),/Divine Strike.*2d8/);assert.equal(A.resolve({kind:'unarmed'},d,14,stats,[],catalog.spells).notes.some(n=>n.includes('Divine Strike')),false);d.adobe.classLevels[0].level=17;stats=M.derive(d,17);assert.ok(stats.effects.resistances.includes('Bludgeoning, Piercing, and Slashing (nonmagical attacks)'));assert.ok(stats.effects.traits.some(t=>t.startsWith('Avatar of Battle')));
});
test('War Domain spells are automatically available from the published level thresholds',()=>{
 for(const [level,names] of [[1,['Divine Favor','Shield of Faith']],[3,['Magic Weapon','Spiritual Weapon']],[9,['Flame Strike','Hold Monster']]]){const d=make(level),profile=S.profiles(d,level,M.derive(d,level).scores).find(p=>p.classId==='cleric'),grants=S.automaticGrants(profile,catalog.spells).map(s=>s.name);for(const name of names)assert.ok(grants.includes(name),name+' at Cleric '+level);}
});
