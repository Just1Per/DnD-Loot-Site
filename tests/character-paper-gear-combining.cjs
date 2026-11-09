'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-paper-inventory');
const rows=()=>Array.from({length:55},(_,i)=>i===0?{id:'first',name:'Compass',quantity:2,weight:.5,location:'Pack'}:i===54?{id:'second',name:'Compass',quantity:1,weight:1,location:'Saddlebag'}:{id:'supply-'+i,name:'Supply '+i,quantity:1,weight:1});
test('original matching-name combination previews arithmetic and retains destination weight/location',()=>{
 const all=rows(),before=JSON.stringify(all),preview=P.combination({},all,0,'extra');assert.equal(preview.amount,3);assert.equal(preview.weight,1);assert.equal(preview.location,'Saddlebag');assert.equal(preview.target,54);const result=P.gearAction({},all,0,'combine:extra'),project=P.project(result.state,all).entries;assert.equal(project[0].id,'supply-1');assert.equal(project.some(row=>row?.id==='first'),false);assert.equal(project[54].quantity,3);assert.equal(project[54].weight,1);assert.equal(project[54].location,'Saddlebag');assert.equal(project[54].id,'second');assert.equal(JSON.stringify(all),before);
});
test('blank and zero incoming amounts follow the original AddToInv one-unit fallback; existing zero stays zero',()=>{
 for(const [incoming,existing,total]of [['','',2],[0,0,1],[0,2,3],[.5,1.5,2]]){const all=rows();all[0].quantity=incoming;all[54].quantity=existing;assert.equal(P.combination({},all,0,'extra').amount,total);}
});
test('combining can use a full destination while a separate move correctly refuses',()=>{
 const all=Array.from({length:91},(_,i)=>({id:'item-'+i,name:i===0||i===54?'Compass':'Supply '+i,quantity:1,weight:1}));assert.throws(()=>P.gearAction({},all,0,'page:extra'),/full/);const result=P.gearAction({},all,0,'combine:extra');assert.equal(P.project(result.state,all).entries[54].quantity,2);assert.equal(all.length,91);
});
test('combination closes only the source column and retains independent physical identities',()=>{
 const all=rows();for(let i=1;i<20;i++)all[i]={id:'supply-'+i,name:'Supply '+i,quantity:1,weight:1};const result=P.gearAction({},all,0,'combine:extra'),project=P.project(result.state,all).entries;assert.equal(project[0].id,'supply-1');assert.equal(project[17],null);assert.equal(project[18].id,'supply-18');assert.equal(project[54].quantity,3);assert.equal(all[0].id,'first');assert.equal(all[54].id,'second');
});
test('matching ignores original container indentation and case, but keeps enhancement signs distinct',()=>{
 const all=rows();all[0].name="- THIEVES’ TOOLS";all[54].name="Thieves' tools";assert.equal(P.combination({},all,0,'extra').target,54);all[0].name='Longsword +1';all[54].name='Longsword';assert.equal(P.combination({},all,0,'extra'),null);all[54].name='Longsword -1';assert.equal(P.combination({},all,0,'extra'),null);
});
test('overflow, missing matches and unavailable ownership leave input untouched',()=>{
 const all=rows();all[0].quantity=1000000;const overflow=JSON.stringify(all);assert.throws(()=>P.gearAction({},all,0,'combine:extra'),/1000000/);assert.equal(JSON.stringify(all),overflow);all[0].quantity=2;all[54].name='Other';const noMatch=JSON.stringify(all);assert.equal(P.combination({},all,0,'extra'),null);assert.throws(()=>P.gearAction({},all,0,'combine:extra'),/matching/);assert.equal(JSON.stringify(all),noMatch);const state=P.gearAction({},rows(),0,'down').state;assert.equal(P.combination(state,rows().filter(row=>row.id!=='first'),1,'extra'),null);
});
