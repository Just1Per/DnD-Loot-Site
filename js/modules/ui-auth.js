"use strict";

// TABS / LISTENERS / AUTH / BOOT
// Extracted from the working Step 7 app with behavior preserved.

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tabId) {
  if (tabId === "admin") { openAdminView(); return; }
  if (tabId === "dm" && (!activeCampaign || !canManageCampaign())) return;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display="block";
  if (tabId==="admin")   { renderUserTable(); renderAdminStats(); }
  if (tabId==="dm")      { renderDMTools(); }
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

function initModalListeners() {
  document.getElementById("openRootCatalogue")?.addEventListener("click", openRootCatalogue);
  document.getElementById("addItemBtn")?.addEventListener("click",      ()=>openItemModal());
  document.getElementById("closeItemModal")?.addEventListener("click",  closeItemModal);
  document.getElementById("cancelItemModal")?.addEventListener("click", closeItemModal);
  document.getElementById("saveItemModal")?.addEventListener("click",   saveItemModal);

  // Property editor — add new row
  document.getElementById("addPropertyBtn")?.addEventListener("click", ()=>{
    const list = document.getElementById("modal-properties-list");
    if (list) list.appendChild(createPropertyRow());
  });

  document.getElementById("openAddUserBtn")?.addEventListener("click",  ()=>openUserModal());
  document.getElementById("closeUserModal")?.addEventListener("click",  closeUserModal);
  document.getElementById("cancelUserModal")?.addEventListener("click", closeUserModal);
  document.getElementById("saveUserModal")?.addEventListener("click",   saveUserModal);

  document.getElementById("closeEditCharModal")?.addEventListener("click",  closeEditCharacterModal);
  document.getElementById("cancelEditCharModal")?.addEventListener("click", closeEditCharacterModal);
  document.getElementById("saveEditCharModal")?.addEventListener("click",   saveEditCharacter);

  document.getElementById("closeWishModal")?.addEventListener("click",    closeWishModal);
  document.getElementById("closeWishModalBtn")?.addEventListener("click", closeWishModal);

  document.getElementById("openCreateCampaignBtn")?.addEventListener("click", ()=>openCampaignModal());
  document.getElementById("closeCampaignModal")?.addEventListener("click",    closeCampaignModal);
  document.getElementById("cancelCampaignModal")?.addEventListener("click",   closeCampaignModal);
  document.getElementById("saveCampaignModal")?.addEventListener("click",     saveCampaignModal);

  // Leave campaign button
  document.getElementById("leaveCampaignBtn")?.addEventListener("click", leaveCampaign);

  // Create character
  document.getElementById("playerCreateCharBtn")?.addEventListener("click", async () => {
    if (!activeCampaign) {
      alert("No active campaign.");
      return;
    }

    if (!canUseCharacters()) {
      alert("You do not have permission to create characters in this campaign.");
      return;
    }

    if (myCharacters().length >= 10) {
      alert("You can have a maximum of 10 active characters in one campaign.");
      return;
    }

    const name  = document.getElementById("playerCharName").value.trim();
    const cls   = document.getElementById("playerCharClass").value;
    const level = parseInt(document.getElementById("playerCharLevel").value) || null;

    if (!name) {
      alert("Enter a character name.");
      return;
    }

    if (level !== null && (level < 1 || level > 20)) {
      alert("Level must be 1–20.");
      return;
    }

    const data = {
      name,
      class: cls,
      level,
      userId: auth.currentUser.uid,
      active: true,
      created: Date.now()
    };

    const newRef = await addDoc(
      collection(db, "campaigns", activeCampaign.id, "characters"),
      data
    );

    const newChar = { id: newRef.id, ...data };
    characters.push(newChar);
    selectedCharacter = newChar;

    document.getElementById("playerCharName").value = "";
    document.getElementById("playerCharLevel").value = "";

    renderPlayerTab();
    populateOwnerFilter();
    renderCards();
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

      // Start the large catalogue read in parallel. The user can see/select a
      // campaign before item cards and Storage URLs have finished resolving.
      itemsLoadPromise = loadItemsFromFirestore().catch(e => {
        console.error("Item catalogue load failed:", e);
        throw e;
      });

      await Promise.all([
        loadCampaigns(),
        loadMyPendingInvites(),
        loadMyDMRequest(),
        isAdmin() ? Promise.all([loadUsers(), loadDMRequests()]) : Promise.resolve()
      ]);

      await loadDashboardCharacters();

      ensureDMApprovalStyles();
      showCampaignSelector();

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
    currentUser = null;
    activeCampaign = null;
    activeMembershipRole = null;
    selectedCharacter = null;

    ++campaignLoadGeneration;
    closeVaultAction(); closeRootPicker(); closeItemModal();
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
