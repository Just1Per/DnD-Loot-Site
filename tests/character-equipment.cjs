const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),E=require('../js/modules/character-equipment'),F=require('../js/modules/character-feat-rules');
const loot=(id,name,mechanics,extra={})=>({id,itemId:id,quantity:1,item:{name,...(mechanics?{mechanics:E.normalize(mechanics)}:{}),...extra}});
const make=(entries,raw={})=>M.normalize({...raw,build:{edition:'2024',classId:'fighter',...raw.build},equipmentState:{acMode:'equipment',loadout:entries.map(e=>({id:e.id,equipped:true})),...raw.equipmentState}});
test('loot never mutates manual attacks and removing/consuming loot removes effects',()=>{
 const l=[loot('w','Longsword +1'),loot('r','Ward',{kind:'accessory',acBonus:1})],d=make(l,{abilities:{str:18,dex:14},attacks:[{name:'Unarmed'}]});
 const x=M.derive(d,5,l);assert.equal(x.gear.attacks[0].attack,8);assert.equal(x.gear.attacks[0].damage,'1d8 + 5 slashing');assert.equal(x.ac,13);assert.equal(d.attacks.length,1);
 assert.equal(M.derive(d,5,[]).ac,12);assert.equal(M.derive(d,5,[{...l[1],quantity:0}]).ac,12);assert.equal(M.derive(d,5,l).ac,13);
});
test('carried items give no AC, quantities and duplicate entries cannot multiply bonuses',()=>{
 const l=[loot('r','Ward',{kind:'accessory',acBonus:1})],d=make(l);d.equipmentState.loadout[0].equipped=false;assert.equal(M.derive(d,1,l).ac,10);d.equipmentState.loadout[0].equipped=true;
 assert.equal(M.derive(d,1,[{...l[0],quantity:50},l[0]]).ac,11);
 const copy=loot('r2','Ward',{kind:'accessory',acBonus:1});d.equipmentState.loadout.push({id:'r2',equipped:true});assert.equal(M.derive(d,1,[...l,copy]).ac,11);
});
test('armor, negative Dexterity and a magic shield use distinct AC formulas',()=>{
 const l=[loot('a','Half Plate +1'),loot('s','Shield +1'),loot('r','Ward',{kind:'accessory',acBonus:1})];
 assert.equal(M.derive(make(l,{abilities:{dex:20}}),5,l).ac,22);
 assert.equal(M.derive(make(l,{abilities:{dex:8}}),5,l).ac,19);
 l[0]=loot('a','Plate +1');assert.equal(M.derive(make(l,{abilities:{dex:8}}),5,l).ac,23);
});
test('untrained 2024 shield grants no AC; 2014 retains AC with penalty warning',()=>{
 const l=[loot('s','Shield +1')];for(const [edition,ac] of [['2024',10],['2014',13]]){const d=make(l,{build:{edition,classId:'wizard'}}),r=M.derive(d,5,l);assert.equal(r.ac,ac);assert.match(r.gear.warnings.join(' '),/training/);}
});
test('attunement gates magic only and caps at three owned items',()=>{
 const l=[loot('w','Longsword',{kind:'weapon',base:'longsword',attackBonus:2,damageBonus:2},{attunement:true}),...['a','b','c','d'].map(id=>loot(id,id,{kind:'accessory',acBonus:1},{attunement:true}))],d=make(l,{abilities:{str:16}});
 assert.equal(M.derive(d,5,l).gear.attacks[0].attack,6);assert.equal(M.derive(d,5,l).ac,10);
 for(const c of d.equipmentState.loadout)c.attuned=true;
 const r=M.derive(d,5,l);assert.equal(r.gear.attacks[0].attack,8);assert.equal(r.ac,12);assert.match(r.gear.warnings.join(' '),/three/);
});
test('finesse, thrown, versatile and Light extra attacks choose correct modifiers',()=>{
 const l=[loot('d','Dagger'),loot('j','Javelin'),loot('l','Longsword')],d=make(l,{abilities:{str:12,dex:18}});
 d.equipmentState.loadout[0].mode='thrown';d.equipmentState.loadout[1].mode='thrown';d.equipmentState.loadout[2].mode='twoHanded';const r=M.derive(d,5,l);
 assert.equal(r.gear.attacks[0].ability,'dex');assert.equal(r.gear.attacks[0].range,'20/60');assert.equal(r.gear.attacks[1].attack,4);assert.equal(r.gear.attacks[2].damage,'1d10 + 1 slashing');
 d.equipmentState.loadout[0].mode='offhand';assert.equal(M.derive(d,5,l).gear.attacks[0].damage,'1d4 piercing');
 d.abilities.str=8;d.abilities.dex=8;assert.equal(M.derive(d,5,l).gear.attacks[0].damage,'1d4 − 1 piercing');
});
test('2024 rogue training and explicit override do not grant proficiency to every weapon',()=>{
 const l=[loot('r','Rapier'),loot('g','Greatsword')],d=make(l,{build:{classId:'rogue'},abilities:{str:16}});let r=M.derive(d,5,l);assert.equal(r.gear.attacks[0].proficient,true);assert.equal(r.gear.attacks[1].proficient,false);
 d.equipmentState.loadout[1].proficiency='yes';d.equipmentState.loadout[1].ability='cha';d.abilities.cha=18;r=M.derive(d,5,l);assert.equal(r.gear.attacks[1].attack,7);
});
test('edition-specific Trident, Lance, War Pick and Net are not silently conflated',()=>{
 for(const [base,oldDamage,newDamage] of [['trident','1d6','1d8'],['lance','1d12','1d10']]){const m=E.normalize({kind:'weapon',base});assert.equal(E.profile(m,'2014').damage,oldDamage);assert.equal(E.profile(m,'2024').damage,newDamage);}
 assert.equal(E.profile(E.normalize({kind:'weapon',base:'war-pick'}),'2014').versatile,'');
 const l=[loot('n','Net')];assert.equal(M.derive(make(l),5,l).gear.attacks[0].attack,null);assert.equal(M.derive(make(l,{build:{edition:'2014'}}),5,l).gear.attacks[0].attack,3);
});
test('legacy manual AC is ignored; automatic Defense uses armor, never shield alone',()=>{
 const def=Object.entries(F.definitions).find(([,v])=>v.name==='Defense'&&v.source==='XPHB')[0];
 const l=[loot('s','Shield'),loot('a','Leather')],d=make(l,{ac:17,rulesChoices:{feats:[def],effects:{[def]:{confirmed:true,armored:false}}}});
 assert.equal(M.derive(d,5,l).gear.defense,1);d.equipmentState.loadout[1].equipped=false;assert.equal(M.derive(d,5,l).gear.defense,0);
 const old=M.normalize({ac:18,abilities:{dex:12},equipmentState:{acMode:'manual',acAdjustment:20}});
 assert.equal(old.equipmentState.acMode,'equipment');assert.equal(old.equipmentState.acAdjustment,0);assert.equal(M.derive(old,5,[]).ac,11);
});
test('unknown descriptions never fabricate AC bonuses or weapon mechanics',()=>{
 assert.equal(E.infer({name:'Dragon ring',description:'AC +1 when the moon shines'}).acBonus,0);
 assert.equal(E.infer({name:'Longsword +1',mechanics:{kind:'none'}}).kind,'none');
 const d=make([]);assert.deepEqual(M.normalize(d),d);
});

test('automatic unarmored formulas cover Barbarian Monk and Draconic Sorcerer',()=>{
 const stats={mods:{str:0,dex:2,con:3,int:0,wis:4,cha:4},scores:{str:10,dex:14,con:16,int:10,wis:18,cha:18},effects:{proficiencies:[]},feats:{acBonus:0,reports:[],rangedBonus:0},pb:3};
 const data=(classLevels,edition='2014')=>({build:{edition,classId:classLevels[0].classId},equipmentState:{acMode:'equipment',loadout:[]},rulesChoices:{grants:{__adobe:{data:{classLevels}}}}});
 assert.equal(E.derive(data([{classId:'barbarian',level:5}]),stats,[]).ac,15);
 assert.equal(E.derive(data([{classId:'monk',level:5}]),stats,[]).ac,16);
 assert.equal(E.derive(data([{classId:'sorcerer',level:5,subclassId:'draconic-bloodline'}]),stats,[]).ac,15);
 assert.equal(E.derive(data([{classId:'sorcerer',level:5,subclassId:'draconic-bloodline'}],'2024'),stats,[]).ac,16);
});

test('multiclass Unarmored Defense keeps legacy first-granting and revised best-formula rules distinct',()=>{
 const stats={mods:{str:0,dex:2,con:1,int:0,wis:4,cha:0},scores:{str:10,dex:14,con:12,int:10,wis:18,cha:10},effects:{proficiencies:['shields']},feats:{acBonus:0,reports:[],rangedBonus:0},pb:2};
 for(const edition of ['2014','2024'])for(let level=2;level<=20;level++)for(const order of [['barbarian','monk'],['monk','barbarian']]){
  const data={build:{edition,classId:order[0]},equipmentState:{loadout:[]},adobe:{classLevels:order.map((classId,i)=>({classId,level:i?level-1:1}))}},before=JSON.stringify(data),r=E.derive(data,stats,[],level);
  assert.equal(r.ac,edition==='2024'?16:order[0]==='barbarian'?13:16);assert.match(r.unarmoredDefenseNote,edition==='2024'?/one eligible formula/:new RegExp(order[0]==='barbarian'?'Barbarian is the first':'Monk is the first'));assert.equal(JSON.stringify(data),before);
 }
});
test('first-granting defense keeps its own shield rule rather than falling back to the later class',()=>{
 const stats={mods:{str:0,dex:2,con:4,int:0,wis:1,cha:0},scores:{str:10,dex:14,con:18,int:10,wis:12,cha:10},effects:{proficiencies:['shields']},feats:{acBonus:0,reports:[],rangedBonus:0},pb:2},l=[loot('shield','Shield')];
 for(const edition of ['2014','2024'])for(const first of ['monk','barbarian']){const data={build:{edition,classId:first},adobe:{classLevels:[{classId:first,level:1},{classId:first==='monk'?'barbarian':'monk',level:1}]},equipmentState:{loadout:[{id:'shield',equipped:true}]}};assert.equal(E.derive(data,stats,l,2).ac,edition==='2024'||first==='barbarian'?18:14);data.equipmentState.loadout[0].equipped=false;assert.equal(E.derive(data,stats,l,2).ac,edition==='2024'||first==='barbarian'?16:13);}
});
test('unarmored defense respects level caps, zero levels, saved envelopes and live class removal',()=>{
 const stats={mods:{str:0,dex:2,con:1,int:0,wis:4,cha:0},scores:{str:10,dex:14,con:12,int:10,wis:18,cha:10},effects:{proficiencies:[]},feats:{acBonus:0,reports:[],rangedBonus:0},pb:2};
 const data={build:{edition:'2014',classId:'fighter'},equipmentState:{loadout:[]},adobe:{classLevels:[{classId:'fighter',level:20},{classId:'monk',level:1},{classId:'barbarian',level:1}]}};assert.equal(E.derive(data,stats,[],20).ac,12);
 data.adobe.classLevels=[{classId:'fighter',level:1},{classId:'barbarian',level:0},{classId:'monk',level:1}];assert.equal(E.derive(data,stats,[],2).ac,16);
 data.rulesChoices={grants:{__adobe:{data:structuredClone(data.adobe)}}};data.adobe.classLevels=[{classId:'barbarian',level:1},{classId:'monk',level:1}];assert.equal(E.derive(data,stats,[],2).ac,13,'live Adobe state supersedes an old save envelope');
 data.rulesChoices.grants.__adobe.data=structuredClone(data.adobe);delete data.adobe;assert.equal(E.derive(data,stats,[],2).ac,13);data.rulesChoices.grants.__adobe.data.classLevels.shift();assert.equal(E.derive(data,stats,[],2).ac,16);
});
test('permitted natural armor and Draconic Resilience remain alternatives, and worn armor replaces unarmored formulas',()=>{
 const stats={mods:{str:0,dex:2,con:1,int:0,wis:4,cha:4},scores:{str:10,dex:14,con:12,int:10,wis:18,cha:18},effects:{proficiencies:['heavy armor']},feats:{acBonus:0,reports:[],rangedBonus:0},pb:2};
 const data={build:{edition:'2014',classId:'barbarian'},adobe:{classLevels:[{classId:'barbarian',level:1},{classId:'monk',level:1},{classId:'sorcerer',level:1,subclassId:'draconic-bloodline'}]},equipmentState:{loadout:[]}};assert.equal(E.derive(data,stats,[],3).ac,15);stats.effects.race={name:'Natural armor',naturalArmor:{base:17}};assert.equal(E.derive(data,stats,[],3).ac,17);
 const armor=loot('plate','Plate');data.equipmentState.loadout=[{id:'plate',equipped:true}];const r=E.derive(data,stats,[armor],3);assert.equal(r.ac,18);assert.equal(r.unarmoredDefenseNote,'');
});

test('All armor covers each armor group without granting Heavy training to a Medium-only character',()=>{for(const group of ['light','medium','heavy'])assert.equal(E.armorTrained(group,['All armor']),true);assert.equal(E.armorTrained('heavy',['Light armor','Medium armor']),false);const gear=[loot('mail','Chain Mail')];const d=make(gear,{build:{edition:'2014',classId:'fighter'},abilities:{str:16}});assert.ok(!M.derive(d,5,gear).gear.warnings.some(w=>/armor training not found/i.test(w)));});

test('one armor formula exposes exact additive components for paper readouts, including capped and negative DEX',()=>{
 for(const [name,dex,expected]of [['Chain Mail',18,{armor:16,dex:0,other:0,otherLabel:''}],['Half Plate',18,{armor:15,dex:2,other:0,otherLabel:''}],['Leather',8,{armor:11,dex:-1,other:0,otherLabel:''}]]){const l=[loot('armor',name)],r=M.derive(make(l,{abilities:{dex}}),5,l);assert.deepEqual(r.gear.baseParts,expected);assert.equal(Object.values(r.gear.baseParts).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0),r.gear.base);}
 for(const classId of ['barbarian','monk','sorcerer']){const d=make([],{build:{classId},abilities:{dex:14,con:16,wis:18,cha:18},adobe:{classLevels:[{classId,subclassId:'draconic-bloodline',level:5}]}}),r=M.derive(d,5,[]);const parts=r.gear.baseParts;assert.equal(parts.armor+parts.dex+parts.other,r.gear.base);assert.equal(r.gear.base+r.gear.shield+r.gear.bonus+r.gear.defense,r.ac);}
});

test('typed equipment enhancement names use one common parser and apply the bonus exactly once',()=>{for(const name of ['Longsword +1','Longsword+1','Longsword, +1','Longsword (+1)','+1 Longsword']){const m=E.infer({name});assert.equal(m.kind,'weapon',name);assert.equal(m.base,'longsword');assert.equal(m.attackBonus,1);assert.equal(m.damageBonus,1);assert.equal(m.acBonus,0);}for(const name of ['Plate +1','Plate armor +1','Plate armour (+1)','+1 Plate']){const m=E.infer({name});assert.equal(m.kind,'armor',name);assert.equal(m.base,'plate');assert.equal(m.acBonus,1);}assert.equal(E.infer({name:'Shield +2'}).acBonus,2);for(const name of ['Longsword +4','Longsword (+1','Longsword +1)','Longsword +1 +2','+1 Longsword +2','Longsword + (1+2)','Unrecognised blade +1'])assert.equal(E.infer({name}).kind,'none',name);assert.equal(E.infer({name:'Longsword +1',mechanics:{kind:'weapon',base:'longsword',attackBonus:2,damageBonus:3}}).damageBonus,3);});

test('separate paper damage retains shared Dueling and two-weapon style bonuses',()=>{const l=[loot('w','Longsword +1')],data=make(l,{abilities:{str:16}}),stats=M.derive(data,5,l),prior=global.CharacterClassFeatureChoices;try{global.CharacterClassFeatureChoices={styles:()=>[{name:'Dueling'}]};let row=E.derive(data,stats,l,5).attacks[0];assert.equal(row.damage,'1d8 + 6 slashing');assert.equal(row.damageDice,'1d8 + 6');const dagger=[loot('d','Dagger +1')],off=make(dagger,{abilities:{dex:16}});off.equipmentState.loadout[0].mode='offhand';global.CharacterClassFeatureChoices={styles:()=>[{name:'Two-Weapon Fighting'}]};row=E.derive(off,stats,dagger,5).attacks[0];assert.equal(row.damageDice,row.damage.replace(' piercing',''));assert.match(row.damageDice,/\+ 4/);}finally{if(prior===undefined)delete global.CharacterClassFeatureChoices;else global.CharacterClassFeatureChoices=prior;}});
