"use strict";

// Versioned master catalogue cache. Campaign copies and private ownership are not cached here.

// ─── MASTER CATALOGUE CACHE (INDEXEDDB) ──────────────────────────────────────

/**
 * The item catalogue changes rarely, but historically every refresh downloaded
 * every /items document. Step 7 keeps a local IndexedDB copy and performs only
 * one tiny Firestore metadata read on normal refreshes.
 *
 * /items/catalog_meta
 *   version: timestamp-like integer
 *   itemCount: number
 *   updatedAt: number
 *
 * Admin item edits bump the version. Other clients see the new version and
 * refresh the catalogue once, then return to IndexedDB cache hits.
 */
function openCatalogCacheDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(CATALOG_CACHE_DB, CATALOG_CACHE_DB_VERSION);

    request.onupgradeneeded = () => {
      const dbHandle = request.result;
      if (!dbHandle.objectStoreNames.contains(CATALOG_CACHE_STORE)) {
        dbHandle.createObjectStore(CATALOG_CACHE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      const handle=request.result;
      const tx=handle.transaction(CATALOG_CACHE_STORE,'readwrite');
      const store=tx.objectStore(CATALOG_CACHE_STORE);
      for(const key of ['master-items','master-items-reviewed-v1',catalogAudienceKey(true)])store.delete(key);
      tx.oncomplete=()=>resolve(handle);
      tx.onerror=()=>{handle.close();reject(tx.error);};
      tx.onabort=()=>{handle.close();reject(tx.error);};
    };
    request.onerror   = () => reject(request.error);
  });
}

/** Cache failures are recoverable: return null so the loader can read Firestore. */
function catalogAudienceKey(administrator = isAdmin()) {
  return CATALOG_CACHE_KEY + ':' + SharedCataloguePolicy.audience(administrator);
}

async function readCatalogCache({administrator = isAdmin()} = {}) {
  if(administrator)return null;
  let dbHandle;

  try {
    dbHandle = await openCatalogCacheDB();
    if (!dbHandle) return null;

    return await new Promise((resolve, reject) => {
      const tx = dbHandle.transaction(CATALOG_CACHE_STORE, "readonly");
      const request = tx.objectStore(CATALOG_CACHE_STORE).get(catalogAudienceKey(administrator));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror   = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Catalogue cache read failed; falling back to Firestore.", e);
    return null;
  } finally {
    try { dbHandle?.close(); } catch {}
  }
}

function catalogItemsForCache() {
  // imageUrl is a short-lived/local Storage resolution. Do not persist it as
  // catalogue data. A future thumbnailUrl field *is* persisted automatically.
  return rootItems.map(item => {
    const cachedItem = { ...item };
    if (!cachedItem.imageUrl?.startsWith("https://")) delete cachedItem.imageUrl;
    return cachedItem;
  });
}

/** Cache a versioned snapshot only after its IndexedDB transaction completes. */
async function writeCatalogCache(version = catalogVersion) {
  let dbHandle;
  const administrator=isAdmin();
  // Unreviewed administrator data must not persist for another local account.
  if(administrator)return;
  const record={key:catalogAudienceKey(administrator),version:Number(version)||0,cachedAt:Date.now(),
    items:catalogItemsForCache().filter(item=>administrator||SharedCataloguePolicy.approved(item))};

  try {
    dbHandle = await openCatalogCacheDB();
    if (!dbHandle) return;

    await new Promise((resolve, reject) => {
      const tx = dbHandle.transaction(CATALOG_CACHE_STORE, "readwrite");
      tx.objectStore(CATALOG_CACHE_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
      tx.onabort    = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Catalogue cache write failed; the app will continue normally.", e);
  } finally {
    try { dbHandle?.close(); } catch {}
  }
}

async function clearCatalogCache() {
  let dbHandle;

  try {
    dbHandle = await openCatalogCacheDB();
    if (!dbHandle) return;

    await new Promise((resolve, reject) => {
      const tx = dbHandle.transaction(CATALOG_CACHE_STORE, "readwrite");
      // Clear old unreviewed and administrator snapshots on explicit recovery.
      tx.objectStore(CATALOG_CACHE_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } finally {
    try { dbHandle?.close(); } catch {}
  }
}

function applyCatalogItems(sourceItems) {
  rootItems = (sourceItems || [])
    .filter(item => item?.id && item.id !== CATALOG_META_ID && (isAdmin() || SharedCataloguePolicy.approved(item)))
    .map(raw => ({
      ...raw,
      // Optional Step 7+ thumbnail field: if you later store direct WebP/JPEG
      // thumbnail URLs in Firestore, cards can paint them immediately.
      imageUrl: raw.artwork?.status==='none'?'':raw.imageUrl || raw.thumbnailUrl || raw.thumbUrl || getCachedImageUrl(raw.id)
    }));

  populateSourceFilter();
  populateCampaignFilter();

  if (document.getElementById("rootCatalogueScreen")?.style.display === "block") renderRootCatalogue();
}

async function readCatalogMeta() {
  try {
    const snap = await getDoc(doc(db, "items", CATALOG_META_ID));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("Could not read catalogue metadata.", e);
    return null;
  }
}

async function fetchFreshCatalog({administrator = isAdmin()} = {}) {
  const reference=collection(db,"items");
  const snap = await getDocs(administrator?reference:query(reference,where('catalogueStatus','==',SharedCataloguePolicy.STATUS)));

  let embeddedMeta = null;
  const freshItems = [];

  snap.docs.forEach(d => {
    if (d.id === CATALOG_META_ID) {
      embeddedMeta = d.data();
      return;
    }
    freshItems.push({ ...d.data(), id: d.id });
  });

  return { freshItems, embeddedMeta };
}

/** Write the shared cache-invalidation record; callers retain their own recovery behavior. */
async function writeCatalogMetadata(version) {
  await setDoc(doc(db, "items", CATALOG_META_ID), {
    _type: "catalog-meta",
    version,
    itemCount: rootItems.length,
    updatedAt: version
  }, { merge: true });
  catalogVersion = version;
}

/** Upgrade an unversioned catalogue during an admin visit, then cache the same version. */
async function seedCatalogMetaIfNeeded() {
  if (!isAdmin()) return catalogVersion;

  const version = Date.now();

  try {
    await writeCatalogMetadata(version);
    await writeCatalogCache(catalogVersion);
    return catalogVersion;
  } catch (e) {
    console.warn("Could not seed catalogue metadata.", e);
    return catalogVersion;
  }
}

/** Invalidate other clients after a root edit without undoing a successful item save. */
async function markCatalogChanged() {
  // Every master-item mutation is admin-only, so the existing /items rule lets
  // the same admin update this metadata document as well.
  const version = Date.now();

  try {
    await writeCatalogMetadata(version);
  } catch (e) {
    // Do not undo a successful item edit just because cache invalidation failed.
    console.warn("Item saved, but catalogue version could not be updated.", e);
  }

  await writeCatalogCache(catalogVersion);
}

// Handy diagnostic/recovery helpers for the browser console.
window.dndVaultCatalogCache = {
  clear: clearCatalogCache,
  refresh: async () => {
    await clearCatalogCache();
    return loadItemsFromFirestore({ forceRefresh: true });
  },
  info: async () => ({
    server: await readCatalogMeta(),
    local: await readCatalogCache()
  })
};

