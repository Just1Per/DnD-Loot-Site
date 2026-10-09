(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,pass)=>results.push({name,pass:!!pass});
 const button=document.getElementById('playerCreateCharBtn');
 const wait=async predicate=>{for(let i=0;i<100&&!predicate();i++)await new Promise(resolve=>setTimeout(resolve,10));if(!predicate())throw Error('Timed out waiting for character creation')};
 try{
  seed('player');closeCharacterSheet(true);testWrites.length=0;testAlerts.length=0;
  check('My Characters has one create button above the list and no identity inputs',button.textContent==='+ Create new character'&&!document.getElementById('playerCharName')&&!document.getElementById('playerCharClass')&&!document.getElementById('playerCharLevel')&&button.parentElement.nextElementSibling.id==='myCharacterList');
  renderCharacterList();check('Player identity edits are made through the sheet',!document.querySelector('#myCharacterList .btn-rename-char'));
  button.click();button.click();await wait(()=>!button.disabled);
  const write=testWrites.find(w=>w.path==='campaigns/a/characters');
  check('Double click creates one owned level-one character without choosing a class',testWrites.filter(w=>w.path==='campaigns/a/characters').length===1&&write?.data.userId==='player'&&write.data.class===''&&write.data.level===1);
  check('Creation opens the new editable sheet',sheetSession?.characterId===selectedCharacter?.id&&sheetSession.identity.name==='New character');
  document.querySelector('[name="identity.name"]').value='Mira the Brave';
  await saveCharacterSheet();
  check('Saving sheet identity updates My Characters',document.getElementById('myCharacterList').textContent.includes('Mira the Brave')&&testSheetDocs['campaigns/a/characters/'+selectedCharacter.id].name==='Mira the Brave');
  closeCharacterSheet(true);seed('player');testWrites.length=0;testFailWrite=true;
  button.click();await wait(()=>!button.disabled);testFailWrite=false;
  check('Failed creation is reported and allows retry',!testWrites.length&&testAlerts.some(a=>a.includes('Could not create character'))&&!button.disabled);
  const count=characters.length;activeCampaign=null;button.click();await new Promise(r=>setTimeout(r,0));
  check('Campaign creation remains scoped and requires a campaign',characters.length===count&&testWrites.length===0);
  seed('player','viewer');button.click();await new Promise(r=>setTimeout(r,0));
  check('Spectators cannot create characters',testWrites.length===0&&testAlerts.some(a=>a.includes('do not have permission')));
  seed('player');let release;window.testCreateGate=new Promise(resolve=>release=resolve);
  button.click();activeCampaign={id:'different'};characters=[];selectedCharacter=null;release();await wait(()=>!button.disabled);window.testCreateGate=null;
  check('A campaign switch during creation cannot populate another campaign',characters.length===0&&selectedCharacter===null&&sheetSession===null&&testWrites.at(-1).path==='campaigns/a/characters');
  testWrites.length=0;
  seed('player');characters=Array.from({length:10},(_,i)=>({id:'cap'+i,userId:'player',active:true}));button.click();await new Promise(r=>setTimeout(r,0));
  check('Existing campaign character cap is preserved',testWrites.length===0&&testAlerts.some(a=>a.includes('maximum of 10')));
 }catch(error){results.push({name:error.stack,pass:false})}
 finally{window.testCreateGate=null;testFailWrite=false;closeCharacterSheet(true);seed('player')}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
