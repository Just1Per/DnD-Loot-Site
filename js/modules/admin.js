"use strict";

// USER / CAMPAIGN MODALS + ADMIN TABLE
// Extracted from the working Step 7 app with behavior preserved.

// ─── USER MODAL ───────────────────────────────────────────────────────────────

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

function openUserModal(user = null) {
  const modal = document.getElementById("userModal");
  const saveBtn = document.getElementById("saveUserModal");
  const emailHelp = document.querySelector("#user-email + small");
  const roleChecks = document.querySelector(".role-checks");
  const roleTitle = roleChecks?.parentElement?.querySelector(":scope > span");
  const roleHelp = roleChecks?.parentElement?.querySelector(":scope > small");

  document.getElementById("user-name").value  = user?.name  || "";
  document.getElementById("user-email").value = user?.email || "";
  document.querySelectorAll(".role-checkbox").forEach(cb => {
    const r = user?.role || [];
    cb.checked = Array.isArray(r) ? r.includes(cb.value) : r === cb.value;
  });

  if (user) {
    document.getElementById("userModalTitle").textContent = "Edit User";
    modal.dataset.editId = user.id || "";
    modal.dataset.mode = "edit";
    setInviteRoleCheckboxMode(false);
    if (saveBtn) saveBtn.textContent = "Save User";
    if (emailHelp) emailHelp.textContent = "This is the authenticated account email.";
    if (roleTitle) roleTitle.textContent = "Roles";
    if (roleHelp) roleHelp.textContent = "Global roles control account capabilities. Inside each campaign, membership decides whether the user is a player or DM.";
  } else {
    if (!activeCampaign) {
      alert("Open a campaign before inviting a user.");
      return;
    }

    document.getElementById("userModalTitle").textContent = `Invite User to ${activeCampaign.name}`;
    modal.dataset.editId = "";
    modal.dataset.mode = "invite";
    setInviteRoleCheckboxMode(true);

    const playerCheckbox = document.querySelector('.role-checkbox[value="player"]');
    const dmCheckbox = document.querySelector('.role-checkbox[value="dm"]');
    if (playerCheckbox) playerCheckbox.checked = true;
    if (dmCheckbox) dmCheckbox.checked = false;

    if (saveBtn) saveBtn.textContent = "Create Invitation";
    if (emailHelp) {
      emailHelp.textContent = "No email is sent yet. When this email logs in, the pending campaign invitation appears automatically.";
    }
    if (roleTitle) roleTitle.textContent = "Campaign Role";
    if (roleHelp) roleHelp.textContent = "This role applies only inside the current campaign. It does not grant global admin access.";
  }

  modal.style.display = "flex";
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
  setInviteRoleCheckboxMode(false);
}

async function saveUserModal() {
  const modal  = document.getElementById("userModal");
  const editId = modal.dataset.editId;
  const mode   = modal.dataset.mode || (editId ? "edit" : "invite");
  const name   = document.getElementById("user-name").value.trim();
  const email  = document.getElementById("user-email").value.trim();

  if (!name || !email) {
    alert("Name and email are required.");
    return;
  }

  if (mode === "edit" && editId) {
    const role = [...document.querySelectorAll(".role-checkbox:checked")].map(cb => cb.value);
    const data = { name, email, emailLower: normalizeEmail(email), role };

    try {
      await updateDoc(doc(db, "users", editId), data);
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

  const emailLower = normalizeEmail(email);
  const selectedRoles = [...document.querySelectorAll(".role-checkbox:checked")].map(cb => cb.value);
  const campaignRole = selectedRoles.includes("dm") ? "dm" : "player";

  try {
    // Avoid duplicate pending invites without needing a composite index.
    const sameEmailSnap = await getDocs(
      query(collection(db, "campaignInvites"), where("emailLower", "==", emailLower))
    );
    const duplicate = sameEmailSnap.docs.some(d => {
      const data = d.data();
      return data.campaignId === activeCampaign.id && data.status === "pending";
    });

    if (duplicate) {
      alert("That email already has a pending invitation to this campaign.");
      return;
    }

    await addDoc(collection(db, "campaignInvites"), {
      name,
      email,
      emailLower,
      campaignId: activeCampaign.id,
      campaignName: activeCampaign.name,
      role: campaignRole,
      status: "pending",
      createdBy: auth.currentUser.uid,
      createdAt: Date.now()
    });

    closeUserModal();
    await loadActiveCampaignInvites();
    if (canManageCampaign()) renderDMTools();
    alert(`Invitation created for ${email}. It will appear when that email logs in.`);
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
  tbody.innerHTML = users.map(u => {
    const role      = Array.isArray(u.role) ? u.role.join(", ") : (u.role||"viewer");
    const userChars = characters.filter(c=>c.userId===u.id && c.active!==false);
    const charHTML  = userChars.length > 0
      ? userChars.map(c => {
          const tier       = getTier(c.level);
          const tierBadge  = tier
            ? `<span class="tier-badge" style="background:${tier.bg};color:${tier.color};border-color:${tier.color}">${tier.label}</span>`
            : "";
          const levelBadge = c.level
            ? `<span class="level-badge">Lvl ${c.level}</span>`
            : `<span class="level-badge level-badge--empty">No level</span>`;
          return `
            <div class="admin-char-row">
              <div class="admin-char-info">
                <span class="admin-char-name">${c.name}</span>
                <span class="admin-char-class">${c.class}</span>
                ${c.campaign?`<span class="char-campaign">${c.campaign}</span>`:""}
                ${levelBadge}${tierBadge}
              </div>
              <div class="admin-char-btns">
                <button class="wish-view-btn btn-sm" type="button"
                  data-char-id="${c.id}" data-char-name="${c.name}">Saved</button>
                <button class="edit-button btn-sm" type="button"
                  data-edit-char="${c.id}" data-char-name="${c.name}"
                  data-char-class="${c.class}" data-char-level="${c.level||""}">Edit</button>
                <button class="cancel-button btn-sm" type="button"
                  data-delete-char="${c.id}" data-char-name="${c.name}">Delete</button>
              </div>
            </div>`;
        }).join("")
      : `<span class="no-chars">No characters</span>`;

    return `
      <tr>
        <td>${u.name||"—"}</td>
        <td>${u.email||"—"}</td>
        <td><span class="role-badge">${role}</span></td>
        <td class="chars-cell">${charHTML}</td>
        <td>
          <div class="table-actions">
            <button class="edit-button btn-sm" type="button" data-edit-user="${u.id}">Edit</button>
            <button class="cancel-button btn-sm" type="button" data-delete-user="${u.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", () => openUserModal(users.find(u=>u.id===btn.dataset.editUser)));
  });

  tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this user? Their characters and saves in the active campaign will also be removed.")) return;
      const uid = btn.dataset.deleteUser;
      if (activeCampaign) {
        const userChars = characters.filter(c => c.userId === uid);
        const userCharIds = new Set(userChars.map(c => c.id));

        for (const c of userChars) {
          const charSaves = saves.filter(s => s.characterId === c.id);

          await Promise.all(charSaves.map(s =>
            deleteDoc(doc(db, "campaigns", activeCampaign.id, "saves", s.id))
          ));

          const ownedItemIds = Object.entries(itemState)
            .filter(([, state]) => state?.owner === c.id)
            .map(([itemId]) => itemId);

          await Promise.all(ownedItemIds.map(itemId =>
            persistItemState(itemId, { owner: null })
          ));

          await deleteDoc(
            doc(db, "campaigns", activeCampaign.id, "characters", c.id)
          );
        }

        characters = characters.filter(c => c.userId !== uid);
        saves = saves.filter(s => !userCharIds.has(s.characterId));
      }
      await deleteDoc(doc(db,"users",uid));
      users = users.filter(u=>u.id!==uid);
      renderUserTable(); renderAdminStats(); renderCards();
    });
  });

  tbody.querySelectorAll("[data-edit-char]").forEach(btn => {
    btn.addEventListener("click", () =>
      openEditCharacterModal(btn.dataset.editChar, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel)
    );
  });

  tbody.querySelectorAll("[data-delete-char]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete "${btn.dataset.charName}"?`)) return;
      const cid = btn.dataset.deleteChar;
      if (activeCampaign) {
        const ownedItemIds = Object.entries(itemState)
          .filter(([, state]) => state?.owner === cid)
          .map(([itemId]) => itemId);

        if (ownedItemIds.length && !canManageCampaign()) {
          alert("This character still has assigned loot. Ask the DM to unassign the loot before deleting the character.");
          return;
        }

        const charSaves = saves.filter(s => s.characterId === cid);
        await Promise.all(charSaves.map(s =>
          deleteDoc(doc(db, "campaigns", activeCampaign.id, "saves", s.id))
        ));

        if (ownedItemIds.length) {
          await Promise.all(ownedItemIds.map(itemId =>
            persistItemState(itemId, { owner: null })
          ));
        }

        await deleteDoc(
          doc(db, "campaigns", activeCampaign.id, "characters", cid)
        );
      }
      saves      = saves.filter(s=>s.characterId!==cid);
      characters = characters.filter(c=>c.id!==cid);
      if (selectedCharacter?.id===cid) selectedCharacter=null;
      populateOwnerFilter(); renderUserTable(); renderAdminStats(); renderCards();
    });
  });

  tbody.querySelectorAll(".wish-view-btn").forEach(btn => {
    btn.addEventListener("click", () => openWishModal(btn.dataset.charId, btn.dataset.charName));
  });
}

function renderAdminStats() {
  const el = document.getElementById("adminStats");
  if (!el) return;
  const playerCount = users.filter(u=>{
    const r=u.role; return Array.isArray(r)?r.some(x=>["player","dm","admin"].includes(x)):["player","dm","admin"].includes(r);
  }).length;
  const states = items.map(i => getItemState(i.id));
  el.innerHTML = `
    <div class="stat-card"><span class="stat-num">${items.length}</span><span class="stat-label">Total Items</span></div>
    <div class="stat-card"><span class="stat-num">${states.filter(s=>s.looted).length}</span><span class="stat-label">Looted</span></div>
    <div class="stat-card"><span class="stat-num">${states.filter(s=>s.highlighted).length}</span><span class="stat-label">Highlighted</span></div>
    <div class="stat-card"><span class="stat-num">${saves.length}</span><span class="stat-label">Saved</span></div>
    <div class="stat-card"><span class="stat-num">${users.length}</span><span class="stat-label">Users</span></div>
    <div class="stat-card"><span class="stat-num">${playerCount}</span><span class="stat-label">Players</span></div>
    <div class="stat-card"><span class="stat-num">${characters.length}</span><span class="stat-label">Characters</span></div>
    <div class="stat-card"><span class="stat-num">${campaigns.length}</span><span class="stat-label">Campaigns</span></div>
    <div class="stat-card"><span class="stat-num">${dmRequests.filter(r => r.status === "pending").length}</span><span class="stat-label">DM Requests</span></div>
  `;
}

