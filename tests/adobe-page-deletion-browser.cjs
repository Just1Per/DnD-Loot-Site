'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const P=require('../js/modules/character-adobe-stack-plan');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser,{adobeOnly:true});
  await page.route('**/data/adobe-pages/**',async route=>{await new Promise(resolve=>setTimeout(resolve,75));await route.fallback();});
  await page.evaluate(async()=>{
   auditSeed('player');characters[0].level=4;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
   const d=sheetSession.data;Object.assign(d.build,{edition:'2014',classId:'wizard',race:'human'});
   d.adobe.classLevels=[{classId:'wizard',level:3},{classId:'warlock',level:1}];d.adobe.pages={spells:true,companion:true,rules:false};
   const empty=CharacterAdobeEngine.normalize().companions[0];d.adobe.companions=[{...empty,name:'REMOVED_COMPANION_MARKER',notes:'Retained first creature notes.'},{...empty,name:'VISIBLE_COMPANION_MARKER',notes:'Retained second creature notes.'}];
   d.adobe.journal=[{id:'a',title:'First',category:'General',text:'Visible first note.'},{id:'b',title:'Second',category:'General',text:'Visible second note.'},{id:'c',title:'Continuation',category:'General',text:'REMOVED_NOTE_MARKER'}];
   d.backstory='REMOVED_BACKGROUND_MARKER';d.hpCurrent=9;d.coins.gp=27;d.slots[0].used=1;
   renderCharacterSheet();readSheetForm();
   window.pageDeleteKept=JSON.parse(JSON.stringify({data:sheetSession.data,inventory,items},(key,value)=>key==='pageLayout'?undefined:value));
  });
  const host=page.locator('#sheetAdobeView'),manager=page.locator('#adobePagesDialog'),confirmation=page.locator('#siteConfirmationDialog');
  const paper=plan=>host.locator('[data-continuous-key='+JSON.stringify(P.key(plan))+']');
  const open=async()=>{
   if(page.viewportSize().width>800)await host.locator('.adobe-continuous-rail [data-stack-add]').click();
   else await host.locator('.adobe-continuous-mobile [data-stack-add]').click();
   await manager.waitFor({state:'visible'});
  };
  const done=()=>manager.locator('[data-pages-close]').last().click();
  const removeButton=title=>manager.getByRole('button',{name:'Delete '+title+' page',exact:true});
  const approve=()=>confirmation.locator('[data-site-confirm]').click();
  const save=async()=>{await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);};
  const kept=()=>page.evaluate(()=>JSON.parse(JSON.stringify({data:sheetSession.data,inventory,items},(key,value)=>key==='pageLayout'?undefined:value)));
  await host.locator('[data-continuous-page="page-1"]:not([aria-busy="true"]) .paper').waitFor({state:'visible'});
  // A manually added page is actually removed, rather than left as a hidden row.
  await open();await manager.locator('[data-pages-tab="add"]').click();await manager.locator('summary').click();await manager.locator('[data-add-page="template-blank"]').click();
  const blank=paper({page:'template-blank'});await blank.locator('.paper').waitFor({state:'visible'});await blank.locator('[data-paper-options]').press('Enter');
  const menu=page.locator('#adobePageActionsMenu');await menu.getByRole('menuitem',{name:/Delete this page/}).click();
  assert.match(await confirmation.textContent(),/contents stay with this character/);await confirmation.locator('[data-site-cancel]').click();assert.equal(await blank.count(),1);
  await blank.locator('[data-paper-options]').click();await menu.getByRole('menuitem',{name:/Delete this page/}).click();await approve();await blank.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>sheetSession.data.adobe.pageLayout.added.some(p=>p.page==='template-blank')),false);
  assert.equal(await page.evaluate(()=>sheetSession.data.adobe.pageLayout.deleted.some(p=>p.page==='template-blank')),true);
  // Exact companion/caster/note instances are independent. A hidden page is deletable too.
  await open();assert.equal(await manager.getByRole('switch',{name:'Show Blank page',exact:true}).count(),0);
  await removeButton('Companion · REMOVED_COMPANION_MARKER').click();await approve();await removeButton('Companion · REMOVED_COMPANION_MARKER').waitFor({state:'detached'});
  await removeButton('Wizard · Spell sheet').click();await approve();await removeButton('Wizard · Spell sheet').waitFor({state:'detached'});
  const noteKey=P.key({page:'template-ASnotes',notesOffset:2});
  const removeNote=manager.locator('[data-page-delete='+JSON.stringify(noteKey)+']');await removeNote.click();await approve();await removeNote.waitFor({state:'detached'});
  await manager.getByRole('switch',{name:'Show Background & appearance',exact:true}).uncheck();await removeButton('Background & appearance').click();await approve();await removeButton('Background & appearance').waitFor({state:'detached'});
  await manager.getByRole('switch',{name:'Show Feats, magic items & extra gear',exact:true}).uncheck();await manager.locator('[data-pages-print]').check();await done();
  assert.equal(await paper({page:'template-AScomp',companionIndex:0}).count(),0);assert.equal(await paper({page:'template-AScomp',companionIndex:1}).count(),1);
  assert.equal(await paper({page:'template-SSfront',spellCaster:'wizard'}).count(),0);assert.equal(await paper({page:'template-SSfront',spellCaster:'warlock'}).count(),1);
  assert.equal(await paper({page:'template-ASnotes',notesOffset:2}).count(),0);
  await page.evaluate(()=>{fillSheetForm();updateSheetCalculations();});assert.equal(await paper({page:'page-4'}).count(),0);assert.deepEqual(await kept(),await page.evaluate(()=>pageDeleteKept));
  await save();await page.evaluate(async()=>{closeCharacterSheet(true);localStorage.clear();await openCharacterSheet('c1');});
  await host.locator('[data-continuous-page="page-1"]:not([aria-busy="true"]) .paper').waitFor({state:'visible'});
  assert.equal(await paper({page:'template-blank'}).count(),0);assert.equal(await paper({page:'page-4'}).count(),0);assert.equal(await paper({page:'template-AScomp',companionIndex:0}).count(),0);assert.deepEqual(await kept(),await page.evaluate(()=>pageDeleteKept));
  // Include hidden pages still excludes deleted pages and their print continuations.
  await page.evaluate(()=>{window.pageDeletePrints=0;window.print=()=>pageDeletePrints++;});await paper({page:'page-1'}).locator('[data-paper-print]').click();await page.waitForFunction(()=>pageDeletePrints===1,null,{timeout:30000});
  assert.equal(await host.locator('.adobe-print-batch [data-print-page="page-3"]').count(),1);
  assert.equal(await host.locator('.adobe-print-batch [data-print-page="page-4"]').count(),0);assert.equal(await host.locator('.adobe-print-batch [data-print-page="template-blank"]').count(),0);
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});const pdf='/tmp/campaignatlas-ui-checks/adobe-deleted-pages.pdf';await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
  const printed=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});assert.doesNotMatch(printed,/REMOVED_COMPANION_MARKER|REMOVED_BACKGROUND_MARKER|REMOVED_NOTE_MARKER/);assert.match(printed,/VISIBLE_COMPANION_MARKER/);await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  // Restoration has a separate Add pages entry, including an exact removed caster.
  await open();await manager.locator('[data-pages-tab="add"]').click();assert.equal(await manager.locator('[data-page-restore]').count(),5);
  await manager.getByRole('button',{name:'Add Companion · REMOVED_COMPANION_MARKER again',exact:true}).click();await paper({page:'template-AScomp',companionIndex:0}).locator('.paper').waitFor({state:'visible'});
  await open();await manager.locator('[data-pages-tab="add"]').click();await manager.locator('[data-page-restore='+JSON.stringify(noteKey)+']').click();await paper({page:'template-ASnotes',notesOffset:2}).locator('[data-pdf-field="Notes.Left"]').waitFor({state:'visible'});assert.equal(await paper({page:'template-ASnotes',notesOffset:2}).locator('[data-pdf-field="Notes.Left"]').inputValue(),'REMOVED_NOTE_MARKER');
  await open();await manager.locator('[data-pages-tab="add"]').click();await manager.getByRole('button',{name:'Add Wizard · Spell sheet again',exact:true}).click();await paper({page:'template-SSfront',spellCaster:'wizard'}).locator('.paper').waitFor({state:'visible'});assert.deepEqual(await kept(),await page.evaluate(()=>pageDeleteKept));
  // Phone controls retain touch targets and a separately labeled Delete action.
  await page.setViewportSize({width:390,height:844});await open();await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
  assert.deepEqual(await page.evaluate(async()=>(await axe.run(document.getElementById('adobePagesDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  assert.equal(await manager.evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);assert.ok(await removeButton('Notes').evaluate(n=>n.getBoundingClientRect().height>=44));
  await page.screenshot({path:'/tmp/campaignatlas-ui-checks/adobe-delete-pages-mobile.png'});await removeButton('Notes').click();await confirmation.waitFor({state:'visible'});await confirmation.locator('[data-site-cancel]').click();
  // Last visible page is protected, while hidden rows can still be removed.
  for(const input of await manager.getByRole('switch').all())if(await input.isChecked()&&await input.isEnabled())await input.uncheck();
  assert.equal(await host.locator('[data-stack-page]').count(),1);assert.equal(await manager.locator('[data-page-delete]:disabled').count(),1);await manager.getByRole('switch',{name:'Show Character & combat',exact:true}).check();await done();
  await save();await open();const snapshot=await page.evaluate(()=>JSON.stringify(sheetSession.data));await removeButton('Notes').click();await confirmation.waitFor({state:'visible'});
  await page.evaluate(()=>auth.currentUser={uid:'other'});await approve();assert.equal(await page.evaluate(()=>JSON.stringify(sheetSession.data)),snapshot);await page.evaluate(()=>auth.currentUser={uid:'player'});
  // A confirmation from a closed sheet is dismissed and cannot edit the reopened sheet.
  await removeButton('Notes').click();const stale=await confirmation.locator('[data-site-confirm]').elementHandle();await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1');window.pageDeleteReopened=JSON.stringify(sheetSession.data);});assert.equal(await confirmation.count(),0);
  await stale.evaluate(n=>n.click());assert.equal(await page.evaluate(()=>JSON.stringify(sheetSession.data)),await page.evaluate(()=>pageDeleteReopened));assert.deepEqual(errors,[]);
  console.log('PASS page menu and manager deletion/Cancel, distinct hidden/deleted behavior, exact companion/caster/note restoration, retained character data/resources, cross-device save/reopen, recalculation, all-page real PDF, last-page guard, mobile/axe and stale/auth confirmation guards');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
