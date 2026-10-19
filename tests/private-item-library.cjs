const {test}=require('node:test'),assert=require('node:assert/strict');
let M,L;const ready=Promise.all([import('../scripts/item-catalogue-migration.mjs'),import('../scripts/private-item-library.mjs')]).then(([m,l])=>{M=m;L=l});
function template(){return {name:'projects/demo-vault-test/databases/(default)/documents/privateItemLibraries/owner/templates/test',updateTime:'2026-10-19T10:00:00Z',fields:M.encodeFields({ownerId:'owner',reuseStatus:'reviewed-template',assets:[],item:{name:'Original item',description:'Independently written text',rights:{license:'ORIGINAL',attribution:'Test author',evidence:'Synthetic evidence',reviewedBy:'Test owner',reviewedAt:'2026-10-19T10:00:00Z'}}})};}
const options={project:'demo-vault-test',ownerId:'owner',entryId:'test',campaignId:'campaign',campaignName:'Exact campaign',requestId:'test-request'};
test('library migration requires its own explicit destination and cannot silently retarget a campaign manifest',async()=>{
 await ready;
 const source={name:'projects/demo-vault-test/databases/(default)/documents/items/test',updateTime:'2026-10-19T10:00:00Z',fields:M.encodeFields({name:'Original',description:'Private text'})};
 const snapshot={project:'demo-vault-test',collection:'items',documents:[source]};
 const manifest={format:1,targetLibraryOwnerId:'owner',artworkPolicy:{mode:'preserve-generated',origin:'ChatGPT-generated',evidence:'Synthetic owner assertion'},decisions:[{id:'test',sourceSha256:M.fieldsHash(source.fields),action:'retire',approved:false}]};
 const plan=M.buildMigrationPlan(snapshot,manifest,{project:'demo-vault-test',libraryOwnerId:'owner'});
 assert.equal(M.assertPlan(plan).campaignId,undefined);assert.equal(plan.destination.type,'private-library');
 const original=M.privateDocuments(plan,plan.items[0]);assert.equal(original.copy.reuseStatus.stringValue,'archive-only');assert.equal(original.template,undefined);
 assert.equal(M.fieldsHash(original.archive.original.mapValue.fields),M.fieldsHash(source.fields));
 await assert.rejects(M.migrateCatalogue(plan,{}, {apply:true,confirmPlanSha256:plan.planSha256}),/explicitly approved/);
 assert.throws(()=>M.buildMigrationPlan(snapshot,{...manifest,targetCampaignId:'old-campaign'},{project:'demo-vault-test',libraryOwnerId:'owner'}),/explicitly target/);
 assert.throws(()=>M.buildMigrationPlan(snapshot,manifest,{project:'demo-vault-test',libraryOwnerId:'owner',campaignId:'old-campaign'}),/only the exact library/);
});
test('manual import pins source version, exact own-campaign identity and a confirmed immutable plan',async()=>{
 await ready;const plan=L.buildLibraryImportPlan(template(),options);assert.equal(L.assertLibraryImportPlan(plan),plan);
 assert.throws(()=>L.assertLibraryImportPlan({...plan,campaignName:'Different campaign'}),/changed/);
 let calls=0;const port={importLibraryTemplate:async(_p,{apply})=>{calls++;return {writes:apply?1:0}}};
 await assert.rejects(L.importLibraryTemplate(plan,port,{apply:true}),/digest confirmation/);assert.equal(calls,0);
 assert.equal((await L.importLibraryTemplate(plan,port)).writes,0);
 assert.equal((await L.importLibraryTemplate(plan,port,{apply:true,confirmPlanSha256:plan.planSha256})).writes,1);
});
test('archives, unreviewed rights, public URLs and cross-library image references cannot become reusable imports',async()=>{
 await ready;
 const original=template();assert.throws(()=>L.buildLibraryImportPlan({...original,name:original.name.replace('/templates/','/originals/')},options),/exact versioned/);
 for(const edit of [doc=>doc.fields.reuseStatus=M.encode('archive-only'),doc=>doc.fields.item.mapValue.fields.rights.mapValue.fields.evidence=M.encode(''),doc=>doc.fields.item.mapValue.fields.imageUrl=M.encode('https://example.test/unreviewed.png'),doc=>doc.fields.assets=M.encode([{privatePath:'private-item-library-images/other/'+'a'.repeat(64)+'/'+'b'.repeat(64),sha256:'b'.repeat(64)}])]){
  const doc=template();edit(doc);assert.throws(()=>L.buildLibraryImportPlan(doc,options));
 }
});
