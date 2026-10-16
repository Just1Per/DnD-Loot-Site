// Real REST transactions against a local demo emulator; no production credentials.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
(async()=>{
 const M=await import('../scripts/item-catalogue-migration.mjs'),{createMigrationPort}=await import('../scripts/item-catalogue-migration-firebase.mjs');
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:await fs.readFile(path.join(__dirname,'../firestore.rules'),'utf8')}});
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'dnd-migration-test-'));
 try{
  await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{
   for(const [p,data] of Object.entries({
    'campaigns/target':{ownerId:'owner',name:'Synthetic campaign',inventoryVersion:2},'campaigns/other':{ownerId:'other',inventoryVersion:2},
    'campaigns/other/inventory/gear':{quantity:3,userId:'other',item:{name:'Already owned',mechanics:{acBonus:1}}},
    'items/a':{name:'Synthetic A',description:'Private original A',customField:{nested:123}},'items/b':{name:'Synthetic B',description:'Private original B'}
   }))await sdk.setDoc(sdk.doc(ctx.firestore(),p),data);
  });
  const origin='http://127.0.0.1:8080',base=origin+'/v1/projects/demo-vault-test/databases/(default)/documents/';
  const adminGet=async p=>{const r=await fetch(base+p,{headers:{Authorization:'Bearer owner'}});assert.equal(r.status,200);return r.json();};
  const documents=await Promise.all(['items/a','items/b'].map(adminGet));
  const manifest={format:1,targetCampaignId:'target',retireLegacyArtwork:true,decisions:documents.map((doc,i)=>({id:i?'b':'a',sourceSha256:M.fieldsHash(doc.fields),action:i?'retire':'publish',approved:true,reviewedBy:'Synthetic test owner',reviewedAt:'2026-10-16T13:00:00Z',...(i?{}:{replacement:{name:'Original shared item',description:'Our independently written text.'},rights:{license:'ORIGINAL',attribution:'Test author',evidence:'Synthetic test authorship'}})}))};
  const plan=M.buildMigrationPlan({project:'demo-vault-test',collection:'items',documents},manifest,{project:'demo-vault-test',campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'});
  // Exercise Storage orchestration with a deterministic GCS contract double.
  // Firestore reads, transactions and preconditions remain real emulator calls.
  const objects=new Map(['a','b'].map((id,i)=>['dnd-item-images/'+id+'.png',{bytes:Buffer.from([i,2,3]),metadata:{generation:String(i+1),metageneration:'1',size:'3',contentType:'image/png',metadata:{firebaseStorageDownloadTokens:'old-synthetic-token'}}}]));
  let generation=3,publicAccess=false;
  const bucket={
   getMetadata:async()=>[{iamConfiguration:{uniformBucketLevelAccess:{enabled:true}}}],iam:{getPolicy:async()=>[{bindings:publicAccess?[{members:['allUsers']}]:[]}]},
   getFiles:async({prefix})=>[[...objects.keys()].filter(name=>name.startsWith(prefix)).map(name=>bucket.file(name))],
   file:(name,settings={})=>({name,exists:async()=>[objects.has(name)],getMetadata:async()=>[structuredClone(objects.get(name).metadata)],
    download:async options=>{assert.equal(options.validation,'crc32c');const object=objects.get(name);assert.ok(object,'missing mock object');if(settings.generation)assert.equal(settings.generation,object.metadata.generation);return [object.bytes];},
    save:async(bytes,options)=>{assert.equal(options.preconditionOpts.ifGenerationMatch,0);assert.ok(!objects.has(name));assert.equal(options.validation,'crc32c');assert.ok(!options.metadata.metadata.firebaseStorageDownloadTokens);objects.set(name,{bytes:Buffer.from(bytes),metadata:{...options.metadata,generation:String(generation++),size:String(bytes.length)}});},
    delete:async options=>{assert.equal(String(options.ifGenerationMatch),objects.get(name).metadata.generation);objects.delete(name);}
   })
  };
  const options={project:'demo-vault-test',bucket:'demo-vault-test.firebasestorage.app',backupDirectory:path.join(directory,'private-backup'),services:{firestoreOrigin:origin,credential:{getAccessToken:async()=>({access_token:'owner'})},bucket,fetcher:async(url,init)=>{if(String(url).startsWith('https://storage.googleapis.com/')){assert.equal(init.method,'HEAD');assert.ok(!init.headers?.Authorization);return new Response(null,{status:403});}assert.ok(String(url).startsWith(origin+'/v1/'));return fetch(url,init);}}};
  let port=await createMigrationPort(options);
  const dry=await M.migrateCatalogue(plan,port);assert.equal(dry.writes,0);assert.equal((await adminGet('items/b')).fields.name.stringValue,'Synthetic B');
  console.log('PASS Real REST dry-run leaves source documents unchanged');
  publicAccess=true;await assert.rejects(M.migrateCatalogue(plan,port),/public IAM/);publicAccess=false;
  const gear=await adminGet('campaigns/other/inventory/gear');
  const result=await M.migrateCatalogue(plan,port,{apply:true,confirmPlanSha256:plan.planSha256});assert.equal(result.writes,2);
  const root=await adminGet('items/a');assert.equal(root.fields.catalogueStatus.stringValue,'approved-v1');assert.equal(root.fields.description.stringValue,'Our independently written text.');
  const deleted=await fetch(base+'items/b',{headers:{Authorization:'Bearer owner'}});assert.equal(deleted.status,404);
  for(const item of plan.items){
   const copy=await adminGet('campaigns/target/items/'+item.archiveId),archive=await adminGet('campaigns/target/catalogueArchives/'+item.archiveId);
   assert.equal(copy.fields.visible.booleanValue,false);assert.equal(copy.fields.lootMode.stringValue,'dm');
   assert.equal(M.fieldsHash(archive.fields.original.mapValue.fields),item.sourceSha256);assert.equal(archive.fields.completed.booleanValue,true);
   const stock=await fetch(base+'campaigns/target/supply/'+item.archiveId,{headers:{Authorization:'Bearer owner'}});assert.equal(stock.status,404);
  }
  assert.deepEqual((await adminGet('campaigns/other/inventory/gear')).fields,gear.fields);
  assert.equal([...objects.keys()].filter(name=>name.startsWith('dnd-item-images/')).length,0);
  assert.equal([...objects.keys()].filter(name=>name.startsWith('campaign-catalogue-images/')).length,2);
  assert.equal((await fs.stat(options.backupDirectory)).mode&0o777,0o700);assert.equal((await fs.stat(path.join(options.backupDirectory,'plan.json'))).mode&0o777,0o600);
  console.log('PASS Real transactions preserve exact originals, retire/publish sources, invalidate metadata and leave gear/stock alone');
  console.log('PASS Storage orchestration copies/verifies assets without tokens, rejects public IAM and deletes only backed-up generations');
  port=await createMigrationPort(options);const resumed=await M.migrateCatalogue(plan,port,{apply:true,confirmPlanSha256:plan.planSha256});assert.equal(resumed.writes,0);
  console.log('PASS Restarting the real adapter proves completion and performs no duplicate root writes');
 }finally{await env.cleanup();await fs.rm(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
