'use strict';
const assert=require('node:assert/strict');

global.CharacterBackgroundData=require('../js/modules/character-background-data');
require('../js/modules/character-expanded-background-data');
global.CharacterBackgrounds=require('../js/modules/character-backgrounds');
global.CharacterFeatData=require('../js/modules/character-feat-data');
const F=require('../js/modules/character-feat-rules');

const haunted=CharacterBackgrounds.get('haunted-one-rthw');
assert.ok(haunted);
assert.equal(haunted.fixedFeat,false);
assert.ok(haunted.featChoices.includes('Survivor'));
assert.ok(haunted.featChoices.includes('Aberrant Anatomy'));
assert.ok(!haunted.featChoices.includes('Sharp Eye'));

const data={
  build:{edition:'2024',background:'haunted-one-rthw',backgroundFeat:'Survivor',race:''},
  rulesChoices:{feats:[],effects:{},grants:{}}
};
const entries=F.entries(data);
const background=entries.find(e=>e.key==='origin-background');
assert.ok(background,'chosen Haunted One feat should become a managed background feat');
assert.equal(F.definitions[background.id].name,'Survivor');
assert.equal(background.originLabel,'Background');

data.build.backgroundFeat='Aberrant Anatomy';
const gift=F.entries(data).find(e=>e.key==='origin-background');
assert.equal(F.definitions[gift.id].name,'Aberrant Anatomy');

console.log('SUCCESS Ravenloft background feat choices resolve to real feat entries');
