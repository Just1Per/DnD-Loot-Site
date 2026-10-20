const {test}=require('node:test'),assert=require('node:assert/strict');
let A,M,digest,stableJson;
const ready=Promise.all([import('../scripts/prepare-authorized-library-migration.mjs'),import('../scripts/item-catalogue-migration.mjs'),import('../scripts/build-srd-item-hashes.mjs'),import('../scripts/audit-item-catalogue.mjs')]).then(([a,m,h,j])=>{A=a;M=m;digest=h.digest;stableJson=j.stableJson;});
function fixture(){
 const documents=['a','b'].map(id=>({name:`projects/dnd-loot-site/databases/(default)/documents/items/${id}`,updateTime:'2026-10-19T10:00:00Z',fields:M.encodeFields({name:'Synthetic '+id,description:'PRIVATE ORIGINAL '+id})}));
 const proposals={format:1,kind:'complete-catalogue-decision-proposals',status:'unapproved',referenceRevision:'synthetic-reference',decisions:documents.map((row,index)=>({id:index?'b':'a',sourceSha256:M.fieldsHash(row.fields),action:index?'retire':'publish',approved:false,...index?{}:{replacement:{name:'Original replacement',description:'Synthetic authored replacement',edition:'2014'},rights:{license:'ORIGINAL',attribution:'Synthetic author',evidence:'Synthetic independent authorship'}}}))};
 const authorization={format:1,method:'owner-delegated-recommendations',destination:'owner-private-library',recordedAt:'2026-10-19',source:'Synthetic owner instruction',instruction:'Adopt the complete pinned recommendations',proposalSha256:digest(stableJson(proposals)),referenceRevision:proposals.referenceRevision,counts:{total:2,publish:1,retire:1},reviewedBy:'Recommendations adopted under synthetic owner delegation',artwork:'Synthetic owner instruction to preserve generated artwork'};
 const snapshot={format:1,project:'dnd-loot-site',collection:'items',scope:'complete-root',completeRootCatalogue:true,documents};
 return {proposals,authorization,snapshot};
}
test('explicit delegation adopts the exact recommendations without claiming an individual owner review',async()=>{
 await ready;const f=fixture(),r=A.authorizedLibraryPlan(f.proposals,f.snapshot,f.authorization,{ownerId:'owner',now:'2026-10-19T10:00:00Z'});
 assert.equal(r.plan.allApproved,true);assert.equal(M.assertPlan(r.plan).destination.type,'private-library');assert.equal(r.manifest.targetCampaignId,undefined);assert.equal(r.manifest.targetLibraryOwnerId,'owner');
 assert.equal(r.manifest.retireLegacyArtwork,true);assert.equal(r.manifest.decisions[0].replacement.description,'Synthetic authored replacement');assert.equal(r.manifest.decisions[1].action,'retire');
 assert.ok(r.manifest.decisions.every(row=>row.approved&&row.reviewedBy===f.authorization.reviewedBy));assert.match(r.manifest.note,/not an assertion/);assert.equal(r.summary.productionWrites,0);assert.equal(f.proposals.decisions[0].approved,false);
});
test('changed recommendations, absent delegation and changed/added/missing/duplicated live records stop plan preparation',async()=>{
 await ready;const f=fixture(),run=(proposals=f.proposals,snapshot=f.snapshot,authorization=f.authorization)=>A.authorizedLibraryPlan(proposals,snapshot,authorization,{ownerId:'owner'});
 assert.throws(()=>run(f.proposals,f.snapshot,{}),/delegation/);
 const changed=structuredClone(f.proposals);changed.decisions[0].replacement.description='Changed after approval';assert.throws(()=>run(changed),/Recommendations changed/);
 for(const edit of [s=>s.documents[0].fields.description=M.encode('Changed source'),s=>s.documents.pop(),s=>s.documents.push({...s.documents[0],name:s.documents[0].name+'-new'}),s=>s.documents[1]=s.documents[0],s=>s.completeRootCatalogue=false]){const snapshot=structuredClone(f.snapshot);edit(snapshot);assert.throws(()=>run(f.proposals,snapshot));}
 assert.throws(()=>run(f.proposals,f.snapshot,{...f.authorization,counts:{total:2,publish:2,retire:0}}),/counts/);
});
test('read-only preparation resolves the owner, preserves the snapshot and emits a shareable preflight without prose',async()=>{
 await ready;const f=fixture(),saved=new Map(),calls=[];
 const port={inspectTarget:async id=>{calls.push('identify:'+id);return {ownerId:'owner'};},listSources:async()=>f.snapshot.documents,verifyTarget:async plan=>{assert.equal(plan.ownerId,'owner');calls.push('verify-owner');},verifyExistingCampaigns:async()=>{},isCompleted:async()=>false,inspectArtwork:async()=>[],backup:async()=>{throw Error('Preparation must not back up or mutate');}};
 const storage={sourceBucket:'demo-source',archiveBucket:'demo-private-archive'};
 const result=await A.prepareAuthorizedRun(f.proposals,f.authorization,port,{campaignId:'existing-campaign',storage,save:async(name,data)=>saved.set(name,data),now:'2026-10-19T10:00:00Z'});
 assert.deepEqual(result.plan.storage,storage);assert.deepEqual(result.status.storage,storage);M.assertPlan(result.plan);
 assert.equal(result.status.ready,true);assert.equal(result.status.preflight.writes,0);assert.equal(result.status.productionWrites,0);assert.equal(saved.size,4);assert.deepEqual(calls,['identify:existing-campaign','verify-owner']);
 assert.equal(JSON.stringify(result.status).includes('PRIVATE ORIGINAL'),false);assert.equal(JSON.stringify(result.status).includes('Synthetic authored replacement'),false);
 assert.ok(saved.get('root-snapshot.json').completeRootCatalogue);assert.equal(saved.get('authorized-decisions.json').decisions[1].approved,true);
 await assert.rejects(A.prepareAuthorizedRun(f.proposals,f.authorization,port,{campaignId:'campaign',ownerId:'owner',save:async()=>{}}),/either/);
});
test('bundled owner delegation still pins all 659 unchanged recommendations',async()=>{
 await ready;const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
 const proposals=JSON.parse(fs.readFileSync(path.join(root,'docs/reports/item-catalogue-decisions.json'),'utf8'));
 const authorization=JSON.parse(fs.readFileSync(path.join(root,'docs/reports/catalogue-recommendation-authorization.json'),'utf8'));
 assert.equal(digest(stableJson(proposals)),authorization.proposalSha256);
 assert.deepEqual(authorization.counts,{total:659,publish:302,retire:357});
 assert.equal(proposals.decisions.length,659);
});
