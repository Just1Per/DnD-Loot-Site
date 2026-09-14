"use strict";

// GLOBAL DM APPLICATION / APPROVAL
// Extracted from the working Step 7 app with behavior preserved.

// ─── GLOBAL DM APPLICATION / APPROVAL ────────────────────────────────────────
// Roadmap Step 4:
// - "dm" on users/{uid}.role is a GLOBAL capability: it allows creating campaigns.
// - It does NOT make someone a DM inside every campaign.
// - Campaign authority still comes from campaigns/{campaignId}/members/{uid}.

function normalizedRoles(user) {
  const value = user?.role;
  if (Array.isArray(value)) return [...new Set(value.filter(Boolean))];
  if (typeof value === "string" && value) return [value];
  return ["viewer"];
}

function rolesWithDM(user) {
  const roles = normalizedRoles(user).filter(r => r !== "viewer");
  if (!roles.includes("dm")) roles.push("dm");
  return roles.length ? roles : ["dm"];
}

function rolesWithoutDM(user) {
  const roles = normalizedRoles(user).filter(r => r !== "dm");
  return roles.length ? roles : ["viewer"];
}

async function loadMyDMRequest() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    myDMRequest = null;
    return;
  }

  const snap = await getDoc(doc(db, "dmRequests", uid));
  myDMRequest = snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function loadDMRequests() {
  if (!isAdmin()) {
    dmRequests = [];
    return;
  }

  const snap = await getDocs(collection(db, "dmRequests"));
  dmRequests = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const rank = { pending: 0, approved: 1, rejected: 2, revoked: 3, withdrawn: 4 };
      const ar = rank[a.status] ?? 9;
      const br = rank[b.status] ?? 9;
      if (ar !== br) return ar - br;
      return (b.submittedAt || 0) - (a.submittedAt || 0);
    });
}

function ensureDMApplicationPanel() {
  const dashboardHost = document.getElementById("dashboardDmAccess");
  let panel = document.getElementById("dmApplicationPanel");

  // Step 6: keep DM application/account status in the dashboard sidebar.
  // If an older DOM is still being used, fall back to the campaign selector.
  if (dashboardHost) {
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "dmApplicationPanel";
      panel.className = "dm-application-panel";
    }
    if (panel.parentElement !== dashboardHost) dashboardHost.appendChild(panel);
    return panel;
  }

  const list = document.getElementById("campaignSelectorList");
  if (!list) return null;
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "dmApplicationPanel";
  panel.className = "dm-application-panel";

  const actions = document.getElementById("dmSelectorActions");
  if (actions) actions.insertAdjacentElement("beforebegin", panel);
  else list.insertAdjacentElement("afterend", panel);
  return panel;
}

function renderDMApplicationPanel() {
  const panel = ensureDMApplicationPanel();
  if (!panel || !auth.currentUser) return;

  // Admins and already-approved DMs have campaign-creation capability already.
  if (isAdmin() || hasRole("dm")) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  const request = myDMRequest;
  const status = request?.status || "none";
  const reviewNote = request?.reviewNote
    ? `<div class="dm-application-note"><strong>Admin note:</strong> ${escapeHtml(request.reviewNote)}</div>`
    : "";

  if (status === "pending") {
    panel.innerHTML = `
      <div class="dm-application-card">
        <div class="dm-application-heading">
          <div>
            <strong>Dungeon Master application pending</strong>
            <span>Your application is waiting for an administrator to review it.</span>
          </div>
          <span class="role-badge">Pending</span>
        </div>
        ${request.message ? `<p>${escapeHtml(request.message)}</p>` : ""}
        <div class="dm-application-actions">
          <button type="button" class="dm-approval-action" data-refresh-dm-request>Refresh status</button>
          <button type="button" class="dm-approval-action dm-danger-btn" data-withdraw-dm-request>Withdraw</button>
        </div>
      </div>`;
  } else if (status === "approved") {
    panel.innerHTML = `
      <div class="dm-application-card">
        <div class="dm-application-heading">
          <div>
            <strong>Dungeon Master application approved</strong>
            <span>Your account has been approved to create campaigns.</span>
          </div>
          <span class="role-badge">Approved</span>
        </div>
        ${reviewNote}
        <div class="dm-application-actions">
          <button type="button" class="btn-primary" data-refresh-dm-request>Refresh account access</button>
        </div>
      </div>`;
  } else {
    const rejectedCopy = status === "rejected"
      ? `<div class="dm-application-note"><strong>Previous application:</strong> Not approved.${request?.reviewNote ? ` ${escapeHtml(request.reviewNote)}` : ""}</div>`
      : status === "revoked"
        ? `<div class="dm-application-note"><strong>DM access was revoked.</strong>${request?.reviewNote ? ` ${escapeHtml(request.reviewNote)}` : ""} You may submit a new application.</div>`
        : status === "withdrawn"
          ? `<div class="dm-application-note">Your previous application was withdrawn. You may apply again.</div>`
          : "";

    panel.innerHTML = `
      <div class="dm-application-card">
        <div class="dm-application-heading">
          <div>
            <strong>Want to run your own campaign?</strong>
            <span>Apply for global Dungeon Master access. Approval lets you create campaigns, but does not give you DM rights in campaigns owned by other people.</span>
          </div>
          <span class="role-badge">DM Access</span>
        </div>
        ${rejectedCopy}
        <label class="dm-application-label">
          Why do you want to become a DM?
          <textarea id="dm-request-message" rows="3" maxlength="1000" placeholder="Tell us briefly what you want to run...">${escapeHtml(request?.message || "")}</textarea>
        </label>
        <label class="dm-application-label">
          Experience <span>(optional)</span>
          <textarea id="dm-request-experience" rows="2" maxlength="1000" placeholder="Previous DM/player experience, if any...">${escapeHtml(request?.experience || "")}</textarea>
        </label>
        <div class="dm-application-actions">
          <button type="button" class="btn-primary" data-submit-dm-request>
            ${status === "rejected" || status === "withdrawn" || status === "revoked" ? "Reapply for DM Access" : "Apply for DM Access"}
          </button>
        </div>
      </div>`;
  }

  panel.querySelector("[data-submit-dm-request]")?.addEventListener("click", submitDMRequest);
  panel.querySelector("[data-withdraw-dm-request]")?.addEventListener("click", withdrawDMRequest);
  panel.querySelectorAll("[data-refresh-dm-request]").forEach(btn => {
    btn.addEventListener("click", refreshDMApplicationStatus);
  });
}

async function submitDMRequest() {
  const uid = auth.currentUser?.uid;
  if (!uid || isAdmin() || hasRole("dm")) return;

  const message = document.getElementById("dm-request-message")?.value.trim() || "";
  const experience = document.getElementById("dm-request-experience")?.value.trim() || "";

  if (!message) {
    alert("Please tell us briefly why you want to become a Dungeon Master.");
    return;
  }

  const now = Date.now();
  const data = {
    userId: uid,
    name: currentUser?.name || auth.currentUser?.displayName || auth.currentUser?.email || "User",
    email: auth.currentUser?.email || "",
    emailLower: normalizeEmail(auth.currentUser?.email),
    message,
    experience,
    status: "pending",
    submittedAt: now,
    updatedAt: now
  };

  try {
    if (myDMRequest) {
      await updateDoc(doc(db, "dmRequests", uid), data);
    } else {
      await setDoc(doc(db, "dmRequests", uid), data);
    }

    myDMRequest = { id: uid, ...data };
    renderDMApplicationPanel();
    alert("Your DM application has been submitted.");
  } catch (e) {
    console.error("DM application failed:", e);
    alert(`Could not submit DM application: ${e.message}`);
  }
}

async function withdrawDMRequest() {
  const uid = auth.currentUser?.uid;
  if (!uid || myDMRequest?.status !== "pending") return;
  if (!confirm("Withdraw your Dungeon Master application?")) return;

  try {
    const changes = {
      status: "withdrawn",
      updatedAt: Date.now()
    };
    await updateDoc(doc(db, "dmRequests", uid), changes);
    myDMRequest = { ...myDMRequest, ...changes };
    renderDMApplicationPanel();
  } catch (e) {
    console.error("Withdraw DM application failed:", e);
    alert(`Could not withdraw application: ${e.message}`);
  }
}

async function refreshDMApplicationStatus() {
  if (!auth.currentUser) return;

  try {
    await Promise.all([
      loadCurrentUser(auth.currentUser),
      loadMyDMRequest()
    ]);
    await loadCampaigns();
    await loadDashboardCharacters();
    renderCampaignSelector();
    renderDMApplicationPanel();

    const display = document.getElementById("userDisplay");
    if (display) display.textContent = currentUser.name || auth.currentUser.email;

    const dmActions = document.getElementById("dmSelectorActions");
    if (dmActions) dmActions.style.display = isDM() ? "flex" : "none";
  } catch (e) {
    console.error("Refresh DM status failed:", e);
    alert(`Could not refresh DM status: ${e.message}`);
  }
}

function ensureAdminDMRequestsPanel() {
  const adminPanel = document.getElementById("adminPanel");
  if (!adminPanel) return null;

  let section = document.getElementById("adminDMRequestsSection");
  if (section) return section;

  section = document.createElement("div");
  section.id = "adminDMRequestsSection";
  section.className = "admin-section";
  section.innerHTML = `
    <h2>Dungeon Master Applications</h2>
    <p class="admin-section-sub">
      Approval grants the global ability to create campaigns. It does not grant DM access to other people's campaigns.
    </p>
    <div id="adminDMRequestsList"></div>`;

  const firstSection = adminPanel.querySelector(".admin-section");
  if (firstSection) firstSection.insertAdjacentElement("afterend", section);
  else adminPanel.appendChild(section);

  return section;
}

function renderAdminDMRequests() {
  const section = ensureAdminDMRequestsPanel();
  if (!section || !isAdmin()) return;

  const list = document.getElementById("adminDMRequestsList");
  if (!list) return;

  const pending = dmRequests.filter(r => r.status === "pending");
  const history = dmRequests.filter(r => r.status !== "pending");

  const requestRow = (request, historical = false) => {
    const user = users.find(u => u.id === request.userId);
    const userHasDM = normalizedRoles(user).includes("dm");
    const status = request.status || "pending";

    return `
      <div class="dm-request-admin-row">
        <div class="dm-request-admin-main">
          <div class="dm-request-admin-title">
            <strong>${escapeHtml(request.name || user?.name || request.email || "User")}</strong>
            <span class="role-badge">${escapeHtml(status)}</span>
          </div>
          <div class="dm-request-admin-meta">${escapeHtml(request.email || user?.email || request.userId || "")}</div>
          ${request.message ? `<p><strong>Why:</strong> ${escapeHtml(request.message)}</p>` : ""}
          ${request.experience ? `<p><strong>Experience:</strong> ${escapeHtml(request.experience)}</p>` : ""}
          ${request.reviewNote ? `<p class="dm-request-review-note"><strong>Review note:</strong> ${escapeHtml(request.reviewNote)}</p>` : ""}
        </div>
        <div class="dm-request-admin-actions">
          ${status === "pending" ? `
            <button type="button" class="dm-approval-action" data-approve-dm-request="${escapeHtml(request.userId)}">Approve</button>
            <button type="button" class="dm-approval-action dm-danger-btn" data-reject-dm-request="${escapeHtml(request.userId)}">Reject</button>
          ` : ""}
          ${status === "approved" && userHasDM ? `
            <button type="button" class="dm-approval-action dm-danger-btn" data-revoke-dm-request="${escapeHtml(request.userId)}">Revoke DM Access</button>
          ` : ""}
        </div>
      </div>`;
  };

  list.innerHTML = `
    <div class="dm-request-summary">
      <span><strong>${pending.length}</strong> pending</span>
      <span><strong>${dmRequests.filter(r => r.status === "approved").length}</strong> approved</span>
    </div>
    ${pending.length
      ? `<div class="dm-request-group"><h3>Pending</h3>${pending.map(r => requestRow(r)).join("")}</div>`
      : `<p class="admin-section-sub">No pending DM applications.</p>`}
    ${history.length
      ? `<details class="dm-request-history"><summary>Application history (${history.length})</summary>${history.map(r => requestRow(r, true)).join("")}</details>`
      : ""}
  `;

  list.querySelectorAll("[data-approve-dm-request]").forEach(btn => {
    btn.addEventListener("click", () => reviewDMRequest(btn.dataset.approveDmRequest, "approved"));
  });
  list.querySelectorAll("[data-reject-dm-request]").forEach(btn => {
    btn.addEventListener("click", () => reviewDMRequest(btn.dataset.rejectDmRequest, "rejected"));
  });
  list.querySelectorAll("[data-revoke-dm-request]").forEach(btn => {
    btn.addEventListener("click", () => revokeDMAccess(btn.dataset.revokeDmRequest));
  });
}

async function reviewDMRequest(uid, decision) {
  if (!isAdmin() || !["approved", "rejected"].includes(decision)) return;

  const request = dmRequests.find(r => r.userId === uid || r.id === uid);
  const user = users.find(u => u.id === uid);
  if (!request || !user) {
    alert("The user account could not be found.");
    return;
  }

  const action = decision === "approved" ? "approve" : "reject";
  const reviewNote = prompt(
    decision === "approved"
      ? "Optional note for the applicant:"
      : "Optional reason for rejection:",
    request.reviewNote || ""
  );
  if (reviewNote === null) return;

  if (!confirm(`${action[0].toUpperCase() + action.slice(1)} ${request.name || user.name || user.email}?`)) return;

  const now = Date.now();
  const batch = writeBatch(db);

  if (decision === "approved") {
    batch.update(doc(db, "users", uid), {
      role: rolesWithDM(user),
      updatedAt: now
    });
  }

  batch.update(doc(db, "dmRequests", uid), {
    status: decision,
    reviewedAt: now,
    reviewedBy: auth.currentUser.uid,
    reviewNote: reviewNote.trim(),
    updatedAt: now
  });

  try {
    await batch.commit();

    if (decision === "approved") {
      user.role = rolesWithDM(user);
      user.updatedAt = now;
    }

    Object.assign(request, {
      status: decision,
      reviewedAt: now,
      reviewedBy: auth.currentUser.uid,
      reviewNote: reviewNote.trim(),
      updatedAt: now
    });

    renderAdminDMRequests();
    renderAdminStats();
  } catch (e) {
    console.error("Review DM application failed:", e);
    alert(`Could not ${action} DM application: ${e.message}`);
  }
}

async function revokeDMAccess(uid) {
  if (!isAdmin()) return;

  const request = dmRequests.find(r => r.userId === uid || r.id === uid);
  const user = users.find(u => u.id === uid);
  if (!user) {
    alert("The user account could not be found.");
    return;
  }

  if (normalizedRoles(user).includes("admin")) {
    alert("Admins already have campaign-creation capability. Remove admin access separately if needed.");
    return;
  }

  const reviewNote = prompt(
    "Optional note explaining why DM creation access is being revoked:",
    request?.reviewNote || ""
  );
  if (reviewNote === null) return;

  if (!confirm(`Revoke global DM creation access for ${user.name || user.email || uid}? Existing campaign ownership/membership will be preserved.`)) return;

  const now = Date.now();
  const batch = writeBatch(db);

  batch.update(doc(db, "users", uid), {
    role: rolesWithoutDM(user),
    updatedAt: now
  });

  if (request) {
    batch.update(doc(db, "dmRequests", uid), {
      status: "revoked",
      reviewedAt: now,
      reviewedBy: auth.currentUser.uid,
      reviewNote: reviewNote.trim(),
      updatedAt: now
    });
  }

  try {
    await batch.commit();
    user.role = rolesWithoutDM(user);
    user.updatedAt = now;

    if (request) {
      Object.assign(request, {
        status: "revoked",
        reviewedAt: now,
        reviewedBy: auth.currentUser.uid,
        reviewNote: reviewNote.trim(),
        updatedAt: now
      });
    }

    renderAdminDMRequests();
    renderUserTable();
    renderAdminStats();
  } catch (e) {
    console.error("Revoke DM access failed:", e);
    alert(`Could not revoke DM access: ${e.message}`);
  }
}

function ensureDMApprovalStyles() {
  if (document.getElementById("dmApprovalStep4Styles")) return;

  const style = document.createElement("style");
  style.id = "dmApprovalStep4Styles";
  style.textContent = `
    .dm-application-panel{width:100%;margin:14px 0 4px}
    .dm-application-card{background:#f4efe6;border:2px solid #8a7355;border-radius:10px;padding:14px}
    .dm-application-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
    .dm-application-heading>div{display:flex;flex-direction:column;gap:4px;min-width:0}
    .dm-application-heading strong{font-family:"Cinzel",serif;color:#5c1d1d;font-size:.82rem;letter-spacing:.5px}
    .dm-application-heading span:not(.role-badge){color:#776957;font-size:.7rem;line-height:1.45}
    .dm-application-label{display:flex;flex-direction:column;gap:5px;margin-top:9px;color:#5c1d1d;font-family:"Cinzel",serif;font-size:.68rem;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
    .dm-application-label span{font-family:inherit;font-weight:400;text-transform:none;color:#8a7355}
    .dm-application-label textarea{background:#fdfbf7;border:2px solid #8a7355;border-radius:7px;color:#333;font:inherit;letter-spacing:normal;padding:8px 10px;resize:vertical;text-transform:none}
    .dm-application-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .dm-application-note{background:#fdfbf7;border-left:3px solid #c79c32;border-radius:4px;color:#6f6253;font-size:.72rem;line-height:1.45;margin:8px 0;padding:8px 10px}
    .dm-request-summary{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 14px;color:#8a7355;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px}
    .dm-request-group h3{font-family:"Cinzel",serif;color:#5c1d1d;font-size:.76rem;letter-spacing:.6px;margin:14px 0 8px;text-transform:uppercase}
    .dm-request-admin-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;background:#fdfbf7;border:1px solid #c8b89a;border-radius:8px;margin:8px 0;padding:12px}
    .dm-request-admin-main{min-width:0;flex:1}
    .dm-request-admin-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .dm-request-admin-title strong{font-family:"Cinzel",serif;color:#5c1d1d;font-size:.78rem}
    .dm-request-admin-meta{color:#8a7355;font-size:.68rem;margin:3px 0 8px;word-break:break-all}
    .dm-request-admin-main p{color:#5f5549;font-size:.72rem;line-height:1.45;margin:5px 0}
    .dm-request-review-note{font-style:italic}
    .dm-request-admin-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    .dm-request-history{margin-top:14px}
    .dm-request-history>summary{cursor:pointer;color:#5c1d1d;font-family:"Cinzel",serif;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .dm-approval-action{background:rgba(212,175,55,.18);border:1px solid #c79c32;border-radius:4px;color:#7d6608;cursor:pointer;font-family:"Cinzel",serif;font-size:.62rem;font-weight:700;letter-spacing:.5px;padding:5px 9px;text-transform:uppercase;transition:transform .15s,background .15s}
    .dm-approval-action:hover{background:rgba(212,175,55,.28);transform:translateY(-1px)}
    @media(max-width:700px){.dm-request-admin-row{flex-direction:column}.dm-request-admin-actions{justify-content:flex-start}.dm-application-heading{flex-direction:column}}
  `;
  document.head.appendChild(style);
}


