'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-paper-magic');
const owned=n=>Array.from({length:n},(_,i)=>({entry:{id:'entry-'+i,quantity:1},item:{name:'Item '+i},choice:{equipped:true,attuned:i<3}}));
const ids=rows=>rows.map(row=>row?.entry.id||'');
test('default paper rows retain owned order and the original twelve positions without copying physical gear',()=>{
 const all=owned(6),before=JSON.stringify(all),rows=P.rows({},all);assert.equal(rows.length,12);assert.deepEqual(ids(rows).slice(0,7),['entry-0','entry-1','entry-2','entry-3','entry-4','entry-5','']);assert.equal(JSON.stringify(all),before);
});
test('source move and insert preserve identity/attunement and cross the fifth-row boundary',()=>{
 const all=owned(6),moved=P.operation({},all,4,'down');assert.equal(moved.index,5);assert.equal(P.rows(moved.state,all)[5],all[4]);assert.equal(P.rows(moved.state,all)[4],all[5]);assert.deepEqual(moved.deactivate,[]);assert.equal(P.rows(moved.state,owned(7))[6].entry.id,'entry-6','new ownership fills an automatic blank without manufacturing a continuation');
 const inserted=P.operation({},all,4,'insert'),rows=P.rows(inserted.state,all);assert.equal(rows[4],null);assert.equal(rows[5],all[4]);assert.equal(rows[6],all[5]);assert.deepEqual(inserted.deactivate,[]);
});
test('clear keeps an empty position while delete shifts later source rows and requests only the removed effect to stop',()=>{
 const all=owned(6),cleared=P.operation({},all,1,'clear'),deleted=P.operation({},all,1,'delete');assert.equal(P.rows(cleared.state,all)[1],null);assert.equal(P.rows(cleared.state,all)[2],all[2]);assert.equal(P.rows(deleted.state,all)[1],all[2]);assert.deepEqual(cleared.deactivate,['entry-1']);assert.deepEqual(deleted.deactivate,['entry-1']);assert.deepEqual(deleted.state.hidden,['entry-1']);assert.equal(all[1].choice.equipped,true,'pure row operation must leave actual equipment state to the shared controller');
});
test('Delete on a partly empty first page does not pull an overflow item onto that page',()=>{
 const all=owned(3),state={slots:Array.from({length:12},(_,i)=>({id:i===0?'entry-0':i===1?'entry-1':i===5?'entry-2':'',empty:![0,1,5].includes(i)}))},next=P.operation(state,all,0,'delete');assert.equal(P.rows(next.state,all)[0],all[1]);assert.equal(P.rows(next.state,all)[4],null);assert.equal(P.rows(next.state,all)[5],all[2]);
});
test('a full original table rejects insertion rather than dropping an item; new owned entries are retained',()=>{
 const all=owned(12),before=JSON.stringify(all);assert.throws(()=>P.operation({},all,2,'insert'),/no empty row/);assert.equal(JSON.stringify(all),before);assert.equal(P.rows({},owned(13)).filter(Boolean).length,13);
});
test('source replacement reuses an existing reference or explicitly restores a hidden owned item',()=>{
 const all=owned(6),swapped=P.choose({},all,1,'entry-4');assert.equal(P.rows(swapped.state,all)[1],all[4]);assert.equal(P.rows(swapped.state,all)[4],all[1]);assert.deepEqual(swapped.deactivate,[]);
 const cleared=P.operation({},all,2,'clear'),restored=P.choose(cleared.state,all,2,'entry-2');assert.equal(P.rows(restored.state,all)[2],all[2]);assert.deepEqual(restored.state.hidden,[]);assert.throws(()=>P.choose({},all,0,'unowned'),/owned/);
});
test('removed ownership preserves a named unavailable reference and cannot silently acquire another item',()=>{
 const all=owned(3),saved=P.operation({},all,0,'down').state,rows=P.rows(saved,all.slice(1));assert.equal(rows[1].entry.id,'entry-0');assert.equal(rows[1].unavailable,true);assert.match(rows[1].item.name,/unavailable/);assert.equal(rows[0],all[1]);assert.equal(P.rows(P.operation(saved,all.slice(1),2,'down').state,all.slice(1))[1].item.name,rows[1].item.name,'rearranging other rows does not multiply unavailable annotations');
});
test('malformed/duplicate references and unsupported commands are bounded without mutating saved input',()=>{
 const raw={slots:[{id:'entry-0',name:'One'},{id:'entry-0'},{id:'bad/id'}],hidden:['entry-1','entry-1',null]},before=JSON.stringify(raw),n=P.normalize(raw);assert.equal(n.slots[1].id,'');assert.equal(n.slots[1].empty,true);assert.equal(n.slots[2].id,'');assert.deepEqual(n.hidden,['entry-1']);assert.equal(JSON.stringify(raw),before);assert.throws(()=>P.operation({},owned(2),0,'unsupported'),/available/);
});

test('footer copy reuses an existing magic row without changing paper state or ownership',()=>{
 const all=owned(6),raw=P.operation({},all,0,'down').state,before=JSON.stringify(raw),stock=JSON.stringify(all),result=P.copy(raw,all,'entry-0');assert.equal(result.index,1);assert.equal(result.reused,true);assert.deepEqual(result.deactivate,[]);assert.equal(JSON.stringify(result.state),before);assert.equal(JSON.stringify(all),stock);
});
test('footer copy restores hidden magic into the first empty row without deactivating another item',()=>{
 const all=owned(6),cleared=P.operation({},all,2,'clear'),restored=P.copy(cleared.state,all,'entry-2');assert.equal(restored.index,2);assert.equal(restored.reused,false);assert.equal(P.rows(restored.state,all)[2],all[2]);assert.deepEqual(restored.deactivate,[]);assert.deepEqual(restored.state.hidden,[]);
});
test('full destination and missing ownership refuse footer copying without partial changes',()=>{
 const all=owned(13),state=P.operation({},all,12,'clear').state;state.slots=state.slots.slice(0,12);const before=JSON.stringify(state);assert.throws(()=>P.copy(state,all,'entry-12'),/full/);assert.equal(JSON.stringify(state),before);assert.throws(()=>P.copy(state,all,'missing'),/owned/);
});
