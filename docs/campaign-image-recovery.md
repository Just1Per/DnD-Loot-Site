# Campaign-specific recovery of preserved item illustrations

Use this after the [read-only diagnostic](campaign-item-images.md#read-only-production-diagnosis) confirms that an affected campaign item has no shared illustration but does have a matching preserved archive asset. One successful item diagnosis does not establish that every missing campaign illustration survives.

The operator tool defaults to **metadata-only preparation**. It does not implicitly repair anything. A separate, explicitly acknowledged Apply can copy a verified archive image into the existing member-readable `campaign-item-images/{campaignId}/{itemId}` location. It never recreates Root Catalogue records, publishes shared catalogue artwork, modifies Firestore documents, changes item stats/ownership/visibility, deletes source files, overwrites existing images, changes bucket IAM or modifies existing ACLs. It does not generate Firebase download tokens. The archive remains the recovery source.

## Preparation: no production changes

Use Node 24 from the actual extracted project directory containing `scripts` and `functions/package-lock.json`. The existing operator dependencies and Google Application Default Credentials used for diagnosis are sufficient; do not reinstall if they are already present. If dependencies are absent, use `npm ci --prefix functions` once.

The operator needs read access to the campaign/owner archive references and referenced object metadata, plus permission to read destination bucket metadata/IAM so privacy can be established. Preparation does not download any image bytes, list buckets, search other owners/campaigns or write production data.

For the diagnosed item:

```cmd
node scripts/recover-campaign-item-images.mjs --project dnd-loot-site --bucket dnd-loot-site.firebasestorage.app --archive-bucket auto --campaign-name "Tyranny of Dragons" --item-name "Robes of the Second Strike"
```

Omit `--item-name` to prepare for all campaign items, up to 1,000. Auto discovery reads at most four buckets from the matching, scoped archive references; it does not list their contents. An explicit `--archive-bucket NAME` can restrict the allowed archive buckets instead.

The terminal prints a redacted JSON summary and the local private plan path. **Share only the JSON summary, not the plan file.** The summary reports counts, skip reasons, bytes, `archiveBytesVerified: false`, zero production writes and the plan's SHA-256. Existence is still only a metadata check at this stage. The plan contains scope IDs and archive locations but no original item descriptions, campaign/item names, credentials, download tokens or image bytes. Keep it on the same operator machine.

Plans are written outside the downloaded project and every Git checkout, under a private `ImageRecovery/CampaignAtlas-ImageRecovery-…` directory. POSIX permissions are 0700/0600; Windows uses the existing current-user/SYSTEM/Administrators ACL helper. Public, inherited broad access, sync folders and junctions are rejected by that helper. Files are created exclusively and flushed before the path is reported. Never copy these plans into Git, Hosting, public CI, a shared folder or a PR attachment.

Only explicitly player-visible campaign items are eligible. Existing campaign images, direct image URLs, no-art markers and DM-private archive records are excluded. Shared generated artwork remains authoritative. Missing/malformed publication registries, missing assets, unsafe references, ambiguous checksums or truncated archive searches require review rather than a guessed recovery. The archive object must be a tokenless PNG/JPEG/WebP under 5 MiB, on the same project as the destination, with a source path/checksum tied to the selected item's artwork identity. Permission errors stop preparation instead of masquerading as missing files.

## Apply: separate operator decision and explicit member access

**Preparation is not permission to apply.** Review the summary and private plan first. A recovery copy is readable by the campaign's existing active members under the current Storage rules, including players. It is no longer restricted to the owner’s private archive. The destination bucket must have no `allUsers` or `allAuthenticatedUsers` IAM bindings, including conditional bindings. No new rules, indexes or bucket-policy deployment is part of this change.

Before Apply, the following **local-only** check can locate the saved plan by its exact checksum. This avoids copying a long Windows path or assigning a CMD environment variable:

```cmd
node scripts/recover-campaign-item-images.mjs --check-plan auto --confirm-plan "SHA256_FROM_PREPARATION"
```

It reads only protected local recovery-plan files, checks the exact checksum, format and expiry, and reports `check: "local-plan-only"`, `planFileFound`, `planHashMatches`, `planUnexpired` and zero production writes. It does not initialize Firebase, re-read production metadata or verify image bytes. Auto searches only the existing private ImageRecovery directory, with at most 100 UUID plan folders. It refuses links, insecure folders and duplicate matches; it never guesses the newest plan or searches Downloads/other accounts. The plan remains unchanged, so plans prepared by #253 remain usable until their original expiration.

Only the local operator can execute Apply, using their existing credentials with object read/create permissions. The saved plan expires after 24 hours; re-prepare after expiration or any campaign/item/source change. The project, bucket and destination are pinned by the plan and cannot be replaced by Apply flags.

```cmd
node scripts/recover-campaign-item-images.mjs --apply-plan auto --confirm-plan "SHA256_FROM_PREPARATION" --acknowledge-campaign-member-access yes
```

Replace `SHA256_FROM_PREPARATION` with the exact checksum printed by your own preparation. The same `auto` selector uses that checksum to find one original private plan, then runs every existing Apply safeguard. An absolute private plan path is still accepted in place of `auto`; no `set /p` step is required.

This is a **production Storage write** when run against the production project. The assistant does not run it or perform a deployment/production migration. It is provided for a later explicit operator decision.

Apply rechecks the campaign and exact item version/visibility, verifies archive generation/metageneration and bounded downloaded bytes against the SHA-256 and PNG/JPEG/WebP signature, then creates a new destination with `ifGenerationMatch: 0`. Non-uniform buckets use an explicit private ACL for the new object; uniform buckets omit object ACLs. New metadata is limited to content type, private/no-store caching and attributable recovery-plan/byte checksums. Source download tokens and metadata are not copied.

After creation, the copy is downloaded/checksummed and anonymous GCS/Firebase media HEAD requests must both return 401/403. A 404 is not accepted as privacy evidence. Campaign/item checks run again. These are separate Storage/Firestore operations, not a cross-service transaction: an interruption, concurrent edit or failed post-create verification can leave new copies. The tool stops, does not silently roll back/delete anything, and does not claim the batch succeeded. Keep the private plan for review. A retry with the same still-valid plan accepts only an existing tokenless copy tagged with that exact plan and byte checksum, re-verifies bytes/privacy, and never overwrites an unrelated destination.

## Failure reports

Failures now print redacted JSON with the last controlled stage, an error category and counts of attempted/completed Storage creates. A missing local plan reports `PLAN_FILE_NOT_FOUND` or `PLAN_NOT_FOUND` before Firebase is initialized. Expired plans report `PLAN_EXPIRED`; duplicate auto matches report `PLAN_AMBIGUOUS`. Missing Apply acknowledgement is rejected before reading any plan.

When no create was attempted, the report includes `productionWrites: 0`. After an attempted create, a failed/ambiguous response can still have left a copy, so that zero-write claim is deliberately omitted and `mayHaveCreatedCopies: true` is reported. Completed creates remain counted if a later checksum/privacy check fails. Keep the original plan for review and safe retry; do not assume a stopped command rolled back. No file paths, source IDs, credentials, raw provider error messages or response bodies are logged. The stages/counts describe this invocation, not earlier attempts.

## Browser behavior and rules

Library and owned Inventory cards try the existing exact/shared catalogue image first. If unavailable, campaign cards can request the campaign-local copy through authenticated `getBlob`, with a 5 MiB bound. Concurrent cards share pending reads for the current user/campaign; blob URLs are revoked and never stored in Firestore, item objects, session storage or the public URL cache. Failed reads retain the placeholder. Late responses after account/campaign changes or card removal are ignored. Root Catalogue cards never borrow campaign artwork; no-art and DM-private archive handling remain unchanged.

The website code must be released through the normal user-controlled merge process before these new tokenless copies can appear in its cards. **Firestore and Storage rules are unchanged.** Existing Storage tests already cover active member reads, outsider denial and DM-only campaign-image writes. This tool does not deploy Hosting, functions or rules.

## Validation

```sh
node --test tests/campaign-image-recovery.cjs tests/campaign-image-recovery-sdk.cjs tests/campaign-image-recovery-feedback.cjs tests/campaign-item-image-diagnostic.cjs tests/runtime-cleanup.cjs
npm --prefix tests run test:campaign-item-images
npm --prefix tests run test:reviewed-catalogue
npm --prefix tests run test:packaging
```

The operator suite also runs on Windows and Linux in CI, including private output permissions. Tests use synthetic data and injected demo-only services, never production credentials or assets. The browser tests use actual campaign-store import/assignment and Library/Inventory markup with deterministic Storage responses.
