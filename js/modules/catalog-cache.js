"use strict";

// MASTER CATALOGUE CACHE
// Extracted from the working Step 7 app with behavior preserved.

// ─── MASTER CATALOGUE CACHE (INDEXEDDB) ──────────────────────────────────────

/**
 * The item catalogue changes rarely, but historically every refresh downloaded
 * every /items document. Step 7 keeps a local IndexedDB copy and performs only
 * one tiny Firestore metadata read on normal refreshes.
 *
 * /items/__catalog_meta__
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

    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

async function readCatalogCache() {
  let dbHandle;

  try {
    dbHandle = await openCatalogCacheDB();
    if (!dbHandle) return null;

    return await new Promise((resolve, reject) => {
      const tx = dbHandle.transaction(CATALOG_CACHE_STORE, "readonly");
      const request = tx.objectStore(CATALOG_CACHE_STORE).get(CATALOG_CACHE_KEY);
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

async function writeCatalogCache(version = catalogVersion) {
  let dbHandle;

  try {
    dbHandle = await openCatalogCacheDB();
    if (!dbHandle) return;

    const record = {
      key: CATALOG_CACHE_KEY,
      version: Number(version) || 0,
      cachedAt: Date.now(),
      items: catalogItemsForCache()
    };

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
      tx.objectStore(CATALOG_CACHE_STORE).delete(CATALOG_CACHE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } finally {
    try { dbHandle?.close(); } catch {}
  }
}

function applyCatalogItems(sourceItems) {
  rootItems = (sourceItems || [])
    .filter(item => item?.id && item.id !== CATALOG_META_ID)
    .map(raw => ({
      ...raw,
      // Optional Step 7+ thumbnail field: if you later store direct WebP/JPEG
      // thumbnail URLs in Firestore, cards can paint them immediately.
      imageUrl: raw.imageUrl || raw.thumbnailUrl || raw.thumbUrl || getCachedImageUrl(raw.id)
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

async function fetchFreshCatalog() {
  const snap = await getDocs(collection(db, "items"));

  let embeddedMeta = null;
  const freshItems = [];

  snap.docs.forEach(d => {
    if (d.id === CATALOG_META_ID) {
      embeddedMeta = d.data();
      return;
    }
    freshItems.push({ id: d.id, ...d.data() });
  });

  return { freshItems, embeddedMeta };
}

async function seedCatalogMetaIfNeeded() {
  if (!isAdmin()) return catalogVersion;

  const version = Date.now();

  try {
    await setDoc(doc(db, "items", CATALOG_META_ID), {
      _type: "catalog-meta",
      version,
      itemCount: rootItems.length,
      updatedAt: version
    }, { merge: true });

    catalogVersion = version;
    await writeCatalogCache(catalogVersion);
    return catalogVersion;
  } catch (e) {
    console.warn("Could not seed catalogue metadata.", e);
    return catalogVersion;
  }
}

async function markCatalogChanged() {
  // Every master-item mutation is admin-only, so the existing /items rule lets
  // the same admin update this metadata document as well.
  const version = Date.now();

  try {
    await setDoc(doc(db, "items", CATALOG_META_ID), {
      _type: "catalog-meta",
      version,
      itemCount: rootItems.length,
      updatedAt: version
    }, { merge: true });

    catalogVersion = version;
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

