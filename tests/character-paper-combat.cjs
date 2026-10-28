'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-paper-combat');
test('paper combat normalizes bounded separate reminders and counters without altering other records',()=>{
 const raw={actions:{action:['A'.repeat(5000),...Array(20).fill('other')],bonus:['Bonus'],reaction:['React']},ammunition:[{name:'Arrows',amount:40,loaded:20},{name:'Bullets',amount:80,loaded:50}]},before=JSON.stringify(raw),data=P.normalize(raw);
 assert.equal(data.actions.action.length,12);assert.equal(data.actions.action[0].length,4000);assert.equal(data.actions.bonus[0],'Bonus');assert.equal(data.actions.reaction[0],'React');assert.equal(data.ammunition.length,2);assert.equal(JSON.stringify(raw),before);
 assert.equal(P.normalize({ammunition:[{name:'constructor',amount:4}]}).ammunition[0].loaded,4);
});
test('action moves cross paper-page boundaries and opposing overflow columns without changing text',()=>{
 let raw=P.normalize();raw.actions.action[5]='Sixth';raw.actions.action[6]='Seventh';const before=JSON.stringify(raw);let next=P.operation(raw,'action',5,'down');assert.equal(next.index,6);assert.equal(next.data.actions.action[6],'Sixth');assert.equal(next.data.actions.action[5],'Seventh');assert.equal(JSON.stringify(raw),before);
 next=P.operation(next.data,'action',6,'opposite');assert.equal(next.index,9);assert.equal(next.data.actions.action[9],'Sixth');
 assert.throws(()=>P.operation(raw,'bonus',6,'opposite'));assert.throws(()=>P.operation(raw,'action',0,'up'));assert.throws(()=>P.operation(raw,'reaction',11,'down'));
});
test('insert stops at the first empty row; full rows reject atomically and deletion follows the source page boundary',()=>{
 const raw=P.normalize();raw.actions.action=['A','B','','D',...Array(8).fill('')];const result=P.operation(raw,'action',0,'insert');assert.deepEqual(result.data.actions.action.slice(0,4),['','A','B','D']);
 const full=P.normalize({actions:{action:Array.from({length:12},(_,i)=>String(i))}}),before=JSON.stringify(full);assert.throws(()=>P.operation(full,'action',0,'insert'),/No empty/);assert.equal(JSON.stringify(full),before);
 raw.actions.action[6]='Overflow';const deleted=P.operation(raw,'action',0,'delete');assert.equal(deleted.data.actions.action[6],'Overflow');assert.equal(deleted.data.actions.action[0],'B');
 const cleared=P.operation(full,'action',2,'clear');assert.equal(cleared.data.actions.action[2],'');assert.equal(cleared.data.actions.action[3],'3');
});
test('ammunition use, undo and reload preserve the total and never refill by resting or reset',()=>{
 let data=P.editAmmo(P.normalize(),0,'name','Arrows');data=P.editAmmo(data,0,'amount',40);
 for(let i=0;i<20;i++)data=P.editAmmo(data,0,'spend');assert.deepEqual(data.ammunition[0],{name:'Arrows',amount:20,loaded:0});
 const before=JSON.stringify(data);assert.throws(()=>P.editAmmo(data,0,'spend'),/Reload/);assert.equal(JSON.stringify(data),before);
 data=P.editAmmo(data,0,'reload');assert.deepEqual(data.ammunition[0],{name:'Arrows',amount:20,loaded:20});data=P.editAmmo(data,0,'spend');data=P.editAmmo(data,0,'undo');assert.deepEqual(data.ammunition[0],{name:'Arrows',amount:20,loaded:20});assert.throws(()=>P.editAmmo(data,0,'undo'),/full/);
 data=P.editAmmo(data,0,'amount',0);assert.throws(()=>P.editAmmo(data,0,'spend'),/No ammunition/);assert.equal(P.editAmmo(data,0,'reload').ammunition[0].amount,0);
});
test('all source ammunition variants expose only their own exact logical positions',()=>{
 for(const [name,icon]of Object.entries(P.ammoTypes)){const row=P.ammoProjection({name,amount:100,loaded:100});assert.equal(row.icon,icon);assert.equal(row.loaded,P.limits[icon]);assert.equal(P.ammoSlots(row).length,row.capacity);for(const [i,slot]of P.ammoSlots(row).entries())assert.equal(P.sourceAmmoSlot(row,slot),i);}
 assert.equal(P.sourceAmmoSlot({name:'Arrows'},'Top.Axe.2'),1);assert.equal(P.sourceAmmoSlot({name:'Handaxes'},'Top.1'),-1);assert.equal(P.sourceAmmoSlot({name:'Spears'},'Base.11'),0);assert.equal(P.sourceAmmoSlot({name:'Bullets'},'Top.1'),-1);
});
test('invalid text, selections and amounts reject without replacing the saved paper data',()=>{
 const raw=P.normalize(),before=JSON.stringify(raw);for(const value of ['',-1,1.1,1000001,'1+2'])assert.throws(()=>P.editAmmo(raw,0,'amount',value));for(const [group,index]of [['constructor',0],['action',-1],['reaction',12]])assert.throws(()=>P.editAction(raw,group,index,'x'));assert.throws(()=>P.editAction(raw,'action',0,'x'.repeat(4001)));assert.equal(JSON.stringify(raw),before);
 const text='<img src=x onerror=alert(1)> Ærlig påmindelse';assert.equal(P.editAction(raw,'reaction',0,text).actions.reaction[0],text);
});
