# Reviewed shared items and private preservation

The owner-private library is now an alternative to campaign-bound preservation. For the new workflow, follow [the private item library guide](private-item-library.md): explicitly target an owner UID, rebuild the plan and keep original archives separate from reviewed reusable templates. Existing campaign-target plans are not automatically redirected, and existing campaign items are not relocated.

The review report is in [the Danish item-by-item report](reports/item-catalogue-review-2026-10-16.md). Its 331 SRD concept candidates, 22 rewrite/permission cases and 306 current editions to withhold are proposals, not an approved production allowlist. No original publisher descriptions or tokenized artwork URLs are included in that report. A licensed replacement is different from preserving the existing book version. SRD 5.1/2014 and SRD 5.2/2024 candidates must be selected deliberately; do not silently change character mechanics or editions.

## Shared catalogue behavior

Root `/items` are shared only when `catalogueStatus == "approved-v1"`. Other users query that exact marker. Administrators can inspect unpublished root records; the campaign picker and campaign import operation accept approved templates only. Empty results explain that existing campaign items and owned gear remain available. Root editor saves and clones omit the marker, so editing a published root item requires a new publication review.

Old unreviewed cache keys are removed. Administrator records are never written to the shared IndexedDB cache. Public cache hydration filters the marker again, and late reads are discarded after an account or privilege change. Replacements display their attribution and CC BY 4.0 link on cards. The owner stated on October 19, 2026 that the illustrations were generated with ChatGPT from their prompts and instructed that they be preserved. The migration records that instruction separately from the licence for SRD replacement text. Retained items keep their generated illustrations and image references.

Generated `/dnd-item-images` illustrations used by retained items remain readable through a backend-only `/catalogueArtwork/{fileName}` publication registry. Unregistered images require administrator access. Registry markers are written atomically with the reviewed item; clients, including website admins, cannot create them. Preserved images use `/campaign-catalogue-images/{campaignId}/{assetHash}/{contentHash}`, readable only by that campaign's owner/active DMs. Browser reads use authenticated blobs, not public download tokens. Original export records under `/campaigns/{id}/catalogueArchives` are also DM-only, including against unrelated global administrators. Client writes to either archive area are denied. Hidden campaign item copies remain in the normal DM item list and do not have supply documents until the DM deliberately creates stock.

Storage rules do not invalidate existing download-token URLs. The operator migration separately preserves and verifies the bytes, then removes only exact backed-up shared generations used exclusively by retired items. Retained images, images shared between retained and retired variants, and unrelated images stay in place. Every original and its images are preserved under the already-existing, identity-pinned private campaign; no new campaign is created. Its private archive requires uniform bucket-level access, no public bucket IAM grants, no destination download tokens, and a denied anonymous GCS read. Unknown external artwork blocks apply until separately handled. Existing external downloads cannot be recalled.

## Prepare a reviewed decision manifest

No production operation is run by this PR. Use a local operator session with Application Default Credentials that can read/write the intended Firestore project and Storage bucket; use the existing dependency installation in `functions/`. Keep credential values and all private exports out of GitHub, chat and public artifacts.

Create an **unapproved** worksheet from the full sanitized report, supplying the campaign ID locally:

```sh
node scripts/prepare-item-review-manifest.mjs \
  --report docs/reports/item-catalogue-review-2026-10-16.json \
  --campaign YOUR_CAMPAIGN_ID \
  --output "$HOME/private-item-decisions.json"
```

Every entry starts with `action: "review"`, `approved: false`, empty reviewer/date fields and an exact original `sourceSha256`. Nothing can apply until every entry has a resolved `publish` or `retire` action, explicit approval, reviewer and ISO date. The target campaign, `artworkPolicy` and `retireLegacyArtwork: true` must be reviewed too. Despite its legacy field name, the latter now authorizes moving retired-only shared images to the verified private archive; it never removes retained illustrations. The actual owner-supplied campaign ID is not checked into this public repository.

For `publish`, supply a complete `replacement` object (name, description and reviewed factual fields), plus `rights`. A synthetic example:

```json
{
  "id": "synthetic-item",
  "sourceSha256": "REPLACE_WITH_64_CHARACTER_SOURCE_DIGEST",
  "action": "publish",
  "approved": true,
  "reviewedBy": "Campaign owner",
  "reviewedAt": "2026-10-16T12:00:00Z",
  "replacement": {
    "name": "Original test item",
    "description": "Independently written test description.",
    "edition": "2014"
  },
  "rights": {
    "license": "ORIGINAL",
    "attribution": "Original author",
    "evidence": "Recorded authorship and permission for this exact replacement."
  }
}
```

For CC-BY-4.0 text, rights additionally require an HTTPS `sourceUrl` and `referenceSha256`. Verify the selected reference and actual replacement; a digest or a self-reported licence is not a legal opinion. Extra quotes/property prose, unknown publication fields and replacement-supplied image URLs are refused. Generated image references are taken only from the pinned original source, under the separate `preserve-generated` artwork policy. Replacements are written from scratch, not merged over the old item. The same root ID is kept, while old extra prose fields are removed and generated illustrations are kept. Original unpublished fields survive verbatim in the private archive.

## Plan, inspect, apply

Before tightening public rules, take a complete private root snapshot using the read-only auditor (the snapshot command refuses public CI exports):

```sh
node scripts/audit-item-catalogue.mjs --public-project dnd-loot-site \
  --report "$HOME/private-item-audit.json" \
  --snapshot "$HOME/private-item-snapshot.json"
```

After public rules are restricted, the authenticated read-only operator export retains the complete root collection in the same Firestore REST document format:

```sh
node scripts/item-catalogue-migration.mjs snapshot \
  --project dnd-loot-site --bucket dnd-loot-site.firebasestorage.app \
  --output "$HOME/private-item-snapshot.json"
```

This command also refuses public CI and repository-local output. A public approved-only subset is explicitly labelled and rejected as migration input. The public workflow may use a read-only `runQuery` POST after its full GET is denied; it never treats that subset as a full database audit or gains private access.

Build a plan offline, pinning the destination's ID, exact name and owner UID:

```sh
node scripts/item-catalogue-migration.mjs plan \
  --snapshot "$HOME/private-item-snapshot.json" \
  --manifest "$HOME/private-item-decisions.json" \
  --project dnd-loot-site --campaign YOUR_CAMPAIGN_ID \
  --campaign-name "Tyranny of Dragons" --owner YOUR_OWNER_UID \
  --output "$HOME/private-item-migration-plan.json"
```

`plan` makes no network requests or database writes. It refuses incomplete manifests, different projects/campaigns, changed source digests and unsupported publication payloads. The resulting plan includes private original fields; keep it outside Git and on private storage.

The authenticated **read-only check** validates the destination name/owner, source revisions, legacy campaign readiness and artwork:

```sh
node scripts/item-catalogue-migration.mjs check \
  --plan "$HOME/private-item-migration-plan.json" \
  --bucket dnd-loot-site.firebasestorage.app \
  --backup-dir "$HOME/private-item-backup"
```

Coordinate the new frontend and reviewed Firestore/Storage rules before enabling public access to replacements. Unreviewed templates disappear until approved replacements are published; existing campaign gear remains separate. Avoid simultaneous administrator catalogue edits while performing the migration. Rule publication, production merges and the write operation remain owner-approved actions.

Only after reviewing the report, manifest, plan and durable backup destination, the operator can run:

```sh
node scripts/item-catalogue-migration.mjs apply \
  --plan "$HOME/private-item-migration-plan.json" \
  --bucket dnd-loot-site.firebasestorage.app \
  --backup-dir "$HOME/private-item-backup" \
  --confirm-plan EXACT_PRINTED_PLAN_SHA256
```

`apply` is refused in public GitHub Actions. Private backup files use 0600 permissions, the directory uses 0700, and conflicting prior files are never overwritten. Choose durable private storage for production; an ephemeral cloud task directory is not a durable backup. All original documents and legacy objects are backed up before any database write. Asset checksums/private reads and every hidden campaign copy are verified before any root retirement. Source revisions are rechecked inside transactions. Each retirement/publication atomically records its completion and increments the catalogue cache version. Partial runs resume only from matching private copies and the same manifest; edited originals, private copies, changed assets or new root records abort rather than being overwritten.

Legacy campaigns with old `itemState` ownership records block apply until their inventory upgrade is complete. The tool never writes supply, inventory, character sheets or other campaigns' item records. **Previously copied private campaign descriptions remain outside this root-catalogue cleanup.** A separate reviewed inventory would be required to replace those texts without deleting owned gear. Retained shared artwork keeps its URLs. Retired-only artwork moves into the selected private campaign; older copies in other campaigns may lose their old public image link. The archive keeps the actual image bytes and DM-readable references. No existing owned item or mechanics is deleted.

## Validation

Synthetic engine tests exercise dry runs, approval/hash requirements, changed/new sources, backup/copy failure boundaries, preservation and restart. Emulator integration uses real Firestore REST transactions for the private original/copy and publication/retirement stages. Storage orchestration uses a deterministic GCS contract double; real IAM, bucket CORS and production asset availability require operator verification. Permission tests cover anonymous reads, other DMs, removed members, global administrators, filtered queries, import boundaries, private archives and private artwork. Browser tests cover old cache contents, role-change races, mobile picker access, cleared legacy images, safe attribution and private blob races. Existing DOM, equipment and workspace/Storage suites remain in CI. One Shots feature work stays paused.
