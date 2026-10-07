(async()=>{
 const results=[],check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};
  await openCharacterSheet('c1');await Promise.resolve();
  const adobeBefore=JSON.stringify(sheetSession.data.adobe);
  delete sheetSession.data.adobe;
  readSheetForm();
  check('Missing runtime Adobe section is restored from saved grants before XP fields are read',JSON.stringify(sheetSession.data.adobe)===adobeBefore);
  sheetSession.data.hpCurrent=10;fillSheetForm();
  document.getElementById('sheetHpAmount').value=3;changeSheetHP('damage');readSheetForm();
  check('Damage preserves progression settings and subsequent form reads',sheetSession.data.hpCurrent===7&&JSON.stringify(sheetSession.data.adobe)===adobeBefore);
  document.getElementById('sheetHpAmount').value=2;changeSheetHP('heal');readSheetForm();
  check('Healing preserves progression and uses calculated maximum HP',sheetSession.data.hpCurrent===Math.min(9,CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).hpMax)&&JSON.stringify(sheetSession.data.adobe)===adobeBefore);
  const inspiration=sheetSession.data.inspiration;
  document.getElementById('sheetOverviewInspiration').click();
  check('Overview Inspiration button works after HP changes',sheetSession.data.inspiration===!inspiration);
  const ids=addSheetGearTemplates([{name:'Regression dagger',quantity:1,weight:1,edition:'2024'}]);
  document.querySelector('[data-edit-personal="'+ids[0]+'"]').click();
  check('Inventory Edit button opens the gear dialog after HP changes',document.getElementById('sheetPersonalGearEditor').open&&document.getElementById('personalEditName').value==='Regression dagger');
  document.getElementById('sheetPersonalGearEditor').close();
  document.getElementById('sheetOverviewAddAttack').click();
  check('Overview Add attack button opens its picker',!!document.getElementById('sheetAttackPicker'));closeAttackPicker();
  check('All 18 Overview skills remain visible',document.querySelectorAll('.sheet-summary-checks .sheet-summary-box:nth-child(2) .sheet-summary-skill').length===18);
  await saveCharacterSheet();
  check('Save succeeds after HP changes and retains progression data',!!testSheetDocs['campaigns/a/characterSheets/c1']?.data?.rulesChoices?.grants?.__adobe?.data);
  closeCharacterSheet(true);await openCharacterSheet('c1');readSheetForm();
  check('Saved sheet reopens with usable form controls',!!sheetSession.data.adobe);
 }catch(e){results.push({name:e.stack,pass:false})}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
