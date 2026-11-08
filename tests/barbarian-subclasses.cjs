'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/modules/character-class-feature-choices'),B=require('../js/modules/character-barbarian-subclasses'),M=require('../js/modules/character-sheet-model');
const make=(id,edition='2014',level=20)=>{const d=M.normalize({build:{classId:'barbarian',edition},abilities:{str:18,con:16,cha:12}});d.adobe={classLevels:[{classId:'barbarian',subclassId:id,level}],classFeatureChoices:{}};return d;};
const choose=(d,name,value)=>{const e=d.adobe.classLevels[0];assert.equal(C.set(d,e,name,0,value),true);};
test('all thirteen paths have concrete reports gated by actual class level, edition and subclass',()=>{
 for(const [edition,ids]of Object.entries(B.ids))for(const id of ids){const d=make(id,edition);assert.ok(B.derive(d,{level:20}).reports.length>=4,id);for(let n=1;n<=20;n++){d.adobe.classLevels[0].level=n;const r=B.derive(d,{level:n});assert.equal(r.active,n>=3,id);assert.ok(r.reports.every(f=>f.level<=n),id);assert.ok(r.resources.every(f=>f.level===n),id);}d.build.edition=edition==='2014'?'2024':'2014';assert.equal(B.derive(d,{level:20}).active,false,id);}
});
test('revised Berserker scales Frenzy and keeps conditional damage and immunity off permanent bonuses',()=>{
 for(const [n,die]of [[3,'2d6'],[9,'3d6'],[16,'4d6'],[20,'4d6']]){const d=make('berserker-2024','2024',n),r=M.derive(d,n);assert.equal(r.barbarianSubclass.combat[0].dice,die);assert.equal(r.effects.immunities?.includes('Frightened')||false,false);assert.equal(r.barbarianSubclass.reports.some(x=>x.name==='Retaliation'),n>=10);assert.equal(r.classResources.some(x=>x.id==='barbarian-intimidating-presence'),n>=14);}
});
test('Storm Herald applies permanent resistance and swim while aura effects scale through 20',()=>{
 const d=make('storm-herald');choose(d,'environment','sea');let r=M.derive(d,20);assert.ok(r.effects.resistances.includes('Lightning'));assert.equal(r.effects.swim,30);assert.equal(r.barbarianSubclass.combat[0].dice,'4d6');choose(d,'environment','desert');r=M.derive(d,20);assert.ok(r.effects.resistances.includes('Fire'));assert.ok(!r.effects.resistances.includes('Lightning'));assert.equal(r.barbarianSubclass.combat[0].amount,6);d.adobe.classLevels[0].level=5;assert.ok(!M.derive(d,5).effects.resistances.includes('Fire'));
});
test('rest choices supply final walking-derived speeds, senses, skills and carrying limits',()=>{
 const d=make('wild-heart-2024','2024');choose(d,'aspect-of-the-wilds','panther');assert.equal(M.derive(d,20).effects.climb,M.derive(d,20).effects.speed);choose(d,'aspect-of-the-wilds','owl');assert.ok(M.derive(d,20).effects.darkvision>=60);
 const t=make('totem-warrior');const base=M.derive(t,20).carrying;choose(t,'aspect-of-the-beast','bear');assert.equal(M.derive(t,20).carrying.capacity,base.capacity*2);choose(t,'aspect-of-the-beast','tiger');choose(t,'tiger-skills','athletics');assert.ok(M.derive(t,20).effects.skills.includes('athletics'));
});
test('shared subclass resources spend, reject excess, recover independently, and restore per Rage only on explicit entry',()=>{
 const d=make('zealot-2024','2024',14),opts={level:14,mods:{con:3}};let rows=C.classResources(d,opts);assert.equal(rows.find(x=>x.id==='barbarian-warrior-gods').max,6);
 assert.equal(C.changeClassResource(d,'barbarian-fanatical-focus',1,opts),true);assert.equal(C.changeClassResource(d,'barbarian-fanatical-focus',1,opts),false);C.resetClassResources(d,'short',opts);assert.equal(C.classResources(d,opts).find(x=>x.id==='barbarian-fanatical-focus').remaining,0);
 assert.equal(B.enterRage(d,opts),true);rows=C.classResources(d,opts);assert.equal(rows.find(x=>x.id==='barbarian-rage').used,1);assert.equal(rows.find(x=>x.id==='barbarian-fanatical-focus').used,0);
 assert.equal(C.changeClassResource(d,'barbarian-zealous-presence',1,opts),true);assert.equal(B.recharge(d,'barbarian-zealous-presence',opts),true);assert.equal(C.classResources(d,opts).find(x=>x.id==='barbarian-rage').used,2);assert.equal(B.recharge(d,'barbarian-zealous-presence',opts),false);
 C.changeClassResource(d,'barbarian-warrior-gods',3,opts);C.resetClassResources(d,'long',opts);assert.ok(C.classResources(d,opts).filter(x=>x.id.startsWith('barbarian-')).every(x=>x.used===0));
});
test('multiclass uses character proficiency but Barbarian feature levels and rejects duplicate/class-overflow grants',()=>{
 const d=make('beast','2014',10);d.adobe.classLevels=[{classId:'fighter',level:10},{classId:'barbarian',subclassId:'beast',level:10}];let r=B.derive(d,{level:20,mods:{con:3}});assert.equal(r.resources.find(x=>x.id==='barbarian-infectious-fury').max,6);assert.equal(r.resources.find(x=>x.id==='barbarian-infectious-fury').dc,17);assert.equal(B.derive(d,{level:12}).active,false);
 d.adobe.classLevels=[{classId:'barbarian',subclassId:'beast',level:2},{classId:'barbarian',subclassId:'beast',level:18}];assert.equal(B.derive(d,{level:20}).active,false);
});
test('source-reviewed spell grants preserve casting restrictions and source scope',()=>{
 const d=make('ancestral-guardian','2014',10),r=B.derive(d,{level:10});assert.deepEqual(r.spells.map(s=>s.name),['Augury','Clairvoyance']);assert.ok(r.spells.every(s=>s.ability==='wis'&&s.casting==='Consult the Spirits'));
 const t=make('wild-heart-2024','2024',10);assert.ok(B.derive(t,{level:10}).spells.every(s=>s.casting==='ritual only'&&s.ability==='wis'));
});
test('Barbarian ritual and feature grants enter spell selection without prepared allowance or spell slots',()=>{
 const S=require('../js/modules/character-spellcasting'),d=make('wild-heart-2024','2024',10),catalogue=[['Beast Sense',2],['Speak with Animals',1],['Commune with Nature',5]].map(([name,level],i)=>({id:'test'+i,name,level,edition:'2024'}));
 const profiles=S.profiles(d,10),p=profiles.find(p=>p.classId==='barbarian');assert.ok(p);assert.equal(p.spellCount,0);assert.equal(p.ability,'wis');const grants=S.automaticGrants(p,catalogue);assert.equal(grants.length,3);assert.ok(grants.every(g=>g.ritual&&g.castingRestriction==='ritual only'));assert.equal(S.selectionState(p,grants.map(g=>({catalogId:g.id,level:g.level,prepared:true})),catalogue).error,'');assert.deepEqual(S.classEntries(d,10),[]);
 const g=make('giant','2014',3);choose(g,'giant-cantrip','thaumaturgy');assert.equal(S.profiles(g,3).find(p=>p.classId==='barbarian').subclassSpellGrants[0].name,'thaumaturgy');
});
test('Giant grants Giant or one selected replacement only when Giant is already known',()=>{
 const d=make('giant','2014',3);choose(d,'giant-language','draconic');assert.ok(M.derive(d,3).effects.languages.includes('Giant'));assert.ok(!M.derive(d,3).effects.languages.includes('Draconic'));
 d.languages='Giant';assert.ok(M.derive(d,3).effects.languages.includes('Draconic'));d.adobe.classLevels[0].level=2;assert.ok(!M.derive(d,2).effects.languages.includes('Draconic'));
});
