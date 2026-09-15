const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

async function requireCampaignManager(uid, campaignId) {
  const campaignRef = db.doc(`campaigns/${campaignId}`);
  const memberRef = db.doc(`campaigns/${campaignId}/members/${uid}`);
  const userRef = db.doc(`users/${uid}`);

  const [campaignSnap, memberSnap, userSnap] = await Promise.all([
    campaignRef.get(),
    memberRef.get(),
    userRef.get()
  ]);

  if (!campaignSnap.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }

  const campaign = campaignSnap.data();
  const member = memberSnap.exists ? memberSnap.data() : null;
  const user = userSnap.exists ? userSnap.data() : null;

  const globalRoles = Array.isArray(user?.role)
    ? user.role
    : user?.role
      ? [user.role]
      : [];

  const isAdmin = globalRoles.includes("admin");
  const isOwner = campaign.ownerId === uid || campaign.dmId === uid;
  const isCampaignDM = member?.status === "active" && member?.role === "dm";

  if (!isAdmin && !isOwner && !isCampaignDM) {
    throw new HttpsError(
      "permission-denied",
      "Only the campaign DM can manage members."
    );
  }

  return campaign;
}

exports.listRegisteredUsersSecure = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const campaignId = request.data?.campaignId;

  if (!campaignId || typeof campaignId !== "string") {
    throw new HttpsError("invalid-argument", "campaignId is required.");
  }

  await requireCampaignManager(request.auth.uid, campaignId);

  const membersSnap = await db
    .collection(`campaigns/${campaignId}/members`)
    .get();

  const existingMemberIds = new Set(
    membersSnap.docs.map(memberDoc => memberDoc.id)
  );

  const authResult = await getAuth().listUsers(1000);

  const users = authResult.users
    .filter(user =>
      user.uid !== request.auth.uid &&
      !existingMemberIds.has(user.uid)
    )
    .map(user => ({
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || ""
    }))
    .sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email)
    );

  return { users };
});

exports.addExistingUserToCampaignSecure = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { campaignId, targetUid, role } = request.data || {};

  if (!campaignId || typeof campaignId !== "string") {
    throw new HttpsError("invalid-argument", "campaignId is required.");
  }

  if (!targetUid || typeof targetUid !== "string") {
    throw new HttpsError("invalid-argument", "targetUid is required.");
  }

  if (!["player", "dm"].includes(role)) {
    throw new HttpsError("invalid-argument", "Role must be player or dm.");
  }

  await requireCampaignManager(request.auth.uid, campaignId);

  let targetAuthUser;

  try {
    targetAuthUser = await getAuth().getUser(targetUid);
  } catch (error) {
    throw new HttpsError("not-found", "Registered user not found.");
  }

  const memberRef = db.doc(`campaigns/${campaignId}/members/${targetUid}`);
  const userCampaignRef = db.doc(`users/${targetUid}/campaigns/${campaignId}`);

  await db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);

    if (memberSnap.exists) {
      throw new HttpsError(
        "already-exists",
        "This user is already a member of the campaign."
      );
    }

    transaction.set(memberRef, {
      uid: targetUid,
      role,
      status: "active",
      name: targetAuthUser.displayName || targetAuthUser.email || "Player",
      email: targetAuthUser.email || null,
      addedBy: request.auth.uid,
      joinedAt: FieldValue.serverTimestamp()
    });

    transaction.set(userCampaignRef, {
      campaignId,
      role,
      status: "active",
      addedBy: request.auth.uid,
      joinedAt: FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    uid: targetUid,
    role
  };
});
