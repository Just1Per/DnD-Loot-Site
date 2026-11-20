# Player map image access — 20 November 2026

## Cause and behavior

A map can work for its DM while its players receive `403` from Firebase Storage for both `campaign-maps/...` and `campaign-map-place-images/...`. Storage rules must check campaign deletion, membership and the exact current publication; place pictures additionally require the pin revision. Cloud Storage permits only two Firestore document access calls per evaluation. Redeploying the same rules cannot increase that limit, and successful Storage emulator permission tests do not establish production budget compatibility. Browser warnings about unsupported Permissions-Policy features are unrelated.

The reader now uses protected, byte-for-byte Firestore copies under `campaigns/{campaignId}/campaignMapMedia/{mapId}/assets/{sha256-of-storage-path}`. Each manifest records source path, MIME type, size, chunk count and byte checksum. Images retain their original resolution and bytes, up to the existing 50 MiB map limit; PNG, JPEG and WebP remain supported. Place pictures retain their existing size limit below 5 MiB. No public download token, new server, Cloud Function, third-party service or source-image overwrite is involved. Storage rules remain unchanged.

Firestore rules enforce live campaign and active membership, plus the exact published original/overview path or picture on a pin in the current map revision. Main and named maps remain separate, even when pin IDs repeat. Pending uploads, unpublished maps, hidden/replaced pictures, old pin revisions, revoked memberships and deleted campaigns deny player reads of both manifests and direct chunks. DMs can prepare copies privately. Players and unrelated global administrators cannot write them or list the copy collections.

New uploads prepare their private copy before attaching the image to the draft. Publishing checks/prepares the original, optional overview and revealed pin pictures before changing the publication. Failure retains the saved private draft and reports the failed stage. A repaired reader uses the copy for both DM and player; the DM alone retains authenticated Storage fallback for an older original. Player preview exercises the protected copies.

## Deploy and repair existing maps

1. Publish **this change's Firestore rules** to the intended project before releasing the frontend:
   `firebase deploy --only firestore:rules --project dnd-loot-site`.
2. Merge/release the frontend through the normal GitHub Hosting workflow.
3. As the campaign owner or an active campaign DM, open **DM Workspace → Maps** (or **Journal → Maps → Manage map**). Select the affected map, then **Repair image access** beside Save private draft. Wait for **Image access repaired**.
4. Repeat for each affected named map. Players then choose **Refresh** or reopen Maps. No reupload or republish is necessary.

Repair copies the current published and private-draft image references for the selected map. It changes no original Storage objects, map/pin data, draft text, revisions, visibility or publication. Hidden draft pictures stay private. Completed immutable copies are reused; interrupted preparation can resume. Errors identify missing copies or denied permissions and point to Repair image access. A published copy with corrupt finalized bytes requires a fresh image upload; the reader verifies the checksum and never silently displays corrupt data.

No production rules deployment, live data backfill or campaign repair is performed by preparing this PR. The operator performs the steps above. If the DM also cannot fetch an old original, inspect campaign DM membership, the deployed Storage rules and Storage's Firestore service-agent permission before repair; access must not be made public to work around an error.

## Data and performance limits

Copies are stored separately from map/pin lists, so subscribing to Maps never downloads image bytes. A 512 KiB binary chunk becomes at most 699,052 base64 characters, below Firestore's document limit. Up to four chunks are written per transaction, below both the emulator transport’s 4 MiB limit and Firestore’s 10 MiB limit; the ready manifest is finalized after successful writes. Context checks surround asynchronous work. Player downloads use four concurrent chunk reads per group, exact length validation and a SHA-256 byte checksum. The overview is used first; full original chunks are requested on zoom and cached as revocable object URLs for that map session.

A 50 MiB original uses 100 chunks, one manifest, and about 66.7 MiB of additional base64 data. This deliberately trades extra Firestore storage/reads for exact original quality and live publication/revocation checks without introducing a server. Originals and retired copies are retained. A reviewed retention/cleanup task is separate; this fix deletes no assets. No new query index is required.

## Verification

- `tests/campaign-map-media.cjs`: map/path boundaries, exact reconstruction across chunks, idempotent completion, interrupted repair/resume, context changes, missing/corrupt/oversized copies and no Storage fallback for the protected reader.
- `tests/campaign-map-media-rules.cjs`: actual Firestore permissions for private preparation, published original/overview/pin access even when the supplied Storage reader always refuses, schema/size/MIME/chunk bounds, immutable completion, map isolation, replacements, hidden pins, membership revocation and deletion.
- `tests/campaign-map-media-browser.cjs`: existing main/named map repair, failure feedback, no source reupload, unchanged draft/publication records, working player/DM display with Storage denied, place pictures, zoom and mobile layout.
- `tests/map-preview-loading-browser.cjs`: unchanged original hash and dimensions, bounded overview, copy-only player requests, original on zoom, cache/fallback/race cleanup and mobile/WCAG. Existing map, named-map, region and route suites remain enabled.
