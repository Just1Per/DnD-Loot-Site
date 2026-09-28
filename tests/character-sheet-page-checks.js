(async()=>{
const results=JSON.parse(document.getElementById('test-results').textContent);
const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
try {
 seed('player');closeCharacterSheet(true);testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};delete testSheetDocs['campaigns/a/characterSheets/c1'];
 check('Character sheet main tab is immediately after My Character',document.getElementById('playerTab').nextElementSibling.id==='characterSheetTab');
 showTab('character-sheet');await Promise.resolve();await Promise.resolve();
 check('Main tab opens own character as a page without a dialog',!!sheetSession&&document.getElementById('characterSheetDialog').parentElement.id==='characterSheetPage'&&!document.querySelector('dialog#characterSheetDialog')&&document.getElementById('tab-character-sheet').style.display==='block');
 check('Overview is read-only with editing panels separate',document.getElementById('sheet-skills').hidden&&document.getElementById('sheet-combat').hidden&&!document.querySelector('#sheet-overview input,#sheet-overview select,#sheet-overview textarea')&&document.getElementById('sheet-builder').hidden&&document.getElementById('sheetBuildControls').closest('[data-sheet-section]').id==='sheet-builder');
 const fields=[...document.querySelectorAll('#characterSheetForm [name]')].map(el=>el.name);check('Page layout reuses original fields without duplicate inputs',new Set(fields).size===fields.length);
 const notes=document.querySelector('[name="notes"]');notes.value='Unfinished draft';notes.dispatchEvent(new Event('input',{bubbles:true}));
 const session=sheetSession;showTab('library');prepareSheetPrint();check('Printing another tab does not expose a hidden character draft',!document.body.classList.contains('printing-character-sheet'));showTab('character-sheet');
 check('Main navigation preserves dirty character form and session',sheetSession===session&&sheetSession.dirty&&document.querySelector('[name="notes"]').value==='Unfinished draft');
 await openCharacterSheet('c1');check('Same-character shortcut retains unsaved draft',sheetSession===session&&sheetSession.dirty);
 check('Player chooser excludes other players characters',!document.querySelector('#sheetCharacterSelect [value="c2"]'));
 characters.push({id:'c3',name:'Second hero',class:'Rogue',level:1,userId:'player'});renderCharacterSheetChooser();window.confirm=()=>false;await openCharacterSheet('c3');
 check('Canceled character switch keeps draft and restores chooser',sheetSession===session&&document.getElementById('sheetCharacterSelect').value==='c1');
 await leaveCampaign();check('Canceled campaign change keeps active campaign and draft',activeCampaign.id==='a'&&sheetSession===session);window.confirm=()=>true;
 await openCharacterSheet('c3');check('Confirmed character switch opens a new private sheet',sheetSession.characterId==='c3'&&document.getElementById('sheetCharacterSelect').value==='c3');
 closeCharacterSheet(true);check('Forced close removes private data and chooser names',!sheetSession&&!document.getElementById('characterSheetDialog')&&!document.getElementById('characterSheetChooser').textContent);
 characters=[];selectedCharacter=null;showTab('character-sheet');check('Empty campaign gives clear create-character path',!!document.getElementById('sheetGoToCharacters'));
 seed('dm');closeCharacterSheet(true);await openCharacterSheet('c1');check('DM roster entry opens the same full-page sheet',sheetSession.characterId==='c1'&&document.getElementById('tab-character-sheet').style.display==='block');closeCharacterSheet(true);
}catch(e){results.push({name:e.stack,pass:false});}
window.confirm=()=>true;document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
