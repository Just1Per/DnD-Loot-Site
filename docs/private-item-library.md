# Owner-private item library

The operator migration can preserve original items and illustrations outside every campaign. The destination is pinned to an existing Firebase user UID. Nothing is moved merely by merging this feature, and existing campaign copies and character equipment remain unchanged.

| Data | Location | Access and purpose |
| --- | --- | --- |
| Original fields, source revisions and asset references | `privateItemLibraries/{uid}/originals/{id}` | Owner reads only; exact preservation and completion journal |
| Private original item records | `privateItemLibraries/{uid}/records/{id}` | Owner reads only; explicitly `archive-only` |
| Reviewed replacement templates | `privateItemLibraries/{uid}/templates/{id}` | Owner reads only; only reviewed replacements can be imported |
| Original illustrations | `private-item-library-images/{uid}/{assetHash}/{sha256}` | Owner reads only; immutable backend copies without download tokens |

All client writes are denied, including writes by the owner and global administrators. A trusted local operator using authorized Google Application Default Credentials performs explicit operations in the background. There is no public catalogue page or automatic cross-campaign distribution of this library. This is backend tooling, not a new browser library interface.

An original archive is distinct from a reusable template. Retired items remain archive-only. A reusable template requires reviewed replacement text, edition choices, attribution and documented `ORIGINAL` or `CC-BY-4.0` evidence. Private storage does not establish permission to redistribute original publisher text or artwork. Additional material needs a separately reviewed rights decision; the importer cannot promote an archive into a template.

## Prepare a library-targeted migration

Use Node 22/24, Java 21 for emulator tests and the locked dependencies under `functions/`. Operator commands use POSIX private-directory permissions; run them in Linux, macOS or Ubuntu/WSL with exports under the Linux home directory rather than a Windows/OneDrive folder. Keep credentials and private exports out of Git and chat.

1. Capture a fresh complete root snapshot using the existing read-only operator capture. Confirm the project, actual owner UID and existing owner account. A campaign's visible item list does not prove completeness or image availability.
2. Review the complete decision worksheet. For the new destination, remove `targetCampaignId` and add `targetLibraryOwnerId` with the exact owner UID. Changing destination requires reviewing the new plan; do not automatically approve the proposals or carry a previous plan digest forward.
3. Build a new offline plan, supplying only the library destination:

```sh
node scripts/item-catalogue-migration.mjs plan \
  --snapshot "$HOME/private-review/root-snapshot.json" \
  --manifest "$HOME/private-review/item-decisions.json" \
  --project dnd-loot-site \
  --library-owner YOUR_FIREBASE_UID \
  --output "$HOME/private-review/library-migration-plan.json"
```

4. Run the existing authenticated read-only check:

```sh
node scripts/item-catalogue-migration.mjs check \
  --plan "$HOME/private-review/library-migration-plan.json" \
  --bucket dnd-loot-site.firebasestorage.app \
  --backup-dir "$HOME/private-library-backup"
```

The library destination does not require a destination campaign. Other campaigns' inventory-readiness checks remain because the separately approved root-catalogue cleanup can affect legacy catalogue dependencies. Originals, all matched artwork and reusable templates are verified before shared root mutation. All existing approval, complete-snapshot, durable-backup, source-hash, source-version and explicit-plan-confirmation requirements still apply. The existing `apply` command accepts this new plan, but it must not be run until the concrete plan and durable backup are reviewed and separately authorized. This implementation has not run it against production.

Old campaign-target plans remain supported; they are not silently redirected. Rebuild a library-targeted plan instead of running an old campaign-target plan for this workflow. Existing campaign items, private campaign images, supply, inventories and owned character gear are not moved or deleted by selecting a new library destination.

## Manually import a reviewed template into an own campaign

Only the library owner's own campaign is accepted, using its exact name, owner UID and inventory version 2. Being a DM in someone else's campaign does not grant import access. The template must be under `templates`; a record under `records` or `originals` cannot be used.

```sh
node scripts/private-item-library.mjs plan-import \
  --project dnd-loot-site --owner YOUR_FIREBASE_UID \
  --template EXACT_REVIEWED_TEMPLATE_ID \
  --campaign YOUR_CAMPAIGN_ID --campaign-name "Exact campaign name" \
  --bucket dnd-loot-site.firebasestorage.app \
  --output "$HOME/private-review/library-import-plan.json"

node scripts/private-item-library.mjs check-import \
  --plan "$HOME/private-review/library-import-plan.json" \
  --bucket dnd-loot-site.firebasestorage.app \
  --backup-dir "$HOME/private-library-import-audit"
```

These commands make no writes to Firestore or Storage. The local plan contains private item content. After reviewing that exact plan, the operator can use `apply-import` with the same options and `--confirm-plan EXACT_PRINTED_PLAN_SHA256`. Import creates one hidden campaign item and verified campaign-private image copies. It never creates stock, modifies inventory or owned gear, writes a root template or changes the source library. The DM can later deliberately configure stock and visibility using the normal campaign item editor.

The same import plan retries without duplicate items. Existing edited imports are never overwritten; changed source templates or destination identity require a new plan. A separately prepared new import plan represents a new independent copy. All artwork is preserved; the existing item card displays the first illustration. Library provenance and image references survive subsequent campaign item edits.

## Rules and validation

Both `firestore.rules` and `storage.rules` need publication before owner-side client reads of the new paths can work. Hosting deployment alone does not publish them. No deployment or production migration is part of this change.

```sh
npm --prefix tests run test:private-item-library
npm --prefix tests run test:private-item-library-emulator
```

Tests use synthetic data, actual Firestore REST transactions and the actual Storage rules emulator. Migration/import GCS orchestration uses a deterministic contract double; production IAM, real asset availability and the private destination identity still require operator verification. Tests cover owner-only access, client write denial, exact originals, archive/template separation, private images, foreign-campaign rejection, dry-run, explicit confirmation, stale versions, edited-copy protection and safe retries. Legacy campaign-target migration remains covered separately.
