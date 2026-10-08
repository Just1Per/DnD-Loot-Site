const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../js/modules/campaign-rules'),S=require('../js/modules/character-spellcasting');
const catalogue=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/rules/catalog.json')));
test('Edition policies cover both versions, explicit records, source labels and neutral gear',()=>{
 assert.deepEqual(C.editions({}),['2014','2024']);
 for(const edition of ['2014','2024']){const campaign={allowedEditions:[edition]};assert.equal(C.allowed({edition},campaign),true);assert.equal(C.allowed({edition:edition==='2014'?'2024':'2014'},campaign),false);assert.equal(C.allowed({name:'Rope'},campaign),true);}
 for(const source of ['PHB24','XPHB','2024 Player’s Handbook'])assert.equal(C.recordEdition({source}),'2024');
 assert.equal(C.recordEdition({source:'SRD 5.1 / 2014'}),'2014');
});
test('Campaign edits and hidden records never mutate the shared catalogue or another campaign',()=>{
 const original=structuredClone(catalogue.feats),base=original[0],a={id:'a'},b={id:'b'};
 C.setOverrides('a',[{id:base.id,name:'Renamed',description:'Campaign description',edition:base.edition,hidden:true},{id:'custom-ward',name:'Ward',description:'Our ward',edition:'2024',custom:true,hpPerLevel:2,armorTraining:['medium']}]);
 assert.equal(C.feats(original,a).some(f=>f.id===base.id),false);assert.equal(C.feat(base.id,base,a).description,'Campaign description');assert.equal(C.feats(original,b).find(f=>f.id===base.id).name,base.name);assert.deepEqual(original,catalogue.feats);assert.equal(C.feats(original,a).find(f=>f.id==='custom-ward').name,'Ward');
 C.setOverrides('a',[]);assert.equal(C.feats(original,a).length,original.length);
});
test('Custom payload normalization bounds numbers and rejects unknown armor training',()=>{
 const row=C.normalize({name:' Ward ',description:'x'.repeat(13000),hpPerLevel:99,speedBonus:-10,minimumLevel:100,armorTraining:['medium','medium','forged'],custom:true});
 assert.equal(row.name,'Ward');assert.equal(row.description.length,12000);assert.equal(row.hpPerLevel,10);assert.equal(row.speedBonus,0);assert.equal(row.minimumLevel,20);assert.deepEqual(row.armorTraining,['medium']);
});
test('Renaming a standard feat preserves its mechanical identity; custom effects apply and remain after hiding',()=>{
 const context={console,module:undefined,require,activeCampaign:{id:'a'},structuredClone};vm.createContext(context);
 for(const file of ['campaign-rules','character-feat-data','character-feat-rules'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/'+file+'.js'),'utf8'),context);
 const tough=Object.entries(context.CharacterFeatData).find(([,d])=>d.name==='Tough'&&d.edition==='2014');
 context.CharacterCampaignRows=[{id:tough[0],name:'Campaign Tough',description:'Changed',edition:'2014'},{id:'custom-ward',name:'Ward',edition:'2024',custom:true,hpPerLevel:2,speedBonus:5,armorTraining:['medium']}];vm.runInContext("CampaignRules.setOverrides('a',CharacterCampaignRows)",context);
 const def=vm.runInContext('CampaignRules.definition('+JSON.stringify(tough[0])+',CharacterFeatData['+JSON.stringify(tough[0])+'])',context);assert.equal(def.name,'Tough');assert.equal(def.displayName,'Campaign Tough');
 const custom=vm.runInContext("CampaignRules.definition('custom-ward')",context);assert.equal(custom.campaignEffects.hpPerLevel,2);assert.equal(custom.armorTraining[0],'medium');
 vm.runInContext("CampaignRules.setOverrides('a',CharacterCampaignRows.map(r=>({...r,hidden:true})))",context);assert.equal(vm.runInContext("CampaignRules.definition('custom-ward').campaignEffects.hpPerLevel",context),2);
});
test('2024 Paladin always-prepared class and oath spells use class level, without duplicates or preparation cost',()=>{
 for(const level of [1,2,3,5,6,9,13,17,20]){
  const p={...S.profile('paladin',level,'2024'),subclassId:level>=3?'devotion-2024':''},grants=S.automaticGrants(p,catalogue.spells);
  assert.equal(grants.some(s=>s.name==='Divine Smite'),level>=2);assert.equal(grants.some(s=>s.name==='Find Steed'),level>=5);assert.equal(new Set(grants.map(s=>s.id)).size,grants.length);
  const rows=grants.map(s=>({catalogId:s.id,level:s.level,prepared:true}));assert.equal(S.countedSelections(p,rows,catalogue.spells).length,0);
 }
 const p={...S.profile('paladin',6,'2024'),subclassId:'devotion-2024'};assert.equal(S.automaticGrants(p,catalogue.spells).length,6);
});
test('2014 Paladin does not gain the 2024 smite spell; legacy Warlock expanded spells are not forced prepared',()=>{
 const paladin={...S.profile('paladin',6,'2014'),subclassId:'devotion'};assert.equal(S.automaticGrants(paladin,catalogue.spells).length,4);assert.equal(S.automaticGrants(paladin,catalogue.spells).some(s=>s.name==='Divine Smite'),false);
 assert.equal(S.automaticGrants({...S.profile('warlock',6,'2014'),subclassId:'fiend'},catalogue.spells).length,0);
 assert.equal(S.automaticGrants({...S.profile('warlock',6,'2024'),subclassId:'fiend-patron-2024'},catalogue.spells).length,6);
});
test('Life domain grants follow the selected subclass source and individual class level',()=>{
 for(const edition of ['2014','2024']){const p={...S.profile('cleric',6,edition),subclassId:'life-domain'+(edition==='2024'?'-2024':'')},grants=S.automaticGrants(p,catalogue.spells);assert.equal(grants.length,6);assert.equal(S.countedSelections(p,grants.map(s=>({catalogId:s.id})),catalogue.spells).length,0);}
 const d={build:{edition:'2024'},adobe:{classLevels:[{classId:'paladin',level:2,subclassId:''},{classId:'wizard',level:8}]}};assert.equal(S.automaticGrants(S.profiles(d,10)[0],catalogue.spells).some(s=>s.name==='Find Steed'),false);
});

test('Every automatic grant table resolves its spell names against the actual catalogue',()=>{
 const key=n=>n.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
 for(const [edition,tables] of Object.entries(S.grantTables))for(const [id,table] of Object.entries(tables)){
  const p={edition,subclassId:id+(edition==='2024'?'-2024':''),classId:id.includes('domain')?'cleric':['fiend','archfey','celestial','great-old-one'].includes(id)?'warlock':id.includes('draconic')?'sorcerer':'paladin',level:20};
  const grants=S.automaticGrants(p,catalogue.spells);for(const name of new Set(table.flatMap(row=>row.slice(1))))assert.ok(grants.some(spell=>key(spell.name)===key(name)),edition+' '+id+' '+name);
 }
});
test('Changing campaign policy refreshes existing controls and removes both listeners on leaving',()=>{
 const callbacks=[],stopped=[],context={console,Map,Set,JSON,activeCampaign:{id:'a'},sheetSession:{campaignId:'a'},reads:0,renders:0,document:{querySelector:()=>null},readSheetForm(){context.reads++;},renderCharacterSheet(){context.renders++;},renderCards(){},globalThis:null};context.globalThis=context;context.__DND_VAULT_DEPS__={db:{},doc:(_, ...p)=>p.join('/'),collection:(_, ...p)=>p.join('/'),onSnapshot:(p,fn)=>{callbacks.push({p,fn});return()=>stopped.push(p);}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/campaign-rules.js'),'utf8'),context);vm.runInContext('CampaignRules.watch()',context);
 callbacks[0].fn({exists:()=>true,data:()=>({allowedEditions:['2014']})});assert.equal(context.activeCampaign.allowedEditions[0],'2014');assert.equal(context.reads,1);assert.equal(context.renders,1);
 callbacks[1].fn({docs:[{id:'custom-ward',data:()=>({name:'Ward',custom:true,edition:'2014'})}]});assert.equal(context.renders,2);
 context.activeCampaign={id:'b'};callbacks[0].fn({exists:()=>true,data:()=>({allowedEditions:['2024']})});assert.equal(context.activeCampaign.allowedEditions,undefined);
 vm.runInContext('CampaignRules.stop()',context);assert.equal(stopped.length,2);
});
test('Policy rollout retains old campaigns when new collection rules are not yet published, but fails closed for configured policy',async()=>{
 const context={console,Map,Set,JSON,activeCampaign:{id:'legacy'},__DND_VAULT_DEPS__:{db:{},collection:(_, ...p)=>p.join('/'),getDocs:async()=>{throw Object.assign(Error('Denied'),{code:'permission-denied'});}}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/campaign-rules.js'),'utf8'),context);
 await context.CampaignRules.load();assert.equal(context.CampaignRules.policyAvailable(),false);
 await assert.rejects(context.CampaignRules.load({id:'configured',allowedEditions:['2014']}),/Denied/);
 context.__DND_VAULT_DEPS__.getDocs=async()=>({docs:[]});await context.CampaignRules.load();assert.equal(context.CampaignRules.policyAvailable(),true);
});
test('2014 Fighting Styles calculate armor, ranged attacks, one-handed damage and offhand damage at the equipment core',()=>{
 const original=global.CharacterClassFeatureChoices;global.CharacterClassFeatureChoices=require('../js/modules/character-class-feature-choices');
 try{
 const M=require('../js/modules/character-sheet-model'),E=require('../js/modules/character-equipment'),data=M.normalize({abilities:{str:14,dex:14},build:{edition:'2014',classId:'fighter',scoreMode:'base'}});
 data.adobe={classLevels:[{classId:'fighter',level:3}],classFeatureChoices:{}};
 const equipment=(name,style,mode='normal')=>{data.adobe.classFeatureChoices['2014:fighter:fighting-style']=[style];data.equipmentState.loadout=[{id:'owned',equipped:true,mode}];const loot=[{id:'owned',quantity:1,item:{name}}],stats=M.derive(data,3,loot);return E.derive(data,stats,loot);};
 assert.equal(equipment('Leather','defense').ac,14);
 assert.equal(equipment('Shortbow','archery').attacks[0].attack,6);
 assert.equal(equipment('Longsword','dueling').attacks[0].damage,'1d8 + 4 slashing');
 assert.equal(equipment('Longsword','dueling','twoHanded').attacks[0].damage,'1d10 + 2 slashing');
 assert.equal(equipment('Dagger','two-weapon-fighting','offhand').attacks[0].damage,'1d4 + 2 piercing');
 }finally{if(original===undefined)delete global.CharacterClassFeatureChoices;else global.CharacterClassFeatureChoices=original;}
});
