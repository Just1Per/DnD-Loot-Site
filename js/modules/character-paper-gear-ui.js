'use strict';
/* Original Gear row actions stay on the source paper and share its private save. */
var CharacterPaperGearUI=(()=>{
 let currentClose=null;
 const physical=()=>sheetEquipmentLoot().map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:inventoryUnitWeight(entry.item||{}),location:sheetSession.data.personalGear.find(row=>row.id===entry.id)?.location||''}));
 function open(index){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!Number.isInteger(index)||index<0||index>=CharacterPaperGearLayout.maxRows||!CharacterAdobeView.validate())return;
  const opener=document.getElementById('sheetAdobeView')?.shadowRoot?.activeElement||document.activeElement;currentClose?.();let selected=index,observer;
  const dialog=document.createElement('dialog');dialog.id='adobeGearDialog';dialog.className='vault-dialog adobe-gear-dialog';dialog.setAttribute('aria-labelledby','adobeGearTitle');dialog.dataset.noContextHelp='';
  const signature=()=>JSON.stringify({data:session.data,identity:session.identity,loot:sheetEquipmentLoot()});let snapshot=signature();
  const close=()=>{observer?.disconnect();if(currentClose===close)currentClose=null;if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});};currentClose=close;
  const allowed=()=>characterHPCurrent(session)&&!session.saving&&dialog.isConnected&&signature()===snapshot;
  const guard=()=>{if(allowed())return true;close();if(characterHPCurrent(session))sheetStatus('The character or its inventory changed. Reopen this equipment row.',true);return false;};
  const apply=result=>{session.data.adobe.paperInventory=result.state;selected=result.index;session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('Equipment paper row updated. Physical ownership is unchanged. Save sheet to keep it.');snapshot=signature();render();};
  function render(){
   const all=physical(),state=session.data.adobe.paperInventory,list=CharacterPaperInventory.gearRows(state,all),row=list[selected],esc=sheetEscape,footer=state.attunedFooter&&selected>=50&&selected<54;
   if(footer){close();CharacterAdobeView.openEditor('paperInventory');return;}
   const offset=selected<54?0:54+36*Math.floor((selected-54)/36),local=selected-offset,count=selected<54?54:36,last=selected<54&&state.attunedFooter?49:count-1,columns=selected<54?3:2;
   dialog.innerHTML='<header class="adobe-gear-head"><div><span>EQUIPMENT · '+(selected<54?'PAGE 2':'EXTRA EQUIPMENT')+' · ROW '+(local+1)+'</span><h2 id="adobeGearTitle" tabindex="-1">'+esc(row?.name||'Empty equipment row')+'</h2><p>Arrange and edit the original paper fields. Save sheet keeps your changes.</p></div><div><button type="button" data-gear-save>Save sheet</button><button type="button" data-gear-done>Done</button></div></header>'+
    '<div class="adobe-gear-body"><section><details data-gear-choice-editor '+(!row?'open':'')+'><summary>'+(row?'Change item on this line':'Choose an item for this line')+'</summary><label>Choose an owned item<select data-gear-choice aria-label="Choose an owned equipment item"><option value="">Choose an item</option>'+all.map(entry=>'<option value="'+esc(entry.id)+'" '+(row?.key==='p:'+entry.id?'selected':'')+'>'+esc(entry.name)+'</option>').join('')+'</select></label><p class="adobe-gear-help">An item already on the paper swaps places with this row. Replacing or clearing a reference keeps the owned item, equipment effects and recorded uses in Inventory.</p></details></section>'+
    '<section><details data-gear-fields-editor><summary>Edit name, amount, weight &amp; location</summary><div class="adobe-gear-fields">'+[['name','Name','text'],['quantity','Amount','decimal'],['weight','Unit weight (lb)','decimal'],['location','Location / container','text']].map(([id,label,type])=>'<label>'+label+'<input type="text" data-gear-field="'+id+'" '+(type==='decimal'?'inputmode="decimal"':'maxlength="200"')+' value="'+esc(row?.[id]??'')+'" '+(!row||row.unavailable?'disabled':'')+'></label>').join('')+'</div><div class="adobe-gear-actions"><button type="button" data-gear-apply '+(!row||row.unavailable?'disabled':'')+'>Apply field changes</button><button type="button" data-gear-reset '+(!row||row.unavailable?'disabled':'')+'>Discard field edits</button></div><p class="adobe-gear-help">Blank unit weight restores the automatic value; enter 0 for weightless gear. Edits change this paper’s fields and Adobe section weight. Physical stock, equipment effects and Inventory weight stay unchanged.</p></details></section>'+
    '<section><h3>Position on the sheet</h3><div class="adobe-gear-actions">'+[['up','Move up',!row||local===0],['down','Move down',!row||local>=last],['insert','Insert line',!row],['clear','Clear line',!row],['delete','Delete line',false]].map(([command,label,disabled])=>'<button type="button" data-gear-operation="'+command+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div><div class="adobe-gear-actions">'+Array.from({length:columns},(_,i)=>'<button type="button" data-gear-operation="column:'+i+'" '+(!row||Math.floor(local/18)===i?'disabled':'')+'>Move to '+(i===0?'left':columns===3&&i===1?'middle':'right')+' column</button>').join('')+'</div><p class="adobe-gear-help">Clear leaves a blank. Delete shifts only the current column. Insert uses the first empty row below. A full target refuses the move; nothing is discarded.</p></section>'+
    '<section><div class="adobe-gear-actions"><button type="button" data-gear-description '+(!row||row.unavailable?'disabled':'')+'>Read full item description</button><button type="button" data-gear-equipment>Add or manage owned equipment</button></div></section></div><footer><p data-gear-status role="status" aria-live="polite"></p></footer>';
   const inputs=[...dialog.querySelectorAll('[data-gear-field]')],initial=JSON.stringify(inputs.map(input=>input.value)),status=dialog.querySelector('[data-gear-status]'),source=document.getElementById('sheetStatus');
   const pending=()=>JSON.stringify(inputs.map(input=>input.value))!==initial,clean=()=>{if(!pending())return true;status.textContent='Apply field changes or reset them before using another row action.';inputs.find(input=>input.value!==(row?.[input.dataset.gearField]??'').toString())?.focus();return false;};
   const sync=()=>{status.textContent=source?.textContent||'';dialog.querySelector('[data-gear-save]').disabled=session.saving===true;};observer?.disconnect();observer=source?new MutationObserver(sync):null;observer?.observe(source,{childList:true,subtree:true,characterData:true});sync();
   dialog.querySelector('[data-gear-done]').onclick=close;dialog.querySelector('[data-gear-save]').onclick=()=>{if(guard()&&clean())document.getElementById('sheetSave')?.click();};
   dialog.querySelector('[data-gear-reset]').onclick=()=>{if(!guard())return;render();};
   dialog.querySelector('[data-gear-apply]').onclick=()=>{
    if(!guard())return;let draft=state,invalid=false;
    for(const [i,input]of inputs.entries()){input.removeAttribute('aria-invalid');if(input.value===JSON.parse(initial)[i])continue;try{draft=CharacterPaperInventory.gearAction(draft,all,selected,'edit',input.dataset.gearField,input.value).state;}catch(error){invalid=true;input.setAttribute('aria-invalid','true');status.textContent=error.message;}}
    if(invalid){inputs.find(input=>input.hasAttribute('aria-invalid'))?.focus();return;}if(!pending()){status.textContent='Paper fields are unchanged.';return;}apply({state:draft,index:selected});dialog.querySelector('[data-gear-done]').focus();
   };
   dialog.querySelector('[data-gear-choice]').onchange=async event=>{
    const id=event.target.value;if(!guard())return;if(!clean()||!id){event.target.value=row?.key?.startsWith('p:')?row.id:'';return;}
    if(row&&row.key!=='p:'+id&&!await SiteConfirmation.ask({title:'Change this paper row?',paragraphs:[row.name,'Existing paper fields move with their item or remain in Inventory. Physical ownership, equipment effects and uses are retained.'],confirmLabel:'Change paper item',isCurrent:allowed})){if(allowed()){render();dialog.querySelector('[data-gear-done]').focus();}return;}
    if(!guard())return;try{apply(CharacterPaperInventory.gearAction(state,all,selected,'choose',id));dialog.querySelector('[data-gear-done]').focus();}catch(error){status.textContent=error.message;}
   };
   for(const button of dialog.querySelectorAll('[data-gear-operation]'))button.onclick=async()=>{
    if(!guard()||!clean())return;const command=button.dataset.gearOperation;
    if(['clear','delete'].includes(command)&&!await SiteConfirmation.ask({title:command==='clear'?'Clear this paper line?':'Delete this paper line?',paragraphs:[row?.name||'Empty row',command==='clear'?'The row stays blank.':'The rest of this column shifts up.','The owned item, its equipment effects, quantity and recorded uses stay in Inventory.'],confirmLabel:command==='clear'?'Clear line':'Delete line',isCurrent:allowed}))return;
    if(!guard())return;try{apply(CharacterPaperInventory.gearAction(state,all,selected,command));dialog.querySelector('[data-gear-done]').focus();}catch(error){status.textContent=error.message;}
   };
   dialog.querySelector('[data-gear-description]').onclick=()=>{if(!guard()||!clean())return;close();openInventoryItemInformation(row.id);};
   dialog.querySelector('[data-gear-equipment]').onclick=()=>{if(!guard()||!clean())return;close();CharacterAdobeView.openEditor('equipment');};
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',close);document.getElementById('characterSheetDialog').append(dialog);render();if(!dialog.isConnected)return;if(typeof SiteHelp!=='undefined')SiteHelp.hide();dialog.showModal();dialog.querySelector('h2').focus();
 }
 return{open,destroy:()=>currentClose?.()};
})();
