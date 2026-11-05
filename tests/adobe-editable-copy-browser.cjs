'use strict';
const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser,{legacyPresentation:true});
  const setup=await page.evaluate(async()=>{
   auditSeed('player');characters[0].level=3;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
   const data=sheetSession.data,feat=CharacterFeatRules.definitions;
   data.build.edition='2014';data.build.classId='wizard';data.build.race='human';data.adobe.classLevels=[{classId:'wizard',level:3,subclassId:'evocation'}];
   const featId=Object.keys(feat).find(id=>feat[id].name==='Alert'&&feat[id].edition==='2014'),spell=CharacterCatalog.rawData.spells.find(row=>row.name==='Magic Missile'&&row.edition==='2014');
   data.rulesChoices.feats=[featId];data.spells=[{...CharacterCatalog.spellRow(spell),classId:'wizard',prepared:true}];renderCharacterSheet();readSheetForm();
   return {featId,spellId:spell.id};
  });
  await page.locator('#sheetStyle').selectOption('adobe');
  const host=page.locator('#sheetAdobeView'),field=id=>host.locator('[data-pdf-field="'+id+'"]');
  await host.locator('#adobePage').selectOption('page-3');
  await field('Feat Name 1').fill('Early-warning training');await field('Feat Name 1').press('Tab');
  await field('Feat Description 1').fill('Player wording for this feat.');await field('Feat Description 1').press('Tab');
  assert.deepEqual(await page.evaluate(id=>sheetSession.data.adobe.featText[id],setup.featId),{name:'Early-warning training',description:'Player wording for this feat.'});
  await host.locator('#adobePage').selectOption('template-SSfront');
  await field('spells.name.1').fill('Arcane dart');await field('spells.name.1').press('Tab');
  await field('spells.description.1').fill('Player wording for this spell.');await field('spells.description.1').press('Tab');
  assert.deepEqual(await page.evaluate(()=>({name:sheetSession.data.spells[0].name,notes:sheetSession.data.spells[0].notes,catalogId:sheetSession.data.spells[0].catalogId})),{name:'Arcane dart',notes:'Player wording for this spell.',catalogId:setup.spellId});
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
  await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});
  await host.locator('#adobePage').selectOption('page-3');await field('Feat Name 1').waitFor({state:'visible'});
  assert.equal(await field('Feat Name 1').inputValue(),'Early-warning training');assert.equal(await field('Feat Description 1').inputValue(),'Player wording for this feat.');
  await host.locator('#adobePage').selectOption('template-SSfront');await field('spells.name.1').waitFor({state:'visible'});
  assert.equal(await field('spells.name.1').inputValue(),'Arcane dart');assert.equal(await field('spells.description.1').inputValue(),'Player wording for this spell.');
  assert.equal(await page.evaluate(()=>sheetSession.data.spells[0].catalogId),setup.spellId);assert.deepEqual(errors,[]);
  console.log('PASS Adobe feat and spell sheet copies remain editable and persist through private save/reopen');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
