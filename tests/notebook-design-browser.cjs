const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const html=await fs.readFile(path.join(__dirname,'../design/world-notebook.html'),'utf8');
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  const fixture='https://notebook.example.test/';await page.route(fixture,route=>route.fulfill({contentType:'text/html',body:html}));
  page.on('request',request=>{if(request.url()!==fixture&&/^https?:/.test(request.url()))requests.push(request.url());});
  await page.goto(fixture);assert.equal(await page.locator('input[type=search]').count(),0);
  await page.locator('#add-category').click();await page.locator('#category-name').fill('Religion');await page.locator('#category-form button[type=submit]').click();
  assert.match(await page.locator('.category[aria-pressed=true]').textContent(),/Religion0/);
  await page.locator('#new-entry').click();await page.locator('#page-title').fill('The Dawn Faith');await page.locator('#page-body').fill('A faith of kindness.');
  await page.locator('#private-notes').fill('SECRET: the keeper is missing.');
  const image={name:'illustration.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64')};
  await page.locator('#image-upload').setInputFiles(image);await page.waitForSelector('#draft-image');await page.locator('#image-caption').fill('A lamp at sunrise');
  assert.equal(await page.locator('#share-image').isDisabled(),true);
  await page.locator('#save-draft').click();await page.locator('#preview-page').click();assert.match(await page.locator('#preview-body').textContent(),/Nothing is shared yet/);await page.locator('#close-preview').click();
  await page.locator('#share-page').click();await page.locator('#preview-page').click();assert.equal(await page.locator('#preview-body img').count(),0);assert.doesNotMatch(await page.locator('#preview-body').textContent(),/SECRET|keeper/);await page.locator('#close-preview').click();
  await page.locator('#share-image').click();await page.locator('#preview-page').click();assert.equal(await page.locator('#preview-body img').count(),1);assert.match(await page.locator('#preview-body').textContent(),/lamp at sunrise/);await page.locator('#close-preview').click();
  await page.locator('#page-body').fill('PRIVATE DRAFT DESCRIPTION');await page.locator('#image-caption').fill('PRIVATE DRAFT CAPTION');await page.locator('#save-draft').click();
  await page.locator('#preview-page').click();assert.match(await page.locator('#preview-body').textContent(),/faith of kindness/);assert.doesNotMatch(await page.locator('#preview-body').textContent(),/PRIVATE DRAFT/);await page.locator('#close-preview').click();
  await page.locator('#share-image').click();await page.locator('#preview-page').click();assert.match(await page.locator('#preview-body').textContent(),/PRIVATE DRAFT CAPTION/);assert.doesNotMatch(await page.locator('#preview-body').textContent(),/PRIVATE DRAFT DESCRIPTION/);await page.locator('#close-preview').click();
  await page.locator('#hide-image').click();await page.locator('#preview-page').click();assert.equal(await page.locator('#preview-body img').count(),0);assert.match(await page.locator('#preview-body').textContent(),/faith of kindness/);await page.locator('#close-preview').click();
  await page.locator('#share-image').click();await page.locator('#hide-page').click();await page.locator('#share-page').click();await page.locator('#preview-page').click();assert.equal(await page.locator('#preview-body img').count(),0);await page.locator('#close-preview').click();
  assert.equal(await page.locator('#private-notes').inputValue(),'SECRET: the keeper is missing.');assert.equal(await page.locator('#draft-image').count(),1);
  console.log('PASS Notebook creation and independent text/image sharing; saving drafts never publishes notes or image edits; hiding the page hides both');
  await page.locator('#image-upload').setInputFiles({...image,buffer:Buffer.from('invalid raster bytes')});await page.locator('#save-status').filter({hasText:'could not be opened'}).waitFor();
  assert.equal(await page.locator('#draft-image').count(),1);
  await page.locator('#image-upload').setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg></svg>')});assert.match(await page.locator('#save-status').textContent(),/Choose a PNG/);
  for(const section of ['people','encounters']){
   await page.locator('[data-section='+section+']').click();await page.locator('[data-stat=ac]').fill('19');await page.locator('#private-actions').fill('SECRET ATTACK AND TACTICS');await page.locator('#share-page').click();await page.locator('#preview-page').click();assert.doesNotMatch(await page.locator('#preview-body').textContent(),/SECRET ATTACK|Stat block|Armor class/);await page.locator('#close-preview').click();
  }
  console.log('PASS Invalid uploads keep existing art; NPCs and encounters retain detailed private stat blocks excluded from player previews');
  await page.locator('#reset-demo').click();await page.addScriptTag({content:require('axe-core').source});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual((await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations)).map(row=>({id:row.id,targets:row.nodes.map(node=>node.target)})),[]);
   if(process.env.NOTEBOOK_SCREENSHOT_DIR){await fs.mkdir(process.env.NOTEBOOK_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.NOTEBOOK_SCREENSHOT_DIR,'notebook-'+width+'.png'),fullPage:true});}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('PASS Notebook fits desktop and mobile, passes WCAG checks, has no browser errors and makes no external requests');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
