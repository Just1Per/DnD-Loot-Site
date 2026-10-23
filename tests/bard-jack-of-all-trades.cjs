const{test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),F=require('../js/modules/character-feat-data');
const bard=(level=2,edition='2014')=>{const d=M.normalize({build:{classId:'bard',edition}});d.adobe={classLevels:[{classId:'bard',level}],classFeatureChoices:{}};return d};
test('Jack of All Trades unlocks at actual Bard level 2 and rounds total proficiency down',()=>{
 for(const edition of ['2014','2024']){const d=bard(1,edition);assert.equal(M.derive(d,1).skills.athletics,0);d.adobe.classLevels.push({classId:'fighter',level:4});assert.equal(M.derive(d,5).skills.athletics,0);d.adobe.classLevels[0].level=2;d.adobe.classLevels[1].level=3;assert.equal(M.derive(d,5).skills.athletics,1);d.adobe.classLevels[1].level=11;assert.equal(M.derive(d,13).skills.athletics,2);assert.equal(d.skills.athletics.rank,0);assert.equal(M.derive(d,1).skills.athletics,0);}
});
test('Half proficiency does not stack with manual, class, species or expertise training and preserves adjustments',()=>{
 const d=bard();d.adobe.classLevels.push({classId:'fighter',level:3});d.skills.athletics.rank=1;d.skills.athletics.bonus=2;assert.equal(M.derive(d,5).skills.athletics,5);d.skills.athletics.rank=2;assert.equal(M.derive(d,5).skills.athletics,8);d.skills.athletics.rank=.5;assert.equal(M.derive(d,5).skills.athletics,3);d.build.classSkills=['athletics','perception','deception'];assert.equal(M.derive(d,5).skills.athletics,5);d.build.race='high-elf';assert.equal(M.derive(d,5).skills.perception,3);assert.equal(M.derive(d,5).saves.con,0);
});
test('Only 2014 Jack applies to initiative; full initiative proficiency wins while flat Alert still stacks',()=>{
 const feat=edition=>Object.keys(F).find(id=>F[id].name==='Alert'&&F[id].edition===edition);
 const d=bard();assert.equal(M.derive(d,2).initiative,1);assert.equal(M.derive(bard(2,'2024'),2).initiative,0);d.rulesChoices.feats=[feat('2014')];assert.equal(M.derive(d,2).initiative,6);d.rulesChoices.feats=[feat('2024')];assert.equal(M.derive(d,2).initiative,2);d.rulesChoices.feats=[];d.build.race='harengon-mpmm';assert.equal(M.derive(d,2).effects.initiativeProficiency,true);assert.equal(M.derive(d,2).initiative,2);
});
