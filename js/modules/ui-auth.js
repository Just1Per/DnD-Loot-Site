"use strict";

// Connects existing UI actions to the shared session and Firebase authentication.

// ─── TABS ─────────────────────────────────────────────────────────────────────

/** Select a permitted app tab; sheet rendering can be deferred by its caller. */
function showTab(tabId, render = true) {
  if (tabId === "character-sheet" && (!activeCampaign || !(canUseCharacters() || canManageCampaign()))) return;
  if (tabId === "admin") { openAdminView(); return; }
  if (tabId === "dm" && (!activeCampaign || !canManageCampaign())) return;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display="block";
  if (tabId==="dm")      { renderDMTools(); }
  if (tabId==="character-sheet" && render) { renderCharacterSheetTab(); }
  if (tabId==="player")  { renderPlayerTab(); }
  if (tabId==="library") { renderVisibilityControls(); }
}

function initTabs() {
  document.getElementById("adminTab").addEventListener("click", openAdminView);
  document.getElementById("closeAdminView").addEventListener("click", closeAdminView);
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>showTab(btn.dataset.tab));
  });
}

// ─── FILTER LISTENERS ────────────────────────────────────────────────────────

/** Debounce free-text search; discrete filters update the existing card list immediately. */
function initFilterListeners() {
  let searchTimer = null;

  const search = document.getElementById("search");
  search?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderCards, 140);
  });

  [
    "ownerFilter","rarityFilter","sourceFilter","campaignFilter",
    "categoryFilter","classFilter","showLootedOnly","showUnlootedOnly",
    "showSavedOnly","showAttunementOnly","showNoAttunementOnly",
    "showHighlightedOnly","showNotHighlightedOnly"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", renderCards);
  });
}

// ─── MODAL LISTENERS ─────────────────────────────────────────────────────────

/** Bind modal actions once, including character creation and backdrop dismissal. */
function initModalListeners() {
  // Each entry binds an existing action; optional controls may be absent.
  const actions = {
    openRootCatalogue,
    addItemBtn: () => openItemModal(),
    closeItemModal, cancelItemModal: closeItemModal, saveItemModal,
    openAddUserBtn: () => openUserModal(),
    closeUserModal, cancelUserModal: closeUserModal, saveUserModal,
    closeEditCharModal: closeEditCharacterModal,
    cancelEditCharModal: closeEditCharacterModal, saveEditCharModal: saveEditCharacter,
    closeWishModal, closeWishModalBtn: closeWishModal,
    openCreateCampaignBtn: () => openCampaignModal(),
    closeCampaignModal, cancelCampaignModal: closeCampaignModal, saveCampaignModal,
    leaveCampaignBtn: leaveCampaign
  };
  for (const [id, handler] of Object.entries(actions)) {
    document.getElementById(id)?.addEventListener("click", handler);
  }

  // Property editor — add new row
  document.getElementById("addPropertyBtn")?.addEventListener("click", ()=>{
    const list = document.getElementById("modal-properties-list");
    if (list) list.appendChild(createPropertyRow());
  });

  // Create a campaign identity first; the sheet owns all editable character details.
  document.getElementById("playerCreateCharBtn")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    if (!activeCampaign || !auth.currentUser) { alert("Choose a campaign first."); return; }
    if (!canUseCharacters()) { alert("You do not have permission to create characters in this campaign."); return; }
    if (myCharacters().length >= 10) { alert("You can have a maximum of 10 active characters in one campaign."); return; }
    // Capture the scope before the write so a campaign switch cannot mix character lists.
    const campaignId = activeCampaign.id, userId = auth.currentUser.uid;
    const stamp = Date.now();
    const data = { name: "New character", class: "", level: 1, userId, active: true, created: stamp, lastSelectedAt: stamp };
    button.disabled = true;
    try {
      const newRef = await addDoc(collection(db, "campaigns", campaignId, "characters"), data);
      if (activeCampaign?.id !== campaignId || auth.currentUser?.uid !== userId) return;
      const newChar = { id: newRef.id, ...data };
      if (!characters.some(character => character.id === newChar.id)) characters.push(newChar);
      selectedCharacter = newChar;
      renderPlayerTab(); populateOwnerFilter(); renderCards();
      await openCharacterSheet(newChar.id);
    } catch (error) {
      alert(`Could not create character: ${error.message}`);
    } finally {
      button.disabled = false;
    }
  });

  document.querySelectorAll(".modal").forEach(modal=>{
    modal.addEventListener("click", e=>{ if(e.target===modal) modal.style.display="none"; });
  });
  document.addEventListener("keydown", e=>{
    if (e.key==="Escape") document.querySelectorAll(".modal").forEach(m=>m.style.display="none");
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

document.getElementById("loginButton")?.addEventListener("click", async ()=>{
  try { await signInWithPopup(auth, provider); } catch(e) { console.error(e); }
});

document.getElementById("emailLoginButton")?.addEventListener("click", async ()=>{
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
  } catch(e) { alert(e.message); }
});

document.getElementById("registerButton")?.addEventListener("click", async ()=>{
  try {
    await createUserWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
    alert("Account created. If this email has a pending campaign invitation, it will appear on the campaign screen.");
  } catch(e) { alert(e.message); }
});

// Clear selected campaign data immediately; the auth callback closes editors
// and finishes clearing all loaded state after Firebase confirms sign-out.
document.getElementById("logoutButton")?.addEventListener("click", async () => {
  activeCampaign = null;
  activeMembershipRole = null;
  selectedCharacter = null;
  characters = [];
  saves = [];
  itemState = {};
  pendingInvites = [];
  campaignInvites = [];
  myDMRequest = null;
  dmRequests = [];
  dashboardCharacters = [];
  await signOut(auth);
});

// ─── AUTH STATE ───────────────────────────────────────────────────────────────
// Google, email login and restored sessions all finish through this callback.

onAuthStateChanged(auth, async (firebaseUser) => {
  const loginControls = document.getElementById("loginControls");
  const logoutBtn     = document.getElementById("logoutButton");
  const display       = document.getElementById("userDisplay");

  if (firebaseUser) {
    try {
      await loadCurrentUser(firebaseUser);

      display.textContent = currentUser.name || firebaseUser.email;

      if (loginControls) loginControls.style.display = "none";
      if (logoutBtn)     logoutBtn.style.display = "inline-block";

      // One-document catalogue existence check. The expensive legacy items.js
      // import happens only on a genuinely empty database.
      await importItemsIfEmpty();

      // The large magical-item catalogue is intentionally lazy. It is loaded
      // only after the user chooses "Load magical items" in the Library.
      itemsLoadPromise = Promise.resolve();
      magicItemLibraryLoaded = false;
      magicItemLibraryLoading = false;

      await Promise.all([
        loadCampaigns(),
        loadMyPendingInvites(),
        loadMyDMRequest(),
        isAdmin() ? Promise.all([loadUsers(), loadDMRequests()]) : Promise.resolve()
      ]);

      await loadDashboardCharacters();

      ensureDMApprovalStyles();
      showCampaignSelector();
      SiteHelp.onLogin();
      console.info(`Successfully logged in as ${currentUser.name || firebaseUser.email || firebaseUser.uid}`);

      // Do not block the campaign selector on catalogue painting.
      itemsLoadPromise.catch(() => {});

    } catch (e) {
      console.error("Startup failed:", e);
      display.textContent = "Failed to load account";
    }

  } else {
    closeCharacterLoot();
    closeWishModal();
    closeEditCharacterModal();
    closeUserModal();
    SiteHelp.onLogout();
    currentUser = null;
    activeCampaign = null;
    activeMembershipRole = null;
    selectedCharacter = null;

    ++campaignLoadGeneration;
    closeCharacterSheet(true); closeVaultAction(); closeRootPicker(); closeItemModal();
    rootItems = []; inventory = []; campaignSupply = {};
    items = [];
    characters = [];
    saves = [];
    users = [];
    campaigns = [];
    itemState = {};
    pendingInvites = [];
    campaignInvites = [];
    campaignMembers = [];
    myDMRequest = null;
    dmRequests = [];
    dashboardCharacters = [];
    itemsLoadPromise = Promise.resolve();

    display.textContent = "Not logged in";

    if (loginControls) loginControls.style.display = "block";
    if (logoutBtn)     logoutBtn.style.display = "none";

    renderPublicLanding();

    const dmActions = document.getElementById("dmSelectorActions");
    if (dmActions) dmActions.style.display = "none";
  }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────

ensureDMToolsUI();
ensureDashboardStyles();
ensureDashboardShell();
initTabs();
initFilterListeners();
initModalListeners();

SiteHelp.init();
