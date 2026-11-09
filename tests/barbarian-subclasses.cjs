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
test('Ancestral Guardian shield scales at 6/10/14 and Consult shares one short-rest pool',()=>{
 for(const [n,die]of [[6,'2d6'],[10,'3d6'],[14,'4d6'],[20,'4d6']]){const d=make('ancestral-guardian','2014',n),r=B.derive(d,{level:n});assert.equal(r.combat.find(f=>f.name==='Spirit Shield').dice,die);assert.equal(r.reports.some(f=>f.name==='Vengeful Ancestors'),n>=14);if(n>=10){assert.equal(C.changeClassResource(d,'barbarian-consult-spirits',1,{level:n}),true);assert.equal(C.changeClassResource(d,'barbarian-consult-spirits',1,{level:n}),false);C.resetClassResources(d,'short',{level:n});assert.equal(C.classResources(d,{level:n}).find(f=>f.id==='barbarian-consult-spirits').remaining,1);}}
});
test('Beast unlocks magical weapons, infection and hunt separately with character proficiency uses',()=>{
 for(const n of [3,6,9,10,13,14,20]){const d=make('beast','2014',n),r=B.derive(d,{level:n,mods:{con:3}});assert.equal(r.combat.find(f=>f.name==='Form of the Beast').magical,n>=6);assert.equal(r.resources.some(f=>f.id==='barbarian-infectious-fury'),n>=10);assert.equal(r.resources.some(f=>f.id==='barbarian-call-hunt'),n>=14);for(const pool of r.resources)assert.equal(pool.max,Math.ceil(n/4)+1);}
});
test('Wild Magic awareness and bolstering share neither uses nor recovery with Rage',()=>{
 const d=make('wild-magic-barbarian','2014',14),opts={level:14,mods:{con:3}},r=B.derive(d,opts);assert.equal(r.combat.find(f=>f.name==='Wild Surge').dc,16);assert.equal(r.resources.length,2);assert.ok(r.resources.every(f=>f.max===5));assert.equal(C.changeClassResource(d,'barbarian-magic-awareness',1,opts),true);assert.equal(C.classResources(d,opts).find(f=>f.id==='barbarian-bolstering-magic').used,0);C.resetClassResources(d,'short',opts);assert.equal(C.classResources(d,opts).find(f=>f.id==='barbarian-magic-awareness').used,1);C.resetClassResources(d,'long',opts);assert.equal(C.classResources(d,opts).find(f=>f.id==='barbarian-magic-awareness').used,0);
});
test('Giant reach, thrown damage and Cleaver dice scale from Barbarian rather than total level',()=>{
 for(const [n,reach,die]of [[3,5,null],[6,5,'1d6'],[13,5,'1d6'],[14,10,'2d6'],[20,10,'2d6']]){const r=B.derive(make('giant','2014',n),{level:n,mods:{str:4}});assert.equal(r.combat.find(f=>f.name==="Giant's Havoc").reachBonus,reach);assert.equal(r.combat.find(f=>f.name==='Elemental Cleaver')?.dice||null,die);assert.equal(r.combat.some(f=>f.name==='Mighty Impel'),n>=10);}
});
test('World Tree vitality and branches use the correct level and Strength DC; extended teleport is per Rage',()=>{
 for(const n of [3,6,10,14,20]){const r=B.derive(make('world-tree-2024','2024',n),{level:n,mods:{str:4}});assert.equal(r.combat.find(f=>f.name==='Vitality of the Tree').temporaryHP,n);if(n>=6)assert.equal(r.combat.find(f=>f.name==='Branches of the Tree').dc,12+Math.ceil(n/4)+1);assert.equal(r.resources.some(f=>f.resets.includes('rage')),n>=14);}
});
test('Battlerager temporary HP floor and revised Zealot healing pool follow exact breakpoints',()=>{
 assert.equal(B.derive(make('battlerager','2014',6),{level:6,mods:{con:-2}}).combat.find(f=>f.name==='Reckless Abandon').temporaryHP,1);
 for(const [n,dice]of [[3,4],[5,4],[6,5],[11,5],[12,6],[16,6],[17,7],[20,7]])assert.equal(B.derive(make('zealot-2024','2024',n),{level:n}).resources.find(f=>f.id==='barbarian-warrior-gods').max,dice);
});
test('Beast and armor-spike reference actions compute Strength, proficiency, Rage and source gating',()=>{
 const A=require('../js/modules/character-actions'),d=make('beast','2014',6);choose(d,'form-of-the-beast','tail');d.actions=[{kind:'weapon',ref:'barbarian-beast-tail'}];let r=M.derive(d,6);assert.equal(r.actions[0].hit,'+7');assert.equal(r.actions[0].damage,'1d8 +6 piercing');assert.equal(r.actions[0].range,'10 ft');assert.match(r.actions[0].notes.join(' '),/magical/);choose(d,'form-of-the-beast','claws');assert.equal(M.derive(d,6).actions[0].available,false);
 const b=make('battlerager','2014',3),stats=M.derive(b,3),attack=A.resolve({kind:'weapon',ref:'barbarian-armor-spikes'},b,3,stats);assert.equal(attack.damage,'1d4 +6 piercing');assert.match(attack.notes.join(' '),/spiked armor/);
});
test('Elemental Cleaver computes element, scaling, thrown range and Strength-only Rage damage',()=>{
 const d=make('giant','2014',14);choose(d,'cleaver-weapon','battleaxe');choose(d,'elemental-cleaver','cold');d.actions=[{kind:'weapon',ref:'barbarian-elemental-cleaver',mode:'thrown'}];let r=M.derive(d,14);assert.equal(r.actions[0].hit,'+9');assert.equal(r.actions[0].damage,'1d8 + 4 + 3 + 2d6 cold');assert.equal(r.actions[0].range,'20/60 ft');d.actions[0].mode='twoHanded';r=M.derive(d,14);assert.match(r.actions[0].damage,/1d10/);assert.equal(r.actions[0].range,'15 ft');
 choose(d,'cleaver-weapon','longbow');d.actions[0].mode='normal';r=M.derive(d,14);assert.equal(r.actions[0].ability,'dex');assert.ok(!r.actions[0].damage.includes(' + 3 + '));
});
test('Rage activation applies and removes conditional defenses without treating generic spending as activation',()=>{
 const d=make('berserker-2024','2024',6),opts={level:6};C.changeClassResource(d,'barbarian-rage',1,opts);assert.equal(M.derive(d,6).barbarianCombat.raging,false);B.enterRage(d,opts);let r=M.derive(d,6);assert.ok(r.effects.immunities.includes('Charmed'));assert.ok(r.effects.resistances.includes('Slashing'));assert.equal(B.endRage(d,opts),true);r=M.derive(d,6);assert.ok(!r.effects.immunities.includes('Charmed'));assert.ok(!r.effects.resistances.includes('Slashing'));
});
test('Totem and Wild Heart keep distinct resistances and temporary movement; rests end Rage',()=>{
 const d=make('totem-warrior','2014',14);choose(d,'totem-spirit','elk');choose(d,'totemic-attunement','eagle');const normal=M.derive(d,14).effects.speed;B.enterRage(d,{level:14});let r=M.derive(d,14);assert.equal(r.effects.speed,normal+15);assert.equal(r.effects.fly,normal+15);C.resetClassResources(d,'short',{level:14});assert.equal(M.derive(d,14).effects.speed,normal);
 const w=make('wild-heart-2024','2024',14);choose(w,'rage-of-the-wilds','bear');choose(w,'power-of-the-wilds','falcon');B.enterRage(w,{level:14});r=M.derive(w,14);assert.ok(r.effects.resistances.includes('Fire'));assert.ok(!r.effects.resistances.includes('Force'));assert.equal(r.effects.fly,r.effects.speed);const t=make('totem-warrior','2014',3);choose(t,'totem-spirit','bear');B.enterRage(t,{level:3});assert.ok(M.derive(t,3).effects.resistances.includes('Force'));
});
test('World Tree Rage grants temporary HP without stacking or changing current HP',()=>{
 const d=make('world-tree-2024','2024',10);d.hpCurrent=17;d.hpTemp=3;B.enterRage(d,{level:10});assert.equal(d.hpTemp,10);assert.equal(d.hpCurrent,17);B.endRage(d,{level:10});d.hpTemp=25;B.enterRage(d,{level:10});assert.equal(d.hpTemp,25);
});
test('revised Zealot divine form requires actual Rage, uses its own pool and ends its effects at 0 HP',()=>{
 const d=make('zealot-2024','2024',14);d.hpCurrent=20;assert.equal(B.activateDivineForm(d,{level:14}),false);B.enterRage(d,{level:14});assert.equal(B.activateDivineForm(d,{level:14}),true);let r=M.derive(d,14);assert.ok(r.effects.resistances.includes('Psychic'));assert.equal(r.effects.fly,r.effects.speed);assert.equal(B.activateDivineForm(d,{level:14}),false);d.hpCurrent=0;r=M.derive(d,14);assert.ok(!r.effects.resistances.includes('Psychic'));
});
test('first-hit resolution enforces active source, dice, Reckless/Strength conditions and turn recovery',()=>{
 const d=make('berserker-2024','2024',9),opts={level:9,diceTotal:12,strength:true,reckless:true};assert.equal(B.resolveHit(d,opts),null);B.enterRage(d,opts);assert.equal(B.resolveHit(d,{...opts,reckless:false}),null);assert.equal(B.resolveHit(d,{...opts,diceTotal:19}),null);assert.equal(B.resolveHit(d,opts).total,12);assert.equal(B.resolveHit(d,opts),null);C.resetClassResources(d,'turn',opts);assert.equal(B.resolveHit(d,opts).dice,'3d6');
});
test('divine form cannot return after damage to 0 HP and subsequent healing',()=>{
 let d=make('zealot-2024','2024',14);d.hpCurrent=20;B.enterRage(d,{level:14});B.activateDivineForm(d,{level:14});d=M.damage(d,20);d=M.heal(d,10,14);assert.ok(!M.derive(d,14).effects.resistances.includes('Psychic'));
});
test('Wild Surge AC applies only for active Rage and the selected table result',()=>{
 const d=make('wild-magic-barbarian','2014',6);choose(d,'wild-surge','6');const base=M.derive(d,6).ac;B.enterRage(d,{level:6});assert.equal(M.derive(d,6).ac,base+1);choose(d,'wild-surge','5');assert.equal(M.derive(d,6).ac,base);B.endRage(d,{level:6});assert.equal(M.derive(d,6).ac,base);
});
test('Heavy armor blocks revised Rage benefits while legacy Bear retains its explicit resistance',()=>{
 for(const [edition,id]of [['2014','totem-warrior'],['2024','wild-heart-2024']]){const d=make(id,edition,14);choose(d,edition==='2014'?'totem-spirit':'rage-of-the-wilds','bear');d.equipmentState={loadout:[{id:'plate',equipped:true}]};const loot=[{id:'plate',quantity:1,item:{name:'Plate'}}];B.enterRage(d,{level:14});const r=M.derive(d,14,loot);assert.equal(r.effects.resistances.includes('Fire'),edition==='2014');assert.equal(r.barbarianCombat.requested,true);}
});
test('Giant active size changes carrying limits without stacking and returns to normal after Rage',()=>{
 const d=make('giant','2014',14);choose(d,'giant-size','huge');const before=M.derive(d,14);B.enterRage(d,{level:14});const raging=M.derive(d,14);assert.equal(raging.effects.size,'Huge');assert.equal(raging.carrying.capacity,before.carrying.capacity*4);assert.equal(M.derive(d,14).carrying.capacity,raging.carrying.capacity);B.endRage(d,{level:14});assert.equal(M.derive(d,14).carrying.capacity,before.carrying.capacity);
});
test('owned Giant infusion retains current bonuses and becomes unavailable after inventory removal',()=>{
 const d=make('giant','2014',14);choose(d,'cleaver-weapon','battleaxe');choose(d,'elemental-cleaver','cold');d.actions=[{kind:'weapon',ref:'barbarian-cleaver-owned:axe',mode:'thrown'}];d.equipmentState={loadout:[{id:'axe',equipped:true}]};const loot=[{id:'axe',quantity:1,item:{name:'Battleaxe +1'}}];let r=M.derive(d,14,loot);assert.equal(r.actions[0].hit,'+10');assert.match(r.actions[0].damage,/1d8 \+ 5 \+ 3 \+ 2d6 cold/);assert.equal(M.derive(d,14,[]).actions[0].available,false);assert.equal(r.actions[0].range,'20/60 ft');
});
