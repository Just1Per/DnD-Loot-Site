"use strict";

// ITEM STATE / ITEM CARDS / ITEM MODAL
// Extracted from the working Step 7 app with behavior preserved.

// ─── CAMPAIGN ITEM STATE / VISIBILITY ─────────────────────────────────────────

async function toggleItemVisibility(itemId) {
  if (!activeCampaign || !canManageCampaign()) return;

  const newVal = !getItemState(itemId).visible;
  await persistItemState(itemId, { visible: newVal });
  rerenderCard(itemId);
}

async function setVisibilityByRarity(rarity, visible) {
  if (!activeCampaign || !canManageCampaign()) return;

  const matches = items.filter(i => i.rarity === rarity);

  // This is a management action, not part of page load. Run writes concurrently
  // rather than one-by-one, while keeping the local UI state in sync.
  await Promise.all(matches.map(item =>
    persistItemState(item.id, { visible })
  ));

  renderCards();
}

// ─── CREATE CARD ──────────────────────────────────────────────────────────────

function createCard(item, context = buildRenderContext()) {
  const card = document.createElement("div");
  card.classList.add("item-card");
  card.dataset.itemId = item.id;

  const admin       = isAdmin();
  const manager     = canManageCampaign();
  const isEditing   = admin && editingItems.has(item.id);
  const rarityClass = (item.rarity || "").toLowerCase().replaceAll(" ", "-");
  const state       = getItemState(item.id);
  const isVisible   = state.visible;

  if (rarityClass)       card.classList.add(rarityClass);
  if (state.looted)      card.classList.add("looted");
  if (state.highlighted) card.classList.add("highlighted");
  if (activeCampaign && !isVisible && manager) card.classList.add("hidden-from-players");

  const itemSaves = context.savesByItem.get(item.id) || [];
  const mySave = selectedCharacter
    ? itemSaves.find(s => s.characterId === selectedCharacter.id)
    : null;

  const saveNames = itemSaves.map(s => {
    const c = context.charactersById.get(s.characterId);
    return c ? `${c.name} (${c.class})` : "Unknown";
  }).join(", ");

  const canSave      = canUseCharacters() && selectedCharacter !== null;
  const needsChar    = canUseCharacters() && selectedCharacter === null;
  const showSaveInfo = manager || !!mySave;

  const ownerChar = state.owner ? context.charactersById.get(state.owner) : null;
  const ownerName = ownerChar ? `${ownerChar.name} (${ownerChar.class})` : "";

  card.innerHTML = `
    <div class="watermark">LOOTED</div>

    <div class="card-buttons">
      ${manager && activeCampaign ? `
        <button class="loot-button" type="button">${state.looted ? "Looted" : "Loot"}</button>
        <button class="highlight-button" type="button">${state.highlighted ? "Highlighted" : "Highlight"}</button>
        <button class="visibility-toggle-btn ${isVisible ? "visible" : "hidden-item"}" type="button"
          title="${isVisible ? "Visible to players — click to hide" : "Hidden from players — click to show"}">
          ${isVisible ? "👁 Visible" : "🚫 Hidden"}
        </button>
      ` : ""}

      ${admin ? `
        ${isEditing
          ? `<button class="save-edit-button" type="button">Save</button>
             <button class="cancel-button" type="button">Cancel</button>
             <button class="clone-button" type="button">Clone</button>
             <button class="delete-item-button" type="button">🗑 Delete</button>`
          : `<button class="edit-button" type="button">Edit Master Item</button>`
        }
      ` : ""}

      ${canSave ? `
        <button class="save-item-button ${mySave ? "saved" : ""}" type="button">
          ${mySave ? "★ Saved" : "☆ Save"}
        </button>
      ` : needsChar ? `
        <span class="no-char-hint">Select a character to save items</span>
      ` : ""}
    </div>

    ${showSaveInfo && itemSaves.length > 0 ? `
      <div class="${manager ? "wish-admin-block" : "wish-count-block"}">
        ${manager ? `★ Saved by: ${saveNames}` : `★ Saved by your character`}
      </div>
    ` : ""}

    <div class="card-header">
      ${isEditing
        ? `<input class="edit-name" id="edit-name-${item.id}" value="${escapeHtml(item.name || "")}">`
        : `<h2 class="item-name">${item.name}</h2>`
      }

      ${isEditing ? `
        <select id="edit-category-${item.id}">
          ${CATEGORIES.map(c => `<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>

        <label>
          <input type="checkbox" id="edit-attunement-${item.id}" ${item.attunement?"checked":""}>
          Requires Attunement
        </label>

        <div class="class-selector">
          ${ALL_CLASSES.map(cls => `
            <label class="class-option">
              <input type="checkbox" class="class-checkbox-${item.id}" value="${cls}"
                ${(item.classes||[]).includes(cls)?"checked":""}> ${cls}
            </label>`).join("")}
        </div>
      ` : `
        <p class="item-type">${item.category||""}${item.attunement?" · Requires Attunement":""}</p>
      `}

      <div class="card-meta">
        ${(item.classes||[]).map(c=>`<span class="meta-tag">${c}</span>`).join("")}
      </div>

      <div class="card-meta">
        ${isEditing ? `
          <select id="edit-rarity-${item.id}">
            ${RARITIES.map(r=>`<option ${item.rarity===r?"selected":""}>${r}</option>`).join("")}
          </select>
          <input id="edit-source-${item.id}"   value="${escapeHtml(item.source || "")}" placeholder="Source">
          <input id="edit-campaign-${item.id}" value="${escapeHtml(item.campaign || "")}" placeholder="Campaign / Book">
        ` : `
          ${item.rarity    ? `<span class="meta-tag ${rarityClass}">${item.rarity}</span>` : ""}
          ${item.source    ? `<span class="meta-tag">${item.source}</span>` : ""}
          ${item.campaign  ? `<span class="meta-tag campaign-tag">${item.campaign}</span>` : ""}
        `}
      </div>
    </div>

    ${isEditing ? `
      <div class="card-image-edit">
        ${itemImageMarkup(item, "card-art card-art--edit")}
        <label class="upload-image-btn--overlay" title="Upload or replace image">
          📷 ${item.imageUrl ? "Replace Image" : "Upload Image"}
          <input type="file" class="image-file-input" accept="image/*" style="display:none">
        </label>
        <span class="upload-progress" style="display:none">Uploading…</span>
      </div>
    ` : itemImageMarkup(item, "card-art")}

    <div class="card-body">
      ${isEditing
        ? `<textarea class="edit-description" id="edit-description-${item.id}"
             placeholder="Description">${item.description||""}</textarea>`
        : `<div class="item-description">${item.description||""}</div>`
      }

      ${isEditing
        ? `<textarea id="edit-properties-${item.id}"
             placeholder='[{"title":"Name","text":"Description"}]'>${JSON.stringify(item.properties||[],null,2)}</textarea>`
        : (item.properties||[]).map(p=>`
            <div class="property-block">
              <span class="property-title">${p.title}:</span> ${p.text}
            </div>`).join("")
      }

      ${isEditing
        ? `<textarea id="edit-quote-${item.id}" placeholder="Quote">${item.quote||""}</textarea>`
        : item.quote ? `<i>${item.quote}</i>` : ""
      }
    </div>

    ${state.looted && manager ? `
      <div class="owner-block">
        <label class="owner-label">Assign to character:</label>
        <select class="owner-select">
          <option value="">No Owner</option>
          ${context.playableChars.map(c => `
            <option value="${c.id}" ${state.owner===c.id?"selected":""}>
              ${characterDisplayName(c, context.usersById)}
            </option>
          `).join("")}
        </select>
      </div>
    ` : ownerName ? `<div class="owner-badge">⚔ ${ownerName}</div>` : ""}

    <div class="card-footer">D&D 5e Item Vault</div>
  `;

  attachCardEvents(card, item);
  return card;
}


// ─── CARD EVENTS ──────────────────────────────────────────────────────────────

function attachCardEvents(card, item) {

  card.querySelector(".edit-button")?.addEventListener("click", () => {
    editingItems.add(item.id);
    rerenderCard(item.id);
  });

  card.querySelector(".cancel-button")?.addEventListener("click", () => {
    editingItems.delete(item.id);
    rerenderCard(item.id);
  });

  // Master catalogue editing remains admin-only because the buttons are admin-only.
  card.querySelector(".save-edit-button")?.addEventListener("click", async () => {
    let properties = [];

    try {
      properties = JSON.parse(
        document.getElementById(`edit-properties-${item.id}`).value || "[]"
      );
    } catch {
      alert("Properties JSON is invalid.");
      return;
    }

    const changes = {
      name:        document.getElementById(`edit-name-${item.id}`).value,
      description: document.getElementById(`edit-description-${item.id}`).value,
      category:    document.getElementById(`edit-category-${item.id}`).value,
      rarity:      document.getElementById(`edit-rarity-${item.id}`).value,
      source:      document.getElementById(`edit-source-${item.id}`).value,
      campaign:    document.getElementById(`edit-campaign-${item.id}`).value,
      quote:       document.getElementById(`edit-quote-${item.id}`).value,
      attunement:  document.getElementById(`edit-attunement-${item.id}`).checked,
      classes:     [...document.querySelectorAll(`.class-checkbox-${item.id}:checked`)]
        .map(b => b.value),
      properties
    };

    await updateDoc(doc(db, "items", item.id), changes);

    editingItems.delete(item.id);
    patchItem(item.id, changes);
    await markCatalogChanged();
    rerenderCard(item.id);
    populateSourceFilter();
    populateCampaignFilter();
  });

  card.querySelector(".delete-item-button")?.addEventListener("click", async () => {
    if (!confirm(`Permanently delete "${item.name}" from the master catalogue? This cannot be undone.`)) return;

    if (activeCampaign) {
      const itemSaves = saves.filter(s => s.itemId === item.id);

      await Promise.all(itemSaves.map(s =>
        deleteDoc(doc(db, "campaigns", activeCampaign.id, "saves", s.id))
      ));

      saves = saves.filter(s => s.itemId !== item.id);

      await deleteDoc(
        doc(db, "campaigns", activeCampaign.id, "itemState", item.id)
      ).catch(() => {});

      delete itemState[item.id];
    }

    await deleteDoc(doc(db, "items", item.id));

    items = items.filter(i => i.id !== item.id);
    editingItems.delete(item.id);
    await markCatalogChanged();

    container.querySelector(`[data-item-id="${item.id}"]`)?.remove();

    refreshStatsBar();
    populateSourceFilter();
    populateCampaignFilter();
  });

  // Loot/highlight/owner are campaign state — never mutate the global master item.
  card.querySelector(".loot-button")?.addEventListener("click", async () => {
    if (!activeCampaign || !canManageCampaign()) return;

    const state = getItemState(item.id);
    const newLooted = !state.looted;

    await persistItemState(item.id, {
      looted: newLooted,
      owner: newLooted ? state.owner : null,
      receivedDate: newLooted ? (state.receivedDate || Date.now()) : null
    });

    rerenderCard(item.id);
    renderMyLoot();
  });

  card.querySelector(".highlight-button")?.addEventListener("click", async () => {
    if (!activeCampaign || !canManageCampaign()) return;

    const state = getItemState(item.id);

    await persistItemState(item.id, {
      highlighted: !state.highlighted
    });

    rerenderCard(item.id);
  });

  card.querySelector(".clone-button")?.addEventListener("click", async () => {
    const cloneId = `${item.id}-copy-${Date.now()}`;
    const {
      id: _id,
      imageUrl: _imageUrl,
      looted: _legacyLooted,
      highlighted: _legacyHighlighted,
      owner: _legacyOwner,
      receivedDate: _legacyReceivedDate,
      ...masterFields
    } = item;

    await setDoc(doc(db, "items", cloneId), {
      ...masterFields,
      name: `${item.name} (Homebrew)`,
      source: "Homebrew"
    });

    // Add the clone locally before bumping itemCount/version, then force one
    // fresh catalogue read so the exact saved Firestore data is authoritative.
    items.push({ id: cloneId, ...masterFields, name: `${item.name} (Homebrew)`, source: "Homebrew" });
    await markCatalogChanged();
    await loadItemsFromFirestore({ forceRefresh: true });
    editingItems.add(cloneId);
    renderCards();
  });

  card.querySelector(".owner-select")?.addEventListener("change", async e => {
    if (!activeCampaign || !canManageCampaign()) return;

    const ownerId = e.target.value || null;
    await persistItemState(item.id, { owner: ownerId });

    rerenderCard(item.id);
    renderMyLoot();
  });

  card.querySelector(".image-file-input")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be smaller than 4 MB.");
      return;
    }

    const progressEl = card.querySelector(".upload-progress");
    const labelEl    = card.querySelector(".upload-image-btn--overlay");

    if (progressEl) progressEl.style.display = "inline";
    if (labelEl)    labelEl.style.opacity = "0.4";

    const url = await uploadItemImage(item.id, file);

    if (url) {
      patchItem(item.id, { imageUrl: url });
      editingItems.add(item.id);
      rerenderCard(item.id);
    } else {
      alert("Upload failed. Check the browser console.");
      if (progressEl) progressEl.style.display = "none";
      if (labelEl)    labelEl.style.opacity = "1";
    }
  });

  card.querySelector(".visibility-toggle-btn")?.addEventListener("click", async () => {
    await toggleItemVisibility(item.id);
  });

  card.querySelector(".save-item-button")?.addEventListener("click", async () => {
    if (!selectedCharacter) {
      alert("Select a character in the My Character tab first.");
      return;
    }
    if (!activeCampaign) {
      alert("No active campaign.");
      return;
    }

    const existing = saves.find(
      s => s.itemId === item.id && s.characterId === selectedCharacter.id
    );

    if (existing) {
      await deleteDoc(
        doc(db, "campaigns", activeCampaign.id, "saves", existing.id)
      );

      saves = saves.filter(s => s.id !== existing.id);

    } else {
      // Deterministic id prevents duplicate saves for the same character/item pair.
      const saveId = `${selectedCharacter.id}__${item.id}`;
      const data = {
        itemId: item.id,
        characterId: selectedCharacter.id,
        userId: auth.currentUser.uid,
        created: Date.now()
      };

      await setDoc(
        doc(db, "campaigns", activeCampaign.id, "saves", saveId),
        data
      );

      saves.push({ id: saveId, ...data });
    }

    rerenderCard(item.id);

    const playerPanel = document.getElementById("tab-player");
    if (playerPanel?.style.display !== "none") renderMyWishes();
  });
}


// ─── ADD ITEM MODAL (uses your property editor UI) ────────────────────────────

function buildModalClassCheckboxes(selected = []) {
  const wrap = document.getElementById("modal-classes");
  if (!wrap) return;
  wrap.innerHTML = ALL_CLASSES.map(c => `
    <label class="class-option">
      <input type="checkbox" value="${c}" ${selected.includes(c)?"checked":""}> ${c}
    </label>`).join("");
}

function openItemModal(item = null) {
  document.getElementById("itemModalTitle").textContent = item ? "Edit Item" : "Add Item";
  document.getElementById("modal-name").value         = item?.name        || "";
  document.getElementById("modal-category").value     = item?.category    || "Wondrous Item";
  document.getElementById("modal-rarity").value       = item?.rarity      || "Common";
  document.getElementById("modal-source").value       = item?.source      || "";
  document.getElementById("modal-campaign").value     = item?.campaign    || "";
  document.getElementById("modal-description").value  = item?.description || "";
  document.getElementById("modal-quote").value        = item?.quote       || "";
  document.getElementById("modal-attunement").checked = item?.attunement  || false;
  renderPropertyEditor(item?.properties || []);
  buildModalClassCheckboxes(item?.classes || []);
  document.getElementById("itemModal").dataset.editId = item?.id || "";
  document.getElementById("itemModal").style.display  = "flex";
}

function closeItemModal() { document.getElementById("itemModal").style.display = "none"; }

async function saveItemModal() {
  const editId     = document.getElementById("itemModal").dataset.editId;
  const name       = document.getElementById("modal-name").value.trim();
  if (!name) { alert("Name is required."); return; }
  const properties = getPropertiesFromEditor();
  const classes    = [...document.querySelectorAll("#modal-classes input:checked")].map(i=>i.value);
  const data = {
    name,
    category:    document.getElementById("modal-category").value,
    rarity:      document.getElementById("modal-rarity").value,
    source:      document.getElementById("modal-source").value,
    campaign:    document.getElementById("modal-campaign").value,
    description: document.getElementById("modal-description").value,
    quote:       document.getElementById("modal-quote").value,
    attunement:  document.getElementById("modal-attunement").checked,
    classes, properties
  };
  if (!editId) {
    const autoId = name.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-");
    await setDoc(
      doc(db, "items", autoId),
      data,
      { merge: true }
    );
    items.push({ id: autoId, ...data });
    await markCatalogChanged();
    closeItemModal();
    await loadItemsFromFirestore({ forceRefresh: true });
  } else {
    await updateDoc(doc(db,"items",editId), data);
    closeItemModal();
    patchItem(editId, data);
    await markCatalogChanged();
    rerenderCard(editId);
    populateSourceFilter();
    populateCampaignFilter();
  }
}

