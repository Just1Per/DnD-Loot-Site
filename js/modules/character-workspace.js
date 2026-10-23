'use strict';
// The character being viewed is separate from the campaign's active save/loot target.
var CharacterWorkspace = (() => {
  const routes = new Set(['player', 'character-sheet', 'character-loot', 'character-wishlist']);
  let scope = '', generation = 0, scopeGeneration = 0, current = null, observer = null;
  const permitted = character => !!character && !!activeCampaign && !!auth.currentUser &&
    (canManageCampaign() || (canUseCharacters() && character.userId === auth.currentUser.uid));
  const choices = () => characters.filter(permitted);
  const scopeKey = () => [auth.currentUser?.uid || '', activeCampaign?.id || '', activeMembershipRole || ''].join(':');
  const currentCharacter = () => characters.find(character => character.id === current?.characterId && permitted(character));

  function clear() {
    ++generation;
    ++scopeGeneration;
    current = null;
    scope = scopeKey();
    const header = document.getElementById('characterWorkspaceHeader');
    if (header) { header.hidden = true; header.replaceChildren(); }
    for (const id of ['characterLootGrid', 'characterWishlistGrid']) document.getElementById(id)?.replaceChildren();
    document.getElementById('characterSheetChooser')?.classList.remove('character-workspace-legacy-chooser');
  }
  function checkScope() {
    if (scope !== scopeKey()) clear();
    if (current && !currentCharacter()) current = null;
  }
  function fallback() {
    return currentCharacter() ||
      characters.find(character => character.id === selectedCharacter?.id && character.userId === auth.currentUser?.uid && permitted(character)) ||
      choices().find(character => character.userId === auth.currentUser?.uid && character.active !== false) ||
      choices().find(character => character.userId === auth.currentUser?.uid) || null;
  }
  function ensure() {
    checkScope();
    const main = document.getElementById('mainApp');
    const group = document.querySelector('[data-section-group="character"]');
    if (!main || !group) return;
    let header = document.getElementById('characterWorkspaceHeader');
    if (!header) {
      header = document.createElement('section');
      header.id = 'characterWorkspaceHeader';
      header.className = 'character-workspace-header';
      header.setAttribute('aria-label', 'Character workspace');
      header.hidden = true;
      main.insertBefore(header, document.getElementById('campaignSectionNavigation'));
    }
    const sheetButton = document.getElementById('characterSheetTab');
    if (sheetButton) sheetButton.textContent = 'Character Sheet';
    for (const [tab, label] of [['character-loot', 'Gear & Loot'], ['character-wishlist', 'Wishlist']]) {
      if (!group.querySelector('[data-tab="' + tab + '"]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tab';
        button.dataset.tab = tab;
        button.textContent = label;
        button.onclick = () => open(current?.characterId, tab);
        group.append(button);
      }
    }
    const manage = group.querySelector('[data-character-list]');
    if (manage) manage.hidden = true;
    for (const [tab, title, grid] of [['character-loot', 'Gear & Loot', 'characterLootGrid'], ['character-wishlist', 'Wishlist', 'characterWishlistGrid']]) {
      if (document.getElementById('tab-' + tab)) continue;
      const panel = document.createElement('section');
      panel.id = 'tab-' + tab;
      panel.className = 'tab-content character-workspace-panel';
      panel.style.display = 'none';
      panel.setAttribute('aria-label', title);
      panel.innerHTML = '<div class="character-workspace-panel-heading"><h2>' + title + '</h2><div data-character-panel-actions></div></div><p data-character-panel-description></p><div id="' + grid + '" class="character-loot-grid"></div>';
      main.append(panel);
    }
    document.getElementById('tab-player')?.classList.add('character-workspace-manage');
    const sheetPage = document.getElementById('characterSheetPage');
    if (!observer && sheetPage) {
      observer = new MutationObserver(() => {
        if (typeof AppShell !== 'undefined' && AppShell.route === 'character-sheet') update('character-sheet');
      });
      observer.observe(sheetPage, {childList: true, subtree: true});
    }
  }
  function renderHeader(tab) {
    const header = document.getElementById('characterWorkspaceHeader');
    if (!header) return;
    const adventure = tab === 'character-sheet' && sheetSession?.adventureId;
    header.hidden = !routes.has(tab) || !activeCampaign || !auth.currentUser || !canUseCharacters() || !!adventure;
    const chooser = document.getElementById('characterSheetChooser');
    chooser?.classList.toggle('character-workspace-legacy-chooser', !header.hidden);
    if (header.hidden) return;
    const character = currentCharacter(), mine = choices();
    if (!header.querySelector('select')) {
      header.innerHTML = '<div class="character-workspace-picker"><label for="characterWorkspacePicker">Viewing character</label><select id="characterWorkspacePicker"></select></div><div class="character-workspace-context"><strong></strong><p></p></div><button type="button" class="vault-secondary-btn" data-character-manage>Manage characters</button>';
      header.querySelector('[data-character-manage]').onclick = () => showTab('player');
      header.querySelector('select').onchange = event => {
        const id = event.target.value, destination = current?.section || 'character-sheet';
        if (id) open(id, destination === 'player' ? 'character-sheet' : destination);
        renderHeader(destination);
      };
    }
    const picker = header.querySelector('select');
    const options = '<option value="">Choose a character</option>' + mine.map(row => '<option value="' + escapeHtml(row.id) + '">' + escapeHtml(row.name || 'Unnamed character') + (row.active === false ? ' · Archived' : '') + '</option>').join('');
    if (picker.innerHTML !== options) picker.innerHTML = options;
    picker.value = character?.id || '';
    header.querySelector('strong').textContent = character?.name || 'Your characters';
    header.querySelector('p').textContent = selectedCharacter ? 'Library save and loot target: ' + (selectedCharacter.name || 'Unnamed character') + '.' : 'Choose an active character in Manage characters to save or loot Library items.';
  }
  function renderPanel(tab) {
    if (!['character-loot', 'character-wishlist'].includes(tab)) return;
    const panel = document.getElementById('tab-' + tab), character = currentCharacter();
    if (!panel) return;
    const actions = panel.querySelector('[data-character-panel-actions]');
    const description = panel.querySelector('[data-character-panel-description]');
    const grid = panel.querySelector('.character-loot-grid');
    actions.replaceChildren();
    grid.replaceChildren();
    if (!character) { description.textContent = 'Choose a character above, or create one in Manage characters.'; return; }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vault-secondary-btn';
    if (tab === 'character-loot') {
      description.textContent = 'Campaign items owned by ' + (character.name || 'this character') + '. Edit manual gear, worn equipment and attunement in the character sheet inventory.';
      button.textContent = 'Edit gear in character sheet';
      button.dataset.characterEquipment = '';
      button.onclick = () => open(character.id, 'inventory');
      const owned = inventory.filter(entry => entry.characterId === character.id && entry.quantity > 0 && (canManageCampaign() || entry.userId === auth.currentUser.uid));
      if (owned.length) grid.replaceChildren(...owned.map(entry => createCard(inventoryItem(entry), {inventoryEntry: entry})));
      else grid.innerHTML = '<p class="player-empty">No campaign loot owned by this character yet.</p>';
    } else {
      description.textContent = 'Items saved for ' + (character.name || 'this character') + '. Library save and loot actions use the active character shown above.';
      button.textContent = 'Browse the Library';
      button.onclick = () => showTab('library');
      const records=saves.filter(save=>save.characterId===character.id&&(canManageCampaign()||!save.userId||save.userId===auth.currentUser.uid));
      if(records.length)grid.replaceChildren(...records.map(savedItemCard));else grid.innerHTML='<p class="player-empty">No saved items for this character yet.</p>';
    }
    actions.append(button);
    observePendingImages(grid);
  }
  function update(tab) {
    ensure();
    if (routes.has(tab) && activeCampaign && auth.currentUser && canUseCharacters()) {
      let character = null;
      if (tab === 'character-sheet' && !sheetSession?.adventureId) {
        const sheetId = sheetSession?.campaignId === activeCampaign.id && sheetSession.uid === auth.currentUser.uid ? sheetSession.characterId : document.getElementById('sheetCharacterSelect')?.value;
        character = choices().find(row => row.id === sheetId);
      }
      character ||= fallback();
      current = {uid: auth.currentUser.uid, campaignId: activeCampaign.id, characterId: character?.id || null, section: tab};
    }
    renderHeader(tab);
    renderPanel(tab);
  }
  async function open(id, section = 'character-sheet') {
    ensure();
    if (!activeCampaign || !auth.currentUser || !canUseCharacters()) return false;
    const inventorySection = section === 'inventory';
    const tab = inventorySection ? 'character-sheet' : ({sheet: 'character-sheet', loot: 'character-loot', wishlist: 'character-wishlist'}[section] || section);
    if (!routes.has(tab) || tab === 'player') return false;
    const character = id ? choices().find(row => row.id === id) : fallback();
    if (id && !character) return false;
    if(typeof PageEditors!=='undefined'&&!PageEditors.guard(()=>open(id,section)))return false;
    const sameSheet = tab === 'character-sheet' && character && sheetSession?.characterId === character.id && sheetSession.campaignId === activeCampaign.id && sheetSession.uid === auth.currentUser.uid && !sheetSession.adventureId;
    if (!sameSheet && !SheetNavigation.guard(() => open(id, section))) { renderHeader(current?.section || 'character-sheet'); return false; }
    const previous = current ? {...current} : null;
    const token = ++generation, uid = auth.currentUser.uid, campaignId = activeCampaign.id;
    current = {uid, campaignId, characterId: character?.id || null, section: tab};
    if (tab === 'character-sheet' && character) {
      await openCharacterSheet(character.id);
      if (token !== generation || uid !== auth.currentUser?.uid || campaignId !== activeCampaign?.id || !choices().some(row => row.id === character.id)) return false;
      if (typeof AppShell !== 'undefined' && AppShell.route !== tab) {current = previous; renderHeader(AppShell.route); return false;}
      if (sheetSession?.characterId !== character.id) return false;
      if (inventorySection) selectSheetTab('inventory');
    } else {
      showTab(tab, false);
      if (typeof AppShell !== 'undefined' && AppShell.route !== tab) {current = previous; renderHeader(AppShell.route); return false;}
      if (tab === 'character-sheet') {
        document.getElementById('characterSheetPage').innerHTML = '<div class="sheet-empty"><h2>Your character sheet</h2><p>Create a character in Manage characters to start your sheet.</p></div>';
      }
    }
    update(tab);
    if (tab !== 'character-sheet' && character) await refresh();
    if (token !== generation || uid !== auth.currentUser?.uid || campaignId !== activeCampaign?.id) return false;
    AppNavigation.remember(tab);
    return true;
  }
  async function refresh(reload = true) {
    ensure();
    const uid = auth.currentUser?.uid, campaignId = activeCampaign?.id, token = scopeGeneration;
    if (!uid || !campaignId || !canUseCharacters()) return;
    if (reload) {
      const section = typeof AppShell === 'undefined' ? current?.section : AppShell.route;
      // Rendering never starts a second item fetch: open/refresh owns these reads.
      const loaders = section === 'character-wishlist' ? [loadCampaignItems, loadSaves]
        : section === 'character-loot' ? [loadCampaignItems, loadCampaignInventory, loadCampaignSupply]
        : [loadCampaignItems, loadCampaignInventory, loadSaves, loadCampaignSupply];
      await Promise.all(loaders.map(load => load()));
    }
    if (token !== scopeGeneration || uid !== auth.currentUser?.uid || campaignId !== activeCampaign?.id) return;
    checkScope();
    const tab = typeof AppShell === 'undefined' ? current?.section : AppShell.route;
    renderHeader(tab);
    renderPanel(tab);
  }
  return {ensure, update, open, refresh, clear, resolve: tab => tab, get context() {checkScope(); return current ? {...current} : null;}};
})();
