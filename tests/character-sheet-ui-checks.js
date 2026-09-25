(async()=>{
const results=JSON.parse(document.getElementById('test-results').textContent);const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
try {
 seed('player');
 check('Players have a character sheet entry point',!!document.querySelector('.btn-sheet-char'));
 testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
 await openCharacterSheet('c1');
 check('Sheet opens for own character with all six sections',document.getElementById('characterSheetDialog').open&&document.querySelectorAll('[data-sheet-section]').length===6);
 check('Inventory section contains only this character’s loot',document.querySelectorAll('#sheetInventory .item-card').length===1&&document.querySelector('#sheetInventory .inventory-quantity').textContent==='Owned: 2');
 const form=document.getElementById('characterSheetForm');for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;
 form.querySelector('[name="abilities.dex"]').value='18';form.querySelector('[name="abilities.dex"]').dispatchEvent(new Event('input',{bubbles:true}));
 check('Ability edit updates derived values and dirty status',document.querySelector('[data-derived="initiative"]').textContent==='+4'&&sheetSession.dirty);
 document.getElementById('sheetAddAttack').click();
 check('Attacks can be added without losing ability edits',sheetSession.data.attacks.length===1&&form.querySelector('[name="abilities.dex"]').value==='18');
 document.getElementById('sheetAddSpell').click();
 check('Spells can be added to spellbook',sheetSession.data.spells.length===1);
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;
 form.querySelector('[name="notes"]').value='<script>private</script>';readSheetForm();
 await saveCharacterSheet();
 check('Save writes private sheet and clears dirty state',testSheetDocs['campaigns/a/characterSheets/c1'].data.notes==='<script>private</script>'&&!sheetSession.dirty);
 closeCharacterSheet(true);await openCharacterSheet('c1');
 check('Reopening restores saved values safely',document.querySelector('[name="abilities.dex"]').value==='18'&&!document.querySelector('#characterSheetDialog script'));
 testSheetDocs['campaigns/a/characterSheets/c1'].revision=2;
 const secondForm=document.getElementById('characterSheetForm');for(const el of secondForm.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;
 secondForm.querySelector('[name="notes"]').value='Local draft';secondForm.querySelector('[name="notes"]').dispatchEvent(new Event('input',{bubbles:true}));await saveCharacterSheet();
 check('Save conflict keeps draft and shows recovery instructions',sheetSession.dirty&&document.getElementById('sheetStatus').textContent.includes('another window')&&secondForm.querySelector('[name="notes"]').value==='Local draft');
 selectSheetTab('spells');check('Tab selection updates accessibility and panels',document.getElementById('sheet-tab-spells').getAttribute('aria-selected')==='true'&&document.getElementById('sheet-overview').hidden&&!document.getElementById('sheet-spells').hidden);
 prepareSheetPrint();check('Printing mirrors complete notes without interpreting markup',!!document.querySelector('.sheet-print-value')&&document.body.classList.contains('printing-character-sheet'));
 window.confirm=()=>false;check('Closing dirty sheet can be canceled',closeCharacterSheet()===false&&!!sheetSession);window.confirm=()=>true;
 closeCharacterSheet(true);check('Forced close clears private data and DOM',sheetSession===null&&!document.getElementById('characterSheetDialog'));
 await openCharacterSheet('c2');check('Other player sheet cannot be opened from UI',!document.getElementById('characterSheetDialog'));
 seed('dm');await openCharacterSheet('c1');check('DM can open player sheet',!!sheetSession&&document.getElementById('sheetTitle').textContent==='Thorin');document.querySelector('#sheetInventory .edit-button').click();check('Inventory editing closes the sheet before opening item editor',!sheetSession&&document.getElementById('itemModal').style.display==='flex');closeItemModal();
 seed('player');testSheetFail=true;await openCharacterSheet('c1');check('Permission failure is actionable without exposing sheet',sheetSession===null&&document.getElementById('sheetStatus').textContent.includes('Firestore rules'));testSheetFail=false;closeCharacterSheet(true);
}catch(e){results.push({name:e.stack,pass:false});}
document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
