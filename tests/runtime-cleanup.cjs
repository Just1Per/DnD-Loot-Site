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
