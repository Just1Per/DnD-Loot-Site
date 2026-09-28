const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),F=require('../js/modules/character-feat-rules'),R=require('../js/modules/character-rules');
const id=(n,source='XPHB')=>Object.keys(F.definitions).find(k=>F.definitions[k].name===n&&F.definitions[k].source===source);
const make=(name,source='XPHB',choice={},raw={})=>M.normalize({...raw,build:{edition:'2024',scoreMode:'base',...raw.build},rulesChoices:{feats:[id(name,source)],effects:{[id(name,source)]:choice}}});
test('Resilient never mutates shared class saves or grants another character proficiency',()=>{
 const baseline=[...R.classes.wizard.saves],d=make('Resilient','PHB',{abilities:['con']},{build:{edition:'2014',classId:'wizard'}});
 assert.ok(M.derive(d,5).effects.saves.includes('con'));assert.deepEqual(R.classes.wizard.saves,baseline);F.remove(d,id('Resilient','PHB'));assert.ok(!M.derive(d,5).effects.saves.includes('con'));assert.ok(!M.derive(M.normalize({build:{classId:'wizard'}}),5).effects.saves.includes('con'));
});
test('Lucky pools differ by edition, retain multiple spent points and recover only on long rest',()=>{
 assert.equal(F.resource(F.definitions[id('Lucky','PHB')],20).max,3);assert.equal(F.resource(F.definitions[id('Lucky')],1).max,2);assert.equal(F.resource(F.definitions[id('Lucky')],17).max,6);
 const d=make('Lucky','XPHB',{used:4});assert.equal(M.normalize(d).rulesChoices.effects[id('Lucky')].used,4);F.reset(d,'short');assert.equal(d.rulesChoices.effects[id('Lucky')].used,4);F.reset(d,'long');assert.equal(d.rulesChoices.effects[id('Lucky')].used,0);
});
test('Origin Lucky is tracked, additional duplicate is blocked and background wins duplicate selection',()=>{
 const d=make('Lucky','XPHB',{}, {build:{race:'human-2024',humanOriginFeat:'Lucky',backgroundFeat:'Lucky'}}),r=M.derive(d,9);
 const rows=r.feats.reports;assert.equal(rows.filter(r=>r.def.name==='Lucky'&&!r.warnings.length).length,1);assert.equal(rows.find(r=>!r.warnings.length).key,'origin-background');
});
test('Crafter restricts its tools and Musician supports Human Origin instrument choices',()=>{
 const tools=F.trainingOptions(F.definitions[id('Crafter')],R);assert.equal(tools.length,8);assert.ok(!tools.includes('tool:Flute'));
 let d=make('Crafter','XPHB',{training:tools.slice(0,3)});assert.equal(M.derive(d,1).effects.proficiencies.filter(x=>tools.slice(0,3).includes('tool:'+x)).length,3);
 d=M.normalize({build:{edition:'2024',race:'human-2024',humanOriginFeat:'Musician'},rulesChoices:{effects:{'origin-human':{training:['tool:Flute','tool:Lute','tool:Drum']}}}});
 assert.ok(M.derive(d,5).effects.proficiencies.includes('Lute'));assert.ok(M.derive(d,5).effects.traits.some(t=>t.includes('eligible allies')&&t.includes('3')));
});
test('movement bonuses and Athlete climbing derive from current base without accumulation',()=>{
 const d=make('Speedy','XPHB',{abilities:['dex']},{speed:30,abilities:{dex:13}});d.rulesChoices.feats.push(id('Athlete'));d.rulesChoices.effects[id('Athlete')]=F.choice({abilities:['str']});d.abilities.str=13;
 assert.equal(M.derive(d,4).effects.speed,40);assert.equal(M.derive(d,4).effects.climb,40);assert.equal(M.derive(d,4).effects.speed,40);assert.equal(d.speed,30);
 F.remove(d,id('Speedy'));assert.equal(M.derive(d,4).effects.speed,30);assert.equal(M.derive(d,4).effects.climb,30);
 const legacy=make('Athlete','PHB',{abilities:['str']},{speed:30});assert.equal(M.derive(legacy,4).effects.climb,0);
});
test('Mobile and its revised Speedy replacement cannot stack',()=>{
 const d=make('Mobile','PHB',{}, {speed:30,abilities:{dex:13}});d.rulesChoices.feats.push(id('Speedy'));d.rulesChoices.effects[id('Speedy')]=F.choice({abilities:['dex']});assert.equal(M.derive(d,4).effects.speed,40);assert.match(M.derive(d,4).feats.reports[1].warnings.join(' '),/Duplicate/);
});
test('armor training respects PHB and XPHB shield differences',()=>{
 const a=make('Lightly Armored','PHB',{abilities:['dex']}),b=make('Lightly Armored','XPHB',{abilities:['dex']});assert.ok(!M.derive(a,4).effects.proficiencies.includes('Shields'));assert.ok(M.derive(b,4).effects.proficiencies.includes('Shields'));
 const c=make('Moderately Armored','XPHB',{abilities:['dex'],confirmed:true});assert.ok(M.derive(c,4).effects.proficiencies.includes('Medium armor'));assert.ok(!M.derive(c,4).effects.proficiencies.includes('Shields'));
});
test('Keen Mind upgrades existing proficiency while Boon of Skill grants all skills and one expertise',()=>{
 const d=make('Keen Mind','XPHB',{training:['skill:arcana']},{abilities:{int:13},skills:{arcana:{rank:1}}});assert.equal(M.derive(d,4).skills.arcana,6);
 const b=make('Boon of Skill','XPHB',{abilities:['wis'],expertise:'perception'});const r=M.derive(b,19);assert.equal(r.effects.skills.length,18);assert.equal(r.skills.athletics,6);assert.equal(r.skills.perception,12);
});
test('Linguist grants three different new languages and rejects duplicate training',()=>{
 const d=make('Linguist','PHB',{training:['language:Elvish','language:Draconic','language:Sylvan']});assert.ok(M.derive(d,4).effects.languages.includes('Sylvan'));d.rulesChoices.effects[id('Linguist','PHB')].training=['language:Elvish','language:Elvish','language:Sylvan'];assert.match(M.derive(d,4).feats.reports[0].warnings.join(' '),/different/);
});
test('Epic speed and HP bonuses gate on level and respect final HP mode',()=>{
 const d=make('Boon of Fortitude','XPHB',{abilities:['str']},{hpMax:100,speed:30});d.rulesChoices.feats.push(id('Boon of Speed'));d.rulesChoices.effects[id('Boon of Speed')]=F.choice({abilities:['str']});assert.equal(M.derive(d,18).hpMax,100);assert.equal(M.derive(d,19).hpMax,140);assert.equal(M.derive(d,19).effects.speed,60);d.build.scoreMode='final';assert.equal(M.derive(d,19).hpMax,100);
});
