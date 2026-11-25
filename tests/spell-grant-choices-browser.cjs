'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser,{adobeOnly:true});
  await page.evaluate(async()=>{
   auditSeed('player');characters[0].level=4;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
   const d=sheetSession.data;Object.assign(d.build,{edition:'2014',classId:'wizard',race:'githyanki-mpmm',raceAbility:'',background:'',scoreMode:'final'});
   Object.assign(d.abilities,{int:16,wis:14,cha:12});d.adobe.classLevels=[{classId:'wizard',level:4}];d.spells=[];
   renderCharacterSheet();readSheetForm();window.grantKept=JSON.stringify({hp:d.hpCurrent,temp:d.hpTemp,slots:d.slots,coins:d.coins,inventory,items});
   window.grantRows=()=>{const d=sheetSession.data,stats=CharacterSheetModel.derive(d,sheetSession.identity.level,sheetEquipmentLoot());return CharacterSpellcasting.sheetRows(d,stats.progression.targetLevel,stats).map(row=>({name:CharacterCatalog.find(row.spell.catalogId)?.name||row.spell.name,source:row.profile?.classId,ability:row.profile.ability,automatic:row.automatic}));};
  });
  const host=page.locator('#sheetAdobeView'),sources=page.locator('#adobeSpellSourcesDialog'),racial=page.locator('#adobeRaceSpellDialog'),feats=page.locator('#adobeFeatDialog');
  await host.locator('[data-pdf-field="PC Name"]:visible').first().waitFor({state:'visible'});
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('race'));
  assert.match(await sources.locator('[data-spell-source-body]').textContent(),/Mage Hand/);
  assert.match(await sources.locator('[data-spell-source-body]').textContent(),/Choose a racial spellcasting ability/);
  assert.equal(await page.evaluate(()=>grantRows().filter(row=>row.source==='race').length),0);
  await sources.locator('[data-spell-source-race]').click();
  assert.equal(await racial.locator('[data-race-spell-apply]').isDisabled(),true);
  await racial.locator('[data-race-spell-ability]').selectOption('wis');
  await racial.locator('[data-race-spell-close]').last().click();
  assert.equal(await page.evaluate(()=>sheetSession.data.build.raceAbility),'');
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('race'));
  await sources.locator('[data-spell-source-race]').click();
  await racial.locator('[data-race-spell-ability]').selectOption('wis');
  await racial.locator('[data-race-spell-apply]').click();
  assert.deepEqual(await page.evaluate(()=>grantRows().map(row=>[row.name,row.source,row.ability])),[['Mage Hand','race','wis'],['Jump','race','wis']]);
  assert.equal(await page.evaluate(()=>sheetSession.data.spells.length),0,'innate grants consume no class selections');

  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('wizard'));
  await sources.locator('[data-spell-source-class="wizard"]').click();
  const picker=page.locator('#adobeSpellDialog');
  await picker.locator('[data-spell-search]').fill('Mage Hand');
  const mage=await page.evaluate(()=>CharacterCatalog.data.spells.find(row=>row.name==='Mage Hand'&&row.edition==='2014').id);
  await picker.locator('[data-spell-add="'+mage+'"]').click();
  await picker.locator('[data-spell-apply]').click();
  await sources.locator('[data-spell-sources-close]').last().click();
  const both=await page.evaluate(()=>grantRows().filter(row=>row.name==='Mage Hand'));
  assert.deepEqual(both.map(row=>[row.source,row.ability]).sort(),[['race','wis'],['wizard','int']]);
  assert.equal(await page.evaluate(()=>sheetSession.data.spells.filter(row=>row.classId==='wizard').length),1);
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
  await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1');});
  assert.equal(await page.evaluate(()=>sheetSession.data.build.raceAbility),'wis');
  assert.equal(await page.evaluate(()=>grantRows().filter(row=>row.name==='Mage Hand').length),2);

  // Effective XP level must control the racial unlock even before identity is saved.
  await page.evaluate(()=>{sheetSession.identity.level=1;sheetSession.data.adobe.useExperience=true;sheetSession.data.experience=6500;renderCharacterSheet();});
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('race'));
  assert.match(await sources.locator('[data-spell-source-body]').textContent(),/Misty Step/);
  await sources.locator('[data-spell-source-race]').click();assert.match(await racial.textContent(),/Misty Step/);
  await racial.locator('[data-race-spell-close]').last().click();

  await page.evaluate(()=>{
   const d=sheetSession.data;d.experience=48000;
   window.runeChoice=Object.keys(CharacterFeatRules.definitions).find(id=>CharacterFeatRules.definitions[id].name==='Rune Shaper');
   d.rulesChoices.feats=[runeChoice];renderCharacterSheet();
   CharacterAdobeFeatUI.open(runeChoice.toLowerCase());
  });
  const rune=feats.locator('[data-native-feat-key="'+await page.evaluate(()=>runeChoice)+'"]');
  await rune.waitFor({state:'visible'});
  assert.equal(await rune.locator('[data-feat-choice^="spellPick"]').count(),2,'XP level 9 gives two known runes, despite saved identity level 1');
  await feats.locator('[data-native-feat-close]').first().click();

  await page.evaluate(()=>{
   const d=sheetSession.data;sheetSession.identity.level=4;d.adobe.useExperience=false;
   Object.assign(d.build,{edition:'2024',race:'human-2024',background:'haunted-one-rthw',backgroundFeat:'',raceAbility:''});d.spells=[];d.rulesChoices.feats=[];
   renderCharacterSheet();
  });
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('feat-origin-background'));
  await sources.getByRole('button',{name:'Open feat spell choices',exact:true}).click();
  await feats.locator('[data-native-feat-origin="backgroundFeat"]').selectOption('Living Shadow');
  await feats.locator('[data-native-feat-apply]').click();
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('feat-origin-background'));
  const card=sources.locator('[data-spell-source-feat-card="origin-background"]');
  assert.match(await card.textContent(),/Living Shadow/);assert.match(await card.textContent(),/mage hand/i);
  assert.match(await card.textContent(),/Choose a casting ability/);
  assert.doesNotMatch(await sources.textContent(),/No selected feat currently grants/);
  assert.equal(await page.evaluate(()=>grantRows().some(row=>row.name==='Mage Hand')),false);
  await card.locator('[data-spell-source-feat]').click();
  const selected=feats.locator('[data-native-feat-key="origin-background"]');
  assert.equal(await selected.locator('details').first().evaluate(node=>node.open),true);
  assert.equal(await selected.locator('[data-feat-choice="castingAbility"]').evaluate(node=>node===document.activeElement),true);
  await selected.locator('[data-feat-choice="castingAbility"]').selectOption('wis');
  await feats.locator('[data-native-feat-apply]').click();
  assert.deepEqual(await page.evaluate(()=>grantRows().map(row=>[row.name,row.source,row.ability])),[['Mage Hand','feat-origin-background','wis']]);
  assert.equal(await page.evaluate(()=>sheetSession.data.spells.length),0);
  await page.evaluate(()=>CharacterAdobeSpellUI.openSources('feat-origin-background'));
  assert.doesNotMatch(await sources.locator('[data-spell-source-feat-card="origin-background"]').textContent(),/Choose a casting ability/);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await sources.evaluate(node=>node.scrollWidth<=node.clientWidth+1),true);
  await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
  assert.deepEqual(await page.evaluate(async()=>(await axe.run(document.getElementById('adobeSpellSourcesDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(row=>row.id)),[]);
  fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});
  await sources.screenshot({path:'/tmp/campaignatlas-ui-checks/haunted-one-spell-source-mobile.png'});
  await sources.locator('[data-spell-sources-close]').last().click();
  await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
  await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1');});
  assert.equal(await page.evaluate(()=>sheetSession.data.build.backgroundFeat),'Living Shadow');
  assert.deepEqual(await page.evaluate(()=>grantRows().map(row=>[row.name,row.source,row.ability])),[['Mage Hand','feat-origin-background','wis']]);
  assert.equal(await page.evaluate(()=>JSON.stringify({hp:sheetSession.data.hpCurrent,temp:sheetSession.data.hpTemp,slots:sheetSession.data.slots,coins:sheetSession.data.coins,inventory,items})),await page.evaluate(()=>grantKept));
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>{window.grantPrints=0;window.print=()=>grantPrints++;});
  await host.locator('[data-paper-print]').first().click();
  await page.waitForFunction(()=>grantPrints===1,null,{timeout:30000});
  const pdf='/tmp/campaignatlas-ui-checks/haunted-one-spells.pdf';await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
  assert.match(execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'}),/Mage Hand/);
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  // The legacy Haunted One background supplies no invented spell or Dark Gift feat.
  await page.evaluate(()=>{const d=sheetSession.data;Object.assign(d.build,{edition:'2014',race:'human',background:'haunted-one-cos',backgroundFeat:''});renderCharacterSheet();});
  assert.equal(await page.evaluate(()=>grantRows().some(row=>row.name==='Mage Hand')),false);
  assert.deepEqual(errors,[]);
  console.log('PASS Githyanki casting choices and unlocks, separate class/race allowances and abilities, XP level gates, Haunted One Dark Gift selection and pending-source guidance, targeted feat editor, cancellation, Save/reopen, real PDF, mobile/axe and legacy source isolation');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
