// CampaignAtlas — ordered runtime bootstrap
// This file stays as the single <script type="module"> entry point.
// Feature code is loaded in a fixed order from ./modules/ so existing
// cross-feature behavior remains unchanged while the codebase is split up.

import { db, storage, auth, provider, signInWithPopup, signOut }
  from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { ref, getDownloadURL, uploadBytes, getBlob }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// The feature files are intentionally loaded as ordered browser scripts.
// This is the lowest-risk way to split the existing app without changing
// its shared runtime state or requiring a bundler.
window.__DND_VAULT_DEPS__ = Object.freeze({
  db, storage, auth, provider, signInWithPopup, signOut,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  collection, getDocs, addDoc, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, limit, writeBatch, runTransaction, increment, orderBy, startAfter, documentId, onSnapshot,
  ref, getDownloadURL, uploadBytes, getBlob,
});

const ASSET_VERSION = "20261010-ui-cleanup-v82";

// Keep the optional character-engine styles cache-versioned with the scripts.
if (!document.querySelector('link[data-character-adobe-integration]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL(`../css/character-adobe-integration.css?v=${ASSET_VERSION}`, import.meta.url).href;
  link.dataset.characterAdobeIntegration = 'true';
  document.head.appendChild(link);
}

// Order matters: rules and stores precede their UI adapters; authentication starts last.
const FEATURE_FILES = [
  "./modules/campaign-rules.js",
  "./modules/campaign-workspace-store.js",
  "./modules/campaign-one-shots-store.js",
  "./modules/campaign-creatures.js",
  "./modules/personal-creature-library.js",
  "./modules/campaign-monster-import.js",
  "./modules/campaign-encounters.js",
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
  "./modules/character-journal-ui.js",
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
  "./modules/character-sheet-print.js",
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
  "./modules/campaign-workspace-ui.js",
  "./modules/campaign-creatures-ui.js",
  "./modules/campaign-chapters-ui.js",
  "./modules/campaign-monster-catalog-ui.js",
  "./modules/campaign-encounters-ui.js",
  "./modules/campaign-one-shots-ui.js",
  "./modules/campaign-rules-ui.js",
  "./modules/site-help-data.js",
  "./modules/site-help.js",
  "./modules/ui-auth.js"
];

/** Load one shared-scope feature script and fail startup if it cannot be fetched. */
function loadFeatureScript(relativePath) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const moduleUrl = new URL(relativePath, import.meta.url);
    moduleUrl.searchParams.set("v", ASSET_VERSION);
    script.src = moduleUrl.href;
    script.async = false;
    script.dataset.dndVaultModule = relativePath;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${relativePath}`));
    document.head.appendChild(script);
  });
}

// Preload downloads in parallel; execution below stays ordered for shared-scope dependencies.
for (const file of FEATURE_FILES) {
  const preload=document.createElement('link');preload.rel='preload';preload.as='script';
  const url=new URL(file,import.meta.url);url.searchParams.set('v',ASSET_VERSION);preload.href=url.href;document.head.append(preload);
}
try {
  for (const file of FEATURE_FILES) {
    await loadFeatureScript(file);
  }
  delete window.__DND_VAULT_DEPS__;
  document.dispatchEvent(new Event('campaignatlas:ready'));
} catch (error) {
  console.error("[CampaignAtlas] Modular bootstrap failed:", error);
  document.dispatchEvent(new Event('campaignatlas:failed'));
  const display = document.getElementById("userDisplay");
  if (display) display.textContent = "App failed to load";
}
