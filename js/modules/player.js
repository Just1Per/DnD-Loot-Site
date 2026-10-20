"use strict";

// SAVED ITEMS / FILTERS / PLAYER TAB / CHARACTER EDITING
// Extracted from the working Step 7 app with behavior preserved.

// ─── SAVED ITEMS ───────────────────────────────────────────────────────────────

let savedItemLoadKey='';
function ensureSavedItemDetails() {
  if(!activeCampaign||!auth.currentUser)return;
  const campaignId=activeCampaign.id,uid=auth.currentUser.uid,key=campaignId+':'+uid;
  if(savedItemLoadKey===key)return;
  savedItemLoadKey=key;
  loadCampaignItems().then(()=>{
    if(activeCampaign?.id!==campaignId||auth.currentUser?.uid!==uid)return;
    renderMyWishes();
  }).catch(error=>{if(savedItemLoadKey===key)savedItemLoadKey='';console.warn('Saved item details could not be loaded:',error);});
}
function savedItemCard(save) {
  const item=items.find(item=>item.id===save.itemId);
  // Retain an actionable saved record when its catalogue item is hidden or unavailable.
  const fallback={id:save.itemId,name:'Saved item unavailable',description:'This item is currently unavailable in the campaign Library. Your save is retained, but its details cannot be shown.'};
  return createCard(item||fallback,{savedEntry:save,savedUnavailable:!item});
}
function openWishModal(charId) {return CharacterWorkspace.open(charId,'character-wishlist');}
async function removeSavedItem(save) {
  const id=activeCampaign?.id,uid=auth.currentUser?.uid;
  const existing=saves.find(row=>row.id===save?.id);
  if(!id||!uid||!existing||(!canManageCampaign()&&existing.userId!==uid))return;
  await deleteDoc(doc(db,'campaigns',id,'saves',existing.id));
  if(activeCampaign?.id!==id||auth.currentUser?.uid!==uid)return;
  await loadSaves();renderMyWishes();renderCards();
}
async function moveSavedItem(save,targetId) {
  const id=activeCampaign?.id,uid=auth.currentUser?.uid;
  const existing=saves.find(row=>row.id===save?.id);
  const character=myCharacters().find(c=>c.id===targetId&&c.active!==false);
  if(!id||!uid||!existing||existing.userId!==uid||!character||existing.characterId===targetId)return;
  if(saves.some(row=>row.itemId===existing.itemId&&row.characterId===targetId)){
    alert('This item is already saved for that character.');return;
  }
  const item=items.find(row=>row.id===existing.itemId);
  if(!item?.visible){alert('This saved item is no longer visible in the Library, so it cannot be moved.');return;}
  const batch=writeBatch(db);
  batch.delete(doc(db,'campaigns',id,'saves',existing.id));
  batch.set(doc(db,'campaigns',id,'saves',targetId+'__'+existing.itemId),{
    itemId:existing.itemId,characterId:targetId,userId:uid,created:Date.now()
  });
  await batch.commit();
  if(activeCampaign?.id!==id||auth.currentUser?.uid!==uid)return;
  await loadSaves();renderMyWishes();renderCards();
}


// ─── VISIBILITY BULK CONTROLS ─────────────────────────────────────────────────

function renderVisibilityControls() {
  const el = document.getElementById("visibilityControls");
  if (!el || !activeCampaign || !canManageCampaign()) { if(el) el.innerHTML=""; return; }
  el.innerHTML = `
    <div class="visibility-bulk">
      <span class="visibility-bulk-label">Quick show by rarity:</span>
      ${RARITIES.map(r=>`
        <div class="visibility-bulk-rarity">
          <span class="rarity-pill ${r.toLowerCase().replaceAll(" ","-")}">${r}</span>
          <button class="vis-show-btn" type="button" data-rarity="${r}">Show all</button>
          <button class="vis-hide-btn" type="button" data-rarity="${r}">Hide all</button>
        </div>`).join("")}
    </div>`;
  el.querySelectorAll(".vis-show-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>setVisibilityByRarity(btn.dataset.rarity, true));
  });
  el.querySelectorAll(".vis-hide-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>setVisibilityByRarity(btn.dataset.rarity, false));
  });
}

// ─── FILTER POPULATORS ────────────────────────────────────────────────────────

function populateSourceFilter() {
  const el = document.getElementById("sourceFilter");
  if (!el) return;
  const cur = el.value;
  const sources = [...new Set(items.map(i=>i.source).filter(Boolean))].sort();
  el.innerHTML = `<option value="">All Sources</option>` +
    sources.map(s=>`<option ${s===cur?"selected":""}>${s}</option>`).join("");
}

function populateCampaignFilter() {
  const el = document.getElementById("campaignFilter");
  if (!el) return;
  const cur   = el.value;
  const camps = availableCampaigns();
  el.innerHTML = `<option value="">All Campaigns</option>` +
    camps.map(c=>`<option ${c===cur?"selected":""}>${c}</option>`).join("");
}

function populateOwnerFilter() {
  const el = document.getElementById("ownerFilter");
  if (!el) return;
  el.innerHTML = `<option value="">All Owners</option>` +
    (canManageCampaign()?allPlayableCharacters():myCharacters()).map(c=>`<option value="${c.id}">${characterDisplayName(c)}</option>`).join("");
}


// ─── STATS BAR ────────────────────────────────────────────────────────────────

function updateStats(results, looted, highlighted, saved) {
  const el = document.getElementById("campaignStats");
  if (el) el.textContent =
    `${results} items  ·  ${looted} looted  ·  ${highlighted} highlighted  ·  ${saved} saved`;
}

// ─── PLAYER TAB ──────────────────────────────────────────────────────────────

function renderPlayerTab() {
  renderCharacterList();
  renderMyLoot();
  renderMyWishes();
  if(typeof CharacterWorkspace!=="undefined")CharacterWorkspace.refresh(false);
}

function renderCharacterList() {
  const mine = characters.filter(c=>c.userId===auth.currentUser?.uid);
  const el   = document.getElementById("myCharacterList");
  if (!el) return;
  if (!mine.length) { el.innerHTML=`<p class="player-empty">No characters yet — create one below.</p>`; return; }
  el.innerHTML = mine.map(c=>{
    const tier = getTier(c.level);
    const tierBadge = tier
      ? `<span class="tier-badge" style="background:${tier.bg};color:${tier.color};border-color:${tier.color}">${tier.label} · ${tier.rarity}</span>`
      : "";
    return `
      <div class="character-card ${selectedCharacter?.id===c.id?"character-card--active":""}">
        <div class="character-card-info">
          <span class="character-card-name">${escapeHtml(c.name)}</span>
          <span class="character-card-class">${escapeHtml(c.class)}${c.level?" · Level "+c.level:""}</span>
          ${tierBadge}
        </div>
        <div class="character-card-actions">
          <button type="button" class="btn-sheet-char" data-char-id="${escapeHtml(c.id)}">Character sheet</button>
          ${c.active===false ? '<span class="active-badge">Archived</span>' : selectedCharacter?.id!==c.id
            ? `<button class="btn-select-char" type="button" data-char-id="${c.id}">Set Active</button>`
            : `<span class="active-badge">✓ Active</span>`
          }
          <button class="btn-rename-char" type="button"
            data-char-id="${c.id}" data-char-name="${escapeHtml(c.name)}"
            data-char-class="${escapeHtml(c.class)}" data-char-level="${c.level||""}">Edit</button>
          <button class="btn-archive-char cancel-button" type="button"
            data-char-id="${c.id}" data-char-name="${escapeHtml(c.name)}">${c.active===false?'Restore':'Archive'}</button>
          <button class="btn-hard-delete-own-char dm-danger-btn" type="button"
            data-char-id="${c.id}" data-char-name="${escapeHtml(c.name)}">Delete</button>
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll(".btn-sheet-char").forEach(btn=>btn.addEventListener("click",()=>openCharacterSheet(btn.dataset.charId)));

  el.querySelectorAll(".btn-select-char").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const next=characters.find(c=>c.id===btn.dataset.charId)||null;
      if(!next||next.userId!==auth.currentUser?.uid||!activeCampaign)return;
      const stamp=Date.now();
      try {
        await updateDoc(doc(db,"campaigns",activeCampaign.id,"characters",next.id),{lastSelectedAt:stamp});
        next.lastSelectedAt=stamp;
        selectedCharacter=next;
        renderCharacterList(); renderMyWishes(); renderCards();
      } catch(error) {
        alert(`Could not set active character: ${error.message}`);
      }
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn=>{
    btn.addEventListener("click", async ()=>{await openCharacterSheet(btn.dataset.charId);selectSheetTab('builder');document.querySelector('[name="identity.name"]')?.focus();});
  });

  el.querySelectorAll(".btn-archive-char").forEach(btn=>btn.addEventListener("click",()=>runVaultButton(btn,()=>deleteCampaignCharacter(btn.dataset.charId))));
  el.querySelectorAll(".btn-hard-delete-own-char").forEach(btn=>btn.addEventListener("click",()=>runVaultButton(btn,()=>hardDeleteOwnCharacter(btn.dataset.charId))));
}

async function hardDeleteOwnCharacter(characterId) {
  if(!activeCampaign||!auth.currentUser)return;
  const character=characters.find(c=>c.id===characterId);
  if(!character||character.userId!==auth.currentUser.uid)return;
  const campaignId=activeCampaign.id;
  const ownedLoot=inventory.filter(entry=>entry.characterId===characterId&&entry.quantity>0);
  if(ownedLoot.length){
    alert(`"${character.name}" still owns ${ownedLoot.length} inventory entr${ownedLoot.length===1?'y':'ies'}. Move or ask your DM to unloot those items before permanently deleting the character so campaign stock stays correct.`);
    return;
  }
  const warning=[
    `Permanently delete "${character.name}"?`,
    '',
    'This cannot be undone.',
    'The private character sheet and saved-item links for this character will also be deleted.'
  ].join('\n');
  if(!confirm(warning))return;
  try {
    const ownSaved=saves.filter(save=>save.characterId===characterId&&(!save.userId||save.userId===auth.currentUser.uid));
    const sheetSnapshot=await getDoc(doc(db,'campaigns',campaignId,'characterSheets',characterId));
    const operations=ownSaved.length+(sheetSnapshot.exists()?1:0)+1;
    if(operations>500)throw Error('This character has too many linked records for one safe delete.');
    const batch=writeBatch(db);
    ownSaved.forEach(save=>batch.delete(doc(db,'campaigns',campaignId,'saves',save.id)));
    if(sheetSnapshot.exists())batch.delete(sheetSnapshot.ref);
    batch.delete(doc(db,'campaigns',campaignId,'characters',characterId));
    await batch.commit();
    if(sheetSession?.characterId===characterId)closeCharacterSheet(true);
    if(selectedCharacter?.id===characterId)selectedCharacter=null;
    if(activeCampaign?.id!==campaignId)return;
    await loadCharacters();
    await loadSaves();
    populateOwnerFilter();
    renderPlayerTab();
    if(canManageCampaign())renderDMCharacters();
    renderCards();
  } catch(error) {
    console.error('Own character delete failed:',error);
    alert(`Could not delete character: ${error.message}`);
  }
}
function renderMyLoot() {
  const el=document.getElementById('myLootGrid');if(!el)return;
  const owned=inventory.filter(e=>e.userId===auth.currentUser?.uid&&e.quantity>0);
  el.classList.add('character-loot-grid');
  if(!owned.length){el.innerHTML='<p class="player-empty">No items owned yet. Loot a visible item when allowed, or ask your DM.</p>';return;}
  el.replaceChildren(...owned.map(e=>{
    const card=createCard(inventoryItem(e),{inventoryEntry:e});
    const label=document.createElement('p');label.className='owner-badge';label.textContent=characters.find(c=>c.id===e.characterId)?.name||'Your character';card.prepend(label);return card;
  }));observePendingImages(el);
}

function renderMyWishes() {
  if(typeof CharacterWorkspace!=="undefined")CharacterWorkspace.refresh(false);
  const el=document.getElementById('myWishGrid');
  if(!el)return;
  el.classList.add('character-loot-grid');
  const ownedChars=myCharacters();
  if(!ownedChars.length){el.innerHTML='<p class="player-empty">Create a character to save items.</p>';return;}
  const ids=new Set(ownedChars.map(c=>c.id));
  const records=saves.filter(save=>ids.has(save.characterId));
  if(!records.length){el.innerHTML='<p class="player-empty">No saved items yet. Click ☆ Save on any item in the Library.</p>';return;}
  el.replaceChildren(...records.map(savedItemCard));
  if(records.some(save=>!items.some(item=>item.id===save.itemId)))ensureSavedItemDetails();
  observePendingImages(el);
}

// ─── CHARACTER IDENTITY PAGE ─────────────────────────────────────────────────────

async function openEditCharacterModal(charId) {
  if(await CharacterWorkspace.open(charId,'character-sheet')){selectSheetTab('builder');document.querySelector('[name="identity.name"]')?.focus();}
}
