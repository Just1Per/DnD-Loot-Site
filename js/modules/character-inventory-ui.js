/* Character-owned starting gear is saved with the private sheet. Campaign stock stays authoritative. */
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
 host.querySelector('#sheetAddCustomGear').onclick=()=>addSheetGearTemplates([{name:'New item',quantity:1,weight:0,edition:sheetSession.data.build.edition}]);
}
function addSheetGearTemplates(entries){
 if(!sheetSession)return;readSheetForm();
 if(sheetSession.data.personalGear.length+entries.length>200)return sheetStatus('A character can have up to 200 personal gear rows. Remove unused rows first.',true);
 for(const g of entries)sheetSession.data.personalGear.push({id:'personal-'+crypto.randomUUID(),name:g.unitName||g.name,quantity:Number(g.quantity)||1,weight:Number(g.weight)||inventoryUnitWeight({name:g.unitName||g.name})||0,location:'Backpack',carried:true,notes:g.notes||'',edition:g.edition||'2014'});
 sheetSession.dirty=true;refreshCharacterSheetInventory();sheetStatus('Added to this character. Save sheet to keep inventory changes.');
}
function renderCharacterInventory(){
 const host=document.getElementById('sheetInventory'),s=sheetSession;if(!host||!s)return;
 host.className='sheet-inventory-ledger';
 const coinLabels=['cp','sp','ep','gp','pp'].map(k=>document.querySelector(`[name="coins.${k}"]`)?.closest('label')).filter(Boolean);
 coinLabels.forEach(el=>el.remove());
 const esc=sheetEscape,own=s.data.personalGear,loot=inventory.filter(e=>e.characterId===s.characterId&&e.quantity>0);
 const row=g=>`<tr data-personal-row="${esc(g.id)}"><td><input data-personal="name" aria-label="Item name" maxlength="160" value="${esc(g.name)}"><small>${g.edition} · Personal gear</small></td><td><input data-personal="quantity" aria-label="Quantity of ${esc(g.name)}" type="number" min="0" max="9999" step="1" value="${g.quantity}"></td><td><input data-personal="weight" aria-label="Weight each in pounds for ${esc(g.name)}" type="number" min="0" max="99999" step="0.001" value="${g.weight}"></td><td>${(g.quantity*g.weight).toFixed(2)}</td><td><input data-personal="location" aria-label="Storage location for ${esc(g.name)}" maxlength="80" value="${esc(g.location)}"><label class="sheet-carry"><input type="checkbox" data-personal="carried" ${g.carried?'checked':''}> Carried</label></td><td><button type="button" data-remove-personal="${esc(g.id)}" aria-label="Remove ${esc(g.name)}">×</button></td></tr>`;
 const table=(title,rows)=>`<section class="sheet-inventory-column"><h4>${title}</h4><div class="sheet-inventory-scroll"><table class="sheet-inventory-table"><thead><tr><th>Adventuring gear</th><th>#</th><th>lb each</th><th>lb total</th><th>Location</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="sheet-empty">No items yet</td></tr>'}</tbody></table></div></section>`;
 const middle=Math.ceil(own.length/2);
 host.innerHTML=`<div class="sheet-inventory-main">${table('Equipment & supplies',own.slice(0,middle).map(row).join(''))}${table('Additional equipment',own.slice(middle).map(row).join(''))}<section class="sheet-inventory-column sheet-inventory-campaign"><h4>Campaign loot <small>${loot.length} stacks</small></h4><div id="sheetCampaignInventoryRows"></div></section><details class="sheet-inventory-settings"><summary>Equip personal gear & item notes</summary><div id="sheetPersonalEquipment"></div></details></div><aside class="sheet-inventory-sidebar"><h4>Treasure</h4><div id="sheetInventoryCoins"></div><h4>Weight carried</h4><div id="sheetInventoryTotals"></div><h4>Attuned magical items</h4><div id="sheetInventoryAttuned"></div></aside>`;
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
 const attuned=s.data.equipmentState.loadout.filter(g=>g.attuned).map(g=>sheetEquipmentLoot().find(e=>e.id===g.id)).filter(e=>e?.item.attunement);
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
 const parts=state.acMode==='manual'?[`Manual base ${s.data.ac}`]:[`${p?p.name:'Unarmored'} ${p?p.baseAC:10}`,`DEX ${CharacterSheetModel.signed(dex)}${p?.group==='heavy'?' (not applied)':p?.group==='medium'?' (maximum +2)':''}`];
 for(const [name,value] of [['shield',stats.gear.shield],['item bonuses',stats.gear.bonus],['Defense',stats.gear.defense],['adjustment',stats.gear.adjustment]])if(value)parts.push(`${name} ${CharacterSheetModel.signed(value)}`);
 host.innerHTML=`<div class="sheet-defense-emblem"><svg viewBox="0 0 100 116" aria-hidden="true"><path d="M8 8 L50 2 L92 8 V53 Q92 87 50 112 Q8 87 8 53Z"/><path class="sheet-defense-inset" d="M15 14 L50 9 L85 14 V53 Q85 81 50 103 Q15 81 15 53Z"/></svg><div><small>ARMOR CLASS</small><strong>${stats.ac}</strong><span>${state.acMode==='equipment'?'AUTOMATIC':'MANUAL BASE'}</span></div></div><div class="sheet-defense-content"><h4>Armor & defenses</h4><div class="sheet-defense-selectors"><label>Armor<select id="sheetArmorSelect">${options('armor',armor)}</select></label><label>Shield<select id="sheetShieldSelect">${options('shield',shield)}</select></label></div><p class="sheet-defense-formula">${parts.map(x=>`<span>${esc(x)}</span>`).join('<b> + </b>')} <b>= ${stats.ac} AC</b></p><p class="sheet-help">Choose from your inventory, or add and equip standard gear. This uses automatic AC; special unarmored formulas remain under Armor Class & equipment settings.</p>${stats.gear.warnings.map(w=>`<p class="sheet-build-warning">${esc(w)}</p>`).join('')}${armor?.item.attunement||shield?.item.attunement?'<p class="sheet-help">Magical benefits that require attunement use the item’s Attuned checkbox below.</p>':''}</div>`;
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
  const g={id:'personal-'+crypto.randomUUID(),name:template.name,quantity:1,weight:Number(template.weight)||0,location:'Worn',carried:true,notes:'',edition:template.edition};s.data.personalGear.push(g);chosen=personalGearEntries().find(e=>e.id===g.id);
 }
 for(const c of state.loadout){const e=sheetEquipmentLoot().find(e=>e.id===c.id),personal=s.data.personalGear.find(g=>g.id===c.id);if(CharacterEquipment.infer(e?.item||{name:personal?.name||''}).kind===kind)c.equipped=false;}
 if(chosen){let c=state.loadout.find(c=>c.id===chosen.id);if(!c){c=CharacterEquipment.choices({loadout:[{id:chosen.id}]}).loadout[0];state.loadout.push(c);}c.equipped=true;}
 state.acMode='equipment';document.querySelector('[name="equipmentState.acMode"]').value='equipment';s.dirty=true;refreshCharacterSheetInventory();sheetStatus('Armor updated. Save sheet to keep changes.');document.getElementById(kind==='armor'?'sheetArmorSelect':'sheetShieldSelect')?.focus();
}
