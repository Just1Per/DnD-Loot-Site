"use strict";

// DATA LOADERS
// Extracted from the working Step 7 app with behavior preserved.

// ─── DATA LOADERS ─────────────────────────────────────────────────────────────

function directoryDisplayName(profile, uid) {
  const email = normalizeEmail(profile?.email);
  const rawName = String(profile?.name || "").trim();
  const nameLooksLikeEmail = rawName.includes("@") || (email && normalizeEmail(rawName) === email);
  return (!rawName || nameLooksLikeEmail) ? `Player ${String(uid).slice(0, 6)}` : rawName;
}

function directoryEmailHint(email) {
  const normalized = normalizeEmail(email);
  const at = normalized.indexOf("@");
  if (at <= 0) return "";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}${local.length > shown.length ? "***" : ""}@${domain}`;
}

async function syncUserDirectoryEntry(uid, profile) {
  if (!uid || !profile) return false;

  // The registered-user directory is an optional discovery feature. A missing
  // or not-yet-deployed directory rule must NEVER prevent the real /users/{uid}
  // account from loading.
  try {
    await setDoc(
      doc(db, "userDirectory", uid),
      {
        uid,
        name: directoryDisplayName(profile, uid),
        emailHint: directoryEmailHint(profile.email),
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn("Registered-user directory sync skipped:", e?.message || e);
    return false;
  }
}


async function loadCurrentUser(firebaseUser) {
  const uidRef = doc(db, "users", firebaseUser.uid);

  try {
    const uidSnap = await getDoc(uidRef);
    if (uidSnap.exists()) {
      currentUser = { uid: firebaseUser.uid, id: firebaseUser.uid, ...uidSnap.data() };
      await syncUserDirectoryEntry(firebaseUser.uid, currentUser);
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
    await syncUserDirectoryEntry(firebaseUser.uid, currentUser);

  } catch (e) {
    console.error("Failed loading current user:", e);
    throw e;
  }
}

/**
 * Load the master item catalogue without resolving every Storage URL first.
 * Cards paint immediately with cached/placeholder art and resolve images near the viewport.
 */
async function loadItemsFromFirestore({ forceRefresh = false } = {}) {
  const metaPromise = readCatalogMeta();
  const cached = forceRefresh ? null : await readCatalogCache();

  // Paint cached catalogue immediately. This is the main perceived-speed win:
  // filters/cards can exist before any large Firestore read occurs.
  if (cached?.items?.length) {
    catalogVersion = Number(cached.version) || 0;
    applyCatalogItems(cached.items);
  }

  const serverMeta = await metaPromise;
  const serverVersion = Number(serverMeta?.version) || 0;
  const cachedVersion = Number(cached?.version) || 0;
  const cacheAge = cached?.cachedAt ? Date.now() - cached.cachedAt : Infinity;

  const versionMatch = !!cached?.items?.length
    && serverVersion > 0
    && cachedVersion === serverVersion;

  // Compatibility path for the very first deployment before an admin has
  // created catalog_meta. It avoids repeated full downloads for one day.
  const legacyCacheFresh = !!cached?.items?.length
    && serverVersion === 0
    && cacheAge < CATALOG_NO_META_TTL_MS;

  if (!forceRefresh && (versionMatch || legacyCacheFresh)) {
    console.debug(
      `[catalog] IndexedDB hit — ${cached.items.length} items, version ${cachedVersion || "legacy"}`
    );

    // First admin visit upgrades the database to proper versioned caching.
    if (serverVersion === 0 && isAdmin()) {
      await seedCatalogMetaIfNeeded();
    }
    return;
  }

  console.debug("[catalog] refreshing master catalogue from Firestore");
  const { freshItems, embeddedMeta } = await fetchFreshCatalog();

  catalogVersion = serverVersion || Number(embeddedMeta?.version) || 0;
  applyCatalogItems(freshItems);

  if (catalogVersion === 0 && isAdmin()) {
    await seedCatalogMetaIfNeeded();
  } else {
    await writeCatalogCache(catalogVersion);
  }
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

    // One-time/ongoing directory backfill. Directory sync is deliberately
    // non-fatal so an unavailable directory can never break admin login.
    await Promise.allSettled(users.map(user => syncUserDirectoryEntry(user.id, user)));
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


