'use strict';
/* Private DM-authored text uses the same character document and Save sheet transaction. */
var CharacterDMNotesUI=(()=>{
 let current=null;
 const mayWrite=session=>canManageCampaign()||!!(session.adventureId&&session.oneShot?.data?.approved&&session.oneShot.data.hostUid===auth.currentUser?.uid);
 const live=state=>state&&characterHPCurrent(state.session)&&state.root.host.isConnected&&state.root.state.style==='adobe'&&state.session.uid===auth.currentUser?.uid;
 function refresh(){
  const state=current;if(!state)return;const {session,panel,input,status,save}=state,allowed=live(state)&&(mayWrite(session)||session.character.userId===auth.currentUser?.uid);panel.hidden=!allowed;if(!allowed){input.value='';return;}
  const editable=mayWrite(session),text=session.data.dmNotes||'';input.readOnly=!editable;input.placeholder=editable?'Write notes for this character…':'Your DM has not added any notes yet.';if(input.value!==text)input.value=text;
  panel.querySelector('[data-dm-notes-help]').textContent=editable?'Only the DM and this character’s player can see these notes.':'Shared with you and the DM. Only the DM can edit these notes.';
  panel.querySelector('[data-dm-notes-count]').textContent=text.length+' / 6000';save.hidden=!editable;save.disabled=session.saving===true;
  const pending=text!==(session.savedDmNotes||'');status.textContent=editable?(session.saving?'Saving sheet…':pending?'Unsaved DM notes. Use Save sheet to keep them.':'DM notes saved with this character.'):(text?'Notes from your DM.':'No DM notes yet.');
 }
 function install(root,container){
  destroy();const session=root.session,panel=document.createElement('aside');panel.className='adobe-dm-notes';panel.dataset.sheetDmNotes='';panel.setAttribute('aria-label','DM notes for this character');
  panel.innerHTML='<details><summary>DM notes <span>Shared</span></summary><div class="adobe-dm-notes-body"><p data-dm-notes-help></p><label for="characterDmNotes">Notes from the DM</label><textarea id="characterDmNotes" data-dm-notes-input rows="10" maxlength="6000" spellcheck="true"></textarea><div class="adobe-dm-notes-footer"><small data-dm-notes-count></small><button type="button" data-dm-notes-save>Save sheet</button></div><p data-dm-notes-status role="status" aria-live="polite"></p></div></details>';
  container.append(panel);const input=panel.querySelector('textarea'),status=panel.querySelector('[data-dm-notes-status]'),save=panel.querySelector('button'),media=matchMedia('(min-width:1280px)'),details=panel.querySelector('details'),resize=()=>{details.open=media.matches;};resize();media.addEventListener('change',resize);
  const state=current={root,session,panel,input,status,save,media,resize};
  input.oninput=()=>{if(current!==state||!live(state)||!mayWrite(session)){refresh();return;}session.data.dmNotes=input.value.slice(0,6000);session.dirty=true;sheetStatus('Unsaved DM notes. Save sheet to keep them.');refresh();};
  save.onclick=async()=>{if(current!==state||!live(state)||!mayWrite(session)||session.saving)return;const result=await saveCharacterSheet();if(result===false&&current===state&&live(state))status.textContent=document.getElementById('sheetStatus')?.textContent||'Could not save. Your notes are still here.';};refresh();
 }
 function destroy(root){if(!current||root&&current.root!==root)return;current.media.removeEventListener('change',current.resize);current.input.oninput=null;current.save.onclick=null;current.input.value='';current.panel.remove();current=null;}
 return{install,refresh,destroy};
})();
