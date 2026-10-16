// Synthetic text fixtures; these are not publisher descriptions.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const load=()=>import('../scripts/audit-item-catalogue.mjs');
const build=()=>import('../scripts/build-srd-item-hashes.mjs');
const syntheticText='A lantern fills the old road with a gentle blue light.';
async function reference(){const {buildReference}=await build();return buildReference([{edition:'2014',document:JSON.stringify([{pk:'srd-2014',fields:{name:'Synthetic reference fixture',publisher:'wizards-of-the-coast',licenses:['cc-by-40'],permalink:'https://example.test/srd'}}]),items:JSON.stringify([{model:'api_v2.magicitem',pk:'test-lantern',fields:{document:'srd-2014',name:'Road Lantern',desc:syntheticText}}])}]);}
const row=(id,data)=>({id,data});
test('source-book names, SRD labels and claimed licence fields cannot approve copied prose',async()=>{
 const {auditCatalogue}=await load(),r=await reference();
 const report=auditCatalogue([row('wotc',{name:'Road Lantern',source:'SRD 5.1',licensedText:true,license:'CC-BY-4.0',description:'Different, unverified prose.'})],r);
 assert.equal(report.records[0].textStatus,'needs-text-review');assert.equal(report.records[0].sharingApproved,false);assert.equal(report.counts.sharingApproved,0);
});
test('an exact name/text match is evidence only; added prose and artwork still need review',async()=>{
 const {auditCatalogue}=await load(),r=await reference();
 const report=auditCatalogue([
  row('match',{name:'Road Lantern',description:syntheticText.replaceAll(' ','  ')}),
  row('extra',{name:'Road Lantern',description:syntheticText,properties:[{title:'Unreviewed bonus',text:'Additional source prose'}]}),
  row('quote',{name:'Road Lantern',description:syntheticText,quote:'A story fragment'}),
  row('name-only',{name:'Road Lantern',description:'Changed wording'})
 ],r);
 assert.equal(report.records.find(x=>x.id==='match').textStatus,'candidate-srd-text-match');
 assert.equal(report.records.find(x=>x.id==='extra').textStatus,'needs-text-review');
 assert.equal(report.records.find(x=>x.id==='quote').textStatus,'needs-text-review');
 assert.equal(report.records.find(x=>x.id==='name-only').candidateReferences.length,0);
 assert.ok(report.records.every(x=>x.reviewRequired&&!x.sharingApproved&&x.artworkStatus==='needs-artwork-review'));
});
test('reports contain metadata/hashes, never original descriptions, quotes or tokenized image URLs',async()=>{
 const {auditCatalogue}=await load();const original='PRIVATE PROSE SENTINEL',quote='QUOTE SENTINEL',url='https://images.example.test/secret?token=TOKEN_SENTINEL';
 const report=auditCatalogue([row('unknown',{name:'Original lantern',source:'Homebrew',description:original,quote,imageUrl:url,unusualNarrative:'Unreviewed'}),row('catalog_meta',{_type:'catalog-meta'})],await reference());
 const serialized=JSON.stringify(report);for(const secret of [original,quote,url,'TOKEN_SENTINEL'])assert.equal(serialized.includes(secret),false);
 assert.deepEqual(report.records[0].unreviewedFields,['unusualNarrative']);assert.equal(report.records[0].hasExplicitArtwork,true);
 assert.equal(report.counts.items,1);assert.equal(report.counts.metadataRecords,1);assert.equal(report.records[0].recordSha256.length,64);
});
test('unknown or absent sources remain visible for review; IDs and stable hashes reject ambiguity',async()=>{
 const {auditCatalogue,stableJson}=await load(),r=await reference();
 assert.equal(auditCatalogue([row('empty',{name:'Empty record'})],r).records[0].source,'(not recorded)');
 assert.throws(()=>auditCatalogue([row('duplicate',{}),row('duplicate',{})],r),/duplicate/);
 assert.throws(()=>auditCatalogue([row('bad/id',{})],r),/Invalid/);
 assert.equal(stableJson({b:2,a:{z:1,y:3}}),stableJson({a:{y:3,z:1},b:2}));
});
test('Firestore decoding retains nested data while rejecting non-root or unrelated paths',async()=>{
 const {documentsToRows}=await load();const docs=[{name:'projects/example/databases/(default)/documents/items/lantern',fields:{name:{stringValue:'Road Lantern'},properties:{arrayValue:{values:[{mapValue:{fields:{text:{stringValue:'Nested reference'}}}}]}},huge:{integerValue:'9007199254740993'}}}];
 const rows=documentsToRows(docs);assert.equal(rows[0].data.properties[0].text,'Nested reference');assert.deepEqual(rows[0].data.huge,{type:'integer',value:'9007199254740993'});
 assert.throws(()=>documentsToRows([{name:'projects/example/databases/(default)/documents/campaigns/private/items/x',fields:{}}]),/root item/);
});
test('the public reader uses only unauthenticated GETs and follows every page',async()=>{
 const {readPublicCatalogue}=await load();const calls=[];
 const source=await readPublicCatalogue('example-project',{fetcher:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>calls.length===1?{documents:[{name:'first'}],nextPageToken:'next+token'}:{documents:[{name:'second'}]}};}});
 assert.equal(source.documents.length,2);assert.equal(calls[0].url.origin,'https://firestore.googleapis.com');assert.ok(calls[0].url.pathname.endsWith('/documents/items'));
 assert.ok(calls.every(c=>c.options.method==='GET'&&!c.options.body&&!c.options.headers));assert.equal(calls[1].url.searchParams.get('pageToken'),'next+token');
});
test('public-reader errors and repeated pages cannot silently produce a partial report',async()=>{
 const {readPublicCatalogue}=await load();
 await assert.rejects(readPublicCatalogue('example-project',{fetcher:async()=>({ok:false,status:403})}),/No credentials/);
 await assert.rejects(readPublicCatalogue('example-project',{fetcher:async()=>({ok:true,json:async()=>({nextPageToken:'same'})})}),/Repeated/);
 await assert.rejects(readPublicCatalogue('example-project',{maxPages:1,fetcher:async()=>({ok:true,json:async()=>({nextPageToken:'more'})})}),/partial catalogue/);
 await assert.rejects(readPublicCatalogue('https://elsewhere.example/'),/Invalid/);
});
test('reference generation rejects non-CC sources and emits no publisher prose',async()=>{
 const r=await reference();assert.equal(r.entries[0].descriptionSha256.length,64);assert.equal(JSON.stringify(r).includes(syntheticText),false);
 const {buildReference}=await build();assert.throws(()=>buildReference([{edition:'2014',document:JSON.stringify([{pk:'srd-2014',fields:{licenses:['proprietary'],publisher:'wizards-of-the-coast'}}]),items:'[]'}]),/CC-BY/);
});
test('snapshot/report writing is private and refuses overwrites',async()=>{
 const {writePrivateFile}=await load(),directory=await fs.mkdtemp(path.join(os.tmpdir(),'dnd-audit-'));try{
 const file=path.join(directory,'report.json');await writePrivateFile(file,{metadata:true});assert.equal((await fs.stat(file)).mode&0o777,0o600);await assert.rejects(writePrivateFile(file,{metadata:false}),/EEXIST/);assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),{metadata:true});
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
