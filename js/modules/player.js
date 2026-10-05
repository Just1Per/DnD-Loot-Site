"use strict";

// SAVED ITEMS / FILTERS / PLAYER TAB / CHARACTER EDITING
// Extracted from the working Step 7 app with behavior preserved.

// ─── SAVE MODAL ───────────────────────────────────────────────────────────────

function openWishModal(charId, charName) {
  const savedItems = saves
    .filter(s=>s.characterId===charId)
    .map(s=>items.find(i=>i.id===s.itemId))
    .filter(Boolean);
  document.getElementById("wishModalCharName").textContent = `${charName}'s Saved Items`;
  const grid = document.getElementById("wishModalGrid");
  grid.innerHTML = savedItems.length===0
    ? `<p class="player-empty" style="grid-column:1/-1">No saved items for this character.</p>`
    : savedItems.map(item=>{
        const rc=(item.rarity||"").toLowerCase().replaceAll(" ","-");
        return `
          <div class="wish-modal-card ${escapeHtml(rc)}">
            ${itemImageMarkup(item, "wish-modal-art")}
            <div class="wish-modal-body">
              <div class="wish-modal-name">${escapeHtml(item.name)}</div>
              <div class="card-meta" style="margin-top:4px">
                ${item.rarity  ?`<span class="meta-tag ${escapeHtml(rc)}">${escapeHtml(item.rarity)}</span>`:""}
                ${item.category?`<span class="meta-tag">${escapeHtml(item.category)}</span>`:""}
                ${item.attunement?`<span class="meta-tag">Attunement</span>`:""}
              </div>
              ${(item.properties||[]).slice(0,2).map(p=>`
                <div class="wish-modal-prop">
                  <span class="property-title">${escapeHtml(p.title)}:</span>
                  ${escapeHtml(p.text.substring(0,120))}${p.text.length>120?"…":""}
                </div>`).join("")}
            </div>
          </div>`;
      }).join("");
  document.getElementById("wishModal").style.display = "flex";
  observePendingImages(grid);
}

function closeWishModal() { document.getElementById("wishModal").style.display = "none"; }

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
    btn.addEventListener("click", ()=>{
      selectedCharacter=characters.find(c=>c.id===btn.dataset.charId)||null;
      if(selectedCharacter)rememberActiveCharacter(selectedCharacter.id);
      renderCharacterList(); renderMyWishes(); renderCards();
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn=>{
    btn.addEventListener("click", ()=>
      openEditCharacterModal(btn.dataset.charId, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel)
    );
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
    if(rememberedActiveCharacterId(campaignId)===characterId)rememberActiveCharacter('',campaignId);
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
  const el = document.getElementById("myWishGrid");
  if (!el) return;
  const mine = myCharacters();
  if (!mine.length) { el.innerHTML=`<p class="player-empty">Create a character to save items.</p>`; return; }
  const myCharIds = mine.map(c=>c.id);
  const saved = saves
    .filter(s=>myCharIds.includes(s.characterId))
    .map(s=>{
      const item=items.find(i=>i.id===s.itemId);
      const char=characters.find(c=>c.id===s.characterId);
      return item?{...item,_wishChar:char?.name||"?"}:null;
    }).filter(Boolean);
  if (!saved.length) { el.innerHTML=`<p class="player-empty">No saved items yet. Click ☆ Save on any item.</p>`; return; }
  el.innerHTML = saved.map(item=>createMiniCard(item,"wish",item._wishChar)).join("");
  observePendingImages(el);
}

function createMiniCard(item, mode, extra="") {
  const rc=(item.rarity||"").toLowerCase().replaceAll(" ","-");
  return `
    <div class="mini-card ${escapeHtml(rc)}">
      ${itemImageMarkup(item, "mini-card-art")}
      <div class="mini-card-body">
        <div class="mini-card-name">${escapeHtml(item.name)}</div>
        <div class="mini-card-meta">
          ${item.rarity  ?`<span class="meta-tag ${escapeHtml(rc)}">${escapeHtml(item.rarity)}</span>`:""}
          ${item.category?`<span class="meta-tag">${escapeHtml(item.category)}</span>`:""}
          ${mode==="wish"&&extra?`<span class="meta-tag campaign-tag">★ ${escapeHtml(extra)}</span>`:""}
          ${mode==="loot"&&extra?`<span class="meta-tag" style="border-color:#27ae60;color:#1e8449">⚔ ${escapeHtml(extra)}</span>`:""}
        </div>
        ${item.attunement?`<div class="mini-card-attune">Requires Attunement</div>`:""}
      </div>
    </div>`;
}

// ─── EDIT CHARACTER MODAL ─────────────────────────────────────────────────────

function openEditCharacterModal(charId, charName, charClass, charLevel = "") {
  document.getElementById("editChar-name").value  = charName;
  document.getElementById("editChar-class").value = charClass;
  document.getElementById("editChar-level").value = charLevel;

  document.getElementById("editCharModal").dataset.charId = charId;
  document.getElementById("editCharModal").style.display  = "flex";
}

function closeEditCharacterModal() { document.getElementById("editCharModal").style.display = "none"; }

async function saveEditCharacter() {
  const charId   = document.getElementById("editCharModal").dataset.charId;
  const character = characters.find(c => c.id === charId);
  if (!activeCampaign || !character || (!canManageCampaign() && character.userId !== auth.currentUser?.uid)) return;
  const campaignId = activeCampaign.id;
  const newName  = document.getElementById("editChar-name").value.trim();
  const newClass = document.getElementById("editChar-class").value;
  const newLevel = parseInt(document.getElementById("editChar-level").value) || null;

  if (!newName) {
    alert("Character name is required.");
    return;
  }

  if (newLevel !== null && (newLevel < 1 || newLevel > 20)) {
    alert("Level must be 1–20.");
    return;
  }

  const changes = {
    name: newName,
    class: newClass,
    level: newLevel
  };

  try {
    await updateDoc(doc(db, "campaigns", campaignId, "characters", charId), changes);
  } catch (error) {
    alert(`Could not save character: ${error.message}`);
    return;
  }
  if (activeCampaign?.id !== campaignId) return;

  const idx = characters.findIndex(c => c.id === charId);
  if (idx !== -1) characters[idx] = { ...characters[idx], ...changes };

  if (selectedCharacter?.id === charId) selectedCharacter = characters[idx];

  closeEditCharacterModal();
  populateOwnerFilter();
  renderPlayerTab();

  if (isAdmin()) {
    renderUserTable();
    renderAdminStats();
  }

  if (canManageCampaign()) renderDMCharacters();
  renderCards();
}

