'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createCharacterSheetStore}=require('../js/modules/character-sheet-store');
const store=createCharacterSheetStore({});
test('private-sheet image budgeting counts encoded UTF-8 bytes and leaves the character untouched',()=>{const plain={adobe:{portrait:''},notes:'x'.repeat(1000)},unicode={adobe:{portrait:''},notes:'é'.repeat(1000)},before=JSON.stringify(unicode);assert.equal(store.estimateBytes(unicode)-store.estimateBytes(plain),1000);assert.equal(JSON.stringify(unicode),before);assert.ok(store.estimateBytes({adobe:{portrait:''},notes:'é'.repeat(500000)})>900000);});
test('the runtime Adobe alias is not counted twice in the persisted image budget',()=>{const adobe={portrait:'x'.repeat(1000)},embedded={rulesChoices:{grants:{__adobe:{data:adobe,used:0}}}},runtime={...embedded,adobe};assert.equal(store.estimateBytes(runtime),store.estimateBytes(embedded));});
