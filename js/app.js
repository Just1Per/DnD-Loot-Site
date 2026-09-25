// D&D Item Vault — Step 8 modular bootstrap
// This file stays as the single <script type="module"> entry point.
// Feature code is loaded in a fixed order from ./modules/ so existing
// cross-feature behavior remains unchanged while the codebase is split up.

import { db, storage, auth, provider, signInWithPopup, signOut }
  from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


import { ref, getDownloadURL, uploadBytes }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


// The feature files are intentionally loaded as ordered browser scripts.
// This is the lowest-risk way to split the existing 3,700+ line app without
// changing its shared runtime state or requiring any HTML/Firestore changes.
window.__DND_VAULT_DEPS__ = Object.freeze({
  db, storage, auth, provider, signInWithPopup, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId,
  ref, getDownloadURL, uploadBytes,
});

const FEATURE_FILES = [
  "./modules/campaign-store.js",
  "./modules/core.js",
  "./modules/character-sheet-model.js",
  "./modules/character-sheet-store.js",
  "./modules/character-sheet.js",
  "./modules/images.js",
  "./modules/catalog-cache.js",
  "./modules/data.js",
  "./modules/dm-approval.js",
  "./modules/invitations.js",
  "./modules/library-state.js",
  "./modules/dashboard.js",
  "./modules/campaign-items.js",
  "./modules/library.js",
  "./modules/admin.js",
  "./modules/player.js",
  "./modules/dm-tools.js",
  "./modules/ui-auth.js"
];

function loadFeatureScript(relativePath) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(relativePath, import.meta.url).href;
    script.async = false;
    script.dataset.dndVaultModule = relativePath;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${relativePath}`));
    document.head.appendChild(script);
  });
}

try {
  for (const file of FEATURE_FILES) {
    await loadFeatureScript(file);
  }
  delete window.__DND_VAULT_DEPS__;
  console.info(`[D&D Vault] Step 8 modules loaded (${FEATURE_FILES.length} files).`);
} catch (error) {
  console.error("[D&D Vault] Modular bootstrap failed:", error);
  const display = document.getElementById("userDisplay");
  if (display) display.textContent = "App failed to load";
}
