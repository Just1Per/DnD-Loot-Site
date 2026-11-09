'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const M=require('../js/modules/character-sheet-model');
const make=(level)=>{const d=M.normalize({build:{classId:'barbarian',edition:'2014'},abilities:{cha:16}});d.adobe={classLevels:[{classId:'barbarian',subclassId:'berserker',level}],classFeatureChoices:{}};return d;};
test('2014 Berserker gates each feature at its Barbarian level',()=>{for(const [level,names]of [[3,['Frenzy']],[6,['Frenzy','Mindless Rage']],[10,['Frenzy','Mindless Rage','Intimidating Presence']],[14,['Frenzy','Mindless Rage','Intimidating Presence','Retaliation']]]){const traits=M.derive(make(level),level).effects.traits.join(' ');for(const name of names)assert.match(traits,new RegExp(name));}});
test('Berserker does not apply to the 2024 subclass with the same display name',()=>{const d=make(14);d.build.edition='2024';assert.equal(M.derive(d,14).berserker.active,false);});
