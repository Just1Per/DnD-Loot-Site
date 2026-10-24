const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices');
const make=(edition='2024',level=2)=>{const d=M.normalize({abilities:{cha:16},build:{classId:'warlock',edition,race:'high-elf'}});d.adobe={classLevels:[{classId:'warlock',level}],classFeatureChoices:{}};return d;};
const set=(d,index,value)=>C.set(d,d.adobe.classLevels.find(entry=>entry.classId==='warlock'),'eldritch-invocations',index,value);
test('Devil’s Sight is a separate 120-ft magical-darkness sense and respects each edition',()=>{
 for(const edition of ['2014','2024']){const d=make(edition);assert.equal(set(d,0,'devil-s-sight'),true);const r=M.derive(d,2),sense=r.effects.specialSenses.find(sense=>sense.id==='devil-s-sight');assert.equal(sense.range,120);assert.equal(sense.magicalDarkness,true);assert.equal(sense.dimLight,edition==='2024');assert.equal(r.effects.darkvision,60,'racial darkvision must not be rewritten as Devil’s Sight');assert.equal(r.effects.truesight,undefined);}
});
test('invocation effects require unlocked actual Warlock levels and an allowed active slot',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++){const d=make(edition,level);d.adobe.classFeatureChoices[edition+':warlock:eldritch-invocations']=['devil-s-sight'];assert.equal(M.derive(d,level).invocationEffects.senses.length,level>=2?1:0);}
 const d=make('2024',1);d.build.classId='wizard';d.adobe.classLevels.unshift({classId:'wizard',level:19});d.adobe.classFeatureChoices['2024:warlock:eldritch-invocations']=['devil-s-sight'];assert.equal(M.derive(d,20).effects.specialSenses.length,0);d.adobe.classLevels[0].level=18;d.adobe.classLevels[1].level=2;assert.equal(M.derive(d,20).effects.specialSenses.length,1);assert.equal(M.derive(d,19).effects.specialSenses.length,0);
 d.adobe.classFeatureChoices['2024:warlock:eldritch-invocations']=['armor-of-shadows','eldritch-mind','pact-of-the-tome','devil-s-sight'];assert.equal(M.derive(d,20).effects.specialSenses.length,0,'overflow choices are inactive');
});
test('Beguiling Influence grants automatic skill proficiency once and qualifies for class Expertise',()=>{
 const d=make('2014',2);d.adobe.classLevels.push({classId:'rogue',level:1});d.build.classSkills=[];assert.equal(set(d,0,'beguiling-influence'),true);let r=M.derive(d,3);assert.equal(r.skills.deception,5);assert.equal(r.skills.persuasion,5);assert.equal(d.skills.deception.rank,0);assert.equal(C.setExpertise(d,'2014:rogue:expertise',0,'deception',{level:3,effects:r.effects,feats:r.feats}),true);r=M.derive(d,3);assert.equal(r.skills.deception,7);d.skills.persuasion.rank=1;assert.equal(M.derive(d,3).skills.persuasion,5);assert.equal(set(d,0,''),true);r=M.derive(d,3);assert.equal(r.skills.deception,3);assert.equal(r.skills.persuasion,5);assert.equal(d.adobe.classFeatureChoices['2014:rogue:expertise'][0],'deception','inactive Expertise selection is preserved');
});
test('Witch Sight distinguishes revised Truesight from legacy true-form sight',()=>{
 for(const edition of ['2014','2024']){const d=make(edition,15);assert.equal(set(d,0,'witch-sight'),true);const r=M.derive(d,15);assert.equal(r.effects.specialSenses[0].range,30);assert.equal(r.effects.specialSenses[0].truesight,edition==='2024');assert.equal(r.effects.truesight,edition==='2024'?30:undefined);assert.equal(r.effects.darkvision,60);}
});
test('writing and concentration benefits are scoped without granting spoken languages or a flat save bonus',()=>{
 const legacy=make('2014'),languages=M.derive(legacy,2).effects.languages;set(legacy,0,'eyes-of-the-rune-keeper');let r=M.derive(legacy,2);assert.deepEqual(r.effects.languages,languages);assert.ok(r.invocationEffects.reports.some(row=>row.id==='eyes-of-the-rune-keeper'));
 const modern=make('2024',1),base=M.derive(modern,1);assert.equal(set(modern,0,'eldritch-mind'),true);r=M.derive(modern,1);assert.equal(r.effects.concentrationAdvantage,true);assert.deepEqual(r.saves,base.saves);assert.equal(set(modern,0,''),true);assert.equal(M.derive(modern,1).effects.concentrationAdvantage,false);
});
test('removing choices or class levels removes effects while saved data and normal senses survive roundtrip',()=>{
 const d=make('2024',2);set(d,0,'devil-s-sight');const before=JSON.stringify(d),saved=structuredClone(d);saved.rulesChoices.grants.__adobe={data:saved.adobe};delete saved.adobe;assert.deepEqual(M.derive(saved,2).invocationEffects,M.derive(d,2).invocationEffects);assert.equal(JSON.stringify(d),before);d.adobe.classLevels=[{classId:'wizard',level:2}];assert.equal(M.derive(d,2).effects.specialSenses.length,0);assert.equal(d.adobe.classFeatureChoices['2024:warlock:eldritch-invocations'][0],'devil-s-sight');
});
