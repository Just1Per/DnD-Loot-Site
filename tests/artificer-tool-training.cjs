const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices');
const make=(level=1)=>{const d=M.normalize({abilities:{int:16,dex:14},build:{classId:'artificer',edition:'2014'}});d.adobe={classLevels:[{classId:'artificer',level}],classFeatureChoices:{}};return d;};
const choose=d=>C.set(d,d.adobe.classLevels[0],'artisan-tool',0,'alchemist-s-supplies');
const context=(d,level)=>{const r=M.derive(d,level);return{level,effects:r.effects,mods:r.mods,classExpertise:r.classExpertise}};
test('starting Artificer has a structured artisan-tool choice that grants actual proficiency',()=>{
 const d=make();assert.equal(choose(d),true);const r=M.derive(d,1);assert.ok(r.effects.proficiencies.includes('Alchemist’s supplies'));assert.ok(!r.effects.proficiencies.includes('Choose one artisan tool'));assert.equal(r.toolTraining.tools.length,3);assert.equal(C.set(d,d.adobe.classLevels[0],'artisan-tool',0,'longsword'),false);
});
test('multiclass Artificer gets fixed tools but no additional starting artisan choice',()=>{
 const d=make(1);d.build.classId='wizard';d.adobe.classLevels.unshift({classId:'wizard',level:5});assert.equal(C.status(d,d.adobe.classLevels[1],'2014').some(g=>g.id==='artisan-tool'),false);assert.equal(C.set(d,d.adobe.classLevels[1],'artisan-tool',0,'alchemist-s-supplies'),false);const r=M.derive(d,6);assert.equal(r.toolTraining.tools.length,2);assert.ok(!r.effects.proficiencies.includes('Alchemist’s supplies'));
});
test('Tool Expertise uses Artificer level 6 and doubles total character PB exactly once',()=>{
 for(let level=1;level<=20;level++){const d=make(level);choose(d);const ctx=context(d,level);assert.equal(C.setToolAbility(d,'alchemist-s-supplies','int',ctx),true);const r=M.derive(d,level),tool=r.toolTraining.tools.find(tool=>tool.id==='alchemist-s-supplies');assert.equal(tool.total,3+r.pb*(level>=6?2:1));}
 const d=make(5);d.adobe.classLevels.push({classId:'wizard',level:5});choose(d);C.setToolAbility(d,'alchemist-s-supplies','int',context(d,10));assert.equal(M.derive(d,10).toolTraining.tools[0].bonus,4);d.adobe.classLevels[0].level=6;d.adobe.classLevels[1].level=4;assert.equal(M.derive(d,10).toolTraining.tools[0].bonus,8);
});
test('changing abilities, choices and class levels preserves stored selections without stale grants',()=>{
 const d=make(6);choose(d);assert.equal(C.setToolAbility(d,'alchemist-s-supplies','int',context(d,6)),true);assert.equal(C.setToolAbility(d,'forged-tool','int',context(d,6)),false);assert.equal(C.setToolAbility(d,'alchemist-s-supplies','forged',context(d,6)),false);assert.equal(C.setToolAbility(d,'alchemist-s-supplies','dex',context(d,6)),true);assert.equal(M.derive(d,6).toolTraining.tools[0].total,8);
 C.set(d,d.adobe.classLevels[0],'artisan-tool',0,'smith-s-tools');assert.ok(!M.derive(d,6).toolTraining.tools.some(tool=>tool.id==='alchemist-s-supplies'));assert.equal(d.adobe.classFeatureChoices['2014:artificer:tool-check-alchemist-s-supplies'][0],'dex');
 d.adobe.classLevels=[{classId:'wizard',level:6}];assert.equal(M.derive(d,6).toolTraining.tools.length,0);
});
test('Rogue tool Expertise and Artificer Tool Expertise never multiply each other',()=>{
 const d=make(6);d.adobe.classLevels.push({classId:'rogue',level:1});d.adobe.classFeatureChoices['2014:rogue:expertise']=['thieves-tools'];assert.equal(C.setToolAbility(d,'thieves-tools','dex',context(d,7)),true);const r=M.derive(d,7);assert.equal(r.toolTraining.tools.find(tool=>tool.id==='thieves-tools').total,2+2*r.pb);
});

test('legacy Artificer choices remain explicit and usable on compatible 2024 sheets',()=>{const d=make(6);d.build.edition='2024';assert.equal(choose(d),true);assert.equal(C.status(d,d.adobe.classLevels[0],'2024')[0].sourceLabel,'Legacy Artificer · Tasha’s');assert.equal(C.setToolAbility(d,'alchemist-s-supplies','int',context(d,6)),true);assert.equal(M.derive(d,6).toolTraining.tools.find(tool=>tool.id==='alchemist-s-supplies').total,9);});
