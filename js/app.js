// ─── IMPORTS ──────────────────────────────────────────────────────────────────

import { db, storage, auth, provider, signInWithPopup, signOut }
  from "./firebase.js";

import { items as sourceItems } from "./items.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { ref, getDownloadURL, uploadBytes }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// ─── STATE ────────────────────────────────────────────────────────────────────
// Data flow: User → Character (id) → Item (owner = characterId)

let items             = [];   // local mirror of Firestore items collection
let characters        = [];   // local mirror of Firestore characters collection
let wishes            = [];   // local mirror of Firestore wishes collection
let users             = [];   // local mirror of Firestore users collection
let campaigns         = [];   // local mirror of Firestore campaigns collection
let currentUser       = null; // { uid, email, name, role:[], ... }
let selectedCharacter = null; // currently active character for saving items

const editingItems = new Set(); // item IDs currently in inline-edit mode

// Image URL cache — itemId → resolved URL string
const imageCache = new Map();

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

// Role hierarchy:
// viewer  — read-only library access
// player  — can create characters, save items, receive loot
// dm      — can create and manage campaigns (like a player but with campaign tools)
// admin   — full control: edit items, manage users, manage all campaigns

const isAdmin  = () => hasRole("admin");
const isDM     = () => hasRole("dm") || hasRole("admin");
const isPlayer = () => hasRole("player") || hasRole("admin");;

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
  // Combine campaigns from the campaigns collection + any set directly on items
  const fromCollection = campaigns.map(c => c.name).filter(Boolean);
  const fromItems      = items.map(i => i.campaign).filter(Boolean);
  return [...new Set([...fromCollection, ...fromItems])].sort();
}

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

function getBaseImageId(itemId) {
  if (!itemId) return "";
  let base = itemId.toLowerCase();
  const wordsToRemove = [
    "common","uncommon","rare","very-rare","veryrare","legendary","artifact","minor","major",
    "grey","gray","red","blue","green","black","white","yellow","purple","orange","bronze","silver","gold",
    "plus"
  ];
  base = base.replace(/\+/g, "").replace(/[0-9]/g, "");
  wordsToRemove.forEach(word => {
    const regex = new RegExp(`(?<=^|[-_\\s])${word}(?=[-_\\s]|$)`, "gi");
    base = base.replace(regex, "");
  });
  return base.replace(/[-_\s]+/g, "-").replace(/^[-_]+|[-_]+$/g, "") || itemId;
}

async function loadStorageImage(path) {
  try { return await getDownloadURL(ref(storage, path)); }
  catch (e) { console.warn(`Image not found: ${path}`); return ""; }
}

async function resolveImageUrl(itemId) {
  if (imageCache.has(itemId)) return imageCache.get(itemId);
  const url      = await loadStorageImage(`dnd-item-images/${getBaseImageId(itemId)}.png`);
  const resolved = url || PLACEHOLDER_IMAGE;
  imageCache.set(itemId, resolved);
  return resolved;
}

async function uploadItemImage(itemId, file) {
  const path   = `dnd-item-images/${getBaseImageId(itemId)}.png`;
  const imgRef = ref(storage, path);
  try {
    await uploadBytes(imgRef, file, { contentType: file.type || "image/png" });
    const url = await getDownloadURL(imgRef);
    imageCache.set(itemId, url); // bust cache with real URL
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
    // 1. Se først om brugeren allerede findes under Firebase UID
    const uidSnap = await getDoc(uidRef);

    if (uidSnap.exists()) {
      currentUser = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        ...uidSnap.data()
      };
      return;
    }

    // 2. Hvis ikke: find pre-created user via email
    const usersSnap = await getDocs(collection(db, "users"));

    const email = (firebaseUser.email || "").toLowerCase();

    const matchingDoc = usersSnap.docs.find(d => {
      const data = d.data();
      return (data.email || "").toLowerCase() === email;
    });

    if (matchingDoc) {
      const existingData = matchingDoc.data();

      // Flyt/kopier brugerens data over på det rigtige Firebase UID
      await setDoc(uidRef, {
        ...existingData,
        email: firebaseUser.email,
        name:
          existingData.name ||
          firebaseUser.displayName ||
          firebaseUser.email
      }, { merge: true });

      // Fjern det gamle midlertidige email-dokument
      if (matchingDoc.id !== firebaseUser.uid) {
        await deleteDoc(doc(db, "users", matchingDoc.id));
      }

      currentUser = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        ...existingData
      };

      return;
    }

    // 3. Helt ny bruger uden admin-created entry
    const newUser = {
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email,
      role: ["viewer"]
    };

    await setDoc(uidRef, newUser, { merge: true });

    currentUser = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      ...newUser
    };

  } catch (e) {
    console.error("Failed loading current user:", e);
    throw e;
  }
}

async function loadItemsFromFirestore() {
  const snap = await getDocs(collection(db, "items"));
  items = await Promise.all(
    snap.docs.map(async d => {
      const item    = { id: d.id, ...d.data() };
      item.imageUrl = await resolveImageUrl(item.id);
      return item;
    })
  );
  renderCards();
  populateSourceFilter();
  populateCampaignFilter();
}

async function loadCharacters() {
  characters = (await getDocs(collection(db, "characters")))
    .docs.map(d => ({ id: d.id, ...d.data() }));
  if (!selectedCharacter) {
    const mine = myCharacters();
    if (mine.length) selectedCharacter = mine[0];
  }
}

async function loadWishes() {
  wishes = (await getDocs(collection(db, "wishes")))
    .docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadUsers() {
  users = (await getDocs(collection(db, "users")))
    .docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadCampaigns() {
  campaigns = (await getDocs(collection(db, "campaigns")))
    .docs.map(d => ({ id: d.id, ...d.data() }));
}

async function importItemsIfEmpty() {
  const snap = await getDocs(collection(db, "items"));
  if (!snap.empty) return;
  console.log("Firestore empty — importing items…");
  for (const item of sourceItems) {
    await setDoc(doc(db, "items", item.id), {
      ...item, looted: false, highlighted: false, owner: null, receivedDate: null
    }, { merge: true });
  }
  console.log("Import complete.");
}

// ─── LOCAL STATE PATCH ────────────────────────────────────────────────────────

function patchItem(itemId, changes) {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes };
  return items[idx];
}

// ─── SINGLE-CARD RE-RENDER ────────────────────────────────────────────────────

function rerenderCard(itemId) {
  const item    = items.find(i => i.id === itemId);
  const oldCard = container.querySelector(`[data-item-id="${itemId}"]`);
  if (!item || !oldCard) return;
  oldCard.replaceWith(createCard(item));
  refreshStatsBar();
}

// ─── RENDER CARDS (full grid) ─────────────────────────────────────────────────

const container = document.getElementById("card-container");

function renderCards() {
  const filtered = applyFilters([...items]);
  container.innerHTML = "";
  filtered.forEach(item => container.appendChild(createCard(item)));
  refreshStatsBar();
}

function refreshStatsBar() {
  const filtered = applyFilters([...items]);
  updateStats(
    filtered.length,
    filtered.filter(i => i.looted).length,
    filtered.filter(i => i.highlighted).length,
    wishes.length
  );
}

function applyFilters(list) {
  const val = id => document.getElementById(id)?.value || "";
  const chk = id => document.getElementById(id)?.checked ?? false;
  const search   = val("search").toLowerCase();
  const rarity   = val("rarityFilter");
  const source   = val("sourceFilter");
  const campaign = val("campaignFilter");
  const cls      = val("classFilter");
  const category = val("categoryFilter");
  const owner    = val("ownerFilter");
  return list.filter(item => {
    if (search   && !((item.name||"").toLowerCase().includes(search) ||
                      (item.description||"").toLowerCase().includes(search))) return false;
    if (rarity   && item.rarity   !== rarity)    return false;
    if (source   && item.source   !== source)    return false;
    if (campaign && item.campaign !== campaign)  return false;
    if (category && item.category !== category)  return false;
    if (cls      && !item.classes?.includes(cls)) return false;
    if (owner    && item.owner    !== owner)     return false;
    if (chk("showLootedOnly")         && !item.looted)      return false;
    if (chk("showUnlootedOnly")       &&  item.looted)      return false;
    if (chk("showSavedOnly")          && !wishes.some(w => w.itemId === item.id)) return false;
    if (chk("showAttunementOnly")     && !item.attunement)  return false;
    if (chk("showNoAttunementOnly")   &&  item.attunement)  return false;
    if (chk("showHighlightedOnly")    && !item.highlighted) return false;
    if (chk("showNotHighlightedOnly") &&  item.highlighted) return false;
    return true;
  });
}

// ─── OWNER HELPERS ────────────────────────────────────────────────────────────

function allPlayableCharacters() {
  const playerIds = users
    .filter(u => {
      const r = u.role;
      return Array.isArray(r)
        ? r.some(x => ["player","dm","admin"].includes(x))
        : ["player","dm","admin"].includes(r);
    })
    .map(u => u.id);
  return characters.filter(c => playerIds.includes(c.userId) && c.active !== false);
}

function characterDisplayName(char) {
  if (!char) return "";
  const owner = users.find(u => u.id === char.userId);
  return `${char.name} (${char.class})${owner ? " — " + (owner.name || owner.email) : ""}`;
}

// ─── CREATE CARD ──────────────────────────────────────────────────────────────

function createCard(item) {
  const card = document.createElement("div");
  card.classList.add("item-card");
  card.dataset.itemId = item.id;

  const admin       = isAdmin();
  const isEditing   = admin && editingItems.has(item.id);
  const rarityClass = (item.rarity || "").toLowerCase().replaceAll(" ", "-");

  if (rarityClass)      card.classList.add(rarityClass);
  if (item.looted)      card.classList.add("looted");
  if (item.highlighted) card.classList.add("highlighted");

  const itemSaves  = wishes.filter(w => w.itemId === item.id);
  const mySave     = selectedCharacter
    ? wishes.find(w => w.itemId === item.id && w.characterId === selectedCharacter.id)
    : null;
  const saveNames  = itemSaves.map(w => {
    const c = characters.find(ch => ch.id === w.characterId);
    return c ? `${c.name} (${c.class})` : "Unknown";
  }).join(", ");

  const canSave    = isPlayer() && selectedCharacter !== null;
  const needsChar  = isPlayer() && !admin && selectedCharacter === null;
  const showSaveInfo = admin || !!mySave;

  const ownerChar     = characters.find(c => c.id === item.owner);
  const ownerName     = ownerChar ? `${ownerChar.name} (${ownerChar.class})` : "";
  const playableChars = allPlayableCharacters();

  card.innerHTML = `
    <div class="watermark">LOOTED</div>

    <div class="card-buttons">
      ${admin ? `
        <button class="loot-button">${item.looted ? "Looted" : "Loot"}</button>
        <button class="highlight-button">${item.highlighted ? "Highlighted" : "Highlight"}</button>
        ${isEditing
          ? `<button class="save-edit-button">Save</button>
             <button class="cancel-button">Cancel</button>
             <button class="clone-button">Clone</button>
             <button class="delete-item-button">🗑 Delete</button>`
          : `<button class="edit-button">Edit</button>`
        }
      ` : ""}
      ${canSave ? `
        <button class="save-item-button ${mySave ? "saved" : ""}">
          ${mySave ? "★ Saved" : "☆ Save"}
        </button>
      ` : needsChar ? `
        <span class="no-char-hint">Select a character to save items</span>
      ` : ""}
    </div>

    ${showSaveInfo && itemSaves.length > 0 ? `
      <div class="${admin ? "wish-admin-block" : "wish-count-block"}">
        ${admin ? `★ Saved by: ${saveNames}` : `★ Saved by your character`}
      </div>
    ` : ""}

    <div class="card-header">
      ${isEditing
        ? `<input class="edit-name" id="edit-name-${item.id}" value="${(item.name||"").replace(/"/g,"&quot;")}">` 
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
          <input id="edit-source-${item.id}"   value="${item.source  ||""}" placeholder="Source">
          <input id="edit-campaign-${item.id}" value="${item.campaign||""}" placeholder="Campaign">
        ` : `
          ${item.rarity   ? `<span class="meta-tag ${rarityClass}">${item.rarity}</span>` : ""}
          ${item.source   ? `<span class="meta-tag">${item.source}</span>`                : ""}
          ${item.campaign ? `<span class="meta-tag campaign-tag">${item.campaign}</span>` : ""}
        `}
      </div>
    </div>

    ${isEditing ? `
      <div class="card-image-edit">
        <img src="${item.imageUrl || PLACEHOLDER_IMAGE}" class="card-art card-art--edit"
          alt="${item.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        <label class="upload-image-btn upload-image-btn--overlay" title="Upload or replace image">
          📷 ${item.imageUrl && item.imageUrl !== PLACEHOLDER_IMAGE ? "Replace Image" : "Upload Image"}
          <input type="file" class="image-file-input" accept="image/*" style="display:none">
        </label>
        <span class="upload-progress" style="display:none">Uploading…</span>
      </div>
    ` : `
      <img src="${item.imageUrl || PLACEHOLDER_IMAGE}" class="card-art" alt="${item.name}"
        loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
    `}

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

    ${item.looted && admin ? `
      <div class="owner-block">
        <label class="owner-label">Assign to character:</label>
        <select class="owner-select">
          <option value="">No Owner</option>
          ${playableChars.map(c => `
            <option value="${c.id}" ${item.owner===c.id?"selected":""}>${characterDisplayName(c)}</option>
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

  // Save edit
  card.querySelector(".save-edit-button")?.addEventListener("click", async () => {
    let properties = [];
    try {
      properties = JSON.parse(document.getElementById(`edit-properties-${item.id}`).value || "[]");
    } catch { alert("Properties JSON is invalid."); return; }

    const changes = {
      name:        document.getElementById(`edit-name-${item.id}`).value,
      description: document.getElementById(`edit-description-${item.id}`).value,
      category:    document.getElementById(`edit-category-${item.id}`).value,
      rarity:      document.getElementById(`edit-rarity-${item.id}`).value,
      source:      document.getElementById(`edit-source-${item.id}`).value,
      campaign:    document.getElementById(`edit-campaign-${item.id}`).value,
      quote:       document.getElementById(`edit-quote-${item.id}`).value,
      attunement:  document.getElementById(`edit-attunement-${item.id}`).checked,
      classes:     [...document.querySelectorAll(`.class-checkbox-${item.id}:checked`)].map(b => b.value),
      properties
    };

    await updateDoc(doc(db, "items", item.id), changes);
    editingItems.delete(item.id);
    patchItem(item.id, changes);
    rerenderCard(item.id);
    populateSourceFilter();
    populateCampaignFilter();
  });

  // Delete item — only visible in edit mode, admin only
  card.querySelector(".delete-item-button")?.addEventListener("click", async () => {
    if (!confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    // Remove all saves/wishes for this item
    const itemWishes = wishes.filter(w => w.itemId === item.id);
    for (const w of itemWishes) await deleteDoc(doc(db, "wishes", w.id));
    wishes = wishes.filter(w => w.itemId !== item.id);
    // Delete from Firestore
    await deleteDoc(doc(db, "items", item.id));
    // Remove from local state and remove from DOM immediately
    items = items.filter(i => i.id !== item.id);
    editingItems.delete(item.id);
    const cardEl = container.querySelector(`[data-item-id="${item.id}"]`);
    if (cardEl) cardEl.remove();
    refreshStatsBar();
    populateSourceFilter();
    populateCampaignFilter();
  });

  // Loot
  card.querySelector(".loot-button")?.addEventListener("click", () => {
    const newLooted = !item.looted;
    const changes   = { looted: newLooted, owner: newLooted ? (item.owner || null) : null };
    updateDoc(doc(db, "items", item.id), changes);
    patchItem(item.id, changes);
    rerenderCard(item.id);
  });

  // Highlight
  card.querySelector(".highlight-button")?.addEventListener("click", () => {
    const changes = { highlighted: !item.highlighted };
    updateDoc(doc(db, "items", item.id), changes);
    patchItem(item.id, changes);
    rerenderCard(item.id);
  });

  // Clone
  card.querySelector(".clone-button")?.addEventListener("click", async () => {
    const cloneId = `${item.id}-copy-${Date.now()}`;
    const { id: _drop, imageUrl: _img, ...rest } = item;
    await setDoc(doc(db, "items", cloneId), {
      ...rest,
      name: `${item.name} (Homebrew)`, source: "Homebrew",
      looted: false, highlighted: false, owner: null
    });
    await loadItemsFromFirestore();
    editingItems.add(cloneId);
    rerenderCard(cloneId);
  });

  // Owner assign
  card.querySelector(".owner-select")?.addEventListener("change", e => {
    const ownerId = e.target.value || null;
    updateDoc(doc(db, "items", item.id), { owner: ownerId });
    patchItem(item.id, { owner: ownerId });
    rerenderCard(item.id);
  });

  // Image upload — inside edit mode image area
  card.querySelector(".image-file-input")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 4 * 1024 * 1024)    { alert("Image must be smaller than 4 MB."); return; }

    const progressEl = card.querySelector(".upload-progress");
    const labelEl    = card.querySelector(".upload-image-btn--overlay");
    if (progressEl) progressEl.style.display = "inline";
    if (labelEl)    labelEl.style.opacity    = "0.4";

    const url = await uploadItemImage(item.id, file);
    if (url) {
      patchItem(item.id, { imageUrl: url });
      rerenderCard(item.id);
      // Stay in edit mode after upload
      editingItems.add(item.id);
      rerenderCard(item.id);
    } else {
      alert("Upload failed. Check the browser console.");
      if (progressEl) progressEl.style.display = "none";
      if (labelEl)    labelEl.style.opacity    = "1";
    }
  });

  // Save item (wish)
  card.querySelector(".save-item-button")?.addEventListener("click", async () => {
    if (!selectedCharacter) {
      alert("Select a character in the My Character tab first.");
      return;
    }
    const existing = wishes.find(
      w => w.itemId === item.id && w.characterId === selectedCharacter.id
    );
    if (existing) {
      deleteDoc(doc(db, "wishes", existing.id));
      wishes = wishes.filter(w => w.id !== existing.id);
    } else {
      const newRef = await addDoc(collection(db, "wishes"), {
        itemId:      item.id,
        characterId: selectedCharacter.id,
        userId:      auth.currentUser.uid,
        created:     Date.now()
      });
      wishes.push({
        id: newRef.id, itemId: item.id,
        characterId: selectedCharacter.id,
        userId: auth.currentUser.uid, created: Date.now()
      });
    }
    rerenderCard(item.id);
    const playerPanel = document.getElementById("tab-player");
    if (playerPanel?.style.display !== "none") renderMyWishes();
  });
}

// ─── ADD ITEM MODAL ───────────────────────────────────────────────────────────

function buildModalClassCheckboxes(selected = []) {
  const wrap = document.getElementById("modal-classes");
  if (!wrap) return;
  wrap.innerHTML = ALL_CLASSES.map(c => `
    <label class="class-option">
      <input type="checkbox" value="${c}" ${selected.includes(c) ? "checked" : ""}> ${c}
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
  document.getElementById("modal-properties").value   = JSON.stringify(item?.properties || [], null, 2);
  buildModalClassCheckboxes(item?.classes || []);
  document.getElementById("itemModal").dataset.editId = item?.id || "";
  document.getElementById("itemModal").style.display  = "flex";
}

function closeItemModal() { document.getElementById("itemModal").style.display = "none"; }

async function saveItemModal() {
  const editId = document.getElementById("itemModal").dataset.editId;
  const name   = document.getElementById("modal-name").value.trim();
  if (!name) { alert("Name is required."); return; }
  let properties = [];
  try { properties = JSON.parse(document.getElementById("modal-properties").value || "[]"); }
  catch { alert("Properties JSON is invalid."); return; }
  const classes = [...document.querySelectorAll("#modal-classes input:checked")].map(i => i.value);
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
    const autoId = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
    await setDoc(doc(db, "items", autoId),
      { ...data, looted: false, highlighted: false, owner: null, receivedDate: null },
      { merge: true }
    );
    closeItemModal();
    await loadItemsFromFirestore();
  } else {
    await updateDoc(doc(db, "items", editId), data);
    closeItemModal();
    patchItem(editId, data);
    rerenderCard(editId);
    populateSourceFilter();
    populateCampaignFilter();
  }
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────

function openUserModal(user = null) {
  document.getElementById("userModalTitle").textContent = user ? "Edit User" : "Add User";
  document.getElementById("user-name").value  = user?.name  || "";
  document.getElementById("user-email").value = user?.email || "";
  document.querySelectorAll(".role-checkbox").forEach(cb => {
    const r = user?.role || [];
    cb.checked = Array.isArray(r) ? r.includes(cb.value) : r === cb.value;
  });
  document.getElementById("userModal").dataset.editId = user?.id || "";
  document.getElementById("userModal").style.display  = "flex";
}

function closeUserModal() { document.getElementById("userModal").style.display = "none"; }

async function saveUserModal() {
  const editId = document.getElementById("userModal").dataset.editId;
  const name   = document.getElementById("user-name").value.trim();
  const email  = document.getElementById("user-email").value.trim();
  if (!name || !email) { alert("Name and email are required."); return; }
  const role = [...document.querySelectorAll(".role-checkbox:checked")].map(cb => cb.value);
  const data = { name, email, role };
  if (editId) {
    await updateDoc(doc(db, "users", editId), data);
    const idx = users.findIndex(u => u.id === editId);
    if (idx !== -1) users[idx] = { ...users[idx], ...data };
  } else {
    const tempId = email.toLowerCase().replaceAll(/[^a-z0-9]/g, "-");
    await setDoc(doc(db, "users", tempId), data, { merge: true });
    users.push({ id: tempId, ...data });
  }
  closeUserModal();
  populateOwnerFilter();
  renderUserTable();
  renderAdminStats();
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
  if (!name) { alert("Campaign name is required."); return; }
  const data = {
    name,
    description: document.getElementById("campaign-description").value.trim(),
    dmId:        auth.currentUser.uid,
    created:     Date.now()
  };
  if (editId) {
    await updateDoc(doc(db, "campaigns", editId), { name: data.name, description: data.description });
    const idx = campaigns.findIndex(c => c.id === editId);
    if (idx !== -1) campaigns[idx] = { ...campaigns[idx], ...data };
  } else {
    const newRef = await addDoc(collection(db, "campaigns"), data);
    campaigns.push({ id: newRef.id, ...data });
  }
  closeCampaignModal();
  renderCampaignList();
  populateCampaignFilter();
  // Also refresh character campaign dropdowns
  const campSel = document.getElementById("playerCharCampaign");
  if (campSel) populateCreateCharCampaigns();
}

// ─── ADMIN: USER + CHARACTER TABLE ────────────────────────────────────────────

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const role      = Array.isArray(u.role) ? u.role.join(", ") : (u.role || "viewer");
    const userChars = characters.filter(c => c.userId === u.id && c.active !== false);
    const charHTML  = userChars.length > 0
      ? userChars.map(c => {
          const tier       = getTier(c.level);
          const tierBadge  = tier
            ? `<span class="tier-badge" style="background:${tier.bg};color:${tier.color};border-color:${tier.color}">${tier.label}</span>`
            : "";
          const levelBadge = c.level
            ? `<span class="level-badge">Lvl ${c.level}</span>`
            : `<span class="level-badge level-badge--empty">No level</span>`;
          const campSpan   = c.campaign
            ? `<span class="char-campaign">${c.campaign}</span>` : "";
          return `
            <div class="admin-char-row">
              <div class="admin-char-info">
                <span class="admin-char-name">${c.name}</span>
                <span class="admin-char-class">${c.class}</span>
                ${campSpan}${levelBadge}${tierBadge}
              </div>
              <div class="admin-char-btns">
                <button class="wish-view-btn btn-sm"
                  data-char-id="${c.id}" data-char-name="${c.name}">Saved</button>
                <button class="edit-button btn-sm"
                  data-edit-char="${c.id}"
                  data-char-name="${c.name}"
                  data-char-class="${c.class}"
                  data-char-level="${c.level||""}"
                  data-char-campaign="${c.campaign||""}">Edit</button>
                <button class="cancel-button btn-sm"
                  data-delete-char="${c.id}"
                  data-char-name="${c.name}">Delete</button>
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
            <button class="edit-button btn-sm" data-edit-user="${u.id}">Edit User</button>
            <button class="cancel-button btn-sm" data-delete-user="${u.id}">Delete User</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", () =>
      openUserModal(users.find(u => u.id === btn.dataset.editUser))
    );
  });

  tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this user? All their characters and saves will also be deleted.")) return;
      const uid       = btn.dataset.deleteUser;
      const userChars = characters.filter(c => c.userId === uid);
      for (const c of userChars) {
        for (const w of wishes.filter(w => w.characterId === c.id))
          await deleteDoc(doc(db, "wishes", w.id));
        await deleteDoc(doc(db, "characters", c.id));
      }
      await deleteDoc(doc(db, "users", uid));
      users      = users.filter(u => u.id !== uid);
      characters = characters.filter(c => c.userId !== uid);
      wishes     = wishes.filter(w => !userChars.some(c => c.id === w.characterId));
      userChars.forEach(c => {
        items.filter(i => i.owner === c.id).forEach(i => patchItem(i.id, { owner: null }));
      });
      populateOwnerFilter();
      renderUserTable();
      renderAdminStats();
      renderCards();
    });
  });

  tbody.querySelectorAll("[data-edit-char]").forEach(btn => {
    btn.addEventListener("click", () =>
      openEditCharacterModal(
        btn.dataset.editChar, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel,
        btn.dataset.charCampaign
      )
    );
  });

  tbody.querySelectorAll("[data-delete-char]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete character "${btn.dataset.charName}"? Their saved items will also be removed.`)) return;
      const cid = btn.dataset.deleteChar;
      for (const w of wishes.filter(w => w.characterId === cid))
        await deleteDoc(doc(db, "wishes", w.id));
      items.filter(i => i.owner === cid).forEach(i => {
        updateDoc(doc(db, "items", i.id), { owner: null });
        patchItem(i.id, { owner: null });
      });
      await deleteDoc(doc(db, "characters", cid));
      wishes     = wishes.filter(w => w.characterId !== cid);
      characters = characters.filter(c => c.id !== cid);
      if (selectedCharacter?.id === cid) selectedCharacter = null;
      populateOwnerFilter();
      renderUserTable();
      renderAdminStats();
      renderCards();
    });
  });

  tbody.querySelectorAll(".wish-view-btn").forEach(btn => {
    btn.addEventListener("click", () =>
      openWishModal(btn.dataset.charId, btn.dataset.charName)
    );
  });
}

function renderAdminStats() {
  const el = document.getElementById("adminStats");
  if (!el) return;
  const playerCount = users.filter(u => {
    const r = u.role;
    return Array.isArray(r)
      ? r.some(x => ["player","dm","admin"].includes(x))
      : ["player","dm","admin"].includes(r);
  }).length;
  el.innerHTML = `
    <div class="stat-card"><span class="stat-num">${items.length}</span><span class="stat-label">Total Items</span></div>
    <div class="stat-card"><span class="stat-num">${items.filter(i=>i.looted).length}</span><span class="stat-label">Looted</span></div>
    <div class="stat-card"><span class="stat-num">${items.filter(i=>i.highlighted).length}</span><span class="stat-label">Highlighted</span></div>
    <div class="stat-card"><span class="stat-num">${wishes.length}</span><span class="stat-label">Saved</span></div>
    <div class="stat-card"><span class="stat-num">${users.length}</span><span class="stat-label">Users</span></div>
    <div class="stat-card"><span class="stat-num">${playerCount}</span><span class="stat-label">Players</span></div>
    <div class="stat-card"><span class="stat-num">${characters.length}</span><span class="stat-label">Characters</span></div>
    <div class="stat-card"><span class="stat-num">${campaigns.length}</span><span class="stat-label">Campaigns</span></div>
  `;
}

// ─── CAMPAIGN LIST (DM tab) ───────────────────────────────────────────────────

function renderCampaignList() {
  const el = document.getElementById("campaignList");
  if (!el) return;

  // DMs see their own campaigns; admins see all
  const myCampaigns = isAdmin()
    ? campaigns
    : campaigns.filter(c => c.dmId === auth.currentUser?.uid);

  if (!myCampaigns.length) {
    el.innerHTML = `<p class="player-empty">No campaigns yet — create one below.</p>`;
    return;
  }

  el.innerHTML = myCampaigns.map(c => `
    <div class="campaign-card">
      <div class="campaign-card-info">
        <span class="campaign-card-name">${c.name}</span>
        ${c.description ? `<span class="campaign-card-desc">${c.description}</span>` : ""}
      </div>
      <div class="campaign-card-actions">
        <button class="edit-button btn-sm" data-edit-campaign="${c.id}">Edit</button>
        <button class="cancel-button btn-sm" data-delete-campaign="${c.id}" data-campaign-name="${c.name}">Delete</button>
      </div>
    </div>`).join("");

  el.querySelectorAll("[data-edit-campaign]").forEach(btn => {
    btn.addEventListener("click", () =>
      openCampaignModal(campaigns.find(c => c.id === btn.dataset.editCampaign))
    );
  });

  el.querySelectorAll("[data-delete-campaign]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete campaign "${btn.dataset.campaignName}"?`)) return;
      await deleteDoc(doc(db, "campaigns", btn.dataset.deleteCampaign));
      campaigns = campaigns.filter(c => c.id !== btn.dataset.deleteCampaign);
      renderCampaignList();
      populateCampaignFilter();
    });
  });
}

// ─── WISH / SAVE MODAL (admin view) ──────────────────────────────────────────

function openWishModal(charId, charName) {
  const wishedItems = wishes
    .filter(w => w.characterId === charId)
    .map(w => items.find(i => i.id === w.itemId))
    .filter(Boolean);

  document.getElementById("wishModalCharName").textContent = `${charName}'s Saved Items`;
  const grid = document.getElementById("wishModalGrid");

  grid.innerHTML = wishedItems.length === 0
    ? `<p class="player-empty" style="grid-column:1/-1">No saved items for this character.</p>`
    : wishedItems.map(item => {
        const rc = (item.rarity||"").toLowerCase().replaceAll(" ","-");
        return `
          <div class="wish-modal-card ${rc}">
            ${item.imageUrl ? `<img src="${item.imageUrl}" class="wish-modal-art" alt="${item.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'">` : ""}
            <div class="wish-modal-body">
              <div class="wish-modal-name">${item.name}</div>
              <div class="card-meta" style="margin-top:4px">
                ${item.rarity   ? `<span class="meta-tag ${rc}">${item.rarity}</span>` : ""}
                ${item.category ? `<span class="meta-tag">${item.category}</span>`     : ""}
                ${item.attunement ? `<span class="meta-tag">Attunement</span>`         : ""}
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
}

function closeWishModal() { document.getElementById("wishModal").style.display = "none"; }

// ─── FILTER POPULATORS ────────────────────────────────────────────────────────

function populateSourceFilter() {
  const el = document.getElementById("sourceFilter");
  if (!el) return;
  const cur     = el.value;
  const sources = [...new Set(items.map(i=>i.source).filter(Boolean))].sort();
  el.innerHTML  = `<option value="">All Sources</option>` +
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
    allPlayableCharacters().map(c =>
      `<option value="${c.id}">${characterDisplayName(c)}</option>`
    ).join("");
}

function populateCreateCharCampaigns() {
  const sel = document.getElementById("playerCharCampaign");
  if (!sel) return;
  const camps = availableCampaigns();
  sel.innerHTML = `<option value="">No Campaign</option>` +
    camps.map(c=>`<option>${c}</option>`).join("");
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
  if (!mine.length) {
    el.innerHTML = `<p class="player-empty">No characters yet — create one below.</p>`;
    return;
  }
  el.innerHTML = mine.map(c => {
    const tier = getTier(c.level);
    const tierBadge = tier
      ? `<span class="tier-badge" style="background:${tier.bg};color:${tier.color};border-color:${tier.color}">
           ${tier.label} · ${tier.rarity}
         </span>`
      : "";
    return `
      <div class="character-card ${selectedCharacter?.id===c.id?"character-card--active":""}">
        <div class="character-card-info">
          <span class="character-card-name">${c.name}</span>
          <span class="character-card-class">${c.class}${c.campaign?" · "+c.campaign:""}${c.level?" · Level "+c.level:""}</span>
          ${tierBadge}
        </div>
        <div class="character-card-actions">
          ${selectedCharacter?.id!==c.id
            ? `<button class="btn-select-char" data-char-id="${c.id}">Set Active</button>`
            : `<span class="active-badge">✓ Active</span>`
          }
          <button class="btn-rename-char"
            data-char-id="${c.id}" data-char-name="${c.name}"
            data-char-class="${c.class}" data-char-level="${c.level||""}"
            data-char-campaign="${c.campaign||""}">Edit</button>
          <button class="btn-delete-char cancel-button"
            data-char-id="${c.id}" data-char-name="${c.name}">Delete</button>
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll(".btn-select-char").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCharacter = characters.find(c => c.id === btn.dataset.charId) || null;
      renderCharacterList(); renderMyWishes(); renderCards();
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn => {
    btn.addEventListener("click", () =>
      openEditCharacterModal(
        btn.dataset.charId, btn.dataset.charName,
        btn.dataset.charClass, btn.dataset.charLevel,
        btn.dataset.charCampaign
      )
    );
  });

  el.querySelectorAll(".btn-delete-char").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete "${btn.dataset.charName}"? Their saved items will also be removed.`)) return;
      const cid = btn.dataset.charId;
      for (const w of wishes.filter(w => w.characterId === cid))
        await deleteDoc(doc(db, "wishes", w.id));
      items.filter(i => i.owner === cid).forEach(i => {
        updateDoc(doc(db, "items", i.id), { owner: null });
        patchItem(i.id, { owner: null });
      });
      await deleteDoc(doc(db, "characters", cid));
      wishes     = wishes.filter(w => w.characterId !== cid);
      characters = characters.filter(c => c.id !== cid);
      if (selectedCharacter?.id === cid) selectedCharacter = null;
      populateOwnerFilter();
      renderPlayerTab();
      renderCards();
    });
  });
}

function renderMyLoot() {
  const el = document.getElementById("myLootGrid");
  if (!el) return;
  const mine = myCharacters();
  if (!mine.length) { el.innerHTML = `<p class="player-empty">Create a character to see your loot.</p>`; return; }
  const myItems = items.filter(i => i.looted && mine.some(c => c.id === i.owner));
  if (!myItems.length) { el.innerHTML = `<p class="player-empty">No items assigned to you yet.</p>`; return; }
  el.innerHTML = myItems.map(item => {
    const ownerChar = characters.find(c => c.id === item.owner);
    return createMiniCard(item, "loot", ownerChar?.name || "");
  }).join("");
}

function renderMyWishes() {
  const el = document.getElementById("myWishGrid");
  if (!el) return;
  const mine = myCharacters();
  if (!mine.length) { el.innerHTML = `<p class="player-empty">Create a character to save items.</p>`; return; }
  const myCharIds = mine.map(c => c.id);
  const saved     = wishes
    .filter(w => myCharIds.includes(w.characterId))
    .map(w => {
      const item = items.find(i => i.id === w.itemId);
      const char = characters.find(c => c.id === w.characterId);
      return item ? { ...item, _wishChar: char?.name || "?" } : null;
    })
    .filter(Boolean);
  if (!saved.length) { el.innerHTML = `<p class="player-empty">No saved items yet. Click ☆ Save on any item in the Library.</p>`; return; }
  el.innerHTML = saved.map(item => createMiniCard(item, "wish", item._wishChar)).join("");
}

function createMiniCard(item, mode, extra = "") {
  const rc = (item.rarity||"").toLowerCase().replaceAll(" ","-");
  return `
    <div class="mini-card ${rc}">
      ${item.imageUrl ? `<img src="${item.imageUrl}" class="mini-card-art" alt="${item.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'">` : ""}
      <div class="mini-card-body">
        <div class="mini-card-name">${item.name}</div>
        <div class="mini-card-meta">
          ${item.rarity   ? `<span class="meta-tag ${rc}">${item.rarity}</span>`   : ""}
          ${item.category ? `<span class="meta-tag">${item.category}</span>`       : ""}
          ${mode==="wish"&&extra ? `<span class="meta-tag campaign-tag">★ ${extra}</span>` : ""}
          ${mode==="loot"&&extra ? `<span class="meta-tag" style="border-color:#27ae60;color:#1e8449">⚔ ${extra}</span>` : ""}
        </div>
        ${item.attunement ? `<div class="mini-card-attune">Requires Attunement</div>` : ""}
      </div>
    </div>`;
}

// ─── EDIT CHARACTER MODAL ─────────────────────────────────────────────────────

function openEditCharacterModal(charId, charName, charClass, charLevel = "", charCampaign = "") {
  document.getElementById("editChar-name").value  = charName;
  document.getElementById("editChar-class").value = charClass;
  document.getElementById("editChar-level").value = charLevel;
  const campSel = document.getElementById("editChar-campaign");
  campSel.innerHTML = `<option value="">No Campaign</option>` +
    availableCampaigns().map(c => `<option ${c===charCampaign?"selected":""}>${c}</option>`).join("");
  document.getElementById("editCharModal").dataset.charId = charId;
  document.getElementById("editCharModal").style.display  = "flex";
}

function closeEditCharacterModal() { document.getElementById("editCharModal").style.display = "none"; }

async function saveEditCharacter() {
  const charId      = document.getElementById("editCharModal").dataset.charId;
  const newName     = document.getElementById("editChar-name").value.trim();
  const newClass    = document.getElementById("editChar-class").value;
  const newLevel    = parseInt(document.getElementById("editChar-level").value) || null;
  const newCampaign = document.getElementById("editChar-campaign").value || null;
  if (!newName) { alert("Character name is required."); return; }
  if (newLevel !== null && (newLevel < 1 || newLevel > 20)) { alert("Level must be 1–20."); return; }
  const changes = { name: newName, class: newClass, level: newLevel, campaign: newCampaign };
  await updateDoc(doc(db, "characters", charId), changes);
  const idx = characters.findIndex(c => c.id === charId);
  if (idx !== -1) characters[idx] = { ...characters[idx], ...changes };
  if (selectedCharacter?.id === charId) selectedCharacter = characters[idx];
  closeEditCharacterModal();
  populateOwnerFilter();
  renderPlayerTab();
  if (isAdmin()) { renderUserTable(); renderAdminStats(); }
  renderCards();
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = "block";
  if (tabId === "admin")  { renderUserTable(); renderAdminStats(); }
  if (tabId === "player") { renderPlayerTab(); populateCreateCharCampaigns(); }
  if (tabId === "dm")     { renderCampaignList(); }
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
}

// ─── FILTER LISTENERS ────────────────────────────────────────────────────────

function initFilterListeners() {
  [
    "search","ownerFilter","rarityFilter","sourceFilter","campaignFilter",
    "categoryFilter","classFilter","showLootedOnly","showUnlootedOnly",
    "showSavedOnly","showAttunementOnly","showNoAttunementOnly",
    "showHighlightedOnly","showNotHighlightedOnly"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input",  renderCards);
    el.addEventListener("change", renderCards);
  });
}

// ─── MODAL LISTENERS ─────────────────────────────────────────────────────────

function initModalListeners() {
  document.getElementById("addItemBtn")?.addEventListener("click",      () => openItemModal());
  document.getElementById("closeItemModal")?.addEventListener("click",  closeItemModal);
  document.getElementById("cancelItemModal")?.addEventListener("click", closeItemModal);
  document.getElementById("saveItemModal")?.addEventListener("click",   saveItemModal);

  document.getElementById("openAddUserBtn")?.addEventListener("click",  () => openUserModal());
  document.getElementById("closeUserModal")?.addEventListener("click",  closeUserModal);
  document.getElementById("cancelUserModal")?.addEventListener("click", closeUserModal);
  document.getElementById("saveUserModal")?.addEventListener("click",   saveUserModal);

  document.getElementById("closeEditCharModal")?.addEventListener("click",  closeEditCharacterModal);
  document.getElementById("cancelEditCharModal")?.addEventListener("click", closeEditCharacterModal);
  document.getElementById("saveEditCharModal")?.addEventListener("click",   saveEditCharacter);

  document.getElementById("closeWishModal")?.addEventListener("click",    closeWishModal);
  document.getElementById("closeWishModalBtn")?.addEventListener("click", closeWishModal);

  // Campaign modal
  document.getElementById("openCreateCampaignBtn")?.addEventListener("click", () => openCampaignModal());
  document.getElementById("closeCampaignModal")?.addEventListener("click",    closeCampaignModal);
  document.getElementById("cancelCampaignModal")?.addEventListener("click",   closeCampaignModal);
  document.getElementById("saveCampaignModal")?.addEventListener("click",     saveCampaignModal);

  // Create character
  document.getElementById("playerCreateCharBtn")?.addEventListener("click", async () => {
    const name     = document.getElementById("playerCharName").value.trim();
    const cls      = document.getElementById("playerCharClass").value;
    const level    = parseInt(document.getElementById("playerCharLevel").value) || null;
    const campaign = document.getElementById("playerCharCampaign").value || null;
    if (!name) { alert("Enter a character name."); return; }
    if (level !== null && (level < 1 || level > 20)) { alert("Level must be 1–20."); return; }
    const newRef = await addDoc(collection(db, "characters"), {
      name, class: cls, level, campaign,
      userId: auth.currentUser.uid, active: true, created: Date.now()
    });
    const newChar = { id: newRef.id, name, class: cls, level, campaign,
      userId: auth.currentUser.uid, active: true, created: Date.now() };
    characters.push(newChar);
    selectedCharacter = newChar;
    document.getElementById("playerCharName").value  = "";
    document.getElementById("playerCharLevel").value = "";
    const playerTab = document.getElementById("playerTab");
    if (playerTab) playerTab.style.display = "inline-block";
    renderPlayerTab();
    renderCards();
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape")
      document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

document.getElementById("loginButton")?.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
});

document.getElementById("emailLoginButton")?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
  } catch (e) { alert(e.message); }
});

document.getElementById("registerButton")?.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
    alert("Account created! You can now log in.");
  } catch (e) { alert(e.message); }
});

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await signOut(auth);
});

// ─── AUTH STATE ───────────────────────────────────────────────────────────────

onAuthStateChanged(auth, async (firebaseUser) => {
  const loginControls = document.getElementById("loginControls");
  const logoutBtn     = document.getElementById("logoutButton");
  const display       = document.getElementById("userDisplay");
  const adminTab      = document.getElementById("adminTab");
  const dmTab         = document.getElementById("dmTab");
  const playerTab     = document.getElementById("playerTab");
  const addBtn        = document.getElementById("addItemBtn");
  const adminPanel    = document.getElementById("adminPanel");

  if (firebaseUser) {
    await loadCurrentUser(firebaseUser);
    display.textContent = currentUser.name || firebaseUser.email;

    if (loginControls) loginControls.style.display = "none";
    if (logoutBtn)     logoutBtn.style.display      = "inline-block";

    await importItemsIfEmpty();
    await Promise.all([loadUsers(), loadCharacters(), loadWishes(), loadCampaigns()]);
    await loadItemsFromFirestore();
    populateOwnerFilter();

    // Tab visibility by role
    if (adminTab)   adminTab.style.display   = isAdmin() ? "inline-block" : "none";
    if (addBtn)     addBtn.style.display     = isAdmin() ? "inline-block" : "none";
    if (adminPanel) adminPanel.style.display = isAdmin() ? "block"        : "none";
    if (dmTab)      dmTab.style.display      = isDM()    ? "inline-block" : "none";

    if (playerTab) {
      playerTab.style.display = isPlayer() ? "inline-block" : "none";
    }

    if (isAdmin()) { renderUserTable(); renderAdminStats(); }

  } else {
    currentUser = null; selectedCharacter = null;
    display.textContent = "Not logged in";
    if (loginControls) loginControls.style.display = "block";
    if (logoutBtn)     logoutBtn.style.display      = "none";
    if (adminTab)      adminTab.style.display        = "none";
    if (dmTab)         dmTab.style.display           = "none";
    if (playerTab)     playerTab.style.display       = "none";
    if (addBtn)        addBtn.style.display           = "none";
    if (adminPanel)    adminPanel.style.display       = "none";
    items = []; wishes = []; renderCards();
  }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────

initTabs();
initFilterListeners();
initModalListeners();