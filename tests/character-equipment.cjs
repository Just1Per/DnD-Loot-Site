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

test('racial AC profiles apply natural armor and permanent conditional bonuses automatically',()=>{
 const baseStats={mods:{str:0,dex:2,con:3,int:0,wis:0,cha:0},scores:{str:10,dex:14,con:16,int:10,wis:10,cha:10},effects:{proficiencies:[],race:{name:'Loxodon',naturalArmor:{base:12,ability:'con'}}},feats:{acBonus:0,reports:[],rangedBonus:0},pb:2};
 const data={build:{edition:'2014',classId:'fighter'},equipmentState:{loadout:[]},rulesChoices:{grants:{}}};
 assert.equal(E.derive(data,baseStats,[]).ac,15);
 const simic={...baseStats,effects:{...baseStats.effects,race:{name:'Simic Hybrid',acBonus:1,acBonusCondition:'not-heavy'}}};
 assert.equal(E.derive(data,simic,[]).ac,13);
});
