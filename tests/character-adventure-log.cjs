'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),L=require('../js/modules/character-adventure-log');
test('paper log carries balances across six-entry pages without floating-point gold drift',()=>{
 let log=L.edit({},0,'gold','0.10','start');log=L.edit(log,0,'gold','0.2','gain');log=L.edit(log,5,'gold','-0,15','gain');log=L.edit(log,6,'gold','-1','gain');
 const rows=L.project(log);assert.equal(rows[0].total.gold,.3);assert.equal(rows[5].total.gold,.15);assert.equal(rows[6].start.gold,.15);assert.equal(rows[6].total.gold,-.85);assert.equal(rows[7].start.gold,-.85);
 log=L.edit(log,0,'gold','1','gain');assert.equal(L.project(log)[6].total.gold,-.05);assert.equal(rows[6].total.gold,-.85);
});
test('log numeric input stays bounded and never evaluates JavaScript',()=>{
 for(const value of ['1/0','globalThis.compromised=true','Infinity','NaN','1e4','1.001','1000000001','']){if(value==='')continue;assert.throws(()=>L.edit({},0,'gold',value,'gain'));}
 assert.throws(()=>L.edit({},0,'xp','1.5','gain'));assert.throws(()=>L.edit({},1,'xp','5','start'));assert.throws(()=>L.edit({},120,'xp','5','gain'));assert.throws(()=>L.edit({},0,'__proto__','5','gain'));
 assert.equal(L.edit({},0,'xp','','gain').rows[0].gain.xp,'');assert.equal(L.edit({},0,'xp','-50','gain').rows[0].gain.xp,-50);
});
test('normalization bounds private notes, headers and record count and preserves JSON round trips',()=>{
 assert.equal(L.normalize(null).rows.length,0);const raw={rows:Array.from({length:200},()=>({notes:'x'.repeat(5000)})),faction:'a'.repeat(200)};const norm=L.normalize(raw);assert.equal(norm.rows.length,120);assert.equal(norm.faction.length,160);assert.equal(norm.rows.reduce((sum,r)=>sum+r.notes.length,0),100000);assert.throws(()=>L.edit(norm,119,'notes','one more','text'));assert.equal(raw.rows[0].notes.length,5000);
 const full=L.normalize({rows:[{notes:''},...Array.from({length:25},()=>({notes:'x'.repeat(4000)}))]});assert.throws(()=>L.edit(full,0,'notes','a','text'));assert.equal(full.rows[25].notes.length,4000);
 const saved=JSON.parse(JSON.stringify(norm));assert.deepEqual(L.normalize(saved),norm);
});
test('adventure log field plans are whitelisted and later opening balances and totals are computed',()=>{
 const A=require('../js/modules/character-adobe-fields'),data={profile:{playerName:'Player'},adobe:{adventureLog:L.edit({},5,'xp','100','gain')}},c={data,identity:{name:'Hero'},derived:{progression:{classLevels:[]}},logPage:1};
 assert.equal(A.describe('AdvLog.1.xp.start',c).value,100);assert.throws(()=>A.planEdit('AdvLog.1.xp.start','900',c));assert.throws(()=>A.planEdit('AdvLog.1.xp.total','900',c));assert.deepEqual(A.planEdit('AdvLog.1.notes','Day seven',c).logEdit,{index:6,key:'notes',part:'text'});assert.equal(A.describe('AdvLog.sheetNumber',c).value,2);assert.equal(A.describe('AdvLogS.Background_Faction.Text',c).kind,'select');const faction={id:'AdvLogS.Background_Faction.Text',options:['The Harpers']};assert.equal(A.planEdit(faction,'The Harpers',c).value,'The Harpers');assert.throws(()=>A.planEdit(faction,'Not a source option',c));assert.throws(()=>A.planEdit('AdvLog.constructor','x',c));
});
test('moving and inserting log entries keeps records together and recalculates later balances',()=>{
 let log=L.edit({},0,'adventure','First','text');log=L.edit(log,0,'gold','10','gain');log=L.edit(log,1,'adventure','Second','text');log=L.edit(log,1,'gold','-3','gain');
 const moved=L.operation(log,1,'earlier');assert.equal(moved.index,0);assert.equal(moved.log.rows[0].adventure,'Second');assert.equal(moved.log.rows[0].gain.gold,-3);assert.equal(L.project(moved.log)[0].total.gold,-3);assert.equal(L.project(moved.log)[1].total.gold,7);assert.equal(log.rows[0].adventure,'First');
 const inserted=L.operation(moved.log,1,'insert');assert.equal(inserted.log.rows[1].adventure,'');assert.equal(inserted.log.rows[2].adventure,'First');assert.equal(L.project(inserted.log)[2].total.gold,7);assert.equal(inserted.log.rows.length,3);
});
test('duplicate, clear and removal preserve opening balances and do not alias or discard other records',()=>{
 let log=L.edit({},0,'gold','5','start');log=L.edit(log,0,'gold','2','gain');log=L.edit(log,0,'notes','Original','text');
 const copy=L.operation(log,0,'duplicate');assert.equal(copy.index,1);assert.equal(L.project(copy.log)[1].total.gold,9);copy.log.rows[1].notes='Copy';assert.equal(copy.log.rows[0].notes,'Original');
 const cleared=L.operation(copy.log,0,'clear');assert.equal(cleared.log.rows.length,2);assert.equal(cleared.log.start.gold,5);assert.equal(L.project(cleared.log)[1].total.gold,7);assert.equal(cleared.log.rows[1].notes,'Copy');
 const removed=L.operation(cleared.log,0,'remove');assert.equal(removed.index,0);assert.equal(removed.log.rows[0].notes,'Copy');assert.equal(removed.log.rows.length,1);assert.equal(removed.log.start.gold,5);
});
test('entry operations reject overflow, invalid moves and note-budget overflow atomically',()=>{
 const full=L.normalize({rows:Array.from({length:120},(_,i)=>({adventure:String(i)}))});for(const op of ['insert','duplicate'])assert.throws(()=>L.operation(full,0,op));assert.equal(full.rows[119].adventure,'119');
 for(const [i,op]of [[0,'earlier'],[119,'later'],[120,'clear'],[0,'constructor'],[-1,'remove']])assert.throws(()=>L.operation(full,i,op));
 const notes=L.normalize({rows:Array.from({length:25},()=>({notes:'x'.repeat(4000)}))});assert.throws(()=>L.operation(notes,0,'duplicate'));assert.equal(notes.rows.length,25);assert.equal(L.operation({},0,'insert').log.rows.length,1);
});

test('arithmetic respects precedence, parentheses, unary signs and exact cents across pages',()=>{
 const cases={'100 / 4 - 2,50':22.5,'(0.1 + 0.2) * 3':.9,'1 / 8 + 0.005':.13,'-(-2 + 1) * 3':3,'5 × 2 ÷ (1 + 1)':5,'− 1 + .25':-.75};
 for(const [expression,result]of Object.entries(cases))assert.equal(L.amount(expression,'gold'),result);
 assert.equal(L.amount('(1.5 * 2) + 1 / 2 + 1 / 2','xp'),4);assert.equal(L.amount('2000000000 - 1000000001','xp'),999999999);
 let log=L.edit({},0,'gold','100 / 4','start');log=L.edit(log,5,'gold','-(2 * 1,25)','gain');log=L.edit(log,6,'gold','0.1 + 0.2','gain');
 const rows=L.project(log);assert.equal(rows[5].total.gold,22.5);assert.equal(rows[6].start.gold,22.5);assert.equal(rows[6].total.gold,22.8);assert.equal(log.start.gold,25);assert.equal(log.startExpressions.gold,'100 / 4');assert.equal(rows[5].expressions.gold,'-(2 * 1,25)');
 assert.deepEqual(L.normalize(JSON.parse(JSON.stringify(log))),log);
});
test('expression metadata follows complete records and is removed by replacement, clear or an inconsistent imported annotation',()=>{
 let log=L.edit({},0,'gold','(10 - 3) / 2','gain');log=L.edit(log,0,'xp','1+2','start');const copy=L.operation(log,0,'duplicate').log;assert.equal(copy.rows[1].expressions.gold,'(10 - 3) / 2');assert.notEqual(copy.rows[0].expressions,copy.rows[1].expressions);assert.equal(L.operation(copy,1,'earlier').log.rows[0].expressions.gold,'(10 - 3) / 2');
 const numeric=L.edit(log,0,'gold','4.25','gain');assert.equal(numeric.rows[0].expressions,undefined);assert.equal(L.edit(log,0,'gold','','gain').rows[0].expressions,undefined);assert.equal(L.operation(log,0,'clear').log.rows[0].expressions,undefined);assert.equal(L.edit(log,0,'xp','2','start').startExpressions,undefined);
 const wrong=L.normalize({start:{gold:5},startExpressions:{gold:'1+1'},rows:[{gain:{gold:10},expressions:{gold:'1+2',xp:'globalThis.compromised=true'}}]});assert.equal(wrong.start.gold,5);assert.equal(wrong.startExpressions,undefined);assert.equal(wrong.rows[0].gain.gold,10);assert.equal(wrong.rows[0].expressions,undefined);assert.equal(globalThis.compromised,undefined);
});
test('invalid or excessive arithmetic fails atomically, with no rounding of non-cent gold or fractional counts',()=>{
 const original=L.edit({},0,'gold','2+3','gain'),before=JSON.stringify(original);
 for(const value of ['1/0','0/0','1 / (2 - 2)','1 / 3','(1+2','1 2','2(3)','1+','2**3','Math.random()','(()=>1)()','1; globalThis.compromised=true','0x10','2e3','2%1','9'.repeat(201),'('.repeat(20)+'1'+')'.repeat(20),'9'.repeat(39)+'*9'.repeat(10)]){assert.throws(()=>L.edit(original,0,'gold',value,'gain'),value);assert.equal(JSON.stringify(original),before);}
 assert.throws(()=>L.amount('1 / 2','xp'),/whole number/);assert.throws(()=>L.amount('1000000000 + 1','gold'),/between/);assert.throws(()=>L.amount('0.001 + 0','gold'),/decimal places/);
 for(const value of [true,[],{},Symbol('x')])assert.throws(()=>L.amount(value,'gold'));assert.equal(globalThis.compromised,undefined);
});
test('paper numeric inputs retain validated expressions while totals and later openings stay numeric and read-only',()=>{
 const A=require('../js/modules/character-adobe-fields'),log=L.edit(L.edit({},0,'gold','100 / 4','start'),0,'gold','2 * 3','gain'),c={data:{profile:{},adobe:{adventureLog:log}},identity:{},derived:{progression:{classLevels:[]}},logPage:0};
 assert.equal(A.describe('AdvLog.1.gold.start',c).value,'100 / 4');assert.equal(A.describe('AdvLog.1.gold.gain',c).value,'2 * 3');assert.equal(A.describe('AdvLog.1.gold.total',c).value,31);assert.equal(A.describe('AdvLog.2.gold.start',c).value,31);assert.throws(()=>A.planEdit('AdvLog.2.gold.start','1+2',c));
});

test('reused normalized annotations are checked again after either text or numeric amount changes',()=>{
 const original=L.edit({},0,'gold','1+2','gain'),snapshot=JSON.stringify(original),copy=L.normalize(original);assert.equal(copy.rows[0].expressions.gold,'1+2');copy.rows[0].gain.gold=4;assert.equal(L.normalize(copy).rows[0].expressions,undefined);assert.equal(L.normalize(original).rows[0].expressions.gold,'1+2');assert.equal(JSON.stringify(original),snapshot);
 copy.rows[0].expressions.gold='2+2';assert.equal(L.normalize(copy).rows[0].expressions.gold,'2+2');copy.rows[0].expressions.gold='globalThis.compromised=true';assert.equal(L.normalize(copy).rows[0].expressions,undefined);assert.equal(L.normalize(original).rows[0].expressions.gold,'1+2');assert.equal(globalThis.compromised,undefined);
});
