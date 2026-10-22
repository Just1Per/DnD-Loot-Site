const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

function runtime(file,values={}) {
  const warnings=[];
  const context=vm.createContext({console:{warn:(...args)=>warnings.push(args),error:()=>{}},structuredClone,Map,Set,Date,...values});
  context.window=context;
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules',file),'utf8'),context);
  return {context,warnings};
}

test('account loading retains existing roles and runs optional synchronization once',async()=>{
  const writes=[],hydrated=[];
  const profile={name:'Mira',email:'mira@example.test',role:['player']};
  const {context}=runtime('data.js',{
    db:{},currentUser:null,normalizeEmail:v=>String(v||'').trim().toLowerCase(),
    doc:(_, ...parts)=>parts.join('/'),getDoc:async()=>({exists:()=>true,data:()=>profile}),
    setDoc:async(...args)=>writes.push(args),isAdmin:()=>false,
    CharacterRulesCatalogStore:{loadEdition:async()=>({version:1}),CATALOG_VERSION:1,hydrate:async e=>hydrated.push(e)}
  });
  await context.loadCurrentUser({uid:'u1',email:profile.email});
  assert.equal(context.currentUser.uid,'u1');
  assert.equal(context.currentUser.name,'Mira');
  assert.deepEqual(Array.from(context.currentUser.role),['player']);
  assert.deepEqual(writes.map(w=>w[0]),['userDirectory/u1']);
  assert.deepEqual(hydrated,['2014','2024']);
});

test('new account keeps UID-based viewer defaults and normalized email',async()=>{
  const writes=[];
  const {context}=runtime('data.js',{
    db:{},currentUser:null,normalizeEmail:v=>String(v||'').trim().toLowerCase(),
    doc:(_, ...parts)=>parts.join('/'),getDoc:async()=>({exists:()=>false}),
    setDoc:async(...args)=>writes.push(args),isAdmin:()=>false
  });
  await context.loadCurrentUser({uid:'new-user',email:'Mira@Example.test',displayName:'Mira'});
  assert.deepEqual(writes.map(w=>w[0]),['users/new-user','userDirectory/new-user']);
  assert.equal(writes[0][1].emailLower,'mira@example.test');
  assert.deepEqual(Array.from(writes[0][1].role),['viewer']);
  assert.equal(context.currentUser.id,'new-user');
});

test('optional directory failure does not prevent loading the real account',async()=>{
  const {context,warnings}=runtime('data.js',{
    db:{},currentUser:null,normalizeEmail:v=>String(v||'').toLowerCase(),
    doc:(_, ...parts)=>parts.join('/'),getDoc:async()=>({exists:()=>true,data:()=>({name:'Mira',role:['dm']})}),
    setDoc:async()=>{throw Error('Directory unavailable')},isAdmin:()=>false
  });
  await context.loadCurrentUser({uid:'u1'});
  assert.equal(context.currentUser.name,'Mira');
  assert.equal(warnings.length,1);
});

function cacheRuntime(fail=false) {
  const writes=[];
  const result=runtime('catalog-cache.js',{
    db:{},CATALOG_META_ID:'catalog_meta',catalogVersion:17,rootItems:[{id:'item'}],isAdmin:()=>true,
    doc:(_, ...parts)=>parts.join('/'),
    setDoc:async(...args)=>{if(fail)throw Error('Metadata unavailable');writes.push(args)}
  });
  return {...result,writes};
}

test('catalogue seeding and invalidation share the same metadata schema',async()=>{
  const {context,writes}=cacheRuntime();
  await context.seedCatalogMetaIfNeeded();await context.markCatalogChanged();
  assert.equal(writes.length,2);
  for(const [location,record,options] of writes){
    assert.equal(location,'items/catalog_meta');assert.equal(record._type,'catalog-meta');
    assert.equal(record.itemCount,1);assert.equal(record.version,record.updatedAt);assert.equal(options.merge,true);
  }
  assert.equal(context.catalogVersion,writes[1][1].version);
});

test('metadata failure retains the previous version and remains recoverable',async()=>{
  const {context,warnings}=cacheRuntime(true);
  assert.equal(await context.seedCatalogMetaIfNeeded(),17);
  await context.markCatalogChanged();
  assert.equal(context.catalogVersion,17);assert.equal(warnings.length,2);
});

test('non-admin catalogue seed remains a no-op',async()=>{
  const {context,writes}=cacheRuntime();context.isAdmin=()=>false;
  assert.equal(await context.seedCatalogMetaIfNeeded(),17);assert.equal(writes.length,0);
});

test('image variant lookup remains stable across repeated calls',()=>{
  const {context}=runtime('images.js',{imageCache:new Map()});
  for(let i=0;i<3;i++){
    assert.equal(context.getBaseImageId('Sword-plus-1-red'),'sword');
    assert.equal(context.getBaseImageId('Wand_Uncommon_Blue_2'),'wand');
    assert.equal(context.getBaseImageId('unique-item'),'unique-item');
    assert.equal(context.getBaseImageId(''),'');
  }
});

test('sheet saving retains its persistence envelope and rejects stale revisions',async()=>{
  const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');
  const writes=[],raw={adobe:{hpMode:'rolled'},rulesChoices:{feats:['tough'],grants:{}}};
  let revision=2;
  const identity={name:'Mira',class:'Wizard',level:4};
  const store=createCharacterSheetStore({db:{},auth:{currentUser:{uid:'u1'}},doc:(_, ...parts)=>parts.join('/'),
    runTransaction:async(_,work)=>work({get:async p=>({exists:()=>true,data:()=>p.includes('characterSheets')?{revision}:identity}),set:(...args)=>writes.push(args),update:(...args)=>writes.push(args)})});
  const args={campaignId:'c1',characterId:'u1',revision:2,data:raw,identity,previousIdentity:identity};
  assert.equal(await store.save(args),3);
  assert.equal(writes[0][1].schemaVersion,14);
  assert.deepEqual(writes[0][1].data.rulesChoices.grants.__adobe.data,raw.adobe);
  assert.equal(writes[0][1].data.adobe,undefined);assert.equal(raw.adobe.hpMode,'rolled');
  revision=3;writes.length=0;
  await assert.rejects(store.save(args),/changed in another window/);assert.equal(writes.length,0);
  args.revision=3;args.previousIdentity={...identity,name:'Old name'};
  await assert.rejects(store.save(args),/details changed/);assert.equal(writes.length,0);
});

function rulesLoginRuntime({missing=false}={}) {
  const reads=[],writes=[],installed=[];
  const profile={name:'Mira',role:['player']};
  const {context}=runtime('data.js',{
    db:{},currentUser:null,normalizeEmail:v=>String(v||'').toLowerCase(),isAdmin:()=>false,
    doc:(_, ...parts)=>parts.join('/'),collection:(_, ...parts)=>parts.join('/'),
    getDoc:async key=>{reads.push(key);return {exists:()=>key.startsWith('users/')||!missing,data:()=>key.startsWith('users/')?profile:{version:2026100901}};},
    getDocs:async key=>{reads.push(key);const id=key.endsWith('/classes')?'fighter':'champion';return {docs:[{id,data:()=>({id,catalogVersion:2026100901})}]};},
    setDoc:async key=>writes.push(key),
    CharacterClassProgression:{installReference:(edition,reference)=>installed.push({edition,reference})}
  });
  context.__DND_VAULT_DEPS__={db:context.db,doc:context.doc,collection:context.collection,getDoc:context.getDoc,getDocs:context.getDocs};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/character-rules-catalog-store.js'),'utf8'),context);
  return {context,reads,writes,installed};
}

test('login installs the checked rules snapshots without fetching either edition twice',async()=>{
  const {context,reads,writes,installed}=rulesLoginRuntime();
  await context.loadCurrentUser({uid:'u1'});
  assert.equal(reads.length,7,'one account read plus metadata/classes/subclasses once per edition');
  for(const edition of ['2014','2024'])for(const suffix of ['', '/classes','/subclasses'])assert.equal(reads.filter(key=>key==='rulesCatalog/'+edition+suffix).length,1);
  assert.deepEqual(installed.map(x=>x.edition),['2014','2024']);
  assert.ok(installed.every(x=>x.reference.classes.fighter&&x.reference.subclasses.champion));
  assert.deepEqual(writes,['userDirectory/u1']);
});

test('a known missing edition retains bundled fallback without a duplicate retry',async()=>{
  const {context,reads,installed}=rulesLoginRuntime({missing:true});
  await context.loadCurrentUser({uid:'u1'});
  assert.deepEqual(reads,['users/u1','rulesCatalog/2014','rulesCatalog/2024']);
  assert.deepEqual(installed,[]);assert.equal(context.currentUser.name,'Mira');
});

test('direct hydration callers still fetch the current reference',async()=>{
  const {context,reads,installed}=rulesLoginRuntime();
  assert.equal(await context.CharacterRulesCatalogStore.hydrate('2024'),true);
  assert.equal(reads.length,3);assert.equal(installed[0].edition,'2024');
});

test('admin seeding hydrates its freshly published version rather than the stale snapshot',async()=>{
  const installed=[],versions=new Map([['2014',0],['2024',0]]);
  const {context}=runtime('data.js',{
    isAdmin:()=>true,CharacterRulesCatalogStore:{CATALOG_VERSION:1,
      loadEdition:async edition=>({version:versions.get(edition)}),
      seedEdition:async edition=>versions.set(edition,1),
      hydrate:async(edition,loaded)=>installed.push({edition,version:loaded===undefined?versions.get(edition):loaded.version})}
  });
  await context.ensureGlobalCharacterRulesReference();
  assert.deepEqual(installed,[{edition:'2014',version:1},{edition:'2024',version:1}]);
});


function campaignEntryRuntime(){
  const reads=[],pending=new Map(),loads=[],alerts=[];
  const noop=()=>{};
  const {context}=runtime('dashboard.js',{
    auth:{currentUser:{uid:'player'}},db:{},campaignLoadGeneration:0,activeCampaign:null,activeMembershipRole:null,
    PageEditors:{guard:()=>true,clear:noop},SheetNavigation:{guard:()=>true},CharacterWorkspace:{clear:noop},
    closeItemModal:noop,closeCharacterSheet:noop,closeVaultAction:noop,closeRootPicker:noop,
    CampaignRules:{load:async()=>loads.push('rules'),watch:noop},canManageCampaign:()=>false,
    loadCharacters:async()=>loads.push('characters'),loadSaves:async()=>loads.push('saves'),loadCampaignInventory:async()=>loads.push('inventory'),
    document:{getElementById:()=>({})},showMainApp:noop,populateOwnerFilter:noop,renderMagicItemLoadPrompt:noop,
    hideAllScreens:noop,showCampaignSelector:noop,AppNavigation:{clear:noop},alert:message=>alerts.push(message),
    doc:(_, ...parts)=>parts.join('/'),getDoc:path=>{reads.push(path);return new Promise((resolve,reject)=>pending.set(path,{resolve,reject}))},
    items:[],inventory:[],campaignSupply:{},itemState:{},characters:[],saves:[],campaignMembers:[],campaignInvites:[],selectedCharacter:null,
    magicItemLibraryLoaded:false,magicItemLibraryLoading:false
  });
  // Replace UI-only function declarations loaded with the module.
  context.hideAllScreens=noop;context.showCampaignSelector=noop;context.showMainApp=noop;
  const campaign=(data={ownerId:'owner',name:'Campaign'})=>({id:'a',exists:()=>!!data,data:()=>data});
  const member=(data={status:'active',role:'player'})=>({exists:()=>!!data,data:()=>data});
  return{context,reads,pending,loads,alerts,campaign,member};
}

test('campaign opening starts independent reads together and waits for both authorization results',async()=>{
  const f=campaignEntryRuntime();const opening=f.context.enterCampaign({id:'a'});
  assert.deepEqual(f.reads,['campaigns/a','campaigns/a/members/player']);assert.equal(f.loads.length,0);
  f.pending.get('campaigns/a').resolve(f.campaign());await Promise.resolve();assert.equal(f.loads.length,0);
  f.pending.get('campaigns/a/members/player').resolve(f.member());assert.equal(await opening,true);
  assert.equal(f.context.activeCampaign.id,'a');assert.equal(f.context.activeMembershipRole,'player');
  assert.deepEqual(f.loads.sort(),['characters','inventory','rules','saves']);
});

test('parallel campaign reads retain revoked membership, deletion and missing campaign denial',async()=>{
  for(const [data,membership] of [[{ownerId:'owner'},null],[{ownerId:'owner'},{status:'revoked'}],[{ownerId:'owner',deletedAt:123},{status:'active'}],[null,{status:'active'}]]){
    const f=campaignEntryRuntime(),opening=f.context.enterCampaign({id:'a'});
    f.pending.get('campaigns/a').resolve(f.campaign(data));f.pending.get('campaigns/a/members/player').resolve(f.member(membership));
    assert.equal(await opening,false);assert.equal(f.loads.length,0);assert.equal(f.context.activeCampaign,null);assert.equal(f.alerts.length,1);
  }
});

test('parallel campaign results are ignored after account or navigation changes',async()=>{
  for(const change of [c=>{c.auth.currentUser={uid:'other'}},c=>{c.campaignLoadGeneration++}]){
    const f=campaignEntryRuntime(),opening=f.context.enterCampaign({id:'a'});change(f.context);
    f.pending.get('campaigns/a').resolve(f.campaign());f.pending.get('campaigns/a/members/player').resolve(f.member());
    assert.equal(await opening,false);assert.equal(f.loads.length,0);assert.equal(f.context.activeCampaign,null);assert.equal(f.alerts.length,0);
  }
});

test('campaign owner still opens without a membership record and failed reads fail closed',async()=>{
  const f=campaignEntryRuntime(),opening=f.context.enterCampaign({id:'a'});
  f.pending.get('campaigns/a').resolve(f.campaign({ownerId:'player'}));f.pending.get('campaigns/a/members/player').resolve(f.member(null));
  assert.equal(await opening,true);assert.equal(f.context.activeMembershipRole,'owner');
  const failed=campaignEntryRuntime(),denied=failed.context.enterCampaign({id:'a'});
  failed.pending.get('campaigns/a').resolve(failed.campaign());failed.pending.get('campaigns/a/members/player').reject(Error('Unavailable'));
  assert.equal(await denied,false);assert.equal(failed.loads.length,0);assert.equal(failed.context.activeCampaign,null);
});
