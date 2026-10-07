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
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { ref, getDownloadURL, uploadBytes }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// The feature files are intentionally loaded as ordered browser scripts.
// This is the lowest-risk way to split the existing app without changing
// its shared runtime state or requiring a bundler.
window.__DND_VAULT_DEPS__ = Object.freeze({
  db, storage, auth, provider, signInWithPopup, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId, onSnapshot,
  ref, getDownloadURL, uploadBytes,
});

// Keep the optional character-engine styles cache-versioned with the scripts.
if (!document.querySelector('link[data-character-adobe-integration]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/character-adobe-integration.css?v=20261007-hp-invocations-v59', import.meta.url).href;
  link.dataset.characterAdobeIntegration = 'true';
  document.head.appendChild(link);
}

const FEATURE_FILES = [
  "./modules/character-equipment.js",
  "./modules/character-magic-armor.js",
  "./modules/character-magic-item-data.js",
  "./modules/character-magic-items.js",
  "./modules/campaign-store.js",
  "./modules/core.js",
  "./modules/character-race-catalog.js",
  "./modules/character-expanded-race-data.js",
  "./modules/character-background-data.js",
  "./modules/character-expanded-background-data.js",
  "./modules/character-backgrounds.js",
  "./modules/character-rules-2024.js",
  "./modules/character-rules.js",
  "./modules/character-subclass-data.js",
  "./modules/character-expanded-subclass-data.js",
  "./modules/character-srd-class-data.js",
  "./modules/character-class-progression.js",
  "./modules/character-rules-catalog-store.js",
  "./modules/character-feat-data.js",
  "./modules/character-feat-reference.js",
  "./modules/character-feat-rules.js",
  "./modules/character-catalog.js",
  "./modules/character-class-feature-choices.js",
  "./modules/character-build-validation.js",
  "./modules/character-adobe-data.js",
  "./modules/character-creature-data.js",
  "./modules/character-creature-data-1.js",
  "./modules/character-creature-data-2.js",
  "./modules/character-creature-data-3.js",
  "./modules/character-creature-data-4.js",
  "./modules/character-play-rules.js",
  "./modules/character-actions.js",
  "./modules/character-story.js",
  "./modules/character-progression.js",
  "./modules/character-sheet-model.js",
  "./modules/character-sheet-store.js",
  "./modules/character-overview-ui.js",
  "./modules/character-play-ui.js",
  "./modules/character-point-buy-ui.js",
  "./modules/character-inventory-ui.js",
  "./modules/character-action-ui.js",
  "./modules/character-sheet.js",
  "./modules/character-equipment-ui.js",
  "./modules/character-catalog-ui.js",
  "./modules/character-adobe-engine.js",
  "./modules/character-spellcasting.js",
  "./modules/character-adobe-builder-ui.js",
  "./modules/character-adobe-pages.js",
  "./modules/character-creature-ui.js",
  "./modules/character-spellcasting-ui.js",
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
    const moduleUrl = new URL(relativePath, import.meta.url);
    moduleUrl.searchParams.set("v", "20261007-hp-invocations-v59");
    script.src = moduleUrl.href;
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
