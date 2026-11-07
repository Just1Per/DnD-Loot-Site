'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseReference,allowance,recoveryRule}=require('../scripts/build-adobe-item-resources.cjs');
test('static item pools retain exact units and explicit partial recharge without running source callbacks',()=>{
 const source=`var Base_MagicItemsList={wand:{name:'Wand',usages:7,recovery:'dawn',additional:'regains 1d6+1',spellFirstColTitle:'Ch',descriptionFull:'PRIVATE PROSE',action:function(){throw Error('Never run');}},boots:{name:'Boots',usages:10,recovery:'long rest',additional:'minutes',attunement:true},candle:{name:'Candle',usages:'240 min',recovery:'Never'}};throw Error('Never evaluate this module');`;
 const data=parseReference(source),wand=data.definitions.find(row=>row.name==='Wand');
 assert.equal(wand.max,7);assert.equal(wand.unit,'charges');assert.deepEqual(wand.recharge,{event:'dawn',mode:'roll',roll:{count:1,size:6,bonus:1}});
 assert.equal(data.definitions.find(row=>row.name==='Boots').unit,'minutes');assert.equal(data.definitions.find(row=>row.name==='Boots').requiresAttunement,true);
 assert.deepEqual(data.definitions.find(row=>row.name==='Candle').recharge,{event:'never',mode:'none'});assert.equal(data.definitions.find(row=>row.name==='Candle').max,240);
 assert.doesNotMatch(JSON.stringify(data),/PRIVATE PROSE|Never run|throw Error|function/);assert.equal(data.source.edition,'2014');
});
test('computed allowances, getter properties, dynamic recovery and unnamed variants never become guessed pools',()=>{
 const data=parseReference(`var Base_MagicItemsList={a:{name:'A',usages:level+1,recovery:'dawn'},b:{name:'B',get usages(){throw Error('getter');},recovery:'dawn'},c:{name:'C',usages:7,recovery:getRecovery()},d:{name:'D',variants:{usages:3,recovery:'dawn'}},e:{name:'E',usages:7,usagescalc:'event.value = level;',recovery:'dawn'}};`);
 assert.equal(data.definitions.length,0);assert.equal(data.excluded.length,5);assert.doesNotMatch(JSON.stringify(data),/getter|level\+1|getRecovery/);
 assert.throws(()=>parseReference('var Base_MagicItemsList = getItems();'),/literal/);
});
test('conflicting normalized names are excluded instead of silently choosing a charge count',()=>{
 const data=parseReference(`var Base_MagicItemsList={a:{name:'Wand',usages:7,recovery:'dawn'},b:{name:'WAND',usages:3,recovery:'dawn'}};`);
 assert.equal(data.definitions.length,0);assert.equal(data.excluded[0].reason,'ambiguous-variant-pools');
 const same=parseReference(`var Base_MagicItemsList={a:{name:'Wand',usages:7,recovery:'dawn'},b:{name:'Wand',usages:7,recovery:'dawn'}};`);assert.equal(same.definitions.length,1);
});
test('unknown recovery qualifiers stay manual and numeric/dice limits reject expressions and excessive values',()=>{
 assert.deepEqual(recoveryRule('daily','',false),{event:'manual',mode:'manual'});assert.deepEqual(recoveryRule('day','',false),{event:'manual',mode:'manual'});
 assert.deepEqual(recoveryRule('dawn','regains half the charges',false),{event:'dawn',mode:'manual'});assert.deepEqual(recoveryRule('after 7 days','',false),{event:'manual',mode:'manual'});assert.deepEqual(recoveryRule('dawn','',true),{event:'dawn',mode:'manual'});
 assert.deepEqual(recoveryRule('long rest','minutes',false),{event:'long',mode:'all'});assert.equal(recoveryRule('dawn','regains 999d999+999',false).mode,'manual');
 for(const value of [0,-1,1.5,10001,'1+2','7 charges; run()','Infinity'])assert.equal(allowance({type:'Literal',value}),null);
});
