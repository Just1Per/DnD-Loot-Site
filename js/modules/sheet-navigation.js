'use strict';
var SheetNavigation=(()=>{
 let pending=null;
 function cancel(){
  const previous=pending;pending=null;if(!previous)return;
  if(previous.dialog.open)previous.dialog.close();previous.dialog.remove();
  if(previous.opener?.isConnected)previous.opener.focus();
 }
 function guard(action){
  const s=sheetSession;
  if(pending){pending.dialog.focus();return false;}
  if(s?.saving){sheetStatus('Wait for the sheet to finish saving before leaving.');return false;}
  if(!s?.dirty)return true;
  const dialog=document.createElement('dialog');dialog.id='sheetLeaveDialog';dialog.className='sheet-leave-dialog';
  dialog.setAttribute('aria-labelledby','sheetLeaveTitle');dialog.setAttribute('aria-describedby','sheetLeaveDescription');
  dialog.innerHTML='<h2 id="sheetLeaveTitle">Save your character sheet?</h2><p id="sheetLeaveDescription">You have unsaved changes. Save them before continuing, discard them, or stay on this sheet.</p><p data-sheet-leave-status role="status" aria-live="polite"></p><div class="sheet-leave-actions"><button type="button" class="btn-primary" data-sheet-leave-save>Save and continue</button><button type="button" data-sheet-leave-discard>Leave without saving</button><button type="button" data-sheet-leave-stay>Stay here</button></div>';
  const p={s,uid:auth.currentUser?.uid,campaignId:activeCampaign?.id,dialog,opener:document.activeElement,action,busy:false};pending=p;
  const current=()=>pending===p&&sheetSession===s&&auth.currentUser?.uid===p.uid&&activeCampaign?.id===p.campaignId;
  const proceed=async()=>{
   if(!current())return;
   pending=null;if(dialog.open)dialog.close();dialog.remove();closeCharacterSheet(true);
   await action();
   if(auth.currentUser?.uid===p.uid&&!document.querySelector('dialog[open]'))document.querySelector('.tabs .tab.active')?.focus();
  };
  dialog.querySelector('[data-sheet-leave-save]').onclick=async()=>{
   if(!current()||p.busy)return;p.busy=true;
   dialog.querySelectorAll('button').forEach(button=>button.disabled=true);dialog.querySelector('[data-sheet-leave-status]').textContent='Saving your sheet…';
   try{
    const saved=await saveCharacterSheet({reportValidation:false});if(!current())return;
    if(saved&&!s.dirty){await proceed();return;}
    dialog.querySelector('[data-sheet-leave-status]').textContent=document.getElementById('sheetStatus')?.textContent||'Your changes could not be saved. Stay here to correct them, or try again.';
   }finally{p.busy=false;if(current())dialog.querySelectorAll('button').forEach(button=>button.disabled=false);}
  };
  dialog.querySelector('[data-sheet-leave-discard]').onclick=()=>{if(current()&&!p.busy)return proceed();};
  dialog.querySelector('[data-sheet-leave-stay]').onclick=()=>{if(!p.busy)cancel();};
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!p.busy)cancel();});
  dialog.addEventListener('close',()=>{if(pending===p)cancel();});
  document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-sheet-leave-stay]').focus();
  return false;
 }
 return{guard,cancel};
})();
