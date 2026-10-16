const {test}=require('node:test');
const assert=require('node:assert/strict');
let M,A;const ready=Promise.all([import('../scripts/item-catalogue-migration.mjs'),import('../scripts/audit-item-catalogue.mjs')]).then(([m,a])=>{M=m;A=a;});
function fixture(approved=true){
 const project='demo-vault-test',prefix=`projects/${project}/databases/(default)/documents/`;
 const documents=['a','b'].map(id=>({name:prefix+'items/'+id,updateTime:'2026-10-16T10:00:00.000000Z',fields:M.encodeFields({name:'Synthetic '+id,description:'Private original '+id,imageUrl:'',mechanics:{kind:'weapon',attackBonus:1},unknownOriginalField:'Retain me'})}));
 const snapshot={project,collection:'items',documents};
 const manifest={format:1,targetCampaignId:'target',retireLegacyArtwork:true,decisions:documents.map((doc,i)=>({id:i?'b':'a',sourceSha256:M.fieldsHash(doc.fields),action:i?'retire':'publish',approved,reviewedBy:'Owner review',reviewedAt:'2026-10-16T12:00:00Z',...(i?{}:{replacement:{name:'Independently written item',description:'Our synthetic test text.',category:'Weapon'},rights:{license:'ORIGINAL',attribution:'Original test author',evidence:'Authored for this synthetic test'}})}))};
 const plan=M.buildMigrationPlan(snapshot,manifest,{project,campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'});
 return {snapshot,manifest,plan};
}
function portFor(plan){
 const sources=new Map(plan.items.map(item=>[item.id,structuredClone(item.source)])),copies=new Map(),completed=new Set(),events=[];
 const port={
  verifyTarget:async()=>events.push('target'),verifyExistingCampaigns:async()=>events.push('legacy'),listSources:async()=>[...sources.values()],readSource:async id=>sources.get(id),
  isCompleted:async(_p,item)=>completed.has(item.id),inspectArtwork:async()=>[],
  backup:async()=>events.push('backup'),copyAndVerifyArtwork:async()=>{events.push('artwork');return [];},assetsForItem:async()=>[],
  copyPrivate:async(_p,item,documents)=>{events.push('copy:'+item.id);copies.set(item.id,documents);},
  verifyPrivate:async(_p,item)=>{assert.ok(copies.has(item.id));events.push('verified:'+item.id);},
  verifyNoNewSources:async()=>events.push('checked-new'),
  publishOrRetire:async(_p,item)=>{events.push('root:'+item.id);if(item.action==='retire')sources.delete(item.id);else sources.set(item.id,{...item.source,fields:item.replacement});completed.add(item.id);},
  retireArtwork:async()=>events.push('retire-art'),verifyFinal:async()=>events.push('final')
 };
 return {port,sources,copies,completed,events};
}
test('offline plans bind project, campaign, owner, source fields and original revisions',async()=>{
 await ready;const {snapshot,manifest,plan}=fixture();assert.ok(M.assertPlan(plan));
 assert.throws(()=>M.buildMigrationPlan(snapshot,manifest,{project:'demo-other',campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'}),/same project/);
 const changed=structuredClone(snapshot);changed.documents[0].fields.description=M.encode('Edited');assert.throws(()=>M.buildMigrationPlan(changed,manifest,{project:snapshot.project,campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'}),/digest mismatch/);
 assert.throws(()=>M.buildMigrationPlan({...snapshot,completeRootCatalogue:false},manifest,{project:snapshot.project,campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'}),/public subset/);
 const duplicate=structuredClone(manifest);duplicate.decisions[1].id='a';assert.throws(()=>M.buildMigrationPlan(snapshot,duplicate,{project:snapshot.project,campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'}),/duplicate/);
 const edited=structuredClone(plan);edited.items[0].source.fields.name=M.encode('Other');assert.throws(()=>M.assertPlan(edited),/digest mismatch/);
});
test('dry runs never call backup, Storage copies, publication or deletion',async()=>{
 await ready;const {plan}=fixture(false),h=portFor(plan);const result=await M.migrateCatalogue(plan,h.port);
 assert.equal(result.dryRun,true);assert.equal(result.writes,0);assert.equal(result.allApproved,false);assert.deepEqual(h.events,['target','legacy']);assert.equal(h.sources.size,2);
 await assert.rejects(M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256}),/explicitly approved/);
});
test('applying requires explicit digest confirmation and a reviewed artwork retirement decision',async()=>{
 await ready;const {plan}=fixture(),h=portFor(plan);await assert.rejects(M.migrateCatalogue(plan,h.port,{apply:true}),/digest confirmation/);
});
test('all private copies verify before any root mutation, without supply or inventory writes',async()=>{
 await ready;const {plan}=fixture(),h=portFor(plan),gear={id:'existing',quantity:3,itemId:'old',mechanics:{attackBonus:2}};const unchanged=structuredClone(gear);
 const result=await M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256});
 assert.equal(result.writes,2);assert.ok(h.events.indexOf('verified:b')<h.events.indexOf('root:a'));assert.ok(h.events.indexOf('backup')<h.events.indexOf('copy:a'));assert.ok(h.events.indexOf('retire-art')>h.events.indexOf('root:b'));
 assert.equal(A.decodeValue(h.copies.get('a').copy.visible),false);assert.equal(A.decodeValue(h.copies.get('a').copy.lootMode),'dm');assert.equal(A.decodeValue(h.copies.get('a').archive.original).unknownOriginalField,'Retain me');assert.deepEqual(gear,unchanged);
 assert.equal(h.sources.has('b'),false);assert.equal(A.decodeValue(h.sources.get('a').fields.catalogueStatus),'approved-v1');assert.equal(A.decodeValue(h.sources.get('a').fields.artwork).status,'none');
});
test('backup, private asset or copy verification failure cannot retire a root item',async()=>{
 await ready;
 for(const failing of ['backup','copyAndVerifyArtwork','verifyPrivate']){const {plan}=fixture(),h=portFor(plan);h.port[failing]=async()=>{throw Error('Injected failure')};await assert.rejects(M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256}),/Injected failure/);assert.equal(h.sources.size,2);assert.ok(!h.events.some(event=>event.startsWith('root:')));}
});
test('stale and newly added source documents abort before any backup or mutation',async()=>{
 await ready;
 for(const mode of ['changed','new']){const {plan}=fixture(),h=portFor(plan);if(mode==='changed')h.sources.get('b').updateTime='new';else h.sources.set('new',{name:plan.items[0].source.name.replace('/a','/new')});await assert.rejects(M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256}),/Source changed|New root items/);assert.ok(!h.events.includes('backup'));}
});
test('a proved completed run resumes without duplicating private items or root writes',async()=>{
 await ready;const {plan}=fixture(),h=portFor(plan);await M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256});const copies=h.copies.size;
 const result=await M.migrateCatalogue(plan,h.port,{apply:true,confirmPlanSha256:plan.planSha256});assert.equal(result.writes,0);assert.equal(h.copies.size,copies);
});
test('publication rejects legacy assets, extra prose and absent rights evidence',async()=>{
 await ready;const {snapshot,manifest}=fixture();
 for(const mutate of [d=>d.replacement.imageUrl='https://example.invalid/image',d=>d.replacement.quote='Unreviewed quotation',d=>delete d.rights.evidence]){const copy=structuredClone(manifest);mutate(copy.decisions[0]);assert.throws(()=>M.buildMigrationPlan(snapshot,copy,{project:snapshot.project,campaignId:'target',campaignName:'Synthetic campaign',ownerId:'owner'}),/unreviewed|removed|evidence/);}
});
test('the decision worksheet cannot automatically approve or apply editorial recommendations',async()=>{
 await ready;const {draftManifest}=await import('../scripts/prepare-item-review-manifest.mjs');
 const report={format:1,records:[{id:'a',name:'Synthetic item',recordSha256:'a'.repeat(64),recommendation:'keep-concept-with-srd',references:[]}]};
 const draft=draftManifest(report,'target');assert.equal(draft.decisions[0].action,'review');assert.equal(draft.decisions[0].approved,false);assert.equal(draft.retireLegacyArtwork,false);
 assert.throws(()=>draftManifest({...report,completeRootCatalogue:false},'target'),/complete root/);
});
