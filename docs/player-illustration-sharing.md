# Saved player illustrations

World entries, revealed Story NPCs and completed chapters can share a saved journal illustration separately from their player text. Save the entry, share its page, then choose **Share image with players**. **Update shared image** snapshots the saved image, alt text and caption without publishing later player-text edits. Text updates retain the explicitly shared image. **Hide image** leaves player text shared.

Uploads accept decoded PNG, JPEG or WebP images below 5 MB. Image references and captions survive save/reopen. Replacement images and caption edits stay private until explicitly shared. Removing an illustration and saving removes its shared reference atomically. Hiding/archiving/reclassifying a page removes its image access; revealing it again starts without an image. Old immutable files remain stored for the campaign DMs.

Players load only the exact published path using authenticated Storage blob reads. No download tokens are generated. Anonymous accounts, removed members and other campaigns cannot read journal images. Encounter illustrations remain DM-only. Private notes, statistics, actions and tactics are never included in publications. Access revocation cannot recall bytes a recipient already downloaded.

## Deployment requirements

This feature needs both `firestore.rules` and `storage.rules` updated alongside the frontend. Hosting alone cannot enable image access. Firestore rules accept the optional image snapshot, enforce saved source/entry scope and require atomic removal. Storage rules allow active members to read only that exact published image path. No migration or backfill is required; old player pages have no image by default. No rules or application deployment has been performed by this change.

## Validation

- `npm --prefix tests run test:player-images`: actual app upload/save/reopen, separate image/text changes, caption, private-note exclusion, revoked access, invalid bytes, mobile and WCAG.
- `npm --prefix tests run test:player-images-rules`: actual Firestore and Storage emulators for all three entry kinds, source-removal constraints, stale writes, unshared/old-path denial and campaign isolation.
- Existing Storage and NPC publication permission suites remain applicable.
