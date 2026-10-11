# World Building image uploads — Firebase Storage permissions

World Building uploads files to `campaign-world-images/{campaignId}/{entryId}/{imageId}`.
If uploads fail with `storage/unauthorized`, the **published Firebase Storage rules**
probably do not yet contain that path. This is separate from Firestore security
rules (`firestore.rules`).

## Production rules: one authoritative file

The repository's [`storage.rules`](../storage.rules) combines the existing
Firebase Storage rules supplied by the project owner with one new match:

- `dnd-item-images/{fileName}`: public read; admins create, update and delete
- `campaign-item-images/{campaignId}/{fileName}`: owners and active members
  read; owners/active DMs create, update and delete
- `campaign-world-images/{campaignId}/{entryId}/{imageId}`: owners/active DMs
  read and create; existing images cannot be replaced or deleted

The world-map path accepts PNG/JPEG/WebP with the same **less than 5 MiB** limit
as the original `validImage()` helper. It doesn't make private campaign maps
visible to players. Unmatched paths remain denied.

## Deploying the rules

**Important:** the current GitHub Actions workflows deploy Firebase Hosting
only. A green Hosting preview or merge run **does not publish Storage rules**.
Merely merging the pull request therefore will not fix `storage/unauthorized`.

The safe deployment sequence is:

1. In Firebase Console, confirm project `dnd-loot-site`, and select the
   **Storage bucket used by the website**.
2. Back up the currently published Storage rules before making changes.
3. After merging the Storage rules PR, either publish the *complete*
   [`storage.rules`](../storage.rules) file in
   **Firebase Console → Storage → Rules**, or run
   `firebase deploy --only storage --project dnd-loot-site`
   from a checked-out copy of the updated repository with Firebase CLI access.
   The `storage` rules mapping is declared in `firebase.json`.
4. Verify that the deployed text still contains the existing
   `dnd-item-images` and `campaign-item-images` permissions.
5. Try uploading a small PNG map from World Building as the campaign owner
   or an active DM. Refresh the World Building entry to verify the read path.
   Verify a player/nonmember cannot access the map.

Do **not** copy the older isolated `storage-workspace.rules` example into
production; it omits item-image rules. That file has been replaced by the
complete ruleset.

If the upload is still denied, check the signed-in UID, membership status,
`campaigns/{campaignId}.ownerId`, active member `role: 'dm'`, Firebase
project and Storage bucket. A Storage deployment cannot be verified merely
by passing emulator tests.

## Automated verification

`firebase.workspace-test.json` and
`tests/workspace-storage-rules.cjs` both read `storage.rules`.
The Storage emulator tests cover item images, map images, owner/DM/player
permissions, MIME/size restrictions, and immutable map uploads.

The repository intentionally does **not** automatically deploy Storage rules
when opening or merging a PR; that is a separate production security change.
