const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const batch=read('docs/reports/item-replacements-batch-01.json');
const report=read('docs/reports/item-catalogue-review-2026-10-16.json');
const reference=read('data/rules/srd-magic-item-text-hashes.json');
const ready=Promise.all([import('../scripts/prepare-srd-replacement-batch.mjs'),import('../scripts/build-srd-item-hashes.mjs'),import('../scripts/item-catalogue-migration.mjs'),import('../scripts/audit-item-catalogue.mjs')]);

test('all twelve proposals bind real audit items and selected licensed references without granting approval',async()=>{
 const [B,H,,A]=await ready;
 assert.equal(batch.decisions.length,12);
 assert.equal(new Set(batch.decisions.map(row=>row.id)).size,12);
 assert.equal(batch.status,'awaiting-owner-review');
 assert.equal(batch.sourceReviewSha256,H.digest(A.stableJson(report)));
 assert.equal(batch.referenceRevision,reference.revision);
 assert.equal(batch.targetCampaignId,undefined);
 assert.equal(batch.retireLegacyArtwork,undefined);
 for(const row of batch.decisions){
  const original=report.records.find(record=>record.id===row.id);
  const source=reference.entries.find(entry=>entry.id===row.review.referenceId&&entry.edition===row.replacement.edition);
  assert.equal(row.sourceSha256,original.recordSha256);
  assert.ok(original.references.some(entry=>entry.id===source.id&&entry.edition===source.edition));
  assert.equal(row.rights.referenceSha256,source.descriptionSha256);
  assert.equal(row.review.replacementDescriptionSha256,H.digest(H.normalizedText(row.replacement.description)));
  assert.equal(row.approved,false);assert.equal(row.reviewedBy,'');assert.equal(row.reviewedAt,'');
  assert.equal(row.rights.license,'CC-BY-4.0');
  assert.ok(row.rights.sourceUrl.includes(reference.revision));
  assert.match(row.rights.attribution,/Wizards of the Coast LLC/);
  assert.match(row.rights.attribution,/Changes:/);
  assert.equal(row.replacement.source,'SRD '+(source.edition==='2014'?'5.1':'5.2'));
  for(const key of ['imageUrl','imageBaseId','thumbnailUrl','thumbUrl','catalogueStatus'])assert.equal(row.replacement[key],undefined);
  assert.equal(row.replacement.quote,'');assert.deepEqual(row.replacement.properties,[]);
 }
 assert.equal(batch.decisions.filter(row=>row.replacement.edition==='2024').length,2);
 assert.equal(fs.readFileSync(path.join(root,'docs/reports/item-replacements-batch-01.md'),'utf8'),B.renderBatch(batch));
});

test('replacement variants retain healing, attunement and equipment bonuses independently of display names',()=>{
 const E=require('../js/modules/character-equipment.js');
 const byId=id=>batch.decisions.find(row=>row.id===id).replacement;
 for(const [id,dice] of [['healing','2d4 + 2'],['greater-healing','4d4 + 4'],['superior-healing','8d4 + 8'],['supreme-healing','10d4 + 20']])assert.ok(byId('potion-of-'+id).description.includes(dice));
 for(const bonus of [1,2,3]){
  const item=byId('longsword-plus-'+bonus),mechanics=E.infer(item);
  assert.equal(mechanics.attackBonus,bonus);assert.equal(mechanics.damageBonus,bonus);
  assert.equal(E.profile(mechanics,'2024').edition,'2014');
  assert.equal(E.profile(mechanics,'2024').mastery,'');
 }
 for(const bonus of [1,2]){
  const shield=E.infer(byId('shield-plus-'+bonus));assert.equal(shield.kind,'shield');assert.equal(shield.acBonus,bonus);
  assert.equal(shield.edition,'2024');
 }
 assert.equal(batch.decisions.some(row=>row.id==='chain-mail-plus-1'),false);
 assert.deepEqual(batch.decisions.filter(row=>row.replacement.attunement).map(row=>row.id),['cloak-of-protection']);
});

test('every replacement passes the existing migration payload contract, but unapproved apply is refused before any port access',async()=>{
 const [,,M,A]=await ready;
 const project='demo-vault-test';
 // Synthetic originals only: never fabricate a production snapshot or bypass its source hashes.
 const documents=batch.decisions.map(row=>({name:`projects/${project}/databases/(default)/documents/items/${row.id}`,
  updateTime:'2026-10-18T10:00:00.000000Z',fields:M.encodeFields({name:'Synthetic original',description:'Synthetic private fixture',imageUrl:'https://example.invalid/old-art',legacyOnly:'Must not leak'})}));
 const decisions=batch.decisions.map((row,index)=>({...structuredClone(row),sourceSha256:M.fieldsHash(documents[index].fields)}));
 const snapshot={project,collection:'items',completeRootCatalogue:true,documents};
 const manifest={format:1,artworkPolicy:{mode:'preserve-generated',origin:'ChatGPT-generated',evidence:'Synthetic owner instruction'},targetCampaignId:'synthetic-target',retireLegacyArtwork:false,decisions};
 const plan=M.buildMigrationPlan(snapshot,manifest,{project,campaignId:'synthetic-target',campaignName:'Synthetic test campaign',ownerId:'synthetic-owner'});
 assert.equal(M.assertPlan(plan),plan);assert.equal(plan.allApproved,false);
 for(const item of plan.items){
  const replacement=Object.fromEntries(Object.entries(item.replacement).map(([key,value])=>[key,A.decodeValue(value)]));
  assert.equal(replacement.imageUrl,'https://example.invalid/old-art');assert.equal(replacement.imageBaseId,item.id);
  assert.equal(replacement.artwork.status,'generated');assert.equal(replacement.artwork.origin,'ChatGPT-generated');
  assert.equal(replacement.legacyOnly,undefined);assert.equal(replacement.review,undefined);
  assert.equal(replacement.rights.reviewedBy,'');assert.equal(replacement.rights.reviewedAt,'');
 }
 const port=new Proxy({},{get(){assert.fail('Unapproved apply must fail before accessing a live port');}});
 await assert.rejects(M.migrateCatalogue(plan,port,{apply:true,confirmPlanSha256:plan.planSha256}),/explicitly approved/);
 assert.throws(()=>M.buildMigrationPlan(snapshot,batch,{project,campaignId:'synthetic-target',campaignName:'Synthetic',ownerId:'synthetic-owner'}),/target campaign mismatch/);
});

async function sourceFixture(){
 const [B,H]=await ready;
 const sources=['2014','2024'].map(edition=>({edition,
  document:JSON.stringify([{pk:'srd-'+edition,fields:{name:'System Reference Document '+(edition==='2014'?'5.1':'5.2'),licenses:['cc-by-40'],publisher:'wizards-of-the-coast',permalink:'https://example.test/srd'}}]),
  items:JSON.stringify(B.selections.filter(selection=>selection.edition===edition).map(selection=>({model:'api_v2.magicitem',pk:selection.referenceId,fields:{
   document:'srd-'+edition,name:selection.mechanics?.kind==='weapon'?`Longsword (+${selection.mechanics.attackBonus})`:selection.mechanics?.kind==='shield'?`Shield (+${selection.mechanics.acBonus})`:'Synthetic '+selection.id,
   desc:'Synthetic licensed fixture '+(selection.healing||'text'),rarity:selection.rarity,requires_attunement:selection.id==='cloak-of-protection',
   category:selection.healing?'potion':selection.mechanics?.kind==='weapon'?'weapon':selection.mechanics?'armor':'wondrous-item',
   weapon:selection.mechanics?.kind==='weapon'?'srd_longsword':null,armor:selection.mechanics?.kind==='shield'?'srd-2024_shield':null}})))}));
 return {sources,index:H.buildReference(sources)};
}

test('offline builder verifies complete source bytes and licence metadata before proposing content',async()=>{
 const [B]=await ready;const {sources,index}=await sourceFixture();
 const fixtureReport=structuredClone(report);
 const generated=B.buildBatch(fixtureReport,sources,index);
 assert.equal(generated.decisions.length,12);assert.ok(generated.decisions.every(row=>!row.approved));
 const altered=structuredClone(sources);altered[0].items+=' ';
 assert.throws(()=>B.buildBatch(fixtureReport,altered,index),/checksum mismatch/);
 assert.throws(()=>B.verifySources([sources[0],sources[0]],index),/one source per edition/);
 const alteredIndex=structuredClone(index);alteredIndex.entries[0].descriptionSha256='0'.repeat(64);
 assert.throws(()=>B.buildBatch(fixtureReport,sources,alteredIndex),/index differs/);
 const wrongLicence=structuredClone(sources);
 wrongLicence[0].document=wrongLicence[0].document.replace('cc-by-40','all-rights-reserved');
 assert.throws(()=>B.verifySources(wrongLicence,index),/checksum mismatch/);
});

test('builder refuses missing variants, edition mismatches, ineligible originals and incomplete reports',async()=>{
 const [B,H]=await ready;const {sources,index}=await sourceFixture();
 for(const mutate of [r=>{r.records=r.records.filter(row=>row.id!=='potion-of-healing');},r=>{r.records.find(row=>row.id==='shield-plus-1').references=[];},r=>{r.records.find(row=>row.id==='bag-of-holding').recommendation='withhold-current';},r=>{r.completeRootCatalogue=false;}]){
  const changed=structuredClone(report);mutate(changed);
  assert.throws(()=>B.buildBatch(changed,sources,index),/Missing eligible|absent from review|Complete matching/);
 }
 const changed=structuredClone(sources),items=JSON.parse(changed[0].items);
 items.find(row=>row.pk==='srd_longsword-1').fields.rarity='legendary';changed[0].items=JSON.stringify(items);
 assert.throws(()=>B.buildBatch(report,changed,H.buildReference(changed)),/variant facts/);
});
