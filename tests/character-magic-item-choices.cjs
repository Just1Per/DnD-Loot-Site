'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../js/modules/character-magic-item-choices'),E=require('../js/modules/character-equipment');
global.CharacterMagicItemReference=require('../js/modules/character-magic-item-data');global.CharacterMagicItems=require('../js/modules/character-magic-items');const Magic=global.CharacterMagicItems,M=require('../js/modules/character-sheet-model');
const loot=(name='Belt of Giant Strength')=>[{id:'owned',quantity:1,item:{name,properties:[{title:'Weight per unit (lb)',text:'1'}],description:'Original item',mechanics:{kind:'accessory',acBonus:1}}}];
const stats=()=>({str:10,dex:10,con:10,int:10,wis:10,cha:10}),effects=()=>({resistances:[],speed:30});
test('source choices retain six original giant types and ten resistance types',()=>{
 assert.deepEqual(C.options(loot()[0].item).map(row=>row.label),['Hill · STR 21 · Rare','Frost · STR 23 · Very Rare','Stone · STR 23 · Very Rare','Fire · STR 25 · Very Rare','Cloud · STR 27 · Legendary','Storm · STR 29 · Legendary']);assert.equal(C.options({name:'Ring of Resistance'}).length,10);assert.equal(C.options({name:'Ring of Fire Resistance'}).length,10);assert.equal(C.options({name:'Cloak of Protection'}).length,0);
});
test('private choice preserves equipment controls and changes no catalogue, stock or resources',()=>{
 const all=loot(),raw=[{id:'owned',equipped:true,attuned:true,mode:'offhand',ability:'str',proficiency:'yes'}],before=JSON.stringify({raw,all}),next=C.choose(raw,all,'owned','belt-storm');assert.equal(next[0].magicVariant,'belt-storm');assert.equal(next[0].attuned,true);assert.equal(next[0].mode,'offhand');assert.equal(JSON.stringify({raw,all}),before);const projected=C.project(all,next);assert.equal(projected[0].item.name,'Belt of Storm Giant Strength');assert.deepEqual(projected[0].item.mechanics,all[0].item.mechanics);assert.equal(projected[0].item.rarity,'Legendary');assert.equal(projected[0].quantity,1);
});
test('projection is idempotent and clearing restores the exact original item, including a concrete variant',()=>{
 const all=loot('Belt of Hill Giant Strength'),next=C.choose([],all,'owned','belt-storm'),once=C.project(all,next),twice=C.project(once,next);assert.deepEqual(twice,once);assert.equal(twice[0].item.properties.length,2);const cleared=C.choose(next,once,'owned','');assert.deepEqual(C.project(twice,cleared),all);assert.equal(C.project(twice,cleared)[0],all[0]);
});
test('only supported matching families can be selected; unowned, zero quantity, overflow and forged values refuse atomically',()=>{
 const all=loot(),raw=[],before=JSON.stringify({all,raw});for(const [rows,id,key]of [[all,'owned','ring-fire'],[all,'missing','belt-fire'],[[{...all[0],quantity:0}],'owned','belt-fire'],[all,'owned','__proto__']])assert.throws(()=>C.choose(raw,rows,id,key));assert.equal(JSON.stringify({all,raw}),before);assert.throws(()=>C.choose(Array.from({length:200},(_,i)=>({id:'id-'+i})),all,'owned','belt-fire'),/limit/);assert.equal(E.choices({loadout:[{id:'owned',magicVariant:'bad'}]}).loadout[0].magicVariant,undefined);
});
test('removed ownership and changed catalogue families cannot receive retained variant effects',()=>{
 const selected=[{id:'owned',equipped:true,attuned:true,magicVariant:'belt-storm'}];assert.deepEqual(C.project([],selected),[]);const changed=loot('Cloak of Protection');assert.equal(C.project(changed,selected)[0],changed[0]);assert.equal(C.project(loot('Ring of Resistance'),selected)[0].item.name,'Ring of Resistance');
});
test('all source giant choices feed existing worn/attuned ability rules without lowering a higher score',()=>{
 for(const [type,str]of [['hill',21],['frost',23],['stone',23],['fire',25],['cloud',27],['storm',29]]){const d={equipmentState:{loadout:[{id:'owned',equipped:true,attuned:true,magicVariant:'belt-'+type}]}},scores=stats();Magic.apply(d,scores,effects(),loot());assert.equal(scores.str,str);const higher={...stats(),str:30};Magic.apply(d,higher,effects(),loot());assert.equal(higher.str,30);}
});
test('all ring choices feed existing resistance rules, and inactive items give no effect',()=>{
 const all=loot('Ring of Resistance');for(const row of C.options(all[0].item)){const d={equipmentState:{loadout:[{id:'owned',equipped:true,attuned:true,magicVariant:row.id}]}},out=effects();Magic.apply(d,stats(),out,all);assert.deepEqual(out.resistances,[row.id.slice(5).replace(/^./,x=>x.toUpperCase())]);for(const flags of [{equipped:false,attuned:true},{equipped:true,attuned:false}]){const inactive=effects();Magic.apply({equipmentState:{loadout:[{...d.equipmentState.loadout[0],...flags}]}},stats(),inactive,all);assert.deepEqual(inactive.resistances,[]);}}
});
test('generic parents require attunement and variant selection cannot bypass the shared three-item limit',()=>{
 assert.equal(Magic.requiresAttunement({name:'Belt of Giant Strength'}),true);assert.equal(Magic.requiresAttunement({name:'Ring of Resistance'}),true);const all=[...Array.from({length:3},(_,i)=>({id:'ward-'+i,quantity:1,item:{name:'Ward '+i,attunement:true}})),...loot()],d={equipmentState:{loadout:all.map(row=>({id:row.id,equipped:true,attuned:true,...(row.id==='owned'?{magicVariant:'belt-storm'}:{})}))}},scores=stats();Magic.apply(d,scores,effects(),all);assert.equal(scores.str,10);assert.equal(E.attunementState(d,all,5).count,4);assert.equal(E.attunementState(d,all,5).active.has('owned'),false);
});
test('shared model persists choices and applies effects in both editions without modifying input',()=>{
 for(const edition of ['2014','2024']){const raw=M.normalize({build:{edition,race:edition==='2014'?'human':'human-2024',classId:'fighter'},equipmentState:{loadout:[{id:'owned',equipped:true,attuned:true,magicVariant:'belt-fire'}]}}),before=JSON.stringify(raw),saved=M.normalize(JSON.parse(before));assert.equal(saved.equipmentState.loadout[0].magicVariant,'belt-fire');const derived=M.derive(saved,5,loot());assert.equal(derived.scores.str,25);assert.equal(JSON.stringify(raw),before);assert.equal(derived.gear.entries.find(row=>row.entry.id==='owned').item.name,'Belt of Fire Giant Strength');}
});

test('a multiclass character uses the chosen Strength in ordinary weapon attacks without changing resource state',()=>{
 const data=M.normalize({build:{classId:'fighter',edition:'2014',scoreMode:'final'},equipmentState:{loadout:[{id:'owned',equipped:true,attuned:true,magicVariant:'belt-fire'},{id:'sword',equipped:true}]}});data.adobe={classLevels:[{classId:'fighter',level:2},{classId:'warlock',level:3}]};const before=JSON.stringify(data),all=[...loot(),{id:'sword',quantity:1,item:{name:'Longsword',mechanics:{kind:'weapon',base:'longsword'}}}],out=M.derive(data,5,all),attack=out.gear.attacks.find(row=>row.name==='Longsword');assert.equal(out.scores.str,25);assert.equal(attack.attack,10);assert.equal(attack.damage.includes('7'),true);assert.equal(JSON.stringify(data),before);
});

test('duplicate raw choices follow the shared first-record rule, and a refreshed source remains authoritative',()=>{
 const all=loot(),loadout=[{id:'owned',equipped:true,attuned:true,magicVariant:'belt-hill'},{id:'owned',equipped:true,attuned:true,magicVariant:'belt-storm'}],scores=stats();Magic.apply({equipmentState:{loadout}},scores,effects(),all);assert.equal(scores.str,21);const projected=C.project(all,loadout);all[0].item.description='Updated description';assert.equal(C.project(projected,loadout)[0].item.description,'Updated description');
});
