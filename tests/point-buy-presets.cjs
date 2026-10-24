const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model');
const keys=Object.keys(M.abilities),abilities=scores=>Object.fromEntries(keys.map((key,i)=>[key,scores[i]]));
test('all three starting spreads spend exactly 27 points before bonuses',()=>{
 assert.deepEqual(M.pointBuyPresets.map(row=>row.scores),[[15,15,15,8,8,8],[15,14,13,12,10,8],[14,14,14,10,10,10]]);
 for(const row of M.pointBuyPresets){const r=M.pointBuy(abilities(row.scores));assert.equal(r.spent,27);assert.equal(r.remaining,0);assert.equal(r.valid,true);const swapped=[...row.scores];[swapped[0],swapped[5]]=[swapped[5],swapped[0]];assert.equal(M.pointBuy(abilities(swapped)).spent,27);}
});
test('standard costs, bounds and unspent points follow the standard Point Buy table',()=>{
 for(const [score,cost]of [[8,0],[9,1],[10,2],[11,3],[12,4],[13,5],[14,7],[15,9]])assert.equal(M.pointBuy(abilities([score,8,8,8,8,8])).spent,cost);
 for(const score of [7,16,8.5,NaN])assert.equal(M.pointBuy(abilities([score,8,8,8,8,8])).valid,false);
 assert.equal(M.pointBuy(abilities([15,15,15,9,8,8])).valid,false);assert.equal(M.pointBuy(abilities([8,8,8,8,8,8])).valid,true);
});
test('race bonuses change derived scores without being purchased again',()=>{
 const d=M.normalize({abilities:abilities([15,14,13,12,10,8]),build:{classId:'fighter',edition:'2014',race:'high-elf',scoreMode:'base',scoreMethod:'pointBuy'}});const before=M.pointBuy(d.abilities);const r=M.derive(d,1);assert.equal(r.scores.dex,16);assert.equal(M.pointBuy(d.abilities).spent,before.spent);assert.equal(before.spent,27);
});
