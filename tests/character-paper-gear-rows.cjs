'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../js/modules/character-paper-gear-rows');
const gear=(n=54)=>({kind:n===36?'extra':'gear',rows:Array.from({length:n},(_,i)=>({name:'Gear '+i,quantity:i,weight:i/10,location:'Container '+i,reference:'owned-'+i}))});
test('source row moves swap all four fields and stable references across the column boundary',()=>{
 const original=gear(),before=JSON.stringify(original),result=G.operation(original,17,'down');assert.deepEqual(result.state.rows[18],original.rows[17]);assert.deepEqual(result.state.rows[17],original.rows[18]);assert.equal(result.index,18);assert.equal(JSON.stringify(original),before);
});
test('Clear blanks only its row; Delete shifts only that column, preserving the next column',()=>{
 const original=gear(),clear=G.operation(original,5,'clear').state,deleted=G.operation(original,5,'delete').state;assert.equal(clear.rows[5].name,'');assert.deepEqual(clear.rows[6],original.rows[6]);assert.deepEqual(deleted.rows[5],original.rows[6]);assert.equal(deleted.rows[17].name,'');assert.deepEqual(deleted.rows[18],original.rows[18]);assert.deepEqual(deleted.rows[5].location,'Container 6');
});
test('Insert uses the first empty row below, preserving later rows and every field',()=>{
 const original=gear();original.rows[20]={};const result=G.operation(original,17,'insert').state;assert.equal(result.rows[17].name,'');assert.deepEqual(result.rows[18],original.rows[17]);assert.deepEqual(result.rows[20],original.rows[19]);assert.deepEqual(result.rows[21],original.rows[21]);assert.equal(result.rows[18].quantity,17);
});
test('a full table rejects Insert atomically and never discards the final record',()=>{
 const original=gear(),before=JSON.stringify(original);assert.throws(()=>G.operation(original,0,'insert'),/Nothing was removed/);assert.equal(JSON.stringify(original),before);assert.throws(()=>G.operation(original,53,'down'),/boundary/);
});
test('the original footer heading is immutable and separates normal gear from its three magic rows',()=>{
 const original={...gear(),footer:true};assert.throws(()=>G.operation(original,50,'clear'),/editable/);assert.throws(()=>G.operation(original,49,'down'),/boundary/);assert.throws(()=>G.operation(original,51,'up'),/boundary/);assert.equal(G.operation(original,51,'down').state.rows[52].reference,'owned-51');
 const deleted=G.operation(original,48,'delete').state;assert.equal(deleted.rows[48].reference,'owned-49');assert.equal(deleted.rows[49].name,'');assert.equal(deleted.rows[50].name,'');assert.equal(deleted.rows[51].reference,'owned-51');
});
test('a blank footer cannot be consumed by Insert above its heading',()=>{
 const original={...gear(),footer:true};original.rows[51]={};assert.throws(()=>G.operation(original,48,'insert'),/Nothing was removed/);original.rows[53]={};const inserted=G.operation(original,52,'insert').state;assert.equal(inserted.rows[52].name,'');assert.equal(inserted.rows[53].reference,'owned-52');
});
test('column moves compact the source column and move the entire record into the first empty target',()=>{
 const original=gear();original.rows[21]={};const moved=G.moveColumn(original,2,1);assert.equal(moved.index,21);assert.deepEqual(moved.state.rows[21],original.rows[2]);assert.deepEqual(moved.state.rows[2],original.rows[3]);assert.equal(moved.state.rows[17].name,'');assert.deepEqual(moved.state.rows[36],original.rows[36]);
});
test('a full target column refuses a move without dropping source gear or spilling into another column',()=>{
 const original=gear(),before=JSON.stringify(original);assert.throws(()=>G.moveColumn(original,2,1),/destination column is full/);assert.equal(JSON.stringify(original),before);assert.throws(()=>G.moveColumn(original,2,0),/already/);assert.throws(()=>G.moveColumn(original,2,3),/available/);
});
test('Extra Equipment uses two 18-row columns with independent final boundaries',()=>{
 const original=gear(36),deleted=G.operation(original,17,'delete').state;assert.equal(deleted.rows.length,36);assert.equal(deleted.rows[17].name,'');assert.equal(deleted.rows[18].reference,'owned-18');assert.throws(()=>G.moveColumn(original,0,2),/available/);assert.throws(()=>G.operation(original,36,'clear'),/editable/);
});
test('numeric fields distinguish blank from zero, accept decimal comma, reject code and preserve unrelated fields',()=>{
 const original=gear(),before=JSON.stringify(original);let edited=G.edit(original,0,'weight','0,25');edited=G.edit(edited,0,'quantity','0');assert.equal(edited.rows[0].weight,.25);assert.equal(edited.rows[0].quantity,0);assert.equal(edited.rows[0].reference,'owned-0');assert.equal(G.edit(edited,0,'weight','').rows[0].weight,'');assert.throws(()=>G.edit(original,0,'weight','2+2'),/number/);assert.throws(()=>G.edit(original,0,'quantity',-1),/number/);assert.throws(()=>G.edit(original,0,'quantity',1000001),/number/);assert.throws(()=>G.edit(original,0,'reference','forged'),/Choose/);assert.equal(JSON.stringify(original),before);
});
