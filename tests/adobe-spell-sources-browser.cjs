'use strict';
const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser);
  await page.evaluate(async()=>{
   auditSeed('player');testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
   const d=sheetSession.data;d.build.edition='2014';d.build.classId='sorcerer';d.build.race='high-elf';d.build.cantrip='';d.adobe.classLevels=[{classId:'sorcerer',level:3,subclassId:'draconic-bloodline'}];sheetSession.identity.level=3;renderCharacterSheet();readSheetForm();
  });
  await page.locator('#sheetStyle').selectOption('adobe');
  const host=page.locator('#sheetAdobeView'),first=host.locator('[data-continuous-page="page-1"]'),menu=page.locator('#adobeSpecialFeaturesMenu'),sources=page.locator('#adobeSpellSourcesDialog'),race=page.locator('#adobeRaceSpellDialog');
  const special=first.locator('[data-special-features]');
  await special.waitFor({state:'visible'});assert.equal(await special.count(),1);
  await special.click();await menu.waitFor({state:'visible'});await menu.locator('[data-flyout-id="sheet"]').click();await menu.locator('[data-flyout-depth="1"] [data-flyout-id="spells"]').click();
  await sources.waitFor({state:'visible'});assert.match(await sources.textContent(),/Class spells/);await sources.locator('[data-spell-source-step="race"]').click();assert.match(await sources.locator('[data-spell-source-body]').textContent(),/Race spells/);await sources.locator('[data-spell-source-race]').click();
  await race.waitFor({state:'visible'});assert.match(await race.textContent(),/High elf spells/);
  const choice=race.locator('[data-race-spell-cantrip]');assert.ok(await choice.locator('option',{hasText:'Fire Bolt'}).count());await choice.selectOption('Fire Bolt');await race.locator('[data-race-spell-apply]').click();
  assert.equal(await page.evaluate(()=>sheetSession.data.build.cantrip),'Fire Bolt');assert.ok(await page.evaluate(()=>CharacterSheetModel.derive(sheetSession.data,3,sheetEquipmentLoot()).effects.innate.some(text=>text.startsWith('Fire Bolt'))));
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});await first.locator('[data-pdf-field="HP Current"]').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>sheetSession.data.build.cantrip),'Fire Bolt');assert.deepEqual(errors,[]);
  console.log('PASS paper Special features source guide, dedicated High Elf racial cantrip dialog, source isolation and private save/reopen');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
