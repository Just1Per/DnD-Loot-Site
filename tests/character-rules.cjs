const {test}=require('node:test'),assert=require('node:assert/strict');const M=require('../js/modules/character-sheet-model');const R=require('../js/modules/character-rules');
const build=(race,extra={})=>M.normalize({abilities:{dex:14,int:12,con:12},hpMax:20,hpCurrent:20,build:{race,scoreMode:'base',...extra}});
test('expanded catalog contains 79 races and twelve classes',()=>{assert.equal(Object.keys(R.races).length,79);assert.equal(Object.keys(R.classes).length,12)});
test('elf bonuses feed skills, attack and spell calculations',()=>{const d=M.derive(build('high-elf'),5);assert.equal(d.scores.dex,16);assert.equal(d.scores.int,13);assert.equal(d.skills.perception,3);assert.equal(d.spellDC,12);});
test('switching race recalculates without stacking',()=>{const d=build('high-elf');const a=M.derive(d,1);d.build.race='human';const b=M.derive(d,1);d.build.race='';const c=M.derive(d,1);assert.deepEqual([a.scores.dex,b.scores.dex,c.scores.dex],[16,15,14]);assert.equal(d.abilities.dex,14)});
test('legacy sheets use final totals and keep free-text race',()=>{const d=M.normalize({species:'My elf',abilities:{dex:16},build:{race:'high-elf'}});assert.equal(M.derive(d,1).scores.dex,16);assert.equal(d.species,'My elf');});
test('all fixed race bonuses match catalog',()=>{for(const [race,entry] of Object.entries(R.races)){const d=build(race);for(const [key,n] of Object.entries(entry.asi))assert.equal(M.derive(d,1).scores[key],d.abilities[key]+n);}});
test('half elf rejects duplicate and charisma ability choices',()=>{const d=build('half-elf',{abilityChoices:['dex','dex']});assert.equal(M.derive(d,1).scores.dex,15);assert.ok(M.derive(d,1).effects.warnings.length);d.build.abilityChoices=['cha','str'];assert.equal(M.derive(d,1).scores.cha,12);});
test('race and manual skill training combine without double proficiency',()=>{const d=build('high-elf');d.skills.perception.rank=2;assert.equal(M.derive(d,5).skills.perception,6);d.build.race='human';assert.equal(M.derive(d,5).skills.perception,6);});
test('dwarf toughness scales with level and healing uses effective max',()=>{const d=build('hill-dwarf');assert.equal(M.derive(d,7).hpMax,27);assert.equal(M.heal(d,99,7).hpCurrent,27);d.build.scoreMode='total';assert.equal(M.derive(d,7).hpMax,20);});
test('dragon breath damage thresholds and ancestry saves',()=>{const d=build('dragonborn',{dragon:'white'});assert.deepEqual([1,6,11,16].map(n=>M.derive(d,n).effects.breath.dice),[2,3,4,5]);assert.equal(M.derive(d,5).effects.breath.save,'con');assert.deepEqual(M.derive(d,5).effects.resistances,['Cold']);});
test('tiefling innate spells unlock at levels 3 and 5',()=>assert.deepEqual([1,3,5].map(n=>M.derive(build('tiefling'),n).effects.innate.length),[1,2,3]));
test('class training is derived and never mutates manual saves',()=>{const d=build('',{classId:'wizard',classSkills:['arcana','history']});assert.equal(M.derive(d,5).saves.int,4);assert.equal(M.derive(d,5).skills.arcana,4);d.build.classId='fighter';assert.equal(M.derive(d,5).saves.int,1);assert.equal(d.saves.int.proficient,false);});
test('duplicate and unavailable class skills do not grant training',()=>{const e=M.derive(build('',{classId:'wizard',classSkills:['athletics','athletics']}),5).effects;assert.ok(!e.skills.includes('athletics'));assert.ok(e.warnings.length)});
test('full caster table covers level boundaries',()=>{assert.deepEqual(M.derive(build('',{classId:'wizard',autoSlots:true}),3).effects.slotMax,[4,2,0,0,0,0,0,0,0]);assert.deepEqual(M.derive(build('',{classId:'cleric',autoSlots:true}),20).effects.slotMax,[4,3,3,3,3,2,2,1,1]);});
test('half caster starts at level two',()=>{assert.equal(M.derive(build('',{classId:'paladin',autoSlots:true}),1).effects.slotMax.reduce((a,b)=>a+b),0);assert.equal(M.derive(build('',{classId:'ranger',autoSlots:true}),5).effects.slotMax[1],2);});
test('pact magic slots remain separate from normal caster table',()=>{const e=M.derive(build('',{classId:'warlock',autoSlots:true}),11).effects;assert.deepEqual(e.pact,{level:5,count:3});assert.deepEqual(e.slotMax,[0,0,0,0,3,0,0,0,0]);});
test('manual slots remain available with automation off',()=>assert.equal(M.derive(build('',{classId:'wizard',autoSlots:false}),20).effects.slotMax,null));
test('Acolyte applies insight and religion while preserving notes',()=>{const d=build('',{background:'acolyte'});d.features='My custom feature';const e=M.derive(d,5);assert.equal(e.skills.insight,3);assert.equal(e.skills.religion,4);assert.equal(d.features,'My custom feature');});
test('normalization preserves build choices and is idempotent',()=>{const d=build('half-elf',{classId:'bard',abilityChoices:['str','dex'],skillChoices:['arcana','history'],classSkills:['athletics','deception','insight']});assert.deepEqual(M.normalize(d),d);});

test('all explicitly requested common exotic and monstrous races exist with source metadata',()=>{
 const names=['Aarakocra','Aasimar','Changeling','Deep Gnome','Duergar','Eladrin','Fairy','Firbolg','Genasi — Air','Genasi — Earth','Genasi — Fire','Genasi — Water','Githyanki','Githzerai','Goliath','Harengon','Kenku','Locathah','Owlin','Satyr','Sea Elf','Shadar-Kai','Tabaxi','Tortle','Triton','Verdan','Bugbear','Centaur','Goblin','Grung','Hobgoblin','Kobold','Lizardfolk','Minotaur','Orc','Shifter','Yuan-Ti'];
 for(const name of names){const r=Object.values(R.races).find(r=>r.name===name);assert.ok(r,name);assert.ok(r.source);assert.match(r.url,/^https:\/\/dnd5e.wikidot.com\/lineage:/);}
});
test('flexible allocations include CHA, reject duplicates and remove unused third bonus',()=>{
 const d=build('fairy-mpmm',{flexibleChoices:['cha','dex','con'],asiPattern:'111'});
 assert.deepEqual(M.derive(d,1).effects.asi,{cha:1,dex:1,con:1});
 d.build.asiPattern='21';assert.deepEqual(M.derive(d,1).effects.asi,{cha:2,dex:1});
 d.build.flexibleChoices=['str','str'];assert.deepEqual(M.derive(d,1).effects.asi,{str:2});assert.ok(M.derive(d,1).effects.warnings.some(w=>w.includes('distinct')));
});
test('racial bonuses stop at 20 without reducing magical totals above 20',()=>{
 const d=build('aarakocra-mpmm',{flexibleChoices:['dex','con']});d.abilities.dex=19;assert.equal(M.derive(d,1).scores.dex,20);d.abilities.dex=22;assert.equal(M.derive(d,1).scores.dex,22);d.build.scoreMode='total';d.abilities.dex=19;assert.equal(M.derive(d,1).scores.dex,19);
});
test('fixed subraces replace rather than inherit sibling traits',()=>{
 assert.deepEqual(M.derive(build('mountain-dwarf'),7).effects.asi,{str:2,con:2});assert.equal(M.derive(build('mountain-dwarf'),7).hpMax,20);
 assert.equal(M.derive(build('wood-elf'),1).effects.speed,35);assert.equal(M.derive(build('wood-elf'),1).effects.innate.length,0);
 assert.equal(M.derive(build('forest-gnome'),1).effects.innate.length,1);
 assert.deepEqual(M.derive(build('stout-halfling'),1).effects.resistances,['Poison']);
});
test('racial magic unlocks at level boundaries and remains separate from class ability',()=>{
 const d=build('fairy-mpmm',{raceAbility:'wis',classId:'wizard'});d.spellAbility='int';
 assert.deepEqual([1,3,5].map(n=>M.derive(d,n).effects.innate.length),[1,2,3]);assert.ok(M.derive(d,5).effects.innate.every(n=>n.includes('WIS')));assert.equal(d.spellAbility,'int');
});
test('racial skill choices respect pools, count, fixed skills and manual expertise',()=>{
 const d=build('changeling-mpmm',{raceSkills:['athletics','deception']});assert.deepEqual(M.derive(d,1).effects.skills,['deception']);
 d.build.raceSkills=['deception','deception'];assert.deepEqual(M.derive(d,1).effects.skills,['deception']);d.skills.deception.rank=2;assert.equal(M.derive(d,5).skills.deception,6);
 d.build.race='astral-elf';d.build.raceSkills=['perception'];assert.deepEqual(M.derive(d,1).effects.skills,['perception']);assert.ok(M.derive(d,1).effects.warnings.some(w=>w.includes('racial skills')));
});
test('Kobold legacy grants only selected option and prevents stale choice effects',()=>{
 const d=build('kobold-mpmm',{raceFeature:'craftiness',raceSkills:['arcana'],raceCantrip:'Fire Bolt',raceAbility:'cha'});assert.ok(M.derive(d,1).effects.skills.includes('arcana'));assert.equal(M.derive(d,1).effects.innate.length,0);
 d.build.raceFeature='sorcery';assert.equal(M.derive(d,1).effects.skills.length,0);assert.ok(M.derive(d,1).effects.innate[0].includes('Fire Bolt'));
 d.build.race='human';assert.equal(M.derive(d,1).effects.innate.length,0);
});
test('Aasimar revelation and Simic second enhancement are gated by level',()=>{
 const d=build('aasimar-mpmm',{raceFeature:'soul'});assert.ok(!M.derive(d,2).effects.traits.some(t=>t.includes('Revelation')));assert.ok(M.derive(d,3).effects.traits.some(t=>t.includes('Revelation')));
 const sim=build('simic-hybrid',{raceFeature:'climb',raceFeature2:'water'});assert.equal(M.derive(sim,4).effects.climb,30);assert.equal(M.derive(sim,4).effects.swim,0);assert.equal(M.derive(sim,5).effects.swim,30);
 sim.build.raceFeature2='climb';assert.ok(M.derive(sim,5).effects.warnings.some(w=>w.includes('different second')));
});
test('Harengon initiative scales and disappears on race switch',()=>{
 const d=build('harengon-mpmm');d.initiativeBonus=1;assert.equal(M.derive(d,5).initiative,6);d.build.race='human';assert.equal(M.derive(d,5).initiative,3);
});
test('choice size, growth, movement and natural armor stay separate from combat state',()=>{
 assert.equal(M.derive(build('verdan'),4).effects.size,'Small');assert.equal(M.derive(build('verdan'),5).effects.size,'Medium');assert.equal(M.derive(build('tabaxi-mpmm',{raceSize:'Small'}),1).effects.size,'Small');
 const d=build('tortle-mpmm');d.ac=19;assert.deepEqual(M.derive(d,1).effects.naturalArmor,{base:17});assert.equal(d.ac,19);assert.equal(M.derive(build('owlin'),1).effects.fly,30);assert.equal(M.derive(build('owlin'),1).effects.darkvision,120);
});
test('extra language and proficiency choices cannot grant unavailable or duplicate selections',()=>{
 const d=build('simic-hybrid',{extraLanguage:'Draconic'});assert.deepEqual(M.derive(d,1).effects.languages,['Common']);d.build.extraLanguage='Vedalken';assert.deepEqual(M.derive(d,1).effects.languages,['Common','Vedalken']);
 assert.deepEqual(M.derive(build('satyr-mpmm',{raceTools:['Longsword']}),1).effects.proficiencies,[]);
 assert.deepEqual(M.derive(build('autognome',{raceTools:['Flute','Flute']}),1).effects.proficiencies,['Flute']);
});
test('Custom Lineage and Variant Human apply different bonus and feature rules',()=>{
 const d=build('custom-lineage',{flexibleChoices:['dex','con'],raceFeature:'vision',raceSkills:['arcana']});assert.deepEqual(M.derive(d,1).effects.asi,{dex:2});assert.equal(M.derive(d,1).effects.darkvision,60);assert.deepEqual(M.derive(d,1).effects.skills,[]);
 d.build.race='variant-human';assert.deepEqual(M.derive(d,1).effects.asi,{dex:1,con:1});assert.equal(M.derive(d,1).effects.darkvision,0);
});
test('expanded build survives normalization and ignores forged identifiers',()=>{
 const d=build('kobold-mpmm',{asiPattern:'111',flexibleChoices:['dex','con','cha'],raceFeature:'sorcery',raceCantrip:'Fire Bolt',raceAbility:'cha',raceSize:'Small',raceTools:['Flute'],raceFeat:'My feat'});assert.deepEqual(M.normalize(d),d);
 assert.equal(R.normalize({race:'toString'}).race,'');assert.equal(R.profile({race:'__proto__'}),null);assert.doesNotThrow(()=>M.derive(build('kobold-mpmm',{raceFeature:'__proto__'}),1));
});

test('legacy normalization preserves edition while explicit 2024 persists',()=>{
 assert.equal(M.normalize({}).build.edition,'2014');
 const d=build('human-2024',{edition:'2024',background:'criminal-2024',backgroundAbilities:['dex','con'],humanOriginFeat:'Tough'});assert.deepEqual(M.normalize(d),d);
});
test('2024 Human grants skill and separate Origin feat without racial ASI',()=>{
 const d=build('human-2024',{edition:'2024',background:'criminal-2024',backgroundAbilities:['dex','con'],humanOriginFeat:'Tough',raceSkills:['arcana'],raceSize:'Small'});const e=M.derive(d,5);
 assert.equal(e.scores.dex,16);assert.equal(e.scores.con,13);assert.equal(e.scores.cha,10);assert.equal(e.hpMax,30);assert.deepEqual(e.effects.originFeats,['Alert','Tough']);assert.ok(e.effects.skills.includes('arcana'));assert.equal(e.effects.size,'Small');assert.equal(e.initiative,6);
});
test('2014 Variant Human keeps two +1 choices and unrestricted manual feat entry',()=>{
 const d=build('variant-human',{flexibleChoices:['str','dex'],raceFeat:'War Caster',raceSkills:['arcana']});assert.equal(M.derive(d,1).scores.str,11);assert.equal(M.derive(d,1).scores.dex,15);assert.ok(M.derive(d,1).effects.traits.some(t=>t.includes('War Caster')));
});
test('2024 compatibility ignores fixed and flexible legacy racial ASIs',()=>{
 for(const race of ['human','half-elf','variant-human','fairy-mpmm']){
 const d=build(race,{edition:'2024',background:'sage-2024',backgroundAbilities:['int','wis'],abilityChoices:['str','dex'],flexibleChoices:['str','dex']});const e=M.derive(d,1);assert.equal(e.scores.dex,14,race);assert.equal(e.scores.str,10,race);assert.equal(e.scores.int,14,race);assert.ok(!e.effects.warnings.some(w=>w.includes('Half-Elf abilities')||w.includes('racial bonus')),race);}
});
test('2024 background allocation enforces permitted abilities and distinct choices',()=>{
 const d=build('human-2024',{edition:'2024',background:'acolyte-2024',backgroundAbilities:['str','wis']});assert.deepEqual(M.derive(d,1).effects.asi,{wis:1});d.build.backgroundPattern='111';d.build.backgroundAbilities=['int','wis','cha'];assert.deepEqual(M.derive(d,1).effects.asi,{int:1,wis:1,cha:1});
});
test('2024 Human feat duplicate is rejected; Skilled is repeatable with distinct training',()=>{
 const d=build('human-2024',{edition:'2024',background:'criminal-2024',humanOriginFeat:'Alert'});assert.deepEqual(M.derive(d,5).effects.originFeats,['Alert']);assert.ok(M.derive(d,5).effects.warnings.some(w=>w.includes('twice')));
 d.build.background='';d.build.backgroundFeat='Skilled';d.build.humanOriginFeat='Skilled';d.build.backgroundFeatChoices=['skill:arcana','tool:Flute','skill:history'];d.build.humanFeatChoices=['skill:medicine','tool:Drum','skill:nature'];const e=M.derive(d,5).effects;assert.equal(e.originFeats.length,2);assert.ok(e.skills.includes('medicine'));assert.ok(e.proficiencies.includes('Drum'));
});
test('Alert and Harengon never add proficiency to initiative twice',()=>{const d=build('harengon-mpmm',{edition:'2024',background:'criminal-2024'});assert.equal(M.derive(d,5).initiative,5);});
test('2024 Dragonborn has d10 breath scaling, DEX save and long-rest use',()=>{
 const d=build('dragonborn-2024',{edition:'2024',dragon:'white'});assert.deepEqual([1,5,11,17].map(l=>M.derive(d,l).effects.breath.dice),[1,2,3,4]);const e=M.derive(d,5).effects;assert.equal(e.breath.die,10);assert.equal(e.breath.save,'dex');assert.ok(e.traits.some(t=>t.includes('manifest wings')));assert.ok(e.resistances.includes('Cold'));
});
test('2024 Dwarf and Origin Tough combine without altering final HP mode',()=>{
 const d=build('dwarf-2024',{edition:'2024',backgroundFeat:'Tough'});assert.equal(M.derive(d,5).hpMax,35);assert.equal(M.derive(d,5).effects.darkvision,120);d.build.scoreMode='total';assert.equal(M.derive(d,5).hpMax,20);
});
test('2024 lineages alter movement and spells without applying 2014 features',()=>{
 const d=build('elf-2024',{edition:'2024',raceFeature:'wood',raceAbility:'wis'});assert.equal(M.derive(d,5).effects.speed,35);assert.ok(M.derive(d,5).effects.innate.some(s=>s.includes('Pass Without Trace')));
 d.build.raceFeature='drow';assert.equal(M.derive(d,5).effects.darkvision,120);assert.ok(!M.derive(d,5).effects.traits.some(t=>t.includes('sunlight')));
 d.build.raceFeature='high';assert.ok(M.derive(d,1).effects.innate.some(s=>s.includes('Prestidigitation')));
 d.build.race='tiefling-2024';d.build.raceFeature='infernal';assert.ok(M.derive(d,1).effects.innate.some(s=>s.includes('Fire Bolt')));assert.ok(!M.derive(d,1).effects.innate.some(s=>s.includes('Hellish Rebuke')));
});
test('2024 class base proficiencies and level-one half-caster slots differ from 2014',()=>{
 for(const classId of ['paladin','ranger']){const d=build('',{edition:'2024',classId,autoSlots:true});assert.equal(M.derive(d,1).effects.slotMax[0],2);d.build.edition='2014';assert.equal(M.derive(d,1).effects.slotMax[0],0);}
 const d=build('',{edition:'2024',classId:'druid'});assert.ok(!M.derive(d,1).effects.proficiencies.includes('Medium armor'));d.build.classId='wizard';assert.ok(M.derive(d,1).effects.classData.skills.includes('nature'));
});
test('2024 species cannot silently supply traits to a 2014 sheet',()=>{const e=M.derive(build('dwarf-2024'),1).effects;assert.equal(e.race,null);assert.equal(e.hpBonus,0);assert.ok(e.warnings.some(w=>w.includes('requires 2024')));});
