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
  sheetSession.data=CharacterSheetModel.damage(sheetSession.data,3);fillSheetForm();readSheetForm();
  check('Damage preserves progression settings and subsequent form reads',sheetSession.data.hpCurrent===7&&JSON.stringify(sheetSession.data.adobe)===adobeBefore);
  sheetSession.data=CharacterSheetModel.heal(sheetSession.data,2,sheetSession.identity.level);fillSheetForm();readSheetForm();
  check('Healing preserves progression and uses calculated maximum HP',sheetSession.data.hpCurrent===Math.min(9,CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).hpMax)&&JSON.stringify(sheetSession.data.adobe)===adobeBefore);
  check('Combat omits HP tracking, speed editing and Inspiration controls',!document.querySelector('#sheet-combat [name="hpCurrent"],#sheet-combat [name="hpTemp"],#sheet-combat [name="speed"],#sheet-combat [name="inspiration"],#sheetHpAmount,#sheetDamage,#sheetHeal'));
  const inspiration=sheetSession.data.inspiration;
  document.getElementById('sheetOverviewInspiration').click();
  check('Overview Inspiration button works after HP changes',sheetSession.data.inspiration===!inspiration);
  const ids=addSheetGearTemplates([{name:'Regression dagger',quantity:1,weight:1,edition:'2024'}]);
  document.querySelector('[data-edit-personal="'+ids[0]+'"]').click();
  check('Inventory Edit button opens the gear dialog after HP changes',document.getElementById('sheetPersonalGearEditor').open&&document.getElementById('personalEditName').value==='Regression dagger');
  document.getElementById('sheetPersonalGearEditor').close();
  document.getElementById('sheetOverviewAddAttack').click();
  check('Overview Add attack button opens its picker',!!document.getElementById('sheetAttackPicker'));
  const attackKind=document.getElementById('attackKind');attackKind.value='manual';attackKind.onchange();
  const attackName=document.getElementById('attackName');attackName.value='Regression strike';attackName.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('attackConfirm').click();
  check('Attack popup confirmation creates an attack after Combat cleanup',!document.getElementById('sheetAttackPicker')&&sheetSession.data.attacks.some(a=>a.name==='Regression strike'));

  check('All 18 Overview skills remain visible',document.querySelectorAll('.sheet-summary-checks .sheet-summary-box:nth-child(2) .sheet-summary-skill').length===18);
  await saveCharacterSheet();
  check('Save succeeds after HP changes and retains progression data',!!testSheetDocs['campaigns/a/characterSheets/c1']?.data?.rulesChoices?.grants?.__adobe?.data);
  closeCharacterSheet(true);await openCharacterSheet('c1');readSheetForm();
  check('Saved sheet reopens with usable form controls',!!sheetSession.data.adobe);
  check('Saved HP data and Overview Inspiration survive removal of Combat inputs',sheetSession.data.hpCurrent===Math.min(9,CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).hpMax)&&sheetSession.data.inspiration===!inspiration);
  const race=document.querySelector('[name="build.race"]');race.value='dwarf-2024';race.dispatchEvent(new Event('change',{bubbles:true}));
  check('Overview speed is derived from species without a manual speed field',!document.querySelector('[name="speed"]')&&document.getElementById('sheetOverviewReadout').textContent.includes(CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).effects.speed+' ft'));

 }catch(e){results.push({name:e.stack,pass:false})}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
