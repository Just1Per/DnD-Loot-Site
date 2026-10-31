'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser);
  await page.evaluate(async()=>{
   auditSeed('player');testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');sheetSession.data.profile.lifestyle='  Modest  ';sheetSession.data.coins.gp=42;sheetSession.data.experience='6500';renderCharacterSheet();readSheetForm();sheetSession.dirty=false;
   window.lifestyleUntouched=JSON.stringify({coins:sheetSession.data.coins,xp:sheetSession.data.experience,inventory,items});
  });
  await page.locator('#sheetStyle').selectOption('adobe');
  const host=page.locator('#sheetAdobeView'),choose=id=>host.locator('#adobePage').selectOption(id),field=id=>host.locator('[data-pdf-field="'+id+'"]');
  await choose('page-4');await field('Lifestyle').waitFor({state:'visible'});
  assert.equal(await field('Lifestyle').evaluate(node=>node.tagName),'SELECT');
  assert.equal(await field('Lifestyle').inputValue(),'modest');assert.equal(await field('Lifestyle daily cost').inputValue(),'1 gp');
  assert.equal(await page.evaluate(()=>sheetSession.data.profile.lifestyle),'  Modest  ');assert.equal(await page.evaluate(()=>sheetSession.dirty),false);
  for(const [id,cost]of [['wretched','—'],['squalid','1 sp'],['poor','2 sp'],['modest','1 gp'],['comfortable','2 gp'],['wealthy','4 gp'],['aristocratic','10 gp min.']]){
   await field('Lifestyle').selectOption(id);assert.equal(await page.evaluate(()=>sheetSession.data.profile.lifestyle),id);assert.equal(await field('Lifestyle daily cost').inputValue(),cost);assert.equal(await field('Lifestyle daily cost').evaluate(node=>node.scrollHeight<=node.clientHeight+1),true);assert.equal(await page.locator('[name="profile.lifestyle"]').inputValue(),id);assert.match(await page.locator('#sheetLifestyleCost').textContent(),/Daily cost:/);
  }
  await choose('template-ASbackgr');await field('Lifestyle').waitFor({state:'visible'});assert.equal(await field('Lifestyle').inputValue(),'aristocratic');assert.equal(await field('Lifestyle daily cost').inputValue(),'10 gp min.');
  await page.evaluate(()=>CharacterAdobeView.openEditor('story'));
  const shared=page.locator('[name="profile.lifestyle"]');await shared.locator('..').evaluate(node=>node.closest('details').open=true);
  assert.equal(await page.locator('#sheetLifestyleOptions option').count(),7);await shared.fill('Guild lodging by agreement');await shared.press('Tab');assert.match(await page.locator('#sheetLifestyleCost').textContent(),/Custom lifestyle/);
  await page.getByRole('button',{name:'Close editor',exact:true}).click();assert.equal(await field('Lifestyle').inputValue(),'Guild lodging by agreement');assert.equal(await field('Lifestyle daily cost').inputValue(),'');assert.equal(await field('Lifestyle').locator('option:checked').textContent(),'Guild lodging by agreement');
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty).catch(async error=>{console.log(await page.evaluate(()=>({status:document.getElementById('sheetStatus')?.textContent,dirty:sheetSession.dirty,saving:sheetSession.saving,invalid:[...document.querySelectorAll('[aria-invalid=true]')].map(node=>({name:node.name,error:node.dataset.error}))})));throw error});await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});await choose('page-4');await field('Lifestyle').waitFor({state:'visible'});assert.equal(await field('Lifestyle').inputValue(),'Guild lodging by agreement');assert.equal(await field('Lifestyle daily cost').inputValue(),'');
  await field('Lifestyle').selectOption('comfortable');assert.equal(await field('Lifestyle daily cost').inputValue(),'2 gp');
  assert.equal(await page.evaluate(()=>JSON.stringify({coins:sheetSession.data.coins,xp:sheetSession.data.experience,inventory,items})),await page.evaluate(()=>lifestyleUntouched));
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});await field('Lifestyle').scrollIntoViewIfNeeded();await host.locator('#adobePaper').screenshot({path:'/tmp/campaignatlas-ui-checks/adobe-lifestyle-page.png'});const box=await field('Lifestyle').locator('..').boundingBox(),price=await field('Lifestyle daily cost').locator('..').boundingBox();await page.screenshot({path:'/tmp/campaignatlas-ui-checks/adobe-lifestyle-detail.png',clip:{x:box.x-8,y:Math.min(box.y,price.y)-8,width:price.x+price.width-box.x+16,height:Math.max(box.y+box.height,price.y+price.height)-Math.min(box.y,price.y)+16}});const beforePrint=await page.evaluate(()=>JSON.stringify(sheetSession.data));await page.evaluate(()=>{window.lifestylePrintCalls=0;window.print=()=>lifestylePrintCalls++});await host.locator('#adobePrintConnected').click();await page.waitForFunction(()=>lifestylePrintCalls===1,null,{timeout:25000});const printed=host.locator('.adobe-print-batch>[data-print-page="page-4"]');assert.equal(await printed.locator('[data-pdf-field="Lifestyle"]').inputValue(),'comfortable');assert.equal(await printed.locator('[data-pdf-field="Lifestyle daily cost"]').inputValue(),'2 gp');
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});const pdf='/tmp/campaignatlas-ui-checks/adobe-lifestyles.pdf';await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});const text=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});assert.match(text,/Comfortable/);assert.match(text,/2\s+gp/);assert.equal(await page.evaluate(()=>JSON.stringify(sheetSession.data)),beforePrint);await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await field('Lifestyle').selectOption('');assert.equal(await field('Lifestyle daily cost').inputValue(),'');assert.equal(await page.evaluate(()=>sheetSession.data.profile.lifestyle),'');
  assert.deepEqual(errors,[]);console.log('PASS original lifestyle choices/daily costs, common free-text suggestions and custom preservation, continuation background, read-only projection, save/reopen, real PDF and coin/XP/inventory isolation');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
