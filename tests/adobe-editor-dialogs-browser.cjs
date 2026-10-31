'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser);
 await page.evaluate(async()=>{auditSeed('player');characters[0].level=5;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');sheetSession.data.build.edition='2024';sheetSession.data.build.classId='wizard';sheetSession.data.build.background='acolyte';sheetSession.data.adobe.classLevels=[{classId:'wizard',level:5}];renderCharacterSheet();});
 await page.locator('#sheetStyle').selectOption('adobe');
 const host=page.locator('#sheetAdobeView'),editor=page.locator('#adobeSharedEditor');
 await host.locator('[data-pdf-field="PC Name"]').waitFor({state:'visible'});
 await host.locator('#adobeTools').evaluate(n=>n.open=true);
 const commands=await host.locator('#adobeEditor option').evaluateAll(nodes=>nodes.map(n=>n.value));
 assert.ok(commands.includes('equipment')&&commands.includes('companion')&&commands.includes('origins'));
 for(const command of commands){
  await host.locator('#adobeEditor').selectOption(command);await host.locator('#adobeOpenEditor').click();
  await page.waitForFunction(()=>!!document.querySelector('dialog[open]'));
  assert.equal(await host.isVisible(),true,command+' keeps the Adobe paper visible behind the popup');
  assert.equal(await page.locator('#sheetStyle').inputValue(),'adobe');
  assert.equal(await page.locator('#characterSheetForm').getAttribute('data-sheet-style'),'adobe');
  if(await editor.count()){
   assert.equal(await editor.evaluate(n=>n.tagName),'DIALOG');
   assert.equal(await editor.locator('.sheet-body [data-sheet-section]:visible').count(),1);
   assert.equal(await editor.locator('#sheetSave').count(),1,'same Save controller is available inside popup');
   assert.equal(await page.locator('#characterSheetForm>.sheet-body:visible').count(),0);
  }
  // Opening the scrollable panel may put a help badge under the pointer.
  // Test Escape for the editor with that independent tooltip dismissed.
  await page.evaluate(()=>SiteHelp.hide());
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('dialog[open]')).catch(async error=>{console.error(command,await page.evaluate(()=>({open:[...document.querySelectorAll('dialog[open]')].map(n=>n.id),status:document.getElementById('sheetStatus')?.textContent,invalid:[...document.querySelectorAll('[aria-invalid="true"]')].map(n=>n.name||n.id)})));throw error;});
  assert.equal(await page.locator('#characterSheetForm>.sheet-body').count(),1,'original controls restored once');
  assert.equal(await page.locator('#sheetSave').count(),1);
  assert.equal(await host.isVisible(),true);
 }
 // Real original source control opens the popup, saves with the existing button,
 // retains focus, and supports a nested searchable dropdown without navigating.
 await host.locator('#adobePage').selectOption('page-4');await host.locator('[data-pdf-button="Portrait"]').click();await editor.waitFor({state:'visible'});
 const detail=editor.locator('#sheetBackgroundDetail');
 if(await detail.count()){await detail.fill('A private detail through the Adobe popup');await detail.press('Tab');}
 await editor.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
 assert.match(await editor.locator('.adobe-editor-status').textContent(),/saved/i);
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#adobeSharedEditor')),true,'native modal keeps keyboard focus inside');}
 fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});await page.screenshot({path:'/tmp/campaignatlas-ui-checks/adobe-editor-dialog-desktop.png'});
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
 assert.deepEqual(await page.evaluate(async()=>(await axe.run(document.getElementById('adobeSharedEditor'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[]);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.equal(await editor.evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);await page.screenshot({path:'/tmp/campaignatlas-ui-checks/adobe-editor-dialog-mobile.png'});
 await editor.locator('[data-adobe-editor-close]').click();
 await page.evaluate(()=>CharacterAdobeView.openEditor('origins'));await editor.waitFor({state:'visible'});
 const dropdown=editor.locator('select:visible:not(:disabled)').first();await dropdown.focus();await page.keyboard.press('Enter');await page.locator('#adobeChoiceDialog').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await editor.isVisible(),true);await page.keyboard.press('Escape');
 await page.evaluate(()=>selectSheetTab('rules'));await host.locator('[data-pdf-field]').first().waitFor({state:'attached'});assert.equal(await host.isVisible(),true);assert.equal(await page.locator('#characterSheetForm>.sheet-body:visible').count(),0);
 await page.evaluate(()=>selectSheetTab('unknown-future-section'));assert.equal(await host.isVisible(),true);assert.equal(await page.locator('#characterSheetForm>.sheet-body:visible').count(),0);
 await page.evaluate(()=>CharacterAdobeView.openEditor('inventory'));await editor.waitFor({state:'visible'});await page.evaluate(()=>closeCharacterSheet(true));assert.equal(await editor.count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS every Adobe tools destination stays on paper or opens a modal, original portrait, shared save/status, focus/close/restoration, nested choices, mobile/axe, rules/unknown routing and session disposal');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1});
