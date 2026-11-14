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
test('Gear line operations and field overrides persist privately and drive the same paper projection',()=>{
 const all=owned(6),before=JSON.stringify(all);let state=P.gearAction({},all,0,'edit','quantity',3).state;state=P.gearAction(state,all,0,'edit','weight',.5).state;state=P.gearAction(state,all,0,'down').state;state=P.normalize(JSON.parse(JSON.stringify(state)));const row=P.project(state,all).entries[1];assert.equal(row.id,'owned-0');assert.equal(row.quantity,3);assert.equal(row.weight,.5);assert.equal(JSON.stringify(all),before);
});
test('choosing an owned row swaps its existing reference or restores a cleared reference without creating stock',()=>{
 const all=owned(6);let state=P.gearAction({},all,0,'choose','owned-2').state;assert.equal(P.project(state,all).entries[2].id,'owned-0');state=P.gearAction(state,all,0,'clear').state;assert.equal(P.project(state,all).entries[0],null);state=P.gearAction(state,all,0,'choose','owned-2').state;assert.equal(P.project(state,all).entries[0].id,'owned-2');assert.equal(P.project(state,all).entries.filter(Boolean).length,6);assert.throws(()=>P.gearAction(state,all,0,'choose','other-owner'),/owned/);
});
test('a copied item cleared from its paper row can be copied back to the chosen section',()=>{
 const all=owned(6);let state=P.copy({},all,'owned-0','extra').state;state=P.gearAction(state,all,54,'clear').state;assert.equal(P.project(state,all).entries.some(row=>row?.key==='c:extra:owned-0'),false);const restored=P.copy(state,all,'owned-0','extra');assert.equal(restored.reused,false);const row=P.project(restored.state,all).entries.findIndex(row=>row?.key==='c:extra:owned-0');assert.ok(row>=54&&row<=89);assert.equal(P.project(restored.state,all).entries[row].quantity,'');assert.equal(all[0].quantity,1);
});
test('clearing a footer reference after arranging rows cannot leave a stale unavailable copy',()=>{
 const all=owned(6);let state=P.copy(P.footer({},true),all,'owned-0','footer').state;state=P.gearAction(state,all,0,'down').state;state=P.remove(state,'owned-0','footer');assert.equal(P.project(state,all).entries.slice(51,54).filter(Boolean).length,0);assert.equal(P.project(state,all).entries.filter(row=>row?.id==='owned-0').length,1);
});
test('a moved copy has stable identity, correct current destination and can be copied again without replacing its moved appearance',()=>{
 const all=owned(6);let state=P.copy({},all,'owned-0','extra').state;const originalKey=state.copies[0].key;state=P.gearAction(state,all,54,'page:gear').state;let projection=P.project(state,all);assert.equal(state.copies[0].key,originalKey);assert.equal(state.copies[0].destination,'gear');assert.equal(projection.copyRows[0].slot,6);assert.equal(projection.copyRows[0].displaced,false);state=P.copy(state,all,'owned-0','extra').state;projection=P.project(state,all);assert.equal(state.copies.length,2);assert.equal(new Set(state.copies.map(row=>row.key)).size,2);assert.equal(projection.entries[6].id,'owned-0');assert.equal(projection.entries[54].id,'owned-0');assert.equal(projection.entries.filter(row=>row&&!row.reference).length,6);
});
test('multiple independent copies can share a destination; clearing one does not remove another',()=>{
 const all=owned(6);let state=P.copy({},all,'owned-0','extra').state;state=P.gearAction(state,all,54,'page:gear').state;state=P.copy(state,all,'owned-0','extra').state;state=P.gearAction(state,all,54,'page:gear').state;const rows=P.project(state,all).copyRows;assert.equal(rows.length,2);assert.deepEqual(rows.map(row=>row.slot),[6,7]);state=P.remove(state,'owned-0','gear',rows[0].key);const remaining=P.project(state,all);assert.equal(remaining.copyRows.length,1);assert.equal(remaining.copyRows[0].key,rows[1].key);assert.equal(remaining.entries[7].quantity,'');
});
test('copy restores only a missing destination and fills an explicitly cleared paper gap exactly',()=>{
 const all=owned(6);let state=P.gearAction({},all,0,'page:extra').state;assert.equal(P.project(state,all).entries[5],null);const copied=P.copy(state,all,'owned-0','gear');assert.equal(copied.slot,5);assert.equal(P.project(copied.state,all).entries[5].id,'owned-0');assert.equal(P.project(copied.state,all).entries[54].id,'owned-0');
});

test('automatic attunement follows shared active flags, compacts the footer and keeps physical ownership unchanged',()=>{
 const all=owned(6).map((row,i)=>({...row,attuned:i<3})),before=JSON.stringify(all),state={attunedFooter:true,autoAttuned:true};
 let rows=P.gearRows(state,all);assert.deepEqual(rows.slice(51,54).map(row=>row.id),['owned-0','owned-1','owned-2']);assert.ok(rows.slice(51,54).every(row=>row.automaticAttunement));assert.equal(JSON.stringify(all),before);
 all[0].attuned=false;rows=P.project(state,all).entries;assert.deepEqual(rows.slice(51,54).filter(Boolean).map(row=>row.id),['owned-1','owned-2']);
 rows=P.project(state,all.slice(2)).entries;assert.deepEqual(rows.slice(51,54).filter(Boolean).map(row=>row.id),['owned-2']);assert.equal(all[0].quantity,1);assert.throws(()=>P.gearAction(state,all,51,'clear'),/attunement/);
});
test('automatic footer ignores stale paper overrides and preserves extra slots on a separate continuation without replacing gear',()=>{
 const all=owned(100).map((row,i)=>({...row,attuned:i<6})),raw={attunedFooter:true,autoAttuned:true,footer:[{id:'gone',name:'Old manual copy'}],gearLayout:{hidden:['f:owned-0'],values:{'f:owned-0':{name:'Old alias'}}}},before=JSON.stringify(raw);
 for(const rows of [P.project(raw,all).entries,P.gearRows(raw,all)]){const auto=rows.filter(row=>row?.automaticAttunement&&!row.automaticAttunementHeading);assert.equal(auto.length,6);assert.equal(new Set(auto.map(row=>row.id)).size,6);assert.equal(auto[0].name,'Item 0');assert.equal(rows.filter(row=>row&&!row.reference&&!row.header&&!row.automaticAttunementHeading).length,100);assert.ok(rows.findIndex(row=>row?.automaticAttunementHeading)>=90);assert.ok(rows.filter(row=>row?.automaticAttunementHeading).length===1);}
 assert.equal(JSON.stringify(raw),before);assert.equal(P.project(P.footer(raw,false),all).entries.some(row=>row?.automaticAttunement),false);
});

test('sheet initialization shows the attuned area before any click and migrates existing attunements without losing manual references',()=>{
 for(const raw of [{},{attunedFooter:false,autoAttuned:false}]){const state=P.initialize(raw);assert.equal(state.attunedFooter,true);assert.equal(state.autoAttuned,true);assert.equal(state.footerVisibility,'shown');const rows=P.project(state,owned(2).map(row=>({...row,attuned:true}))).entries;assert.equal(rows[50].header,true);assert.equal(rows[51].id,'owned-0');}
 const manual=P.initialize({attunedFooter:true,footer:[{id:'owned-1',name:'Kept reference'}]});assert.equal(manual.autoAttuned,false);assert.equal(manual.footer[0].name,'Kept reference');
 const hidden=P.footer(P.initialize({}),false);assert.equal(P.initialize(JSON.parse(JSON.stringify(hidden))).attunedFooter,false);assert.equal(P.initialize(hidden).footerVisibility,'hidden');assert.equal(P.initialize(P.footer(hidden,true)).attunedFooter,true);
});
