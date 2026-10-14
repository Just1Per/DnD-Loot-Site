"use strict";

// Connects existing UI actions to the shared session and Firebase authentication.

// ─── TABS ─────────────────────────────────────────────────────────────────────

/** Select a permitted app tab; sheet rendering can be deferred by its caller. */
function showTab(tabId, render = true) {
  tabId=AppShell.resolve(tabId);
  if (['campaign-home','campaign-information','campaign-npcs','campaign-chapters'].includes(tabId) && !activeCampaign) return;
  if (tabId === "character-sheet" && (!activeCampaign || !(canUseCharacters() || canManageCampaign()))) return;
  if(['player','player-adventures'].includes(tabId)&&(!activeCampaign||!canUseCharacters()))return;
  if(tabId!=="character-sheet"&&!SheetNavigation.guard(()=>showTab(tabId,render)))return;
  if (tabId === "admin") { openAdminView(); return; }
  if ((tabId === "dm" || ["dm-world","dm-creatures","dm-chapters","dm-party","dm-settings","dm-one-shots"].includes(tabId)) && (!activeCampaign || !canManageCampaign())) return;
  if (typeof CampaignWorkspace!=="undefined" && !CampaignWorkspace.beforeNavigate(tabId)) return;
  if (typeof CampaignHome!=="undefined" && !CampaignHome.beforeNavigate(tabId)) return;
  if(typeof CampaignInformation!=='undefined'&&!CampaignInformation.beforeNavigate(tabId))return;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c=>c.style.display="none");
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display="block";
  AppShell.update(tabId);
  if(render&&tabId==='player-adventures')CampaignWorkspace.render('playerAdventure');
  if(render&&tabId==='campaign-home')CampaignHome.render();
  if(render&&tabId==='campaign-information')CampaignInformation.render();
  if(render&&tabId==='campaign-npcs')CampaignInformation.render('creature');
  if(render&&tabId==='campaign-chapters')CampaignInformation.render('chapter');
  if(render&&tabId==="dm-one-shots") CampaignWorkspace.render("oneShot");
  if (render&&tabId==="dm-chapters") CampaignWorkspace.render("chapter");
  if (render&&tabId==="dm-world") CampaignWorkspace.render("world");
  if (render&&tabId==="dm-creatures") CampaignWorkspace.render("creature");
  if (['dm','dm-settings','dm-party'].includes(tabId)) { renderDMTools(); }
  if (tabId==="character-sheet" && render) { renderCharacterSheetTab(); }
  if (tabId==="player")  { renderPlayerTab(); }
  if (tabId==="library") { renderVisibilityControls(); }
  AppNavigation.remember(tabId);
}

function initTabs() {
  document.getElementById("adminTab").addEventListener("click", openAdminView);
  document.getElementById("closeAdminView").addEventListener("click", closeAdminView);
  document.querySelectorAll(".tab").forEach(btn=>{
    if(btn.id.startsWith("dmPlanningTab-"))return;
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
    playerAdventuresBtn:()=>showTab('player-adventures'),
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

    const button=document.getElementById('playerCreateCharBtn'),status=document.getElementById('playerCharacterStatus');
    const campaignId=activeCampaign.id;
    button.disabled=true;status.textContent='Creating character…';
    try {
      const data={name:'New adventurer',class:'',level:1,userId:auth.currentUser.uid,active:true,created:Date.now(),lastSelectedAt:Date.now()};
      const newRef=await addDoc(collection(db,'campaigns',campaignId,'characters'),data);
      if(activeCampaign?.id!==campaignId)return;
      const character={id:newRef.id,...data};characters.push(character);selectedCharacter=character;
      renderPlayerTab();populateOwnerFilter();renderCards();
      status.textContent='Character created. Complete its identity and choices in the sheet.';
      await openCharacterSheet(character.id);selectSheetTab('builder');
      document.querySelector('[name="identity.name"]')?.focus();
    } catch(error) { status.textContent='Could not create character: '+error.message; }
    finally { button.disabled=false; }

  });

  document.querySelectorAll(".modal").forEach(modal=>{
    modal.addEventListener("click", e=>{ if(e.target===modal) closeVaultModal(modal.id); });
  });
  document.addEventListener("keydown", e=>{
    if (e.key==="Escape") document.querySelectorAll(".modal").forEach(m=>closeVaultModal(m.id));
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

document.getElementById("loginButton")?.addEventListener("click", async ()=>{
  try { document.getElementById('authStatus').textContent='Opening Google sign-in…';await signInWithPopup(auth, provider); } catch(e) {document.getElementById('authStatus').textContent='Could not sign in. '+e.message;}
});

document.getElementById("emailLoginButton")?.addEventListener("click", async ()=>{
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
  } catch(e) { document.getElementById('authStatus').textContent='Could not sign in. '+e.message; }
});

document.getElementById("registerButton")?.addEventListener("click", async ()=>{
  try {
    await createUserWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
    document.getElementById('authStatus').textContent='Account created. Pending campaign invitations will appear on your dashboard.';
  } catch(e) { document.getElementById('authStatus').textContent='Could not create account. '+e.message; }
});

// Recovery feedback stays in the login header; password emails are sent only on request.
document.getElementById('resetPasswordButton')?.addEventListener('click',async()=>{
  const email=document.getElementById('emailInput'),button=document.getElementById('resetPasswordButton'),status=document.getElementById('authStatus');
  email.required=true;
  if(!email.checkValidity()){status.textContent='Enter your email address to request a password reset.';email.reportValidity();email.focus();return;}
  button.disabled=true;status.textContent='Requesting password reset…';
  try { await sendPasswordResetEmail(auth,email.value.trim());status.textContent='If this email has a password account, reset instructions have been sent. Check your inbox, then return to Login.'; }
  catch(error){status.textContent=error.code==='auth/too-many-requests'?'Too many requests. Please try again later.':'Could not request a reset. Check your connection and try again.';}
  finally {button.disabled=false;}
});

// Clear selected campaign data immediately; the auth callback closes editors
// and finishes clearing all loaded state after Firebase confirms sign-out.
async function logoutFromSite(){
  if(!SheetNavigation.guard(logoutFromSite))return;
  AppNavigation.clear();
  CampaignHome.clear(true);
  CampaignInformation.clear(true);
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
}
document.getElementById("logoutButton")?.addEventListener("click",logoutFromSite);

// ─── AUTH STATE ───────────────────────────────────────────────────────────────
// Google, email login and restored sessions all finish through this callback.

let authStartupGeneration=0;
onAuthStateChanged(auth, async (firebaseUser) => {
  const generation=++authStartupGeneration;
  const current=()=>generation===authStartupGeneration&&auth.currentUser?.uid===firebaseUser?.uid;
  AppNavigation.cancelRestore();
  if(currentUser?.uid!==firebaseUser?.uid){
    ++campaignLoadGeneration;SheetNavigation.cancel();closeCharacterSheet(true);CampaignWorkspace.clear(true);CampaignHome.clear(true);
    activeCampaign=null;activeMembershipRole=null;characters=[];selectedCharacter=null;inventory=[];saves=[];campaignMembers=[];campaignInvites=[];
    hideAllScreens();
  }
  CampaignInformation.onAccountChanged(firebaseUser?.uid);
  const loginControls = document.getElementById("loginControls");
  const logoutBtn     = document.getElementById("logoutButton");
  const display       = document.getElementById("userDisplay");

  if (firebaseUser) {
    try {
      await loadCurrentUser(firebaseUser,{isCurrent:current});
      if(!current())return;

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

      if(!current())return;
      await loadDashboardCharacters();
      if(!current())return;

      ensureDMApprovalStyles();
      showCampaignSelector();
      await AppNavigation.restore(firebaseUser.uid);
      if(!current())return;
      SiteHelp.onLogin();
      console.info(`Successfully logged in as ${currentUser.name || firebaseUser.email || firebaseUser.uid}`);

      // Do not block the campaign selector on catalogue painting.
      itemsLoadPromise.catch(() => {});

    } catch (e) {
      if(!current())return;
      console.error("Startup failed:", e);
      display.textContent = "Failed to load account";
    }

  } else {
    closeCharacterLoot();
    closeWishModal();
    closeEditCharacterModal();
    closeUserModal();
    SiteHelp.onLogout();
    CampaignHome.clear(true);
    CampaignInformation.clear(true);
    currentUser = null;
    activeCampaign = null;
    activeMembershipRole = null;
    selectedCharacter = null;

    ++campaignLoadGeneration;
    CampaignWorkspace.clear(true);
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
