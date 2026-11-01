'use strict';
/* Source row operations and shared equipment state, with one private character save. */
var CharacterPaperMagicUI=(()=>{
 let currentClose=null;
 function all(data,derived){
  const ranks=new Map((data.adobe.paperMagicOrder||[]).map((id,i)=>[id,i]));
  return (derived.gear.entries||[]).filter(row=>CharacterMagicItems.isMagical(row.item)).sort((a,b)=>(ranks.get(a.entry.id)??Number.MAX_SAFE_INTEGER)-(ranks.get(b.entry.id)??Number.MAX_SAFE_INTEGER));
 }
 const rows=(data,derived)=>CharacterPaperMagic.rows(data.adobe.paperMagic,all(data,derived));
 const count=(data,derived)=>rows(data,derived).reduce((last,row,i)=>row?i+1:last,0);
 function apply(result,session=sheetSession){
  if(!characterPaperCombatCurrent(session))throw Error('This character session is no longer active.');
  readSheetForm();session.data.adobe.paperMagic=result.state;
  const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());session.data.adobe.paperMagicOrder=rows(session.data,derived).filter(Boolean).map(row=>row.entry.id);
  // Clear/Delete ends the removed item's effects; ownership, quantity and uses remain private inventory data.
  const removed=new Set(result.deactivate);session.data.equipmentState.loadout=session.data.equipmentState.loadout.map(choice=>removed.has(choice.id)?{...choice,equipped:false,attuned:false}:choice);
  session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('Magic item row updated. Save sheet to keep the change.');
 }
 function choose(index,id){
  const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('This character session is no longer active.');
  const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());apply(CharacterPaperMagic.choose(session.data.adobe.paperMagic,all(session.data,derived),index,id),session);
 }
 function open(index){
  const session=sheetSession;
  if(!characterPaperCombatCurrent(session)||!Number.isInteger(index)||index<0||index>999||!CharacterAdobeView.validate())return;
  readSheetForm();if(index>=rows(session.data,CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot())).length)return;
  const opener=document.getElementById('sheetAdobeView')?.shadowRoot?.activeElement||document.activeElement;currentClose?.();
  const dialog=document.createElement('dialog');dialog.id='sheetPaperMagicMenu';dialog.className='vault-dialog sheet-paper-magic-menu';dialog.setAttribute('aria-labelledby','sheetPaperMagicTitle');let selected=index;
  const signature=()=>JSON.stringify({data:CharacterSheetModel.normalize(session.data),identity:session.identity,loot:sheetEquipmentLoot()});let snapshot=signature(),observer;
  const close=()=>{observer?.disconnect();if(currentClose===close)currentClose=null;if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});};currentClose=close;
  const allowed=()=>characterPaperCombatCurrent(session)&&dialog.isConnected&&signature()===snapshot;
  const guard=()=>{if(allowed())return true;close();if(characterPaperCombatCurrent(session))sheetStatus('This item or character changed. Open the item options again.',true);return false;};
  const render=()=>{
   const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),owned=all(session.data,derived),list=rows(session.data,derived),row=list[selected],esc=sheetEscape;
   const id=row?.entry.id,available=row&&!row.unavailable,attunement=available&&CharacterMagicItems.requiresAttunement(row.item),active=available&&derived.magicItems.active.some(entry=>entry.entry.id===id&&entry.magicActive);
   dialog.innerHTML='<header><div><span class="sheet-eyebrow">MAGIC ITEM · ROW '+(selected+1)+'</span><h2 id="sheetPaperMagicTitle">'+esc(row?.item.name||'Empty magic-item row')+'</h2></div><div><button type="button" data-magic-save>Save sheet</button><button type="button" data-magic-done>Done</button></div></header>'+
    '<div class="sheet-magic-body"><p class="sheet-help">Use the original row options below. Save sheet keeps your changes.</p><label class="sheet-field">'+(row?'Change item':'Apply item')+'<select data-magic-choice><option value="">Choose an owned item</option>'+owned.map(entry=>'<option value="'+esc(entry.entry.id)+'" '+(entry.entry.id===id?'selected':'')+'>'+esc(entry.item.name)+'</option>').join('')+'</select></label>'+
    (available?'<section class="sheet-magic-state" aria-label="Equipment state"><span>'+(row.choice.equipped?'Equipped / worn':'In backpack')+'</span><span>'+(attunement?(row.choice.attuned?'Attuned':'Not attuned'):'No attunement required')+'</span></section><p class="sheet-help">'+(active?'Automatic equipped effects are enabled. Read the full description for effects you resolve during play.':'Equipped effects are inactive until the required worn/attunement choices are met.')+'</p><section><h3>Use this item</h3><div class="sheet-magic-actions"><button type="button" data-magic-equipped="'+!row.choice.equipped+'">'+(row.choice.equipped?'Put in backpack':'Equip / wear')+'</button>'+(attunement?'<button type="button" data-magic-attuned="'+!row.choice.attuned+'">'+(row.choice.attuned?'End attunement':'Attune to item')+'</button>':'')+'</div><p class="sheet-help">Attuned: '+derived.gear.attuned+' / '+derived.gear.attunementLimit+'. These choices do not restore charges or spend an item.</p></section>':'')+
    '<section><h3>Position on the sheet</h3><div class="sheet-magic-actions"><button type="button" data-magic-move="-1" '+(selected===0?'disabled':'')+'>Move up'+(selected===5?' · to first page':'')+'</button><button type="button" data-magic-move="1" '+(selected===list.length-1?'disabled':'')+'>Move down'+(selected===4?' · to continuation':'')+'</button>'+[['insert','Insert empty item',!row||!list.some((value,i)=>i>selected&&!value)],['clear','Clear item',!row],['delete','Delete item',!row]].map(([command,label,disabled])=>'<button type="button" data-magic-operation="'+command+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div><p class="sheet-help">Moving and inserting rows retain item effects. Clear leaves a blank; Delete shifts later rows. Both end the removed item’s equipped effects and attunement, while keeping it and its uses in Inventory.</p></section>'+
    '<section><h3>Copy item reference</h3><div class="sheet-magic-actions"><button type="button" data-magic-copy="gear" '+(!available?'disabled':'')+'>Copy to Adventuring Gear (page 2)</button><button type="button" data-magic-copy="extra" '+(!available?'disabled':'')+'>Copy to Extra Equipment (page 3)</button>'+(session.data.adobe.paperInventory.attunedFooter&&attunement?'<button type="button" data-magic-copy="footer">Copy to Attuned Magical Items (page 2)</button>':'')+'<button type="button" data-magic-layout>Equipment layout</button></div><p class="sheet-help">Copies are paper references with blank quantity: one unit in Adobe columns, without adding physical Inventory stock. Enable the original Attuned Magical Items footer in Equipment layout to copy there.</p></section>'+
    '<div class="sheet-magic-actions"><button type="button" data-magic-description '+(!available?'disabled':'')+'>Read full description</button><button type="button" data-magic-inventory>Open equipment controls</button></div></div><p class="sheet-magic-status" role="status" aria-live="polite"></p>';
   const status=dialog.querySelector('.sheet-magic-status'),source=document.getElementById('sheetStatus');observer?.disconnect();
   const sync=()=>{status.textContent=source?.textContent||'';status.classList.toggle('sheet-error',source?.classList.contains('sheet-error')===true);};observer=source?new MutationObserver(sync):null;observer?.observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});sync();
   const refresh=()=>{snapshot=signature();render();};
   dialog.querySelector('[data-magic-done]').onclick=close;
   dialog.querySelector('[data-magic-save]').onclick=()=>{if(guard())document.getElementById('sheetSave')?.click();};
   dialog.querySelector('[data-magic-choice]').onchange=event=>{if(!guard())return;try{choose(selected,event.target.value);refresh();}catch(error){status.textContent=error.message;}};
   for(const button of dialog.querySelectorAll('[data-magic-equipped],[data-magic-attuned]'))button.onclick=()=>{
    if(!guard())return;const key=button.hasAttribute('data-magic-equipped')?'equipped':'attuned',value=button.getAttribute('data-magic-'+key)==='true';setSheetEquipmentChoice(id,key,value);refresh();dialog.querySelector('[data-magic-'+key+']')?.focus();
   };
   for(const button of dialog.querySelectorAll('[data-magic-move],[data-magic-operation]'))button.onclick=async()=>{
    if(!guard())return;const command=button.hasAttribute('data-magic-move')?(button.dataset.magicMove==='-1'?'up':'down'):button.dataset.magicOperation;
    if(['clear','delete'].includes(command)&&!await SiteConfirmation.ask({title:command==='clear'?'Clear this magic item?':'Delete this magic-item row?',paragraphs:[row?.item.name||'Empty row',command==='clear'?'The row stays blank.':'Later rows shift up.','Equipped effects and attunement end. The owned item, quantity and recorded uses stay in Inventory.'],confirmLabel:command==='clear'?'Clear item':'Delete row',isCurrent:allowed}))return;
    if(!guard())return;try{const result=CharacterPaperMagic.operation(session.data.adobe.paperMagic,owned,selected,command);apply(result,session);selected=result.index;refresh();dialog.querySelector('[data-magic-done]').focus();}catch(error){status.textContent=error.message;}
   };
   for(const button of dialog.querySelectorAll('[data-magic-copy]'))button.onclick=()=>{if(!guard())return;try{CharacterPaperInventoryUI.copy(id,button.dataset.magicCopy);refresh();dialog.querySelector('[data-magic-copy="'+button.dataset.magicCopy+'"]')?.focus();}catch(error){status.textContent=error.message;}};
   dialog.querySelector('[data-magic-layout]').onclick=()=>{if(!guard())return;close();CharacterAdobeView.openEditor('paperInventory');};
   dialog.querySelector('[data-magic-description]').onclick=()=>{if(!guard())return;close();openInventoryItemInformation(id);};
   dialog.querySelector('[data-magic-inventory]').onclick=()=>{if(!guard())return;close();CharacterAdobeView.openEditor('equipment');};
  };
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{observer?.disconnect();dialog.remove();});
  document.getElementById('characterSheetDialog').append(dialog);render();dialog.showModal();dialog.querySelector('[data-magic-done]').focus();
 }
 return{all,rows,count,choose,apply,open,destroy:()=>currentClose?.()};
})();
