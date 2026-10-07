const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/modules/character-class-feature-choices');
const entry = level => ({classId:'warlock',level,subclassId:''});
const sheet = (edition,level) => ({build:{edition},adobe:{classLevels:[entry(level)],classFeatureChoices:{}}});
const group = d => C.groups(d.adobe.classLevels[0],d.build.edition).find(g=>g.id==='eldritch-invocations');
const set = (d,index,id,e=d.adobe.classLevels[0]) => C.set(d,e,'eldritch-invocations',index,id);

test('both official invocation progressions match every class level', () => {
  for (const [edition,expected] of Object.entries({
    '2014':[0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8],
    '2024':[1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10],
  })) for(let level=1;level<=20;level++) {
    assert.equal(C.invocationLimit(level,edition),expected[level-1]);
    assert.equal(group(sheet(edition,level))?.allowed||0,expected[level-1]);
  }
});
test('core setter blocks slots outside the allowance, including stale higher-level entries', () => {
  const d=sheet('2014',6);
  assert.equal(set(d,2,'armor-of-shadows'),true);
  const before=JSON.stringify(d);
  for(const index of [3,4,19,-1,0.5])assert.equal(set(d,index,'beast-speech',entry(20)),false);
  assert.equal(set(d,4,'beast-speech',{...entry(20),subclassId:'forged'}),false);
  assert.equal(C.set(d,{classId:'fighter',level:20},'fighting-style',0,'defense'),false);
  assert.equal(JSON.stringify(d),before);
});
test('multiclass invocation allowance uses Warlock levels', () => {
  const d=sheet('2014',2);d.adobe.classLevels.push({classId:'fighter',level:4,subclassId:''});
  assert.equal(group(d).allowed,2);
  assert.equal(set(d,2,'armor-of-shadows'),false);
});
test('core rejects unknown, duplicate and unmet prerequisite choices', () => {
  const d=sheet('2014',6);
  assert.equal(set(d,0,'armor-of-shadows'),true);
  assert.equal(set(d,1,'armor-of-shadows'),false);
  assert.equal(set(d,1,'unknown-invocation'),false);
  assert.equal(set(d,1,'ascendant-step'),false);
  assert.equal(set(d,1,'agonizing-blast'),false);
  d.spells=[{name:'Eldritch Blast'}];
  assert.equal(set(d,1,'agonizing-blast'),true);
});
test('filling or clearing an earlier slot never shifts later choices', () => {
  const d=sheet('2014',6);
  assert.equal(set(d,2,'beast-speech'),true);
  assert.deepEqual(C.selections(d,group(d)),['','','beast-speech']);
  assert.equal(set(d,0,'armor-of-shadows'),true);
  assert.equal(set(d,0,''),true);
  assert.deepEqual(C.selections(d,group(d)),['','','beast-speech']);
  assert.deepEqual(C.normalize(d.adobe.classFeatureChoices),d.adobe.classFeatureChoices);
});
test('2024 repeatable invocations are permitted but still consume limited slots', () => {
  const d=sheet('2024',6);
  assert.equal(set(d,0,'agonizing-blast'),true);
  assert.equal(set(d,1,'agonizing-blast'),true);
  assert.equal(set(d,5,'agonizing-blast'),false);
});
test('a prerequisite invocation cannot be removed while another selected choice depends on it', () => {
  const d=sheet('2024',6);
  assert.equal(set(d,0,'pact-of-the-blade'),true);
  assert.equal(set(d,1,'thirsting-blade'),true);
  assert.equal(set(d,0,''),false);
  assert.equal(set(d,1,''),true);
  assert.equal(set(d,0,''),true);
});
test('saved overflow becomes inactive after a level drop and is reconciled on edit', () => {
  const d=sheet('2014',9),key=group(d).key;
  d.adobe.classFeatureChoices[key]=['armor-of-shadows','beast-speech','beguiling-influence','devils-sight','eyes-of-the-rune-keeper'];
  d.adobe.classLevels[0].level=6;
  const result=C.status(d,d.adobe.classLevels[0],'2014')[0];
  assert.equal(result.picked.length,3);assert.equal(result.overflow.length,2);assert.equal(result.complete,false);
  assert.equal(set(d,0,'misty-visions'),true);
  assert.equal(d.adobe.classFeatureChoices[key].length,3);
});
