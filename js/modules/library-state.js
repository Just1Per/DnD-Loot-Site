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
  const item=items.find(i=>i.id===itemId)||{};
  const entries=inventory.filter(e=>e.itemId===itemId&&e.quantity>0);
  return {visible:!!item.visible,highlighted:!!item.highlighted,looted:entries.length>0,
    owner:entries.length===1?entries[0].characterId:null,receivedDate:entries[0]?.receivedAt||null};
}
function patchItemState(itemId,changes) { return patchItem(itemId,changes); }
async function persistItemState(itemId,changes) {
  if(!canManageCampaign())throw Error('Campaign DM access is required.');
  const safe={};for(const k of ['visible','highlighted'])if(k in changes)safe[k]=!!changes[k];
  if(Object.keys(safe).length!==Object.keys(changes).length)throw Error('Inventory changes must use the inventory controls.');
  const id=activeCampaign.id;
  await updateDoc(doc(db,'campaigns',id,'items',itemId),safe);
  if(activeCampaign?.id===id)patchItem(itemId,safe);
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
    if (owner && !inventory.some(e=>e.itemId===item.id && e.characterId===owner && e.quantity>0)) return false;

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


