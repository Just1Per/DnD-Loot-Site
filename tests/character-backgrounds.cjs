const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),B=require('../js/modules/character-backgrounds'),R=require('../js/modules/character-rules'),C=require('../js/modules/character-catalog');
const make=(background,extra={})=>M.normalize({hpMax:10,build:{edition:'2024',scoreMode:'base',background,...extra}});
test('all 16 revised PHB and 19 legacy entries have usable mechanical profiles',()=>{
 assert.equal(Object.keys(B.modern).length,16);assert.equal(Object.keys(B.legacy).length,19);
 for(const bg of [...Object.values(B.modern),...Object.values(B.legacy)]){assert.equal(bg.skills.length,2);for(const skill of bg.skills)assert.ok(M.skills[skill]);for(const tool of bg.toolChoices)assert.ok(B.toolOptions(tool,R).length);if(bg.edition==='2024'){assert.equal(bg.abilities.length,3);assert.ok(R.modern.originFeats.includes(bg.feat));}}
});
test('Farmer grants restricted background ASI, two skills, tool and Tough HP without stacking',()=>{
 const d=make('farmer-2024',{backgroundAbilities:['str','con']});d.abilities.str=18;const r=M.derive(d,5);assert.equal(r.scores.str,20);assert.equal(r.scores.con,11);assert.equal(r.hpMax,20);assert.ok(r.effects.skills.includes('animalHandling'));assert.ok(r.effects.proficiencies.includes('Carpenter’s tools'));assert.equal(M.derive(d,5).hpMax,20);
 d.build.background='criminal-2024';const next=M.derive(d,5);assert.equal(next.hpMax,10);assert.ok(!next.effects.skills.includes('animalHandling'));assert.equal(next.initiative,3);assert.equal(next.scores.str,18);
});
test('2014 backgrounds grant no ASI or Origin feat and survive edition switching',()=>{
 const d=make('soldier-2014',{edition:'2014',backgroundTools:['Dice set']});const old=M.derive(d,5);assert.deepEqual(old.effects.asi,{});assert.ok(!old.effects.originFeats?.length);assert.ok(old.effects.proficiencies.includes('Vehicles (land)'));
 d.build.edition='2024';d.build.backgroundAbilities=['str','dex'];d.build.backgroundFeat='Tough';const modern=M.derive(d,5);assert.equal(modern.scores.str,12);assert.equal(modern.hpMax,20);assert.ok(modern.effects.skills.includes('intimidation'));
});
test('duplicate background skills offer one replacement without free extras or expertise',()=>{
 const d=make('soldier-2024',{classId:'fighter',classSkills:['athletics','perception'],backgroundReplacementSkills:['arcana','history']});const r=M.derive(d,5);assert.ok(r.effects.skills.includes('arcana'));assert.ok(!r.effects.skills.includes('history'));assert.equal(r.skills.athletics,3);assert.deepEqual(r.effects.backgroundDuplicates,[0]);
 d.build.backgroundReplacementSkills[0]='perception';assert.match(M.derive(d,5).effects.warnings.join(' '),/different untrained/);
});
test('legacy languages and merchant alternative validate only applicable choices',()=>{
 const d=make('guild-merchant-2014',{edition:'2014',backgroundTools:['Additional language'],backgroundLanguages:['Elvish','Dwarvish']});let r=M.derive(d,1);assert.ok(r.effects.languages.includes('Elvish'));assert.ok(r.effects.languages.includes('Dwarvish'));d.build.background='urchin-2014';r=M.derive(d,1);assert.ok(!r.effects.languages.includes('Elvish'));assert.ok(r.effects.proficiencies.includes('Thieves’ tools'));
});
test('background tool choices validate pool and do not silently grant an invalid tool',()=>{
 const d=make('artisan-2024',{backgroundTools:['Flute']});assert.ok(!M.derive(d,1).effects.proficiencies.includes('Flute'));assert.match(M.derive(d,1).effects.warnings.join(' '),/tool proficiency/);d.build.backgroundTools=['Smith’s tools'];assert.ok(M.derive(d,1).effects.proficiencies.includes('Smith’s tools'));
});
test('Guide automatically exposes druid Magic Initiate rather than a generic feat',()=>{
 const d=make('guide-2024');const g=C.grants(d);assert.ok(g.some(v=>v.fixedClass==='druid'&&v.edition==='2024'));
});
test('schema-normalized background selections round-trip and obsolete choices remain inert',()=>{
 const d=make('noble-2024',{backgroundTools:['Dice set'],backgroundReplacementSkills:['arcana'],backgroundLanguages:['Elvish']});assert.deepEqual(M.normalize(d),d);assert.ok(!M.derive(d,5).effects.languages.includes('Elvish'));d.build.edition='2014';assert.ok(!M.derive(d,5).effects.skills.includes('persuasion'));
});
