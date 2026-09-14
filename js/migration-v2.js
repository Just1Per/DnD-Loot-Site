/**
 * D&D Item Vault — Foundation V2 migration
 * ========================================
 *
 * This migration is designed for the merged campaign architecture.
 *
 * It:
 *  - copies global characters -> campaigns/{campaignId}/characters
 *  - copies global wishes -> campaigns/{campaignId}/saves
 *  - creates campaign membership documents
 *  - creates the fast users/{uid}/campaigns/{campaignId} membership index
 *  - moves legacy item loot/highlight/owner state out of global items and into
 *    campaigns/{campaignId}/itemState/{itemId} when the campaign can be inferred
 *  - copies any Claude-style itemVisibility overrides into itemState.visible
 *
 * It DOES NOT delete the legacy global collections or legacy item fields.
 * Verify the new structure first, then clean up separately.
 *
 * Usage from your deployed site's DevTools console:
 *
 *   const { runMigration } = await import("/js/migration-v2.js");
 *   await runMigration({ dryRun: true });   // inspect first
 *   await runMigration({ dryRun: false });  // then actually write
 */

import { db } from "./firebase.js";

import {
  collection,
  doc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const normalize = value => (value || "").trim().toLowerCase();

async function writeDoc(ref, data, options, dryRun) {
  if (dryRun) return;
  await setDoc(ref, data, options);
}


export async function runMigration({ dryRun = true } = {}) {
  const startedAt = Date.now();

  console.log("══════════════════════════════════════════════════");
  console.log("D&D Item Vault — Foundation V2 migration");
  console.log(dryRun ? "MODE: DRY RUN — no writes will be made" : "MODE: LIVE WRITE");
  console.log("══════════════════════════════════════════════════");

  const [campaignSnap, charSnap, wishSnap, itemSnap] = await Promise.all([
    getDocs(collection(db, "campaigns")),
    getDocs(collection(db, "characters")),
    getDocs(collection(db, "wishes")),
    getDocs(collection(db, "items"))
  ]);

  const campaigns = campaignSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const characters = charSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const wishes = wishSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const items = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Campaigns:  ${campaigns.length}`);
  console.log(`Characters: ${characters.length}`);
  console.log(`Saves:      ${wishes.length}`);
  console.log(`Items:      ${items.length}`);

  const campaignsByName = new Map();

  for (const campaign of campaigns) {
    const key = normalize(campaign.name);
    if (!campaignsByName.has(key)) campaignsByName.set(key, []);
    campaignsByName.get(key).push(campaign);
  }

  const stats = {
    campaignsPrepared: 0,
    membersIndexed: 0,
    charactersCopied: 0,
    charactersSkipped: 0,
    savesCopied: 0,
    savesSkipped: 0,
    itemStateCopied: 0,
    itemStateAmbiguous: 0,
    visibilityCopied: 0
  };

  const charCampaignMap = new Map(); // characterId -> campaign
  const membershipKeys = new Set();

  async function ensureMembership(campaign, uid, role = "player", extra = {}) {
    if (!uid) return;

    const key = `${campaign.id}:${uid}`;
    const effectiveRole = uid === campaign.dmId || uid === campaign.ownerId
      ? "dm"
      : role;

    const memberData = {
      uid,
      role: effectiveRole,
      status: "active",
      joinedAt: extra.joinedAt || Date.now()
    };

    await Promise.all([
      writeDoc(
        doc(db, "campaigns", campaign.id, "members", uid),
        memberData,
        { merge: true },
        dryRun
      ),
      writeDoc(
        doc(db, "users", uid, "campaigns", campaign.id),
        {
          role: effectiveRole,
          status: "active",
          joinedAt: memberData.joinedAt
        },
        { merge: true },
        dryRun
      )
    ]);

    if (!membershipKeys.has(key)) {
      membershipKeys.add(key);
      stats.membersIndexed++;
    }
  }

  // 1) Prepare campaigns and index existing members / owners.
  for (const campaign of campaigns) {
    const campaignRef = doc(db, "campaigns", campaign.id);

    const patch = {
      schemaVersion: 2,
      defaultItemVisible: campaign.defaultItemVisible ?? true,
      updatedAt: campaign.updatedAt || Date.now()
    };

    if (!campaign.ownerId && campaign.dmId) patch.ownerId = campaign.dmId;

    await writeDoc(campaignRef, patch, { merge: true }, dryRun);
    stats.campaignsPrepared++;

    if (campaign.dmId) {
      await ensureMembership(campaign, campaign.dmId, "dm", {
        joinedAt: campaign.created || Date.now()
      });
    }

    // Preserve/index any member documents that already exist.
    const existingMembers = await getDocs(
      collection(db, "campaigns", campaign.id, "members")
    );

    for (const memberDoc of existingMembers.docs) {
      const member = memberDoc.data();
      if (member.status && member.status !== "active") continue;

      await ensureMembership(
        campaign,
        memberDoc.id,
        member.role || "player",
        { joinedAt: member.joinedAt }
      );
    }
  }

  // 2) Migrate characters.
  for (const char of characters) {
    const candidates = campaignsByName.get(normalize(char.campaign)) || [];

    if (candidates.length !== 1) {
      console.warn(
        `⚠ Character "${char.name}" (${char.id}) has campaign "${char.campaign}". ` +
        (candidates.length === 0
          ? "No matching campaign found."
          : "Multiple campaigns have that name; migration is ambiguous."),
        "Skipping."
      );

      stats.charactersSkipped++;
      continue;
    }

    const campaign = candidates[0];
    charCampaignMap.set(char.id, campaign);

    const {
      id: _id,
      campaign: _legacyCampaignName,
      ...charData
    } = char;

    await writeDoc(
      doc(db, "campaigns", campaign.id, "characters", char.id),
      {
        ...charData,
        migratedFrom: "global-characters",
        migratedAt: Date.now()
      },
      { merge: true },
      dryRun
    );

    await ensureMembership(
      campaign,
      char.userId,
      char.userId === campaign.dmId ? "dm" : "player"
    );

    stats.charactersCopied++;
    console.log(`✓ Character "${char.name}" -> ${campaign.name}`);
  }

  // 3) Migrate saves/wishes.
  for (const wish of wishes) {
    const campaign = charCampaignMap.get(wish.characterId);

    if (!campaign) {
      console.warn(
        `⚠ Save ${wish.id} references character ${wish.characterId}, ` +
        "but that character could not be mapped to one campaign. Skipping."
      );
      stats.savesSkipped++;
      continue;
    }

    const {
      id: _id,
      ...saveData
    } = wish;

    await writeDoc(
      doc(db, "campaigns", campaign.id, "saves", wish.id),
      {
        ...saveData,
        migratedFrom: "global-wishes",
        migratedAt: Date.now()
      },
      { merge: true },
      dryRun
    );

    stats.savesCopied++;
  }

  // 4) Migrate old global item state into the campaign that owns the character.
  // If there is exactly one campaign, unowned legacy state can safely be mapped there.
  for (const item of items) {
    const hasLegacyState =
      item.looted !== undefined ||
      item.highlighted !== undefined ||
      item.owner !== undefined ||
      item.receivedDate !== undefined;

    if (!hasLegacyState) continue;

    let campaign = null;

    if (item.owner) {
      campaign = charCampaignMap.get(item.owner) || null;
    } else if (campaigns.length === 1 && (item.looted || item.highlighted)) {
      campaign = campaigns[0];
    }

    // False/default legacy values do not need a campaign state document.
    const meaningfulState =
      item.looted === true ||
      item.highlighted === true ||
      !!item.owner ||
      !!item.receivedDate;

    if (!meaningfulState) continue;

    if (!campaign) {
      console.warn(
        `⚠ Item "${item.name}" (${item.id}) has legacy campaign-specific state ` +
        "but no unique campaign can be inferred. Review it manually."
      );
      stats.itemStateAmbiguous++;
      continue;
    }

    await writeDoc(
      doc(db, "campaigns", campaign.id, "itemState", item.id),
      {
        looted: item.looted === true,
        highlighted: item.highlighted === true,
        owner: item.owner || null,
        receivedDate: item.receivedDate || null,
        migratedAt: Date.now()
      },
      { merge: true },
      dryRun
    );

    stats.itemStateCopied++;
  }

  // 5) Copy Claude-style visibility docs, if any, into the combined itemState collection.
  for (const campaign of campaigns) {
    const visibilitySnap = await getDocs(
      collection(db, "campaigns", campaign.id, "itemVisibility")
    );

    for (const visibilityDoc of visibilitySnap.docs) {
      const data = visibilityDoc.data();

      if (typeof data.visible !== "boolean") continue;

      await writeDoc(
        doc(db, "campaigns", campaign.id, "itemState", visibilityDoc.id),
        {
          visible: data.visible,
          migratedFrom: "itemVisibility",
          migratedAt: Date.now()
        },
        { merge: true },
        dryRun
      );

      stats.visibilityCopied++;
    }
  }

  console.log("══════════════════════════════════════════════════");
  console.log(dryRun ? "DRY RUN COMPLETE" : "MIGRATION COMPLETE");
  console.table(stats);
  console.log(`Elapsed: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

  if (dryRun) {
    console.log("No data was changed. If the warnings look correct, run:");
    console.log('await runMigration({ dryRun: false })');
  } else {
    console.log("Legacy global characters/, wishes/, itemVisibility/ and legacy item state were NOT deleted.");
    console.log("Verify the new app thoroughly before cleaning old data.");
  }

  return stats;
}

