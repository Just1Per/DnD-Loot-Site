const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../js/modules/character-feat-rules'),M=require('../js/modules/character-sheet-model');
const id=(name,source='XPHB')=>Object.keys(F.definitions).find(k=>F.definitions[k].name===name&&F.definitions[k].source===source);
function sheet(name,choice={},raw={},source='XPHB') {const key=id(name,source);return M.normalize({...raw,build:{edition:source==='PHB'?'2014':'2024',scoreMode:'base',...raw.build},rulesChoices:{feats:[key],effects:{[key]:choice}}});}
test('all 302 metadata definitions evaluate safely; 178 have numeric ability increases',()=>{
 assert.equal(Object.values(F.definitions).filter(d=>d.ability.length).length,178);
 for(const key of Object.keys(F.definitions)){const d=M.normalize({rulesChoices:{feats:[key]}});assert.doesNotThrow(()=>M.derive(d,20));}
});
test('2024 Grappler checks prerequisites before applying its +1; removes bonus with feat',()=>{
 let d=sheet('Grappler',{abilities:['str']},{abilities:{str:12}});assert.equal(M.derive(d,4).scores.str,12);assert.match(M.derive(d,4).feats.reports[0].warnings.join(' '),/prerequisite/);
 d.abilities.str=13;assert.equal(M.derive(d,4).scores.str,14);F.remove(d,id('Grappler'));assert.equal(M.derive(d,4).scores.str,13);
});
test('ability options enforce caps, distinct choices, final mode and epic level',()=>{
 let d=sheet('Ability Score Improvement',{option:0,abilities:['str']},{abilities:{str:19}});assert.equal(M.derive(d,4).scores.str,20);
 d.rulesChoices.effects[id('Ability Score Improvement')].option=1;d.rulesChoices.effects[id('Ability Score Improvement')].abilities=['str','str'];assert.equal(M.derive(d,4).scores.str,19);
 d.rulesChoices.effects[id('Ability Score Improvement')].abilities=['str','dex'];assert.equal(M.derive(d,4).scores.dex,11);
 d.build.scoreMode='final';assert.equal(M.derive(d,4).scores.dex,10);
 d=sheet('Boon of Truesight',{abilities:['wis']},{abilities:{wis:25}});assert.equal(M.derive(d,18).scores.wis,25);assert.equal(M.derive(d,19).scores.wis,26);assert.ok(M.derive(d,19).effects.traits.includes('Boon of Truesight: Truesight 60 ft.'));
});
test('repeated ASIs keep independent choices when an earlier instance is removed',()=>{
 const key=id('Ability Score Improvement'),d=sheet('Ability Score Improvement',{abilities:['str']});d.rulesChoices.feats.push(key);d.rulesChoices.effects[key+'--2']=F.choice({abilities:['dex']});
 assert.equal(M.derive(d,8).scores.str,12);assert.equal(M.derive(d,8).scores.dex,12);F.remove(d,key);assert.equal(M.derive(d,8).scores.str,10);assert.equal(M.derive(d,8).scores.dex,12);assert.equal(d.rulesChoices.effects[key].abilities[0],'dex');
});
test('Resilient ties the saving throw to the ASI and rejects existing 2024 proficiency',()=>{
 let d=sheet('Resilient',{abilities:['con']},{abilities:{con:13}});let r=M.derive(d,4);assert.equal(r.scores.con,14);assert.equal(r.saves.con,4);
 d.saves.con.proficient=true;r=M.derive(d,4);assert.equal(r.scores.con,13);assert.match(r.feats.reports[0].warnings.join(' '),/without saving/);
});
test('Skilled and Skill Expert apply training, not repeated additive proficiency',()=>{
 let d=sheet('Skilled',{training:['skill:arcana','skill:perception','tool:Flute']});let r=M.derive(d,5);assert.equal(r.skills.arcana,3);assert.equal(r.skills.perception,3);assert.ok(r.effects.proficiencies.includes('Flute'));
 d=sheet('Skill Expert',{abilities:['int'],training:['skill:arcana'],expertise:'arcana'},{abilities:{int:13}});r=M.derive(d,4);assert.equal(r.skills.arcana,6);assert.equal(r.scores.int,14);
});
test('Alert and Tough do not duplicate matching Origin bonuses; Variant Human works',()=>{
 let d=sheet('Tough',{}, {hpMax:10,build:{race:'human-2024',humanOriginFeat:'Tough'}});assert.equal(M.derive(d,5).hpMax,20);
 d=M.normalize({build:{edition:'2014',race:'variant-human',raceFeat:'Alert',scoreMode:'base'}});assert.equal(M.derive(d,5).initiative,5);
 d=sheet('Alert',{},{});assert.equal(M.derive(d,9).initiative,4);
});
test('conditional Defense and Archery require confirmation and only affect appropriate values',()=>{
 let d=sheet('Defense',{armored:true},{ac:16});assert.equal(M.derive(d,4).ac,16);d.rulesChoices.effects[id('Defense')].confirmed=true;assert.equal(M.derive(d,4).ac,17);assert.equal(d.ac,16);
 d=sheet('Archery',{confirmed:true},{attacks:[{ability:'dex',proficient:true,rangedWeapon:true},{ability:'dex',proficient:true,rangedWeapon:false}]});assert.deepEqual(M.derive(d,4).attacks,[4,2]);
});
test('feat recovery uses its own event and preserves other resources',()=>{
 let d=sheet('Boon of Fate',{abilities:['wis'],used:1});F.reset(d,'turn');assert.equal(d.rulesChoices.effects[id('Boon of Fate')].used,1);F.reset(d,'short');assert.equal(d.rulesChoices.effects[id('Boon of Fate')].used,0);
 d=sheet('Boon of Combat Prowess',{abilities:['str'],used:1});F.reset(d,'short');assert.equal(d.rulesChoices.effects[id('Boon of Combat Prowess')].used,1);F.reset(d,'turn');assert.equal(d.rulesChoices.effects[id('Boon of Combat Prowess')].used,0);
 assert.deepEqual(M.normalize(d),d);
});
test('feat Constitution modifier updates maximum HP retroactively in Base mode only',()=>{
 const d=sheet('Ability Score Improvement',{abilities:['con']},{hpMax:30,abilities:{con:13}});assert.equal(M.derive(d,5).hpMax,35);assert.equal(d.hpMax,30);d.build.scoreMode='final';assert.equal(M.derive(d,5).hpMax,30);
});
test('unrecognized feats remain removable and unsafe object keys cannot break evaluation',()=>{
 const d=M.normalize({rulesChoices:{feats:['__proto__','toString','unknown-feat']}});assert.doesNotThrow(()=>M.derive(d,5));assert.equal(M.derive(d,5).feats.reports.length,2);F.remove(d,'unknown-feat');assert.equal(d.rulesChoices.feats.length,1);
});
test('2014 and 2024 editions of the same feat cannot stack their bonuses',()=>{
 const d=sheet('Alert',{}, {build:{edition:'2024',race:'human-2024',humanOriginFeat:'Alert'}},'PHB');assert.equal(M.derive(d,9).initiative,4);assert.match(M.derive(d,9).feats.reports[0].warnings.join(' '),/Duplicate/);
});
