const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const ready=Promise.all([import('../scripts/prepare-item-catalogue-decisions.mjs'),import('../scripts/item-catalogue-migration.mjs'),import('../scripts/audit-item-catalogue.mjs'),import('../scripts/build-srd-item-hashes.mjs'),read('docs/reports/item-catalogue-decisions.json')]);

test('all 659 original items have one explicit unapproved proposal with source evidence',async()=>{
 const [D,,A,H,P]=await ready,report=await read('docs/reports/item-catalogue-review-2026-10-16.json'),index=await read('data/rules/srd-magic-item-text-hashes.json');
 assert.equal(P.decisions.length,659);assert.equal(new Set(P.decisions.map(row=>row.id)).size,659);
 assert.deepEqual(P.counts,{total:659,publishProposals:302,retireProposals:357,approved:0,editions:{'2014':292,'2024':10},reasons:{'authorship-or-permission-needed':16,'licensed-rename-proposed':6,'licensed-replacement-proposed':296,'no-documented-replacement':306,'normalized-armor-rarity-needs-verification':34,'redundant-generic-template':1}});
 assert.equal(P.sourceReviewSha256,H.digest(A.stableJson(report)));
 for(const row of P.decisions){
  const original=report.records.find(item=>item.id===row.id);
  assert.equal(row.sourceSha256,original.recordSha256);assert.ok(['publish','retire'].includes(row.action));
  assert.equal(row.approved,false);assert.equal(row.reviewedBy,'');assert.equal(row.reviewedAt,'');
  if(row.action==='retire'){assert.equal(row.replacement,undefined);continue;}
  const source=index.entries.find(item=>item.id===row.review.referenceId&&item.edition===row.replacement.edition);
  assert.ok(original.references.some(item=>item.id===source.id&&item.edition===source.edition));
  assert.equal(row.rights.referenceSha256,source.descriptionSha256);
  assert.equal(row.review.replacementDescriptionSha256,H.digest(H.normalizedText(row.replacement.description)));
  assert.equal(row.rights.license,'CC-BY-4.0');assert.match(row.rights.attribution,/Wizards of the Coast LLC/);
  assert.match(row.rights.attribution,/Changes:/);assert.ok(row.rights.sourceUrl.includes(P.referenceRevision));
  for(const key of ['imageUrl','imageBaseId','thumbnailUrl','thumbUrl','catalogueStatus'])assert.equal(row.replacement[key],undefined);
  assert.deepEqual(row.replacement.properties,[]);assert.equal(row.replacement.quote,'');
  assert.equal(typeof row.replacement.attunement,'boolean');assert.doesNotMatch(row.replacement.description,/\\n|1\* foot/);
 }
 assert.equal(await fs.readFile(path.join(root,'docs/reports/item-catalogue-decisions.md'),'utf8'),D.renderDecisions(P));
});

test('uncertain armor is withheld; SRD renames and concrete variants remain explicit',async()=>{
 const [,,,,P]=await ready,byId=id=>P.decisions.find(row=>row.id===id);
 for(const row of P.decisions.filter(row=>row.review.reasonCode==='normalized-armor-rarity-needs-verification')){assert.equal(row.action,'retire');assert.equal(row.replacement,undefined);assert.ok(row.review.candidate.referenceId);}
 assert.equal(byId('shield-plus-1').action,'publish');assert.equal(byId('weapon-plus-1').action,'retire');
 assert.equal(byId('flame-tongue').replacement.name,'Flame Tongue (Longsword)');assert.ok(byId('flame-tongue').review.alternatives.length>1);
 assert.equal(byId('rope-of-climbing').replacement.edition,'2024');
 assert.equal(byId('hewards-handy-haversack').replacement.name,'Handy Haversack');
 assert.equal(byId('apparatus-of-kwalish').replacement.name,'Apparatus of the Crab');
 assert.equal(byId('velvet-bag-of-sand').replacement.name,'Marvelous Pigments');
 assert.equal(byId('wings-of-flying-rare').replacement.name,'Efficient Quiver');
 for(const id of ['eye-of-vecna','hand-of-vecna','aegis-link-shield'])assert.equal(byId(id).action,'retire');
});

test('plain-text conversion preserves rules text while removing transport formatting',async()=>{
 const [D]=await ready;
 assert.equal(D.plainDescription('Use **2d6** _fire_ damage.\\n\\nRead [spell](https://example.test/spell).\r\nDC 15.'),'Use 2d6 fire damage.\n\nRead spell.\nDC 15.');
 assert.equal(D.plainDescription('Line\\\\nnext'),'Line\nnext');
});

async function syntheticReview(){
 const [D,M,,,P]=await ready,proposals=structuredClone(P);
 const documents=proposals.decisions.map(row=>({name:`projects/dnd-loot-site/databases/(default)/documents/items/${row.id}`,
  updateTime:'2026-10-18T12:00:00.000000Z',fields:M.encodeFields({name:'Synthetic original '+row.id,description:'Private fixture text',imageUrl:'https://example.invalid/private?token=SYNTHETIC_DO_NOT_SHARE'})}));
 for(let i=0;i<documents.length;i++)proposals.decisions[i].sourceSha256=M.fieldsHash(documents[i].fields);
 const snapshot={format:1,project:'dnd-loot-site',collection:'items',completeRootCatalogue:true,documents};
 return {proposals,snapshot,worksheet:D.privateWorksheet(proposals,snapshot,'synthetic-campaign')};
}

test('all payloads fit the planner, while an unapproved worksheet cannot authorize apply',async()=>{
 const [D,M,A]=await ready,{proposals,snapshot,worksheet}=await syntheticReview();
 assert.equal(worksheet.decisions.length,659);assert.equal(worksheet.retireLegacyArtwork,false);
 assert.ok(worksheet.decisions.every(row=>row.approved===false&&!row.review&&!row.name));
 const plan=M.buildMigrationPlan(snapshot,worksheet,{project:'dnd-loot-site',campaignId:'synthetic-campaign',campaignName:'Synthetic fixture only',ownerId:'synthetic-owner'});
 assert.equal(M.assertPlan(plan),plan);assert.equal(plan.allApproved,false);
 for(const row of plan.items.filter(item=>item.action==='publish')){
  assert.equal(A.decodeValue(row.replacement.imageUrl),'https://example.invalid/private?token=SYNTHETIC_DO_NOT_SHARE');assert.equal(A.decodeValue(row.replacement.imageBaseId),row.id);assert.equal(A.decodeValue(row.replacement.artwork).status,'generated');
 }
 const port=new Proxy({},{get(){assert.fail('Unapproved apply must not access production services');}});
 await assert.rejects(M.migrateCatalogue(plan,port,{apply:true,confirmPlanSha256:plan.planSha256}),/explicitly approved/);
 const modified=structuredClone(proposals);modified.decisions[0].approved=true;modified.decisions[0].reviewedBy='Untrusted';
 assert.ok(D.privateWorksheet(modified,snapshot,'synthetic-campaign').decisions.every(row=>!row.approved&&!row.reviewedBy));
});

test('snapshot membership, project paths and field hashes must match the review',async()=>{
 const [D,M]=await ready,{proposals,snapshot}=await syntheticReview();
 for(const mutate of [s=>{s.documents.pop();},s=>{s.documents[0].fields.name=M.encode('Changed');},s=>{s.completeRootCatalogue=false;},s=>{s.documents[0].name=s.documents[0].name.replace('dnd-loot-site','another-project');},s=>{delete s.documents[0].updateTime;}]){
  const changed=structuredClone(snapshot);mutate(changed);assert.throws(()=>D.privateWorksheet(proposals,changed,'synthetic-campaign'),/membership changed|Source changed|complete production|paths and source/);
 }
 assert.throws(()=>D.privateWorksheet(proposals,snapshot,'bad/path'),/campaign ID/);
});

test('read-only capture keeps originals private and emits sanitized shareable status',async()=>{
 const [D,M]=await ready,{proposals,snapshot}=await syntheticReview(),saved=new Map(),calls=[];
 const target={campaignId:'synthetic-campaign',campaignName:'Synthetic fixture only',ownerId:'synthetic-owner',inventoryVersion:2};
 const port={inspectTarget:async id=>{assert.equal(id,target.campaignId);calls.push('target');return target;},listSources:async()=>{calls.push('sources');return snapshot.documents;}};
 const result=await D.captureReviewInputs(port,proposals,target.campaignId,async(name,data)=>{saved.set(name,data);});
 assert.deepEqual(calls,['target','sources']);assert.equal(result.productionWrites,0);assert.equal(result.worksheetPrepared,true);
 assert.equal(saved.get('root-snapshot.json').documents.length,659);
 assert.doesNotMatch(JSON.stringify(saved.get('shareable-review-status.json')),/Private fixture|SYNTHETIC_DO_NOT_SHARE|imageUrl|access_token/);
 const changed=structuredClone(snapshot.documents);changed[0].fields.name=M.encode('Changed');saved.clear();
 const result2=await D.captureReviewInputs({...port,listSources:async()=>changed},proposals,target.campaignId,async(name,data)=>{saved.set(name,data);});
 assert.equal(result2.reviewMatches,false);assert.equal(saved.has('item-decisions.json'),false);
 assert.deepEqual(saved.get('shareable-review-status.json').changes.changed,[proposals.decisions[0].id]);
});

test('private outputs reject the checkout, symlinks into it, and other Git checkouts',async()=>{
 const [D]=await ready,tmp=await fs.mkdtemp(path.join(os.tmpdir(),'catalogue-private-test-'));
 try{
  await assert.rejects(D.assertPrivateOutput(path.join(root,'private.json')),/outside the repository/);
  await fs.symlink(root,path.join(tmp,'linked'),'dir');await assert.rejects(D.assertPrivateOutput(path.join(tmp,'linked','private.json')),/outside the repository/);
  const other=path.join(tmp,'other');await fs.mkdir(other);await fs.mkdir(path.join(other,'.git'));await fs.writeFile(path.join(other,'.git','HEAD'),'ref: refs/heads/main\n');
  await assert.rejects(D.assertPrivateOutput(path.join(other,'private.json')),/every Git checkout/);
  assert.equal(await D.assertPrivateOutput(path.join(tmp,'private.json')),path.join(tmp,'private.json'));
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});

test('target inspection reads only the chosen campaign and rejects missing identity or malformed IDs',async()=>{
 const {createMigrationPort}=await import('../scripts/item-catalogue-migration-firebase.mjs');
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'catalogue-target-test-'));
 try{
  const urls=[];let fields={name:{stringValue:'Synthetic campaign'},ownerId:{stringValue:'synthetic-owner'},inventoryVersion:{integerValue:'2'}};
  const port=await createMigrationPort({project:'demo-vault-test',bucket:'demo.test',backupDirectory:temporary,services:{firestoreOrigin:'http://127.0.0.1:8080',bucket:{},credential:{getAccessToken:async()=>({access_token:'synthetic-test-only'})},fetcher:async(url,options)=>{urls.push(url);assert.equal(options.method,'GET');return {ok:true,status:200,json:async()=>({fields})};}}});
  assert.deepEqual(await port.inspectTarget('synthetic-campaign'),{campaignId:'synthetic-campaign',campaignName:'Synthetic campaign',ownerId:'synthetic-owner',inventoryVersion:2});
  assert.equal(urls.length,1);assert.ok(urls[0].endsWith('/campaigns/synthetic-campaign'));
  await assert.rejects(port.inspectTarget('../items'),/campaign ID/);assert.equal(urls.length,1);
  fields={};await assert.rejects(port.inspectTarget('missing'),/name\/owner are unavailable/);
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
});
