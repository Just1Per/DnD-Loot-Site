(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try {
  closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
  const form=document.getElementById('characterSheetForm'),change=(name,value)=>{const el=form.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  check('Overview has no editable inputs and includes all 18 compact skills',!document.querySelector('#sheet-overview input,#sheet-overview select,#sheet-overview textarea')&&document.querySelectorAll('.sheet-summary-checks .sheet-summary-box:nth-child(2) .sheet-summary-skill').length===18);
  check('Identity fields live only in Character builder',form.querySelector('[name="identity.name"]').closest('[data-sheet-section]').id==='sheet-builder'&&form.querySelectorAll('[name="identity.name"]').length===1);
  check('Feat catalogue stays in Feats; origin choices belong to Builder',document.getElementById('sheetFeatCatalog').closest('[data-sheet-section]').id==='sheet-feats'&&form.querySelector('[name="build.humanOriginFeat"]').closest('[data-sheet-section]').id==='sheet-builder');
  change('identity.name','Test <img src=x>');change('abilities.dex','18');check('Read-only overview recalculates without interpreting names as markup',document.getElementById('sheetOverviewReadout').textContent.includes('Test <img src=x>')&&!document.querySelector('#sheet-overview img')&&document.querySelectorAll('.sheet-summary-ability')[1].textContent.includes('+4'));
  check('Background dropdown contains 35 named profiles plus custom',form.querySelector('[name="build.background"]').querySelectorAll('option').length===36);
  change('build.background','farmer-2024');change('build.backgroundAbilities.0','str');change('build.backgroundAbilities.1','con');
  check('Background info lists grants and overview uses its name',document.getElementById('sheetBackgroundSummary').textContent.includes('Tough')&&document.getElementById('sheetOverviewReadout').textContent.includes('Farmer'));
  change('build.background','soldier-2024');check('Gaming tool selector appears for Soldier',!form.querySelector('[name="build.backgroundTools.0"]').closest('label').hidden);
  change('build.backgroundTools.0','Dice set');for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();
  check('Background tool selection survives schema-eleven save and reopen',sheetSession.data.build.backgroundTools[0]==='Dice set'&&testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===11);
  const spell=CharacterCatalog.spells({edition:'2024',search:'Fireball'}).find(s=>s.name==='Fireball');addCatalogSpells([spell.id]);document.querySelector('[data-spell-info-index="0"]').click();
  check('Saved spell info opens accessible dialog with description and edition',document.getElementById('sheetSpellInformation').open&&document.getElementById('sheetSpellInformation').textContent.includes('2024')&&document.getElementById('sheetSpellInformation').textContent.includes(spell.description.slice(0,40)));
  document.querySelector('#sheetSpellInformation button').click();check('Spell popup closes without changing spell selection',!document.getElementById('sheetSpellInformation')&&sheetSession.data.spells.length===1);
  document.getElementById('catalogSpellSearch').value='Fireball';renderCatalogSpellResults();document.querySelector('[data-spell-info]').click();check('Spell catalogue info is available before adding a spell',!!document.getElementById('sheetSpellInformation'));
  closeSpellInformation();sheetSession.data.spells.push({name:'Custom',notes:'<script>alert(1)</script>',level:0});renderSheetRows();fillSheetForm();openSpellInformation({index:1});check('Custom spell notes display as text, never executable HTML',document.getElementById('sheetSpellInformation').textContent.includes('<script>')&&!document.querySelector('#sheetSpellInformation script'));
  closeCharacterSheet(true);check('Closing character removes private spell popup',!document.getElementById('sheetSpellInformation'));
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
