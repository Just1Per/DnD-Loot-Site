"use strict";

// DM TOOLS
// Extracted from the working Step 7 app with behavior preserved.

// ─── DM TOOLS — ROADMAP STEP 3.1 ──────────────────────────────────────────────

function ensureDMToolsUI() {
  if (document.getElementById("dmTab") && document.getElementById("tab-dm")) return;

  const tabs = document.querySelector("nav.tabs");
  const adminTab = document.getElementById("adminTab");
  if (tabs && !document.getElementById("dmTab")) {
    const btn = document.createElement("button");
    btn.className = "tab";
    btn.id = "dmTab";
    btn.type = "button";
    btn.dataset.tab = "dm";
    btn.style.display = "none";
    btn.textContent = "DM Tools";
    if (adminTab?.parentElement === tabs) tabs.insertBefore(btn, adminTab);
    else tabs.appendChild(btn);
  }

  const main = document.getElementById("mainApp");
  const adminPanel = document.getElementById("tab-admin");
  if (main && !document.getElementById("tab-dm")) {
    const panel = document.createElement("div");
    panel.id = "tab-dm";
    panel.className = "tab-content";
    panel.style.display = "none";
    panel.innerHTML = `<div id="dmToolsPanel"></div>`;
    if (adminPanel?.parentElement === main) main.insertBefore(panel, adminPanel);
    else main.appendChild(panel);
  }

  if (!document.getElementById("dmToolsStep3Styles")) {
    const style = document.createElement("style");
    style.id = "dmToolsStep3Styles";
    style.textContent = `
      .dm-tools-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0}
      .dm-tool-card{background:#f4efe6;border:3px double #8a7355;border-radius:10px;padding:18px}
      .dm-tool-card--wide{grid-column:1/-1}
      .dm-tool-card h2{font-family:"Cinzel",serif;color:#5c1d1d;font-size:1rem;letter-spacing:1px;margin:0 0 12px;text-transform:uppercase}
      .dm-tool-card p{color:#6f6253;font-size:.78rem;line-height:1.5}
      .dm-overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
      .dm-overview-stat{background:#fdfbf7;border:2px solid #8a7355;border-radius:8px;padding:12px;text-align:center}
      .dm-overview-stat strong{display:block;font-family:"Cinzel",serif;color:#5c1d1d;font-size:1.1rem}
      .dm-overview-stat span{font-size:.65rem;text-transform:uppercase;letter-spacing:.6px;color:#8a7355}
      .dm-settings-grid{display:grid;grid-template-columns:1fr;gap:10px}
      .dm-settings-grid label{display:flex;flex-direction:column;gap:5px;font-size:.72rem;font-weight:700;color:#5c1d1d;text-transform:uppercase;letter-spacing:.5px}
      .dm-settings-grid input[type="text"],.dm-settings-grid textarea{background:#fdfbf7;border:2px solid #8a7355;border-radius:7px;padding:8px 10px;color:#333;font:inherit;text-transform:none;letter-spacing:normal}
      .dm-settings-grid textarea{min-height:90px;resize:vertical}
      .dm-checkbox-row{flex-direction:row!important;align-items:center;gap:8px!important;text-transform:none!important;font-weight:600!important}
      .dm-member-list,.dm-invite-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
      .dm-member-row,.dm-invite-row{display:flex;gap:10px;align-items:center;justify-content:space-between;background:#fdfbf7;border:1px solid #c8b89a;border-radius:8px;padding:10px}
      .dm-member-main{min-width:0;display:flex;flex-direction:column;gap:3px}
      .dm-member-name{font-family:"Cinzel",serif;font-weight:700;color:#5c1d1d;font-size:.76rem}
      .dm-member-meta{font-size:.66rem;color:#8a7355;word-break:break-all}
      .dm-member-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
      .dm-member-actions select{background:#fdfbf7;border:1px solid #c79c32;border-radius:4px;color:#7d6608;font-family:"Cinzel",serif;font-size:.62rem;font-weight:700;padding:4px 7px;text-transform:uppercase}
      .dm-danger-btn{background:rgba(92,29,29,.08)!important;border:1px solid #8b3a3a!important;color:#7a2424!important}
      .dm-tool-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      @media(max-width:700px){.dm-member-row,.dm-invite-row{align-items:flex-start;flex-direction:column}.dm-member-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }
}

function memberLabel(member) {
  if (!member) return "Member";
  if (member.displayName) return member.displayName;
  if (member.name) return member.name;
  if (member.uid === auth.currentUser?.uid) return currentUser?.name || currentUser?.email || "You";

  const globalUser = users.find(u => u.id === member.uid);
  if (globalUser?.name) return globalUser.name;

  const ownedCharacters = characters.filter(c => c.userId === member.uid);
  if (ownedCharacters.length === 1) return `${ownedCharacters[0].name}'s player`;
  return `Member ${String(member.uid || member.id || "").slice(0, 8)}…`;
}

function renderDMOverview() {
  const el = document.getElementById("dmOverviewStats");
  if (!el || !activeCampaign) return;

  const states = items.map(i => getItemState(i.id));
  const visible = states.filter(s => s.visible).length;
  const looted = states.filter(s => s.looted).length;
  const highlighted = states.filter(s => s.highlighted).length;

  el.innerHTML = `
    <div class="dm-overview-stat"><strong>${campaignMembers.length}</strong><span>Members</span></div>
    <div class="dm-overview-stat"><strong>${characters.length}</strong><span>Characters</span></div>
    <div class="dm-overview-stat"><strong>${visible}</strong><span>Visible Items</span></div>
    <div class="dm-overview-stat"><strong>${looted}</strong><span>Looted</span></div>
    <div class="dm-overview-stat"><strong>${highlighted}</strong><span>Highlighted</span></div>
    <div class="dm-overview-stat"><strong>${campaignInvites.length}</strong><span>Pending Invites</span></div>`;
}

function renderDMInvites() {
  const el = document.getElementById("dmPendingInvites");
  if (!el) return;

  el.innerHTML = campaignInvites.length
    ? campaignInvites.map(invite => `
        <div class="dm-invite-row">
          <div class="dm-member-main">
            <span class="dm-member-name">${escapeHtml(invite.name || invite.email || "Pending member")}</span>
            <span class="dm-member-meta">${escapeHtml(invite.email || "")}</span>
          </div>
          <div class="dm-member-actions">
            <span class="role-badge">${escapeHtml(invite.role || "player")}</span>
            <button class="btn-sm dm-danger-btn" type="button" data-dm-cancel-invite="${invite.id}">Cancel</button>
          </div>
        </div>`).join("")
    : `<p>No pending invitations for this campaign.</p>`;

  el.querySelectorAll("[data-dm-cancel-invite]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await cancelCampaignInvite(btn.dataset.dmCancelInvite);
      renderDMTools();
    });
  });
}

function renderDMMembers() {
  const el = document.getElementById("dmMemberList");
  if (!el || !activeCampaign) return;

  if (!campaignMembers.length) {
    el.innerHTML = `<p>No active members found.</p>`;
    return;
  }

  el.innerHTML = campaignMembers.map(member => {
    const uid = member.uid || member.id;
    const owner = uid === activeCampaign.ownerId;
    const self = uid === auth.currentUser?.uid;
    const role = owner ? "dm" : (member.role || "player");

    return `
      <div class="dm-member-row">
        <div class="dm-member-main">
          <span class="dm-member-name">${escapeHtml(memberLabel(member))}${self ? " (you)" : ""}</span>
          <span class="dm-member-meta">${owner ? "Campaign owner · " : ""}${escapeHtml(uid)}</span>
        </div>
        <div class="dm-member-actions">
          ${owner
            ? `<span class="role-badge">Owner / DM</span>`
            : `<select data-dm-member-role="${escapeHtml(uid)}" aria-label="Campaign role">
                 <option value="player" ${role === "player" ? "selected" : ""}>Player</option>
                 <option value="dm" ${role === "dm" ? "selected" : ""}>DM</option>
               </select>`}
          ${!owner && !self ? `<button class="btn-sm dm-danger-btn" type="button" data-dm-remove-member="${escapeHtml(uid)}">Remove</button>` : ""}
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll("[data-dm-member-role]").forEach(select => {
    select.addEventListener("change", () => updateCampaignMemberRole(select.dataset.dmMemberRole, select.value));
  });

  el.querySelectorAll("[data-dm-remove-member]").forEach(btn => {
    btn.addEventListener("click", () => removeCampaignMember(btn.dataset.dmRemoveMember));
  });
}

async function updateCampaignMemberRole(uid, role) {
  if (!activeCampaign || !canManageCampaign() || !["player", "dm"].includes(role)) return;
  if (uid === activeCampaign.ownerId) return;

  const member = campaignMembers.find(m => (m.uid || m.id) === uid);
  if (!member) return;

  const now = Date.now();
  const batch = writeBatch(db);

  batch.set(
    doc(db, "campaigns", activeCampaign.id, "members", uid),
    {
      uid,
      role,
      status: "active",
      updatedAt: now,
      updatedBy: auth.currentUser.uid
    },
    { merge: true }
  );

  batch.set(
    doc(db, "users", uid, "campaigns", activeCampaign.id),
    {
      role,
      status: "active",
      updatedAt: now
    },
    { merge: true }
  );

  try {
    await batch.commit();
    member.role = role;
    renderDMMembers();
  } catch (e) {
    console.error("Change campaign role failed:", e);
    alert(`Could not change campaign role: ${e.message}`);
    await loadCampaignMembers();
    renderDMMembers();
  }
}

async function removeCampaignMember(uid) {
  if (!activeCampaign || !canManageCampaign()) return;
  if (uid === activeCampaign.ownerId) {
    alert("The campaign owner cannot be removed here.");
    return;
  }
  if (uid === auth.currentUser?.uid) {
    alert("You cannot remove yourself from the DM Tools panel.");
    return;
  }

  const member = campaignMembers.find(m => (m.uid || m.id) === uid);
  const label = memberLabel(member);
  if (!confirm(`Remove ${label} from \"${activeCampaign.name}\"? Their characters and saved campaign data will be preserved, but they will lose campaign access.`)) return;

  const batch = writeBatch(db);
  batch.delete(doc(db, "campaigns", activeCampaign.id, "members", uid));
  batch.delete(doc(db, "users", uid, "campaigns", activeCampaign.id));

  try {
    await batch.commit();
    campaignMembers = campaignMembers.filter(m => (m.uid || m.id) !== uid);
    renderDMTools();
  } catch (e) {
    console.error("Remove campaign member failed:", e);
    alert(`Could not remove member: ${e.message}`);
  }
}

async function saveDMCampaignSettings() {
  if (!activeCampaign || !canManageCampaign()) return;

  const name = document.getElementById("dmCampaignName")?.value.trim();
  const description = document.getElementById("dmCampaignDescription")?.value.trim() || "";
  const defaultItemVisible = !!document.getElementById("dmDefaultVisible")?.checked;

  if (!name) {
    alert("Campaign name is required.");
    return;
  }

  const changes = {
    name,
    description,
    defaultItemVisible,
    updatedAt: Date.now()
  };

  try {
    await updateDoc(doc(db, "campaigns", activeCampaign.id), changes);
    activeCampaign = { ...activeCampaign, ...changes };
    const idx = campaigns.findIndex(c => c.id === activeCampaign.id);
    if (idx !== -1) campaigns[idx] = { ...campaigns[idx], ...changes };

    const indicator = document.getElementById("activeCampaignName");
    if (indicator) indicator.textContent = name;

    items=items.map(i=>({...i,campaign:activeCampaign.name}));
    populateCampaignFilter();
    renderCards();
    renderPlayerTab();
    renderDMTools();
    alert("Campaign settings saved.");
  } catch (e) {
    console.error("Save campaign settings failed:", e);
    alert(`Could not save campaign settings: ${e.message}`);
  }
}

function renderDMTools() {
  ensureDMToolsUI();
  const panel = document.getElementById("dmToolsPanel");
  if (!panel) return;

  if (!activeCampaign || !canManageCampaign()) {
    panel.innerHTML = `<div class="dm-tool-card"><p>You do not have DM access to this campaign.</p></div>`;
    return;
  }

  panel.innerHTML = `
    <div class="dm-tools-grid">
      <section class="dm-tool-card dm-tool-card--wide">
        <h2>Campaign Overview</h2>
        <div id="dmOverviewStats" class="dm-overview-grid"></div>
      </section>

      <section class="dm-tool-card">
        <h2>Campaign Settings</h2>
        <div class="dm-settings-grid">
          <label>Campaign Name
            <input id="dmCampaignName" type="text" value="${escapeHtml(activeCampaign.name || "")}">
          </label>
          <label>Description
            <textarea id="dmCampaignDescription">${escapeHtml(activeCampaign.description || "")}</textarea>
          </label>
          <label class="dm-checkbox-row">
            <input id="dmDefaultVisible" type="checkbox" ${activeCampaign.defaultItemVisible !== false ? "checked" : ""}>
            New / unspecified items are visible to players by default
          </label>
          <div class="dm-tool-actions">
            <button id="dmSaveCampaignSettings" class="btn-primary" type="button">Save Settings</button>
          </div>
        </div>
      </section>

      <section class="dm-tool-card">
        <h2>Item Controls</h2>
        <p>Visibility, loot assignment and highlighting are campaign-scoped. Add catalogue copies or create your own campaign items in the Library. Set available quantities and player-looting permissions on each item.</p>
        <div class="dm-tool-actions">
          <button id="dmOpenLibrary" class="btn-primary" type="button">Open Library Controls</button>
        </div>
      </section>

      <section class="dm-tool-card dm-tool-card--wide">
        <h2>Members</h2>
        <p>Change a member between Player and DM, invite another person, or remove campaign access without deleting their character data.</p>
        <div class="dm-tool-actions">
          <button id="dmInviteMember" class="btn-primary" type="button">+ Invite Member</button>
        </div>
        <div id="dmMemberList" class="dm-member-list"></div>
      </section>

      <section class="dm-tool-card dm-tool-card--wide">
        <h2>Characters &amp; Items</h2>
        <div id="dmCharacterList"></div>
      </section>
      <section class="dm-tool-card dm-tool-card--wide">
        <h2>Pending Invitations</h2>
        <div id="dmPendingInvites" class="dm-invite-list"></div>
      </section>
              <!-- Loot rarity reference — collapsible -->
        <details class="admin-section loot-ref-panel">
          <summary>📖 Magic Item Rarity Progression by Level</summary>
          <div class="loot-ref-grid">

            <div class="loot-ref-card tier-1">
              <div class="loot-ref-header">
                <span class="loot-ref-tier">Tier 1</span>
                <span class="loot-ref-levels">Levels 1–4</span>
                <span class="loot-ref-subtitle">Local Heroes</span>
              </div>
              <div class="loot-ref-rarities">
                <span class="rarity-pill common">Common</span>
                <span class="rarity-pill uncommon">Uncommon</span>
              </div>
              <p class="loot-ref-desc">
                Players usually find their first <strong>Common</strong> items early on.
                Around levels 3–4 characters typically acquire their first
                <strong>Uncommon</strong> items — e.g.
                <em>+1 Weapon, Bag of Holding, Cloak of Protection</em>.
              </p>
            </div>

            <div class="loot-ref-card tier-2">
              <div class="loot-ref-header">
                <span class="loot-ref-tier">Tier 2</span>
                <span class="loot-ref-levels">Levels 5–10</span>
                <span class="loot-ref-subtitle">Heroes of the Realm</span>
              </div>
              <div class="loot-ref-rarities">
                <span class="rarity-pill uncommon">Uncommon</span>
                <span class="rarity-pill rare">Rare</span>
              </div>
              <p class="loot-ref-desc">
                <strong>Uncommon</strong> items become standard. Around levels 7–9
                characters start acquiring <strong>Rare</strong> items — e.g.
                <em>+2 Weapon, Flame Tongue, Ring of Protection</em>.
              </p>
            </div>

            <div class="loot-ref-card tier-3">
              <div class="loot-ref-header">
                <span class="loot-ref-tier">Tier 3</span>
                <span class="loot-ref-levels">Levels 11–16</span>
                <span class="loot-ref-subtitle">Masters of the Realm</span>
              </div>
              <div class="loot-ref-rarities">
                <span class="rarity-pill rare">Rare</span>
                <span class="rarity-pill very-rare">Very Rare</span>
              </div>
              <p class="loot-ref-desc">
                <strong>Rare</strong> items are common across the party. Around levels 11–13
                characters begin finding <strong>Very Rare</strong> items — e.g.
                <em>+3 Weapon, Staff of Power</em>.
              </p>
            </div>

            <div class="loot-ref-card tier-4">
              <div class="loot-ref-header">
                <span class="loot-ref-tier">Tier 4</span>
                <span class="loot-ref-levels">Levels 17–20</span>
                <span class="loot-ref-subtitle">Masters of the World</span>
              </div>
              <div class="loot-ref-rarities">
                <span class="rarity-pill very-rare">Very Rare</span>
                <span class="rarity-pill legendary">Legendary</span>
              </div>
              <p class="loot-ref-desc">
                <strong>Very Rare</strong> items are standard. Around levels 17+
                characters earn <strong>Legendary</strong> items — e.g.
                <em>Vorpal Sword, Holy Avenger, Staff of the Magi</em>.
              </p>
            </div>

          </div>
        </details>
    </div>`;

  renderDMOverview();
  renderDMMembers();
  renderDMInvites();
  renderDMCharacters();

  document.getElementById("dmSaveCampaignSettings")?.addEventListener("click", saveDMCampaignSettings);
  document.getElementById("dmInviteMember")?.addEventListener("click", () => openUserModal());
  document.getElementById("dmOpenLibrary")?.addEventListener("click", () => showTab("library"));
}

// Campaign character management. Include preserved characters of former members.
function renderDMCharacters() {
  const list = document.getElementById("dmCharacterList");
  if (!list) return;
  if (!activeCampaign || !canManageCampaign()) { list.replaceChildren(); return; }
  const groups = new Map();
  for (const member of campaignMembers) groups.set(member.uid || member.id, { member, chars: [] });
  for (const character of characters) {
    if (!groups.has(character.userId)) groups.set(character.userId, { member: { uid: character.userId }, chars: [] });
    groups.get(character.userId).chars.push(character);
  }
  list.innerHTML = [...groups.values()].map(({member, chars}) => `
    <section class="dm-character-group">
      <h3>${escapeHtml(memberLabel(member))}</h3>
      ${chars.length ? chars.map(c => {
        const saved = new Set(saves.filter(s => s.characterId === c.id).map(s => s.itemId)).size;
        const looted = inventory.filter(e=>e.characterId===c.id).reduce((n,e)=>n+e.quantity,0);
        return `<div class="admin-char-row">
          <div class="admin-char-info"><strong>${escapeHtml(c.name)}</strong>
            <span>${escapeHtml(c.class || "Adventurer")}</span>
            <span class="level-badge">${c.level ? `Lvl ${escapeHtml(c.level)}` : "No level"}</span></div>
          <div class="admin-char-btns">
            <button type="button" class="wish-view-btn btn-sm" data-dm-saved="${escapeHtml(c.id)}">Saved (${saved})</button>
            <button type="button" class="loot-button btn-sm" data-dm-loot="${escapeHtml(c.id)}">Looted (${looted})</button>
            <button type="button" class="edit-button btn-sm" data-dm-edit="${escapeHtml(c.id)}">Edit</button>
            <button type="button" class="cancel-button btn-sm" data-dm-delete="${escapeHtml(c.id)}" >${c.active===false?'Restore':'Archive'}</button>
          </div></div>`;
      }).join("") : '<p>No active characters.</p>'}
    </section>`).join("") || "<p>No characters or members in this campaign yet.</p>";
  for (const [action, handler] of Object.entries({
    saved: c => openWishModal(c.id, c.name),
    loot: c => openCharacterLoot(c.id),
    edit: c => openEditCharacterModal(c.id, c.name, c.class, c.level || ""),
    delete: c => deleteDMCampaignCharacter(c)
  })) {
    list.querySelectorAll(`[data-dm-${action}]`).forEach(button => button.addEventListener("click", () => {
      if (!activeCampaign || !canManageCampaign()) return;
      const c = characters.find(c => c.id === button.getAttribute(`data-dm-${action}`));
      if (c) handler(c);
    }));
  }
}

async function deleteDMCampaignCharacter(character) {
  if(!canManageCampaign())return;
  try {await deleteCampaignCharacter(character.id);}catch(error){alert(error.message);}
}

let characterLootView = null;
let characterLootReturnFocus = null;
function ensureCharacterLootDialog() {
  let dialog = document.getElementById("characterLootDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "characterLootDialog";
  dialog.className = "character-loot-dialog";
  dialog.setAttribute("aria-labelledby", "characterLootTitle");
  dialog.innerHTML = `<div class="character-loot-heading"><h2 id="characterLootTitle"></h2>
    <button type="button" class="cancel-button" id="closeCharacterLoot">Close</button></div>
    <div id="characterLootCards" class="character-loot-grid"></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector("#closeCharacterLoot").addEventListener("click", closeCharacterLoot);
  dialog.addEventListener("cancel", event => { event.preventDefault(); closeCharacterLoot(); });
  dialog.addEventListener("close", () => { characterLootView = null; });
  return dialog;
}
function openCharacterLoot(characterId) {
  if (!activeCampaign || !canManageCampaign()) return;
  if (!characters.some(c => c.id === characterId)) return;
  characterLootReturnFocus = document.activeElement;
  characterLootView = { campaignId: activeCampaign.id, characterId };
  const dialog = ensureCharacterLootDialog();
  refreshCharacterLoot();
  if (!dialog.open) dialog.showModal();
}
function closeCharacterLoot() {
  characterLootView = null;
  const dialog = document.getElementById("characterLootDialog");
  if (dialog?.open) dialog.close();
  dialog?.querySelector("#characterLootCards")?.replaceChildren();
  if (characterLootReturnFocus?.isConnected) characterLootReturnFocus.focus();
  characterLootReturnFocus = null;
}
function refreshCharacterLoot() {
  if(!characterLootView)return;
  const {campaignId,characterId}=characterLootView;
  const character=characters.find(c=>c.id===characterId);
  if(!canManageCampaign()||activeCampaign?.id!==campaignId||!character){closeCharacterLoot();return;}
  const grid=document.getElementById('characterLootCards');
  const entries=inventory.filter(e=>e.characterId===characterId&&e.quantity>0);
  document.getElementById('characterLootTitle').textContent=`${character.name}'s Looted Items (${entries.reduce((n,e)=>n+e.quantity,0)})`;
  grid.replaceChildren(...entries.map(e=>createCard(inventoryItem(e),{inventoryEntry:e})));
  if(!entries.length)grid.innerHTML='<p class="loot-empty">No looted items assigned to this character.</p>';
  observePendingImages(grid);
}
