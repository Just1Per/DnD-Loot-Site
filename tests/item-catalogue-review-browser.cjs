const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const ready=Promise.all([import('../scripts/build-item-catalogue-review.mjs'),import('../scripts/build-srd-item-hashes.mjs'),import('../scripts/audit-item-catalogue.mjs'),read('docs/reports/item-catalogue-decisions.json'),read('docs/reports/item-catalogue-review-2026-10-16.json')]);

test('visual bundle includes licensed proposals and safe metadata while excluding original prose and unreviewed artwork',async()=>{
 const [B,,,proposals,legacy]=await ready,original=structuredClone(legacy);
 original.records[0].description='PRIVATE ORIGINAL MUST NOT BE BUNDLED';original.records[0].imageUrl='https://example.invalid/?token=PRIVATE_ART_TOKEN';
 const {digest}=await import('../scripts/build-srd-item-hashes.mjs'),{stableJson}=await import('../scripts/audit-item-catalogue.mjs');
 const changed=structuredClone(proposals);changed.sourceReviewSha256=digest(stableJson(original));
 const payload=B.reviewPayload(changed,original),serialized=JSON.stringify(payload);
 assert.equal(payload.items.length,659);assert.equal(payload.items.filter(row=>row.replacement).length,302);
 assert.doesNotMatch(serialized,/PRIVATE ORIGINAL MUST NOT BE BUNDLED|PRIVATE_ART_TOKEN/);
 const art=structuredClone(changed);art.decisions.find(row=>row.action==='publish').replacement.imageUrl='https://example.invalid/art';
 assert.throws(()=>B.reviewPayload(art,original),/Unreviewed replacement fields/);
 assert.throws(()=>B.reviewPayload(changed,legacy),/metadata does not match/);
});

test('all items are readable offline; review notes survive reload and export/import without contacting Firebase',async()=>{
 const [B,,,proposals,legacy]=await ready,tmp=await fs.mkdtemp(path.join(os.tmpdir(),'catalogue-review-page-'));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
 try{
  const file=path.join(tmp,'review.html');await fs.writeFile(file,await B.buildReviewHtml(proposals,legacy));
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],remote=[];
  const fixture='https://review.example.test/catalogue.html';
  await page.route(fixture,async route=>route.fulfill({contentType:'text/html',body:await fs.readFile(file,'utf8')}));
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url())&&request.url()!==fixture)remote.push(request.url());});
  await page.goto(fixture);
  assert.match(await page.locator('#summary').textContent(),/659 items.*302 proposed replacements.*357 proposed withholdings.*0 \/ 659 reviewed/);
  assert.equal(await page.locator('[data-item-id]').count(),25);
  await page.locator('#search').fill('Bag of Holding');await page.locator('[data-item-id=bag-of-holding]').click();
  assert.match(await page.locator('[data-replacement-text]').textContent(),/500 pounds/);
  assert.match(await page.locator('[data-source-link]').getAttribute('href'),/https:\/\/github.com\/open5e\/open5e-api\/blob\/0acbf263/);
  await page.locator('#reviewer').fill('Synthetic owner review');await page.locator('[data-verdict=accept]').click();
  await page.locator('#item-note').fill('Keep the explicitly selected 2014 edition.');
  assert.match(await page.locator('#summary').textContent(),/1 \/ 659 reviewed/);
  await page.reload();await page.locator('#search').fill('Bag of Holding');await page.locator('[data-item-id=bag-of-holding]').click();
  assert.equal(await page.locator('[data-verdict=accept]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#item-note').inputValue(),'Keep the explicitly selected 2014 edition.');
  const downloadEvent=page.waitForEvent('download');await page.locator('#export-notes').click();const download=await downloadEvent;
  const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  assert.equal(exported.kind,'catalogue-review-notes');assert.equal(exported.productionWrites,0);assert.equal(exported.reviews.length,1);
  assert.equal(exported.reviews[0].id,'bag-of-holding');assert.equal(exported.reviews[0].decision,'accept');
  assert.equal(exported.reviews[0].replacement,undefined);assert.equal(exported.reviews[0].approved,undefined);
  await page.locator('[data-verdict=revise]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#import-notes').setInputFiles({name:'notes.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
  await page.waitForFunction(()=>document.getElementById('action-status').textContent.includes('Matching review notes imported'));
  assert.equal(await page.locator('[data-verdict=accept]').getAttribute('aria-pressed'),'true');
  const wrong=structuredClone(exported);wrong.proposalSetSha256='0'.repeat(64);
  await page.locator('#import-notes').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(wrong))});
  await page.waitForFunction(()=>document.getElementById('action-status').textContent.includes('Could not import'));
  assert.equal(await page.locator('[data-verdict=accept]').getAttribute('aria-pressed'),'true');
  await page.locator('#proposal-filter').selectOption('retire');await page.locator('#search').fill('Eye of Vecna');await page.locator('[data-item-id=eye-of-vecna]').click();
  assert.equal(await page.locator('[data-replacement-text]').count(),0);assert.match(await page.locator('#item-detail').textContent(),/Why this version is withheld/);
  await page.locator('#proposal-filter').selectOption('');await page.locator('#search').fill('');await page.locator('#reason-filter').selectOption('normalized-armor-rarity-needs-verification');
  assert.match(await page.locator('#result-count').textContent(),/^34 matching items$/);
  await page.locator('#reason-filter').selectOption('');await page.locator('#status-filter').selectOption('accept');assert.match(await page.locator('#result-count').textContent(),/^1 matching items$/);
  await page.locator('#status-filter').selectOption('pending');await page.locator('#next-pending').click();
  assert.equal(await page.locator('[data-item-id][aria-current=true]').count(),1);
  await page.addScriptTag({content:require('axe-core').source});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Review fits '+width+' px');
   const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(row=>({id:row.id,targets:row.nodes.map(node=>node.target)})));
   assert.deepEqual(violations,[]);
  }
  await page.screenshot({path:'/tmp/campaignatlas-item-review-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.locator('#status-filter').selectOption('');await page.locator('#search').fill('Potion of Healing');await page.locator('[data-item-id=potion-of-healing]').click();
  await page.screenshot({path:'/tmp/campaignatlas-item-review-desktop.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 }finally{await browser.close();await fs.rm(tmp,{recursive:true,force:true});}
});

test('catalogue labels render as text and blocked browser storage still permits review-note download',async()=>{
 const [B,H,A,P,L]=await ready,proposals=structuredClone(P),legacy=structuredClone(L),attack='</script><img src=x onerror="window.untrustedExecuted=true">';
 legacy.records[0].name=attack;proposals.sourceReviewSha256=H.digest(A.stableJson(legacy));
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'catalogue-review-escape-')),browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
 try{
  const file=path.join(tmp,'escaped.html');await fs.writeFile(file,await B.buildReviewHtml(proposals,legacy));
  const page=await browser.newPage({acceptDownloads:true});
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Storage disabled');};});
  const fixture='https://review.example.test/catalogue.html';
  await page.route(fixture,async route=>route.fulfill({contentType:'text/html',body:await fs.readFile(file,'utf8')}));
  await page.goto(fixture);
  assert.ok((await page.locator('#item-detail').textContent()).includes(attack));assert.equal(await page.locator('img').count(),0);
  assert.equal(await page.evaluate(()=>window.untrustedExecuted),undefined);
  assert.match(await page.locator('#storage-status').textContent(),/cannot save notes automatically/);
  await page.locator('[data-verdict=unsure]').click();const event=page.waitForEvent('download');await page.locator('#export-notes').click();
  assert.equal(JSON.parse(await fs.readFile(await (await event).path(),'utf8')).reviews[0].decision,'unsure');
 }finally{await browser.close();await fs.rm(tmp,{recursive:true,force:true});}
});
