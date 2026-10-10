# World Building image uploads — Firebase Storage deployment

If uploading a world map fails with `storage/unauthorized` for
`campaign-world-images/{campaignId}/{entryId}/{imageId}`, the upload path in
`js/modules/campaign-workspace-ui.js` already matches the example rules in
`storage-workspace.rules`.

**Important:** `firebase.json` deploys Firestore rules and Hosting, but does not
declare production Storage rules. A successful Hosting or Firestore deployment
therefore does **not** install `storage-workspace.rules`.

## Action for Firebase project owner

1. Open **Firebase Console → Storage → Rules** for the correct project/bucket.
2. Take a backup of your *existing* Storage rules.
3. Merge the `workspaceDM` function and the
   `campaign-world-images/{campaignId}/{entryId}/{imageId}` match from
   [storage-workspace.rules](../storage-workspace.rules) **inside your existing**
   `service firebase.storage { match /b/{bucket}/o { ... } }` scope.
   **Do not replace your entire existing ruleset**—it may contain item and
   campaign-item image permissions.
4. Publish the merged Storage rules, then retry an image upload using a
   campaign owner or active campaign DM account.
5. Verify reads work after refreshing World Building and that unrelated
   authenticated accounts cannot upload or read private campaign maps.

The rule requires authenticated campaign ownership or an active DM membership,
PNG/JPEG/WebP content type and an image size of 1–5 MiB. It allows creating new
immutable objects, not overwriting old image files.

If it still fails after publishing, confirm the signed-in UID is the campaign
`ownerId` or an active `members/{uid}` record with `role: 'dm'`, and confirm
the Storage project and bucket match the project being tested.

## Verification

`firebase.workspace-test.json` points the Storage emulator at
`storage-workspace.rules`. Emulator tests prove behavior of the **repository
rule sample**; they cannot prove that Firebase Console has the same rules.
Deployment requires an explicit Storage-rule publish by the project owner.
