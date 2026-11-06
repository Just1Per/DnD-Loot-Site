'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/modules/character-subclass-data');global.CharacterSubclassData=S;require('../js/modules/character-expanded-subclass-data');global.CharacterSrdClassData=require('../js/modules/character-srd-class-data');
const P=require('../js/modules/character-class-progression');
test('every selectable subclass has a pinned source feature timeline through its supported level range',()=>{
 const rows=Object.values(S.all);assert.equal(rows.length,186);
 for(const row of rows){const source=row.classId==='artificer'?(row.edition==='2024'?'efa':'tce'):undefined,features=P.subclassFeatures(row.classId,row.id,row.edition,source);assert.ok(features.length,row.id);assert.ok(features.some(feature=>feature.level>=row.minimumLevel&&feature.level<=20),row.id);assert.ok(features.every(feature=>Number.isInteger(feature.level)&&feature.level>=1&&feature.level<=20&&typeof feature.name==='string'&&feature.name.length>0),row.id);}
});
test('non-SRD selectable subclasses now retain source feature names and level unlocks without claiming mechanics',()=>{
 const rows=P.subclassFeatures('warlock','hexblade','2014');assert.deepEqual(rows.map(row=>row.level),[1,1,1,3,6,10,14]);assert.ok(rows.every(row=>row.incomplete));assert.ok(rows.every(row=>/Detailed mechanics/.test(row.summary)));
});
