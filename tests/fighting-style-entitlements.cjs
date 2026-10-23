const {test}=require('node:test'),assert=require('node:assert/strict');
require('../js/modules/character-feat-data');require('../js/modules/character-feat-reference');
const C=require('../js/modules/character-class-feature-choices'),P=require('../js/modules/character-play-rules'),M=require('../js/modules/character-sheet-model'),catalog=require('../data/rules/catalog.json');
const feat=name=>catalog.feats.find(f=>f.category==='FS'&&f.name===name).id;
const make=(rows=[['fighter',1]],edition='2024')=>{const d=M.normalize({build:{classId:rows[0][0],edition}});d.adobe={classLevels:rows.map(([classId,level])=>({classId,level})),classFeatureChoices:{}};return d};
const set=(d,classId,value)=>C.set(d,d.adobe.classLevels.find(e=>e.classId===classId),'fighting-style',0,value);
test('class and Feats controls spend the same Fighting Style entitlement',()=>{
 const d=make();assert.equal(set(d,'fighter','archery'),true);assert.equal(P.budget(d,1,catalog.feats).style,0);assert.match(P.eligible(d,1,catalog.feats.find(f=>f.id===feat('Defense')),catalog.feats),/No available Fighting Style/);assert.match(P.eligible(d,1,catalog.feats.find(f=>f.id===feat('Archery')),catalog.feats),/already selected/);
 assert.equal(set(d,'fighter',''),true);assert.equal(P.budget(d,1,catalog.feats).style,1);
 d.rulesChoices.feats=[feat('Archery')];const saved=JSON.stringify(d);assert.equal(set(d,'fighter','defense'),false);assert.equal(set(d,'fighter','archery'),false);assert.equal(JSON.stringify(d),saved);d.rulesChoices.feats=[];assert.equal(set(d,'fighter','defense'),true);
});
test('multiclass styles use actual Fighter, Paladin and Ranger levels',()=>{
 const d=make([['wizard',3],['paladin',1],['fighter',1],['ranger',2]]);
 for(const [level,total]of [[3,0],[4,0],[5,1],[6,1],[7,2]])assert.equal(P.budget(d,level,catalog.feats).style,total);
 assert.equal(set(d,'paladin','defense'),false);assert.equal(set(d,'fighter','archery'),true);assert.equal(set(d,'ranger','archery'),false);assert.equal(set(d,'ranger','defense'),true);assert.equal(P.budget(d,7,catalog.feats).style,0);
});
test('legacy copies of a class style use one allowance and do not erase saved data',()=>{
 const d=make();set(d,'fighter','archery');d.rulesChoices.feats=[feat('Archery')];const saved=JSON.stringify(d);const b=P.budget(d,1,catalog.feats);assert.equal(b.style,0);assert.equal(b.over,0);assert.equal(b.featUsed,0);assert.equal(JSON.stringify(d),saved);
 assert.equal(set(d,'fighter','defense'),false,'remove the old Feats entry before replacing its class alias');d.rulesChoices.feats=[];assert.equal(set(d,'fighter','defense'),true);
});
test('saved duplicate class styles grant one effect and can be corrected without rewriting other choices',()=>{
 for(const edition of ['2014','2024']){const d=make([['fighter',1],['ranger',2]],edition);d.adobe.classFeatureChoices={[edition+':fighter:fighting-style']:['archery'],[edition+':ranger:fighting-style']:['archery']};assert.equal(C.styles(d).length,1);assert.equal(C.status(d,d.adobe.classLevels[1],edition)[0].valid.length,0);assert.equal(set(d,'ranger','defense'),true);assert.equal(C.styles(d).length,2);assert.equal(d.adobe.classFeatureChoices[edition+':fighter:fighting-style'][0],'archery');}
});
test('style allowance preserves normal ASI and DM bonuses and grants no extra unrestricted feat',()=>{
 const d=make([['fighter',4],['paladin',2]]);set(d,'fighter','archery');d.rulesChoices.feats=[feat('Defense')];d.rulesChoices.grants.__dm={bonusFeats:1,bonusAsis:1};const b=P.budget(d,6,catalog.feats);assert.equal(b.style,0);assert.equal(b.remaining,2);assert.equal(b.asiRemaining,2);assert.equal(b.over,0);assert.equal(set(d,'paladin','dueling'),false);
});
test('legacy class option pools and style effect caps remain edition specific',()=>{
 const d=make([['paladin',2]],'2014');assert.equal(set(d,'paladin','archery'),false);assert.equal(set(d,'paladin','defense'),true);
 const f=make([['wizard',3],['fighter',1]]);f.adobe.classFeatureChoices['2024:fighter:fighting-style']=['archery'];assert.equal(C.styles(f,3).length,0);assert.equal(C.styles(f,4).length,1);
});
