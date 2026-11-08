'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-class-feature-choices'),B=require('../js/modules/character-bard-subclasses'),S=require('../js/modules/character-spellcasting');
const make=(id,edition='2014',level=20)=>{const d=M.normalize({build:{classId:'bard',edition},abilities:{str:10,dex:16,cha:18,con:12}});d.adobe={classLevels:[{classId:'bard',subclassId:id,level}],classFeatureChoices:{}};return d;};
const choose=(d,id,value,index=0)=>assert.equal(C.set(d,d.adobe.classLevels[0],id,index,value),true);
test('all fourteen colleges enforce every feature level, edition and actual Bard level through 20',()=>{
 for(const [edition,ids]of Object.entries(B.ids))for(const id of ids){const d=make(id,edition);assert.ok(B.derive(d,{level:20}).reports.length>=3,id);for(let n=1;n<=20;n++){d.adobe.classLevels[0].level=n;const r=B.derive(d,{level:n});assert.equal(r.active,n>=3,id);assert.ok(r.reports.every(f=>f.level<=n),id);}d.build.edition=edition==='2014'?'2024':'2014';assert.equal(B.derive(d,{level:20}).active,false,id);}
});
test('Lore skill grants and magical choices use the existing Builder and separate spell allowance',()=>{
 for(const [edition,id]of [['2014','lore'],['2024','lore-2024']]){const d=make(id,edition,6);choose(d,'bonus-skills','arcana');choose(d,'bonus-skills','animal-handling',1);assert.ok(M.derive(d,6).effects.skills.includes('arcana'));assert.ok(M.derive(d,6).effects.skills.includes('animalHandling'));const g=C.groups(d.adobe.classLevels[0],edition,d).find(g=>g.id==='magical-secrets');assert.ok(g.options.length>0);choose(d,'magical-secrets',g.options[0].id);const p=S.profiles(d,6).find(p=>p.classId==='bard'),grants=S.automaticGrants(p);assert.ok(grants.length>0);assert.equal(S.selectionCounts(p,grants.map(s=>({catalogId:s.id,level:s.level}))).automatic,grants.length);}
});
test('Cutting Words and revised Peerless Skill spend one shared Inspiration pool and refund failures',()=>{
 const d=make('lore-2024','2024',14),opts={level:14,mods:{cha:4},roll:5};assert.equal(B.use(d,'cutting-words',opts).modifier,-5);assert.equal(C.classResources(d,opts).find(r=>r.id==='bard-inspiration').used,1);assert.equal(B.use(d,'peerless-skill',{...opts,success:false}).spent,0);assert.equal(B.use(d,'peerless-skill',{...opts,success:true}).spent,1);assert.equal(C.classResources(d,opts).find(r=>r.id==='bard-inspiration').used,2);const before=JSON.stringify(d);assert.equal(B.use(d,'peerless-skill',{...opts,roll:99}),null);assert.equal(JSON.stringify(d),before);
});
test('Swords defensive flourish applies temporary AC and one-flourish-per-turn with the level-14 free die',()=>{
 const d=make('swords','2014',14),opts={level:14,mods:{cha:4},roll:6,master:true},base=M.derive(d,14).ac;assert.equal(B.use(d,'defensive-flourish',opts).spent,0);assert.equal(M.derive(d,14).ac,base+6);assert.equal(B.use(d,'mobile-flourish',opts),null);C.resetClassResources(d,'turn',opts);assert.equal(M.derive(d,14).ac,base);assert.equal(B.use(d,'mobile-flourish',opts).push,11);choose(d,'fighting-style','dueling');assert.ok(C.styles(d,14).some(s=>s.id==='dueling'));
});
test('Whispers Psychic Blades, Glamour mantle and Creation value/size scale at their own levels',()=>{
 for(const [n,dice]of [[3,2],[5,3],[10,5],[15,8],[20,8]]){const d=make('whispers','2014',n);assert.equal(B.derive(d,{level:n}).actions.find(a=>a.id==='psychic-blades').damageDice,dice);}
 for(const [n,hp]of [[3,5],[5,8],[10,11],[15,14]])assert.equal(B.derive(make('glamour','2014',n),{level:n}).actions.find(a=>a.id==='mantle-inspiration').temporaryHP,hp);
 assert.match(B.derive(make('creation','2014',6),{level:6}).resources[0].description,/120 gp/);assert.match(B.derive(make('creation','2014',14),{level:14}).resources[0].description,/no value cap/);
});
test('Dance AC and unarmed damage require no armor or shield and use Bard rather than character scaling',()=>{
 const d=make('dance-2024','2024',5);d.actions=[{kind:'unarmed'}];let r=M.derive(d,5);assert.equal(r.ac,17);assert.match(r.actions[0].damage,/1d8 \+ 3/);assert.equal(r.actions[0].ability,'dex');d.equipmentState={loadout:[{id:'shield',equipped:true}]};const loot=[{id:'shield',quantity:1,item:{name:'Shield'}}];r=M.derive(d,5,loot);assert.equal(r.bardCombat.dance,false);assert.ok(!r.actions[0].damage.includes('1d8'));d.adobe.classLevels=[{classId:'fighter',level:15},{classId:'bard',subclassId:'dance-2024',level:5}];r=M.derive(d,20);assert.equal(r.bardCombat.die,8);
});
test('Eloquence exposes correct check floors and an independent Infectious Inspiration pool',()=>{
 const d=make('eloquence','2014',14),r=M.derive(d,14);assert.equal(r.bardCombat.minimumChecks.persuasion,10+r.skills.persuasion);const pools=C.classResources(d,{level:14,mods:{cha:4}});assert.equal(pools.find(r=>r.id==='bard-infectious-inspiration').max,4);C.changeClassResource(d,'bard-infectious-inspiration',1,{level:14,mods:{cha:4}});assert.equal(C.classResources(d,{level:14,mods:{cha:4}}).find(r=>r.id==='bard-inspiration').used,0);
});
test('Moon and both Spirits editions supply exact grants and distinct spirit tables',()=>{
 const moon=make('college-of-the-moon-frhof','2024',6),r=M.derive(moon,6);assert.ok(r.effects.languages.includes('Druidic'));assert.ok(S.profiles(moon,6).find(p=>p.classId==='bard').subclassSpellGrants.some(s=>s.name==='Moonbeam'));
 for(const [edition,id]of [['2014','spirits'],['2024','spirits-rthw']]){const d=make(id,edition,14),opts={level:14,mods:{cha:4},roll:1};assert.equal(B.use(d,'channel-spirit',opts).spent,1);const held=B.derive(d,opts).channeledSpirit;assert.equal(held.name,edition==='2014'?'Clever Animal':'Beloved');assert.equal(B.releaseSpirit(d,opts).value,1);assert.equal(B.releaseSpirit(d,opts),null);assert.ok(B.derive(d,opts).spells.some(s=>s.name==='Guidance'&&s.range==='60 feet'));}
});
test('revised Glamour restores Beguiling Magic from Inspiration and Majesty from a valid slot atomically',()=>{
 const d=make('glamour-2024','2024',6);d.build.autoSlots=true;const opts={level:6,mods:{cha:4}};C.changeClassResource(d,'bard-beguiling-magic',1,opts);assert.equal(B.pay(d,'bard-beguiling-magic','inspiration',opts),true);assert.equal(C.classResources(d,opts).find(r=>r.id==='bard-inspiration').used,1);C.changeClassResource(d,'bard-mantle-majesty',1,opts);assert.equal(B.pay(d,'bard-mantle-majesty','slot-0',opts),false);assert.equal(B.pay(d,'bard-mantle-majesty','slot-2',opts),true);assert.equal(d.slots[2].used,1);assert.equal(B.pay(d,'bard-mantle-majesty','slot-2',opts),false);
});
test('multiclass caps and duplicate class rows cannot activate delayed colleges',()=>{
 const d=make('creation');d.adobe.classLevels=[{classId:'fighter',level:18},{classId:'bard',subclassId:'creation',level:20}];assert.equal(B.derive(d,{level:20}).active,false);d.adobe.classLevels=[{classId:'bard',subclassId:'creation',level:2},{classId:'bard',subclassId:'creation',level:18}];assert.equal(B.derive(d,{level:20}).active,false);
});
