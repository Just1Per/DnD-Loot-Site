'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../js/modules/character-tool-checks'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices');
const build=(classId,level,edition='2014',subclassId='')=>{const data=M.normalize({abilities:{str:14,dex:16,con:12,int:18,wis:10,cha:8},build:{classId,edition,scoreMode:'final'}});data.adobe={classLevels:[{classId,level,subclassId}],classFeatureChoices:{}};return data;};
const check=(d,l,raw)=>T.project(raw,{...M.derive(d,l),proficiencies:d.proficiencies,toolNames:require('../js/modules/character-rules').tools});
test('original tool names select an explicit parenthesized ability without evaluating code or guessing Dexterity',()=>{
 const mods={str:2,dex:3,con:1,int:4,wis:0,cha:-1};for(const ability of T.abilities){const row=T.project({name:'Custom ('+ability.toUpperCase()+')'},{mods,pb:3});assert.equal(row.ability,ability);assert.equal(row.total,mods[ability]);}
 for(const name of ['Thieves tools','Tool ( Dexterity )','Tool (Luck)','(()=>4)()','Tool (DEXTERITY)'])assert.equal(T.project({name},{mods,pb:3}).total,null);
 assert.equal(T.project({name:'Check (Dex) (Str)'},{mods,pb:3}).ability,'str','source ability-priority order is preserved');
});
test('manual proficiency, expertise and adjustments use the same PB and ability once; removing expertise retains proficiency',()=>{
 const ctx={mods:{dex:3},pb:3};let raw=T.edit({},'name',"Thieves' Tools (Dex)",ctx);raw=T.edit(raw,'expertise',true,ctx);assert.equal(T.project(raw,ctx).total,9);raw=T.edit(raw,'bonus',-2,ctx);assert.equal(T.project(raw,ctx).total,7);raw=T.edit(raw,'expertise',false,ctx);assert.equal(T.project(raw,ctx).total,4);raw=T.edit(raw,'proficient',false,ctx);assert.equal(T.project(raw,ctx).total,1);
 const next=T.edit(raw,'ability','int',ctx);assert.equal(next.name,"Thieves' Tools (Int)");assert.equal(raw.name,"Thieves' Tools (Dex)");assert.equal(T.edit(next,'ability','',ctx).name,"Thieves' Tools");
});
test('known tool training matches exact names across case and apostrophes, protects grants, and never matches incidental prose',()=>{
 const ctx={mods:{dex:3},pb:3,effects:{proficiencies:['Thieves’ tools']},classExpertise:{tools:[{name:'Thieves’ tools'}]}};
 const raw={name:"THIEVES' TOOLS (Dex)",rank:2},before=JSON.stringify(raw);const row=T.project(raw,ctx);assert.equal(row.total,9);assert.equal(row.automaticRank,2);assert.throws(()=>T.edit(raw,'expertise',false,ctx));assert.throws(()=>T.edit(raw,'proficient',false,ctx));assert.equal(T.project({name:"not Thieves' tools (Dex)"},ctx).automaticRank,0);assert.equal(JSON.stringify(raw),before);
});
test('Artificer tool proficiency and Tasha expertise follow class levels 1–20, source, multiclass cap and removal',()=>{
 for(let level=1;level<=20;level++){
  const d=build('artificer',level),row=check(d,level,{name:'Thieves’ tools (Dex)',rank:0});assert.equal(row.total,3+M.proficiency(level)*(level>=6?2:1));
 }
 const d=build('artificer',6,'2024');assert.equal(check(d,6,{name:'Tinker’s tools (Int)'}).automaticRank,2);assert.equal(C.setArtificerSource(d,'efa'),true);assert.equal(check(d,6,{name:'Tinker’s tools (Int)'}).automaticRank,1);assert.equal(check(d,6,{name:'Tinker’s tools (Int)'}).total,7);
 d.adobe.classLevels=[{classId:'wizard',level:14},{classId:'artificer',level:6}];d.build.classId='wizard';assert.equal(check(d,20,{name:'Tinker’s tools (Int)'}).total,10);assert.equal(check(d,14,{name:'Tinker’s tools (Int)'}).automaticRank,0);
 const manual={name:'Tinker’s tools (Int)',rank:2};assert.equal(check(d,14,manual).total,14);assert.equal(manual.rank,2);
});
test('legacy Bard generic checks gain rounded-down half proficiency; revised Bard keeps that benefit on skills only',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++){
  const d=build('bard',level,edition),r=M.derive(d,level),row=check(d,level,{name:'Unknown tool (Dex)'}),half=level>=2&&edition==='2014'?Math.floor(r.pb/2):0;assert.equal(row.total,3+half);
  assert.equal(check(d,level,{name:'Unknown tool (Dex)',rank:1}).total,3+r.pb);assert.equal(check(d,level,{name:'Unknown tool (Dex)',rank:2}).total,3+2*r.pb);
 }
});
test('legacy Champion physical checks round up, share skill/initiative math and never stack half bonuses with training',()=>{
 for(let level=1;level<=20;level++)for(const edition of ['2014','2024']){
  const d=build('fighter',level,edition,'champion'),r=M.derive(d,level),half=level>=7&&edition==='2014'?Math.ceil(r.pb/2):0;
  assert.equal(check(d,level,{name:'Physical check (Dex)'}).total,3+half);assert.equal(check(d,level,{name:'Mental check (Int)'}).total,4);assert.equal(r.skills.acrobatics,3+half);assert.equal(r.initiative,3+half);
  d.skills.acrobatics.rank=1;assert.equal(M.derive(d,level).skills.acrobatics,3+r.pb);
 }
 const d=build('fighter',7,'2014','champion');d.adobe.classLevels.push({classId:'bard',level:2});const r=M.derive(d,9);assert.equal(check(d,9,{name:'Physical check (Dex)'}).total,3+Math.ceil(r.pb/2));assert.equal(check(d,9,{name:'Mental check (Int)'}).total,4+Math.floor(r.pb/2));
});
test('capped or duplicate class rows do not grant delayed untrained-check features',()=>{
 const d=build('fighter',6,'2014','champion');d.adobe.classLevels.push({classId:'fighter',level:7,subclassId:'champion'});assert.equal(check(d,13,{name:'Check (Dex)'}).total,3);
 d.adobe.classLevels=[{classId:'wizard',level:10},{classId:'bard',level:2}];d.build.classId='wizard';assert.equal(check(d,10,{name:'Check (Dex)'}).total,3);
});
test('normalization and rejected edits retain the record atomically without changing other character state',()=>{
 assert.deepEqual(T.normalize(null),{name:'',rank:0,bonus:0});assert.equal(T.normalize({name:'x'.repeat(300),rank:99,bonus:-100}).name.length,200);assert.deepEqual(T.normalize({rank:99,bonus:-100}),{name:'',rank:2,bonus:-30});
 const raw={name:'Tool (Int)',rank:1,bonus:2},before=JSON.stringify(raw);for(const [key,value]of [['name','x'.repeat(201)],['ability','luck'],['proficient','yes'],['bonus',''],['bonus',31],['bonus',1.5],['constructor',true]]){assert.throws(()=>T.edit(raw,key,value));assert.equal(JSON.stringify(raw),before);}
 assert.deepEqual(T.normalize(JSON.parse(JSON.stringify(raw))),raw);
});


test('legacy Rogue tool expertise is inherited from its real class choice and stays independent of a manual check rank',()=>{
 const d=build('rogue',5),before=JSON.stringify(d);const r=M.derive(d,5);assert.equal(C.setExpertise(d,C.groupKey('2014','rogue','expertise'),0,'thieves-tools',{level:5,effects:r.effects,feats:r.feats}),true);const selected=JSON.stringify(d);assert.notEqual(selected,before);assert.equal(check(d,5,{name:'Thieves’ tools (Dex)',rank:0}).total,9);assert.equal(check(d,5,{name:'Thieves’ tools (Dex)',rank:2}).total,9);assert.equal(JSON.stringify(d),selected);d.adobe.classLevels=[{classId:'wizard',level:5}];d.build.classId='wizard';assert.equal(check(d,5,{name:'Thieves’ tools (Dex)',rank:0}).automaticRank,0);
});


test('armor, weapon and uncategorized proficiency text never grants a tool-check bonus',()=>{
 const d=build('fighter',5);for(const name of ['Heavy armor','Martial weapons','Shields']){const row=check(d,5,{name:name+' (Str)'});assert.equal(row.automaticRank,0);assert.equal(row.total,2);}
 d.proficiencies='Custom training; Thieves’ tools';assert.equal(check(d,5,{name:'Custom training (Dex)'}).automaticRank,0);assert.equal(check(d,5,{name:'Thieves’ tools (Dex)'}).automaticRank,1);assert.equal(check(d,5,{name:'Thieves’ tools (Dex)'}).total,6);
 const ctx={...M.derive(d,5),proficiencies:d.proficiencies,toolNames:require('../js/modules/character-rules').tools};assert.throws(()=>T.edit({name:'Thieves’ tools (Dex)'},'proficient',false,ctx));
});
