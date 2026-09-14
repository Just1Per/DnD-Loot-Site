// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import { db, storage, auth, provider, signInWithPopup, signOut }
  from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { ref, getDownloadURL, uploadBytes }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// ─── STATE ────────────────────────────────────────────────────────────────────
// Data flow: User → Campaign → Character → Item (owner = characterId)

let items          = [];   // master item DB — always full, filtered by visibility
let characters     = [];   // characters scoped to activeCampaign
let saves          = [];   // saves scoped to activeCampaign
let users          = [];   // all users (admin/DM use only)
let campaigns      = [];   // campaigns the current user has access to
let itemState      = {};   // campaign-specific state: visibility, loot, highlight, owner
let currentUser    = null; // { uid, id, email, name, role:[], ... }
let activeCampaign = null; // campaign currently selected
let activeMembershipRole = null; // "player" | "dm" | "owner" | "admin"
let selectedCharacter = null;
let pendingInvites   = [];   // pending invites matching the signed-in user's email
let campaignInvites  = [];   // pending invites for the active campaign (admin/DM management)
let campaignMembers  = [];   // active campaign roster for DM tools
let myDMRequest      = null; // current user's global DM application
let dmRequests       = [];   // all DM applications (admin only)
let itemsLoadPromise = Promise.resolve();

const editingItems = new Set();
const imageCache   = new Map();

const PLACEHOLDER_IMAGE = "./placeholder.png";

const ALL_CLASSES = [
  "Artificer","Barbarian","Bard","Cleric","Druid","Fighter",
  "Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard"
];

const CATEGORIES = [
  "Armor","Potion","Ring","Rod","Scroll","Staff","Vehicle","Wand","Weapon","Wondrous Item"
];

const RARITIES = ["Common","Uncommon","Rare","Very Rare","Legendary","Artifact"];

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────

const hasRole = (role) => {
  const r = currentUser?.role;
  return Array.isArray(r) ? r.includes(role) : r === role;
};

const isAdmin  = () => hasRole("admin");
const isDM     = () => hasRole("dm") || hasRole("admin"); // global capability: can create campaigns
const isPlayer = () => hasRole("player") || hasRole("dm") || hasRole("admin");

const canManageCampaign = () =>
  isAdmin() || ["owner", "dm"].includes(activeMembershipRole);

const canUseCharacters = () =>
  isAdmin() || ["owner", "dm", "player"].includes(activeMembershipRole);

const myCharacters = () =>
  characters.filter(c => c.userId === auth.currentUser?.uid && c.active !== false);

// ─── TIER HELPER ─────────────────────────────────────────────────────────────

function getTier(level) {
  const lvl = parseInt(level) || 0;
  if (lvl >= 17) return { tier: 4, label: "Tier 4", rarity: "Very Rare & Legendary", color: "#d45050", bg: "rgba(212,80,80,0.12)" };
  if (lvl >= 11) return { tier: 3, label: "Tier 3", rarity: "Rare & Very Rare",       color: "#9b59b6", bg: "rgba(155,89,182,0.12)" };
  if (lvl >= 5)  return { tier: 2, label: "Tier 2", rarity: "Uncommon & Rare",        color: "#3498db", bg: "rgba(52,152,219,0.12)" };
  if (lvl >= 1)  return { tier: 1, label: "Tier 1", rarity: "Common & Uncommon",      color: "#27ae60", bg: "rgba(39,174,96,0.12)" };
  return null;
}

// ─── CAMPAIGNS HELPER ─────────────────────────────────────────────────────────

function availableCampaigns() {
  const fromCollection = campaigns.map(c => c.name).filter(Boolean);
  const fromItems      = items.map(i => i.campaign).filter(Boolean);
  return [...new Set([...fromCollection, ...fromItems])].sort();
}

// ─── PROPERTY EDITOR HELPERS ──────────────────────────────────────────────────
// Your improved visual property editor replacing the raw JSON textarea

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createPropertyRow(property = {}) {
  const row = document.createElement("div");
  row.className = "property-edit-row";
  row.innerHTML = `
    <div class="property-edit-fields">
      <label>Title
        <input type="text" class="property-title-input" placeholder="e.g. Bonus"
          value="${escapeHtml(property.title || "")}">
      </label>
      <label>Text
        <textarea class="property-text-input" rows="3"
          placeholder="Property description...">${escapeHtml(property.text || "")}</textarea>
      </label>
    </div>
    <button type="button" class="cancel-button remove-property-btn">Remove</button>
  `;
  row.querySelector(".remove-property-btn").addEventListener("click", () => row.remove());
  return row;
}

function renderPropertyEditor(properties = []) {
  const el = document.getElementById("modal-properties-list");
  if (!el) return;
  el.innerHTML = "";
  properties.forEach(p => el.appendChild(createPropertyRow(p)));
}

function getPropertiesFromEditor() {
  return [...document.querySelectorAll(".property-edit-row")]
    .map(row => ({
      title: row.querySelector(".property-title-input").value.trim(),
      text:  row.querySelector(".property-text-input").value.trim()
    }))
    .filter(p => p.title || p.text);
}

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

function getBaseImageId(itemId) {
  if (!itemId) return "";
  let base = itemId.toLowerCase();
  const wordsToRemove = [
    "common","uncommon","rare","very-rare","veryrare","legendary","artifact","minor","major",
    "grey","gray","red","blue","green","black","white","yellow","purple","orange","bronze","silver","gold","plus"
  ];
  base = base.replace(/\+/g, "").replace(/[0-9]/g, "");
  wordsToRemove.forEach(word => {
    const regex = new RegExp(`(?<=^|[-_\\s])${word}(?=[-_\\s]|$)`, "gi");
    base = base.replace(regex, "");
  });
  return base.replace(/[-_\s]+/g, "-").replace(/^[-_]+|[-_]+$/g, "") || itemId;
}

const IMAGE_SESSION_PREFIX = "dnd-item-image:";

function getCachedImageUrl(itemId) {
  if (!itemId) return "";
  if (imageCache.has(itemId)) return imageCache.get(itemId);

  try {
    const cached = sessionStorage.getItem(IMAGE_SESSION_PREFIX + itemId);
    if (cached) {
      imageCache.set(itemId, cached);
      return cached;
    }
  } catch {}

  return "";
}

function cacheImageUrl(itemId, url) {
  if (!itemId || !url) return;
  imageCache.set(itemId, url);
  try { sessionStorage.setItem(IMAGE_SESSION_PREFIX + itemId, url); } catch {}
}

async function loadStorageImage(path) {
  try { return await getDownloadURL(ref(storage, path)); }
  catch { return ""; }
}

async function resolveImageUrl(itemId) {
  const cached = getCachedImageUrl(itemId);
  if (cached) return cached;

  const url = await loadStorageImage(`dnd-item-images/${getBaseImageId(itemId)}.png`);
  if (url) cacheImageUrl(itemId, url);
  return url || PLACEHOLDER_IMAGE;
}

const imageObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        observer.unobserve(img);

        const itemId = img.dataset.imageItemId;
        if (!itemId) return;

        resolveImageUrl(itemId).then(url => {
          if (!img.isConnected) return;
          img.src = url;

          const item = items.find(i => i.id === itemId);
          if (item && url !== PLACEHOLDER_IMAGE) item.imageUrl = url;

          delete img.dataset.imageItemId;
        });
      });
    }, { rootMargin: "500px 0px" })
  : null;

function observePendingImages(root = document) {
  const pending = root.querySelectorAll?.("img[data-image-item-id]") || [];

  pending.forEach(img => {
    const itemId = img.dataset.imageItemId;
    const cached = getCachedImageUrl(itemId);

    if (cached) {
      img.src = cached;
      delete img.dataset.imageItemId;
      return;
    }

    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      resolveImageUrl(itemId).then(url => {
        if (!img.isConnected) return;
        img.src = url;
        delete img.dataset.imageItemId;
      });
    }
  });
}

function itemImageMarkup(item, className, extraAttrs = "") {
  const cached = item.imageUrl || getCachedImageUrl(item.id);
  const src = cached || PLACEHOLDER_IMAGE;
  const pending = cached ? "" : ` data-image-item-id="${escapeHtml(item.id)}"`;
  return `<img src="${src}" class="${className}" alt="${escapeHtml(item.name || "")}"
    loading="lazy" decoding="async"${pending} ${extraAttrs}
    onerror="this.src='${PLACEHOLDER_IMAGE}'; delete this.dataset.imageItemId;">`;
}

async function uploadItemImage(itemId, file) {
  const imgRef = ref(storage, `dnd-item-images/${getBaseImageId(itemId)}.png`);
  try {
    await uploadBytes(imgRef, file, { contentType: file.type || "image/png" });
    const url = await getDownloadURL(imgRef);
    cacheImageUrl(itemId, url);
    return url;
  } catch (e) {
    console.error("Image upload failed:", e);
    return "";
  }
}

// ─── DATA LOADERS ─────────────────────────────────────────────────────────────

async function loadCurrentUser(firebaseUser) {
  const uidRef = doc(db, "users", firebaseUser.uid);

  try {
    const uidSnap = await getDoc(uidRef);
    if (uidSnap.exists()) {
      currentUser = { uid: firebaseUser.uid, id: firebaseUser.uid, ...uidSnap.data() };
      return;
    }

    // Foundation V2.4: new accounts are always created under their real
    // Firebase Auth UID. We no longer create or scan email-derived temp users.
    // Campaign access is granted separately through campaign invitations.
    const email = firebaseUser.email || "";
    const newUser = {
      email,
      emailLower: normalizeEmail(email),
      name: firebaseUser.displayName || email || "New User",
      role: ["viewer"],
      created: Date.now()
    };

    await setDoc(uidRef, newUser);
    currentUser = { uid: firebaseUser.uid, id: firebaseUser.uid, ...newUser };

  } catch (e) {
    console.error("Failed loading current user:", e);
    throw e;
  }
}

/**
 * Load the master item catalogue without resolving every Storage URL first.
 * Cards paint immediately with cached/placeholder art and resolve images near the viewport.
 */
async function loadItemsFromFirestore() {
  const snap = await getDocs(collection(db, "items"));

  items = snap.docs.map(d => {
    const item = { id: d.id, ...d.data() };
    item.imageUrl = getCachedImageUrl(item.id);
    return item;
  });

  populateSourceFilter();
  populateCampaignFilter();

  if (activeCampaign) renderCards();
}

/** Load characters scoped to the active campaign. */
async function loadCharacters() {
  if (!activeCampaign) {
    characters = [];
    selectedCharacter = null;
    return;
  }

  characters = (await getDocs(
    collection(db, "campaigns", activeCampaign.id, "characters")
  )).docs.map(d => ({ id: d.id, ...d.data() }));

  const mine = myCharacters();

  if (!selectedCharacter || !mine.some(c => c.id === selectedCharacter.id)) {
    selectedCharacter = mine[0] || null;
  }
}

/** Load saves scoped to the active campaign. */
async function loadSaves() {
  if (!activeCampaign) {
    saves = [];
    return;
  }

  const savesRef = collection(db, "campaigns", activeCampaign.id, "saves");

  const snap = canManageCampaign()
    ? await getDocs(savesRef)
    : await getDocs(query(savesRef, where("userId", "==", auth.currentUser.uid)));

  saves = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Campaign-specific state for master items.
 * The global items collection contains item content only.
 * Loot, owner, highlight and visibility belong to a campaign.
 */
async function loadItemState() {
  if (!activeCampaign) {
    itemState = {};
    return;
  }

  const snap = await getDocs(
    collection(db, "campaigns", activeCampaign.id, "itemState")
  );

  itemState = {};
  snap.docs.forEach(d => {
    itemState[d.id] = { ...d.data() };
  });
}

/** User data is global admin data. Campaign DMs use member documents instead. */
async function loadUsers() {
  if (isAdmin()) {
    users = (await getDocs(collection(db, "users")))
      .docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    // Strict rules intentionally do not let a campaign DM read every user's
    // global profile. DM/member UI is rendered from campaign membership data.
    users = [];
  }
}

async function loadCampaignMembers() {
  if (!activeCampaign || !canManageCampaign()) {
    campaignMembers = [];
    return;
  }

  const snap = await getDocs(
    collection(db, "campaigns", activeCampaign.id, "members")
  );

  campaignMembers = snap.docs
    .map(d => ({ id: d.id, uid: d.id, ...d.data() }))
    .filter(m => m.status === "active")
    .sort((a, b) => memberLabel(a).localeCompare(memberLabel(b)));
}


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
  const list = document.getElementById("campaignSelectorList");
  if (!list) return null;

  let panel = document.getElementById("dmApplicationPanel");
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
  const snap = await getDocs(query(collection(db, "items"), limit(1)));
  if (!snap.empty) return;

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
}


// ─── LOCAL STATE PATCH ────────────────────────────────────────────────────────

function patchItem(itemId, changes) {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes };
  return items[idx];
}

function getItemState(itemId) {
  const raw = itemState[itemId] || {};
  const defaultVisible = activeCampaign?.defaultItemVisible !== false;

  return {
    visible: raw.visible ?? defaultVisible,
    looted: raw.looted ?? false,
    highlighted: raw.highlighted ?? false,
    owner: raw.owner ?? null,
    receivedDate: raw.receivedDate ?? null,
    ...raw
  };
}

function patchItemState(itemId, changes) {
  itemState[itemId] = {
    ...(itemState[itemId] || {}),
    ...changes
  };
  return getItemState(itemId);
}

async function persistItemState(itemId, changes) {
  if (!activeCampaign) return null;

  patchItemState(itemId, changes);

  await setDoc(
    doc(db, "campaigns", activeCampaign.id, "itemState", itemId),
    changes,
    { merge: true }
  );

  return getItemState(itemId);
}


// ─── SINGLE-CARD RE-RENDER ────────────────────────────────────────────────────

function buildRenderContext() {
  const charactersById = new Map(characters.map(c => [c.id, c]));
  const usersById      = new Map(users.map(u => [u.id, u]));
  const savesByItem    = new Map();

  for (const save of saves) {
    if (!savesByItem.has(save.itemId)) savesByItem.set(save.itemId, []);
    savesByItem.get(save.itemId).push(save);
  }

  return {
    charactersById,
    usersById,
    savesByItem,
    playableChars: allPlayableCharacters()
  };
}

function rerenderCard(itemId) {
  const item    = items.find(i => i.id === itemId);
  const oldCard = container.querySelector(`[data-item-id="${itemId}"]`);

  if (!item || !oldCard) return;

  const newCard = createCard(item, buildRenderContext());
  oldCard.replaceWith(newCard);
  observePendingImages(newCard);
  refreshStatsBar();
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────

const container = document.getElementById("card-container");

function renderCards() {
  if (!container) return;

  const filtered = applyFilters(visibleItems());
  const context  = buildRenderContext();
  const fragment = document.createDocumentFragment();

  for (const item of filtered) {
    fragment.appendChild(createCard(item, context));
  }

  container.replaceChildren(fragment);
  updateStatsFromFiltered(filtered);
  observePendingImages(container);
}

/**
 * Campaign managers see the full catalogue.
 * Players see only items visible under the active campaign's policy/state.
 */
function visibleItems() {
  if (!activeCampaign || canManageCampaign()) return items;
  return items.filter(item => getItemState(item.id).visible);
}

function updateStatsFromFiltered(filtered) {
  let looted = 0;
  let highlighted = 0;

  for (const item of filtered) {
    const state = getItemState(item.id);
    if (state.looted) looted++;
    if (state.highlighted) highlighted++;
  }

  updateStats(filtered.length, looted, highlighted, saves.length);
}

function refreshStatsBar() {
  updateStatsFromFiltered(applyFilters(visibleItems()));
}

function applyFilters(list) {
  const val = id => document.getElementById(id)?.value || "";
  const chk = id => document.getElementById(id)?.checked ?? false;

  const search   = val("search").toLowerCase().trim();
  const rarity   = val("rarityFilter");
  const source   = val("sourceFilter");
  const campaign = val("campaignFilter");
  const cls      = val("classFilter");
  const category = val("categoryFilter");
  const owner    = val("ownerFilter");

  const savedItemIds = chk("showSavedOnly")
    ? new Set(saves.map(s => s.itemId))
    : null;

  return list.filter(item => {
    const state = getItemState(item.id);

    if (search && !(
      (item.name || "").toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search)
    )) return false;

    if (rarity   && item.rarity   !== rarity)   return false;
    if (source   && item.source   !== source)   return false;
    if (campaign && item.campaign !== campaign) return false;
    if (category && item.category !== category) return false;
    if (cls      && !item.classes?.includes(cls)) return false;
    if (owner    && state.owner !== owner) return false;

    if (chk("showLootedOnly")         && !state.looted)      return false;
    if (chk("showUnlootedOnly")       &&  state.looted)      return false;
    if (savedItemIds                  && !savedItemIds.has(item.id)) return false;
    if (chk("showAttunementOnly")     && !item.attunement)   return false;
    if (chk("showNoAttunementOnly")   &&  item.attunement)   return false;
    if (chk("showHighlightedOnly")    && !state.highlighted) return false;
    if (chk("showNotHighlightedOnly") &&  state.highlighted) return false;

    return true;
  });
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

  renderCampaignSelector();
  renderDMApplicationPanel();

  const dmActions = document.getElementById("dmSelectorActions");
  if (dmActions) dmActions.style.display = isDM() ? "flex" : "none";
}

function renderCampaignSelector() {
  const list = document.getElementById("campaignSelectorList");
  if (!list) return;

  const inviteHtml = pendingInvites.length
    ? `
      <div style="width:100%;margin-bottom:16px">
        <div style="font-family:Cinzel,serif;font-weight:700;color:#5c1d1d;margin-bottom:8px">Pending Invitations</div>
        ${pendingInvites.map(invite => `
          <div class="campaign-selector-card" style="cursor:default;margin-bottom:8px">
            <div>
              <span class="campaign-selector-name">${escapeHtml(invite.campaignName || "Campaign Invitation")}</span>
              <span class="campaign-selector-desc">Invited as ${escapeHtml(invite.role || "player")}${invite.name ? ` · ${escapeHtml(invite.name)}` : ""}</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <button class="save-edit-button btn-sm" type="button" data-accept-invite="${invite.id}">Accept</button>
              <button class="cancel-button btn-sm" type="button" data-decline-invite="${invite.id}">Decline</button>
            </div>
          </div>`).join("")}
      </div>`
    : "";

  const campaignHtml = campaigns.length
    ? campaigns.map(c => `
      <button class="campaign-selector-card" data-campaign-id="${c.id}" type="button">
        <div>
          <span class="campaign-selector-name">${escapeHtml(c.name || "Campaign")}</span>
          ${c.description ? `<span class="campaign-selector-desc">${escapeHtml(c.description)}</span>` : ""}
          <span class="campaign-selector-role">${escapeHtml(c.membershipRole || "player")}</span>
        </div>
        <span class="campaign-selector-arrow">→</span>
      </button>`).join("")
    : `
      <div class="campaign-selector-empty">
        ${isDM()
          ? `<p>You don't have any active campaigns yet.</p>
             <p>Click <strong>+ New Campaign</strong> to get started.</p>`
          : `<p>You haven't joined any campaigns yet.</p>
             <p>If someone invited this email address, the invitation will appear above.</p>`
        }
      </div>`;

  list.innerHTML = inviteHtml + campaignHtml;


  list.querySelectorAll(".campaign-selector-card[data-campaign-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const camp = campaigns.find(c => c.id === btn.dataset.campaignId);
      if (camp) enterCampaign(camp);
    });
  });

  list.querySelectorAll("[data-accept-invite]").forEach(btn => {
    btn.addEventListener("click", () => acceptCampaignInvite(btn.dataset.acceptInvite));
  });

  list.querySelectorAll("[data-decline-invite]").forEach(btn => {
    btn.addEventListener("click", () => declineCampaignInvite(btn.dataset.declineInvite));
  });
}

async function enterCampaign(campaign) {
  activeCampaign       = campaign;
  activeMembershipRole = isAdmin()
    ? "admin"
    : (campaign.membershipRole || (campaign.dmId === auth.currentUser?.uid ? "dm" : "player"));

  selectedCharacter = null;

  const indicator = document.getElementById("activeCampaignName");
  if (indicator) indicator.textContent = campaign.name;

  const campaignLoads = [
    itemsLoadPromise,
    loadCharacters(),
    loadSaves(),
    loadItemState(),
    loadUsers()
  ];

  if (canManageCampaign()) {
    campaignLoads.push(loadCampaignMembers());
    campaignLoads.push(loadActiveCampaignInvites());
  }

  await Promise.all(campaignLoads);

  showMainApp();
  populateOwnerFilter();
  renderCards();
}

function leaveCampaign() {
  activeCampaign       = null;
  activeMembershipRole = null;
  selectedCharacter    = null;
  characters = [];
  saves = [];
  users = isAdmin() ? users : [];
  itemState = {};
  campaignInvites = [];
  campaignMembers = [];
  showCampaignSelector();
}

// ─── SCREEN MANAGEMENT ────────────────────────────────────────────────────────

function hideAllScreens() {
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
  if (addBtn)     addBtn.style.display     = isAdmin() ? "inline-block" : "none";
  if (adminPanel) adminPanel.style.display = isAdmin() ? "block" : "none";
  if (playerTab)  playerTab.style.display  = canUseCharacters() ? "inline-block" : "none";

  if (isAdmin()) {
    renderUserTable();
    renderAdminStats();
    renderAdminInvites();
    renderAdminDMRequests();
  }

  if (canManageCampaign()) renderDMTools();

  showTab("library");
}

// ─── CAMPAIGN ITEM STATE / VISIBILITY ─────────────────────────────────────────

async function toggleItemVisibility(itemId) {
  if (!activeCampaign || !canManageCampaign()) return;

  const newVal = !getItemState(itemId).visible;
  await persistItemState(itemId, { visible: newVal });
  rerenderCard(itemId);
}

async function setVisibilityByRarity(rarity, visible) {
  if (!activeCampaign || !canManageCampaign()) return;

  const matches = items.filter(i => i.rarity === rarity);

  // This is a management action, not part of page load. Run writes concurrently
  // rather than one-by-one, while keeping the local UI state in sync.
  await Promise.all(matches.map(item =>
    persistItemState(item.id, { visible })
  ));

  renderCards();
}

// ─── CREATE CARD ──────────────────────────────────────────────────────────────

function createCard(item, context = buildRenderContext()) {
  const card = document.createElement("div");
  card.classList.add("item-card");
  card.dataset.itemId = item.id;

  const admin       = isAdmin();
  const manager     = canManageCampaign();
  const isEditing   = admin && editingItems.has(item.id);
  const rarityClass = (item.rarity || "").toLowerCase().replaceAll(" ", "-");
  const state       = getItemState(item.id);
  const isVisible   = state.visible;

  if (rarityClass)       card.classList.add(rarityClass);
  if (state.looted)      card.classList.add("looted");
  if (state.highlighted) card.classList.add("highlighted");
  if (activeCampaign && !isVisible && manager) card.classList.add("hidden-from-players");

  const itemSaves = context.savesByItem.get(item.id) || [];
  const mySave = selectedCharacter
    ? itemSaves.find(s => s.characterId === selectedCharacter.id)
    : null;

  const saveNames = itemSaves.map(s => {
    const c = context.charactersById.get(s.characterId);
    return c ? `${c.name} (${c.class})` : "Unknown";
  }).join(", ");

  const canSave      = canUseCharacters() && selectedCharacter !== null;
  const needsChar    = canUseCharacters() && selectedCharacter === null;
  const showSaveInfo = manager || !!mySave;

  const ownerChar = state.owner ? context.charactersById.get(state.owner) : null;
  const ownerName = ownerChar ? `${ownerChar.name} (${ownerChar.class})` : "";

  card.innerHTML = `
    <div class="watermark">LOOTED</div>

    <div class="card-buttons">
      ${manager && activeCampaign ? `
        <button class="loot-button" type="button">${state.looted ? "Looted" : "Loot"}</button>
        <button class="highlight-button" type="button">${state.highlighted ? "Highlighted" : "Highlight"}</button>
        <button class="visibility-toggle-btn ${isVisible ? "visible" : "hidden-item"}" type="button"
          title="${isVisible ? "Visible to players — click to hide" : "Hidden from players — click to show"}">
          ${isVisible ? "👁 Visible" : "🚫 Hidden"}
        </button>
      ` : ""}

      ${admin ? `
        ${isEditing
          ? `<button class="save-edit-button" type="button">Save</button>
             <button class="cancel-button" type="button">Cancel</button>
             <button class="clone-button" type="button">Clone</button>
             <button class="delete-item-button" type="button">🗑 Delete</button>`
          : `<button class="edit-button" type="button">Edit Master Item</button>`
        }
      ` : ""}

      ${canSave ? `
        <button class="save-item-button ${mySave ? "saved" : ""}" type="button">
          ${mySave ? "★ Saved" : "☆ Save"}
        </button>
      ` : needsChar ? `
        <span class="no-char-hint">Select a character to save items</span>
      ` : ""}
    </div>

    ${showSaveInfo && itemSaves.length > 0 ? `
      <div class="${manager ? "wish-admin-block" : "wish-count-block"}">
        ${manager ? `★ Saved by: ${saveNames}` : `★ Saved by your character`}
      </div>
    ` : ""}

    <div class="card-header">
      ${isEditing
        ? `<input class="edit-name" id="edit-name-${item.id}" value="${escapeHtml(item.name || "")}">`
        : `<h2 class="item-name">${item.name}</h2>`
      }

      ${isEditing ? `
        <select id="edit-category-${item.id}">
          ${CATEGORIES.map(c => `<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>

        <label>
          <input type="checkbox" id="edit-attunement-${item.id}" ${item.attunement?"checked":""}>
          Requires Attunement
        </label>

        <div class="class-selector">
          ${ALL_CLASSES.map(cls => `
            <label class="class-option">
              <input type="checkbox" class="class-checkbox-${item.id}" value="${cls}"
                ${(item.classes||[]).includes(cls)?"checked":""}> ${cls}
            </label>`).join("")}
        </div>
      ` : `
        <p class="item-type">${item.category||""}${item.attunement?" · Requires Attunement":""}</p>
      `}

      <div class="card-meta">
        ${(item.classes||[]).map(c=>`<span class="meta-tag">${c}</span>`).join("")}
      </div>

      <div class="card-meta">
        ${isEditing ? `
          <select id="edit-rarity-${item.id}">
            ${RARITIES.map(r=>`<option ${item.rarity===r?"selected":""}>${r}</option>`).join("")}
          </select>
          <input id="edit-source-${item.id}"   value="${escapeHtml(item.source || "")}" placeholder="Source">
          <input id="edit-campaign-${item.id}" value="${escapeHtml(item.campaign || "")}" placeholder="Campaign / Book">
        ` : `
          ${item.rarity    ? `<span class="meta-tag ${rarityClass}">${item.rarity}</span>` : ""}
          ${item.source    ? `<span class="meta-tag">${item.source}</span>` : ""}
          ${item.campaign  ? `<span class="meta-tag campaign-tag">${item.campaign}</span>` : ""}
        `}
      </div>
    </div>

    ${isEditing ? `
      <div class="card-image-edit">
        ${itemImageMarkup(item, "card-art card-art--edit")}
        <label class="upload-image-btn--overlay" title="Upload or replace image">
          📷 ${item.imageUrl ? "Replace Image" : "Upload Image"}
          <input type="file" class="image-file-input" accept="image/*" style="display:none">
        </label>
        <span class="upload-progress" style="display:none">Uploading…</span>
      </div>
    ` : itemImageMarkup(item, "card-art")}

    <div class="card-body">
      ${isEditing
        ? `<textarea class="edit-description" id="edit-description-${item.id}"
             placeholder="Description">${item.description||""}</textarea>`
        : `<div class="item-description">${item.description||""}</div>`
      }

      ${isEditing
        ? `<textarea id="edit-properties-${item.id}"
             placeholder='[{"title":"Name","text":"Description"}]'>${JSON.stringify(item.properties||[],null,2)}</textarea>`
        : (item.properties||[]).map(p=>`
            <div class="property-block">
              <span class="property-title">${p.title}:</span> ${p.text}
            </div>`).join("")
      }

      ${isEditing
        ? `<textarea id="edit-quote-${item.id}" placeholder="Quote">${item.quote||""}</textarea>`
        : item.quote ? `<i>${item.quote}</i>` : ""
      }
    </div>

    ${state.looted && manager ? `
      <div class="owner-block">
        <label class="owner-label">Assign to character:</label>
        <select class="owner-select">
          <option value="">No Owner</option>
          ${context.playableChars.map(c => `
            <option value="${c.id}" ${state.owner===c.id?"selected":""}>
              ${characterDisplayName(c, context.usersById)}
            </option>
          `).join("")}
        </select>
      </div>
    ` : ownerName ? `<div class="owner-badge">⚔ ${ownerName}</div>` : ""}

    <div class="card-footer">D&D 5e Item Vault</div>
  `;

  attachCardEvents(card, item);
  return card;
}


// ─── CARD EVENTS ──────────────────────────────────────────────────────────────

function attachCardEvents(card, item) {

  card.querySelector(".edit-button")?.addEventListener("click", () => {
    editingItems.add(item.id);
    rerenderCard(item.id);
  });

  card.querySelector(".cancel-button")?.addEventListener("click", () => {
    editingItems.delete(item.id);
    rerenderCard(item.id);
  });

  // Master catalogue editing remains admin-only because the buttons are admin-only.
  card.querySelector(".save-edit-button")?.addEventListener("click", async () => {
    let properties = [];

    try {
      properties = JSON.parse(
        document.getElementById(`edit-properties-${item.id}`).value || "[]"
      );
    } catch {
      alert("Properties JSON is invalid.");
      return;
    }

    const changes = {
      name:        document.getElementById(`edit-name-${item.id}`).value,
      description: document.getElementById(`edit-description-${item.id}`).value,
      category:    document.getElementById(`edit-category-${item.id}`).value,
      rarity:      document.getElementById(`edit-rarity-${item.id}`).value,
      source:      document.getElementById(`edit-source-${item.id}`).value,
      campaign:    document.getElementById(`edit-campaign-${item.id}`).value,
      quote:       document.getElementById(`edit-quote-${item.id}`).value,
      attunement:  document.getElementById(`edit-attunement-${item.id}`).checked,
      classes:     [...document.querySelectorAll(`.class-checkbox-${item.id}:checked`)]
        .map(b => b.value),
      properties
    };

    await updateDoc(doc(db, "items", item.id), changes);

    editingItems.delete(item.id);
    patchItem(item.id, changes);
    rerenderCard(item.id);
    populateSourceFilter();
    populateCampaignFilter();
  });

  card.querySelector(".delete-item-button")?.addEventListener("click", async () => {
    if (!confirm(`Permanently delete "${item.name}" from the master catalogue? This cannot be undone.`)) return;

    if (activeCampaign) {
      const itemSaves = saves.filter(s => s.itemId === item.id);

      await Promise.all(itemSaves.map(s =>
        deleteDoc(doc(db, "campaigns", activeCampaign.id, "saves", s.id))
      ));

      saves = saves.filter(s => s.itemId !== item.id);

      await deleteDoc(
        doc(db, "campaigns", activeCampaign.id, "itemState", item.id)
      ).catch(() => {});

      delete itemState[item.id];
    }

    await deleteDoc(doc(db, "items", item.id));

    items = items.filter(i => i.id !== item.id);
    editingItems.delete(item.id);

    container.querySelector(`[data-item-id="${item.id}"]`)?.remove();

    refreshStatsBar();
    populateSourceFilter();
    populateCampaignFilter();
  });

  // Loot/highlight/owner are campaign state — never mutate the global master item.
  card.querySelector(".loot-button")?.addEventListener("click", async () => {
    if (!activeCampaign || !canManageCampaign()) return;

    const state = getItemState(item.id);
    const newLooted = !state.looted;

    await persistItemState(item.id, {
      looted: newLooted,
      owner: newLooted ? state.owner : null,
      receivedDate: newLooted ? (state.receivedDate || Date.now()) : null
    });

    rerenderCard(item.id);
    renderMyLoot();
  });

  card.querySelector(".highlight-button")?.addEventListener("click", async () => {
    if (!activeCampaign || !canManageCampaign()) return;

    const state = getItemState(item.id);

    await persistItemState(item.id, {
      highlighted: !state.highlighted
    });

    rerenderCard(item.id);
  });

  card.querySelector(".clone-button")?.addEventListener("click", async () => {
    const cloneId = `${item.id}-copy-${Date.now()}`;
    const {
      id: _id,
      imageUrl: _imageUrl,
      looted: _legacyLooted,
      highlighted: _legacyHighlighted,
      owner: _legacyOwner,
      receivedDate: _legacyReceivedDate,
      ...masterFields
    } = item;

    await setDoc(doc(db, "items", cloneId), {
      ...masterFields,
      name: `${item.name} (Homebrew)`,
      source: "Homebrew"
    });

    await loadItemsFromFirestore();
    editingItems.add(cloneId);
    renderCards();
  });

  card.querySelector(".owner-select")?.addEventListener("change", async e => {
    if (!activeCampaign || !canManageCampaign()) return;

    const ownerId = e.target.value || null;
    await persistItemState(item.id, { owner: ownerId });

    rerenderCard(item.id);
    renderMyLoot();
  });

  card.querySelector(".image-file-input")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be smaller than 4 MB.");
      return;
    }

    const progressEl = card.querySelector(".upload-progress");
    const labelEl    = card.querySelector(".upload-image-btn--overlay");

    if (progressEl) progressEl.style.display = "inline";
    if (labelEl)    labelEl.style.opacity = "0.4";

    const url = await uploadItemImage(item.id, file);

    if (url) {
      patchItem(item.id, { imageUrl: url });
      editingItems.add(item.id);
      rerenderCard(item.id);
    } else {
      alert("Upload failed. Check the browser console.");
      if (progressEl) progressEl.style.display = "none";
      if (labelEl)    labelEl.style.opacity = "1";
    }
  });

  card.querySelector(".visibility-toggle-btn")?.addEventListener("click", async () => {
    await toggleItemVisibility(item.id);
  });

  card.querySelector(".save-item-button")?.addEventListener("click", async () => {
    if (!selectedCharacter) {
      alert("Select a character in the My Character tab first.");
      return;
    }
    if (!activeCampaign) {
      alert("No active campaign.");
      return;
    }

    const existing = saves.find(
      s => s.itemId === item.id && s.characterId === selectedCharacter.id
    );

    if (existing) {
      await deleteDoc(
        doc(db, "campaigns", activeCampaign.id, "saves", existing.id)
      );

      saves = saves.filter(s => s.id !== existing.id);

    } else {
      // Deterministic id prevents duplicate saves for the same character/item pair.
      const saveId = `${selectedCharacter.id}__${item.id}`;
      const data = {
        itemId: item.id,
        characterId: selectedCharacter.id,
        userId: auth.currentUser.uid,
        created: Date.now()
      };

      await setDoc(
        doc(db, "campaigns", activeCampaign.id, "saves", saveId),
        data
      );

      saves.push({ id: saveId, ...data });
    }

    rerenderCard(item.id);

    const playerPanel = document.getElementById("tab-player");
    if (playerPanel?.style.display !== "none") renderMyWishes();
  });
}


// ─── ADD ITEM MODAL (uses your property editor UI) ────────────────────────────

function buildModalClassCheckboxes(selected = []) {
  const wrap = document.getElementById("modal-classes");
  if (!wrap) return;
  wrap.innerHTML = ALL_CLASSES.map(c => `
    <label class="class-option">
      <input type="checkbox" value="${c}" ${selected.includes(c)?"checked":""}> ${c}
    </label>`).join("");
}

function openItemModal(item = null) {
  document.getElementById("itemModalTitle").textContent = item ? "Edit Item" : "Add Item";
  document.getElementById("modal-name").value         = item?.name        || "";
  document.getElementById("modal-category").value     = item?.category    || "Wondrous Item";
  document.getElementById("modal-rarity").value       = item?.rarity      || "Common";
  document.getElementById("modal-source").value       = item?.source      || "";
  document.getElementById("modal-campaign").value     = item?.campaign    || "";
  document.getElementById("modal-description").value  = item?.description || "";
  document.getElementById("modal-quote").value        = item?.quote       || "";
  document.getElementById("modal-attunement").checked = item?.attunement  || false;
  renderPropertyEditor(item?.properties || []);
  buildModalClassCheckboxes(item?.classes || []);
  document.getElementById("itemModal").dataset.editId = item?.id || "";
  document.getElementById("itemModal").style.display  = "flex";
}

function closeItemModal() { document.getElementById("itemModal").style.display = "none"; }

async function saveItemModal() {
  const editId     = document.getElementById("itemModal").dataset.editId;
  const name       = document.getElementById("modal-name").value.trim();
  if (!name) { alert("Name is required."); return; }
  const properties = getPropertiesFromEditor();
  const classes    = [...document.querySelectorAll("#modal-classes input:checked")].map(i=>i.value);
  const data = {
    name,
    category:    document.getElementById("modal-category").value,
    rarity:      document.getElementById("modal-rarity").value,
    source:      document.getElementById("modal-source").value,
    campaign:    document.getElementById("modal-campaign").value,
    description: document.getElementById("modal-description").value,
    quote:       document.getElementById("modal-quote").value,
    attunement:  document.getElementById("modal-attunement").checked,
    classes, properties
  };
  if (!editId) {
    const autoId = name.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-");
    await setDoc(
      doc(db, "items", autoId),
      data,
      { merge: true }
    );
    closeItemModal();
    await loadItemsFromFirestore();
  } else {
    await updateDoc(doc(db,"items",editId), data);
    closeItemModal();
    patchItem(editId, data);
    rerenderCard(editId);
    populateSourceFilter();
    populateCampaignFilter();
  }
}

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

// ─── SAVE MODAL ───────────────────────────────────────────────────────────────

function openWishModal(charId, charName) {
  const savedItems = saves
    .filter(s=>s.characterId===charId)
    .map(s=>items.find(i=>i.id===s.itemId))
    .filter(Boolean);
  document.getElementById("wishModalCharName").textContent = `${charName}'s Saved Items`;
  const grid = document.getElementById("wishModalGrid");
  grid.innerHTML = savedItems.length===0
    ? `<p class="player-empty" style="grid-column:1/-1">No saved items for this character.</p>`
    : savedItems.map(item=>{
        const rc=(item.rarity||"").toLowerCase().replaceAll(" ","-");
        return `
          <div class="wish-modal-card ${rc}">
            ${itemImageMarkup(item, "wish-modal-art")}
            <div class="wish-modal-body">
              <div class="wish-modal-name">${item.name}</div>
              <div class="card-meta" style="margin-top:4px">
                ${item.rarity  ?`<span class="meta-tag ${rc}">${item.rarity}</span>`:""}
                ${item.category?`<span class="meta-tag">${item.category}</span>`:""}
                ${item.attunement?`<span class="meta-tag">Attunement</span>`:""}
              </div>
              ${(item.properties||[]).slice(0,2).map(p=>`
                <div class="wish-modal-prop">
                  <span class="property-title">${p.title}:</span>
                  ${p.text.substring(0,120)}${p.text.length>120?"…":""}
                </div>`).join("")}
            </div>
          </div>`;
      }).join("");
  document.getElementById("wishModal").style.display = "flex";
  observePendingImages(grid);
}

function closeWishModal() { document.getElementById("wishModal").style.display = "none"; }

// ─── VISIBILITY BULK CONTROLS ─────────────────────────────────────────────────

function renderVisibilityControls() {
  const el = document.getElementById("visibilityControls");
  if (!el || !activeCampaign || !canManageCampaign()) { if(el) el.innerHTML=""; return; }
  el.innerHTML = `
    <div class="visibility-bulk">
      <span class="visibility-bulk-label">Quick show by rarity:</span>
      ${RARITIES.map(r=>`
        <div class="visibility-bulk-rarity">
          <span class="rarity-pill ${r.toLowerCase().replaceAll(" ","-")}">${r}</span>
          <button class="vis-show-btn" type="button" data-rarity="${r}">Show all</button>
          <button class="vis-hide-btn" type="button" data-rarity="${r}">Hide all</button>
        </div>`).join("")}
    </div>`;
  el.querySelectorAll(".vis-show-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>setVisibilityByRarity(btn.dataset.rarity, true));
  });
  el.querySelectorAll(".vis-hide-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>setVisibilityByRarity(btn.dataset.rarity, false));
  });
}

// ─── FILTER POPULATORS ────────────────────────────────────────────────────────

function populateSourceFilter() {
  const el = document.getElementById("sourceFilter");
  if (!el) return;
  const cur = el.value;
  const sources = [...new Set(items.map(i=>i.source).filter(Boolean))].sort();
  el.innerHTML = `<option value="">All Sources</option>` +
    sources.map(s=>`<option ${s===cur?"selected":""}>${s}</option>`).join("");
}

function populateCampaignFilter() {
  const el = document.getElementById("campaignFilter");
  if (!el) return;
  const cur   = el.value;
  const camps = availableCampaigns();
  el.innerHTML = `<option value="">All Campaigns</option>` +
    camps.map(c=>`<option ${c===cur?"selected":""}>${c}</option>`).join("");
}

function populateOwnerFilter() {
  const el = document.getElementById("ownerFilter");
  if (!el) return;
  el.innerHTML = `<option value="">All Owners</option>` +
    allPlayableCharacters().map(c=>`<option value="${c.id}">${characterDisplayName(c)}</option>`).join("");
}


// ─── STATS BAR ────────────────────────────────────────────────────────────────

function updateStats(results, looted, highlighted, saved) {
  const el = document.getElementById("campaignStats");
  if (el) el.textContent =
    `${results} items  ·  ${looted} looted  ·  ${highlighted} highlighted  ·  ${saved} saved`;
}

// ─── PLAYER TAB ──────────────────────────────────────────────────────────────

function renderPlayerTab() {
  renderCharacterList();
  renderMyLoot();
  renderMyWishes();
}

function renderCharacterList() {
  const mine = myCharacters();
  const el   = document.getElementById("myCharacterList");
  if (!el) return;
  if (!mine.length) { el.innerHTML=`<p class="player-empty">No characters yet — create one below.</p>`; return; }
  el.innerHTML = mine.map(c=>{
    const tier = getTier(c.level);
    const tierBadge = tier
      ? `<span class="tier-badge" style="background:${tier.bg};color:${tier.color};border-color:${tier.color}">${tier.label} · ${tier.rarity}</span>`
      : "";
    return `
      <div class="character-card ${selectedCharacter?.id===c.id?"character-card--active":""}">
        <div class="character-card-info">
          <span class="character-card-name">${c.name}</span>
          <span class="character-card-class">${c.class}${c.level?" · Level "+c.level:""}</span>
          ${tierBadge}
        </div>
        <div class="character-card-actions">
          ${selectedCharacter?.id!==c.id
            ? `<button class="btn-select-char" type="button" data-char-id="${c.id}">Set Active</button>`
            : `<span class="active-badge">✓ Active</span>`
          }
          <button class="btn-rename-char" type="button"
            data-char-id="${c.id}" data-char-name="${c.name}"
            data-char-class="${c.class}" data-char-level="${c.level||""}">Edit</button>
          <button class="btn-delete-char cancel-button" type="button"
            data-char-id="${c.id}" data-char-name="${c.name}">Delete</button>
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll(".btn-select-char").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      selectedCharacter=characters.find(c=>c.id===btn.dataset.charId)||null;
      renderCharacterList(); renderMyWishes(); renderCards();
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn=>{
    btn.addEventListener("click", ()=>
      openEditCharacterModal(btn.dataset.charId, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel)
    );
  });

  el.querySelectorAll(".btn-delete-char").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if (!confirm(`Delete "${btn.dataset.charName}"?`)) return;
      const cid = btn.dataset.charId;
      if (activeCampaign) {
        for (const s of saves.filter(s=>s.characterId===cid))
          await deleteDoc(doc(db,"campaigns",activeCampaign.id,"saves",s.id));
        const ownedItemIds = Object.entries(itemState)
          .filter(([, state]) => state?.owner === cid)
          .map(([itemId]) => itemId);

        await Promise.all(ownedItemIds.map(itemId =>
          persistItemState(itemId, { owner: null })
        ));
        await deleteDoc(doc(db,"campaigns",activeCampaign.id,"characters",cid));
      }
      saves=saves.filter(s=>s.characterId!==cid);
      characters=characters.filter(c=>c.id!==cid);
      if (selectedCharacter?.id===cid) selectedCharacter=null;
      populateOwnerFilter(); renderPlayerTab(); renderCards();
    });
  });
}

function renderMyLoot() {
  const el = document.getElementById("myLootGrid");
  if (!el) return;

  const mine = myCharacters();

  if (!mine.length) {
    el.innerHTML = `<p class="player-empty">Create a character to see your loot.</p>`;
    return;
  }

  const myCharIds = new Set(mine.map(c => c.id));

  const myItems = items.filter(item => {
    const state = getItemState(item.id);
    return state.looted && state.owner && myCharIds.has(state.owner);
  });

  if (!myItems.length) {
    el.innerHTML = `<p class="player-empty">No items assigned to you yet.</p>`;
    return;
  }

  el.innerHTML = myItems.map(item => {
    const ownerId = getItemState(item.id).owner;
    const ownerChar = characters.find(c => c.id === ownerId);
    return createMiniCard(item, "loot", ownerChar?.name || "");
  }).join("");

  observePendingImages(el);
}

function renderMyWishes() {
  const el = document.getElementById("myWishGrid");
  if (!el) return;
  const mine = myCharacters();
  if (!mine.length) { el.innerHTML=`<p class="player-empty">Create a character to save items.</p>`; return; }
  const myCharIds = mine.map(c=>c.id);
  const saved = saves
    .filter(s=>myCharIds.includes(s.characterId))
    .map(s=>{
      const item=items.find(i=>i.id===s.itemId);
      const char=characters.find(c=>c.id===s.characterId);
      return item?{...item,_wishChar:char?.name||"?"}:null;
    }).filter(Boolean);
  if (!saved.length) { el.innerHTML=`<p class="player-empty">No saved items yet. Click ☆ Save on any item.</p>`; return; }
  el.innerHTML = saved.map(item=>createMiniCard(item,"wish",item._wishChar)).join("");
  observePendingImages(el);
}

function createMiniCard(item, mode, extra="") {
  const rc=(item.rarity||"").toLowerCase().replaceAll(" ","-");
  return `
    <div class="mini-card ${rc}">
      ${itemImageMarkup(item, "mini-card-art")}
      <div class="mini-card-body">
        <div class="mini-card-name">${item.name}</div>
        <div class="mini-card-meta">
          ${item.rarity  ?`<span class="meta-tag ${rc}">${item.rarity}</span>`:""}
          ${item.category?`<span class="meta-tag">${item.category}</span>`:""}
          ${mode==="wish"&&extra?`<span class="meta-tag campaign-tag">★ ${extra}</span>`:""}
          ${mode==="loot"&&extra?`<span class="meta-tag" style="border-color:#27ae60;color:#1e8449">⚔ ${extra}</span>`:""}
        </div>
        ${item.attunement?`<div class="mini-card-attune">Requires Attunement</div>`:""}
      </div>
    </div>`;
}

// ─── EDIT CHARACTER MODAL ─────────────────────────────────────────────────────

function openEditCharacterModal(charId, charName, charClass, charLevel = "") {
  document.getElementById("editChar-name").value  = charName;
  document.getElementById("editChar-class").value = charClass;
  document.getElementById("editChar-level").value = charLevel;

  document.getElementById("editCharModal").dataset.charId = charId;
  document.getElementById("editCharModal").style.display  = "flex";
}

function closeEditCharacterModal() { document.getElementById("editCharModal").style.display = "none"; }

async function saveEditCharacter() {
  const charId   = document.getElementById("editCharModal").dataset.charId;
  const newName  = document.getElementById("editChar-name").value.trim();
  const newClass = document.getElementById("editChar-class").value;
  const newLevel = parseInt(document.getElementById("editChar-level").value) || null;

  if (!newName) {
    alert("Character name is required.");
    return;
  }

  if (newLevel !== null && (newLevel < 1 || newLevel > 20)) {
    alert("Level must be 1–20.");
    return;
  }

  const changes = {
    name: newName,
    class: newClass,
    level: newLevel
  };

  if (activeCampaign) {
    await updateDoc(
      doc(db, "campaigns", activeCampaign.id, "characters", charId),
      changes
    );
  }

  const idx = characters.findIndex(c => c.id === charId);
  if (idx !== -1) characters[idx] = { ...characters[idx], ...changes };

  if (selectedCharacter?.id === charId) selectedCharacter = characters[idx];

  closeEditCharacterModal();
  populateOwnerFilter();
  renderPlayerTab();

  if (isAdmin()) {
    renderUserTable();
    renderAdminStats();
  }

  renderCards();
}

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
    if (adminTab) tabs.insertBefore(btn, adminTab);
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
    if (adminPanel) main.insertBefore(panel, adminPanel);
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

    renderCards();
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
        <p>Visibility, loot assignment and highlighting are campaign-scoped. Use the Library to manage individual items and the rarity quick-controls.</p>
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
        <h2>Pending Invitations</h2>
        <div id="dmPendingInvites" class="dm-invite-list"></div>
      </section>
    </div>`;

  renderDMOverview();
  renderDMMembers();
  renderDMInvites();

  document.getElementById("dmSaveCampaignSettings")?.addEventListener("click", saveDMCampaignSettings);
  document.getElementById("dmInviteMember")?.addEventListener("click", () => openUserModal());
  document.getElementById("dmOpenLibrary")?.addEventListener("click", () => showTab("library"));
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tabId) {
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

      ensureDMApprovalStyles();
      showCampaignSelector();

      // Do not block the campaign selector on catalogue painting.
      itemsLoadPromise.catch(() => {});

    } catch (e) {
      console.error("Startup failed:", e);
      display.textContent = "Failed to load account";
    }

  } else {
    currentUser = null;
    activeCampaign = null;
    activeMembershipRole = null;
    selectedCharacter = null;

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
    itemsLoadPromise = Promise.resolve();

    display.textContent = "Not logged in";

    if (loginControls) loginControls.style.display = "block";
    if (logoutBtn)     logoutBtn.style.display = "none";

    hideAllScreens();

    const selectorScreen = document.getElementById("campaignSelectorScreen");
    if (selectorScreen) selectorScreen.style.display = "flex";

    const list = document.getElementById("campaignSelectorList");
    if (list) {
      list.innerHTML = `
        <div class="campaign-selector-empty">
          <p>Please log in to continue.</p>
        </div>`;
    }

    const dmActions = document.getElementById("dmSelectorActions");
    if (dmActions) dmActions.style.display = "none";
  }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────

ensureDMToolsUI();
initTabs();
initFilterListeners();
initModalListeners();
