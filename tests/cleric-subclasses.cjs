'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),D=require('../js/modules/character-cleric-subclasses'),S=require('../js/modules/character-spellcasting');
const make=(id,edition='2014',level=20)=>{const d=M.normalize({build:{classId:'cleric',edition},abilities:{wis:18,str:16,con:14}});d.adobe={classLevels:[{classId:'cleric',subclassId:id,level}],classFeatureChoices:{}};return d;};
const choose=(d,id,value,index=0)=>assert.equal(C.set(d,d.adobe.classLevels[0],id,index,value),true);
test('all twenty domains enforce edition and class levels for reports, pools and grants',()=>{
 for(const [edition,ids]of Object.entries(D.ids))for(const id of ids){const d=make(id,edition);for(let n=1;n<=20;n++){d.adobe.classLevels[0].level=n;const r=D.derive(d,{level:n});assert.equal(r.active,n>=(edition==='2024'?3:1),id);assert.ok(r.reports.every(f=>f.level<=n),id);assert.ok(r.spells.every(s=>s.edition===edition),id);}d.build.edition=edition==='2014'?'2024':'2014';assert.equal(D.derive(d,{level:20}).active,false,id);}
});
test('every newly supported domain Channel Divinity effect spends the existing class/shared pool',()=>{
 for(const [edition,ids]of Object.entries(D.ids))for(const id of ids){const d=make(id,edition),opts={level:20,mods:{wis:4}},effects=D.derive(d,opts).channels;if(!effects.length)continue;const row=C.classResources(d,opts).find(r=>r.channelEffects);assert.ok(!row.channelEffects.some(f=>f.id==='cleric-subclass'),id);for(const effect of effects){assert.ok(row.channelEffects.some(f=>f.id===effect.id),id);assert.equal(C.useChannelDivinity(d,row.id,effect.id,opts),true);C.resetClassResources(d,'long',opts);}}
});
test('Death damage and Arcana banishment scale by Cleric level and remain specific',()=>{
 const d=make('death-domain','2014',6);assert.match(D.derive(d,{level:6}).channels[0].detail,/17 Necrotic/);for(const [n,cr]of [[5,'0.5'],[8,'1'],[11,'2'],[14,'3'],[17,'4']])assert.match(D.derive(make('arcana-domain','2014',n),{level:n}).channels[0].detail,new RegExp('CR '+cr));d.adobe.classLevels=[{classId:'fighter',level:18},{classId:'cleric',subclassId:'death-domain',level:20}];assert.match(D.derive(d,{level:20}).channels[0].detail,/9 Necrotic/);
});
test('Forge grants physical training, resistance, Heavy-armor AC and late immunity without stacking',()=>{
 const d=make('forge-domain','2014',17),loot=[{id:'plate',quantity:1,item:{name:'Plate'}}];d.equipmentState={loadout:[{id:'plate',equipped:true}]};let r=M.derive(d,17,loot);assert.ok(r.effects.proficiencies.includes('Smith’s tools'));assert.ok(r.effects.immunities.includes('Fire'));assert.equal(r.ac,19);assert.equal(M.derive(d,17,loot).ac,19);d.equipmentState.loadout[0].equipped=false;r=M.derive(d,17,loot);assert.equal(r.clericCombat.forgeHeavyArmor,false);
});
test('revised Light, War and Grave resource recovery and effects remain distinct from legacy',()=>{
 const light=make('light-domain-2024','2024',6),opts={level:6,mods:{wis:4}};assert.equal(C.changeClassResource(light,'cleric-warding-flare-2024',1,opts),true);C.resetClassResources(light,'short',opts);assert.equal(C.classResources(light,opts).find(r=>r.id==='cleric-warding-flare-2024').used,0);
 const war=make('war-domain-2024','2024',17);assert.ok(M.derive(war,17).effects.resistances.includes('Slashing'));assert.match(D.derive(make('grave-domain-rthw','2024',6),opts).resources[0].description,/halve/);assert.match(D.derive(make('grave-domain','2014',6),opts).resources.find(r=>r.id==='cleric-sentinel-death-door').description,/normal hit/);
});
test('Knowledge grants real Expertise and revised alternative saving throws without granting every option',()=>{
 const d=make('knowledge-domain-frhof','2024',6);choose(d,'knowledge-skills','arcana');choose(d,'knowledge-skills','history',1);let r=M.derive(d,6);assert.equal(r.skills.arcana,r.mods.int+2*r.pb);assert.ok(r.effects.saves.includes('int'));d.saves.int.proficient=true;choose(d,'unfettered-save','dex');r=M.derive(d,6);assert.ok(r.effects.saves.includes('dex'));assert.ok(!r.effects.saves.includes('str'));
});
test('Twilight senses and Peace bonds use actual scope and character proficiency',()=>{
 const d=make('twilight-domain','2014',6),r=M.derive(d,6);assert.equal(r.effects.darkvision,300);assert.equal(r.classResources.find(r=>r.id==='cleric-steps-night').max,r.pb);const p=make('peace-domain','2014',1);p.adobe.classLevels=[{classId:'fighter',level:19},{classId:'cleric',subclassId:'peace-domain',level:1}];assert.equal(D.derive(p,{level:20}).resources[0].max,6);assert.match(D.derive(p,{level:20}).resources[0].description,/30 ft of another/);
});
test('all fixed Cleric spells come from pinned name/level metadata and grants deactivate with source',()=>{
 for(const [edition,ids]of Object.entries(D.ids))for(const id of ids){const d=make(id,edition,9),p=S.profiles(d,9).find(p=>p.classId==='cleric');assert.ok(S.automaticGrants(p).length>=8,id);d.build.edition=edition==='2014'?'2024':'2014';assert.equal(S.automaticGrants(S.profiles(d,9).find(p=>p.classId==='cleric')).length,0,id);}
 const l=make('light-domain','2014',1);assert.ok(D.derive(l,{level:1}).spells.some(s=>s.name==='Light'));assert.ok(!M.derive(make('light-domain','2014',17),17).effects.traits.join(' ').includes('vulnerability to Fire'));
});
test('legacy optional Blessed Strikes replaces the original damage feature instead of stacking Wisdom',()=>{
 const d=make('arcana-domain','2014',8);assert.equal(D.derive(d,{level:8}).potent,true);choose(d,'legacy-blessing','blessed-strikes');assert.equal(D.derive(d,{level:8}).potent,false);assert.ok(M.derive(d,8).effects.traits.some(t=>t.startsWith('Blessed Strikes')));
});
test('Twilight activation checks lighting and resource availability, then expires without granting permanent flight',()=>{
 const d=make('twilight-domain','2014',6),opts={level:6,mods:{wis:4}};assert.equal(D.activateFlight(d,opts),false);assert.equal(D.activateFlight(d,{...opts,dimLight:true}),true);let r=M.derive(d,6);assert.equal(r.effects.fly,r.effects.speed);assert.equal(D.activateFlight(d,{...opts,dimLight:true}),false);assert.equal(D.endFlight(d,opts),true);assert.equal(M.derive(d,6).effects.fly||0,0);assert.equal(C.classResources(d,opts).find(r=>r.id==='cleric-steps-night').used,1);
});
test('Forge blessing cannot stack on magic gear, follows ownership and clears on the next Long Rest',()=>{
 const d=make('forge-domain','2014',6),opts={level:6},loot=[{id:'axe',quantity:1,item:{name:'Battleaxe'}},{id:'magic',quantity:1,item:{name:'Battleaxe +1'}}];d.equipmentState={loadout:[{id:'axe',equipped:true}]};d.actions=[{kind:'loot',ref:'axe'}];assert.equal(D.bless(d,'magic',{...opts,loot}),false);assert.equal(D.bless(d,'axe',{...opts,loot}),true);let r=M.derive(d,6,loot);assert.equal(r.clericCombat.forgeWeapon,'axe');assert.equal(r.actions[0].hit,'+4');assert.match(r.actions[0].damage,/\+ 1/);assert.equal(D.bless(d,'axe',{...opts,loot}),false);assert.equal(M.derive(d,6,[]).clericCombat.forgeWeapon,'');C.resetClassResources(d,'long',opts);assert.equal(M.derive(d,6,loot).clericCombat.forgeWeapon,'');
});
test('fixed spell-reference records contain only bounded names, levels and grant kinds',()=>{
 const data=require('../js/modules/character-subclass-spell-data');assert.equal(Object.keys(data).length,186);for(const row of Object.values(data))for(const grant of row.grants){assert.ok(Object.keys(grant).every(k=>['kind','level','name','group'].includes(k)));if(grant.group)assert.ok(grant.group.length<150);assert.ok(grant.level>=1&&grant.level<=20);assert.ok(grant.name.length<150);assert.ok(!grant.name.includes('#'));assert.ok(['known','prepared'].includes(grant.kind));}
});
test('Arcana granted Wizard cantrips use Cleric Wisdom and Potent Spellcasting without needing a duplicate spell row',()=>{
 const d=make('arcana-domain','2014',8),g=C.groups(d.adobe.classLevels[0],'2014',d).find(g=>g.id==='arcane-cantrips'),bolt=g.options.find(o=>o.name==='Fire Bolt');choose(d,'arcane-cantrips',bolt.id);const r=M.derive(d,8),Access=require('../js/modules/character-attack-access'),A=require('../js/modules/character-actions'),catalog=require('../data/rules/catalog.json').spells,grant=Access.spells(d,8,r,{catalogue:catalog}).find(s=>s.kind==='granted-spell'&&s.spell.name==='Fire Bolt');assert.ok(grant);const attack=A.resolve({kind:'granted-spell',ref:grant.ref},d,8,r,[],catalog);assert.equal(attack.ability,'wis');assert.match(attack.damage,/\+ 4/);
});
