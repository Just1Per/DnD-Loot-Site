const assert=require('node:assert/strict');
const {test}=require('node:test');
global.CharacterSubclassData=require('../js/modules/character-subclass-data');
require('../js/modules/character-expanded-subclass-data');
const Validation=require('../js/modules/character-build-validation');
const classes=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const issues=(edition,classLevels)=>{
  const level=classLevels.reduce((sum,row)=>sum+row.level,0);
  return Validation.check({build:{edition}},{progression:{classLevels,assignedLevel:level,targetLevel:level}},{level}).issues.filter(row=>row.category==='Subclass');
};

test('2024 Overview requires subclasses at class level 3, matching the picker for every PHB class',()=>{
  for(const classId of classes)for(const level of [1,2,3]){
    const rows=issues('2024',[{classId,level}]);
    const available=global.CharacterSubclassData.optionsFor(classId,level,'2024');
    assert.equal(rows.length,level>=3?1:0,`${classId} level ${level}`);
    assert.equal(rows.length>0,available.length>0,`${classId}: Fix must have an available subclass`);
    if(rows.length)assert.equal(rows[0].target,'[data-subclass="0"]');
  }
});

test('2014 Overview preserves each class’s earlier subclass unlock level',()=>{
  const early={cleric:1,sorcerer:1,warlock:1,druid:2,wizard:2};
  for(const classId of [...classes,'artificer']){
    const minimum=early[classId]||3;
    if(minimum>1)assert.equal(issues('2014',[{classId,level:minimum-1}]).length,0,`${classId} before unlock`);
    assert.equal(issues('2014',[{classId,level:minimum}]).length,1,`${classId} at unlock`);
  }
});

test('multiclass warnings use individual class levels and target the eligible class',()=>{
  assert.deepEqual(issues('2024',[{classId:'cleric',level:2},{classId:'wizard',level:2}]),[]);
  const rows=issues('2024',[{classId:'cleric',level:2},{classId:'wizard',level:3}]);
  assert.equal(rows.length,1);
  assert.equal(rows[0].target,'[data-subclass="1"]');
});

test('selecting a subclass, lowering class level and changing edition update completeness',()=>{
  const entry={classId:'wizard',level:3};
  assert.equal(issues('2024',[entry]).length,1);
  entry.subclassId='evocation';
  assert.deepEqual(issues('2024',[entry]),[]);
  entry.subclassId='';entry.level=2;
  assert.deepEqual(issues('2024',[entry]),[]);
  assert.equal(issues('2014',[entry]).length,1);
  assert.deepEqual(issues('2024',[{classId:'unknown',level:3}]),[]);
});
