"use strict";

// LIBRARY STATE / FILTERING / RENDER PIPELINE
// Extracted from the working Step 7 app with behavior preserved.

// ─── LOCAL STATE PATCH ────────────────────────────────────────────────────────

function patchItem(itemId, changes) {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes };
  return items[idx];
}

function getItemState(itemId) {
  const raw = itemState[itemId] || {};
  const defaultVisible = activeCampaign?.defaultItemVisible !== false;

  return {
    visible: raw.visible ?? defaultVisible,
    looted: raw.looted ?? false,
    highlighted: raw.highlighted ?? false,
    owner: raw.owner ?? null,
    receivedDate: raw.receivedDate ?? null,
    ...raw
  };
}

function patchItemState(itemId, changes) {
  itemState[itemId] = {
    ...(itemState[itemId] || {}),
    ...changes
  };
  return getItemState(itemId);
}

async function persistItemState(itemId, changes) {
  if (!activeCampaign) return null;

  const campaignId = activeCampaign.id;

  await setDoc(
    doc(db, "campaigns", campaignId, "itemState", itemId),
    changes,
    { merge: true }
  );

  if (activeCampaign?.id !== campaignId) return null;
  return patchItemState(itemId, changes);
}


// ─── SINGLE-CARD RE-RENDER ────────────────────────────────────────────────────

function buildRenderContext() {
  const charactersById = new Map(characters.map(c => [c.id, c]));
  const usersById      = new Map(users.map(u => [u.id, u]));
  const savesByItem    = new Map();

  for (const save of saves) {
    if (!savesByItem.has(save.itemId)) savesByItem.set(save.itemId, []);
    savesByItem.get(save.itemId).push(save);
  }

  return {
    charactersById,
    usersById,
    savesByItem,
    playableChars: allPlayableCharacters()
  };
}

function rerenderCard(itemId) {
  const item = items.find(i => i.id === itemId);
  const oldCard = [...container.querySelectorAll("[data-item-id]")].find(c => c.dataset.itemId === itemId);
  if (item && oldCard) {
    const card = createCard(item, buildRenderContext());
    oldCard.replaceWith(card);
    observePendingImages(card);
  }
  refreshCharacterLoot(itemId);
  renderDMCharacters();
  renderDMOverview();
  refreshStatsBar();
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────

const container = document.getElementById("card-container");

function renderCards() {
  if (!container) return;

  const filtered = applyFilters(visibleItems());
  const context  = buildRenderContext();
  const fragment = document.createDocumentFragment();

  for (const item of filtered) {
    fragment.appendChild(createCard(item, context));
  }

  container.replaceChildren(fragment);
  updateStatsFromFiltered(filtered);
  observePendingImages(container);
  refreshCharacterLoot();
}

/**
 * Campaign managers see the full catalogue.
 * Players see only items visible under the active campaign's policy/state.
 */
function visibleItems() {
  if (!activeCampaign || canManageCampaign()) return items;
  return items.filter(item => getItemState(item.id).visible);
}

function updateStatsFromFiltered(filtered) {
  let looted = 0;
  let highlighted = 0;

  for (const item of filtered) {
    const state = getItemState(item.id);
    if (state.looted) looted++;
    if (state.highlighted) highlighted++;
  }

  updateStats(filtered.length, looted, highlighted, saves.length);
}

function refreshStatsBar() {
  updateStatsFromFiltered(applyFilters(visibleItems()));
}

function applyFilters(list) {
  const val = id => document.getElementById(id)?.value || "";
  const chk = id => document.getElementById(id)?.checked ?? false;

  const search   = val("search").toLowerCase().trim();
  const rarity   = val("rarityFilter");
  const source   = val("sourceFilter");
  const campaign = val("campaignFilter");
  const cls      = val("classFilter");
  const category = val("categoryFilter");
  const owner    = val("ownerFilter");

  const savedItemIds = chk("showSavedOnly")
    ? new Set(saves.map(s => s.itemId))
    : null;

  return list.filter(item => {
    const state = getItemState(item.id);

    if (search && !(
      (item.name || "").toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search)
    )) return false;

    if (rarity   && item.rarity   !== rarity)   return false;
    if (source   && item.source   !== source)   return false;
    if (campaign && item.campaign !== campaign) return false;
    if (category && item.category !== category) return false;
    if (cls      && !item.classes?.includes(cls)) return false;
    if (owner    && state.owner !== owner) return false;

    if (chk("showLootedOnly")         && !state.looted)      return false;
    if (chk("showUnlootedOnly")       &&  state.looted)      return false;
    if (savedItemIds                  && !savedItemIds.has(item.id)) return false;
    if (chk("showAttunementOnly")     && !item.attunement)   return false;
    if (chk("showNoAttunementOnly")   &&  item.attunement)   return false;
    if (chk("showHighlightedOnly")    && !state.highlighted) return false;
    if (chk("showNotHighlightedOnly") &&  state.highlighted) return false;

    return true;
  });
}


