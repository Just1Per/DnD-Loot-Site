"use strict";
async function toggleItemVisibility(itemId) {
  if(!canManageCampaign())return;
  await persistItemState(itemId,{visible:!getItemState(itemId).visible});await refreshCampaignData();
}
async function setVisibilityByRarity(rarity,visible) {
  if(!canManageCampaign())return;
  try {for(const item of items.filter(i=>i.rarity===rarity))await persistItemState(item.id,{visible});await refreshCampaignData();}
  catch(error){alert(error.message);}
}
function createCard(item,context={}) {
  const root=context.root===true;
  const manager=!root&&canManageCampaign();
  const canEdit=root?isAdmin():manager;
  const state=root?{}:getItemState(item.id);
  const entry=context.inventoryEntry||null;
  const owned=inventory.filter(e=>e.itemId===item.id&&e.quantity>0);
  const mine=owned.filter(e=>e.userId===auth.currentUser?.uid);
  const isSaved=!root&&saves.some(s=>s.itemId===item.id&&s.characterId===selectedCharacter?.id);
  const rarity=(item.rarity||'').toLowerCase().replaceAll(' ','-');
  const card=document.createElement('div');card.className='item-card';if(/^[a-z-]+$/.test(rarity))card.classList.add(rarity);
  card.dataset.itemId=item.id;
  if(!root&&state.highlighted)card.classList.add('highlighted');
  if(!root&&state.looted)card.classList.add('looted');
  const quantity=entry?.quantity??(manager?owned:mine).reduce((n,e)=>n+e.quantity,0);
  const stock=campaignSupply[item.id];
  const canClaim=!root&&!entry&&canUseCharacters()&&item.visible&&item.lootMode==='player';
  card.innerHTML=`<div class="card-buttons">
    ${canEdit?`<button type="button" class="edit-button">${root?'Edit Root Item':'Edit Campaign Item'}</button><button type="button" class="clone-button">Clone</button><button type="button" class="delete-item-button">Delete</button>`:''}
    ${manager?`<button type="button" class="visibility-toggle-btn">${item.visible?'Visible':'Hidden'}</button><button type="button" class="highlight-button">${item.highlighted?'Highlighted':'Highlight'}</button>`:''}
    ${manager&&!entry?'<button type="button" class="assign-button">Assign</button>':''}
    ${canClaim?'<button type="button" class="loot-button">Loot</button>':''}
    ${!root&&!entry&&canUseCharacters()&&item.visible?`<button type="button" class="save-item-button" ${!selectedCharacter?'disabled title="Select your active character first"':''}>${isSaved?'★ Saved':'☆ Save'}</button>`:''}
    ${entry&&manager?'<button type="button" class="unloot-button">Unloot</button><button type="button" class="transfer-button">Transfer</button>':''}
    ${entry&&(manager||entry.userId===auth.currentUser?.uid)?'<button type="button" class="use-button">Use</button>':''}
    </div>
    <div class="card-header"><h2 class="item-name">${escapeHtml(item.name)}</h2><p class="item-type">${escapeHtml(item.category||'')}${item.attunement?' · Requires Attunement':''}</p>
    <div class="card-meta"><span class="meta-tag ${escapeHtml(rarity)}">${escapeHtml(item.rarity||'')}</span>${item.source?`<span class="meta-tag">${escapeHtml(item.source)}</span>`:''}
    ${!root?`<span class="meta-tag campaign-tag" title="Locked to this campaign">🔒 ${escapeHtml(activeCampaign?.name||'')}</span>`:''}</div>
    ${!root&&quantity?`<p class="inventory-quantity">${entry?'Owned':manager?'Assigned':'You own'}: ${quantity}</p>`:''}
    ${manager&&stock?`<p class="supply-label">Available: ${stock.unlimited?'Unlimited':(stock.capacity-stock.claimed)} · ${item.lootMode==='player'?'Player looting':'DM assignment only'}</p>`:''}
    ${!root&&!manager&&!entry?`<p class="supply-label">${item.lootMode!=='player'?'DM assignment only':'Player looting enabled'}</p>`:''}</div>
    ${itemImageMarkup(item,'card-art')}
    <div class="card-body"><div class="item-description">${escapeHtml(item.description||'')}</div>${(item.properties||[]).map(p=>`<div class="property-block"><span class="property-title">${escapeHtml(p.title)}:</span> ${escapeHtml(p.text)}</div>`).join('')}${item.quote?`<i>${escapeHtml(item.quote)}</i>`:''}</div>
    ${manager&&!entry&&owned.length?`<div class="owner-badge">${owned.map(e=>`${escapeHtml(characters.find(c=>c.id===e.characterId)?.name||'Character')} × ${e.quantity}`).join(' · ')}</div>`:''}
    <div class="card-footer">${root?'Root Catalogue':'D&D Campaign Vault'}</div>`;
  const on=(selector,work)=>card.querySelector(selector)?.addEventListener('click',event=>{
    // The existing item editor is outside the sheet's native dialog. Close the
    // sheet first, preserving its unsaved-change confirmation.
    if(event.currentTarget.closest('#sheetInventory') && ['.edit-button','.clone-button'].includes(selector) && !closeCharacterSheet())return;
    return runVaultButton(event.currentTarget,work);
  });
  on('.edit-button',()=>{closeCharacterLoot();openItemModal(item,{scope:root?'root':'campaign'});});
  on('.clone-button',async()=>{
    if(root){const id=crypto.randomUUID();const data={...rootItemData(item),imageBaseId:item.imageBaseId||item.id};await setDoc(doc(db,'items',id),{...data,name:`${item.name} (Copy)`});rootItems.push({...data,id,name:`${item.name} (Copy)`});await markCatalogChanged();renderRootCatalogue();}
    else {const id=activeCampaign.id;const result=await vaultCall('vaultCopyCampaignItem',{campaignId:id,source:'campaign',sourceId:item.id});if(activeCampaign?.id!==id)return;await refreshCampaignData();closeCharacterLoot();openItemModal(items.find(i=>i.id===result.itemId));}
  });
  on('.delete-item-button',async()=>{
    if(!confirm(`Delete "${item.name}" ${root?'from the root catalogue':'from this campaign'}?`))return;
    if(root){await deleteDoc(doc(db,'items',item.id));rootItems=rootItems.filter(i=>i.id!==item.id);await markCatalogChanged();renderRootCatalogue();}
    else {await vaultCall('vaultDeleteCampaignItem',{campaignId:activeCampaign.id,itemId:item.id});await refreshCampaignData();}
  });
  on('.visibility-toggle-btn',()=>toggleItemVisibility(item.id));
  on('.highlight-button',async()=>{await persistItemState(item.id,{highlighted:!item.highlighted});await refreshCampaignData();});
  on('.assign-button',()=>openInventoryAction(item,'assign'));
  on('.loot-button',()=>openInventoryAction(item,'claim'));
  on('.unloot-button',()=>openInventoryAction(item,'unloot',entry));
  on('.transfer-button',()=>openInventoryAction(item,'transfer',entry));
  on('.use-button',()=>openInventoryAction(item,'use',entry));
  on('.save-item-button',async()=>{
    const id=activeCampaign?.id;const character=selectedCharacter;
    if(!id||!character||character.userId!==auth.currentUser.uid)return;
    const existing=saves.find(s=>s.itemId===item.id&&s.characterId===character.id);
    if(existing)await deleteDoc(doc(db,'campaigns',id,'saves',existing.id));
    else await setDoc(doc(db,'campaigns',id,'saves',`${character.id}__${item.id}`),{itemId:item.id,characterId:character.id,userId:auth.currentUser.uid,created:Date.now()});
    if(activeCampaign?.id===id){await loadSaves();renderCards();renderMyWishes();renderDMCharacters();}
  });return card;
}
function rootItemData(item) {
  const allowed=['name','description','category','rarity','source','quote','attunement','classes','properties','imageUrl','imageBaseId'];
  return Object.fromEntries(allowed.filter(k=>item[k]!==undefined).map(k=>[k,item[k]]));
}
function buildModalClassCheckboxes(selected=[]) {
  document.getElementById('modal-classes').innerHTML=ALL_CLASSES.map(c=>`<label class="class-option"><input type="checkbox" value="${c}" ${selected.includes(c)?'checked':''}>${c}</label>`).join('');
}
let itemEditor=null;
function openItemModal(item=null,{scope='campaign'}={}) {
  if(scope==='root'?!isAdmin():!canManageCampaign())return;
  if(scope==='campaign'&&activeCampaign.inventoryVersion!==2){alert('Upgrade this campaign first.');return;}
  const stock=campaignSupply[item?.id];
  itemEditor={scope,itemId:item?.id||null,campaignId:scope==='campaign'?activeCampaign.id:null,stockRevision:stock?.revision??null,imageBaseId:item?.imageBaseId||''};
  document.getElementById('itemModalTitle').textContent=`${item?'Edit':'Create'} ${scope==='root'?'Root':'Campaign'} Item`;
  for(const key of ['name','category','rarity','source','description','quote'])document.getElementById(`modal-${key}`).value=item?.[key]||({category:'Wondrous Item',rarity:'Common'}[key]||'');
  const campaignField=document.getElementById('modal-campaign');campaignField.value=scope==='campaign'?activeCampaign.name:'Root Catalogue';campaignField.readOnly=true;campaignField.setAttribute('aria-readonly','true');campaignField.title='Locked: campaign ownership is set automatically.';
  document.getElementById('modal-attunement').checked=!!item?.attunement;renderPropertyEditor(item?.properties||[]);buildModalClassCheckboxes(item?.classes||[]);
  let options=document.getElementById('campaignItemOptions');
  if(!options){options=document.createElement('div');options.id='campaignItemOptions';options.className='modal-label full';document.querySelector('#itemModal .modal-form-grid').appendChild(options);}
  options.innerHTML=`<label class="modal-label">Upload image<input type="file" id="modal-imageFile" accept="image/*"></label><label class="modal-label">Image URL<input type="url" id="modal-imageUrl" placeholder="https://…" value="${escapeHtml(item?.imageUrl||'')}"></label>
    ${scope==='campaign'?`<label class="modal-label checkbox-row"><input type="checkbox" id="modal-visible" ${item?.visible?'checked':''}>Visible to campaign players</label>
    <label class="modal-label">Looting<select id="modal-lootMode"><option value="dm">DM assignment only</option><option value="player" ${item?.lootMode==='player'?'selected':''}>Players may loot</option></select></label>
    <label class="modal-label checkbox-row"><input type="checkbox" id="modal-unlimited" ${stock?.unlimited?'checked':''}>Unlimited supply</label>
    <label class="modal-label">Available quantity<input type="number" id="modal-remaining" min="0" max="1000000" step="1" value="${(stock ? Math.max(0,stock.capacity-stock.claimed) : 1)}"></label>
    <small>Set how many additional copies are available. Already-owned copies are separate. New and cloned items start hidden, with one copy, for DM assignment only.</small>`:''}`;
  const unlimited=options.querySelector('#modal-unlimited');const remaining=options.querySelector('#modal-remaining');
  if(unlimited){const sync=()=>{remaining.disabled=unlimited.checked;};unlimited.addEventListener('change',sync);sync();}
  document.getElementById('itemModal').style.display='flex';
}
function closeItemModal(){document.getElementById('itemModal').style.display='none';itemEditor=null;}
async function saveItemModal() {
  const editor=itemEditor;if(!editor)return;
  await runVaultButton(document.getElementById('saveItemModal'),async()=>{
    if(editor.scope==='campaign'&&activeCampaign?.id!==editor.campaignId)throw Error('The active campaign changed. Reopen the editor.');
    const item={};for(const key of ['name','category','rarity','source','description','quote'])item[key]=document.getElementById(`modal-${key}`).value;
    if(!item.name.trim())throw Error('Name is required.');
    item.attunement=document.getElementById('modal-attunement').checked;item.properties=getPropertiesFromEditor();item.classes=[...document.querySelectorAll('#modal-classes input:checked')].map(i=>i.value);item.imageUrl=document.getElementById('modal-imageUrl').value.trim();item.imageBaseId=editor.imageBaseId;
    if(item.imageUrl&&!/^https:\/\//i.test(item.imageUrl))throw Error('Image URL must use HTTPS.');
    const file=document.getElementById('modal-imageFile').files?.[0];
    if(file){editor.itemId ||= crypto.randomUUID();item.imageUrl=await uploadItemImage(editor.itemId,file,{campaignId:editor.campaignId});}
    if(editor.scope==='root') {
      if(!isAdmin())throw Error('Root catalogue editing requires an admin account.');
      const id=editor.itemId||crypto.randomUUID();await setDoc(doc(db,'items',id),item);
      const idx=rootItems.findIndex(i=>i.id===id);if(idx<0)rootItems.push({...item,id});else rootItems[idx]={...item,id};
      await markCatalogChanged();closeItemModal();renderRootCatalogue();
    } else {
      const remaining=Number(document.getElementById('modal-remaining').value);
      if(!Number.isSafeInteger(remaining)||remaining<0||remaining>1000000)throw Error('Available quantity must be a whole number from 0 to 1000000.');
      await vaultCall('vaultSaveCampaignItem',{...editor,item,remaining,unlimited:document.getElementById('modal-unlimited').checked,visible:document.getElementById('modal-visible').checked,lootMode:document.getElementById('modal-lootMode').value});
      closeItemModal();if(activeCampaign?.id===editor.campaignId)await refreshCampaignData();
    }
  });
}
