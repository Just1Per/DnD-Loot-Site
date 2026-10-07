(async()=>{
 const results=[],check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
  const field=key=>document.querySelector('#characterSheetForm [name="'+key+'"]');
  check('Appearance, allies and enemies live on the left', ['appearance','allies','enemies'].every(key=>field(key).closest('.sheet-story-left')));
  check('Four traits have one editable wrapping control each on the right', ['personality','ideals','bonds','flaws'].every(key=>field(key).closest('.sheet-story-right')&&field(key).getAttribute('role')==='combobox'&&!field(key).readOnly&&document.querySelectorAll('[name="'+key+'"]').length===1));
  field('build.background').value='acolyte-2024';field('build.background').dispatchEvent(new Event('change',{bubbles:true}));
  for(const key of ['personality','ideals','bonds','flaws']){
    const list=document.querySelector('[data-story-choice="'+key+'"]'),button=list.querySelector('[data-story-option="0"]');
    document.querySelector('[data-story-toggle="'+key+'"]').click();
    check(key+' dropdown opens and shows its full suggestion',!list.hidden&&button.textContent.length>0);
    button.click();check(key+' selection is editable and updates saved state',list.hidden&&!field(key).readOnly&&sheetSession.data[key]===field(key).value&&field(key).value.length>0);
    field(key).value+=' My own addition.';field(key).dispatchEvent(new Event('input',{bubbles:true}));
    check(key+' accepts edits to a suggestion',sheetSession.data[key].endsWith('My own addition.'));
  }
  const prior=sheetSession.data.personality;
  field('build.background').value='criminal-2024';field('build.background').dispatchEvent(new Event('change',{bubbles:true}));
  check('Background switching refreshes suggestions without losing custom text',sheetSession.data.personality===prior&&document.querySelector('[data-story-choice="personality"] [data-story-option="0"]').textContent!==CharacterStory.get('acolyte-2024').personality[0]);
  field('enemies').value='The Red Knives';field('enemies').dispatchEvent(new Event('input',{bubbles:true}));
  await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');
  check('Enemies and edited traits survive save and reopen',sheetSession.data.enemies==='The Red Knives'&&sheetSession.data.personality===prior&&field('enemies').value==='The Red Knives');
 }catch(e){results.push({name:e.stack,pass:false})}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
