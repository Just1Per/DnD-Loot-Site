'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),L=require('../js/modules/character-adventure-log');
test('paper log carries balances across six-entry pages without floating-point gold drift',()=>{
 let log=L.edit({},0,'gold','0.10','start');log=L.edit(log,0,'gold','0.2','gain');log=L.edit(log,5,'gold','-0,15','gain');log=L.edit(log,6,'gold','-1','gain');
 const rows=L.project(log);assert.equal(rows[0].total.gold,.3);assert.equal(rows[5].total.gold,.15);assert.equal(rows[6].start.gold,.15);assert.equal(rows[6].total.gold,-.85);assert.equal(rows[7].start.gold,-.85);
 log=L.edit(log,0,'gold','1','gain');assert.equal(L.project(log)[6].total.gold,-.05);assert.equal(rows[6].total.gold,-.85);
});
test('log numeric input is bounded data and never evaluates formulas or JavaScript',()=>{
 for(const value of ['1+2','globalThis.compromised=true','Infinity','NaN','1e4','1.001','1000000001','']){if(value==='')continue;assert.throws(()=>L.edit({},0,'gold',value,'gain'));}
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
 assert.equal(A.describe('AdvLog.1.xp.start',c).value,100);assert.throws(()=>A.planEdit('AdvLog.1.xp.start','900',c));assert.throws(()=>A.planEdit('AdvLog.1.xp.total','900',c));assert.deepEqual(A.planEdit('AdvLog.1.notes','Day seven',c).logEdit,{index:6,key:'notes',part:'text'});assert.equal(A.describe('AdvLog.sheetNumber',c).value,2);assert.equal(A.describe('AdvLogS.Background_Faction.Text',c).kind,'text');assert.throws(()=>A.planEdit('AdvLog.constructor','x',c));
});
