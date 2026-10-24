const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model');
const make=(classId='barbarian',edition='2024',level=20)=>{const d=M.normalize({build:{classId,edition,scoreMode:'base'},abilities:{str:20,dex:20,con:20,int:10,wis:20,cha:10},hpMax:100});d.adobe={classLevels:[{classId,level}],classFeatureChoices:{'keep:choice':['preserved']}};return d;};
test('Primal Champion grants Strength/Constitution +4 at actual Barbarian 20 with edition-specific caps',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++){const d=make('barbarian',edition,level),r=M.derive(d,level);assert.equal(r.scores.str,level===20?24:20);assert.equal(r.scores.con,level===20?24:20);assert.equal(r.classAbilityFeatures.length,level===20?1:0);if(level===20)assert.equal(r.classAbilityFeatures[0].max,edition==='2024'?25:24);}
 for(const edition of ['2014','2024']){const d=make('barbarian',edition);d.abilities.str=23;d.abilities.con=28;const r=M.derive(d,20);assert.equal(r.scores.str,edition==='2024'?25:24);assert.equal(r.scores.con,28,'an already higher score is not reduced');}
});
test('Body and Mind applies Dexterity/Wisdom +4 only to a revised Monk at level 20',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++){const d=make('monk',edition,level),r=M.derive(d,level),active=edition==='2024'&&level===20;assert.equal(r.scores.dex,active?24:20);assert.equal(r.scores.wis,active?24:20);assert.equal(r.classAbilityFeatures.length,active?1:0);}
 const d=make('monk');d.abilities.dex=24;d.abilities.wis=26;const r=M.derive(d,20);assert.equal(r.scores.dex,25);assert.equal(r.scores.wis,26);
});
test('derived saves, checks, defenses, HP and Monk feature DC follow capstone scores automatically',()=>{
 const barb=make(),r=M.derive(barb,20);assert.equal(r.skills.athletics,7);assert.equal(r.saves.str,13);assert.equal(r.saves.con,13);assert.equal(r.hpMax,140);assert.equal(r.ac,22);assert.equal(barb.hpMax,100);assert.equal(barb.abilities.con,20);
 const monk=make('monk'),m=M.derive(monk,20);assert.equal(m.ac,24);assert.equal(m.saves.dex,13);assert.equal(m.saves.wis,13);assert.equal(m.classResources.find(row=>row.id==='monk-points').dc,21);assert.equal(m.hpMax,100);
});
test('Final totals mode shows a reference without double adding scores or HP',()=>{
 for(const classId of ['barbarian','monk']){const d=make(classId);d.build.scoreMode='total';for(const key of ['str','dex','con','wis'])d.abilities[key]=24;d.hpMax=140;const r=M.derive(d,20);assert.equal(r.scores.str,24);assert.equal(r.scores.con,24);assert.equal(r.scores.dex,24);assert.equal(r.scores.wis,24);assert.equal(r.hpMax,140);assert.equal(r.classAbilityFeatures[0].automatic,false);assert.ok(Object.values(r.classAbilityFeatures[0].appliedAbilityIncreases).every(value=>value===0));}
});
test('total level 20 does not activate a lower multiclass level or duplicate assignments',()=>{
 for(const classId of ['barbarian','monk']){const d=make(classId);d.build.classId='wizard';d.adobe.classLevels=[{classId:'wizard',level:1},{classId,level:20}];assert.equal(M.derive(d,20).classAbilityFeatures.length,0);d.adobe.classLevels=[{classId,level:19},{classId,level:1}];assert.equal(M.derive(d,20).classAbilityFeatures.length,0);}
});
test('class/source changes and save envelopes preserve inputs and never compound automatic increases',()=>{
 for(const classId of ['barbarian','monk']){const d=make(classId),before=JSON.stringify(d),first=M.derive(d,20),second=M.derive(d,20);assert.deepEqual(second.scores,first.scores);assert.equal(JSON.stringify(d),before);const saved=structuredClone(d);saved.rulesChoices.grants.__adobe={data:saved.adobe};delete saved.adobe;assert.deepEqual(M.derive(saved,20).classAbilityFeatures,first.classAbilityFeatures);assert.deepEqual(M.derive(saved,20).scores,first.scores);d.adobe.classLevels[0].level=19;assert.equal(M.derive(d,20).classAbilityFeatures.length,0);assert.deepEqual(d.adobe.classFeatureChoices['keep:choice'],['preserved']);}
});
test('magic item ability overrides keep their own values without lowering or multiplying the class increase',()=>{
 const d=make();d.equipmentState.loadout=[{id:'amulet',equipped:true,attuned:true}];let r=M.derive(d,20,[{id:'amulet',quantity:1,item:{name:'Amulet of Health'}}]);assert.equal(r.scores.con,24,'a 19-point item override cannot lower the capstone score');assert.equal(r.hpMax,140);assert.equal(r.classAbilityFeatures[0].appliedAbilityIncreases.con,4);
});
