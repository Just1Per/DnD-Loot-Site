'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../js/modules/character-spellcasting');
test('known and fixed-prepared selections enforce cantrip and leveled pools independently',()=>{
 for(const edition of ['2014','2024']){const p=S.profile('sorcerer',1,edition,{cha:16}),rows=Array.from({length:p.spellCount},()=>({level:1,prepared:true}));assert.equal(S.selectionState(p,rows).error,'');assert.match(S.selectionState(p,[...rows,{level:1}]).error,/Too many level 1/);assert.match(S.selectionState(p,Array.from({length:p.cantrips+1},()=>({level:0}))).error,/Too many cantrips/);assert.match(S.selectionState(p,[]).notice,/Incomplete/);}
});
test('Wizard spellbook minimum is guidance, preparation is bounded, and learned extras remain valid',()=>{
 const p=S.profile('wizard',3,'2014',{int:16}),rows=Array.from({length:40},(_,i)=>({level:1,prepared:i<p.spellCount}));assert.equal(S.selectionState(p,rows).error,'');assert.match(S.selectionState(p,[]).notice,/spellbook spell/);rows[p.spellCount].prepared=true;assert.match(S.selectionState(p,rows).error,/Too many prepared Wizard/);
});
test('automatic grants remain additional and source changes recalculate counting without writing rows',()=>{
 const catalogue=require('../data/rules/catalog.json').spells,p=S.profile('druid',1,'2024',{wis:16}),grant=S.automaticGrants(p,catalogue).find(row=>row.name==='Speak with Animals'),rows=[{catalogId:grant.id,level:1,prepared:true},...Array.from({length:p.spellCount},()=>({level:1,prepared:true}))],before=JSON.stringify(rows),state=S.selectionState(p,rows,catalogue);assert.equal(state.error,'');assert.equal(state.counts.automatic,1);assert.equal(state.counts.leveled,p.spellCount);assert.equal(JSON.stringify(rows),before);
});
test('retained imported exceptions cannot be increased but can be reduced or left unchanged',()=>{
 const p=S.profile('wizard',1,'2014',{int:10}),old=Array.from({length:p.spellCount+2},()=>({level:1,prepared:true}));assert.equal(S.selectionState(p,old,[],old).error,'');assert.equal(S.selectionState(p,old,[],old).inherited.length,1);assert.match(S.selectionState(p,[...old,{level:1,prepared:true}],[],old).error,/Too many prepared/);assert.equal(S.selectionState(p,old.slice(1),[],old).error,'');assert.match(S.selectionState(p,old).error,/Too many prepared/);
});
