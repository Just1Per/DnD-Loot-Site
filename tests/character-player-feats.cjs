'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),P=require('../js/modules/character-play-rules'),F=require('../js/modules/character-feat-rules'),catalog=require('../data/rules/catalog.json');
const grappler=catalog.feats.find(row=>row.name==='Grappler'&&row.edition==='2024');
const data=()=>M.normalize({build:{edition:'2024',classId:'wizard',race:'human-2024',scoreMode:'base'},abilities:{str:8,dex:8}});
test('players can choose feats below prerequisites and beyond normal advancement, without changing DM allowances',()=>{
 const d=data(),before=JSON.stringify(d.rulesChoices.grants),selection=P.featSelection(d,1,grappler,catalog.feats,M.derive(d,1).scores);
 assert.equal(P.budget(d,1,catalog.feats).remaining,0);assert.equal(selection.blocked,'');assert.match(selection.guidance,/Requires level/);
 const key=F.addManual(d,grappler);d.rulesChoices.effects[key].abilities[0]='str';const r=M.derive(d,1),report=r.feats.reports.find(row=>row.key===key);
 assert.equal(r.scores.str,9);assert.equal(report.eligible,true);assert.equal(report.warnings.length,0);assert.match(report.guidance.join(' '),/prerequisite/);assert.equal(JSON.stringify(d.rulesChoices.grants),before);
 const saved=M.normalize(JSON.parse(JSON.stringify(d)));assert.equal(saved.rulesChoices.effects[key].ignorePrerequisites,true);assert.equal(M.derive(saved,1).scores.str,9);
 assert.match(P.featSelection(d,1,grappler,catalog.feats,r.scores).blocked,/already selected/,'low level must not bypass duplicate prevention');
});
test('manual prerequisites are optional, while legacy records and automatic grants retain their original rules',()=>{
 const d=data();d.rulesChoices.feats.push(grappler.id);d.rulesChoices.effects[grappler.id]=F.choice({abilities:['str']});assert.equal(M.derive(d,1).scores.str,8);
 d.rulesChoices.effects[grappler.id].ignorePrerequisites=true;assert.equal(M.derive(d,1).scores.str,9);delete d.rulesChoices.effects[grappler.id].ignorePrerequisites;assert.equal(M.derive(d,1).scores.str,8);
 assert.equal(F.choice({ignorePrerequisites:'true'}).ignorePrerequisites,undefined);
});
test('repeatable manual feats keep their own choices and resource counters',()=>{
 const d=data(),feat=catalog.feats.find(row=>row.name==='Ability Score Improvement'&&row.edition==='2024');
 const first=F.addManual(d,feat);d.rulesChoices.effects[first].abilities[0]='str';d.rulesChoices.effects[first].used=1;
 const second=F.addManual(d,feat);d.rulesChoices.effects[second].abilities[0]='dex';assert.notEqual(first,second);assert.equal(d.rulesChoices.effects[first].used,1);assert.equal(d.rulesChoices.effects[second].used,0);assert.equal(d.rulesChoices.effects[second].ignorePrerequisites,true);
 const r=M.derive(d,1);assert.equal(r.scores.str,10);assert.equal(r.scores.dex,10);
});
