'use strict';
/* The original footer and copy destinations change paper references, not ownership. */
var CharacterPaperInventoryUI=(()=>{
 let currentClose=null;
 const physical=(data,loot)=>loot.map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:inventoryUnitWeight(entry.item||{}),location:data.personalGear.find(row=>row.id===entry.id)?.location||''}));
 const project=(data,loot=sheetEquipmentLoot())=>CharacterPaperInventory.project(data.adobe.paperInventory,physical(data,loot));
 const editableRows=(data,loot=sheetEquipmentLoot())=>CharacterPaperInventory.gearRows(data.adobe.paperInventory,physical(data,loot));
 function apply(state,message,session=sheetSession){
  if(!characterPaperCombatCurrent(session))throw Error('This character session is no longer active.');
  readSheetForm();session.data.adobe.paperInventory=CharacterPaperInventory.normalize(state);session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus(message+' Save sheet to keep it.');
 }
 function copy(id,destination){
  const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('This character session is no longer active.');
  const physical=sheetEquipmentLoot().map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:inventoryUnitWeight(entry.item||{})}));
  const result=CharacterPaperInventory.copy(session.data.adobe.paperInventory,physical,id,destination);
  if(result.reused)sheetStatus('This item already appears in that section.');else apply(result.state,'Item reference copied. Quantity and physical carried weight are unchanged.',session);return result;
 }
 function setFooter(enabled){const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('This character session is no longer active.');apply(CharacterPaperInventory.footer(session.data.adobe.paperInventory,enabled),enabled?'Attuned Magical Items footer shown. Displaced gear stays on the equipment continuation.':'Full equipment rows restored. Footer references are retained.',session);}
 function render(){
  const session=sheetSession,panel=document.getElementById('sheet-inventory');if(!session||!panel)return;
  let host=document.getElementById('sheetPaperInventoryLayout');if(!host){host=document.createElement('section');host.id='sheetPaperInventoryLayout';host.className='sheet-editor-box';panel.append(host);}
  const state=CharacterPaperInventory.normalize(session.data.adobe.paperInventory),projection=project(session.data),esc=sheetEscape;
  host.innerHTML='<h4>Equipment layout</h4><label class="sheet-check"><input type="checkbox" data-paper-footer '+(state.attunedFooter?'checked':'')+'> Show Attuned Magical Items footer on page 2</label><p class="sheet-help">The original footer uses one heading and three reference rows. Other owned gear moves to the equipment continuation; nothing is removed. Turn this off to restore the full gear column. Copy references from a magic-item row’s options.</p><div data-paper-copies></div><p class="sheet-help">Reference copies leave quantity blank, as in the original copy action. They do not create another item or attune it. A blank amount counts one unit in Adobe column totals; physical Inventory weight is unchanged.</p>';
  const footer=host.querySelector('[data-paper-footer]');footer.onchange=()=>{if(characterPaperCombatCurrent(session)&&host.isConnected)setFooter(footer.checked);};
  const references=[...state.footer.flatMap((row,i)=>row?[{...row,destination:'footer',label:'Footer row '+(i+1)}]:[]),...projection.copyRows.filter(row=>row.slot>=0).map(row=>({...row,name:state.copies.find(copy=>copy.key===row.key)?.name||'Item reference',label:row.slot<54?'Adventuring Gear':row.slot<90?'Extra Equipment':'Equipment continuation'}))];
  for(const row of references){const line=document.createElement('div');line.className='sheet-paper-copy-row';line.innerHTML='<span>'+esc(row.name)+' · '+esc(row.label)+'</span><button type="button">Clear reference</button>';line.querySelector('button').onclick=()=>{if(!characterPaperCombatCurrent(session)||!line.isConnected)return;apply(CharacterPaperInventory.remove(session.data.adobe.paperInventory,row.id,row.destination,row.key),'Paper reference cleared. The owned item is unchanged.',session);};host.querySelector('[data-paper-copies]').append(line);}
 }
 const baseUpdate=window.updateCharacterPlayUI;
 window.updateCharacterPlayUI=function(...args){const result=baseUpdate?.apply(this,args);render();return result;};
 function openFooter(index){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!CharacterAdobeView.validate()||!Number.isInteger(index)||index<51||index>53||!session.data.adobe.paperInventory.attunedFooter)return;
  const opener=document.getElementById('sheetAdobeView')?.shadowRoot?.activeElement||document.activeElement;currentClose?.();let closed=false,observer;
  const dialog=document.createElement('dialog');dialog.id='adobeFooterDialog';dialog.className='vault-dialog adobe-gear-dialog';dialog.setAttribute('aria-labelledby','adobeFooterTitle');dialog.dataset.noContextHelp='';
  const signature=()=>JSON.stringify({data:session.data,identity:session.identity,loot:sheetEquipmentLoot()});let snapshot=signature();
  const close=()=>{if(closed)return;closed=true;observer?.disconnect();if(currentClose===close)currentClose=null;if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});};currentClose=close;
  const allowed=()=>characterHPCurrent(session)&&!session.saving&&dialog.isConnected&&signature()===snapshot;
  const guard=()=>{if(allowed())return true;close();if(characterHPCurrent(session))sheetStatus('This item or character changed. Reopen the footer row.',true);return false;};
  const row=project(session.data).entries[index],derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),owned=CharacterPaperMagicUI.all(session.data,derived),magical=row&&!row.unavailable&&owned.some(entry=>entry.entry.id===row.id),esc=sheetEscape;
  dialog.innerHTML='<header class="adobe-gear-head"><div><span>ATTUNED MAGICAL ITEMS · PAGE 2 · ROW '+(index-50)+'</span><h2 id="adobeFooterTitle">'+esc(row?.name||'Empty magic reference')+'</h2><p>Copy this owned item to the original Magic Items table.</p></div><div><button type="button" data-footer-save>Save sheet</button><button type="button" data-footer-done>Done</button></div></header><div class="adobe-gear-body"><section><h3>Magic Items (page 3)</h3><p>The existing item is reused, or its hidden reference is restored into an empty row. Equipment and attunement stay unchanged; use the magic-item row to change them.</p><button type="button" data-footer-copy '+(!magical?'disabled':'')+'>Copy to Magic Items (page 3)</button>'+(!magical?'<p>This action needs an available owned magic item. Add a reference through Equipment layout.</p>':'')+'</section><section class="adobe-gear-actions"><button type="button" data-footer-description '+(!row||row.unavailable?'disabled':'')+'>Read full item description</button><button type="button" data-footer-clear '+(!row?'disabled':'')+'>Clear reference</button><button type="button" data-footer-layout>Equipment layout</button></section></div><footer><p data-footer-status role="status" aria-live="polite"></p></footer>';
  const status=dialog.querySelector('[data-footer-status]'),source=document.getElementById('sheetStatus'),sync=()=>{status.textContent=source?.textContent||'';dialog.querySelector('[data-footer-save]').disabled=session.saving===true;};observer=source?new MutationObserver(sync):null;observer?.observe(source,{childList:true,subtree:true,characterData:true});sync();
  dialog.querySelector('[data-footer-done]').onclick=close;dialog.querySelector('[data-footer-save]').onclick=()=>{if(guard())document.getElementById('sheetSave')?.click();};
  dialog.querySelector('[data-footer-copy]').onclick=async()=>{
   if(!guard())return;try{
    const result=CharacterPaperMagic.copy(session.data.adobe.paperMagic,owned,row.id);if(!result.reused){CharacterPaperMagicUI.apply(result,session);snapshot=signature();}close();const message=result.reused?'This item already appears in Magic Items. Equipment and attunement are unchanged.':'Magic-item reference restored. Equipment and attunement are unchanged. Save sheet to keep it.';sheetStatus(message);
    try{if(!await CharacterAdobeView.showMagicRow(result.index)&&characterHPCurrent(session))sheetStatus(message+' Open the Magic Items page to view it.',true);}catch{if(characterHPCurrent(session))sheetStatus(message+' The destination could not be loaded; retry it from the page menu.',true);}
   }catch(error){status.textContent=error.message;}
  };
  dialog.querySelector('[data-footer-description]').onclick=()=>{if(!guard())return;close();openInventoryItemInformation(row.id);};
  dialog.querySelector('[data-footer-layout]').onclick=()=>{if(!guard())return;close();CharacterAdobeView.openEditor('paperInventory');};
  dialog.querySelector('[data-footer-clear]').onclick=async()=>{
   if(!guard()||!await SiteConfirmation.ask({title:'Clear this footer reference?',paragraphs:[row.name,'The item remains owned. Equipment, attunement and recorded uses are retained.'],confirmLabel:'Clear reference',isCurrent:allowed}))return;if(!guard())return;apply(CharacterPaperInventory.remove(session.data.adobe.paperInventory,row.id,'footer'),'Footer reference cleared.',session);close();
  };
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',close);document.getElementById('characterSheetDialog').append(dialog);dialog.showModal();dialog.querySelector('[data-footer-done]').focus();
 }
 function artwork(paper,page,data){
  paper.querySelector('.adobe-equipment-footer-mask')?.remove();if(page.id!=='page-2')return;
  const enabled=CharacterPaperInventory.normalize(data.adobe.paperInventory).attunedFooter,button=paper.querySelector('[data-pdf-button="Adventuring Gear Button 51"]');if(button)button.hidden=enabled;
  if(!enabled)return;const source=page.fields.find(row=>row.id==='Attuned Magic Items Whiteout');if(!source)return;
  const mask=document.createElement('div'),[x,y,r,b]=source.rect;mask.className='adobe-equipment-footer-mask';mask.setAttribute('aria-hidden','true');Object.assign(mask.style,{position:'absolute',background:'#fff',pointerEvents:'none',left:100*x/page.width+'%',top:100*y/page.height+'%',width:100*(r-x)/page.width+'%',height:100*(b-y)/page.height+'%'});paper.insertBefore(mask,paper.querySelector('.field'));
 }
 return{project,editableRows,copy,setFooter,render,artwork,openFooter,destroy:()=>currentClose?.()};
})();
