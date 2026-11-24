'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),H=require('../js/modules/character-species-healing'),Resources=require('../js/modules/character-species-resources'),F=require('../js/modules/character-class-feature-choices'),Catalog=require('../js/modules/character-catalog');
Catalog.set(require('../data/rules/catalog.json'));
const actor=(race='aasimar-2024',level=5)=>{const d=M.normalize({build:{race,edition:race==='aasimar-2024'?'2024':'2014',classId:'fighter',scoreMode:'base'},abilities:{str:14,dex:14,con:14,int:16,wis:14,cha:16},hpMax:40,hpCurrent:10,hpTemp:7});d.adobe={classLevels:[{classId:'fighter',level}],classFeatureChoices:{}};return d;};
const use=(d,extra={})=>H.use(d,{level:5,roll:9,recipient:'self',confirmed:true,...extra});
test('Healing Hands exists from level one independently of Revelation, with source-specific action and total-level PB dice',()=>{
 for(const race of ['aasimar-mpmm','aasimar-2024'])for(const level of [1,2,3,5,9,13,17,20]){const d=actor(race,level);d.adobe.classLevels=[{classId:'fighter',level:1},{classId:'wizard',level:19}];const before=JSON.stringify(d),s=H.state(d,{level});assert.equal(s.available,true);assert.equal(s.canUse,true);assert.equal(s.min,Math.ceil(level/4)+1);assert.equal(s.max,s.min*4);assert.equal(s.definition.action,race==='aasimar-2024'?'Magic action':'Action');assert.equal(s.resource.max,1);assert.deepEqual(s.resource.resets,['long']);assert.equal(JSON.stringify(d),before);}
 const d=actor('aasimar-2024');d.build.edition='2014';assert.equal(H.state(d,{level:5}).available,false);d.build.race='human';assert.equal(H.state(d,{level:20}).available,false);
});
test('self healing caps at the actual owned-item/class maximum, clears death saves only on regained HP and retains temporary HP',()=>{
 const d=actor(),loot=[{id:'health',quantity:1,item:{name:'Amulet of Health',edition:'2014'}}];d.equipmentState.loadout=[{id:'health',equipped:true,attuned:true}];const max=M.derive(d,5,loot).hpMax;assert.ok(max>M.derive(d,5).hpMax);d.hpCurrent=max-2;d.deathSuccess=2;d.deathFailure=1;const kept=JSON.stringify({loot,slots:d.slots,coins:d.coins,gear:d.personalGear}),s=H.state(d,{level:5,loot});assert.deepEqual(use(d,{loot,roll:s.max}),{recipient:'self',rolled:12,applied:2});assert.equal(d.hpCurrent,max);assert.equal(d.hpTemp,7);assert.equal(d.deathSuccess,0);assert.equal(d.deathFailure,0);assert.equal(H.state(d,{level:5,loot}).resource.used,1);assert.equal(JSON.stringify({loot,slots:d.slots,coins:d.coins,gear:d.personalGear}),kept);
});
test('a deliberate use at or above maximum HP cannot lower HP or clear death records without healing',()=>{
 for(const excess of [0,5]){const d=actor();d.hpCurrent=M.derive(d,5).hpMax+excess;d.deathSuccess=2;d.deathFailure=1;const hp=d.hpCurrent;assert.equal(use(d).applied,0);assert.equal(d.hpCurrent,hp);assert.equal(d.deathSuccess,2);assert.equal(d.deathFailure,1);assert.equal(d.hpTemp,7);assert.equal(H.state(d,{level:5}).resource.used,1);}
});
test('other-recipient healing records its own roll/payment without changing actor HP, death saves or any target document',()=>{
 const d=actor();d.deathSuccess=1;d.deathFailure=2;const kept=JSON.stringify({...d,adobe:undefined});assert.deepEqual(use(d,{recipient:'other'}),{recipient:'other',rolled:9,applied:null});assert.equal(JSON.stringify({...d,adobe:undefined}),kept);assert.deepEqual(H.state(d,{level:5}).last,{recipient:'other',rolled:9,applied:null});assert.equal(use(d,{recipient:'other'}),false);
});
test('roll bounds, explicit recipient/confirmation and actor eligibility reject atomically',()=>{
 for(const extra of [{roll:2},{roll:13},{roll:3.5},{roll:NaN},{roll:Infinity},{roll:'9'},{roll:null},{recipient:''},{recipient:'someone'},{confirmed:false},{confirmed:'true'}]){const d=actor(),before=JSON.stringify(d);assert.equal(use(d,extra),false,JSON.stringify(extra));assert.equal(JSON.stringify(d),before);}
 for(const condition of ['Stunned','Incapacitated','Paralyzed','Petrified','Unconscious','Dead','Exhaustion 6']){const d=actor();d.conditions=condition;const before=JSON.stringify(d);assert.equal(use(d),false,condition);assert.equal(JSON.stringify(d),before);}
 for(const change of [{hpCurrent:0},{deathFailure:3}]){const d=Object.assign(actor(),change),before=JSON.stringify(d);assert.equal(use(d),false);assert.equal(JSON.stringify(d),before);}
});
test('a conscious legacy Zealot at zero can heal, while an unallocated or revised Rage cannot manufacture consciousness',()=>{
 const d=actor('aasimar-mpmm',14);d.hpCurrent=0;d.deathFailure=3;d.build.classId='barbarian';d.adobe={classLevels:[{classId:'barbarian',level:14,subclassId:'zealot'}],classFeatureChoices:{'2014:barbarian:rage-state':['zealot']}};assert.equal(H.use(d,{level:14,roll:5,recipient:'self',confirmed:true}).applied,5);assert.equal(d.hpCurrent,5);assert.equal(d.deathFailure,0);
 for(const [edition,level,id]of [['2014',13,'zealot'],['2024',14,'zealot-2024']]){const d=actor('aasimar-mpmm',14);d.build.edition=edition;d.build.classId='barbarian';d.hpCurrent=0;d.adobe={classLevels:[{classId:'barbarian',level,subclassId:id}],classFeatureChoices:{[edition+':barbarian:rage-state']:[id]}};assert.equal(H.use(d,{level:14,roll:5,recipient:'self',confirmed:true}),false);}
});
test('counter/payment and receipt capacity failures cannot heal first or grant a free use',()=>{
 const d=actor();d.adobe.classFeatureChoices=Object.fromEntries(Array.from({length:99},(_,i)=>['kept:'+i,['1']]));let before=JSON.stringify(d);assert.equal(use(d),false);assert.equal(JSON.stringify(d),before);
 for(const raw of [null,'0',true,['invalid'],['0','1']]){const d=actor(),key=H.state(d,{level:5}).resource.key;d.adobe.classFeatureChoices[key]=raw;d.adobe.classFeatureChoices=F.normalize(d.adobe.classFeatureChoices);const before=JSON.stringify(d);assert.equal(use(d),false);assert.equal(JSON.stringify(d),before);}
});
test('daily recovery, source changes and generic controls keep Healing Hands separate from Revelation and other resources',()=>{
 const d=actor('aasimar-mpmm');assert.equal(F.changeClassResource(d,'species-healing-hands',1,{level:5}),false);assert.equal(use(d).rolled,9);assert.equal(F.changeClassResource(d,'species-healing-hands',-1,{level:5}),false);assert.equal(Resources.setUsed(d,'species-healing-hands',0,{level:5}),false);d.build.race='aasimar-2024';d.build.edition='2024';assert.equal(use(d).rolled,9);assert.equal(M.derive(d,5).classResources.find(r=>r.id==='species-revelation').used,0);Resources.onEvent(d,'short');assert.equal(H.state(d,{level:5}).resource.used,1);d.build.race='human';Resources.onEvent(d,'long');for(const [race,edition]of [['aasimar-mpmm','2014'],['aasimar-2024','2024']]){d.build.race=race;d.build.edition=edition;assert.equal(H.state(d,{level:5}).resource.remaining,1);}
});
test('explicit correction refunds only the use, retaining already-applied HP and surviving normalized private choices',()=>{
 const d=actor();assert.ok(use(d));const saved=JSON.parse(JSON.stringify(d));saved.adobe.classFeatureChoices=F.normalize(saved.adobe.classFeatureChoices);assert.deepEqual(H.state(saved,{level:5}).last,{recipient:'self',rolled:9,applied:9});const hp=saved.hpCurrent;assert.equal(H.undo(saved,{level:5}),true);assert.equal(saved.hpCurrent,hp);assert.equal(H.state(saved,{level:5}).resource.used,0);assert.equal(H.state(saved,{level:5}).last,null);assert.equal(H.undo(saved,{level:5}),false);
});
test('forged render statistics cannot change the payment roll bounds or actual HP maximum',()=>{
 const d=actor(),before=JSON.stringify(d);assert.equal(use(d,{roll:80,stats:{pb:20,hpMax:10000}}),false);assert.equal(JSON.stringify(d),before);assert.equal(use(d,{stats:{pb:20,hpMax:10000}}).applied,9);
 for(const raw of [null,['self','9','table'],['other','9','8'],['self','999','1'],['self','3','4']]){d.adobe.classFeatureChoices['species:aasimar-2024:healing-hands-last']=raw;assert.equal(H.state(d,{level:5}).last,null);}
});
const Wild=require('../js/modules/character-wild-shape');Wild.setCatalogue(require('../data/rules/wild-shapes-v1.json'));
function shaped(edition){const d=actor('aasimar-mpmm');d.build.edition=edition;d.build.classId='druid';d.adobe.classLevels=[{classId:'druid',level:5}];const id='srd-'+edition+'-wolf';if(edition==='2024')assert.equal(Wild.setKnown(d,0,id,5),true);assert.equal(Wild.assume(d,id,{level:5,seen:true}),true);return d;}
test('legacy Wild Shape self healing uses only the active Beast HP pool and records that pool explicitly',()=>{
 const d=shaped('2014');assert.equal(Wild.setHP(d,4,{level:5}),true);d.deathSuccess=1;d.deathFailure=1;const body=d.hpCurrent,max=Wild.profile(d,{level:5}).hpMax,spent=Wild.state(d,5).used;assert.equal(H.state(d,{level:5}).selfPool,'wild-shape');const result=use(d,{roll:12});assert.deepEqual(result,{recipient:'self',rolled:12,applied:max-4,pool:'wild-shape'});assert.equal(d.hpCurrent,body);assert.equal(d.deathSuccess,1);assert.equal(d.deathFailure,1);assert.equal(Wild.profile(d,{level:5}).hp,max);assert.equal(Wild.state(d,5).used,spent);assert.equal(H.state(d,{level:5}).last.pool,'wild-shape');assert.equal(H.undo(d,{level:5}),true);assert.equal(Wild.profile(d,{level:5}).hp,max,'a correction does not reverse form HP either');Wild.end(d,5);assert.equal(H.state(d,{level:5}).selfPool,'body');assert.equal(use(d).applied,9);assert.equal(d.hpCurrent,body+9);
});
test('revised Wild Shape does not retain species Healing Hands and returning restores its unspent availability',()=>{
 const d=shaped('2024'),before=JSON.stringify(d);assert.match(H.state(d,{level:5}).reason,/not retained during 2024 Wild Shape/);assert.equal(use(d),false);assert.equal(use(d,{recipient:'other'}),false);assert.equal(JSON.stringify(d),before);Wild.end(d,5);assert.equal(H.state(d,{level:5}).canUse,true);assert.equal(H.state(d,{level:5}).resource.used,0);
});
test('unresolved forms and full ledgers cannot redirect form healing to the body or update either pool before payment',()=>{
 const d=shaped('2014');Wild.setHP(d,4,{level:5});const c=d.adobe.classFeatureChoices;for(let i=0;Object.keys(c).length<99;i++)c['kept:'+i]=['1'];let before=JSON.stringify(d);assert.equal(use(d),false);assert.equal(JSON.stringify(d),before);
 const unknown=actor('aasimar-mpmm');unknown.build.classId='druid';unknown.adobe.classLevels=[{classId:'druid',level:5}];unknown.adobe.classFeatureChoices['2014:druid:wild-shape-active']=['missing-form'];before=JSON.stringify(unknown);assert.equal(use(unknown),false);assert.match(H.state(unknown,{level:5}).reason,/resolve the active Wild Shape/);assert.equal(JSON.stringify(unknown),before);
});
