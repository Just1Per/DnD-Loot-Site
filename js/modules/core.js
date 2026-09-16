"use strict";

// Shared dependencies exposed by /js/app.js during ordered startup.
const {
  db, storage, auth, provider, signInWithPopup, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch,
  ref, getDownloadURL, uploadBytes
} = window.__DND_VAULT_DEPS__;

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
let dashboardCharacters = []; // current user's recent characters across accessible campaigns
let itemsLoadPromise = Promise.resolve();
let catalogVersion   = 0;     // master catalogue version used by IndexedDB cache

const editingItems = new Set();
const imageCache   = new Map();

const PLACEHOLDER_IMAGE = "./placeholder.png";

// Step 7 performance pass. The tiny metadata document lives inside /items so
// the existing public-read/admin-write item rules already protect it. It is
// filtered out of the visible catalogue and never rendered as an item.
const CATALOG_META_ID = "catalog_meta";
const CATALOG_CACHE_DB         = "dnd-item-vault-cache";
const CATALOG_CACHE_DB_VERSION = 1;
const CATALOG_CACHE_STORE      = "catalog";
const CATALOG_CACHE_KEY        = "master-items";
const CATALOG_NO_META_TTL_MS   = 24 * 60 * 60 * 1000;

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

