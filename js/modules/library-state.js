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
function getItemState(itemId,renderState=null) {
  const item=(renderState?renderState.items.get(itemId):items.find(i=>i.id===itemId))||{};
  const entries=renderState?(renderState.inventory.get(itemId)||[]):inventory.filter(e=>e.itemId===itemId&&e.quantity>0);
  return {visible:!!item.visible,highlighted:!!item.highlighted,looted:entries.length>0,
    owner:entries.length===1?entries[0].characterId:null,receivedDate:entries[0]?.receivedAt||null};
}
/** Short-lived indexes for one synchronous render; never reused after item/account changes. */
function libraryRenderState() {
  const entries=new Map();
  for(const entry of inventory){if(!(entry.quantity>0))continue;let owned=entries.get(entry.itemId);if(!owned)entries.set(entry.itemId,owned=[]);owned.push(entry);}
  return {items:new Map(items.map(item=>[item.id,item])),inventory:entries,savedForCharacter:new Set(saves.filter(save=>save.characterId===selectedCharacter?.id).map(save=>save.itemId))};
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

const LIBRARY_PAGE_SIZE=48;
let libraryPage={signature:null,index:0};
function hideLibraryPages(){
  for(const host of document.querySelectorAll('[data-library-pagination]')){host.hidden=true;host.replaceChildren();}
}
/** Page after permission checks and filtering; statistics still use every match. */
function libraryPageSlice(filtered){
  const signature=JSON.stringify([auth.currentUser?.uid,activeCampaign?.id,campaignLoadGeneration,canManageCampaign(),selectedCharacter?.id,...Object.keys(libraryFilters).map(id=>{const input=document.getElementById(id);return input?.type==='checkbox'?input.checked:input?.value||'';})]);
  if(signature!==libraryPage.signature)libraryPage={signature,index:0};
  libraryPage.index=Math.max(0,Math.min(libraryPage.index,Math.ceil(filtered.length/LIBRARY_PAGE_SIZE)-1));
  const start=libraryPage.index*LIBRARY_PAGE_SIZE,end=Math.min(start+LIBRARY_PAGE_SIZE,filtered.length);
  const hosts=[...document.querySelectorAll('[data-library-pagination]')];
  hosts.forEach((host,i)=>{
    host.hidden=filtered.length<=LIBRARY_PAGE_SIZE;
    if(host.hidden){host.replaceChildren();return;}
    host.innerHTML=`<div class="library-page-summary" tabindex="-1" ${i===0?'role="status" aria-live="polite"':''}><strong>Items ${start+1}–${end} of ${filtered.length}</strong><span>Page ${libraryPage.index+1} of ${Math.ceil(filtered.length/LIBRARY_PAGE_SIZE)}</span></div><div class="library-page-actions"><button type="button" data-library-page="-1" ${start===0?'disabled':''}>← Previous page</button><button type="button" data-library-page="1" ${end===filtered.length?'disabled':''}>${end===filtered.length?'Next page':`Next ${Math.min(LIBRARY_PAGE_SIZE,filtered.length-end)} items`} →</button></div>`;
    host.querySelectorAll('[data-library-page]').forEach(button=>button.onclick=()=>{
      if(button.disabled)return;
      libraryPage.index+=Number(button.dataset.libraryPage);renderCards();
      const first=hosts[0],summary=first.querySelector('.library-page-summary');
      summary?.focus({preventScroll:true});
      window.scrollTo(0,Math.max(0,window.scrollY+first.getBoundingClientRect().top-(document.querySelector('.site-header')?.getBoundingClientRect().height||0)-16));
    });
  });
  return filtered.slice(start,end);
}

let magicItemLoadRequest=null;
function renderMagicItemLoadPrompt(problem='') {
  if (!container || magicItemLibraryLoaded) return;
  libraryPage={signature:null,index:0};hideLibraryPages();
  document.getElementById('campaignStats').textContent='';
  if(!problem&&magicItemLoadRequest?.uid===auth.currentUser?.uid&&magicItemLoadRequest?.campaignId===activeCampaign?.id)problem=magicItemLoadRequest.problem||'';
  container.innerHTML = `<section class="library-load-gate" aria-labelledby="libraryLoadTitle">
    <div class="library-load-gate-icon" aria-hidden="true">✦</div>
    <h3 id="libraryLoadTitle">Browse campaign items</h3>
    <p>Load the items available in ${escapeHtml(activeCampaign?.name||'this campaign')}. Your DM decides which items are shared.</p>
    <p role="status" class="library-load-message">${escapeHtml(problem|| (magicItemLibraryLoading?'Loading campaign items…':''))}</p>
    <button type="button" id="loadMagicItemLibrary" class="btn-primary" ${magicItemLibraryLoading ? "disabled" : ""}>${magicItemLibraryLoading ? "Loading campaign items…" : problem?'Retry loading items':'Load campaign items'}</button>
  </section>`;
  container.querySelector("#loadMagicItemLibrary")?.addEventListener("click", loadMagicItemLibrary);
}

/** A completion can update only the account/campaign/request that started it. */
async function loadMagicItemLibrary() {
  if (!activeCampaign || !auth.currentUser || magicItemLibraryLoading) return;
  const request={campaignId:activeCampaign.id,uid:auth.currentUser.uid};magicItemLoadRequest=request;
  const current=()=>magicItemLoadRequest===request&&activeCampaign?.id===request.campaignId&&auth.currentUser?.uid===request.uid;
  magicItemLibraryLoading = true;renderMagicItemLoadPrompt();let problem='';
  try {
    await Promise.all([loadItemsFromFirestore(), loadCampaignItems()]);
    if (!current()) return;
    if (canManageCampaign()) await loadCampaignSupply();
    if (!current()) return;
    magicItemLibraryLoaded = true;populateSourceFilter();renderCards();
  } catch (error) {
    if(current()){magicItemLibraryLoaded=false;problem='Could not load campaign items: '+error.message;request.problem=problem;}
  } finally {
    if(current()){magicItemLibraryLoading=false;if(!magicItemLibraryLoaded)renderMagicItemLoadPrompt(problem);}
  }
}

const libraryFilters={search:'Search',categoryFilter:'Category',rarityFilter:'Rarity',sourceFilter:'Source',classFilter:'Class',ownerFilter:'Owner',showLootedOnly:'Looted',showUnlootedOnly:'Unlooted',showSavedOnly:'Saved',showAttunementOnly:'Requires attunement',showNoAttunementOnly:'No attunement',showHighlightedOnly:'Highlighted',showNotHighlightedOnly:'Not highlighted'};
function clearLibraryFilters(){
  libraryPage.index=0;
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

  const renderState=libraryRenderState(),permitted=visibleItems(renderState),filtered = applyFilters(permitted,renderState);
  const fragment = document.createDocumentFragment();

  for (const item of libraryPageSlice(filtered)) {
    fragment.appendChild(createCard(item,{renderState}));
  }

  container.replaceChildren(fragment);
  if(!filtered.length){
    const hasItems=permitted.length>0;
    container.innerHTML=`<section class="library-empty"><h3>${hasItems?'No matching items':'No items to browse yet'}</h3><p>${hasItems?'Try fewer filters or a different search.':canManageCampaign()?'Add catalogue items or create your own campaign items from DM tools.':'Your DM can share campaign items here. Your existing loot and saved items are available in My Character.'}</p>${hasItems?'<button type="button" data-clear-library-filters>Clear search &amp; filters</button>':canManageCampaign()?'<button type="button" data-open-library-dm>Open DM tools</button>':''}</section>`;
    container.querySelector('[data-clear-library-filters]')?.addEventListener('click',clearLibraryFilters);
    container.querySelector('[data-open-library-dm]')?.addEventListener('click',()=>{if(!canManageCampaign())return;const panel=document.getElementById('libraryDMTools');panel.open=true;document.getElementById('addFromRoot')?.focus();});
  }
  updateStatsFromFiltered(filtered,permitted.length,renderState);
  observePendingImages(container);
  if(typeof CharacterWorkspace!=='undefined')CharacterWorkspace.refresh(false);
}

/**
 * Campaign managers see the full catalogue.
 * Players see only items visible under the active campaign's policy/state.
 */
function visibleItems(renderState=null) {
  const catalogue=items.filter(item=>typeof CampaignRules==='undefined'||CampaignRules.allowed(item));
  if (!activeCampaign || canManageCampaign()) return catalogue;
  return catalogue.filter(item => getItemState(item.id,renderState).visible);
}

function updateStatsFromFiltered(filtered,total,renderState=null) {
  let looted = 0;
  let highlighted = 0;

  for (const item of filtered) {
    const state = getItemState(item.id,renderState);
    if (state.looted) looted++;
    if (state.highlighted) highlighted++;
  }

  updateStats(filtered.length, looted, highlighted, saves.length,total);
}

function applyFilters(list,renderState=null) {
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
    if (!catalogueItemMatches(item,{search,rarity,source,category,class:cls,multiTerm:true})) return false;
    const state = getItemState(item.id,renderState);
    if (owner && !(renderState?(renderState.inventory.get(item.id)||[]):inventory).some(e=>e.itemId===item.id && e.characterId===owner && e.quantity>0)) return false;

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


