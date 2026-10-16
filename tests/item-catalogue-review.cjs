const {test}=require('node:test');
const assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib');
let review,hash;
const ready=Promise.all([import('../scripts/review-item-catalogue.mjs'),import('../scripts/build-srd-item-hashes.mjs')]).then(([r,h])=>{review=r;hash=h.digest;});
const ref=()=>({format:1,revision:'test-reference',documents:[{license:'CC-BY-4.0'}],entries:[{id:'licensed-test-shield',edition:'2014',name:'Test Shield, +1',nameKey:'test shield, +1',descriptionSha256:hash('Independently written test prose.')}]});
const row=(id,name,source,extra={})=>({id,data:{name,source,description:'Synthetic item test wording.',...extra}});
test('a generic bonus or SRD name never approves current copied text or images',async()=>{
 await ready;const report=review.reviewCatalogue([row('shield','Test Shield (+1)',"Dungeon Master's Guide"),row('ring','Generic Ring +2','Unknown')],ref());
 assert.equal(report.records[0].recommendation,'rewrite-or-review');
 const shield=report.records.find(r=>r.id==='shield');assert.equal(shield.recommendation,'keep-concept-with-srd');assert.equal(shield.references[0].id,'licensed-test-shield');
 assert.ok(report.records.every(r=>r.approved===false&&r.sharingApproved===false));assert.equal(report.counts.currentTextExactSrd,0);
});
test('distinctive paid-source names cannot be cleared by a +1 suffix; homebrew needs evidence',async()=>{
 await ready;const report=review.reviewCatalogue([row('a','Vecna’s Special Relic +1',"Dungeon Master's Guide"),row('b','My Original Trinket','Homebrew'),row('c','Unlisted Trinket',"Tasha's Cauldron of Everything")],ref());
 assert.equal(report.records[0].recommendation,'withhold-current');assert.equal(report.records[1].recommendation,'rewrite-or-review');assert.equal(report.records[2].recommendation,'withhold-current');
 assert.equal(report.counts.withholdCurrent,2);assert.equal(report.counts.approved,0);
});
test('review output and annotation transport preserve metadata while excluding original prose and asset URLs',async()=>{
 await ready;const report=review.reviewCatalogue([row('a','My Item','Homebrew',{description:'PRIVATE SYNTHETIC DESCRIPTION',quote:'PRIVATE QUOTE',imageUrl:'https://example.invalid/?token=PRIVATE',properties:[{title:'PRIVATE TITLE',text:'PRIVATE PROPERTY'}]})],ref());
 const json=JSON.stringify(report),md=review.reviewMarkdown(report);for(const marker of ['PRIVATE SYNTHETIC','PRIVATE QUOTE','PRIVATE PROPERTY','PRIVATE TITLE','token=PRIVATE'])assert.ok(!json.includes(marker)&&!md.includes(marker));
 const chunks=review.annotationChunks(report);const content=chunks.map(x=>x.split('::').at(-1).split(':').slice(1).join(':')).join('');assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(content,'base64'))),report);
 assert.ok(chunks.every(x=>x.length<18200));assert.ok(chunks.length<=10);assert.ok(md.includes('My Item'));
});
test('exact text candidates still require a separate decision and artwork review',async()=>{
 await ready;const report=review.reviewCatalogue([row('a','Test Shield, +1','SRD',{description:'Independently written test prose.'})],ref());assert.equal(report.counts.currentTextExactSrd,1);assert.equal(report.counts.approved,0);assert.equal(report.counts.artworkUnverified,1);
});
