"use strict";

// CAMPAIGN INVITATIONS + CAMPAIGN LOADING
// Extracted from the working Step 7 app with behavior preserved.

// ─── CAMPAIGN INVITATIONS ───────────────────────────────────────────────────

async function loadMyPendingInvites() {
  const emailLower = normalizeEmail(auth.currentUser?.email);
  if (!emailLower) {
    pendingInvites = [];
    return;
  }

  // Query only by the authenticated email. Status is filtered client-side so
  // this uses the default single-field Firestore index. Security Rules still
  // ensure a user can only read invitations addressed to their own email.
  const snap = await getDocs(
    query(collection(db, "campaignInvites"), where("emailLower", "==", emailLower))
  );

  pendingInvites = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(invite => invite.status === "pending");
}

async function loadActiveCampaignInvites() {
  if (!activeCampaign || !canManageCampaign()) {
    campaignInvites = [];
    renderAdminInvites();
    renderDMInvites();
    return;
  }

  const snap = await getDocs(
    query(collection(db, "campaignInvites"), where("campaignId", "==", activeCampaign.id))
  );

  campaignInvites = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(invite => invite.status === "pending");

  renderAdminInvites();
  renderDMInvites();
}

async function acceptCampaignInvite(inviteId) {
  const invite = pendingInvites.find(i => i.id === inviteId);
  const uid = auth.currentUser?.uid;
  const emailLower = normalizeEmail(auth.currentUser?.email);

  if (!invite || !uid) return;
  if (normalizeEmail(invite.emailLower) !== emailLower) {
    alert("This invitation belongs to a different email address.");
    return;
  }

  const now = Date.now();
  const batch = writeBatch(db);

  batch.set(
    doc(db, "campaigns", invite.campaignId, "members", uid),
    {
      uid,
      displayName: invite.name || currentUser?.name || auth.currentUser?.email || "Member",
      role: invite.role === "dm" ? "dm" : "player",
      status: "active",
      joinedAt: now,
      inviteId: invite.id
    },
    { merge: true }
  );

  batch.set(
    doc(db, "users", uid, "campaigns", invite.campaignId),
    {
      role: invite.role === "dm" ? "dm" : "player",
      status: "active",
      joinedAt: now,
      inviteId: invite.id
    },
    { merge: true }
  );

  batch.update(
    doc(db, "campaignInvites", invite.id),
    {
      status: "accepted",
      acceptedBy: uid,
      acceptedAt: now
    }
  );

  try {
    await batch.commit();
    await Promise.all([loadMyPendingInvites(), loadCampaigns()]);
    await loadDashboardCharacters();
    renderCampaignSelector();
  } catch (e) {
    console.error("Accept invitation failed:", e);
    alert(`Could not accept invitation: ${e.message}`);
  }
}

async function declineCampaignInvite(inviteId) {
  const invite = pendingInvites.find(i => i.id === inviteId);
  const uid = auth.currentUser?.uid;
  if (!invite || !uid) return;

  if (!confirm(`Decline the invitation to "${invite.campaignName || "this campaign"}"?`)) return;

  try {
    await updateDoc(doc(db, "campaignInvites", invite.id), {
      status: "declined",
      declinedBy: uid,
      declinedAt: Date.now()
    });
    pendingInvites = pendingInvites.filter(i => i.id !== invite.id);
    renderCampaignSelector();
  } catch (e) {
    console.error("Decline invitation failed:", e);
    alert(`Could not decline invitation: ${e.message}`);
  }
}

async function cancelCampaignInvite(inviteId) {
  const invite = campaignInvites.find(i => i.id === inviteId);
  if (!invite) return;

  if (!confirm(`Cancel the invitation for ${invite.name || invite.email}?`)) return;

  try {
    await updateDoc(doc(db, "campaignInvites", invite.id), {
      status: "canceled",
      canceledBy: auth.currentUser.uid,
      canceledAt: Date.now()
    });
    campaignInvites = campaignInvites.filter(i => i.id !== invite.id);
    renderAdminInvites();
    renderDMInvites();
  } catch (e) {
    console.error("Cancel invitation failed:", e);
    alert(`Could not cancel invitation: ${e.message}`);
  }
}

function ensureAdminInvitePanel() {
  const addBtn = document.getElementById("openAddUserBtn");
  if (!addBtn) return null;

  // Keep the existing HTML untouched: V2.4 injects a small pending-invites
  // panel directly below the old Add User button.
  addBtn.textContent = "+ Invite User";

  let panel = document.getElementById("adminInvitePanel");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "adminInvitePanel";
  panel.style.margin = "0 0 16px";
  panel.style.padding = "12px";
  panel.style.border = "1px solid #c8b89a";
  panel.style.borderRadius = "8px";
  panel.style.background = "#fdfbf7";
  addBtn.insertAdjacentElement("afterend", panel);
  return panel;
}

function renderAdminInvites() {
  const panel = ensureAdminInvitePanel();
  if (!panel || !activeCampaign || !isAdmin()) return;

  const rows = campaignInvites.length
    ? campaignInvites.map(invite => `
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9dfcf">
          <div style="min-width:0">
            <strong>${escapeHtml(invite.name || invite.email || "Pending user")}</strong><br>
            <small>${escapeHtml(invite.email || "")} · <span class="role-badge">${escapeHtml(invite.role || "player")}</span></small>
          </div>
          <button class="cancel-button btn-sm" type="button" data-cancel-invite="${invite.id}">Cancel</button>
        </div>`).join("")
    : `<p class="admin-section-sub" style="margin:0">No pending invitations for this campaign.</p>`;

  panel.innerHTML = `
    <div style="font-family:Cinzel,serif;font-weight:700;color:#5c1d1d;margin-bottom:8px">Pending Invitations</div>
    ${rows}
  `;

  panel.querySelectorAll("[data-cancel-invite]").forEach(btn => {
    btn.addEventListener("click", () => cancelCampaignInvite(btn.dataset.cancelInvite));
  });
}

/**
 * Fast campaign lookup.
 *
 * Authoritative membership:
 *   campaigns/{campaignId}/members/{uid}
 *
 * Fast per-user index:
 *   users/{uid}/campaigns/{campaignId}
 *
 * The migration creates both. Foundation V2.4 intentionally removes the
 * old "read every campaign then test membership" fallback because strict
 * production rules correctly reject that broad read for normal users.
 */
async function loadCampaigns() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    campaigns = [];
    return;
  }

  if (isAdmin()) {
    const snap = await getDocs(collection(db, "campaigns"));
    campaigns = snap.docs.map(d => ({
      id: d.id,
      membershipRole: "admin",
      ...d.data()
    }));
    return;
  }

  const campaignMap = new Map();

  // Primary path: tiny per-user membership index.
  const indexSnap = await getDocs(collection(db, "users", uid, "campaigns"));
  const refs = indexSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.status === "active");

  const indexedCampaignDocs = await Promise.all(
    refs.map(r => getDoc(doc(db, "campaigns", r.id)))
  );

  indexedCampaignDocs.forEach((snap, idx) => {
    if (!snap.exists()) return;
    const refData = refs[idx];
    campaignMap.set(snap.id, {
      id: snap.id,
      ...snap.data(),
      membershipRole: refData.role || "player"
    });
  });

  // Foundation V2.4 uses the per-user index for every non-admin account,
  // including approved DMs. Campaign creation writes that index immediately,
  // and migration-v2 creates it for legacy campaigns.

  // No broad legacy fallback here. Normal users may only fetch campaigns
  // referenced by their own users/{uid}/campaigns index. Pending invitations
  // are loaded separately from campaignInvites.

  campaigns = [...campaignMap.values()]
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

async function importItemsIfEmpty() {
  // limit(2) matters because Step 7 stores one metadata document in /items.
  const snap = await getDocs(query(collection(db, "items"), limit(2)));
  const hasRealItem = snap.docs.some(d => d.id !== CATALOG_META_ID);
  if (hasRealItem) return;

  console.log("Firestore item catalogue empty — importing items…");
  const { items: sourceItems } = await import("./items.js");

  for (const sourceItem of sourceItems) {
    const {
      looted: _looted,
      highlighted: _highlighted,
      owner: _owner,
      receivedDate: _receivedDate,
      ...masterItem
    } = sourceItem;

    await setDoc(doc(db, "items", sourceItem.id), masterItem, { merge: true });
  }

  console.log("Item import complete.");
  // The subsequent catalogue load will populate items before normal use.
  // Metadata is created after that first load by seedCatalogMetaIfNeeded().
}


