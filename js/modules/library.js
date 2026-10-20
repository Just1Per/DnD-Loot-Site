"use strict";
function itemAttributionMarkup(item) {
  const rights=item.rights;
  if(!rights?.attribution)return '';
  const migrationNotice='Replaced the old catalogue version with the selected licensed SRD description; normalized line endings/literal newline escapes and removed Markdown link/emphasis syntax for plain-text cards. No old quotes or property prose retained. Generated illustrations are preserved separately under the owner instruction.';
  const credit=rights.license==='CC-BY-4.0'&&/^This work includes material from the System Reference Document 5\.[12] by Wizards of the Coast LLC,/.test(rights.attribution)&&rights.attribution.endsWith('Changes: '+migrationNotice)
    ?rights.attribution.slice(0,-migrationNotice.length)+'Adapted for this catalogue.'
    :rights.attribution;
  const source=/^https:\/\//.test(rights.sourceUrl||'')?` <a href="${escapeHtml(rights.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>`:'';
  const license=rights.license==='CC-BY-4.0'?' <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>':'';
  return `<details class="item-attribution"><summary>Source &amp; licence</summary><p>${escapeHtml(credit)}${source}${license}</p></details>`;
}
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
  const savedEntry=context.savedEntry||null;
  const savedMode=!!savedEntry;
  const savedCanRemove=savedMode&&(manager||savedEntry.userId===auth.currentUser?.uid);
  const savedCanMove=savedMode&&savedEntry.userId===auth.currentUser?.uid;
  const savedCharacters=savedCanMove?myCharacters().filter(c=>c.active!==false):[];
  const owned=inventory.filter(e=>e.itemId===item.id&&e.quantity>0);
  const mine=owned.filter(e=>e.userId===auth.currentUser?.uid);
  const isSaved=!root&&saves.some(s=>s.itemId===item.id&&s.characterId===selectedCharacter?.id);
  const rarity=(item.rarity||'').toLowerCase().replaceAll(' ','-');
  const card=document.createElement('div');card.className='item-card';if(/^[a-z-]+$/.test(rarity))card.classList.add(rarity);
  card.dataset.itemId=item.id;
  if(!root&&state.highlighted)card.classList.add('highlighted');
  if(!root&&state.looted&&!savedMode)card.classList.add('looted');
  if(savedMode)card.classList.add('saved-item-card');
  const quantity=entry?.quantity??(manager?owned:mine).reduce((n,e)=>n+e.quantity,0);
  const stock=campaignSupply[item.id];
  const canClaim=!root&&!entry&&canUseCharacters()&&item.visible&&item.lootMode==='player';
  card.innerHTML=`<div class="card-buttons">
    ${savedMode? `
      <span class="saved-item-label">★ Saved · Not in inventory</span>
      ${savedCanRemove?'<button type="button" class="saved-remove-button">Remove saved</button>':''}
      ${savedCanMove&&savedCharacters.length>1?`<label class="saved-move-label">Save for
        <select class="saved-character-target" aria-label="Move saved item to character">${savedCharacters.map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===savedEntry.characterId?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select>
        </label><button type="button" class="saved-move-button">Move saved</button>`:''}
    ` : `
    ${canEdit?`<button type="button" class="edit-button">${root?'Edit Root Item':'Edit Campaign Item'}</button><button type="button" class="clone-button">Clone</button>${!entry?`<button type="button" class="delete-item-button">${root?'Delete root item':'Remove from campaign'}</button>`:''}`:''}
    ${manager?`<button type="button" class="visibility-toggle-btn">${item.visible?'Visible':'Hidden'}</button><button type="button" class="highlight-button">${item.highlighted?'Highlighted':'Highlight'}</button>`:''}
    ${manager&&!entry?'<button type="button" class="assign-button">Assign</button>':''}
    ${canClaim?'<button type="button" class="loot-button">Loot</button>':''}
    ${!root&&!entry&&canUseCharacters()&&item.visible?`<button type="button" class="save-item-button" ${!selectedCharacter?'disabled title="Select your active character first"':''}>${isSaved?'★ Saved':'☆ Save'}</button>`:''}
    ${entry&&manager?'<button type="button" class="unloot-button">Unloot</button><button type="button" class="transfer-button">Transfer</button>':''}
    ${entry&&(manager||entry.userId===auth.currentUser?.uid)?'<button type="button" class="use-button">Use</button>':''}
    `}
    </div>
    <div class="card-header"><h2 class="item-name">${escapeHtml(item.name)}</h2><p class="item-type">${escapeHtml(item.category||'')}${item.attunement?' · Requires Attunement':''}</p>
    <div class="card-meta"><span class="meta-tag ${escapeHtml(rarity)}">${escapeHtml(item.rarity||'')}</span>${item.source?`<span class="meta-tag">${escapeHtml(item.source)}</span>`:''}
    ${!root?`<span class="meta-tag campaign-tag" title="Locked to this campaign">🔒 ${escapeHtml(activeCampaign?.name||'')}</span>`:''}</div>
    ${!root&&!savedMode&&quantity?`<p class="inventory-quantity">${entry?'Owned':manager?'Assigned':'You own'}: ${quantity}</p>`:''}
    ${manager&&!savedMode&&stock?`<p class="supply-label">Available: ${stock.unlimited?'Unlimited':(stock.capacity-stock.claimed)} · ${item.lootMode==='player'?'Player looting':'DM assignment only'}</p>`:''}
    ${!root&&!manager&&!entry&&!savedMode?`<p class="supply-label">${item.lootMode!=='player'?'DM assignment only':'Player looting enabled'}</p>`:''}</div>
    ${context.savedUnavailable?'<div class="card-art saved-item-unavailable" role="img" aria-label="Item details unavailable">?</div>':itemImageMarkup(item,'card-art')}
    <div class="card-body"><div class="item-description">${escapeHtml(item.description||'')}</div>${(item.properties||[]).map(p=>`<div class="property-block"><span class="property-title">${escapeHtml(p.title)}:</span> ${escapeHtml(p.text)}</div>`).join('')}${item.quote?`<i>${escapeHtml(item.quote)}</i>`:''}${itemAttributionMarkup(item)}</div>
    ${savedMode?`<div class="owner-badge">Saved for: ${escapeHtml(characters.find(c=>c.id===savedEntry.characterId)?.name||'Character')}</div>`:''}
    ${manager&&!savedMode&&!entry&&owned.length?`<div class="owner-badge">${owned.map(e=>`${escapeHtml(characters.find(c=>c.id===e.characterId)?.name||'Character')} × ${e.quantity}`).join(' · ')}</div>`:''}
    <div class="card-footer">${root?'Root Catalogue':'D&D Campaign Vault'}</div>`;
  const on=(selector,work)=>card.querySelector(selector)?.addEventListener('click',event=>{
    // The page-based sheet keeps its draft while the item editor is open.
    return runVaultButton(event.currentTarget,work);
  });
  on('.saved-remove-button',()=>removeSavedItem(savedEntry));
  on('.saved-move-button',()=>moveSavedItem(savedEntry,card.querySelector('.saved-character-target')?.value));
  on('.edit-button',()=>{openItemModal(item,{scope:root?'root':'campaign'});});
  on('.clone-button',async()=>{
    if(root){const id=crypto.randomUUID();const data={...rootItemData(item),imageBaseId:item.imageBaseId||item.id};await setDoc(doc(db,'items',id),{...data,name:`${item.name} (Copy)`});rootItems.push({...data,id,name:`${item.name} (Copy)`});await markCatalogChanged();renderRootCatalogue();}
    else {const id=activeCampaign.id;const result=await vaultCall('vaultCopyCampaignItem',{campaignId:id,source:'campaign',sourceId:item.id});if(activeCampaign?.id!==id)return;await refreshCampaignData();openItemModal(items.find(i=>i.id===result.itemId));}
  });
  on('.delete-item-button',async()=>{
    const campaignId=activeCampaign?.id,uid=auth.currentUser?.uid;
    const current=()=>auth.currentUser?.uid===uid&&(root?isAdmin():activeCampaign?.id===campaignId&&canManageCampaign());
    if(!current())return;
    const accepted=await SiteConfirmation.ask({title:root?'Delete root item “'+item.name+'”?':'Remove “'+item.name+'” from this campaign?',paragraphs:root?['This deletes the shared root template. Existing campaign copies remain unchanged.']:['This removes the campaign copy and its available supply. The shared catalogue template and other campaigns are unchanged.','Assigned copies must be returned first. Saved bookmarks may show this item as unavailable after removal.'],confirmLabel:root?'Delete root item':'Remove from campaign',isCurrent:current});
    if(!accepted||!current())return;
    if(root){await deleteDoc(doc(db,'items',item.id));if(!current())return;rootItems=rootItems.filter(i=>i.id!==item.id);await markCatalogChanged();if(current())renderRootCatalogue();}
    else {await vaultCall('vaultDeleteCampaignItem',{campaignId,itemId:item.id});if(current())await refreshCampaignData();}
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
  const allowed=['mechanics','name','description','category','rarity','source','quote','attunement','classes','properties','imageUrl','imageBaseId','edition'];
  return Object.fromEntries(allowed.filter(k=>item[k]!==undefined).map(k=>[k,item[k]]));
}
function buildModalClassCheckboxes(selected=[]) {
  document.getElementById('modal-classes').innerHTML=ALL_CLASSES.map(c=>`<label class="class-option"><input type="checkbox" value="${c}" ${selected.includes(c)?'checked':''}>${c}</label>`).join('');
}
let itemEditor=null;
function openItemModal(item=null,{scope='campaign'}={}) {
  if(scope==='root'?!isAdmin():!canManageCampaign())return;
  if(scope==='campaign'&&activeCampaign.inventoryVersion!==2){alert('Upgrade this campaign first.');return;}
  if(!PageEditors.guard(()=>openItemModal(item,{scope})))return;
  if(!SheetNavigation.guard(()=>openItemModal(item,{scope})))return;
  const stock=campaignSupply[item?.id];
  itemEditor={uid:auth.currentUser?.uid,scope,itemId:item?.id||null,campaignId:scope==='campaign'?activeCampaign.id:null,stockRevision:stock?.revision??null,imageBaseId:item?.imageBaseId||''};
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
  renderItemMechanicsEditor(item);
  openVaultModal('itemModal');
}
function closeItemModal(){
  if(closeVaultModal('itemModal')===false)return false;
  itemEditor=null;return true;
}
function currentItemEditor(editor){
  return !!editor&&itemEditor===editor&&PageEditors.session('itemModal')?.editor===editor&&editor.uid===auth.currentUser?.uid&&
    (editor.scope==='root'?isAdmin():activeCampaign?.id===editor.campaignId&&canManageCampaign());
}
async function saveItemModal() {
  const editor=itemEditor,button=document.getElementById('saveItemModal');
  if(!currentItemEditor(editor)||button.disabled)return false;
  const session=PageEditors.session('itemModal');
  button.disabled=true;PageEditors.setSaving(session,true);
  PageEditors.status('itemModal','Saving item…');
  try {
    const item={};for(const key of ['name','category','rarity','source','description','quote'])item[key]=document.getElementById(`modal-${key}`).value;
    if(!item.name.trim())throw Error('Name is required.');
    item.mechanics=readItemMechanicsEditor();
    item.attunement=document.getElementById('modal-attunement').checked;
    item.properties=getPropertiesFromEditor();item.classes=[...document.querySelectorAll('#modal-classes input:checked')].map(i=>i.value);
    item.imageUrl=document.getElementById('modal-imageUrl').value.trim();item.imageBaseId=editor.imageBaseId;
    if(item.imageUrl&&!/^https:\/\//i.test(item.imageUrl))throw Error('Image URL must use HTTPS.');
    // Snapshot the complete form before upload; a late response cannot read a replacement editor.
    const policy=editor.scope==='campaign'?{
      remaining:Number(document.getElementById('modal-remaining').value),
      unlimited:document.getElementById('modal-unlimited').checked,
      visible:document.getElementById('modal-visible').checked,
      lootMode:document.getElementById('modal-lootMode').value
    }:null;
    if(policy&&(!Number.isSafeInteger(policy.remaining)||policy.remaining<0||policy.remaining>1000000))throw Error('Available quantity must be a whole number from 0 to 1000000.');
    const file=document.getElementById('modal-imageFile').files?.[0];
    if(file){editor.itemId ||= crypto.randomUUID();item.imageUrl=await uploadItemImage(editor.itemId,file,{campaignId:editor.campaignId});}
    if(!currentItemEditor(editor))return false;
    if(editor.scope==='root') {
      const id=editor.itemId ||= crypto.randomUUID();await setDoc(doc(db,'items',id),item);
      if(!currentItemEditor(editor))return false;
      const idx=rootItems.findIndex(i=>i.id===id);if(idx<0)rootItems.push({...item,id});else rootItems[idx]={...item,id};
      await markCatalogChanged();
      if(!currentItemEditor(editor))return false;
      renderRootCatalogue();PageEditors.markSaved('itemModal');closeItemModal();
    } else {
      await vaultCall('vaultSaveCampaignItem',{scope:editor.scope,itemId:editor.itemId,campaignId:editor.campaignId,stockRevision:editor.stockRevision,imageBaseId:editor.imageBaseId,item,...policy});
      if(!currentItemEditor(editor))return false;
      PageEditors.markSaved('itemModal');closeItemModal();
      try {await refreshCampaignData();PageEditors.returnFocus(session,true);}
      catch(error){if(auth.currentUser?.uid===editor.uid&&activeCampaign?.id===editor.campaignId)alert('Your item is saved. Could not refresh the Library: '+error.message);}
    }
    return true;
  } catch(error) {
    if(currentItemEditor(editor))PageEditors.status('itemModal',error.message||'The item could not be saved.',true);
    return false;
  } finally {
    PageEditors.setSaving(session,false);
    if(itemEditor===editor||!itemEditor)button.disabled=false;
  }
}


// Browse existing personal templates without loading campaign-private preparation.
var ReusableLibrary=(()=>{
 let session=null;
 const e=value=>escapeHtml(String(value??''));
 const current=s=>session===s&&auth.currentUser?.uid===s.uid&&activeCampaign?.id===s.campaignId&&canManageCampaign();
 function clear(){session=null;document.getElementById('tab-library-reusable')?.replaceChildren();}
 async function render(){
  clear();const root=document.getElementById('tab-library-reusable');if(!root)return;
  root.innerHTML='<section class="campaign-information-shell"><header><p class="campaign-book-eyebrow">Library</p><h2>Reusable content</h2><p>Your saved creature and NPC templates. Create an independent campaign draft from a template; the original stays in your library.</p></header><div data-reusable-content></div></section>';
  const host=root.querySelector('[data-reusable-content]');
  if(!canManageCampaign()){host.innerHTML='<p>Personal creature templates are available to campaign DMs. Read the people your party knows in Journal → NPCs.</p>';return;}
  const s={uid:auth.currentUser?.uid,campaignId:activeCampaign?.id};session=s;
  host.innerHTML='<label class="workspace-field">Search reusable content<input type="search" data-template-search></label><p role="status" data-template-status>Loading your templates…</p><div data-template-list></div>';
  const status=host.querySelector('[data-template-status]'),list=host.querySelector('[data-template-list]');
  try{
   const rows=await PersonalCreatureLibrary.list();if(!current(s))return;
   const paint=()=>{
    if(!current(s))return;const query=host.querySelector('[data-template-search]').value.trim().toLowerCase();
    const matches=rows.filter(row=>[row.title,row.summary,row.content,row.data?.category].join(' ').toLowerCase().includes(query));
    status.textContent=matches.length+' saved '+(matches.length===1?'template':'templates');
    list.innerHTML=matches.map(row=>`<article class="campaign-information-card"><details><summary><strong>${e(row.title)}</strong><span>${e(row.data?.category||'Creature')}</span><p>${e(row.summary||row.content?.slice(0,180)||'Read this saved template.')}</p></summary><div class="campaign-book-prose">${e(row.content)}</div><button type="button" data-use-template="${e(row.id)}">Create campaign draft</button></details></article>`).join('')||'<p>No matching templates. In DM Workspace → Creatures &amp; NPCs, save a creature to My Library to reuse it in other campaigns.</p>';
    list.querySelectorAll('[data-use-template]').forEach(button=>button.onclick=async()=>{
     if(!current(s))return;const record=rows.find(row=>row.id===button.dataset.useTemplate);if(!record)return;
     showTab('dm-creatures',false);if(AppShell.route!=='dm-creatures')return;
     await CampaignWorkspace.render('creature');
     const workspace=CampaignWorkspace.session;
     if(auth.currentUser?.uid!==s.uid||activeCampaign?.id!==s.campaignId||workspace?.uid!==s.uid||workspace?.campaignId!==s.campaignId||workspace.kind!=='creature'||!canManageCampaign())return;
     CampaignWorkspace.importCreature(record);
    });
   };
   host.querySelector('[data-template-search]').oninput=paint;paint();
  }catch(error){if(current(s)){status.textContent='Could not load your templates: '+error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='Retry loading templates';retry.onclick=render;list.append(retry);}}
 }
 return{render,clear};
})();
