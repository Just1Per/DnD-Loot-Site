"use strict";
// Campaign copies, private supply/inventory, and server-validated inventory operations.
async function loadCampaignItems() {
  const id=activeCampaign?.id;if(!id){items=[];return;}
  if(activeCampaign.inventoryVersion!==2){items=[];return;}
  const ref=collection(db,'campaigns',id,'items');
  const snap=await getDocs(canManageCampaign()?ref:query(ref,where('visible','==',true)));
  if(activeCampaign?.id!==id)return;
  items=snap.docs.map(d=>({...d.data(),id:d.id,campaign:activeCampaign.name}));
  populateSourceFilter();populateCampaignFilter();
}
async function loadCampaignSupply() {
  const id=activeCampaign?.id;if(!id||!canManageCampaign()){campaignSupply={};return;}
  const snap=await getDocs(collection(db,'campaigns',id,'supply'));
  if(activeCampaign?.id===id)campaignSupply=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));
}
async function loadCampaignInventory() {
  const id=activeCampaign?.id;if(!id){inventory=[];return;}
  const ref=collection(db,'campaigns',id,'inventory');
  const snap=await getDocs(canManageCampaign()?ref:query(ref,where('userId','==',auth.currentUser.uid)));
  if(activeCampaign?.id===id)inventory=snap.docs.map(d=>({...d.data(),id:d.id}));
}
async function refreshCampaignData() {
  const id=activeCampaign?.id;if(!id)return;
  await Promise.all([loadCampaignItems(),loadCampaignInventory(),loadSaves(),loadCampaignSupply()]);
  if(activeCampaign?.id!==id)return;
  renderCards();renderPlayerTab();renderDMCharacters();renderDMOverview();renderCampaignToolbar();
}
function inventoryItem(entry) {
  return items.find(i=>i.id===entry.itemId)||{...entry.item,id:entry.itemId,campaignId:entry.campaignId,campaign:activeCampaign?.name||'',visible:false};
}
async function runVaultButton(button,work) {
  if(button?.disabled)return;
  if(button)button.disabled=true;
  try {await work();}catch(error){console.error(error);alert(error.message||'The action could not be completed.');}
  finally {if(button)button.disabled=false;}
}
function renderCampaignToolbar() {
  const bar=document.getElementById('campaignInventoryToolbar');if(!bar)return;
  if(activeCampaign?.inventoryVersion!==2){
    bar.innerHTML=canManageCampaign()?'<div class="dm-tool-card"><h2>Upgrade this campaign’s inventory</h2><p>Copy the existing catalogue into this campaign and preserve saved items and loot ownership. Existing root items and legacy records will remain unchanged.</p><button type="button" id="migrateCampaignInventory" class="btn-primary">Upgrade campaign inventory</button><p id="migrationProgress" aria-live="polite"></p></div>':'<p class="player-empty">Your DM needs to upgrade this campaign’s inventory before items are available.</p>';
    bar.querySelector('#migrateCampaignInventory')?.addEventListener('click',event=>runVaultButton(event.currentTarget,async()=>{
      if(!confirm('Upgrade this campaign? Existing item details, visibility, saves and assigned loot will be preserved in campaign copies.'))return;
      const id=activeCampaign.id;let cursor=null,processed=0;
      do {const result=await vaultCall('vaultMigrateCampaign',{campaignId:id,cursor});processed+=result.migrated;
        if(activeCampaign?.id!==id)return;
        document.getElementById('migrationProgress').textContent=`Processed ${processed} items. You may safely retry if interrupted.`;
        if(result.done)break;cursor=result.cursor;
      }while(cursor);
      activeCampaign.inventoryVersion=2;await refreshCampaignData();
      alert('Campaign inventory upgraded. Legacy looted items with missing owners remain out of stock for DM review.');
    }));return;
  }
  bar.innerHTML=`<div class="campaign-item-toolbar">${canManageCampaign()?'<button type="button" id="addFromRoot" class="toolbar-btn">Add from Root Catalogue</button>':''}<button type="button" id="refreshCampaignItems" class="toolbar-btn">Refresh Items</button>${!canManageCampaign()?'<span>Your loot and saved items are private to you and the campaign DM.</span>':''}</div>`;
  bar.querySelector('#addFromRoot')?.addEventListener('click',event=>runVaultButton(event.currentTarget,openRootPicker));
  bar.querySelector('#refreshCampaignItems')?.addEventListener('click',event=>runVaultButton(event.currentTarget,refreshCampaignData));
  document.getElementById('addItemBtn').textContent='+ Create Campaign Item';
}
async function openRootCatalogue() {
  if(!isAdmin())return;
  await runVaultButton(document.getElementById('openRootCatalogue'),async()=>{
    await itemsLoadPromise;hideAllScreens();
    document.getElementById('rootCatalogueScreen').style.display='block';renderRootCatalogue();
  });
}
function renderRootCatalogue() {
  if(!isAdmin())return;
  const screen=document.getElementById('rootCatalogueScreen');const search=screen.querySelector('#rootSearch')?.value||'';
  screen.innerHTML='<div class="admin-section"><button id="backFromRoot" class="toolbar-btn" type="button">← Back to Admin</button><h2>Root Catalogue</h2><p>Shared templates. Edits do not change existing campaign copies.</p><button id="createRootItem" class="toolbar-btn" type="button">+ Create Root Item</button><input id="rootSearch" class="search-input" aria-label="Search root items" placeholder="Search root items…"><div id="rootCards" class="card-container"></div></div>';
  screen.querySelector('#rootSearch').value=search;
  const paint=()=>{const q=screen.querySelector('#rootSearch').value.toLowerCase();const grid=screen.querySelector('#rootCards');grid.replaceChildren(...rootItems.filter(i=>i.name?.toLowerCase().includes(q)).map(i=>createCard(i,{root:true})));observePendingImages(grid);};
  screen.querySelector('#rootSearch').addEventListener('input',paint);
  screen.querySelector('#backFromRoot').addEventListener('click',openAdminView);
  screen.querySelector('#createRootItem').addEventListener('click',()=>openItemModal(null,{scope:'root'}));paint();
}
async function openRootPicker() {
  if(!canManageCampaign()||activeCampaign.inventoryVersion!==2)return;
  await itemsLoadPromise;
  let dialog=document.getElementById('rootPicker');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='rootPicker';dialog.className='vault-dialog';document.body.appendChild(dialog);}
  const id=activeCampaign.id;
  dialog.innerHTML='<div class="character-loot-heading"><h2>Add a campaign copy</h2><button type="button" id="closeRootPicker" class="cancel-button">Close</button></div><input id="rootPickerSearch" class="search-input" placeholder="Search root catalogue" aria-label="Search root catalogue"><div id="rootPickerResults"></div>';
  dialog.querySelector('#closeRootPicker').addEventListener('click',closeRootPicker);
  const paint=()=>{
    const q=dialog.querySelector('#rootPickerSearch').value.toLowerCase();const list=dialog.querySelector('#rootPickerResults');
    const matches=rootItems.filter(i=>i.name?.toLowerCase().includes(q)).slice(0,100);
    list.innerHTML=matches.map(i=>`<div class="root-picker-row"><div><strong>${escapeHtml(i.name)}</strong><p>${escapeHtml(i.rarity||'')} · ${escapeHtml(i.category||'')}</p></div><button class="toolbar-btn" type="button" data-root-id="${escapeHtml(i.id)}">Add to Campaign</button></div>`).join('')||'<p>No matching items.</p>';
    list.querySelectorAll('[data-root-id]').forEach(b=>b.addEventListener('click',()=>runVaultButton(b,async()=>{
      const result=await vaultCall('vaultCopyCampaignItem',{campaignId:id,source:'root',sourceId:b.dataset.rootId});
      if(activeCampaign?.id!==id)return;
      await refreshCampaignData();closeRootPicker();openItemModal(items.find(i=>i.id===result.itemId));
    })));
  };dialog.querySelector('#rootPickerSearch').addEventListener('input',paint);paint();dialog.showModal();
}
function closeRootPicker(){const d=document.getElementById('rootPicker');if(d?.open)d.close();}
function closeVaultAction(){const d=document.getElementById('vaultActionDialog');if(d?.open)d.close();}
function openInventoryAction(item,action,entry=null) {
  if(!activeCampaign)return;
  const manager=canManageCampaign();if(['assign','unloot','transfer'].includes(action)&&!manager)return;
  const choices=action==='transfer'?allPlayableCharacters().filter(c=>c.id!==entry?.characterId):action==='assign'?allPlayableCharacters():myCharacters();
  if(!entry&&!choices.length){alert('Create a character first.');return;}
  let d=document.getElementById('vaultActionDialog');if(!d){d=document.createElement('dialog');d.id='vaultActionDialog';d.className='vault-dialog vault-dialog-small';document.body.appendChild(d);}
  const labels={claim:'Loot',assign:'Assign',unloot:'Unloot',use:'Use',transfer:'Transfer'};
  const campaignId=activeCampaign.id;
  d.innerHTML=`<h2>${labels[action]} ${escapeHtml(item.name)}</h2><p>${action==='unloot'?'Return copies to the campaign’s available stock.':action==='use'?'Remove used copies from your inventory. This does not replenish stock.':''}</p>
    ${(!entry||action==='transfer')?`<label class="modal-label">${action==='transfer'?'Transfer to':'Character'}<select id="actionCharacter">${choices.map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===selectedCharacter?.id?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></label>`:''}
    <label class="modal-label">Quantity<input id="actionQuantity" type="number" min="1" max="${entry?.quantity||1000000}" value="1" step="1"></label><p id="actionError" role="alert"></p>
    <div class="dm-tool-actions"><button id="confirmInventoryAction" class="save-edit-button" type="button">${labels[action]}</button><button id="cancelInventoryAction" class="cancel-button" type="button">Cancel</button></div>`;
  d.querySelector('#cancelInventoryAction').addEventListener('click',closeVaultAction);
  d.querySelector('#confirmInventoryAction').addEventListener('click',async event=>{
    const button=event.currentTarget;if(button.disabled)return;button.disabled=true;
    try {
      const quantity=Number(d.querySelector('#actionQuantity').value);if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('Enter a positive whole quantity.');
      await vaultCall('vaultInventoryAction',{campaignId,itemId:item.id,action,quantity,characterId:entry?.characterId||d.querySelector('#actionCharacter').value,...(action==='transfer'?{targetCharacterId:d.querySelector('#actionCharacter').value}:{})});
      closeVaultAction();if(activeCampaign?.id===campaignId)await refreshCampaignData();
    }catch(error){d.querySelector('#actionError').textContent=error.message;}finally{button.disabled=false;}
  });d.showModal();
}
async function deleteCampaignCharacter(characterId) {
  if(!activeCampaign)return;
  const character=characters.find(c=>c.id===characterId);if(!character)return;
  if(!confirm(`${character.active===false?'Restore':'Archive'} "${character.name}"? Items and saved items will be preserved.`))return;
  const id=activeCampaign.id;
  await vaultCall('vaultDeleteCharacter',{campaignId:id,characterId});
  if(activeCampaign?.id!==id)return;
  await loadCharacters();await refreshCampaignData();populateOwnerFilter();renderDMCharacters();
}
