const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/modules/character-class-feature-choices'),M=require('../js/modules/character-sheet-model'),V=require('../js/modules/character-build-validation');
const data=(id,level,edition='2014')=>{const d=M.normalize({build:{classId:id,edition}});d.adobe={classLevels:[{classId:id,level,subclassId:''}],classFeatureChoices:{}};for(const key of Object.keys(d.skills))d.skills[key].rank=1;return d;};
const ctx=(d,level=d.adobe.classLevels.reduce((n,e)=>n+e.level,0),effects={skills:[],proficiencies:['Thieves’ tools']},feats={expertise:[]})=>({level,effects,feats});
const group=d=>C.expertise(d,ctx(d)).reports[0];
const choose=(d,index,key,context=ctx(d),classId=d.adobe.classLevels[0].classId)=>C.setExpertise(d,C.groupKey(d.build.edition,classId,'expertise'),index,key,context);
test('class expertise allowances use each edition and actual class levels',()=>{
 for(const [id,edition,levels]of [['rogue','2014',[[1,2],[5,2],[6,4]]],['rogue','2024',[[1,2],[6,4]]],['bard','2014',[[2,0],[3,2],[9,2],[10,4]]],['bard','2024',[[1,0],[2,2],[8,2],[9,4]]],['ranger','2014',[[2,0],[9,0]]],['ranger','2024',[[1,0],[2,1],[8,1],[9,3]]],['wizard','2014',[[2,0]]],['wizard','2024',[[1,0],[2,1]]]])for(const [level,allowed]of levels)assert.equal(group(data(id,level,edition))?.allowed||0,allowed,id+edition+level);
 const d=data('rogue',1);d.adobe.classLevels.push({classId:'fighter',level:6});assert.equal(group(d).allowed,2);d.adobe.classLevels=[{classId:'fighter',level:7},{classId:'rogue',level:6}];assert.equal(C.expertise(d,ctx(d,7)).reports.length,0);
});
test('setter enforces proficiency, unique slots, level caps and nonstacking feat/class choices',()=>{
 const d=data('rogue',1);d.skills.stealth.rank=0;assert.equal(choose(d,0,'stealth'),false);d.skills.stealth.rank=1;assert.equal(choose(d,0,'stealth'),true);assert.equal(choose(d,1,'stealth'),false);assert.equal(choose(d,2,'perception'),false);assert.equal(choose(d,1,'perception'),true);
 assert.equal(choose(d,0,'arcana',ctx(d,1,{skills:[],proficiencies:[]},{expertise:['arcana']})),false);
 d.adobe.classLevels.push({classId:'bard',level:3});assert.equal(choose(d,0,'stealth',ctx(d), 'bard'),false);assert.equal(choose(d,0,'history',ctx(d),'bard'),true);
});
test('class expertise doubles total-character proficiency once and preserves manual rank/bonuses',()=>{
 const d=data('rogue',1);d.adobe.classLevels.push({classId:'fighter',level:4});d.abilities.dex=16;d.skills.stealth.bonus=1;assert.equal(choose(d,0,'stealth'),true);let derived=M.derive(d,5);assert.equal(derived.skills.stealth,10);assert.deepEqual(derived.classExpertise.skills,['stealth']);
 d.skills.stealth.rank=2;assert.equal(M.derive(d,5).skills.stealth,10);assert.equal(d.skills.stealth.rank,2);assert.equal(choose(d,0,''),true);assert.equal(M.derive(d,5).skills.stealth,10,'manual expertise remains when the class choice is cleared');
});
test('Scholar accepts only the six eligible proficient skills, including Wisdom Medicine',()=>{
 const d=data('wizard',2,'2024');d.abilities.wis=14;assert.equal(choose(d,0,'stealth'),false);assert.equal(choose(d,0,'medicine'),true);assert.equal(M.derive(d,2).skills.medicine,6);d.skills.medicine.rank=0;assert.deepEqual(M.derive(d,2).classExpertise.skills,[]);assert.equal(M.derive(d,2).classExpertise.reports[0].missing,1);
});
test('legacy Rogue tool option and Artificer reminders track proficiency while 2024 Rogue uses skills',()=>{
 const d=data('rogue',1);assert.equal(choose(d,0,'thieves-tools'),true);assert.equal(C.expertise(d,ctx(d,5)).tools[0].bonus,6);assert.equal(choose(d,0,'thieves-tools',ctx(d,1,{skills:[],proficiencies:[]})),false);
 assert.equal(choose(data('rogue',1,'2024'),0,'thieves-tools'),false);assert.match(C.expertise(data('artificer',6),ctx(data('artificer',6))).reminders.join(' '),/Tool Expertise.*double proficiency \(6\)/);
});
test('inactive higher-level selections survive without granting bonuses, and stale/forged IDs stay inactive',()=>{
 const d=data('rogue',6);for(const [i,key]of ['stealth','perception','arcana','history'].entries())assert.equal(choose(d,i,key),true);
 const original=JSON.stringify(d.adobe.classFeatureChoices);d.adobe.classLevels[0].level=1;const derived=M.derive(d,1);assert.deepEqual(derived.classExpertise.skills,['stealth','perception']);assert.equal(derived.classExpertise.reports[0].overflow,2);assert.equal(JSON.stringify(d.adobe.classFeatureChoices),original);
 d.adobe.classFeatureChoices['2014:rogue:expertise']=['forged','stealth','history'];assert.deepEqual(M.derive(d,1).classExpertise.skills,['stealth']);
});
test('automatic training qualifies and pending class Expertise reminders route to Abilities & Skills',()=>{
 const d=data('rogue',1);d.skills.animalHandling.rank=0;assert.equal(choose(d,0,'animalhandling',ctx(d,1,{skills:['animalHandling'],proficiencies:[]})),true);
 const derived=M.derive(d,1),issues=V.check(d,derived,{level:1}).issues.filter(i=>i.category==='Expertise');assert.ok(issues.length);assert.equal(issues[0].tab,'skills');assert.match(issues[0].target,/data-class-expertise/);
});

test('fixed Rogue and Druid languages follow actual class levels in both editions without changing manual notes',()=>{
 for(const edition of ['2014','2024']){
  const d=data('fighter',3,edition);d.languages='My campaign language';d.adobe.classLevels.push({classId:'rogue',level:1},{classId:'druid',level:1});
  let e=M.derive(d,5).effects;assert.ok(e.languages.includes('Thieves’ Cant'));assert.ok(e.languages.includes('Druidic'));assert.equal(d.languages,'My campaign language');
  assert.ok(!M.derive(d,3).effects.languages.includes('Thieves’ Cant'),'unassigned higher classes grant nothing');
  d.adobe.classLevels=d.adobe.classLevels.filter(c=>c.classId!=='rogue');e=M.derive(d,4).effects;assert.ok(!e.languages.includes('Thieves’ Cant'));assert.ok(e.languages.includes('Druidic'));
  const legacy=M.normalize({build:{classId:'rogue',edition}});assert.ok(M.derive(legacy,1).effects.languages.includes('Thieves’ Cant'));
 }
});
