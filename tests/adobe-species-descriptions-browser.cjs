'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), {execFileSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const {page, errors} = await require('./adobe-browser-fixture.cjs')(browser, {adobeOnly:true});
    // Exercise lazy mounts with actual asynchronous template loading.
    await page.route('**/data/adobe-pages/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 75));
      await route.fallback();
    });
    await page.evaluate(async () => {
      auditSeed('player');
      characters[0].level = 4;
      testSheetDocs['campaigns/a/characters/c1'] = {...characters[0]};
      await openCharacterSheet('c1');
      Object.assign(sheetSession.data.build, {edition:'2014', classId:'fighter', race:'human'});
      sheetSession.data.adobe.classLevels = [{classId:'fighter', level:4}];
      renderCharacterSheet(); readSheetForm();
      const d = sheetSession.data;
      window.speciesKept = JSON.stringify({inventory, items, hp:d.hpCurrent, coins:d.coins, slots:d.slots});
    });
    const host = page.locator('#sheetAdobeView');
    const racial = host.locator('[data-continuous-page="page-2"] [data-pdf-field="Racial Traits"]');
    const navigate = async () => {
      const button = host.locator('[data-stack-page]').filter({hasText:/Features & equipment/});
      // A race change rebuilds the rail. isVisible() would read that transient
      // absence as mobile layout; let the appropriate control auto-wait instead.
      if (page.viewportSize().width > 800) await button.click();
      else await host.locator('[data-stack-jump]').selectOption('sheet:' + await button.getAttribute('data-stack-page'));
      await host.locator('[data-continuous-page="page-2"]:not([aria-busy="true"]) [data-pdf-field="Racial Traits"]').waitFor({state:'visible'});
    };
    const picker = page.locator('#adobeChoiceDialog');
    // A connected paper exists before its asynchronous mount finishes binding
    // controls. Wait for that mount, then use the player's click entry point.
    const front = host.locator('[data-continuous-page="page-1"]:not([aria-busy="true"])');
    await front.locator('.paper').waitFor({state:'visible'});
    await front.locator('[data-pdf-field="Race"]').click();
    await picker.waitFor({state:'visible'});
    await picker.locator('[data-choice-search]').fill('shadar');
    await picker.locator('[data-choice-value="shadar-kai-mpmm"]').click();
    await navigate();
    await racial.waitFor({state:'visible'});
    assert.match(await racial.inputValue(), /Fey Ancestry:.*advantage.*Charmed/);
    assert.match(await racial.inputValue(), /Trance:.*Four hours.*two temporary weapon or tool proficiencies/);
    assert.doesNotMatch(await racial.inputValue(), /normal elf rules|check the source/i);
    assert.equal(await racial.getAttribute('readonly'), null);
    await page.locator('#sheetSave').click();
    await page.waitForFunction(() => !sheetSession.saving && !sheetSession.dirty);
    await page.evaluate(async () => {closeCharacterSheet(true); await openCharacterSheet('c1');});
    await navigate();
    await racial.waitFor({state:'visible'});
    assert.match(await racial.inputValue(), /Trance:.*next long rest/);
    assert.equal(await page.evaluate(() => sheetSession.data.build.race), 'shadar-kai-mpmm');

    // All shipped race explanations reach the actual paper field; no UI truncation.
    // The independent source-heading assertions live in the unit suite.
    const checks = await page.evaluate(() => {
      const d = structuredClone(sheetSession.data), failures = [];
      for (const [id, race] of Object.entries(CharacterRules.races)) {
        d.build.race = id; d.build.edition = race.edition;
        const derived = CharacterSheetModel.derive(d, 4);
        const field = CharacterAdobeFields.describe('Racial Traits', {data:d, derived});
        if (!field.value || !field.value.includes(race.traits[0])) failures.push(id);
      }
      return failures;
    });
    assert.deepEqual(checks, []);

    // The generated wording is the initial value; private copies never alter mechanics.
    const automatic=await racial.inputValue(),custom='My custom racial trait wording.\nA reminder agreed with the DM.',mechanics=await page.evaluate(()=>JSON.stringify(CharacterSheetModel.derive(sheetSession.data,4,sheetEquipmentLoot()).effects));
    await racial.fill(custom);await racial.press('Tab');assert.equal(await racial.inputValue(),custom);assert.equal(await page.evaluate(()=>CharacterRacialTraitText.project(sheetSession.data).custom),true);assert.equal(await page.evaluate(()=>JSON.stringify(CharacterSheetModel.derive(sheetSession.data,4,sheetEquipmentLoot()).effects)),mechanics);
    await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});await navigate();assert.equal(await racial.inputValue(),custom);
    const change=async(race,edition)=>{await page.evaluate(({race,edition})=>{sheetSession.data.build.race=race;sheetSession.data.build.edition=edition;fillSheetForm();updateSheetCalculations();},{race,edition});await navigate();};
    await change('half-orc','2014');assert.doesNotMatch(await racial.inputValue(),/My custom racial/);await change('shadar-kai-mpmm','2014');assert.equal(await racial.inputValue(),custom);await change('shadar-kai-mpmm','2024');assert.doesNotMatch(await racial.inputValue(),/My custom racial/);await racial.fill('My 2024 reminder');await racial.press('Tab');await change('shadar-kai-mpmm','2014');assert.equal(await racial.inputValue(),custom);
    // Uncommitted text cannot cross a race/edition change; Escape repairs the field.
    await racial.fill('Stale 2014 draft');await page.evaluate(()=>{sheetSession.data.build.edition='2024';fillSheetForm();updateSheetCalculations();});await racial.press('Tab');assert.equal(await racial.getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>CharacterRacialTraitText.project(sheetSession.data).value),'My 2024 reminder');await racial.press('Escape');await racial.press('Tab');assert.equal(await racial.getAttribute('aria-invalid'),null);await change('shadar-kai-mpmm','2014');assert.equal(await racial.inputValue(),custom);
    await racial.fill('');await racial.press('Tab');assert.equal(await racial.inputValue(),'');await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});await navigate();assert.equal(await racial.inputValue(),'');
    const restore=host.locator('[data-continuous-page="page-2"] [data-stack-reset-racial]'),confirmation=page.locator('#siteConfirmationDialog');await restore.click();await confirmation.locator('[data-site-cancel]').click();assert.equal(await racial.inputValue(),'');await restore.click();await confirmation.locator('[data-site-confirm]').click();assert.equal(await racial.inputValue(),automatic);assert.equal(await restore.isDisabled(),true);
    await racial.fill(automatic+'\nCUSTOM RACIAL NOTE FOR PRINT');await racial.press('Tab');

    await page.setViewportSize({width:390, height:844});
    await navigate();
    await racial.waitFor({state:'visible'});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.equal(await racial.evaluate(node => {
      node.scrollTop = node.scrollHeight;
      return node.scrollHeight <= node.clientHeight || node.scrollTop > 0;
    }), true, 'long trait text remains scrollable');
    await page.addScriptTag({path:require.resolve(process.env.AXE_PATH || 'axe-core/axe.min.js')});
    assert.deepEqual(await racial.evaluate(async node => (await axe.run(node.closest('[data-continuous-page]'), {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => v.id)), []);
    fs.mkdirSync('/tmp/campaignatlas-ui-checks', {recursive:true});
    await page.screenshot({path:'/tmp/campaignatlas-ui-checks/species-descriptions-mobile.png'});
    await page.setViewportSize({width:1440, height:1000});
    await page.evaluate(() => {window.speciesPrintCalls = 0; window.print = () => speciesPrintCalls++;});
    const beforePrint = await page.evaluate(() => JSON.stringify(sheetSession.data));
    await host.locator('[data-paper-print]').first().click();
    await page.waitForFunction(() => speciesPrintCalls === 1, null, {timeout:30000});
    const pdf = '/tmp/campaignatlas-ui-checks/species-descriptions.pdf';
    await page.pdf({path:pdf, preferCSSPageSize:true, printBackground:true});
    const printed = execFileSync('pdftotext', [pdf, '-'], {encoding:'utf8'}).replace(/\s+/g, ' ');
    assert.match(printed, /CUSTOM RACIAL NOTE FOR PRINT/);
    assert.match(printed, /Fey Ancestry:.*advantage.*Charmed/);
    assert.match(printed, /Trance:.*two temporary weapon or tool proficiencies.*next long rest/);
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    assert.equal(await page.evaluate(() => JSON.stringify(sheetSession.data)), beforePrint);
    assert.equal(await page.evaluate(() => {
      const d = sheetSession.data;
      return JSON.stringify({inventory, items, hp:d.hpCurrent, coins:d.coins, slots:d.slots});
    }), await page.evaluate(() => speciesKept));
    await page.evaluate(() => {
      Object.assign(sheetSession.data.build, {race:'half-orc', edition:'2014'});
      renderCharacterSheet();
    });
    await navigate();
    assert.doesNotMatch(await racial.inputValue(), /Trance|Fey Ancestry|Raven Queen/);
    assert.deepEqual(errors, []);
    console.log('PASS native Shadar-kai choice, all 105 paper descriptions, editable/scoped/blank trait copies, reset/Cancel/stale guards, private save/reopen, mobile scrolling/axe, actual PDF and race-switch cleanup');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
