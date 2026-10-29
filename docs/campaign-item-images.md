# Campaign item illustrations

Library, owned Inventory cards, saved items and the Root Catalogue use the same image renderer. Previously every Storage lookup normalized the artwork ID before reading a file: `Sword-red-2` became `sword`. This skipped an existing exact illustration. An explicit broken URL also stopped lookup permanently. Thumbnail-only root records lost their URL when imported, and campaign clones without an explicit image base could lose their source identity.

The renderer now tries `dnd-item-images/{exactId}.png` first, then the older normalized variant filename. The identity comes from `imageBaseId`, otherwise `rootItemId`, otherwise the item ID. A successful exact match takes precedence over a cached variant. Concurrent reads share each file lookup; only successes are cached. The new session-cache namespace ignores old normalized results. Cold legacy variants can require one additional failed exact lookup before their shared illustration is found; visible-card loading remains deferred.

Existing thumbnail URLs render directly. Root imports preserve `thumbnailUrl`/`thumbUrl` as the campaign's `imageUrl`; campaign clones retain source artwork identity. Old local placeholder URLs no longer suppress ID lookup. A failed explicit or cached URL is evicted and resolved once through Storage, then falls back to the existing placeholder if unavailable. It cannot enter a retry loop. Resolved URLs no longer overwrite item records in memory, and detached cards ignore late results.

No-art markers and private archive paths retain their existing handling. Private artwork is not promoted to a public fallback, players cannot read DM-only archives, and this change does not create missing files or publication-registry records. It also cannot restore images previously moved out of the shared catalogue. Actual production asset/permission availability still needs confirmation against an affected item; synthetic tests establish the code defects and corrected behavior, not the state of every production file.

Validation:

```sh
node --test tests/runtime-cleanup.cjs
npm --prefix tests run test:campaign-item-images
npm --prefix tests run test:reviewed-catalogue
```

The new browser test uses the actual campaign store, import/clone/assignment operations and actual Library/owned card markup, with a deterministic synthetic Firestore/Storage adapter. It verifies decoding, lookup counts, thumbnails, old placeholders, exact-vs-shared identity, expired URLs/cache, missing/private/no-art records and detached cards. The existing reviewed-catalogue test also covers private blob reads and account/role changes. CI runs both.

No Firestore or Storage rule changes, indexes or production migration. No merge/deployment is performed by this work.

## Read-only production diagnosis

The recorded catalogue recommendation for `robes-of-the-second-strike` was retirement with private preservation. That historical recommendation does not establish whether a migration was applied. The following local operator command checks the actual campaign copy, exact/shared filenames, generated-art publication registry and owner-library/same-campaign archive references. It does not search archives in other campaigns.

Use Node 24 and existing Google Application Default Credentials with Firestore and Storage **read** access to the specified project. Install the locked operator dependencies if they are not already installed:

```sh
npm ci --prefix functions
```

Run this one-line command from the checkout, replacing the campaign name with its exact displayed name:

```sh
node scripts/diagnose-campaign-item-images.mjs --project dnd-loot-site --bucket dnd-loot-site.firebasestorage.app --campaign-name "EXACT CAMPAIGN NAME" --item-name "Robes of the Second Strike"
```

If the owner’s library uses a separate private archive bucket, add `--archive-bucket EXACT_PRIVATE_BUCKET_NAME`. If you do not know its name, explicitly opt into discovering buckets **only from the matching item’s already-recorded archive references**:

```sh
node scripts/diagnose-campaign-item-images.mjs --project dnd-loot-site --bucket dnd-loot-site.firebasestorage.app --archive-bucket auto --campaign-name "EXACT CAMPAIGN NAME" --item-name "Robes of the Second Strike"
```

Auto mode reads metadata only for recorded objects beneath the selected campaign or its owner’s private-library prefix, using the operator’s existing read permission. It never lists bucket contents, probes another owner/campaign’s paths, downloads images or changes records. More than four referenced archive buckets stops the command. The JSON still omits names, IDs, buckets, object paths and credentials. Unknown external URLs remain unchecked. Missing credentials or denied metadata reads stop the command; they are not reported as missing files.

The command reads selected Firestore fields and Storage object metadata only. It performs no document/object writes, downloads, token creation, deployment or migration, and writes no local exports. The JSON report contains status/counts without campaign/item names, IDs, paths, tokens, original prose or image bytes. Reported archive existence is a metadata check, not a new checksum verification. The report can be shared to determine the next repair:

- `fallbacks[*].exists: true` with `publishedForPlayers: false`: the file exists but its shared publication marker is absent or mismatched.
- `checkedArchiveAssets: 0` with `unconfiguredArchiveBuckets > 0`: archive bytes have not been checked; specify the archive bucket or explicitly use auto mode.
- `unrecognizedArchivePaths > 0` or `invalidArchiveReferences > 0`: a recorded reference falls outside the permitted scope or has a malformed bucket. It remains unchecked even in auto mode.
- Missing shared files with `existingArchiveAssets > 0`: the image is preserved privately; the browser resolver cannot restore it by itself. A separately reviewed image-only recovery would be needed.
- `artworkDisabled: true`: the item explicitly suppresses artwork.
- `privateArchiveReference: true`: the normal shared lookup is intentionally bypassed for DM-private image handling.

This diagnostic deliberately does not copy private assets back into the shared catalogue or change campaign/item visibility. `node --test tests/campaign-item-image-diagnostic.cjs` verifies these distinctions, redacted output and refusal of ambiguous scopes.
