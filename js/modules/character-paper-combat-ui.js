'use strict';
/* Standard and source pages edit the same private reminder/counter model. */
function characterPaperCombatCurrent(session){return sheetSession===session&&session?.uid===auth.currentUser?.uid&&session.campaignId===activeCampaign?.id;}
function applyCharacterPaperCombat(next){
 if(!characterPaperCombatCurrent(sheetSession))return false;
 sheetSession.data.adobe.paperCombat=next;sheetSession.dirty=true;globalThis.CharacterAdobeView?.refresh();renderCharacterPaperCombat();sheetStatus('Combat reminders updated. Save sheet to keep changes.');return true;
}
function renderCharacterPaperCombat(){
 const parent=document.getElementById('sheet-combat');if(!parent||!sheetSession)return;
 let host=document.getElementById('sheetPaperCombat');if(!host){host=document.createElement('details');host.id='sheetPaperCombat';host.className='sheet-paper-combat';host.innerHTML='<summary>Actions & ammunition · paper reminders</summary>';parent.append(host);host.ontoggle=()=>{if(host.open)renderCharacterPaperCombat();};}
 if(!host.open||host.querySelector('[aria-invalid="true"]'))return;
 const session=sheetSession,P=CharacterPaperCombat,data=session.data.adobe.paperCombat,active=document.activeElement;
 // Preserve the active editor and pending clicks while updating its other readouts.
 if(host.querySelector('[data-paper-action]')){
  for(const input of host.querySelectorAll('[data-paper-action]'))if(input!==active)input.value=data.actions[input.dataset.paperAction][Number(input.dataset.paperIndex)];
  for(const input of host.querySelectorAll('[data-paper-ammo]'))if(input!==active)input.value=data.ammunition[Number(input.dataset.paperIndex)][input.dataset.paperAmmo];
  for(const output of host.querySelectorAll('[data-paper-loaded]')){const row=P.ammoProjection(data.ammunition[Number(output.dataset.paperLoaded)]);output.textContent=row.loaded+' / '+row.capacity+' in current load';}
  return;
 }
 const esc=sheetEscape;
 host.innerHTML='<summary>Actions & ammunition · paper reminders</summary><datalist id="sheetPaperAmmoTypes">'+Object.keys(P.ammoTypes).map(name=>'<option value="'+esc(name)+'"></option>').join('')+'</datalist><p class="sheet-help">These reminders also appear in the Adobe sheet and print. They do not grant extra actions, cast spells or spend feature uses. Ammunition tracks remaining shots separately from owned inventory quantities.</p>'+P.groups.map(group=>'<details data-paper-group="'+group+'"><summary>'+P.labels[group]+'s · 12 rows</summary>'+data.actions[group].map((text,index)=>'<div class="sheet-paper-action-row"><label>'+P.labels[group]+' '+(index+1)+'<input type="text" maxlength="4000" data-paper-action="'+group+'" data-paper-index="'+index+'" value="'+esc(text)+'"></label><button type="button" data-paper-menu="'+group+'" data-paper-index="'+index+'" aria-label="Options for '+P.labels[group]+' '+(index+1)+'">Options</button></div>').join('')+'</details>').join('')+'<div class="sheet-paper-ammo-grid">'+data.ammunition.map((raw,index)=>{const row=P.ammoProjection(raw);return '<section><h4>'+(index?'Right':'Left')+' ammunition</h4><label>Type<input type="text" maxlength="120" list="sheetPaperAmmoTypes" data-paper-ammo="name" data-paper-index="'+index+'" value="'+esc(row.name)+'"></label><label>Remaining<input type="number" min="0" max="1000000" step="1" data-paper-ammo="amount" data-paper-index="'+index+'" value="'+row.amount+'"></label><p><output data-paper-loaded="'+index+'">'+row.loaded+' / '+row.capacity+' in current load</output></p><div class="sheet-inline-controls">'+[['spend','Use one'],['undo','Undo one'],['reload','Reload remaining']].map(([command,label])=>'<button type="button" data-paper-ammo-command="'+command+'" data-paper-index="'+index+'">'+label+'</button>').join('')+'</div></section>';}).join('')+'</div><p data-paper-status role="status"></p>';
 for(const input of host.querySelectorAll('[data-paper-action],[data-paper-ammo]')){
  input.oninput=()=>{if(characterPaperCombatCurrent(session)&&host.isConnected){sheetSession.dirty=true;sheetStatus('Unsaved changes');}};
  input.onchange=()=>{if(!characterPaperCombatCurrent(session)||!host.isConnected)return;try{const next=input.hasAttribute('data-paper-action')?P.editAction(sheetSession.data.adobe.paperCombat,input.dataset.paperAction,Number(input.dataset.paperIndex),input.value):P.editAmmo(sheetSession.data.adobe.paperCombat,Number(input.dataset.paperIndex),input.dataset.paperAmmo,input.value);input.removeAttribute('aria-invalid');input.setCustomValidity('');applyCharacterPaperCombat(next);host.querySelector('[data-paper-status]').textContent='';}catch(error){input.setAttribute('aria-invalid','true');input.setCustomValidity(error.message);host.querySelector('[data-paper-status]').textContent=error.message;sheetStatus(error.message,true);}};
 }
 for(const button of host.querySelectorAll('[data-paper-menu]'))button.onclick=()=>openCharacterPaperActionMenu(button.dataset.paperMenu,Number(button.dataset.paperIndex));
 for(const button of host.querySelectorAll('[data-paper-ammo-command]'))button.onclick=()=>{const invalid=host.querySelector('[aria-invalid="true"]');if(invalid){invalid.focus();return;}if(!characterPaperCombatCurrent(session)||!host.isConnected)return;try{applyCharacterPaperCombat(P.editAmmo(sheetSession.data.adobe.paperCombat,Number(button.dataset.paperIndex),button.dataset.paperAmmoCommand));host.querySelector('[data-paper-status]').textContent='';}catch(error){host.querySelector('[data-paper-status]').textContent=error.message;sheetStatus(error.message,true);}};
}
function openCharacterPaperActionMenu(group,index){
 const session=sheetSession,P=CharacterPaperCombat;if(!characterPaperCombatCurrent(session))return;
 const host=document.getElementById('sheetPaperCombat'),invalid=host?.querySelector('[aria-invalid="true"]');if(invalid){sheetStatus('Correct the highlighted action or ammunition field.',true);requestAnimationFrame(()=>{if(invalid.isConnected)invalid.focus();});return;}
 document.getElementById('sheetPaperActionMenu')?.remove();const dialog=document.createElement('dialog'),opener=document.activeElement?.shadowRoot?.activeElement||document.activeElement;dialog.id='sheetPaperActionMenu';dialog.className='vault-dialog sheet-paper-action-menu';dialog.setAttribute('aria-labelledby','sheetPaperActionMenuTitle');
 let selected=index;const original=session.data.adobe.paperCombat;
 const allowed=()=>characterPaperCombatCurrent(session)&&dialog.isConnected&&session.data.adobe.paperCombat===original;
 const close=()=>{if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus();};
 const render=()=>{const rows=session.data.adobe.paperCombat.actions[group];dialog.innerHTML='<h2 id="sheetPaperActionMenuTitle">'+P.labels[group]+' '+(selected+1)+' options</h2><p>Move a reminder with its text, insert an empty row, or remove it. Save sheet to keep changes.</p><div class="sheet-inline-controls">'+[['up','Move up',selected===0],['down','Move down',selected===11],['opposite','Swap with opposing field',group!=='action'||selected<6],['insert','Insert empty row',!rows[selected]||!rows.some((text,i)=>i>selected&&!text)],['delete','Delete item',!rows[selected]],['clear','Clear item',!rows[selected]]].map(([command,label,disabled])=>'<button type="button" data-paper-row-command="'+command+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div><p data-paper-menu-status role="status"></p><button type="button" data-paper-menu-done>Done</button>';
  dialog.querySelector('[data-paper-menu-done]').onclick=close;
  for(const button of dialog.querySelectorAll('[data-paper-row-command]'))button.onclick=async()=>{
   if(!allowed()){close();return;}const command=button.dataset.paperRowCommand;
   if(['clear','delete'].includes(command)&&!await SiteConfirmation.ask({title:(command==='clear'?'Clear':'Delete')+' this '+P.labels[group].toLowerCase()+'?',paragraphs:[rows[selected],command==='delete'?'Later reminders move up.':'The row stays in place.'],confirmLabel:command==='clear'?'Clear reminder':'Delete reminder',isCurrent:allowed}))return;
   if(!allowed()){close();return;}
   try{const result=P.operation(session.data.adobe.paperCombat,group,selected,command);Object.assign(original,result.data);selected=result.index;applyCharacterPaperCombat(original);render();dialog.querySelector('[data-paper-row-command="'+command+'"]')?.focus();}catch(error){dialog.querySelector('[data-paper-menu-status]').textContent=error.message;}
  };
 };
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);render();dialog.showModal();dialog.querySelector('button:not(:disabled)')?.focus();
}
const characterPaperCombatBaseSetup=window.setupCharacterPlayUI;
window.setupCharacterPlayUI=function(...args){const result=characterPaperCombatBaseSetup?.apply(this,args);renderCharacterPaperCombat();return result;};
const characterPaperCombatBaseUpdate=window.updateCharacterPlayUI;
window.updateCharacterPlayUI=function(...args){const result=characterPaperCombatBaseUpdate?.apply(this,args);renderCharacterPaperCombat();return result;};
