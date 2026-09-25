"use strict";

// DASHBOARD / CAMPAIGN SELECTOR / SCREEN MANAGEMENT
// Extracted from the working Step 7 app with behavior preserved.

// ─── STEP 6 DASHBOARD DATA ────────────────────────────────────────────────────

async function loadDashboardCharacters() {
  const uid = auth.currentUser?.uid;
  if (!uid || !campaigns.length) {
    dashboardCharacters = [];
    return;
  }

  const results = await Promise.all(
    campaigns.map(async campaign => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "campaigns", campaign.id, "characters"),
            where("userId", "==", uid),
            limit(6)
          )
        );
        return snap.docs.map(d => ({
          id: d.id,
          campaignId: campaign.id,
          campaignName: campaign.name || "Campaign",
          ...d.data()
        }));
      } catch (e) {
        console.warn(`Dashboard characters unavailable for ${campaign.id}:`, e.message);
        return [];
      }
    })
  );

  dashboardCharacters = results
    .flat()
    .filter(c => c.active !== false)
    .sort((a, b) => (b.updatedAt || b.created || 0) - (a.updatedAt || a.created || 0))
    .slice(0, 6);
}

function globalRoleLabel() {
  if (isAdmin()) return "Administrator";
  if (hasRole("dm")) return "Approved DM";
  if (hasRole("player")) return "Player";
  return "Member";
}

function ensureDashboardStyles() {
  if (document.getElementById("step6-dashboard-styles")) return;
  const style = document.createElement("style");
  style.id = "step6-dashboard-styles";
  style.textContent = `
    #campaignSelectorScreen.dashboard-screen { align-items:flex-start; padding:34px 20px 70px; }
    #campaignSelectorScreen .campaign-selector-box.dashboard-shell {
      max-width:1180px; width:min(1180px,100%); padding:0; background:transparent;
      border:0; box-shadow:none; gap:0;
    }
    .vault-landing,.vault-dashboard{width:100%}
    .vault-landing-hero{background:#fdfbf7;border:3px double #8a7355;border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,.18);padding:clamp(32px,6vw,72px);text-align:center}
    .vault-kicker{display:inline-block;padding:4px 10px;border:1px solid #c79c32;border-radius:999px;background:rgba(212,175,55,.12);color:#7d6608;font:700 .64rem/1 "Cinzel",serif;letter-spacing:.8px;text-transform:uppercase;margin-bottom:14px}
    .vault-landing-title,.dashboard-title{font-family:"Cinzel",serif;color:#5c1d1d;margin:0}
    .vault-landing-title{font-size:clamp(2rem,5vw,4rem);line-height:1.05}
    .vault-landing-copy{max-width:720px;margin:18px auto 0;color:#66584a;font-size:clamp(.95rem,2vw,1.12rem);line-height:1.65}
    .vault-landing-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:26px}
    .vault-secondary-btn,.dashboard-action{background:rgba(212,175,55,.13);border:1px solid #c79c32;border-radius:7px;color:#7d6608;cursor:pointer;font-family:"Cinzel",serif;font-size:.7rem;font-weight:700;letter-spacing:.6px;padding:9px 14px;text-transform:uppercase}
    .vault-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
    .vault-feature-card,.dashboard-panel,.dashboard-stat,.dashboard-account{background:#fdfbf7;border:2px solid #c8b89a;border-radius:12px;box-shadow:0 5px 16px rgba(0,0,0,.07)}
    .vault-feature-card{padding:20px}.vault-feature-card strong{display:block;font-family:"Cinzel",serif;color:#5c1d1d;margin-bottom:7px}.vault-feature-card p{margin:0;color:#746453;font-size:.84rem;line-height:1.5}
    .dashboard-topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}
    .dashboard-title{font-size:clamp(1.55rem,3vw,2.35rem)}.dashboard-subtitle{margin:5px 0 0;color:#8a7355;font-size:.88rem}.dashboard-role{flex-shrink:0}
    .dashboard-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.dashboard-stat{padding:16px 18px}.dashboard-stat-num{display:block;font:700 1.55rem/1 "Cinzel",serif;color:#5c1d1d}.dashboard-stat-label{display:block;margin-top:6px;color:#8a7355;font-size:.7rem;text-transform:uppercase;letter-spacing:.7px}
    .dashboard-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:16px}.dashboard-column{display:flex;flex-direction:column;gap:16px;min-width:0}.dashboard-panel{padding:18px}.dashboard-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.dashboard-panel h2,.dashboard-account h2{margin:0;font:700 .92rem/1.2 "Cinzel",serif;color:#5c1d1d;letter-spacing:.5px}.dashboard-panel-note{margin:4px 0 0;color:#8a7355;font-size:.74rem}
    .dashboard-campaign-list,.dashboard-invite-list,.dashboard-character-list{display:flex;flex-direction:column;gap:9px}
    .dashboard-campaign-card,.dashboard-character-card,.dashboard-invite-card{display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;padding:13px 14px;background:#f4efe6;border:1px solid #c8b89a;border-radius:9px;color:inherit;text-align:left;transition:transform .15s,border-color .15s}
    button.dashboard-campaign-card,button.dashboard-character-card{cursor:pointer}button.dashboard-campaign-card:hover,button.dashboard-character-card:hover{border-color:#c79c32;transform:translateY(-1px)}
    .dashboard-card-copy{min-width:0;display:flex;flex-direction:column;gap:3px}.dashboard-card-name{font:700 .8rem/1.25 "Cinzel",serif;color:#5c1d1d}.dashboard-card-meta{color:#8a7355;font-size:.72rem;line-height:1.35}.dashboard-card-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dashboard-empty{padding:18px;border:1px dashed #c8b89a;border-radius:9px;color:#8a7355;text-align:center;font-size:.8rem}
    .dashboard-account{padding:16px 18px}.dashboard-account-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #eee4d5;font-size:.76rem}.dashboard-account-row:last-child{border-bottom:0}.dashboard-account-row span:first-child{color:#8a7355}.dashboard-account-row strong{color:#5c1d1d;text-align:right;overflow-wrap:anywhere}
    #dashboardDmAccess .dm-application-panel{margin:0}#dashboardDmAccess .dm-application-card{margin:0}#dmSelectorActions.dashboard-create-actions{justify-content:flex-start;padding:0}.dashboard-invite-card{background:#fffaf0;border-color:#c79c32}.dashboard-section-hidden{display:none!important}
    @media(max-width:850px){.vault-feature-grid{grid-template-columns:1fr}.dashboard-layout{grid-template-columns:1fr}.dashboard-topbar{align-items:flex-start;flex-direction:column}}
    @media(max-width:580px){#campaignSelectorScreen.dashboard-screen{padding:20px 10px 50px}.dashboard-stats{grid-template-columns:1fr}.dashboard-campaign-card,.dashboard-character-card,.dashboard-invite-card{align-items:flex-start;flex-direction:column}.dashboard-card-actions{justify-content:flex-start}.vault-landing-hero{padding:30px 18px}}
  `;
  document.head.appendChild(style);
}

function ensureDashboardShell() {
  const screen = document.getElementById("campaignSelectorScreen");
  const box = screen?.querySelector(".campaign-selector-box");
  if (!screen || !box || box.dataset.step6Ready === "true") return;

  screen.classList.add("dashboard-screen");
  box.classList.add("dashboard-shell");
  box.dataset.step6Ready = "true";
  box.innerHTML = `
    <section id="publicLanding" class="vault-landing" aria-label="D&D Item Vault introduction">
      <div class="vault-landing-hero">
        <span class="vault-kicker">Campaign-ready magic item library</span>
        <h1 class="vault-landing-title">Your campaign's item vault.</h1>
        <p class="vault-landing-copy">Keep magic items, character wishlists, loot ownership and DM visibility in one campaign-aware library. Players see what they should see; Dungeon Masters keep control of the rest.</p>
        <div class="vault-landing-actions">
          <button type="button" class="btn-primary" data-landing-google>Continue with Google</button>
          <button type="button" class="vault-secondary-btn" data-landing-email>Use email login</button>
        </div>
      </div>
      <div class="vault-feature-grid">
        <article class="vault-feature-card"><strong>One vault, many campaigns</strong><p>Characters, saved items, visibility and loot stay separated by campaign.</p></article>
        <article class="vault-feature-card"><strong>Built for players</strong><p>Create characters, save interesting items and keep a focused wishlist for each adventure.</p></article>
        <article class="vault-feature-card"><strong>Built for DMs</strong><p>Invite your group, manage members, reveal items and assign loot without changing the master catalogue.</p></article>
      </div>
    </section>
    <section id="dashboardHome" class="vault-dashboard" style="display:none" aria-label="Account dashboard">
      <div class="dashboard-topbar"><div><span class="vault-kicker">Dashboard</span><h1 id="dashboardGreeting" class="dashboard-title">Welcome back</h1><p class="dashboard-subtitle">Choose a campaign or pick up where you left off.</p></div><span id="dashboardGlobalRole" class="role-badge dashboard-role">Member</span></div>
      <div class="dashboard-stats">
        <div class="dashboard-stat"><span id="dashboardCampaignCount" class="dashboard-stat-num">0</span><span class="dashboard-stat-label">Campaigns</span></div>
        <div class="dashboard-stat"><span id="dashboardInviteCount" class="dashboard-stat-num">0</span><span class="dashboard-stat-label">Pending invites</span></div>
        <div class="dashboard-stat"><span id="dashboardCharacterCount" class="dashboard-stat-num">0</span><span class="dashboard-stat-label">Your characters</span></div>
      </div>
      <div id="dashboardInviteSection" class="dashboard-panel dashboard-section-hidden"><div class="dashboard-panel-head"><div><h2>Pending Invitations</h2><p class="dashboard-panel-note">Accept to add the campaign to your dashboard.</p></div></div><div id="dashboardInvitesList" class="dashboard-invite-list"></div></div>
      <div class="dashboard-layout">
        <div class="dashboard-column"><section class="dashboard-panel"><div class="dashboard-panel-head"><div><h2>Your Campaigns</h2><p class="dashboard-panel-note">Campaign roles are independent from your account role.</p></div></div><div id="campaignSelectorList" class="dashboard-campaign-list"></div><div id="dmSelectorActions" class="dm-selector-actions dashboard-create-actions" style="display:none;margin-top:12px"><button id="openCreateCampaignBtn" type="button" class="btn-primary">+ New Campaign</button></div></section></div>
        <aside class="dashboard-column">
          <section class="dashboard-panel"><div class="dashboard-panel-head"><div><h2>Recent Characters</h2><p class="dashboard-panel-note">Your active characters across accessible campaigns.</p></div></div><div id="dashboardCharacterList" class="dashboard-character-list"></div></section>
          <div id="dashboardDmAccess"></div>
          <section class="dashboard-account"><div class="dashboard-panel-head"><div><h2>Account</h2></div></div><div class="dashboard-account-row"><span>Name</span><strong id="dashboardAccountName">—</strong></div><div class="dashboard-account-row"><span>Email</span><strong id="dashboardAccountEmail">—</strong></div><div class="dashboard-account-row"><span>Access</span><strong id="dashboardAccountRole">—</strong></div></section>
        </aside>
      </div>
    </section>`;

  box.querySelector("[data-landing-google]")?.addEventListener("click", () => document.getElementById("loginButton")?.click());
  box.querySelector("[data-landing-email]")?.addEventListener("click", () => {
    document.getElementById("emailInput")?.focus();
    document.querySelector(".site-header")?.scrollIntoView({ behavior:"smooth", block:"start" });
  });
}

function renderPublicLanding() {
  ensureDashboardShell();
  hideAllScreens();
  const screen = document.getElementById("campaignSelectorScreen");
  if (screen) screen.style.display = "flex";
  const landing = document.getElementById("publicLanding");
  const dashboard = document.getElementById("dashboardHome");
  if (landing) landing.style.display = "block";
  if (dashboard) dashboard.style.display = "none";
}

function renderDashboard() {
  ensureDashboardShell();
  if (!auth.currentUser || !currentUser) { renderPublicLanding(); return; }

  const landing = document.getElementById("publicLanding");
  const dashboard = document.getElementById("dashboardHome");
  if (landing) landing.style.display = "none";
  if (dashboard) dashboard.style.display = "block";

  const firstName = String(currentUser.name || auth.currentUser.email || "Adventurer").trim().split(/\s+/)[0];
  const greeting = document.getElementById("dashboardGreeting");
  if (greeting) greeting.textContent = `Welcome back, ${firstName}`;
  const roleLabel = globalRoleLabel();
  const roleBadge = document.getElementById("dashboardGlobalRole");
  if (roleBadge) roleBadge.textContent = roleLabel;

  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText("dashboardCampaignCount", campaigns.length);
  setText("dashboardInviteCount", pendingInvites.length);
  setText("dashboardCharacterCount", dashboardCharacters.length);
  setText("dashboardAccountName", currentUser.name || "—");
  setText("dashboardAccountEmail", auth.currentUser.email || currentUser.email || "—");
  setText("dashboardAccountRole", roleLabel);

  const inviteSection = document.getElementById("dashboardInviteSection");
  const inviteList = document.getElementById("dashboardInvitesList");
  if (inviteSection && inviteList) {
    inviteSection.classList.toggle("dashboard-section-hidden", pendingInvites.length === 0);
    inviteList.innerHTML = pendingInvites.map(invite => `
      <div class="dashboard-invite-card"><div class="dashboard-card-copy"><span class="dashboard-card-name">${escapeHtml(invite.campaignName || "Campaign invitation")}</span><span class="dashboard-card-meta">${escapeHtml(invite.name || invite.email || "Invitation")} · invited as ${escapeHtml(invite.role || "player")}</span></div><div class="dashboard-card-actions"><button class="save-edit-button btn-sm" type="button" data-accept-invite="${invite.id}">Accept</button><button class="cancel-button btn-sm" type="button" data-decline-invite="${invite.id}">Decline</button></div></div>`).join("");
    inviteList.querySelectorAll("[data-accept-invite]").forEach(btn => btn.addEventListener("click", () => acceptCampaignInvite(btn.dataset.acceptInvite)));
    inviteList.querySelectorAll("[data-decline-invite]").forEach(btn => btn.addEventListener("click", () => declineCampaignInvite(btn.dataset.declineInvite)));
  }

  const list = document.getElementById("campaignSelectorList");
  if (list) {
    list.innerHTML = campaigns.length ? campaigns.map(c => `
      <button class="dashboard-campaign-card" data-campaign-id="${c.id}" type="button"><span class="dashboard-card-copy"><span class="dashboard-card-name">${escapeHtml(c.name || "Campaign")}</span><span class="dashboard-card-meta">${escapeHtml(c.description || "Open campaign")}</span></span><span class="dashboard-card-actions"><span class="role-badge">${escapeHtml(c.membershipRole || "player")}</span><span aria-hidden="true">→</span></span></button>`).join("") : `<div class="dashboard-empty">${isDM() ? "You have no active campaigns yet. Create one below." : "No campaigns yet. Pending invitations will appear above when your email is invited."}</div>`;
    list.querySelectorAll("[data-campaign-id]").forEach(btn => btn.addEventListener("click", () => { const camp = campaigns.find(c => c.id === btn.dataset.campaignId); if (camp) enterCampaign(camp); }));
  }

  const characterList = document.getElementById("dashboardCharacterList");
  if (characterList) {
    characterList.innerHTML = dashboardCharacters.length ? dashboardCharacters.map(c => `
      <button class="dashboard-character-card" type="button" data-char-campaign-id="${c.campaignId}"><span class="dashboard-card-copy"><span class="dashboard-card-name">${escapeHtml(c.name || "Character")}</span><span class="dashboard-card-meta">${escapeHtml(c.class || "Adventurer")}${c.level ? ` · Level ${escapeHtml(c.level)}` : ""} · ${escapeHtml(c.campaignName || "Campaign")}</span></span><span aria-hidden="true">→</span></button>`).join("") : `<div class="dashboard-empty">Your characters will appear here after you create them inside a campaign.</div>`;
    characterList.querySelectorAll("[data-char-campaign-id]").forEach(btn => btn.addEventListener("click", () => { const camp = campaigns.find(c => c.id === btn.dataset.charCampaignId); if (camp) enterCampaign(camp); }));
  }

  const dmActions = document.getElementById("dmSelectorActions");
  if (dmActions) dmActions.style.display = isDM() ? "flex" : "none";
  renderDMApplicationPanel();
}


// ─── OWNER HELPERS ────────────────────────────────────────────────────────────

function allPlayableCharacters() {
  return characters.filter(c => c.active !== false);
}

function characterDisplayName(char, usersById = null) {
  if (!char) return "";
  const owner = usersById?.get(char.userId) || users.find(u => u.id === char.userId);
  return `${char.name} (${char.class})${owner ? " — " + (owner.name || owner.email) : ""}`;
}

// ─── CAMPAIGN SELECTOR ────────────────────────────────────────────────────────

function showCampaignSelector() {
  hideAllScreens();
  const screen = document.getElementById("campaignSelectorScreen");
  if (screen) screen.style.display = "flex";
  renderDashboard();
}

function renderCampaignSelector() {
  renderDashboard();
}

async function enterCampaign(campaign) {
  closeCharacterLoot(); closeWishModal(); closeEditCharacterModal(); closeItemModal();
  closeCharacterSheet(true); closeVaultAction(); closeRootPicker();
  const generation = ++campaignLoadGeneration;
  hideAllScreens();
  try {
    const fresh = await getDoc(doc(db, "campaigns", campaign.id));
    const membership = await getDoc(doc(db, "campaigns", campaign.id, "members", auth.currentUser.uid));
    if (generation !== campaignLoadGeneration) return;
    if (!fresh.exists()) throw new Error("Campaign no longer exists.");
    const owner = fresh.data().ownerId === auth.currentUser.uid;
    if (!owner && (!membership.exists() || membership.data().status !== "active")) throw new Error("You no longer have access to this campaign.");
    activeCampaign = { ...fresh.data(), id: fresh.id };
    activeMembershipRole = owner ? "owner" : membership.data().role;
    items = []; inventory = []; campaignSupply = {}; itemState = {}; characters = []; saves = []; campaignMembers = []; campaignInvites = []; selectedCharacter = null;
    document.getElementById("activeCampaignName").textContent = activeCampaign.name;
    await Promise.all([loadCharacters(), loadSaves(), loadCampaignInventory()]);
    if (generation !== campaignLoadGeneration) return;
    await loadCampaignItems();
    if (canManageCampaign()) await Promise.all([loadCampaignMembers(), loadActiveCampaignInvites(), loadCampaignSupply()]);
    if (generation !== campaignLoadGeneration) return;
    showMainApp(); populateOwnerFilter(); renderCards();
  } catch (error) {
    if (generation !== campaignLoadGeneration) return;
    activeCampaign = null; activeMembershipRole = null; items = []; inventory = [];
    alert(`Could not open campaign: ${error.message}`); showCampaignSelector();
  }
}

async function leaveCampaign() {
  ++campaignLoadGeneration;
  items = []; inventory = []; campaignSupply = {};
  closeCharacterSheet(true); closeVaultAction(); closeRootPicker(); closeItemModal();
  closeCharacterLoot();
  closeWishModal();
  closeEditCharacterModal();
  activeCampaign       = null;
  activeMembershipRole = null;
  selectedCharacter    = null;
  characters = [];
  saves = [];
  users = isAdmin() ? users : [];
  itemState = {};
  campaignInvites = [];
  campaignMembers = [];
  await loadDashboardCharacters();
  showCampaignSelector();
}

// ─── SCREEN MANAGEMENT ────────────────────────────────────────────────────────

function hideAllScreens() {
  const root = document.getElementById("rootCatalogueScreen");
  if (root) root.style.display = "none";
  document.getElementById("tab-admin").style.display = "none";
  document.getElementById("adminTab").style.display = isAdmin() ? "inline-block" : "none";
  document.getElementById("adminTab").setAttribute("aria-pressed", "false");
  const sel  = document.getElementById("campaignSelectorScreen");
  const main = document.getElementById("mainApp");

  if (sel)  sel.style.display  = "none";
  if (main) main.style.display = "none";
}

function showMainApp() {
  hideAllScreens();

  const main = document.getElementById("mainApp");
  if (main) main.style.display = "block";

  const playerTab  = document.getElementById("playerTab");
  const dmTab      = document.getElementById("dmTab");
  const adminTab   = document.getElementById("adminTab");
  const addBtn     = document.getElementById("addItemBtn");
  const adminPanel = document.getElementById("adminPanel");

  if (dmTab)      dmTab.style.display      = canManageCampaign() ? "inline-block" : "none";
  if (adminTab)   adminTab.style.display   = isAdmin() ? "inline-block" : "none";
  if (addBtn)     addBtn.style.display     = canManageCampaign() ? "inline-block" : "none";
  if (adminPanel) adminPanel.style.display = isAdmin() ? "block" : "none";
  if (playerTab)  playerTab.style.display  = canUseCharacters() ? "inline-block" : "none";

  if (isAdmin()) {
    renderUserTable();
    renderAdminStats();
    renderAdminDMRequests();
  }

  if (canManageCampaign()) renderDMTools();

  renderCampaignToolbar();
  showTab("library");
}

