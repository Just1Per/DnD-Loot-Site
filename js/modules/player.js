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
          <div class="wish-modal-card ${rc}">
            ${itemImageMarkup(item, "wish-modal-art")}
            <div class="wish-modal-body">
              <div class="wish-modal-name">${item.name}</div>
              <div class="card-meta" style="margin-top:4px">
                ${item.rarity  ?`<span class="meta-tag ${rc}">${item.rarity}</span>`:""}
                ${item.category?`<span class="meta-tag">${item.category}</span>`:""}
                ${item.attunement?`<span class="meta-tag">Attunement</span>`:""}
              </div>
              ${(item.properties||[]).slice(0,2).map(p=>`
                <div class="wish-modal-prop">
                  <span class="property-title">${p.title}:</span>
                  ${p.text.substring(0,120)}${p.text.length>120?"…":""}
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
    allPlayableCharacters().map(c=>`<option value="${c.id}">${characterDisplayName(c)}</option>`).join("");
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
  const mine = myCharacters();
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
          <span class="character-card-name">${c.name}</span>
          <span class="character-card-class">${c.class}${c.level?" · Level "+c.level:""}</span>
          ${tierBadge}
        </div>
        <div class="character-card-actions">
          ${selectedCharacter?.id!==c.id
            ? `<button class="btn-select-char" type="button" data-char-id="${c.id}">Set Active</button>`
            : `<span class="active-badge">✓ Active</span>`
          }
          <button class="btn-rename-char" type="button"
            data-char-id="${c.id}" data-char-name="${c.name}"
            data-char-class="${c.class}" data-char-level="${c.level||""}">Edit</button>
          <button class="btn-delete-char cancel-button" type="button"
            data-char-id="${c.id}" data-char-name="${c.name}">Delete</button>
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll(".btn-select-char").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      selectedCharacter=characters.find(c=>c.id===btn.dataset.charId)||null;
      renderCharacterList(); renderMyWishes(); renderCards();
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn=>{
    btn.addEventListener("click", ()=>
      openEditCharacterModal(btn.dataset.charId, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel)
    );
  });

  el.querySelectorAll(".btn-delete-char").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if (!confirm(`Delete "${btn.dataset.charName}"?`)) return;
      const cid = btn.dataset.charId;
      if (activeCampaign) {
        for (const s of saves.filter(s=>s.characterId===cid))
          await deleteDoc(doc(db,"campaigns",activeCampaign.id,"saves",s.id));
        const ownedItemIds = Object.entries(itemState)
          .filter(([, state]) => state?.owner === cid)
          .map(([itemId]) => itemId);

        await Promise.all(ownedItemIds.map(itemId =>
          persistItemState(itemId, { owner: null })
        ));
        await deleteDoc(doc(db,"campaigns",activeCampaign.id,"characters",cid));
      }
      saves=saves.filter(s=>s.characterId!==cid);
      characters=characters.filter(c=>c.id!==cid);
      if (selectedCharacter?.id===cid) selectedCharacter=null;
      populateOwnerFilter(); renderPlayerTab(); renderCards();
    });
  });
}

function renderMyLoot() {
  const el = document.getElementById("myLootGrid");
  if (!el) return;

  const mine = myCharacters();

  if (!mine.length) {
    el.innerHTML = `<p class="player-empty">Create a character to see your loot.</p>`;
    return;
  }

  const myCharIds = new Set(mine.map(c => c.id));

  const myItems = items.filter(item => {
    const state = getItemState(item.id);
    return state.looted && state.owner && myCharIds.has(state.owner);
  });

  if (!myItems.length) {
    el.innerHTML = `<p class="player-empty">No items assigned to you yet.</p>`;
    return;
  }

  el.innerHTML = myItems.map(item => {
    const ownerId = getItemState(item.id).owner;
    const ownerChar = characters.find(c => c.id === ownerId);
    return createMiniCard(item, "loot", ownerChar?.name || "");
  }).join("");

  observePendingImages(el);
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
    <div class="mini-card ${rc}">
      ${itemImageMarkup(item, "mini-card-art")}
      <div class="mini-card-body">
        <div class="mini-card-name">${item.name}</div>
        <div class="mini-card-meta">
          ${item.rarity  ?`<span class="meta-tag ${rc}">${item.rarity}</span>`:""}
          ${item.category?`<span class="meta-tag">${item.category}</span>`:""}
          ${mode==="wish"&&extra?`<span class="meta-tag campaign-tag">★ ${extra}</span>`:""}
          ${mode==="loot"&&extra?`<span class="meta-tag" style="border-color:#27ae60;color:#1e8449">⚔ ${extra}</span>`:""}
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

  if (activeCampaign) {
    await updateDoc(
      doc(db, "campaigns", activeCampaign.id, "characters", charId),
      changes
    );
  }

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

  renderCards();
}

