'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),L=require('../js/modules/character-paper-gear-layout');
const items=n=>Array.from({length:n},(_,i)=>({id:'item-'+i,name:'Item '+i,quantity:1,weight:i+1}));
test('an untouched paper projection keeps physical rows and stock unchanged',()=>{
 const base=items(6),before=JSON.stringify(base),rows=L.project({},base).entries;assert.equal(rows.length,6);assert.equal(rows[0].key,'p:item-0');assert.equal(rows[0].quantity,1);assert.equal(JSON.stringify(base),before);
});
test('saved moves retain stable identities across inventory reordering, growth and normalization',()=>{
 const base=items(7),moved=L.operation({},base,0,'down').state,reordered=[base[5],...base.slice(0,5),base[6],...items(9).slice(7)],rows=L.project(JSON.parse(JSON.stringify(moved)),reordered).entries;assert.equal(rows[0].id,'item-1');assert.equal(rows[1].id,'item-0');assert.equal(rows.filter(Boolean).length,9);assert.equal(new Set(rows.filter(Boolean).map(row=>row.key)).size,9);
});
test('Clear hides only a paper reference and retains an explicit blank after new stock arrives',()=>{
 const base=items(6),before=JSON.stringify(base),state=L.operation({},base,1,'clear').state,rows=L.project(state,items(7)).entries;assert.equal(rows[1],null);assert.equal(rows.filter(Boolean).length,6);assert.equal(rows.some(row=>row?.id==='item-1'),false);assert.equal(rows.some(row=>row?.id==='item-6'),true);assert.equal(JSON.stringify(base),before);
});
test('Delete compacts its source column while retaining owned records outside the paper',()=>{
 const base=items(40),before=JSON.stringify(base),state=L.operation({},base,2,'delete').state,rows=L.project(state,base).entries;assert.equal(rows[2].id,'item-3');assert.equal(rows[17],null);assert.equal(rows[18].id,'item-18');assert.equal(rows.filter(Boolean).length,39);assert.equal(JSON.stringify(base),before);
});
test('Insert keeps the first blank without losing any stock or affecting the next populated row',()=>{
 const base=items(6),state=L.operation({},base,1,'insert').state,rows=L.project(state,base).entries;assert.equal(rows[1],null);assert.equal(rows[2].id,'item-1');assert.equal(rows[6].id,'item-5');assert.equal(rows.filter(Boolean).length,6);
});
test('source field overrides follow a moved reference and never rewrite physical quantities/weights',()=>{
 const base=items(6),before=JSON.stringify(base);let state=L.edit({},base,0,'quantity','2');state=L.edit(state,base,0,'weight','0,25');state=L.edit(state,base,0,'location','Backpack');state=L.operation(state,base,0,'down').state;const rows=L.project(state,base).entries;assert.equal(rows[1].quantity,2);assert.equal(rows[1].weight,.25);assert.equal(rows[1].location,'Backpack');assert.equal(JSON.stringify(base),before);assert.equal(L.project(L.automatic(state,'p:item-0','weight'),base).entries[1].weight,1);
});
test('paper copies retain independent positions/blank quantities from their physical source',()=>{
 const base=items(6);base[54]={...base[0],reference:true,quantity:''};const options={copyRows:[{slot:54,destination:'extra'}]},state=L.operation({},base,54,'down',options).state,rows=L.project(state,base,options).entries;assert.equal(rows[0].key,'p:item-0');assert.equal(rows[55].key,'c:extra:item-0');assert.equal(rows[55].quantity,'');assert.equal(rows[54],null);
});
test('footer switches retain custom positions, displace ordinary gear and restore it on return',()=>{
 const base=items(56),state=L.operation({},base,48,'down').state,footer=[...base.slice(0,50),{header:true},...Array(3).fill(null),...base.slice(50)],rows=L.project(state,footer,{footer:true}).entries;assert.equal(rows[50].header,true);assert.equal(rows.filter(row=>row&&!row.header).length,56);assert.equal(rows.slice(51,54).filter(Boolean).length,0);assert.equal(rows[49].id,'item-48');assert.equal(L.project(state,base).entries[50].id,'item-50');
});
test('missing ownership stays a named unavailable position instead of shifting later gear',()=>{
 const base=items(6),state=L.operation({},base,0,'down').state,rows=L.project(state,base.slice(1)).entries;assert.equal(rows[1].unavailable,true);assert.match(rows[1].name,/Item 0.*unavailable/);assert.equal(rows[2].id,'item-2');assert.throws(()=>L.edit(state,base.slice(1),1,'weight',3),/available/);
});
test('malformed private positions/fields are bounded and cannot inject another field or executable weight',()=>{
 const raw={layout:[{slot:0,key:'p:a',name:'A'},{slot:0,key:'p:b'},{slot:1,key:'p:a'},{slot:2,key:'bad/key'},{slot:1200,key:'p:c'},{slot:3,empty:true}],values:{'p:a':{weight:'2+2',quantity:0,location:'Pack',attuned:true}},hidden:['p:a','p:a','bad']},before=JSON.stringify(raw),state=L.normalize(raw);assert.equal(state.layout.length,2);assert.deepEqual(state.hidden,['p:a']);assert.deepEqual(state.values['p:a'],{quantity:0,location:'Pack'});assert.equal(JSON.stringify(raw),before);
});
test('truthy nonboolean empty flags cannot bypass key validation and a trailing blank retains its position',()=>{
 assert.deepEqual(L.normalize({layout:[{slot:2,empty:'yes'},{slot:3,empty:1,key:'bad'}]}).layout,[]);
 const base=items(18),state=L.operation({},base,17,'delete').state,rows=L.project(state,base).entries;assert.equal(rows.length,18);assert.equal(rows[17],null);
});
test('clearing a unit-weight override restores known or unknown automatic weight; explicit zero stays distinct',()=>{
 const base=items(1);let state=L.edit({},base,0,'weight',0);assert.equal(L.project(state,base).entries[0].weight,0);state=L.edit(state,base,0,'weight','');assert.equal(L.project(state,base).entries[0].weight,1);base[0].weight=null;state=L.edit({},base,0,'name','Mystery supply');assert.equal(L.project(state,base).entries[0].weight,null);state=L.edit(state,base,0,'weight','');assert.equal(L.project(state,base).entries[0].weight,null);
});
test('the final bounded continuation is a complete original table and cannot discard an edge row',()=>{
 const base=items(L.maxRows),before=JSON.stringify(base);assert.throws(()=>L.operation({},base,L.maxRows-1,'down'),/boundary/);const state=L.operation({},base,L.maxRows-2,'down').state,rows=L.project(state,base).entries;assert.equal(rows.length,L.maxRows);assert.equal(rows[L.maxRows-1].id,'item-'+(L.maxRows-2));assert.equal(rows.filter(Boolean).length,L.maxRows);assert.equal(JSON.stringify(base),before);
});
test('footer reference positions cannot be forged into ordinary gear or the protected heading',()=>{
 const state=L.normalize({layout:[{slot:0,key:'f:wand'},{slot:50,key:'f:ring'},{slot:53,key:'f:cloak'}]});assert.deepEqual(state.layout,[{slot:53,key:'f:cloak',name:''}]);
});
