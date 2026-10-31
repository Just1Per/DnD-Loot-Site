'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser);
  const host=page.locator('#sheetAdobeView');
  const noPopup=async()=>{
   assert.equal(await page.locator('#adobeSpellDialog,#adobeSharedEditor').count(),0);
   assert.equal(await page.locator('#sheetSpellGenerator[open]').count(),0);
  };
  for(const edition of ['2014','2024']){
   await page.evaluate(async edition=>{
    auditSeed('player');characters[0].level=8;testSheetDocs['campaigns/a/characters/c1']={...characters[0]};
    await openCharacterSheet('c1');const d=sheetSession.data;
    d.build.edition=edition;d.build.classId='cleric';d.build.scoreMode='final';d.abilities.wis=16;d.abilities.int=16;
    d.adobe.classLevels=[{classId:'cleric',level:5,subclassId:edition==='2024'?'life-domain-2024':'life-domain'},{classId:'wizard',level:3}];
    const profile=CharacterSpellcasting.profiles(d,8,CharacterSheetModel.derive(d,8).scores).find(p=>p.classId==='cleric');
    const grants=CharacterSpellcasting.automaticGrants(profile,CharacterCatalog.rawData.spells),ids=new Set(grants.map(s=>s.id));
    const references=CharacterCatalog.spells({edition,classId:'cleric'}).filter(s=>s.level>0&&s.level<=profile.maxSpellLevel&&!ids.has(s.id)).slice(0,profile.spellCount+2);
    const light=CharacterCatalog.spells({edition,classId:'cleric'}).find(s=>s.level===0),wizard=CharacterCatalog.spells({edition,classId:'wizard'}).find(s=>s.level===1);
    d.spells=[{...CharacterCatalog.spellRow(light),classId:'cleric'},...grants.map(s=>({...CharacterCatalog.spellRow(s),classId:'cleric',prepared:true})),...references.map((s,i)=>({...CharacterCatalog.spellRow(s),classId:'cleric',prepared:i<profile.spellCount})),...Array.from({length:60},(_,i)=>({name:'ZZ retained reference '+i,classId:'cleric',level:1,prepared:false})),{...CharacterCatalog.spellRow(wizard),classId:'wizard',prepared:true}];
    d.hpCurrent=9;d.hpTemp=2;d.coins.gp=42;renderCharacterSheet();
    window.preparationResources=JSON.stringify({hp:d.hpCurrent,temp:d.hpTemp,coins:d.coins,slots:d.slots,inventory,items});
   },edition);
   await page.locator('#sheetStyle').selectOption('adobe');
   await host.locator('[data-pdf-field="PC Name"]:visible').first().waitFor({state:'visible'});
   const continuous=edition==='2024';
   await host.locator('#adobeLayout').selectOption(continuous?'continuous':'page');
   if(continuous)await host.locator('[data-stack-page]').filter({hasText:/Cleric · Spell sheet/}).first().click();
   else{await host.locator('#adobePage').selectOption('template-SSfront');await host.locator('#adobeSpellCaster').selectOption('cleric');}
   const sheet=continuous?host.locator('[data-continuous-page="template-SSfront"]').filter({has:page.locator('[data-stack-spells="cleric"]')}):host.locator('#adobePaper');
   await sheet.locator('[data-pdf-field="spells.name.1"]').waitFor({state:'visible'});
   const rows=await page.evaluate(()=>characterSpellPresentation(sheetSession.data,CharacterSheetModel.derive(sheetSession.data,8),8).filter(r=>r.spell.classId==='cleric').slice(0,55).map((r,i)=>({slot:i+1,index:r.i,prepared:r.spell.prepared,automatic:r.automatic,editable:r.preparationEditable,level:r.spell.level})));
   const ready=rows.find(r=>r.editable&&r.prepared),reserve=rows.find(r=>r.editable&&!r.prepared),granted=rows.find(r=>r.automatic),cantrip=rows.find(r=>r.level===0);
   assert.ok(ready&&reserve&&granted&&cantrip);
   const button=row=>sheet.locator('[data-pdf-button="spells.checkbox.'+row.slot+'"]');
   assert.equal(await button(granted).isDisabled(),true);assert.equal(await button(cantrip).isDisabled(),true);
   assert.equal(await button(reserve).isEnabled(),true,'direct paper preparation must be enabled for Cleric');
   await button(reserve).click();await noPopup();
   assert.equal(await page.evaluate(i=>sheetSession.data.spells[i].prepared,reserve.index),false);
   assert.match(await host.locator('#adobeStatus').textContent(),/Cleric can prepare/);
   await button(ready).focus();await page.keyboard.press('Space');
   assert.equal(await button(ready).getAttribute('aria-pressed'),'false');
   await button(reserve).click();await noPopup();
   assert.equal(await button(reserve).getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(i=>sheetSession.data.spells[i].prepared,reserve.index),true);
   assert.equal(await page.evaluate(()=>sheetSession.data.spells.find(s=>s.classId==='wizard').prepared),true,'Cleric preparation leaves Wizard alone');
   // The same control works at its true offset on a continuation page.
   await button(reserve).click();
   if(continuous)await host.locator('[data-stack-page]').filter({hasText:/Cleric · More spells/}).first().click();
   else await host.locator('#adobeNextSpells').click();
   const more=continuous?host.locator('[data-continuous-page="template-SSmore"]').filter({has:page.locator('[data-stack-spells="cleric"]')}).first():host.locator('#adobePaper');
   await more.locator('[data-pdf-field="spells.name.1"]').waitFor({state:'visible'});
   const continued=await page.evaluate(()=>characterSpellPresentation(sheetSession.data,CharacterSheetModel.derive(sheetSession.data,8),8).filter(r=>r.spell.classId==='cleric')[55].i);
   await more.locator('[data-pdf-button="spells.checkbox.1"]').click();await noPopup();
   assert.equal(await page.evaluate(i=>sheetSession.data.spells[i].prepared,continued),true);
   assert.equal(await page.evaluate(()=>JSON.stringify({hp:sheetSession.data.hpCurrent,temp:sheetSession.data.hpTemp,coins:sheetSession.data.coins,slots:sheetSession.data.slots,inventory,items})),await page.evaluate(()=>preparationResources));
   await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
   await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1')});
   assert.equal(await page.evaluate(i=>sheetSession.data.spells[i].prepared,continued),true);
   assert.equal(await page.evaluate(i=>sheetSession.data.spells[i].prepared,ready.index),false);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS direct Adobe paper preparation, both editions/single/continuous/continuation, keyboard, allowance rejection and swap, locked grants/cantrips, class/resource isolation and save/reopen without a popup');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
