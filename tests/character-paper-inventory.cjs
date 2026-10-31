'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-paper-inventory');
const owned=n=>Array.from({length:n},(_,i)=>({id:'owned-'+i,name:'Item '+i,quantity:1,weight:i+1}));
test('the original footer reserves one title and three names while moving every displaced physical row to Extra Equipment',()=>{
 const all=owned(56),before=JSON.stringify(all),state=P.footer({},true),rows=P.project(state,all).entries;assert.equal(rows[50].header,true);assert.equal(rows[54],all[50]);assert.equal(rows[59],all[55]);assert.equal(rows.filter(row=>row&&!row.header&&!row.reference).length,56);assert.equal(JSON.stringify(all),before);assert.deepEqual(P.project(P.footer(state,false),all).entries,all);
});
test('original copy destinations create a paper reference with blank quantity, never physical ownership or extra mass',()=>{
 const all=owned(6),before=JSON.stringify(all),copy=P.copy({},all,'owned-1','extra'),project=P.project(copy.state,all);assert.equal(copy.slot,54);assert.equal(project.entries[54].reference,true);assert.equal(project.entries[54].quantity,'');assert.equal(project.entries[54].weight,2);assert.equal(project.entries.filter(row=>row&&!row.reference).length,6);assert.equal(JSON.stringify(all),before);
});
test('copy reuses an already visible physical/reference row instead of duplicating it',()=>{
 const all=owned(6),direct=P.copy({},all,'owned-1','gear');assert.equal(direct.reused,true);assert.equal(direct.slot,1);assert.deepEqual(direct.state.copies,[]);const copied=P.copy({},all,'owned-1','extra'),again=P.copy(copied.state,all,'owned-1','extra');assert.equal(again.reused,true);assert.equal(again.state.copies.length,1);
});
test('footer is an explicit source-layout choice and its three reference rows cannot overwrite one another',()=>{
 const all=owned(6);assert.throws(()=>P.copy({},all,'owned-0','footer'),/Enable/);let state=P.footer({},true);for(let i=0;i<3;i++)state=P.copy(state,all,'owned-'+i,'footer').state;assert.throws(()=>P.copy(state,all,'owned-3','footer'),/full/);assert.equal(P.copy(state,all,'owned-1','footer').reused,true);const rows=P.project(state,all).entries;assert.equal(rows[51].id,'owned-0');assert.equal(rows[51].quantity,'');assert.equal(P.footer(state,false).footer[1].id,'owned-1');
});
test('a full original target rejects copying without replacing real gear',()=>{
 const all=owned(91),before=JSON.stringify(all);assert.throws(()=>P.copy({},all,'owned-0','extra'),/full/);assert.equal(JSON.stringify(all),before);assert.throws(()=>P.copy({},all,'other-owner','extra'),/owned/);
});
test('later inventory growth retains a displaced reference on a continuation and reports the changed destination',()=>{
 const state=P.copy({},owned(6),'owned-0','extra').state,all=owned(91),project=P.project(state,all);assert.equal(project.copyRows[0].displaced,true);assert.equal(project.entries[91].id,'owned-0');assert.equal(project.entries[54],all[54]);assert.equal(project.entries.filter(row=>row&&!row.reference).length,91);
});
test('removing ownership retains a named unavailable reference, and clearing the reference keeps physical inventory unchanged',()=>{
 const all=owned(6),state=P.copy({},all,'owned-0','extra').state,missing=P.project(state,all.slice(1));assert.equal(missing.entries[54].unavailable,true);assert.match(missing.entries[54].name,/unavailable/);const cleared=P.remove(state,'owned-0','extra');assert.equal(cleared.copies.length,0);assert.equal(all[0].quantity,1);
});
test('malformed copy state is bounded, deduplicated and isolated between original destinations',()=>{
 const raw={attunedFooter:'yes',footer:[{id:'x'},{id:'x'},{id:'bad/id'}],copies:[{id:'x',slot:54,destination:'extra'},{id:'x',slot:55,destination:'extra'},{id:'x',slot:1,destination:'gear'},{id:'y',slot:999,destination:'extra'}]},before=JSON.stringify(raw),n=P.normalize(raw);assert.equal(n.attunedFooter,false);assert.equal(n.footer[1],null);assert.equal(n.footer[2],null);assert.equal(n.copies.length,2);assert.equal(JSON.stringify(raw),before);
});
