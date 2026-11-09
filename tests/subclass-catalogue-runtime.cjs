'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/modules/character-subclass-data'),M=require('../js/modules/character-sheet-model');
test('the complete selectable subclass catalogue is available to independently loaded rule modules',()=>{
 assert.equal(Object.keys(S.all).length,186);assert.equal(S.forClass('cleric').length,20);assert.equal(S.find('death-domain').classId,'cleric');assert.equal(S.find('hexblade').classId,'warlock');assert.equal(S.find('war-domain-2024').edition,'2024');
 const d=M.normalize({build:{classId:'cleric',edition:'2014'},abilities:{wis:16}});d.adobe={classLevels:[{classId:'cleric',subclassId:'death-domain',level:2}],classFeatureChoices:{}};const effects=M.derive(d,2).classResources.find(row=>row.id==='legacy-channel-divinity').channelEffects;assert.ok(effects.some(row=>row.id==='cleric-subclass'&&row.name.includes('Death Domain')));
});
