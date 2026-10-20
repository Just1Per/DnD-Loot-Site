"use strict";

// Derives Library cards from permitted campaign items and private inventory/saved records.

// ─── LOCAL STATE PATCH ────────────────────────────────────────────────────────

function patchItem(itemId, changes) {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes };
  return items[idx];
}

/** Legacy card-state shape, derived from current ownership rather than a single stored owner. */
function getItemState(itemId) {
  const item=items.find(i=>i.id===itemId)||{};
  const entries=inventory.filter(e=>e.itemId===itemId&&e.quantity>0);
  return {visible:!!item.visible,highlighted:!!item.highlighted,looted:entries.length>0,
    owner:entries.length===1?entries[0].characterId:null,receivedDate:entries[0]?.receivedAt||null};
}
/** Only visibility/highlighting can be patched here; quantities use inventory transactions. */
async function persistItemState(itemId,changes) {
  if(!canManageCampaign())throw Error('Campaign DM access is required.');
  const safe={};for(const k of ['visible','highlighted'])if(k in changes)safe[k]=!!changes[k];
  if(Object.keys(safe).length!==Object.keys(changes).length)throw Error('Inventory changes must use the inventory controls.');
  const id=activeCampaign.id;
  await updateDoc(doc(db,'campaigns',id,'items',itemId),safe);
  if(activeCampaign?.id===id)patchItem(itemId,safe);
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────

const container = document.getElementById("card-container");

function renderMagicItemLoadPrompt() {
  if (!container || magicItemLibraryLoaded) return;
  container.innerHTML = `<div class="library-load-gate" role="status">
    <div class="library-load-gate-icon" aria-hidden="true">✦</div>
    <h2>Magical Item Library</h2>
    <p>Items are loaded only when you want to browse them, keeping campaign startup faster.</p>
    <button type="button" id="loadMagicItemLibrary" class="btn-primary" ${magicItemLibraryLoading ? "disabled" : ""}>${magicItemLibraryLoading ? "Loading magical items…" : "Load magical items"}</button>
  </div>`;
  container.querySelector("#loadMagicItemLibrary")?.addEventListener("click", loadMagicItemLibrary);
}

/** Load on request and ignore a result if the player changes campaigns before it arrives. */
async function loadMagicItemLibrary() {
  if (!activeCampaign || magicItemLibraryLoading) return;
  const campaignId = activeCampaign.id;
  magicItemLibraryLoading = true;
  renderMagicItemLoadPrompt();
  try {
    await Promise.all([loadItemsFromFirestore(), loadCampaignItems()]);
    if (activeCampaign?.id !== campaignId) return;
    if (canManageCampaign()) await loadCampaignSupply();
    magicItemLibraryLoaded = true;
    populateSourceFilter();
    renderCards();
  } catch (error) {
    console.error("Magical item library load failed:", error);
    if (activeCampaign?.id === campaignId) {
      magicItemLibraryLoaded = false;
      renderMagicItemLoadPrompt();
      alert(`Could not load magical items: ${error.message}`);
    }
  } finally {
    magicItemLibraryLoading = false;
    if (!magicItemLibraryLoaded && activeCampaign?.id === campaignId) renderMagicItemLoadPrompt();
  }
}

const libraryFilters={search:'Search',categoryFilter:'Category',rarityFilter:'Rarity',sourceFilter:'Source',classFilter:'Class',ownerFilter:'Owner',showLootedOnly:'Looted',showUnlootedOnly:'Unlooted',showSavedOnly:'Saved',showAttunementOnly:'Requires attunement',showNoAttunementOnly:'No attunement',showHighlightedOnly:'Highlighted',showNotHighlightedOnly:'Not highlighted'};
function clearLibraryFilters(){
  for(const id of Object.keys(libraryFilters)){const input=document.getElementById(id);if(input){if(input.type==='checkbox')input.checked=false;else input.value='';}}
  renderCards();document.getElementById('search')?.focus({preventScroll:true});
}
function syncLibraryFilters(){
  const active=Object.entries(libraryFilters).flatMap(([id,label])=>{const input=document.getElementById(id);if(!input||(input.type==='checkbox'?!input.checked:!input.value.trim()))return [];return[{id,text:label+(input.type==='checkbox'?'':': '+(input.selectedOptions?.[0]?.textContent||input.value))}];});
  const host=document.getElementById('libraryActiveFilters'),clear=document.getElementById('clearLibraryFilters'),summary=document.getElementById('libraryFilterSummary');
  if(summary)summary.textContent='Filters'+(active.length?' · '+active.length+' active':'');
  if(clear){clear.hidden=!active.length;clear.onclick=clearLibraryFilters;}
  if(!host)return;host.hidden=!active.length;host.replaceChildren();
  for(const filter of active){const button=document.createElement('button');button.type='button';button.dataset.removeLibraryFilter=filter.id;button.textContent=filter.text+' ×';button.setAttribute('aria-label','Remove '+filter.text);button.onclick=()=>{const input=document.getElementById(filter.id);if(input.type==='checkbox')input.checked=false;else input.value='';renderCards();document.getElementById('search')?.focus({preventScroll:true});};host.append(button);}
}

function renderCards() {
  if (!container) return;
  syncLibraryFilters();
  if (!magicItemLibraryLoaded) { renderMagicItemLoadPrompt(); return; }

  const permitted=visibleItems(),filtered = applyFilters(permitted);
  const fragment = document.createDocumentFragment();

  for (const item of filtered) {
    fragment.appendChild(createCard(item));
  }

  container.replaceChildren(fragment);
  if(!filtered.length){
    const hasItems=permitted.length>0;
    container.innerHTML=`<section class="library-empty"><h3>${hasItems?'No matching items':'No items to browse yet'}</h3><p>${hasItems?'Try fewer filters or a different search.':canManageCampaign()?'Add catalogue items or create your own campaign items from DM tools.':'Your DM can share campaign items here. Your existing loot and saved items are available in My Character.'}</p>${hasItems?'<button type="button" data-clear-library-filters>Clear search &amp; filters</button>':canManageCampaign()?'<button type="button" data-open-library-dm>Open DM tools</button>':''}</section>`;
    container.querySelector('[data-clear-library-filters]')?.addEventListener('click',clearLibraryFilters);
    container.querySelector('[data-open-library-dm]')?.addEventListener('click',()=>{if(!canManageCampaign())return;const panel=document.getElementById('libraryDMTools');panel.open=true;document.getElementById('addFromRoot')?.focus();});
  }
  updateStatsFromFiltered(filtered,permitted.length);
  observePendingImages(container);
  if(typeof CharacterWorkspace!=='undefined')CharacterWorkspace.refresh(false);
}

/**
 * Campaign managers see the full catalogue.
 * Players see only items visible under the active campaign's policy/state.
 */
function visibleItems() {
  const catalogue=items.filter(item=>typeof CampaignRules==='undefined'||CampaignRules.allowed(item));
  if (!activeCampaign || canManageCampaign()) return catalogue;
  return catalogue.filter(item => getItemState(item.id).visible);
}

function updateStatsFromFiltered(filtered,total) {
  let looted = 0;
  let highlighted = 0;

  for (const item of filtered) {
    const state = getItemState(item.id);
    if (state.looted) looted++;
    if (state.highlighted) highlighted++;
  }

  updateStats(filtered.length, looted, highlighted, saves.length,total);
}

function applyFilters(list) {
  const val = id => document.getElementById(id)?.value || "";
  const chk = id => document.getElementById(id)?.checked ?? false;

  const search   = val("search").toLowerCase().trim();
  const rarity   = val("rarityFilter");
  const source   = val("sourceFilter");
  const cls      = val("classFilter");
  const category = val("categoryFilter");
  const owner    = val("ownerFilter");

  const savedItemIds = chk("showSavedOnly")
    ? new Set(saves.map(s => s.itemId))
    : null;

  return list.filter(item => {
    const state = getItemState(item.id);

    if (!catalogueItemMatches(item,{search,rarity,source,category,class:cls,multiTerm:true})) return false;
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


