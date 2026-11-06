'use strict';
const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser,{legacyPresentation:true});
  await page.evaluate(async()=>{
   auditSeed('player');characters[0].level=5;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
   const data=sheetSession.data;data.build.edition='2014';data.build.classId='fighter';data.build.race='human';data.build.scoreMode='final';data.adobe.classLevels=[{classId:'fighter',level:5}];data.abilities.str=16;data.saves.str.bonus=2;data.skills.arcana.rank=2;renderCharacterSheet();readSheetForm();
  });
  await page.locator('#sheetStyle').selectOption('adobe');
  const paper=page.locator('#sheetAdobeView'),field=id=>paper.locator('[data-pdf-field="'+id+'"]').first(),dialog=page.locator('#sheetModifierDialog');
  await field('Str ST Mod').waitFor({state:'visible'});assert.equal(await field('Str ST Mod').inputValue(),'+8');
  await paper.locator('[data-special-features]').click();const menu=page.locator('#adobeSpecialFeaturesMenu');await menu.waitFor({state:'visible'});assert.match(await menu.textContent(),/Character choices/);await menu.locator('[data-flyout-close]').click();
  await field('Str ST Mod').click({modifiers:['Shift']});await dialog.waitFor({state:'visible'});assert.equal(await dialog.locator('[data-modifier-target]').inputValue(),'save.str');
  await dialog.locator('[data-modifier-expression]').fill('2+Str');assert.match(await dialog.locator('[data-modifier-result]').textContent(),/New total: 11/);await dialog.locator('[data-modifier-apply]').click();assert.equal(await field('Str ST Mod').inputValue(),'+11');
  await paper.locator('#adobeModifiers').evaluate(node=>node.click());await dialog.locator('[data-modifier-target]').selectOption('skill.arcana');await dialog.locator('[data-modifier-expression]').fill('Prof');await dialog.locator('[data-modifier-apply]').click();assert.equal(await field('Arc').inputValue(),'+9');
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});
  await field('Str ST Mod').waitFor({state:'visible'});assert.equal(await field('Str ST Mod').inputValue(),'+11');assert.equal(await field('Arc').inputValue(),'+9');assert.deepEqual(errors,[]);
  console.log('PASS modifier formulas persist through save/reopen and Special features replaces Sheet tools');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
