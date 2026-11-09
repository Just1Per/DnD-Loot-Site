'use strict';
/* Original row arrows use the same private record commands as Standard Notes. */
function openCharacterPaperLogMenu(index){
 const session=sheetSession,L=CharacterAdventureLog;
 if(!characterAdventureLogCurrent(session)||!CharacterAdobeView.active()||!CharacterAdobeView.validate()||!characterAdventureLogValid()||!Number.isInteger(index)||index<0||index>=L.MAX_ROWS)return;
 document.getElementById('sheetPaperLogMenu')?.remove();const dialog=document.createElement('dialog');dialog.id='sheetPaperLogMenu';dialog.className='vault-dialog sheet-paper-log-menu';dialog.dataset.noContextHelp='';dialog.setAttribute('aria-labelledby','sheetPaperLogMenuTitle');let selected=index,busy=false;
 const signature=()=>JSON.stringify(L.normalize(session.data.adobe.adventureLog));let snapshot=signature();
 const allowed=()=>characterAdventureLogCurrent(session)&&CharacterAdobeView.active()&&dialog.isConnected&&signature()===snapshot;
 const close=()=>{if(dialog.open)dialog.close();dialog.remove();const button=document.getElementById('sheetAdobeView')?.shadowRoot?.querySelector('[data-pdf-button="Button.AdvLog.'+(selected%6+1)+'"]');if(button?.isConnected&&!button.closest('[hidden]'))button.focus();};
 const render=()=>{
  const log=session.data.adobe.adventureLog,row=L.project(log)[selected],count=log.rows.length,esc=sheetEscape,recorded=selected<count;
  dialog.innerHTML='<h2 id="sheetPaperLogMenuTitle">Log entry '+(selected+1)+' options</h2><h3>'+esc(row.adventure||'Untitled session')+'</h3><p>Move or copy the complete record, including calculations and notes. Later log balances recalculate. Save sheet keeps your changes.</p>'+(recorded?'<p>XP gained / spent: '+esc(row.gain.xp||0)+' · Gold gained / spent: '+esc(row.gain.gold||0)+' gp</p>':'<p>This entry has not been recorded yet.</p>')+'<div class="sheet-paper-log-actions">'+[['earlier','Move up'+(selected%6===0&&selected?' · previous page':''),!recorded||selected===0],['later','Move down'+(selected%6===5?' · next page':''),!recorded||selected===L.MAX_ROWS-1],['insert','Insert empty entry before',selected>count||count>=L.MAX_ROWS],['duplicate','Duplicate entry',!recorded||count>=L.MAX_ROWS],['remove','Delete entry',!recorded],['clear','Clear entry',!recorded]].map(([command,label,disabled])=>'<button type="button" data-paper-log-command="'+command+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div><p data-paper-log-status role="status">Changes affect this private log.</p></div><div class="sheet-inline-controls"><button type="button" data-paper-log-editor>Edit this entry</button><button type="button" data-paper-log-done>Done</button></div>';
  dialog.querySelector('[data-paper-log-done]').onclick=close;
  dialog.querySelector('[data-paper-log-editor]').onclick=()=>{if(!allowed()){close();return;}close();CharacterAdobeView.selectLogEntry(selected);CharacterAdobeView.openEditor('notes');const host=document.getElementById('sheetAdventureLog');if(host){host.dataset.index=String(selected);host.open=true;renderCharacterAdventureLog();host.querySelector('[data-log-field="adventure"]')?.focus();}};
  for(const button of dialog.querySelectorAll('[data-paper-log-command]'))button.onclick=async()=>{
   if(busy)return;if(!allowed()){close();return;}busy=true;
   try{const result=await applyCharacterAdventureLogOperation(selected,button.dataset.paperLogCommand,allowed);if(!result){if(!allowed())close();return;}selected=result.index;snapshot=signature();CharacterAdobeView.selectLogEntry(selected);render();dialog.querySelector('[data-paper-log-status]').textContent=({earlier:'Moved entry up.',later:'Moved entry down.',insert:'Inserted an empty entry.',duplicate:'Duplicated entry.',remove:'Deleted entry.',clear:'Cleared entry.'})[button.dataset.paperLogCommand]+' Save sheet to keep changes.';dialog.querySelector('[data-paper-log-command="'+button.dataset.paperLogCommand+'"]:not(:disabled),[data-paper-log-editor]')?.focus();}
   catch(error){if(dialog.isConnected&&characterAdventureLogCurrent(session))dialog.querySelector('[data-paper-log-status]').textContent=error.message;}
   finally{busy=false;}
  };
 };
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);render();dialog.showModal();dialog.querySelector('[data-paper-log-editor]').focus();
}
