import {
  db, storage, auth, provider, signInWithPopup, signOut
} from "./firebase.js";

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

import {
  ref,
  getDownloadURL
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// ─── STATE ────────────────────────────────────────────────────────────────────
// Data flow: User → Character → Item (owner = character ID)
// A player must have at least one character to wish or be assigned loot.

let items             = [];  // all Firestore items
let characters        = [];  // all Firestore characters (all players)
let wishes            = [];  // all Firestore wishes
let users             = [];  // all Firestore users
let currentUser       = null; // { uid, email, name, role:[], ... }
let selectedCharacter = null; // the character currently "active" for wishing

const editingItems = new Set();

const ALL_CLASSES = [
  "Artificer","Barbarian","Bard","Cleric","Druid","Fighter",
  "Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard"
];

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────

const isAdmin = () => {
  const r = currentUser?.role;
  return Array.isArray(r) ? r.includes("admin") : r === "admin";
};

const isPlayer = () => {
  const r = currentUser?.role;
  return Array.isArray(r)
    ? r.includes("player") || r.includes("admin")
    : ["player","admin"].includes(r);
};

// My own active characters
function myCharacters() {
  return characters.filter(c => c.userId === auth.currentUser?.uid && c.active !== false);
}

// ─── DATA LOADERS ─────────────────────────────────────────────────────────────

async function loadCurrentUser(firebaseUser) {
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    currentUser = { uid: firebaseUser.uid, ...snap.data() };
  } else {
    // Check if an admin pre-created this account by email
    const allSnap  = await getDocs(collection(db, "users"));
    const existing = allSnap.docs.find(d => d.data().email === firebaseUser.email);
    if (existing) {
      await setDoc(ref, existing.data(), { merge: true });
      await deleteDoc(existing.ref);
      currentUser = { uid: firebaseUser.uid, ...existing.data() };
    } else {
      const newUser = {
        email: firebaseUser.email,
        name:  firebaseUser.displayName || firebaseUser.email,
        role:  ["viewer"]
      };
      await setDoc(ref, newUser);
      currentUser = { uid: firebaseUser.uid, ...newUser };
    }
  }
}

async function loadItemsFromFirestore()
{
    items = await Promise.all(
        (await getDocs(collection(db, "items")))
        .docs.map(async d =>
        {
            const item =
            {
                id: d.id,
                ...d.data()
            };

            const path =
              `dnd-item-images/${item.id}.png`;

          console.log(
              "Loading image:",
              path
          );

          item.imageUrl =
              await loadStorageImage(path);

          console.log(
              "Image URL:",
              item.imageUrl
          );

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
  // Auto-select first character if none selected
  if (!selectedCharacter) {
    const mine = myCharacters();
    if (mine.length > 0) selectedCharacter = mine[0];
  }
}

async function loadWishes() {
  wishes = (await getDocs(collection(db, "wishes")))
    .docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function importItemsIfEmpty() {
  const snap = await getDocs(collection(db, "items"));
  if (!snap.empty) return;
  console.log("Firestore empty — importing items...");
  for (const item of sourceItems) {
    await setDoc(doc(db, "items", item.id), {
      ...item, looted: false, printed: false, owner: null, receivedDate: null
    }, { merge: true });
  }
  console.log("Import complete.");
}

async function loadStorageImage(path)
{
    if (!path)
    {
        return "";
    }

    try
    {
        return await getDownloadURL(
            ref(storage, path)
        );
    }
    catch(error)
    {
        console.error(
            "Image load failed:",
            path,
            error
        );

        return "";
    }
}

// ─── OWNER HELPERS ────────────────────────────────────────────────────────────
// owner field on item = character ID (not user ID)
// "All characters that belong to players/admins" = what fills the owner dropdown

function allPlayableCharacters() {
  // Characters belonging to users with role player or admin
  const playerUserIds = users
    .filter(u => {
      const r = u.role;
      return Array.isArray(r)
        ? r.includes("player") || r.includes("admin")
        : ["player","admin"].includes(r);
    })
    .map(u => u.id);
  return characters.filter(c => playerUserIds.includes(c.userId) && c.active !== false);
}

function characterDisplayName(char) {
  if (!char) return "";
  const owner = users.find(u => u.id === char.userId);
  return `${char.name} (${char.class})${owner ? " — " + (owner.name || owner.email) : ""}`;
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────

const container = document.getElementById("card-container");

function renderCards() {
  container.innerHTML = "";
  const filtered = applyFilters([...items]);
  filtered.forEach(item => container.appendChild(createCard(item)));
  updateStats(
    filtered.length,
    filtered.filter(i => i.looted).length,
    filtered.filter(i => i.printed).length,
    filtered.filter(i => wishes.some(w => w.itemId === i.id)).length
  );
}

function applyFilters(list) {
  const val = id => document.getElementById(id)?.value || "";
  const chk = id => document.getElementById(id)?.checked || false;

  const search   = val("search").toLowerCase();
  const rarity   = val("rarityFilter");
  const source   = val("sourceFilter");
  const campaign = val("campaignFilter");
  const cls      = val("classFilter");
  const category = val("categoryFilter");
  const owner    = val("ownerFilter"); // this is now a character ID

  return list.filter(item => {
    if (search && !(
      (item.name        || "").toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search)
    )) return false;
    if (rarity   && item.rarity   !== rarity)    return false;
    if (source   && item.source   !== source)    return false;
    if (campaign && item.campaign !== campaign)  return false;
    if (category && item.category !== category)  return false;
    if (cls      && !item.classes?.includes(cls)) return false;
    if (owner    && item.owner    !== owner)     return false;
    if (chk("showLootedOnly")       && !item.looted)    return false;
    if (chk("showUnlootedOnly")     &&  item.looted)    return false;
    if (chk("showWishedOnly")       && !wishes.some(w => w.itemId === item.id)) return false;
    if (chk("showAttunementOnly")   && !item.attunement) return false;
    if (chk("showNoAttunementOnly") &&  item.attunement) return false;
    if (chk("showPrintedOnly")      && !item.printed)   return false;
    if (chk("showNotPrintedOnly")   &&  item.printed)   return false;
    return true;
  });
}

// ─── CREATE CARD ──────────────────────────────────────────────────────────────

function createCard(item) {
  const card = document.createElement("div");
  card.classList.add("item-card");

  const admin     = isAdmin();
  const isEditing = admin && editingItems.has(item.id);

  const rarityClass = (item.rarity || "").toLowerCase().replaceAll(" ", "-");
  if (rarityClass)  card.classList.add(rarityClass);
  if (item.looted)  card.classList.add("looted");
  if (item.printed) card.classList.add("printed");

  // Wishes: keyed by character ID
  const itemWishes = wishes.filter(w => w.itemId === item.id);
  const myWish     = selectedCharacter
    ? wishes.find(w => w.itemId === item.id && w.characterId === selectedCharacter.id)
    : null;

  const wishNames = itemWishes.map(w => {
    const c = characters.find(ch => ch.id === w.characterId);
    return c ? `${c.name} (${c.class})` : "Unknown";
  }).join(", ");

  // Player can wish only if they have a selected character
  const canWish = isPlayer() && !admin && selectedCharacter !== null;

  // Owner = character ID → look up character name
  const ownerChar = characters.find(c => c.id === item.owner);
  const ownerName = ownerChar ? `${ownerChar.name} (${ownerChar.class})` : "";

  // Admin owner dropdown: all playable characters
  const playableChars = allPlayableCharacters();

  card.innerHTML = `
    <div class="watermark">LOOTED</div>

    <div class="card-buttons">
      ${admin ? `
        <button class="loot-button">${item.looted ? "Looted" : "Loot"}</button>
        <button class="print-button">${item.printed ? "Printed" : "Print"}</button>
        ${isEditing
          ? `<button class="save-button">Save</button>
             <button class="cancel-button">Cancel</button>`
          : `<button class="edit-button">Edit</button>
             <button class="clone-button">Clone</button>`
        }
      ` : ""}
      ${canWish ? `
        <button class="wish-button ${myWish ? "wished" : ""}">
          ${myWish ? "★ Wished" : "☆ Wish"}
        </button>
      ` : !admin && isPlayer() && !selectedCharacter ? `
        <span class="no-char-hint">Select a character to wish</span>
      ` : ""}
    </div>

    ${admin && itemWishes.length > 0 ? `
      <div class="wish-admin-block">★ Wished by: ${wishNames}</div>
    ` : !admin && itemWishes.length > 0 ? `
      <div class="wish-count-block">★ ${itemWishes.length} wish${itemWishes.length !== 1 ? "es" : ""}</div>
    ` : ""}

    <div class="card-header">
      ${isEditing
        ? `<input class="edit-name" id="edit-name-${item.id}" value="${(item.name||"").replace(/"/g,"&quot;")}">` 
        : `<h2 class="item-name">${item.name}</h2>`
      }

      ${isEditing ? `
        <select id="edit-category-${item.id}">
          ${["Armor","Potion","Ring","Rod","Scroll","Staff","Vehicle","Wand","Weapon","Wondrous Item"]
            .map(c => `<option value="${c}" ${item.category===c?"selected":""}>${c}</option>`).join("")}
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
            ${["Common","Uncommon","Rare","Very Rare","Legendary","Artifact"]
              .map(r=>`<option value="${r}" ${item.rarity===r?"selected":""}>${r}</option>`).join("")}
          </select>
          <input id="edit-source-${item.id}"   value="${item.source  ||""}" placeholder="Source">
          <input id="edit-campaign-${item.id}" value="${item.campaign||""}" placeholder="Campaign">
        ` : `
          ${item.rarity   ? `<span class="meta-tag ${rarityClass}">${item.rarity}</span>`     : ""}
          ${item.source   ? `<span class="meta-tag">${item.source}</span>`                    : ""}
          ${item.campaign ? `<span class="meta-tag campaign-tag">${item.campaign}</span>`     : ""}
        `}
      </div>
    </div>

    ${isEditing
      ? `<input id="edit-image-${item.id}" value="${item.imageUrl||""}" placeholder="Image URL">`
      : ""
    }

    ${item.imageUrl
      ? `<img src="${item.imageUrl}" class="card-art" alt="${item.name}" onerror="this.style.display='none'">`
      : ""
    }

    <div class="card-body">
      ${isEditing
        ? `<textarea class="edit-description" id="edit-description-${item.id}"
             placeholder="Description">${item.description||""}</textarea>`
        : `<div class="item-description">${item.description||""}</div>`
      }

      ${isEditing
        ? `<textarea id="edit-properties-${item.id}"
             placeholder='[{"title":"Name","text":"Description"}]'>${
               JSON.stringify(item.properties||[],null,2)
             }</textarea>`
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
            <option value="${c.id}" ${item.owner===c.id?"selected":""}>
              ${characterDisplayName(c)}
            </option>`).join("")}
        </select>
      </div>
    ` : ownerName ? `
      <div class="owner-badge">⚔ ${ownerName}</div>
    ` : ""}

    <div class="card-footer">D&D 5e Item Vault</div>
  `;

  attachCardEvents(card, item);
  return card;
}

// ─── CARD EVENTS ──────────────────────────────────────────────────────────────

function attachCardEvents(card, item) {
  card.querySelector(".edit-button")?.addEventListener("click", () => {
    editingItems.add(item.id); renderCards();
  });
  card.querySelector(".cancel-button")?.addEventListener("click", () => {
    editingItems.delete(item.id); renderCards();
  });
  card.querySelector(".save-button")?.addEventListener("click", async () => {
    let properties = [];
    try {
      properties = JSON.parse(document.getElementById(`edit-properties-${item.id}`).value || "[]");
    } catch { alert("Properties JSON is invalid."); return; }
    await updateDoc(doc(db,"items",item.id), {
      name:        document.getElementById(`edit-name-${item.id}`).value,
      description: document.getElementById(`edit-description-${item.id}`).value,
      category:    document.getElementById(`edit-category-${item.id}`).value,
      rarity:      document.getElementById(`edit-rarity-${item.id}`).value,
      source:      document.getElementById(`edit-source-${item.id}`).value,
      campaign:    document.getElementById(`edit-campaign-${item.id}`).value,
      image:       document.getElementById(`edit-image-${item.id}`).value,
      quote:       document.getElementById(`edit-quote-${item.id}`).value,
      attunement:  document.getElementById(`edit-attunement-${item.id}`).checked,
      classes:     [...document.querySelectorAll(`.class-checkbox-${item.id}:checked`)].map(b=>b.value),
      properties
    });
    editingItems.delete(item.id);
    await loadItemsFromFirestore();
  });

  card.querySelector(".loot-button")?.addEventListener("click", async () => {
    const newVal = !item.looted;
    await updateDoc(doc(db,"items",item.id), {
      looted: newVal,
      owner:  newVal ? (item.owner||null) : null
    });
    await loadItemsFromFirestore();
  });

  card.querySelector(".print-button")?.addEventListener("click", async () => {
    await updateDoc(doc(db,"items",item.id), { printed: !item.printed });
    await loadItemsFromFirestore();
  });

  card.querySelector(".clone-button")?.addEventListener("click", async () => {
    const cloneId = item.id + "-copy-" + Date.now();
    const { id: _r, ...rest } = item;
    await setDoc(doc(db,"items",cloneId), {
      ...rest, name: item.name+" (Homebrew)", source: "Homebrew",
      looted: false, printed: false, owner: null
    });
    await loadItemsFromFirestore();
    editingItems.add(cloneId);
    renderCards();
  });

  // owner-select now saves a CHARACTER ID
  card.querySelector(".owner-select")?.addEventListener("change", async e => {
    await updateDoc(doc(db,"items",item.id), { owner: e.target.value || null });
    await loadItemsFromFirestore();
  });

  // Wish uses selectedCharacter.id (character ID)
  card.querySelector(".wish-button")?.addEventListener("click", async () => {
    if (!selectedCharacter) { alert("Select a character in the My Character tab first."); return; }
    const existing = wishes.find(w => w.itemId===item.id && w.characterId===selectedCharacter.id);
    if (existing) {
      await deleteDoc(doc(db,"wishes",existing.id));
    } else {
      await addDoc(collection(db,"wishes"), {
        itemId:      item.id,
        characterId: selectedCharacter.id,
        userId:      auth.currentUser.uid,
        created:     Date.now()
      });
    }
    await loadWishes();
    renderCards();
  });
}

// ─── ADD / EDIT ITEM MODAL ────────────────────────────────────────────────────

function buildModalClassCheckboxes(selected=[]) {
  const wrap = document.getElementById("modal-classes");
  if (!wrap) return;
  wrap.innerHTML = ALL_CLASSES.map(c=>`
    <label class="class-option">
      <input type="checkbox" value="${c}" ${selected.includes(c)?"checked":""}> ${c}
    </label>`).join("");
}

function openItemModal(item=null) {
  document.getElementById("itemModalTitle").textContent = item ? "Edit Item" : "Add Item";
  document.getElementById("modal-name").value         = item?.name        || "";
  document.getElementById("modal-category").value     = item?.category    || "Wondrous Item";
  document.getElementById("modal-rarity").value       = item?.rarity      || "Common";
  document.getElementById("modal-source").value       = item?.source      || "";
  document.getElementById("modal-campaign").value     = item?.campaign    || "";
  document.getElementById("modal-image").value        = item?.image       || "";
  document.getElementById("modal-description").value  = item?.description || "";
  document.getElementById("modal-quote").value        = item?.quote       || "";
  document.getElementById("modal-attunement").checked = item?.attunement  || false;
  document.getElementById("modal-properties").value   = JSON.stringify(item?.properties||[],null,2);
  buildModalClassCheckboxes(item?.classes||[]);
  document.getElementById("itemModal").dataset.editId = item?.id || "";
  document.getElementById("itemModal").style.display  = "flex";
}

function closeItemModal() {
  document.getElementById("itemModal").style.display = "none";
}

async function saveItemModal() {
  const editId = document.getElementById("itemModal").dataset.editId;
  const name   = document.getElementById("modal-name").value.trim();
  if (!name) { alert("Name is required."); return; }
  let properties = [];
  try { properties = JSON.parse(document.getElementById("modal-properties").value||"[]"); }
  catch { alert("Properties JSON is invalid."); return; }
  const classes = [...document.querySelectorAll("#modal-classes input:checked")].map(i=>i.value);
  const data = {
    name,
    category:    document.getElementById("modal-category").value,
    rarity:      document.getElementById("modal-rarity").value,
    source:      document.getElementById("modal-source").value,
    campaign:    document.getElementById("modal-campaign").value,
    image:       document.getElementById("modal-image").value,
    description: document.getElementById("modal-description").value,
    quote:       document.getElementById("modal-quote").value,
    attunement:  document.getElementById("modal-attunement").checked,
    classes, properties
  };
  if (!editId) {
    const autoId = name.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-");
    await setDoc(doc(db,"items",autoId), { ...data, looted:false, printed:false, owner:null, receivedDate:null }, { merge:true });
  } else {
    await updateDoc(doc(db,"items",editId), data);
  }
  closeItemModal();
  await loadItemsFromFirestore();
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────

function openUserModal(user=null) {
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

function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
}

async function saveUserModal() {
  const editId = document.getElementById("userModal").dataset.editId;
  const name   = document.getElementById("user-name").value.trim();
  const email  = document.getElementById("user-email").value.trim();
  if (!name || !email) { alert("Name and email are required."); return; }
  const role = [...document.querySelectorAll(".role-checkbox:checked")].map(cb=>cb.value);
  const data = { name, email, role };
  if (editId) {
    await updateDoc(doc(db,"users",editId), data);
  } else {
    const tempId = email.toLowerCase().replaceAll(/[^a-z0-9]/g,"-");
    await setDoc(doc(db,"users",tempId), data, { merge:true });
  }
  closeUserModal();
  await loadUsers();
  populateOwnerFilter();
  renderUserTable();
  renderAdminStats();
}

// ─── ADMIN: USER + CHARACTER TABLE ────────────────────────────────────────────

function renderUserTable() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const role       = Array.isArray(u.role) ? u.role.join(", ") : (u.role||"viewer");
    const userChars  = characters.filter(c => c.userId === u.id && c.active !== false);
    const charHTML   = userChars.length > 0
      ? userChars.map(c => `
          <div class="admin-char-row">
            <span class="admin-char-name">${c.name}</span>
            <span class="admin-char-class">${c.class}</span>
            <button class="edit-button btn-sm" data-edit-char="${c.id}" data-char-name="${c.name}" data-char-class="${c.class}">Edit</button>
            <button class="cancel-button btn-sm" data-delete-char="${c.id}" data-char-name="${c.name}">Delete</button>
          </div>`).join("")
      : `<span class="no-chars">No characters</span>`;

    return `
      <tr>
        <td>${u.name||"—"}</td>
        <td>${u.email||"—"}</td>
        <td><span class="role-badge">${role}</span></td>
        <td class="chars-cell">${charHTML}</td>
        <td class="table-actions">
          <button class="edit-button btn-sm" data-edit-user="${u.id}">Edit</button>
          <button class="cancel-button btn-sm" data-delete-user="${u.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  // User edit/delete
  tbody.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", () => openUserModal(users.find(u=>u.id===btn.dataset.editUser)));
  });
  tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this user? All their characters and wishes will also be deleted.")) return;
      const uid = btn.dataset.deleteUser;
      // Delete characters + wishes
      const userChars = characters.filter(c=>c.userId===uid);
      for (const c of userChars) {
        const charWishes = wishes.filter(w=>w.characterId===c.id);
        for (const w of charWishes) await deleteDoc(doc(db,"wishes",w.id));
        await deleteDoc(doc(db,"characters",c.id));
      }
      await deleteDoc(doc(db,"users",uid));
      await loadUsers();
      await loadCharacters();
      await loadWishes();
      populateOwnerFilter();
      renderUserTable();
      renderAdminStats();
    });
  });

  // Character edit/delete (from admin panel)
  tbody.querySelectorAll("[data-edit-char]").forEach(btn => {
    btn.addEventListener("click", () => {
      openEditCharacterModal(btn.dataset.editChar, btn.dataset.charName, btn.dataset.charClass);
    });
  });
  tbody.querySelectorAll("[data-delete-char]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete character "${btn.dataset.charName}"? Their wishes will also be removed.`)) return;
      const cid = btn.dataset.deleteChar;
      const charWishes = wishes.filter(w=>w.characterId===cid);
      for (const w of charWishes) await deleteDoc(doc(db,"wishes",w.id));
      // Un-assign any items owned by this character
      const ownedItems = items.filter(i=>i.owner===cid);
      for (const i of ownedItems) await updateDoc(doc(db,"items",i.id), { owner: null });
      await deleteDoc(doc(db,"characters",cid));
      await loadCharacters();
      await loadWishes();
      await loadItemsFromFirestore();
      renderUserTable();
      renderAdminStats();
    });
  });
}

function renderAdminStats() {
  const el = document.getElementById("adminStats");
  if (!el) return;
  const playerCount = users.filter(u => {
    const r=u.role; return Array.isArray(r)?r.includes("player")||r.includes("admin"):["player","admin"].includes(r);
  }).length;
  el.innerHTML = `
    <div class="stat-card"><span class="stat-num">${items.length}</span><span class="stat-label">Total Items</span></div>
    <div class="stat-card"><span class="stat-num">${items.filter(i=>i.looted).length}</span><span class="stat-label">Looted</span></div>
    <div class="stat-card"><span class="stat-num">${items.filter(i=>i.printed).length}</span><span class="stat-label">Printed</span></div>
    <div class="stat-card"><span class="stat-num">${wishes.length}</span><span class="stat-label">Wishes</span></div>
    <div class="stat-card"><span class="stat-num">${users.length}</span><span class="stat-label">Users</span></div>
    <div class="stat-card"><span class="stat-num">${playerCount}</span><span class="stat-label">Players</span></div>
    <div class="stat-card"><span class="stat-num">${characters.length}</span><span class="stat-label">Characters</span></div>
  `;
}

// ─── FILTER POPULATORS ────────────────────────────────────────────────────────

function populateSourceFilter() {
  const el = document.getElementById("sourceFilter");
  if (!el) return;
  const cur = el.value;
  const sources = [...new Set(items.map(i=>i.source).filter(Boolean))].sort();
  el.innerHTML = `<option value="">All Sources</option>` +
    sources.map(s=>`<option value="${s}" ${s===cur?"selected":""}>${s}</option>`).join("");
}

function populateCampaignFilter() {
  const el = document.getElementById("campaignFilter");
  if (!el) return;
  const cur = el.value;
  const campaigns = [...new Set(items.map(i=>i.campaign).filter(Boolean))].sort();
  el.innerHTML = `<option value="">All Campaigns</option>` +
    campaigns.map(c=>`<option value="${c}" ${c===cur?"selected":""}>${c}</option>`).join("");
}

// Owner filter now lists characters (not users)
function populateOwnerFilter() {
  const el = document.getElementById("ownerFilter");
  if (!el) return;
  const playable = allPlayableCharacters();
  el.innerHTML = `<option value="">All Owners</option>` +
    playable.map(c=>`<option value="${c.id}">${characterDisplayName(c)}</option>`).join("");
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function updateStats(results, looted, printed, wished) {
  const el = document.getElementById("campaignStats");
  if (el) el.textContent =
    `${results} items  ·  ${looted} looted  ·  ${printed} printed  ·  ${wished} wished`;
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

  if (mine.length === 0) {
    el.innerHTML = `<p class="player-empty">No characters yet — create one below.</p>`;
    return;
  }

  el.innerHTML = mine.map(c => `
    <div class="character-card ${selectedCharacter?.id===c.id?"character-card--active":""}">
      <div class="character-card-info">
        <span class="character-card-name">${c.name}</span>
        <span class="character-card-class">${c.class}</span>
      </div>
      <div class="character-card-actions">
        ${selectedCharacter?.id!==c.id
          ? `<button class="btn-select-char" data-char-id="${c.id}">Set Active</button>`
          : `<span class="active-badge">✓ Active</span>`
        }
        <button class="btn-rename-char" data-char-id="${c.id}" data-char-name="${c.name}" data-char-class="${c.class}">Edit</button>
        <button class="btn-delete-char cancel-button" data-char-id="${c.id}" data-char-name="${c.name}">Delete</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll(".btn-select-char").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCharacter = characters.find(c=>c.id===btn.dataset.charId)||null;
      renderCharacterList();
      renderMyWishes();
      renderCards();
    });
  });

  el.querySelectorAll(".btn-rename-char").forEach(btn => {
    btn.addEventListener("click", () => {
      openEditCharacterModal(btn.dataset.charId, btn.dataset.charName, btn.dataset.charClass);
    });
  });

  el.querySelectorAll(".btn-delete-char").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete "${btn.dataset.charName}"? Their wishes will also be removed.`)) return;
      const cid = btn.dataset.charId;
      const charWishes = wishes.filter(w=>w.characterId===cid);
      for (const w of charWishes) await deleteDoc(doc(db,"wishes",w.id));
      // Un-assign owned items
      const ownedItems = items.filter(i=>i.owner===cid);
      for (const i of ownedItems) await updateDoc(doc(db,"items",i.id), { owner: null });
      await deleteDoc(doc(db,"characters",cid));
      if (selectedCharacter?.id===cid) selectedCharacter=null;
      await loadCharacters();
      await loadWishes();
      await loadItemsFromFirestore();
      renderPlayerTab();
    });
  });
}

// My Loot: items where owner = one of my character IDs
function renderMyLoot() {
  const el = document.getElementById("myLootGrid");
  if (!el) return;
  const mine = myCharacters();
  if (mine.length===0) {
    el.innerHTML=`<p class="player-empty">Create a character to see your loot.</p>`; return;
  }
  const myCharIds = mine.map(c=>c.id);
  const myItems   = items.filter(i=>i.looted && myCharIds.includes(i.owner));
  if (myItems.length===0) {
    el.innerHTML=`<p class="player-empty">No items assigned to you yet.</p>`; return;
  }
  el.innerHTML = myItems.map(item => {
    const ownerChar = characters.find(c=>c.id===item.owner);
    return createMiniCard(item, "loot", ownerChar?.name||"");
  }).join("");
}

// My Wishes: all wishes from any of my characters
function renderMyWishes() {
  const el = document.getElementById("myWishGrid");
  if (!el) return;
  const mine = myCharacters();
  if (mine.length===0) {
    el.innerHTML=`<p class="player-empty">Create a character to track wishes.</p>`; return;
  }
  const myCharIds = mine.map(c=>c.id);
  const myWishes  = wishes.filter(w=>myCharIds.includes(w.characterId));
  const wished    = myWishes.map(w=>{
    const item = items.find(i=>i.id===w.itemId);
    const char = characters.find(c=>c.id===w.characterId);
    return item ? { ...item, _wishChar: char?.name||"?" } : null;
  }).filter(Boolean);

  if (wished.length===0) {
    el.innerHTML=`<p class="player-empty">No wishes yet. Click ☆ on any item in the Library.</p>`; return;
  }
  el.innerHTML = wished.map(item => createMiniCard(item, "wish", item._wishChar)).join("");
}

function createMiniCard(item, mode, extra="") {
  const rarityClass = (item.rarity||"").toLowerCase().replaceAll(" ","-");
  return `
    <div class="mini-card ${rarityClass}">
      ${item.imageUrl ? `<img src="${item.imageUrl}" class="mini-card-art" alt="${item.name}" onerror="this.style.display='none'">` : ""}
      <div class="mini-card-body">
        <div class="mini-card-name">${item.name}</div>
        <div class="mini-card-meta">
          ${item.rarity  ? `<span class="meta-tag ${rarityClass}">${item.rarity}</span>`  : ""}
          ${item.category? `<span class="meta-tag">${item.category}</span>`               : ""}
          ${mode==="wish" && extra ? `<span class="meta-tag campaign-tag">★ ${extra}</span>` : ""}
          ${mode==="loot" && extra ? `<span class="meta-tag" style="border-color:#27ae60;color:#1e8449">⚔ ${extra}</span>` : ""}
        </div>
        ${item.attunement ? `<div class="mini-card-attune">Requires Attunement</div>` : ""}
      </div>
    </div>
  `;
}

// ─── EDIT CHARACTER MODAL ─────────────────────────────────────────────────────

function openEditCharacterModal(charId, charName, charClass) {
  document.getElementById("editChar-name").value  = charName;
  document.getElementById("editChar-class").value = charClass;
  document.getElementById("editCharModal").dataset.charId = charId;
  document.getElementById("editCharModal").style.display  = "flex";
}

function closeEditCharacterModal() {
  document.getElementById("editCharModal").style.display = "none";
}

async function saveEditCharacter() {
  const charId   = document.getElementById("editCharModal").dataset.charId;
  const newName  = document.getElementById("editChar-name").value.trim();
  const newClass = document.getElementById("editChar-class").value;
  if (!newName) { alert("Character name is required."); return; }
  await updateDoc(doc(db,"characters",charId), { name: newName, class: newClass });
  await loadCharacters();
  if (selectedCharacter?.id===charId) selectedCharacter=characters.find(c=>c.id===charId)||null;
  closeEditCharacterModal();
  // Refresh whichever panel triggered the edit
  renderPlayerTab();
  if (isAdmin()) { renderUserTable(); renderAdminStats(); }
  populateOwnerFilter();
  renderCards();
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.style.display="none");
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById(`tab-${tabId}`);
  if (panel) panel.style.display = "block";
  if (tabId==="admin")  { renderUserTable(); renderAdminStats(); }
  if (tabId==="player") { renderPlayerTab(); }
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
}

// ─── FILTER LISTENERS ────────────────────────────────────────────────────────

function initFilterListeners() {
  ["search","ownerFilter","rarityFilter","sourceFilter","campaignFilter",
   "categoryFilter","classFilter","showLootedOnly","showUnlootedOnly",
   "showWishedOnly","showAttunementOnly","showNoAttunementOnly",
   "showPrintedOnly","showNotPrintedOnly"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input",  renderCards);
    el.addEventListener("change", renderCards);
  });
}

// ─── MODAL LISTENERS ─────────────────────────────────────────────────────────

function initModalListeners() {
  // Item modal
  document.getElementById("addItemBtn")?.addEventListener("click", ()=>openItemModal());
  document.getElementById("closeItemModal")?.addEventListener("click", closeItemModal);
  document.getElementById("cancelItemModal")?.addEventListener("click", closeItemModal);
  document.getElementById("saveItemModal")?.addEventListener("click", saveItemModal);

  // User modal
  document.getElementById("openAddUserBtn")?.addEventListener("click", ()=>openUserModal());
  document.getElementById("closeUserModal")?.addEventListener("click", closeUserModal);
  document.getElementById("cancelUserModal")?.addEventListener("click", closeUserModal);
  document.getElementById("saveUserModal")?.addEventListener("click", saveUserModal);

  // Edit character modal
  document.getElementById("closeEditCharModal")?.addEventListener("click",  closeEditCharacterModal);
  document.getElementById("cancelEditCharModal")?.addEventListener("click", closeEditCharacterModal);
  document.getElementById("saveEditCharModal")?.addEventListener("click",   saveEditCharacter);

  // Player tab — create character
  document.getElementById("playerCreateCharBtn")?.addEventListener("click", async () => {
    const name = document.getElementById("playerCharName").value.trim();
    const cls  = document.getElementById("playerCharClass").value;
    if (!name) { alert("Enter a character name."); return; }
    const newDoc = await addDoc(collection(db,"characters"), {
      name, class: cls, userId: auth.currentUser.uid, active: true, created: Date.now()
    });
    await loadCharacters();
    selectedCharacter = characters.find(c=>c.id===newDoc.id)||null;
    document.getElementById("playerCharName").value = "";
    // Show player tab if first character (tab was hidden before)
    const playerTab = document.getElementById("playerTab");
    if (playerTab) playerTab.style.display = "inline-block";
    renderPlayerTab();
    renderCards();
  });

  // Close on backdrop click or Escape
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => { if (e.target===modal) modal.style.display="none"; });
  });
  document.addEventListener("keydown", e => {
    if (e.key==="Escape") document.querySelectorAll(".modal").forEach(m=>m.style.display="none");
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

document.getElementById("loginButton")?.addEventListener("click", async () => {
  try { await signInWithPopup(auth, provider); } catch(e) { console.error(e); }
});

document.getElementById("emailLoginButton")?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
  } catch(e) { alert(e.message); }
});

document.getElementById("registerButton")?.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      document.getElementById("emailInput").value,
      document.getElementById("passwordInput").value
    );
    alert("Account created! You can now log in.");
  } catch(e) { alert(e.message); }
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
  const playerTab     = document.getElementById("playerTab");
  const addBtn        = document.getElementById("addItemBtn");
  const adminPanel    = document.getElementById("adminPanel");

  if (firebaseUser) {
    await loadCurrentUser(firebaseUser);

    display.textContent = currentUser.name || firebaseUser.email;

    if (loginControls) loginControls.style.display = "none";
    if (logoutBtn)     logoutBtn.style.display      = "inline-block";

    await importItemsIfEmpty();
    await loadUsers();
    await loadCharacters();
    await loadWishes();
    await loadItemsFromFirestore();
    populateOwnerFilter();

    // Admin tab: visible to admins
    if (adminTab)  adminTab.style.display  = isAdmin()  ? "inline-block" : "none";
    if (addBtn)    addBtn.style.display    = isAdmin()  ? "inline-block" : "none";
    if (adminPanel) adminPanel.style.display = isAdmin() ? "block"        : "none";

    // Player tab: visible to players/admins IF they have at least one character
    const hasChars = myCharacters().length > 0;
    if (playerTab) playerTab.style.display = (isPlayer() && hasChars) ? "inline-block" : "none";

    if (isAdmin()) { renderUserTable(); renderAdminStats(); }

  } else {
    currentUser       = null;
    selectedCharacter = null;
    display.textContent = "Not logged in";

    if (loginControls) loginControls.style.display = "block";
    if (logoutBtn)     logoutBtn.style.display      = "none";
    if (adminTab)      adminTab.style.display        = "none";
    if (playerTab)     playerTab.style.display       = "none";
    if (addBtn)        addBtn.style.display           = "none";
    if (adminPanel)    adminPanel.style.display       = "none";

    renderCards();
  }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────

initTabs();
initFilterListeners();
initModalListeners();