/* Character-owned starting gear is saved with the private sheet. Campaign stock stays authoritative. */
function inventorySideForGear(g){
 const explicit=g.inventorySide==='left'||g.inventorySide==='right'?g.inventorySide:null;
 if(explicit)return explicit;
 const kind=CharacterEquipment.infer({name:g.name}).kind;
 return g.equipped||g.location==='Worn'||['weapon','armor','shield'].includes(kind)?'left':'right';
}
function ensureInventorySide(g){if(!g.inventorySide)g.inventorySide=inventorySideForGear(g);return g;}
function inventorySideLabel(side){return side==='left'?'Active gear':'Backpack';}

function personalGearEntries() {
 const s=sheetSession;if(!s)return [];
 return s.data.personalGear.filter(g=>g.quantity>0&&g.carried).map(g=>({id:g.id,itemId:g.id,characterId:s.characterId,quantity:g.quantity,personal:true,item:{id:g.id,name:g.name,description:g.notes,properties:[{title:'Weight per unit (lb)',text:String(g.weight)}],mechanics:CharacterEquipment.infer({name:g.name})}}));
}
function sheetBaseGear(){return [...CharacterAdobeData.gear,...(CharacterAdobeData.baseEquipment||[])];}
function renderSheetGearPicker(){
 const host=document.getElementById('sheetGearPicker');if(!host)return;
 const esc=sheetEscape;
 host.innerHTML=`<h4>Add to this character’s inventory</h4><div class="sheet-inventory-add"><label>Specific gear<select id="sheetBaseGear">${sheetBaseGear().map(g=>`<option value="${esc(g.id)}">${esc(g.name)} · ${g.edition} · ${esc(g.price)}</option>`).join('')}</select></label><button type="button" id="sheetAddBaseGear">Add gear to character</button><label>Equipment pack / background<select id="sheetGearPack">${CharacterAdobeData.packs.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${p.edition}</option>`).join('')}</select></label><button type="button" id="sheetAddGearPack">Add pack to character</button><button type="button" id="sheetAddCustomGear">+ Custom item</button></div><details><summary>Preview pack contents</summary><div id="sheetPackContents"></div></details><p class="sheet-help">Starting gear and packs use the labelled Adobe reference data. Adding gear does not spend coins. Choose your permitted starting equipment with your DM.</p>`;
 const paint=()=>{const p=CharacterAdobeData.packs.find(p=>p.id===host.querySelector('#sheetGearPack').value);document.getElementById('sheetPackContents').innerHTML=`<table class="sheet-gear-table"><thead><tr><th>Item</th><th>Quantity</th><th>lb each</th></tr></thead><tbody>${p.items.map(i=>`<tr><td>${esc(i.name)}${i.choice?' · choose / record separately':''}</td><td>${i.quantity}</td><td>${i.weight||'—'}</td></tr>`).join('')}</tbody></table>`;};host.querySelector('#sheetGearPack').onchange=paint;paint();
 host.querySelector('#sheetAddBaseGear').onclick=()=>addSheetGearTemplates([sheetBaseGear().find(g=>g.id===host.querySelector('#sheetBaseGear').value)]);
 host.querySelector('#sheetAddGearPack').onclick=()=>{const p=CharacterAdobeData.packs.find(p=>p.id===host.querySelector('#sheetGearPack').value);addSheetGearTemplates(p.items.map(i=>({...i,edition:p.edition,notes:i.choice?'Choose this item with your DM; replace this placeholder.':''})));};
 host.querySelector('#sheetAddCustomGear').onclick=()=>{const ids=addSheetGearTemplates([{name:'New item',quantity:1,weight:0,edition:sheetSession.data.build.edition,notes:''}]);if(ids?.[0])openPersonalGearEditor(ids[0]);};
}
function addSheetGearTemplates(entries){
 if(!sheetSession)return[];readSheetForm();
 if(sheetSession.data.personalGear.length+entries.length>200){sheetStatus('A character can have up to 200 personal gear rows. Remove unused rows first.',true);return[];}
 const ids=[];
 for(const g of entries){const id='personal-'+crypto.randomUUID();ids.push(id);sheetSession.data.personalGear.push({id,name:g.unitName||g.name,quantity:Number(g.quantity)||1,weight:Number(g.weight)||inventoryUnitWeight({name:g.unitName||g.name})||0,location:'Backpack',carried:true,notes:g.notes||'',edition:g.edition||'2014',inventorySide:inventorySideForGear(g)});}
 sheetSession.dirty=true;refreshCharacterSheetInventory();sheetStatus('Added to this character. Save sheet to keep inventory changes.');return ids;
}

function ensurePersonalGearEditor(){
 let dialog=document.getElementById('sheetPersonalGearEditor');if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='sheetPersonalGearEditor';dialog.className='sheet-personal-gear-editor';
 dialog.innerHTML='<div class="sheet-page-manager-head"><div><span class="sheet-eyebrow">PERSONAL INVENTORY</span><h3>Edit item</h3></div><button type="button" data-close-personal-editor aria-label="Close">×</button></div><div class="sheet-personal-gear-editor-body"><div class="sheet-grid two"><label class="sheet-field"><span>Item name</span><input id="personalEditName" maxlength="160"></label><label class="sheet-field"><span>Quantity</span><input id="personalEditQuantity" type="number" min="0" max="9999" step="1"></label><label class="sheet-field"><span>lb each</span><input id="personalEditWeight" type="number" min="0" max="99999" step="0.001"></label><label class="sheet-field"><span>lb total</span><output id="personalEditTotal"></output></label><label class="sheet-field"><span>Location</span><input id="personalEditLocation" maxlength="80"></label><label class="sheet-field sheet-check"><span>Carried</span><input id="personalEditCarried" type="checkbox"></label></div><label class="sheet-field"><span>Description / notes</span><textarea id="personalEditNotes" rows="5" maxlength="500"></textarea></label></div><div class="sheet-page-manager-actions"><button type="button" data-close-personal-editor>Cancel</button><button type="button" id="personalEditSave" class="btn-primary">Save item</button></div>';
 document.getElementById('characterSheetDialog')?.append(dialog);
 dialog.querySelectorAll('[data-close-personal-editor]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 const total=()=>{const q=Number(dialog.querySelector('#personalEditQuantity').value)||0,w=Number(dialog.querySelector('#personalEditWeight').value)||0;dialog.querySelector('#personalEditTotal').textContent=(q*w).toFixed(2)+' lb';};
 dialog.querySelector('#personalEditQuantity').oninput=total;dialog.querySelector('#personalEditWeight').oninput=total;
 dialog.querySelector('#personalEditSave').onclick=savePersonalGearEditor;
 return dialog;
}
function openPersonalGearEditor(id){
 if(!sheetSession)return;readSheetForm();const g=sheetSession.data.personalGear.find(row=>row.id===id);if(!g)return;
 const dialog=ensurePersonalGearEditor();dialog.dataset.gearId=id;
 dialog.querySelector('#personalEditName').value=g.name;dialog.querySelector('#personalEditQuantity').value=g.quantity;dialog.querySelector('#personalEditWeight').value=g.weight;dialog.querySelector('#personalEditLocation').value=g.location;dialog.querySelector('#personalEditCarried').checked=g.carried;dialog.querySelector('#personalEditNotes').value=g.notes||'';
 dialog.querySelector('#personalEditTotal').textContent=(g.quantity*g.weight).toFixed(2)+' lb';dialog.showModal();
}
function savePersonalGearEditor(){
 const dialog=document.getElementById('sheetPersonalGearEditor'),s=sheetSession;if(!dialog||!s)return;
 const g=s.data.personalGear.find(row=>row.id===dialog.dataset.gearId);if(!g)return;
 const name=dialog.querySelector('#personalEditName').value.trim(),quantity=Math.trunc(Number(dialog.querySelector('#personalEditQuantity').value)),weight=Number(dialog.querySelector('#personalEditWeight').value),location=dialog.querySelector('#personalEditLocation').value.trim();
 if(!name){sheetStatus('Item name is required.',true);return;}
 if(!Number.isFinite(quantity)||quantity<0||quantity>9999||!Number.isFinite(weight)||weight<0||weight>99999){sheetStatus('Enter a valid quantity and weight.',true);return;}
 g.name=name;g.quantity=quantity;g.weight=weight;g.location=location||'Backpack';g.carried=dialog.querySelector('#personalEditCarried').checked;ensureInventorySide(g);g.notes=dialog.querySelector('#personalEditNotes').value.slice(0,500);
 s.dirty=true;dialog.close();refreshCharacterSheetInventory();sheetStatus('Item updated. Save the character sheet to keep it.');
}
function renderCharacterInventory(){
 const host=document.getElementById('sheetInventory'),s=sheetSession;if(!host||!s)return;
 host.className='sheet-inventory-ledger';
 const coinLabels=['cp','sp','ep','gp','pp'].map(k=>document.querySelector(`[name="coins.${k}"]`)?.closest('label')).filter(Boolean);
 coinLabels.forEach(el=>el.remove());
 const esc=sheetEscape,own=s.data.personalGear.map(ensureInventorySide),loot=inventory.filter(e=>e.characterId===s.characterId&&e.quantity>0);
 const row=g=>`<tr data-personal-row="${esc(g.id)}"><td><input data-personal="name" aria-label="Item name" maxlength="160" value="${esc(g.name)}"><small>${g.edition} · Personal gear</small></td><td><input data-personal="quantity" aria-label="Quantity of ${esc(g.name)}" type="number" min="0" max="9999" step="1" value="${g.quantity}"></td><td><input data-personal="weight" aria-label="Weight each in pounds for ${esc(g.name)}" type="number" min="0" max="99999" step="0.001" value="${g.weight}"></td><td>${(g.quantity*g.weight).toFixed(2)}</td><td><input data-personal="location" aria-label="Storage location for ${esc(g.name)}" maxlength="80" value="${esc(g.location)}"><label class="sheet-carry"><input type="checkbox" data-personal="carried" ${g.carried?'checked':''}> Carried</label></td><td class="sheet-inventory-row-actions"><button type="button" data-move-inventory="${esc(g.id)}" title="Move this item between Active gear and Backpack">${inventorySideLabel(inventorySideForGear(g))==='Active gear'?'→ Backpack':'← Active gear'}</button><button type="button" data-edit-personal="${esc(g.id)}">Edit</button><button type="button" data-remove-personal="${esc(g.id)}" aria-label="Remove ${esc(g.name)}">×</button></td></tr>`;
 const table=(title,rows)=>`<section class="sheet-inventory-column"><h4>${title}</h4><div class="sheet-inventory-scroll"><table class="sheet-inventory-table"><thead><tr><th>Adventuring gear</th><th>#</th><th>lb each</th><th>lb total</th><th>Location</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="sheet-empty">No items yet</td></tr>'}</tbody></table></div></section>`;
 const left=own.filter(g=>inventorySideForGear(g)==='left'),right=own.filter(g=>inventorySideForGear(g)==='right');
 host.innerHTML=`<div class="sheet-inventory-main"><div class="sheet-inventory-columns"><section class="sheet-inventory-column sheet-inventory-active"><h4>Active gear <small>Weapons, armor & equipped gear</small></h4><div class="sheet-inventory-scroll"><table class="sheet-inventory-table"><thead><tr><th>Item</th><th>#</th><th>lb each</th><th>lb total</th><th>Location</th><th></th></tr></thead><tbody>${left.map(row).join('')||'<tr><td colspan="6" class="sheet-empty">No active gear yet</td></tr>'}</tbody></table></div></section><section class="sheet-inventory-column sheet-inventory-backpack"><h4>Backpack <small>Stored gear & supplies</small></h4><div class="sheet-inventory-scroll"><table class="sheet-inventory-table"><thead><tr><th>Item</th><th>#</th><th>lb each</th><th>lb total</th><th>Location</th><th></th></tr></thead><tbody>${right.map(row).join('')||'<tr><td colspan="6" class="sheet-empty">No backpack items yet</td></tr>'}</tbody></table></div></section></div><section class="sheet-inventory-column sheet-inventory-campaign"><h4>Campaign loot <small>${loot.length} stacks</small></h4><div id="sheetCampaignInventoryRows"></div></section><details class="sheet-inventory-settings"><summary>Equip personal gear & item notes</summary><div id="sheetPersonalEquipment"></div></details></div><aside class="sheet-inventory-sidebar"><h4>Treasure</h4><div id="sheetInventoryCoins"></div><h4>Weight carried</h4><div id="sheetInventoryTotals"></div><h4>Attuned magical items</h4><div id="sheetInventoryAttuned"></div></aside>`;
 // Move existing coin inputs rather than duplicate them; they remain normal sheet fields.
 coinLabels.forEach(el=>host.querySelector('#sheetInventoryCoins').appendChild(el));
 host.querySelectorAll('[data-personal]').forEach(input=>input.onchange=()=>{
  if(input.checkValidity&&!input.checkValidity()){sheetStatus('Enter a valid non-negative quantity or weight.',true);return;}
  readSheetForm();const g=s.data.personalGear.find(g=>g.id===input.closest('[data-personal-row]').dataset.personalRow);if(!g)return;
  const key=input.dataset.personal;g[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
  if(key==='quantity')g.quantity=Math.max(0,Math.min(9999,Math.trunc(g.quantity)));
  if(key==='weight')g.weight=Math.max(0,Math.min(99999,g.weight));
  s.dirty=true;refreshCharacterSheetInventory();sheetStatus('Unsaved inventory changes');
 });
 host.querySelectorAll('[data-move-inventory]').forEach(b=>b.onclick=()=>{readSheetForm();const g=s.data.personalGear.find(g=>g.id===b.dataset.moveInventory);if(!g)return;g.inventorySide=inventorySideForGear(g)==='left'?'right':'left';g.location=g.inventorySide==='left'?'Worn':'Backpack';s.dirty=true;refreshCharacterSheetInventory();sheetStatus(`${g.name} moved to ${inventorySideLabel(g.inventorySide)}. Save sheet to keep the change.`);});
 host.querySelectorAll('[data-edit-personal]').forEach(b=>b.onclick=()=>openPersonalGearEditor(b.dataset.editPersonal));
 host.querySelectorAll('[data-remove-personal]').forEach(b=>b.onclick=()=>{readSheetForm();s.data.personalGear=s.data.personalGear.filter(g=>g.id!==b.dataset.removePersonal);s.data.equipmentState.loadout=s.data.equipmentState.loadout.filter(g=>g.id!==b.dataset.removePersonal);s.dirty=true;refreshCharacterSheetInventory();sheetStatus('Item removed. Save sheet to keep changes.');});
 const campaign=host.querySelector('#sheetCampaignInventoryRows');
 for(const entry of loot){const item=inventoryItem(entry),wrap=document.createElement('details');wrap.className='sheet-inventory-loot';const summary=document.createElement('summary');const weight=inventoryUnitWeight(item);summary.textContent=`${item.name} · ${entry.quantity} × ${weight===null?'?':weight} lb`;wrap.append(summary,createCard(item,{inventoryEntry:entry}),equipmentControls(entry));campaign.append(wrap);}
 if(!loot.length)campaign.textContent='Claim visible campaign loot from the Library or ask your DM to assign it.';
 const controls=host.querySelector('#sheetPersonalEquipment');
 for(const g of own){const wrap=document.createElement('details'),summary=document.createElement('summary');summary.textContent=g.name;wrap.append(summary);const entry=personalGearEntries().find(e=>e.id===g.id);if(entry)wrap.append(equipmentControls(entry));const notes=document.createElement('textarea');notes.value=g.notes;notes.rows=2;notes.maxLength=500;notes.setAttribute('aria-label','Notes for '+g.name);notes.onchange=()=>{readSheetForm();const current=s.data.personalGear.find(x=>x.id===g.id);if(current)current.notes=notes.value;s.dirty=true;sheetStatus('Unsaved item notes');};wrap.append(notes);controls.append(wrap);}
 observePendingImages(host);
}
function inventoryUnitWeight(item){
 const raw=item.properties?.find(p=>p.title==='Weight per unit (lb)')?.text;
 if(raw!==undefined&&raw!==''&&Number.isFinite(Number(raw))&&Number(raw)>=0)return Number(raw);
 const base=sheetBaseGear().find(g=>[g.name,g.unitName].some(n=>n?.toLowerCase()===item.name?.toLowerCase()));return base?Number(base.weight)||0:null;
}
function updateInventoryTotals(stats){
 const host=document.getElementById('sheetInventoryTotals');if(!host||!sheetSession)return;
 const s=sheetSession;let weight=s.data.personalGear.filter(g=>g.carried).reduce((n,g)=>n+g.weight*g.quantity,0),unknown=0;
 for(const e of inventory.filter(e=>e.characterId===s.characterId&&e.quantity>0)){const w=inventoryUnitWeight(inventoryItem(e));if(w===null)unknown++;else weight+=w*e.quantity;}
 const coins=Object.values(s.data.coins).reduce((a,b)=>a+b,0)/50;
 host.innerHTML=`<strong>${(weight+coins).toFixed(2)} lb</strong><small>Gear ${weight.toFixed(2)} lb · coins ${coins.toFixed(2)} lb</small>${unknown?`<p>${unknown} campaign item(s) have unknown weight; total is incomplete.</p>`:''}<small>Uncarried personal gear is excluded. Bags do not automatically reduce their contents’ weight.</small>`;
 const attuned=s.data.equipmentState.loadout.filter(g=>g.attuned).map(g=>sheetEquipmentLoot().find(e=>e.id===g.id)).filter(e=>e&&(((typeof CharacterMagicItems!=='undefined'&&CharacterMagicItems.requiresAttunement(e.item))||!!e.item.attunement)));
 document.getElementById('sheetInventoryAttuned').innerHTML=Array.from({length:Math.max(3,attuned.length)},(_,i)=>`<div class="sheet-attunement-line">${i+1}. ${sheetEscape(attuned[i]?.item.name||'—')}</div>`).join('');
}

function renderInventoryDefense(stats) {
 const s=sheetSession;let host=document.getElementById('sheetInventoryDefense');if(!s)return;
 if(!host){host=document.createElement('section');host.id='sheetInventoryDefense';host.className='sheet-summary-box sheet-defense-panel';document.querySelector('#sheet-inventory h3')?.after(host);}
 const esc=sheetEscape,owned=sheetEquipmentLoot(),state=s.data.equipmentState;
 const entries=kind=>owned.filter(e=>CharacterEquipment.infer(e.item).kind===kind);
 const selected=kind=>entries(kind).find(e=>state.loadout.some(c=>c.id===e.id&&c.equipped));
 const armor=selected('armor'),shield=selected('shield'),m=armor&&CharacterEquipment.infer(armor.item),p=m&&CharacterEquipment.profile(m,s.data.build.edition);
 const options=(kind,current)=>`<option value="">${kind==='armor'?'Unarmored · 10 + DEX':'No shield'}</option><optgroup label="Your inventory">${entries(kind).map(e=>`<option value="${esc(e.id)}" ${e.id===current?.id?'selected':''}>${esc(e.item.name)}</option>`).join('')}</optgroup><optgroup label="Add & equip standard gear">${sheetBaseGear().filter(g=>CharacterEquipment.infer(g).kind===kind&&!entries(kind).some(e=>e.item.name.toLowerCase()===g.name.toLowerCase())).map(g=>`<option value="base:${esc(g.id)}">${esc(g.name)}${kind==='armor'? ' · '+CharacterEquipment.profile(CharacterEquipment.infer(g),s.data.build.edition).group:''}</option>`).join('')}</optgroup>`;
 const dex=p?.group==='heavy'?0:p?.group==='medium'?Math.min(2,stats.mods.dex):stats.mods.dex;
 const parts=p?[p.name+' '+p.baseAC,`DEX ${CharacterSheetModel.signed(dex)}${p.group==='heavy'?' (not applied)':p.group==='medium'?' (maximum +2)':''}`]:[stats.gear.baseLabel+' '+stats.gear.base];
 for(const [name,value] of [['shield',stats.gear.shield],['magic / racial bonuses',stats.gear.bonus],['Defense',stats.gear.defense]])if(value)parts.push(`${name} ${CharacterSheetModel.signed(value)}`);
 host.innerHTML=`<div class="sheet-defense-emblem"><svg viewBox="0 0 100 116" aria-hidden="true"><path d="M8 8 L50 2 L92 8 V53 Q92 87 50 112 Q8 87 8 53Z"/><path class="sheet-defense-inset" d="M15 14 L50 9 L85 14 V53 Q85 81 50 103 Q15 81 15 53Z"/></svg><div><small>ARMOR CLASS</small><strong>${stats.ac}</strong><span>${state.acMode==='equipment'?'AUTOMATIC':'MANUAL BASE'}</span></div></div><div class="sheet-defense-content"><h4>Armor & defenses</h4><div class="sheet-defense-selectors"><label>Armor<select id="sheetArmorSelect">${options('armor',armor)}</select></label><label>Shield<select id="sheetShieldSelect">${options('shield',shield)}</select></label></div><p class="sheet-defense-formula">${parts.map(x=>`<span>${esc(x)}</span>`).join('<b> + </b>')} <b>= ${stats.ac} AC</b></p><p class="sheet-help">Choose from your inventory, or add and equip standard gear. The engine automatically compares legal armor, natural armor, Barbarian/Monk defenses and Draconic Resilience, then adds shield and eligible magical bonuses.</p>${stats.gear.warnings.map(w=>`<p class="sheet-build-warning">${esc(w)}</p>`).join('')}${[armor,shield].some(e=>e&&(((typeof CharacterMagicItems!=='undefined'&&CharacterMagicItems.requiresAttunement(e.item))||!!e.item.attunement)))?'<p class="sheet-help">Magical benefits that require attunement use the item’s Attuned checkbox below.</p>':''}</div>`;
 for(const [id,kind] of [['sheetArmorSelect','armor'],['sheetShieldSelect','shield']])host.querySelector('#'+id).onchange=event=>selectInventoryDefense(kind,event.target.value);
}
function selectInventoryDefense(kind,id){
 if(!sheetSession)return;readSheetForm();const s=sheetSession,state=s.data.equipmentState;
 let chosen=id?sheetEquipmentLoot().find(e=>e.id===id):null;
 const template=id.startsWith('base:')?sheetBaseGear().find(g=>g.id===id.slice(5)&&CharacterEquipment.infer(g).kind===kind):null;
 if(id&&!chosen&&!template)return;
 if((chosen&&!state.loadout.some(c=>c.id===chosen.id)||template)&&state.loadout.length>=200){sheetStatus('Equipment selection limit reached.',true);renderInventoryDefense(CharacterSheetModel.derive(s.data,s.identity.level,sheetEquipmentLoot()));return;}
 if(template){
  if(s.data.personalGear.length>=200){sheetStatus('Personal inventory is full. Remove an unused row first.',true);return;}
  const g={id:'personal-'+crypto.randomUUID(),name:template.name,quantity:1,weight:Number(template.weight)||0,location:'Worn',carried:true,notes:'',edition:template.edition,inventorySide:'left'};s.data.personalGear.push(g);chosen=personalGearEntries().find(e=>e.id===g.id);
 }
 for(const c of state.loadout){const e=sheetEquipmentLoot().find(e=>e.id===c.id),personal=s.data.personalGear.find(g=>g.id===c.id);if(CharacterEquipment.infer(e?.item||{name:personal?.name||''}).kind===kind)c.equipped=false;}
 if(chosen){let c=state.loadout.find(c=>c.id===chosen.id);if(!c){c=CharacterEquipment.choices({loadout:[{id:chosen.id}]}).loadout[0];state.loadout.push(c);}c.equipped=true;}
 state.acMode='equipment';state.acAdjustment=0;s.dirty=true;refreshCharacterSheetInventory();sheetStatus('Armor updated. Save sheet to keep changes.');document.getElementById(kind==='armor'?'sheetArmorSelect':'sheetShieldSelect')?.focus();
}
