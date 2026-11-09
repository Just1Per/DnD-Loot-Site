'use strict';
// User-supplied MPMB v12.999 example: facts only, no copied rule prose or PDF.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const {page, errors} = await require('./adobe-browser-fixture.cjs')(browser);
  await page.evaluate(async () => {
   auditSeed('player');
   characters[0].level = 3;
   testSheetDocs['campaigns/a/characters/c1'] = {...characters[0]};
   await openCharacterSheet('c1');
   const d = sheetSession.data;
   d.build.edition = '2014'; d.build.classId = 'sorcerer';
   d.build.race = 'high-elf'; d.build.background = 'city-watch-scag'; d.experience = 2050;
   d.build.scoreMethod = 'manual'; d.build.scoreMode = 'final';
   d.build.cantrip = 'Fire Bolt'; d.build.autoSlots = true; d.spellAbility = 'cha';
   d.abilities = {str:15,dex:13,con:13,int:13,wis:16,cha:19};
   d.adobe.classLevels = [{classId:'sorcerer',level:3,subclassId:'draconic-bloodline'}];
   d.rulesChoices.feats = []; d.adobe.classFeatureChoices = {};
   d.hpCurrent = 14; d.coins.gp = 31;
   d.spells = ['Light','Poison Spray','Shocking Grasp','Thunderclap','Magic Missile','Gust of Wind','Invisibility','Mirror Image'].map(name=>({...CharacterCatalog.spellRow(CharacterCatalog.rawData.spells.find(s=>s.name===name&&s.edition==='2014')),classId:'sorcerer',prepared:true}));
   renderCharacterSheet(); readSheetForm();
  });
  await page.locator('#sheetStyle').selectOption('adobe');
  const host = page.locator('#sheetAdobeView');
  const first = host.locator('[data-continuous-page="page-1"]');
  const field = name => first.locator('[data-pdf-field="'+name+'"]');
  await field('AC').waitFor({state:'visible'});
  assert.equal(await field('AC').inputValue(),'14');
  assert.equal(await field('Cha').inputValue(),'19');
  assert.equal(await field('Background').inputValue(),'city-watch-scag');
  assert.equal(await field('Spell save DC 1').inputValue(),'14');
  assert.equal(await field('Limited Feature Recovery 1').inputValue(),'LR');
  const stats = await page.evaluate(() => {
   const d = CharacterSheetModel.derive(sheetSession.data,3,sheetEquipmentLoot());
   window.mithralCasting=CharacterSpellcasting.castingStats(CharacterSpellcasting.profiles(sheetSession.data,3).find(p=>p.classId==='sorcerer'),d);
   return {pb:d.pb,resources:d.classResources.filter(r=>r.id==='sorcery-points').map(r=>r.max)};
  });
  assert.deepEqual(stats,{pb:2,resources:[3]});
  assert.deepEqual(await page.evaluate(()=>({attack:mithralCasting.attack,dc:mithralCasting.dc})),{attack:6,dc:14});
  await field('PC Name').fill('Mithral Leotoris');
  await field('PC Name').press('Tab');
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});
  await first.screenshot({path:'/tmp/campaignatlas-ui-checks/mithral-reference-character.png'});
  // Choose from the actual Adobe class dialog; no Standard tab navigation.
  await field('Character Level').click();
  const dialog = page.locator('#adobeClassDialog');
  await dialog.locator('[data-native-step="choices"]').click();
  const choice = slot => dialog.locator('[data-native-group="metamagic"][data-native-slot="'+slot+'"]');
  assert.equal(await dialog.locator('[data-native-group="metamagic"]').count(),2);
  await choice(0).selectOption('quickened-spell');
  await choice(1).selectOption('empowered-spell');
  assert.match(await dialog.textContent(),/Quickened Spell · 2 points/);
  assert.match(await dialog.textContent(),/Empowered Spell · 1 point/);
  await dialog.locator('[data-native-apply]').click();
  await page.evaluate(()=>CharacterAdobeView.openEditor('resources'));
  const editor = page.locator('#adobeSharedEditor');
  await editor.locator('[data-metamagic]').selectOption('quickened-spell');
  await editor.locator('[data-spend-metamagic]').click();
  assert.equal(await editor.locator('[aria-label="Sorcery Points uses remaining"]').textContent(),'1 / 3');
  assert.equal(await editor.locator('[data-spend-metamagic]').isDisabled(),true);
  await editor.locator('[data-metamagic]').selectOption('empowered-spell');
  assert.equal(await editor.locator('[data-spend-metamagic]').isEnabled(),true);
  // Both dialogs must remain usable at narrow viewport widths.
  await page.addScriptTag({path:require.resolve(process.env.AXE_PATH || 'axe-core/axe.min.js')});
  for (const width of [1440,390,320]) {
   await page.setViewportSize({width,height:900});
   assert.equal(await editor.evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);
  }
  const violations = await page.evaluate(async () => (await axe.run(document.getElementById('adobeSharedEditor'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[]);
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});
  await editor.locator('[data-metamagic]').scrollIntoViewIfNeeded();
  assert.equal(await editor.locator('[data-metamagic]').isVisible(),true);
  await editor.screenshot({path:'/tmp/campaignatlas-ui-checks/mithral-metamagic-mobile.png'});
  await editor.getByRole('button',{name:'Close editor',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  const featuresIndex = await host.locator('[data-stack-page]').evaluateAll(nodes=>nodes.findIndex(n=>JSON.parse(n.dataset.stackPage)[0]==='page-2'));
  assert.ok(featuresIndex>=0);
  await host.locator('[data-stack-page]').nth(featuresIndex).click();
  const personality = host.locator('[data-continuous-page="page-2"] [data-pdf-field="Personality Trait"]');
  await personality.fill('Mithral tester et langt tekstfelt.\nÆbletræ, øvelse og ændringer bliver gemt.');
  await personality.press('Tab');
  await page.locator('#sheetSave').click();
  await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
  await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});
  await field('AC').waitFor({state:'visible'});
  assert.equal(await field('PC Name').inputValue(),'Mithral Leotoris');
  assert.equal(await page.evaluate(()=>sheetSession.data.personality),'Mithral tester et langt tekstfelt.\nÆbletræ, øvelse og ændringer bliver gemt.');
  const saved = await page.evaluate(()=>({choices:sheetSession.data.adobe.classFeatureChoices['2014:sorcerer:metamagic'],remaining:CharacterSheetModel.derive(sheetSession.data,3,sheetEquipmentLoot()).classResources.find(r=>r.id==='sorcery-points').remaining,hp:sheetSession.data.hpCurrent,gp:sheetSession.data.coins.gp}));
  assert.deepEqual(saved,{choices:['quickened-spell','empowered-spell'],remaining:1,hp:14,gp:31});
  // Revised Metamagic has its own saved choices and unlocks at Sorcerer 2.
  await field('Character Level').click();
  await dialog.locator('[data-native-edition]').selectOption('2024');
  await dialog.locator('[data-native-step="choices"]').click();
  await choice(0).selectOption('heightened-spell');
  assert.match(await dialog.textContent(),/Heightened Spell · 2 points/);
  await dialog.locator('[data-native-cancel]').last().click();
  assert.equal(await page.evaluate(()=>sheetSession.data.build.edition),'2014');
  assert.deepEqual(errors,[]);
  console.log('PASS Mithral reference AC/abilities/PB, native Metamagic selection and prices, guarded spending, Adobe-only save/reopen, 320px layout and accessibility');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
