"use strict";

// USER / CAMPAIGN MODALS + ADMIN TABLE
// Extracted from the working Step 7 app with behavior preserved.

// ─── USER MODAL ───────────────────────────────────────────────────────────────

let inviteDirectoryUsers = [];

function setInviteRoleCheckboxMode(inviteMode) {
  const checkboxes = [...document.querySelectorAll(".role-checkbox")];

  checkboxes.forEach(cb => {
    const label = cb.closest("label");
    const isCampaignRole = ["player", "dm"].includes(cb.value);

    if (inviteMode) {
      if (label) label.style.display = isCampaignRole ? "" : "none";
      cb.onchange = isCampaignRole
        ? () => {
            if (cb.checked) {
              checkboxes.forEach(other => {
                if (other !== cb && ["player", "dm"].includes(other.value)) other.checked = false;
              });
            }
          }
        : null;
    } else {
      if (label) label.style.display = "";
      cb.onchange = null;
    }
  });
}

async function loadRegisteredUserDirectory() {
  try {
    const snap = await getDocs(collection(db, "userDirectory"));
    inviteDirectoryUsers = snap.docs
      .map(d => ({ id: d.id, uid: d.id, ...d.data() }))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return true;
  } catch (e) {
    inviteDirectoryUsers = [];
    console.warn("Registered-user directory unavailable:", e?.message || e);
    return false;
  }
}

function clearRegisteredInviteSelection({ keepSearch = false } = {}) {
  const modal = document.getElementById("userModal");
  const selected = document.getElementById("registeredUserSelected");
  const manual = document.getElementById("manualInviteFields");
  const search = document.getElementById("registeredUserSearch");

  if (modal) delete modal.dataset.targetUid;
  if (selected) {
    selected.style.display = "none";
    selected.innerHTML = "";
  }
  if (manual) manual.style.display = "contents";
  if (!keepSearch && search) search.value = "";
}

function selectRegisteredInviteUser(uid) {
  const user = inviteDirectoryUsers.find(entry => entry.uid === uid);
  if (!user) return;

  const modal = document.getElementById("userModal");
  const selected = document.getElementById("registeredUserSelected");
  const manual = document.getElementById("manualInviteFields");
  const results = document.getElementById("registeredUserResults");

  modal.dataset.targetUid = user.uid;
  document.getElementById("user-name").value = user.name || "Registered Player";
  document.getElementById("user-email").value = "";

  if (manual) manual.style.display = "none";
  if (results) results.innerHTML = "";
  if (selected) {
    selected.style.display = "block";
    selected.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <strong>${escapeHtml(user.name || "Registered Player")}</strong><br>
          <small>${escapeHtml(user.emailHint || `Account ${user.uid.slice(0, 8)}…`)}</small>
        </div>
        <button type="button" class="cancel-button btn-sm" id="clearRegisteredUserBtn">Change</button>
      </div>`;
    selected.querySelector("#clearRegisteredUserBtn")?.addEventListener("click", () => {
      clearRegisteredInviteSelection({ keepSearch: true });
      document.getElementById("user-name").value = "";
      renderRegisteredUserResults();
      document.getElementById("registeredUserSearch")?.focus();
    });
  }
}

function renderRegisteredUserResults() {
  const results = document.getElementById("registeredUserResults");
  const search = document.getElementById("registeredUserSearch");
  const modal = document.getElementById("userModal");
  if (!results || !search || modal?.dataset.mode !== "invite") return;
  if (modal.dataset.targetUid) return;

  const term = String(search.value || "").trim().toLowerCase();
  const memberIds = new Set(campaignMembers.map(member => member.uid || member.id));
  const pendingIds = new Set(
    campaignInvites
      .filter(invite => invite.status === "pending" && invite.targetUid)
      .map(invite => invite.targetUid)
  );

  const matches = inviteDirectoryUsers
    .filter(user => user.uid !== auth.currentUser?.uid)
    .filter(user => !memberIds.has(user.uid))
    .filter(user => !pendingIds.has(user.uid))
    .filter(user => {
      if (!term) return true;
      return String(user.name || "").toLowerCase().includes(term)
        || String(user.emailHint || "").toLowerCase().includes(term)
        || String(user.uid || "").toLowerCase().includes(term);
    })
    .slice(0, 20);

  if (!matches.length) {
    results.innerHTML = `<small style="display:block;padding:8px 0">No available registered users found. You can still invite by email below.</small>`;
    return;
  }

  results.innerHTML = matches.map(user => `
    <button type="button" data-directory-uid="${escapeHtml(user.uid)}"
      style="display:flex;width:100%;text-align:left;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;margin:4px 0;border:1px solid #d8cbb7;border-radius:7px;background:#fff;cursor:pointer">
      <span>
        <strong>${escapeHtml(user.name || "Registered Player")}</strong><br>
        <small>${escapeHtml(user.emailHint || `Account ${user.uid.slice(0, 8)}…`)}</small>
      </span>
      <span aria-hidden="true">Select</span>
    </button>`).join("");

  results.querySelectorAll("[data-directory-uid]").forEach(button => {
    button.addEventListener("click", () => selectRegisteredInviteUser(button.dataset.directoryUid));
  });
}

async function openUserModal(user = null) {
  const modal = document.getElementById("userModal");
  const saveBtn = document.getElementById("saveUserModal");
  const emailHelp = document.querySelector("#user-email + small");
  const roleChecks = document.querySelector(".role-checks");
  const roleTitle = roleChecks?.parentElement?.querySelector(":scope > span");
  const roleHelp = roleChecks?.parentElement?.querySelector(":scope > small");
  const registeredSection = document.getElementById("registeredInviteSection");
  const registeredSearch = document.getElementById("registeredUserSearch");
  const registeredResults = document.getElementById("registeredUserResults");
  const manualFields = document.getElementById("manualInviteFields");

  clearRegisteredInviteSelection();
  document.getElementById("user-name").value  = user?.name  || "";
  document.getElementById("user-email").value = user?.email || "";
  document.querySelectorAll(".role-checkbox").forEach(cb => {
    const r = user?.role || [];
    cb.checked = Array.isArray(r) ? r.includes(cb.value) : r === cb.value;
  });

  if (user) {
    if (!isAdmin()) return;
    document.getElementById("userModalTitle").textContent = "Edit User";
    modal.dataset.editId = user.id || "";
    modal.dataset.mode = "edit";
    delete modal.dataset.targetUid;
    setInviteRoleCheckboxMode(false);
    if (registeredSection) registeredSection.style.display = "none";
    if (manualFields) manualFields.style.display = "contents";
    if (saveBtn) saveBtn.textContent = "Save User";
    if (emailHelp) emailHelp.textContent = "This is the authenticated account email.";
    if (roleTitle) roleTitle.textContent = "Roles";
    if (roleHelp) roleHelp.textContent = "Global roles control account capabilities. Inside each campaign, membership decides whether the user is a player or DM.";
    modal.style.display = "flex";
    return;
  }

  if (!activeCampaign) {
    alert("Open a campaign before inviting a user.");
    return;
  }

  document.getElementById("userModalTitle").textContent = `Invite User to ${activeCampaign.name}`;
  modal.dataset.editId = "";
  modal.dataset.mode = "invite";
  setInviteRoleCheckboxMode(true);
  if (registeredSection) registeredSection.style.display = "block";
  if (manualFields) manualFields.style.display = "contents";

  const playerCheckbox = document.querySelector('.role-checkbox[value="player"]');
  const dmCheckbox = document.querySelector('.role-checkbox[value="dm"]');
  if (playerCheckbox) playerCheckbox.checked = true;
  if (dmCheckbox) dmCheckbox.checked = false;

  if (saveBtn) saveBtn.textContent = "Create Invitation";
  if (emailHelp) emailHelp.textContent = "Enter the email this person uses to sign in.";
  if (roleTitle) roleTitle.textContent = "Campaign Role";
  if (roleHelp) roleHelp.textContent = "This role applies only inside the current campaign. It does not grant global admin access.";

  if (registeredResults) registeredResults.innerHTML = `<small>Loading registered users…</small>`;
  modal.style.display = "flex";

  if (registeredSearch && !registeredSearch.dataset.bound) {
    registeredSearch.dataset.bound = "1";
    registeredSearch.addEventListener("input", renderRegisteredUserResults);
  }

  try {
    await Promise.all([loadRegisteredUserDirectory(), loadCampaignMembers(), loadActiveCampaignInvites()]);
    renderRegisteredUserResults();
  } catch (e) {
    console.error("Load registered users failed:", e);
    if (registeredResults) {
      registeredResults.innerHTML = `<small>Registered-user search is unavailable right now. Invite by email below instead.</small>`;
    }
  }
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
  clearRegisteredInviteSelection();
  setInviteRoleCheckboxMode(false);
}

async function saveUserModal() {
  const modal  = document.getElementById("userModal");
  const editId = modal.dataset.editId;
  const mode   = modal.dataset.mode || (editId ? "edit" : "invite");
  const targetUid = modal.dataset.targetUid || "";
  const name   = document.getElementById("user-name").value.trim();
  const email  = document.getElementById("user-email").value.trim();

  if (mode === "edit" && editId) {
    if (!isAdmin()) return;
    if (!name || !email) {
      alert("Name and email are required.");
      return;
    }

    const role = [...document.querySelectorAll(".role-checkbox:checked")].map(cb => cb.value);
    const data = { name, email, emailLower: normalizeEmail(email), role };

    try {
      await updateDoc(doc(db, "users", editId), data);
      await syncUserDirectoryEntry(editId, data);
      const idx = users.findIndex(u => u.id === editId);
      if (idx !== -1) users[idx] = { ...users[idx], ...data };
      closeUserModal();
      renderUserTable();
      renderAdminStats();
    } catch (e) {
      console.error("Save user failed:", e);
      alert(`Could not save user: ${e.message}`);
    }
    return;
  }

  if (!activeCampaign) {
    alert("Open a campaign before inviting a user.");
    return;
  }

  if (!targetUid && (!name || !email)) {
    alert("Select a registered user, or enter a name and email address.");
    return;
  }

  const selectedRoles = [...document.querySelectorAll(".role-checkbox:checked")].map(cb => cb.value);
  const campaignRole = selectedRoles.includes("dm") ? "dm" : "player";
  const emailLower = targetUid ? "" : normalizeEmail(email);

  try {
    const campaignInviteSnap = await getDocs(
      query(collection(db, "campaignInvites"), where("campaignId", "==", activeCampaign.id))
    );

    const duplicate = campaignInviteSnap.docs.some(d => {
      const data = d.data();
      if (data.status !== "pending") return false;
      if (targetUid) return data.targetUid === targetUid;
      return normalizeEmail(data.emailLower) === emailLower;
    });

    if (duplicate) {
      alert("That user already has a pending invitation to this campaign.");
      return;
    }

    if (targetUid && campaignMembers.some(member => (member.uid || member.id) === targetUid)) {
      alert("That user is already a member of this campaign.");
      return;
    }

    const inviteData = {
      name: name || "Registered Player",
      email: targetUid ? "" : email,
      emailLower,
      campaignId: activeCampaign.id,
      campaignName: activeCampaign.name,
      role: campaignRole,
      status: "pending",
      createdBy: auth.currentUser.uid,
      createdAt: Date.now()
    };
    if (targetUid) inviteData.targetUid = targetUid;

    await addDoc(collection(db, "campaignInvites"), inviteData);

    closeUserModal();
    await loadActiveCampaignInvites();
    if (canManageCampaign()) renderDMTools();
    alert(targetUid
      ? `Invitation created for ${inviteData.name}. It will appear on their dashboard.`
      : `Invitation created for ${email}. It will appear when that email logs in.`);
  } catch (e) {
    console.error("Create invitation failed:", e);
    alert(`Could not create invitation: ${e.message}`);
  }
}

// ─── CAMPAIGN MODAL ───────────────────────────────────────────────────────────

function openCampaignModal(campaign = null) {
  document.getElementById("campaignModalTitle").textContent = campaign ? "Edit Campaign" : "Create Campaign";
  document.getElementById("campaign-name").value        = campaign?.name        || "";
  document.getElementById("campaign-description").value = campaign?.description || "";
  document.getElementById("campaignModal").dataset.editId = campaign?.id || "";
  document.getElementById("campaignModal").style.display  = "flex";
}

function closeCampaignModal() { document.getElementById("campaignModal").style.display = "none"; }

async function saveCampaignModal() {
  const editId = document.getElementById("campaignModal").dataset.editId;
  const name   = document.getElementById("campaign-name").value.trim();

  if (!name) {
    alert("Campaign name is required.");
    return;
  }

  const description = document.getElementById("campaign-description").value.trim();

  if (editId) {
    await updateDoc(
      doc(db, "campaigns", editId),
      { name, description, updatedAt: Date.now() }
    );

    const idx = campaigns.findIndex(c => c.id === editId);
    if (idx !== -1) {
      campaigns[idx] = { ...campaigns[idx], name, description, updatedAt: Date.now() };
    }

  } else {
    const data = {
      name,
      description,
      dmId: auth.currentUser.uid,
      ownerId: auth.currentUser.uid,
      defaultItemVisible: true,
      inventoryVersion: 2,
      created: Date.now(),
      updatedAt: Date.now()
    };

    const newRef = await addDoc(collection(db, "campaigns"), data);

    // Authoritative membership + fast per-user index.
    await Promise.all([
      setDoc(
        doc(db, "campaigns", newRef.id, "members", auth.currentUser.uid),
        {
          uid: auth.currentUser.uid,
          role: "dm",
          status: "active",
          joinedAt: Date.now()
        },
        { merge: true }
      ),
      setDoc(
        doc(db, "users", auth.currentUser.uid, "campaigns", newRef.id),
        {
          role: "dm",
          status: "active",
          joinedAt: Date.now()
        },
        { merge: true }
      )
    ]);

    campaigns.push({
      id: newRef.id,
      membershipRole: "dm",
      ...data
    });
  }

  closeCampaignModal();
  renderCampaignSelector();
}

// ─── ADMIN: USER TABLE ────────────────────────────────────────────────────────

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;
  if (!isAdmin()) { tbody.replaceChildren(); return; }
  tbody.innerHTML = users.map(u => {
    const role = Array.isArray(u.role) ? u.role.join(", ") : (u.role || "viewer");
    return `<tr><td>${escapeHtml(u.name || "—")}</td><td>${escapeHtml(u.email || "—")}</td>
      <td><span class="role-badge">${escapeHtml(role)}</span></td>
      <td><button class="edit-button btn-sm" type="button" data-edit-user="${escapeHtml(u.id)}">Edit</button></td></tr>`;
  }).join("") || `<tr><td colspan="4">No registered users found.</td></tr>`;
  tbody.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (isAdmin()) openUserModal(users.find(u => u.id === btn.dataset.editUser));
    });
  });
}

// Kept for callers in the account/approval workflow; campaign stats live in DM Tools.
function renderAdminStats() {}

let adminReturnTab = "library";
function openAdminView() {
  if (!isAdmin() || !auth.currentUser) return;
  adminReturnTab = document.querySelector(".tabs .tab.active")?.dataset.tab || "library";
  hideAllScreens();
  document.getElementById("tab-admin").style.display = "block";
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("adminTab").setAttribute("aria-pressed", "true");
  renderUserTable();
  renderAdminDMRequests();
}
function closeAdminView() {
  document.getElementById("adminTab").setAttribute("aria-pressed", "false");
  if (activeCampaign) { showMainApp(); showTab(adminReturnTab); }
  else showCampaignSelector();
}
