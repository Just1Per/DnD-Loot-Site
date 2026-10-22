# Map overview loading

New map uploads can include a small WebP overview. Journal opens the overview at normal zoom and loads the unchanged original on zoom-in. Reset returns to the overview; both files are reused only within that open map session. Pins and region geometry continue to use percentage coordinates and the original image path.

## Files and publication

- The original upload is preserved byte for byte, with the existing 50 MB limit.
- Overview generation reuses image validation, keeps the full aspect ratio, and tries 1600, 1200 and 900 pixel bounds. The overview must be smaller than the original and at most 256 KiB.
- Small originals (at most 1600 pixels and 256 KiB) need no overview. Generation/upload failures retain an original-only draft.
- Optional `previewPath` is saved in the private draft and copied atomically to the schema-version-2 published map. No changes to pins or their publishing controls.
- Players may read exactly the currently published original and overview. Other uploads and replacement drafts stay private. Replacement publication ends player access to the previous files.
- Old maps load their original without migration. There is no production backfill. Upload a replacement map to generate an overview.
- A missing, denied or undecodable overview falls back to the original. A failed original retains an available overview and offers Refresh. Late responses after zoom reset, navigation, account changes or access revocation cannot overwrite the current view.

## Required rules

**Both `firestore.rules` and `storage.rules` must be published with this feature.** Firestore accepts the campaign-scoped optional overview field; Storage grants active members access to its exact published file. Earlier rules reject saving a draft with `previewPath` or deny the player overview download. No production rules have been deployed by this work. No data migration, new index or Cloud Function is required.

## Verification

`test:map-preview-loading` exercises the real upload/reader with an isolated SDK fixture. It checks original SHA-256/bytes, bounded overview dimensions and aspect ratio, atomic publication, preview-only opening, original-on-zoom, request reuse, legacy/denied/decode fallbacks, stale zoom responses, URL revocation, mobile overflow and WCAG at 1440/390/320 px.

One synthetic 2400×1200 PNG fixture padded to 9,077,537 bytes produced a 7,960-byte 1600×800 overview. These are test fixture measurements, not a production loading-time claim. Detailed zoom still downloads the original.

`test:campaign-map-rules` adds emulator coverage for private previews, invalid/cross-campaign paths, exact published access, replacements, membership revocation and campaign soft deletion. Existing original-map, pin, region and publication checks remain in place.
