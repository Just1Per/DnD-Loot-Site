const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const DEFAULT_LIMITS = Object.freeze({
  campaignsPerDM: 5,
  membersPerCampaign: 12,
  charactersPerUserPerCampaign: 5,
  savedItemsPerCharacter: 100
});

const ALL_CLASSES = new Set([
  "Artificer","Barbarian","Bard","Cleric","Druid","Fighter",
  "Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard"
]);

function requireAuth(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be signed in.");
  return request.auth.uid;
}

function rolesOf(data) {
  const role = data?.role;
  if (Array.isArray(role)) return role;
  return role ? [role] : [];
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

async function getLimits(tx) {
  const ref = db.doc("config/usageLimits");
  const snap = tx ? await tx.get(ref) : await ref.get();
  const data = snap.exists ? snap.data() : {};
  return {
    campaignsPerDM: positiveInt(data?.campaignsPerDM, DEFAULT_LIMITS.campaignsPerDM),
    membersPerCampaign: positiveInt(data?.membersPerCampaign, DEFAULT_LIMITS.membersPerCampaign),
    charactersPerUserPerCampaign: positiveInt(data?.charactersPerUserPerCampaign, DEFAULT_LIMITS.charactersPerUserPerCampaign),
    savedItemsPerCharacter: positiveInt(data?.savedItemsPerCharacter, DEFAULT_LIMITS.savedItemsPerCharacter)
  };
}

async function getUserState(tx, uid) {
  const snap = await tx.get(db.doc(`users/${uid}`));
  if (!snap.exists) throw new HttpsError("failed-precondition", "Your user profile is missing.");
  const data = snap.data();
  const roles = rolesOf(data);
  return { data, roles, isAdmin: roles.includes("admin"), canCreateCampaigns: roles.includes("admin") || roles.includes("dm") };
}

async function getCampaignManagerState(tx, uid, campaignId) {
  const campaignRef = db.doc(`campaigns/${campaignId}`);
  const campaignSnap = await tx.get(campaignRef);
  if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

  const userState = await getUserState(tx, uid);
  const campaign = campaignSnap.data();
  let canManage = userState.isAdmin || campaign.ownerId === uid;

  if (!canManage) {
    const memberSnap = await tx.get(db.doc(`campaigns/${campaignId}/members/${uid}`));
    canManage = memberSnap.exists
      && memberSnap.data().status === "active"
      && memberSnap.data().role === "dm";
  }

  if (!canManage) throw new HttpsError("permission-denied", "You are not a DM for this campaign.");
  return { campaign, userState };
}

exports.createCampaignSecure = onCall(async (request) => {
  const uid = requireAuth(request);
  const name = cleanText(request.data?.name, 100);
  const description = cleanText(request.data?.description, 2000);
  if (!name) throw new HttpsError("invalid-argument", "Campaign name is required.");

  return db.runTransaction(async (tx) => {
    const limits = await getLimits(tx);
    const userState = await getUserState(tx, uid);
    if (!userState.canCreateCampaigns) {
      throw new HttpsError("permission-denied", "Your account is not approved to create campaigns.");
    }

    if (!userState.isAdmin) {
      const ownedQuery = db.collection("campaigns").where("ownerId", "==", uid);
      const ownedSnap = await tx.get(ownedQuery);
      if (ownedSnap.size >= limits.campaignsPerDM) {
        throw new HttpsError("resource-exhausted", `You can own a maximum of ${limits.campaignsPerDM} campaigns.`);
      }
    }

    const now = Date.now();
    const campaignRef = db.collection("campaigns").doc();
    const data = {
      name,
      description,
      dmId: uid,
      ownerId: uid,
      defaultItemVisible: true,
      schemaVersion: 2,
      created: now,
      updatedAt: now
    };

    tx.set(campaignRef, data);
    tx.set(db.doc(`campaigns/${campaignRef.id}/members/${uid}`), {
      uid,
      displayName: userState.data.name || request.auth.token.email || "Campaign Owner",
      role: "dm",
      status: "active",
      joinedAt: now
    });
    tx.set(db.doc(`users/${uid}/campaigns/${campaignRef.id}`), {
      role: "dm",
      status: "active",
      joinedAt: now
    });

    return { campaign: { id: campaignRef.id, membershipRole: "dm", ...data }, limits };
  });
});

exports.createCampaignInviteSecure = onCall(async (request) => {
  const uid = requireAuth(request);
  const campaignId = cleanText(request.data?.campaignId, 200);
  const name = cleanText(request.data?.name, 120);
  const email = cleanText(request.data?.email, 320);
  const emailLower = normalizeEmail(email);
  const role = request.data?.role === "dm" ? "dm" : "player";

  if (!campaignId || !name || !emailLower || !emailLower.includes("@")) {
    throw new HttpsError("invalid-argument", "Name, email and campaign are required.");
  }

  return db.runTransaction(async (tx) => {
    const limits = await getLimits(tx);
    const { campaign } = await getCampaignManagerState(tx, uid, campaignId);

    const membersSnap = await tx.get(db.collection(`campaigns/${campaignId}/members`));
    const activeMembers = membersSnap.docs.filter(d => d.data().status === "active").length;

    const inviteQuery = db.collection("campaignInvites").where("campaignId", "==", campaignId);
    const inviteSnap = await tx.get(inviteQuery);
    const pending = inviteSnap.docs.filter(d => d.data().status === "pending");

    const duplicate = pending.some(d => normalizeEmail(d.data().emailLower) === emailLower);
    if (duplicate) throw new HttpsError("already-exists", "That email already has a pending invitation to this campaign.");

    if (activeMembers + pending.length >= limits.membersPerCampaign) {
      throw new HttpsError(
        "resource-exhausted",
        `This campaign has reached its ${limits.membersPerCampaign}-seat limit. Active members and pending invitations both reserve a seat.`
      );
    }

    const now = Date.now();
    const inviteRef = db.collection("campaignInvites").doc();
    const data = {
      name,
      email,
      emailLower,
      campaignId,
      campaignName: campaign.name || "Campaign",
      role,
      status: "pending",
      createdBy: uid,
      createdAt: now
    };
    tx.set(inviteRef, data);
    return { invite: { id: inviteRef.id, ...data }, limits };
  });
});

exports.acceptCampaignInviteSecure = onCall(async (request) => {
  const uid = requireAuth(request);
  const inviteId = cleanText(request.data?.inviteId, 200);
  const authEmail = normalizeEmail(request.auth.token.email);
  if (!inviteId || !authEmail) throw new HttpsError("invalid-argument", "A valid invitation and login email are required.");

  return db.runTransaction(async (tx) => {
    const limits = await getLimits(tx);
    const inviteRef = db.doc(`campaignInvites/${inviteId}`);
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new HttpsError("not-found", "Invitation not found.");

    const invite = inviteSnap.data();
    if (invite.status !== "pending") throw new HttpsError("failed-precondition", "This invitation is no longer pending.");
    if (normalizeEmail(invite.emailLower) !== authEmail) throw new HttpsError("permission-denied", "This invitation belongs to a different email address.");

    const campaignRef = db.doc(`campaigns/${invite.campaignId}`);
    const campaignSnap = await tx.get(campaignRef);
    if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

    const memberRef = db.doc(`campaigns/${invite.campaignId}/members/${uid}`);
    const existingMember = await tx.get(memberRef);

    if (!existingMember.exists || existingMember.data().status !== "active") {
      const membersSnap = await tx.get(db.collection(`campaigns/${invite.campaignId}/members`));
      const activeMembers = membersSnap.docs.filter(d => d.data().status === "active").length;
      if (activeMembers >= limits.membersPerCampaign) {
        throw new HttpsError("resource-exhausted", `This campaign already has the maximum of ${limits.membersPerCampaign} active members.`);
      }
    }

    const profileSnap = await tx.get(db.doc(`users/${uid}`));
    const profile = profileSnap.exists ? profileSnap.data() : {};
    const now = Date.now();
    const role = invite.role === "dm" ? "dm" : "player";

    tx.set(memberRef, {
      uid,
      displayName: invite.name || profile.name || request.auth.token.email || "Member",
      role,
      status: "active",
      joinedAt: existingMember.exists ? (existingMember.data().joinedAt || now) : now,
      inviteId
    }, { merge: true });

    tx.set(db.doc(`users/${uid}/campaigns/${invite.campaignId}`), {
      role,
      status: "active",
      joinedAt: now,
      inviteId
    }, { merge: true });

    tx.update(inviteRef, {
      status: "accepted",
      acceptedBy: uid,
      acceptedAt: now
    });

    return { accepted: true, campaignId: invite.campaignId, limits };
  });
});

exports.createCharacterSecure = onCall(async (request) => {
  const uid = requireAuth(request);
  const campaignId = cleanText(request.data?.campaignId, 200);
  const name = cleanText(request.data?.name, 120);
  const className = cleanText(request.data?.className, 80);
  const rawLevel = request.data?.level;
  const level = rawLevel === null || rawLevel === undefined || rawLevel === "" ? null : Number(rawLevel);

  if (!campaignId || !name) throw new HttpsError("invalid-argument", "Campaign and character name are required.");
  if (className && !ALL_CLASSES.has(className)) throw new HttpsError("invalid-argument", "Unknown character class.");
  if (level !== null && (!Number.isInteger(level) || level < 1 || level > 20)) {
    throw new HttpsError("invalid-argument", "Level must be between 1 and 20.");
  }

  return db.runTransaction(async (tx) => {
    const limits = await getLimits(tx);
    const userState = await getUserState(tx, uid);
    const campaignSnap = await tx.get(db.doc(`campaigns/${campaignId}`));
    if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

    if (!userState.isAdmin) {
      const memberSnap = await tx.get(db.doc(`campaigns/${campaignId}/members/${uid}`));
      if (!memberSnap.exists || memberSnap.data().status !== "active") {
        throw new HttpsError("permission-denied", "You are not an active member of this campaign.");
      }
    }

    const charQuery = db.collection(`campaigns/${campaignId}/characters`).where("userId", "==", uid);
    const charSnap = await tx.get(charQuery);
    const activeCount = charSnap.docs.filter(d => d.data().active !== false).length;
    if (activeCount >= limits.charactersPerUserPerCampaign) {
      throw new HttpsError("resource-exhausted", `You can have a maximum of ${limits.charactersPerUserPerCampaign} active characters in one campaign.`);
    }

    const now = Date.now();
    const charRef = db.collection(`campaigns/${campaignId}/characters`).doc();
    const data = { name, class: className, level, userId: uid, active: true, created: now };
    tx.set(charRef, data);
    return { character: { id: charRef.id, ...data }, limits };
  });
});

exports.toggleSavedItemSecure = onCall(async (request) => {
  const uid = requireAuth(request);
  const campaignId = cleanText(request.data?.campaignId, 200);
  const characterId = cleanText(request.data?.characterId, 200);
  const itemId = cleanText(request.data?.itemId, 200);
  if (!campaignId || !characterId || !itemId) {
    throw new HttpsError("invalid-argument", "Campaign, character and item are required.");
  }

  return db.runTransaction(async (tx) => {
    const limits = await getLimits(tx);
    const userState = await getUserState(tx, uid);
    const campaignSnap = await tx.get(db.doc(`campaigns/${campaignId}`));
    if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

    if (!userState.isAdmin) {
      const memberSnap = await tx.get(db.doc(`campaigns/${campaignId}/members/${uid}`));
      if (!memberSnap.exists || memberSnap.data().status !== "active") {
        throw new HttpsError("permission-denied", "You are not an active member of this campaign.");
      }
    }

    const characterRef = db.doc(`campaigns/${campaignId}/characters/${characterId}`);
    const characterSnap = await tx.get(characterRef);
    if (!characterSnap.exists || characterSnap.data().userId !== uid) {
      throw new HttpsError("permission-denied", "You can only save items for your own character.");
    }

    const itemSnap = await tx.get(db.doc(`items/${itemId}`));
    if (!itemSnap.exists) throw new HttpsError("not-found", "Item not found.");

    const saveId = `${characterId}__${itemId}`;
    const saveRef = db.doc(`campaigns/${campaignId}/saves/${saveId}`);
    const existing = await tx.get(saveRef);

    if (existing.exists) {
      tx.delete(saveRef);
      return { saved: false, saveId, limits };
    }

    const savesQuery = db.collection(`campaigns/${campaignId}/saves`).where("characterId", "==", characterId);
    const savesSnap = await tx.get(savesQuery);
    if (savesSnap.size >= limits.savedItemsPerCharacter) {
      throw new HttpsError("resource-exhausted", `A character can save a maximum of ${limits.savedItemsPerCharacter} items.`);
    }

    const data = { itemId, characterId, userId: uid, created: Date.now() };
    tx.set(saveRef, data);
    return { saved: true, saveId, save: data, limits };
  });
});
