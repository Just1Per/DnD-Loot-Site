'use strict';
/* The original footer and copy destinations change paper references, not ownership. */
var CharacterPaperInventoryUI=(()=>{
 const project=(data,loot=sheetEquipmentLoot())=>CharacterPaperInventory.project(data.adobe.paperInventory,loot.map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:inventoryUnitWeight(entry.item||{}),location:data.personalGear.find(row=>row.id===entry.id)?.location||''})));
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
  host.innerHTML='<h4>Equipment layout</h4><label class="sheet-check"><input type="checkbox" data-paper-footer '+(state.attunedFooter?'checked':'')+'> Show Attuned Magical Items footer on page 2</label><p class="sheet-help">The original footer uses one heading and three reference rows. Other owned gear moves to the equipment continuation; nothing is removed. Turn this off to restore the full gear column. Copy references from a magic-item row’s options.</p><div data-paper-copies></div><p class="sheet-help">Reference copies leave quantity blank, as in the original copy action. They do not create another item, attune it or add carried weight.</p>';
  const footer=host.querySelector('[data-paper-footer]');footer.onchange=()=>{if(characterPaperCombatCurrent(session)&&host.isConnected)setFooter(footer.checked);};
  const references=[...state.footer.flatMap((row,i)=>row?[{...row,destination:'footer',label:'Footer row '+(i+1)}]:[]),...projection.copyRows.map(row=>({...row,name:state.copies.find(copy=>copy.id===row.id&&copy.destination===row.destination)?.name||'Item reference',label:row.displaced?'Equipment continuation':row.destination==='gear'?'Adventuring Gear':'Extra Equipment'}))];
  for(const row of references){const line=document.createElement('div');line.className='sheet-paper-copy-row';line.innerHTML='<span>'+esc(row.name)+' · '+esc(row.label)+'</span><button type="button">Clear reference</button>';line.querySelector('button').onclick=()=>{if(!characterPaperCombatCurrent(session)||!line.isConnected)return;apply(CharacterPaperInventory.remove(session.data.adobe.paperInventory,row.id,row.destination),'Paper reference cleared. The owned item is unchanged.',session);};host.querySelector('[data-paper-copies]').append(line);}
 }
 const baseUpdate=window.updateCharacterPlayUI;
 window.updateCharacterPlayUI=function(...args){const result=baseUpdate?.apply(this,args);render();return result;};
 function artwork(paper,page,data){
  paper.querySelector('.adobe-equipment-footer-mask')?.remove();if(page.id!=='page-2')return;
  const enabled=CharacterPaperInventory.normalize(data.adobe.paperInventory).attunedFooter,button=paper.querySelector('[data-pdf-button="Adventuring Gear Button 51"]');if(button)button.hidden=enabled;
  if(!enabled)return;const source=page.fields.find(row=>row.id==='Attuned Magic Items Whiteout');if(!source)return;
  const mask=document.createElement('div'),[x,y,r,b]=source.rect;mask.className='adobe-equipment-footer-mask';mask.setAttribute('aria-hidden','true');Object.assign(mask.style,{position:'absolute',background:'#fff',pointerEvents:'none',left:100*x/page.width+'%',top:100*y/page.height+'%',width:100*(r-x)/page.width+'%',height:100*(b-y)/page.height+'%'});paper.insertBefore(mask,paper.querySelector('.field'));
 }
 return{project,copy,setFooter,render,artwork};
})();
