# Campaign image uploads — Firebase Storage permissions and CORS

World Building uploads files to `campaign-world-images/{campaignId}/{entryId}/{imageId}`.
If uploads fail with `storage/unauthorized`, the **published Firebase Storage rules**
probably do not yet contain that path. This is separate from Firestore security
rules (`firestore.rules`).

## Production rules: one authoritative file

The repository's [`storage.rules`](../storage.rules) combines the existing
Firebase Storage rules supplied by the project owner with campaign image matches:

- `dnd-item-images/{fileName}`: generated artwork registered by the backend is readable; admins manage uploads. Retired originals do not become public just because an object exists.
- `campaign-item-images/{campaignId}/{fileName}`: owners and active members
  read; owners/active DMs create, update and delete
- `campaign-world-images/{campaignId}/{entryId}/{imageId}`: owners/active DMs
  read and create; existing images cannot be replaced or deleted
- `campaign-cover-images/{campaignId}/{imageId}`: owners/active DMs create;
  owners and active members read; existing images cannot be replaced or deleted

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

## Campaign cover troubleshooting

Cover upload, front-page save and image display are separate operations:

1. **Upload denied** (`storage/unauthorized`): check the published Storage rules
   contain `campaign-cover-images`, the website uses bucket
   `dnd-loot-site.firebasestorage.app`, and the account owns the campaign or is
   an active campaign DM. A global DM role alone does not grant campaign access.
2. **Image uploaded** followed by **Add an image description**: enter the
   accessible image description, then select **Save front page**. Uploading
   alone does not save the campaign's image reference.
3. **Could not save**: inspect the Firestore error. Campaign settings need the
   current `frontPage` rules in `firestore.rules`; Storage rules do not authorize
   saving a Firestore campaign document. A revision conflict requires reopening
   the latest page while retaining a copy of the draft.
4. **The campaign image could not be loaded** after a successful upload or save:
   inspect the browser Console/Network response for the authenticated Storage
   GET. Check read permissions, the saved object still exists, and bucket CORS.
   Retry reads with **Try loading image again**. This does not upload a new
   object or change the saved page.
5. **Loading campaign image…** never finishes after a successful upload:
   the browser may be blocking an authenticated read while the Firebase SDK
   retries it. Newly uploaded drafts preview the local file; saved/reopened
   covers still need the authorized remote read. The UI gives timeout guidance
   after 20 seconds and retains the saved image path. A timeout is not proof
   that the upload or save failed.

The file chooser resets after an attempted upload so choosing the same file can
retry a failed upload. The editor retains its existing cover and text on failure.

## Authenticated image reads and CORS

`getBlob` reads member-only covers and DM-only maps with authentication. Browser
reads require the bucket's CORS configuration to allow GET from the actual site
origin. Upload success does not demonstrate that this read configuration works.

Before any approved production change, inspect and back up the current bucket
configuration, for example:

```sh
gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format=json > /tmp/dnd-storage-bucket-before.json
```

For a read-only inspection of just the CORS settings in Google Cloud Shell:

```sh
gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format="json(cors_config,cors)"
```

The following is an example **additional entry**, not a replacement for an
unknown existing CORS configuration:

```json
{
  "origin": ["https://dnd-loot-site.web.app", "https://dnd-loot-site.firebaseapp.com"],
  "method": ["GET"],
  "maxAgeSeconds": 3600
}
```

Use the address bar's exact origin for any custom domain or Hosting preview
that needs access. Preserve existing CORS entries, combine this entry into a
complete JSON array, review the resulting diff, and obtain the project owner's
approval before applying it. `gcloud storage buckets update --cors-file` replaces
the entire configuration, so do not supply the example entry by itself.

CORS does not grant Storage object permissions. Preserve the authenticated
Storage rules; do not replace `getBlob` with public download-token URLs to
bypass the read failure. Verify an actual uploaded cover after refresh as a DM
and an active player, and verify outsiders cannot read it. Console/network
evidence is necessary to diagnose production; fixture/emulator passes alone
cannot establish the deployed rules or CORS settings.

### Proposed configuration when the current CORS settings are empty

The owner reported `null` from the CORS-only inspection command. Read-only
Cloud Storage GET preflights for the configured bucket returned no CORS
headers for `https://dnd-loot-site.firebaseapp.com` or the web.app origin.
Together these support missing browser-read CORS configuration. The cover
folder exists in the configured Firebase Storage bucket; this is separate
from provisioning Storage or saving a front-page document.

[`scripts/campaign-image-cors.json`](../scripts/campaign-image-cors.json) is the
proposed complete configuration **for an empty CORS configuration**. It allows
GET only from the two production Hosting origins and the exact PR #100 preview
origin. It does not grant public object access, modify Storage/Firestore rules
or allow arbitrary preview origins. A production-only CORS entry does not cover
the separate hostname used by a Hosting preview.

Before an approved publication, back up the latest complete bucket metadata and
recheck that the current CORS fields are still empty. If CORS entries exist,
preserve them and append only the needed GET entry instead of replacing them.
In Cloud Shell, this preparation is read-only with respect to the bucket:

```sh
DND_CORS_REVIEW_DIR="$(mktemp -d /tmp/dnd-cors-review.XXXXXX)"
gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format=json > "$DND_CORS_REVIEW_DIR/bucket-before.json"
gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format="json(cors_config,cors)"
```

Review the JSON file and obtain the owner's approval before running the
following publication command with a local copy of the reviewed file:

```sh
gcloud storage buckets update gs://dnd-loot-site.firebasestorage.app --cors-file=scripts/campaign-image-cors.json
```

This command changes production bucket CORS; it is not run by tests, CI,
Hosting previews or the onboarding setup. After publication, refresh the real
site, upload a cover, add its image description and save the front page. Reload
and verify it as the DM and an active player. Check browser network errors if
the image still cannot load; a CORS repair alone does not verify read permissions.

### Complete Cloud Shell repair without a previous session's variables

An error reading `/cors.json` means the directory variable was empty. It occurs
before publication, so that attempt did not change bucket CORS. Copy the entire
block below into one Cloud Shell session when approving this repair; the final
command publishes bucket CORS. The subshell stops on errors, retains a metadata
backup, and prepares a complete configuration preserving existing entries.

```sh
(
  set -eu
  DND_CORS_REPAIR_DIR="$(mktemp -d /tmp/dnd-cors-repair.XXXXXX)"
  DND_CORS_SOURCE_URL="https://raw.githubusercontent.com/Just1Per/DnD-Loot-Site/fix/campaign-cover-retry/scripts"
  gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format=json > "$DND_CORS_REPAIR_DIR/bucket-before.json"
  curl -fsSL "$DND_CORS_SOURCE_URL/campaign-image-cors.json" -o "$DND_CORS_REPAIR_DIR/desired.json"
  curl -fsSL "$DND_CORS_SOURCE_URL/prepare-campaign-image-cors.cjs" -o "$DND_CORS_REPAIR_DIR/prepare.cjs"
  node "$DND_CORS_REPAIR_DIR/prepare.cjs" "$DND_CORS_REPAIR_DIR/bucket-before.json" "$DND_CORS_REPAIR_DIR/desired.json" "$DND_CORS_REPAIR_DIR/cors.json"
  gcloud storage buckets update gs://dnd-loot-site.firebasestorage.app --cors-file="$DND_CORS_REPAIR_DIR/cors.json"
)
```

`prepare-campaign-image-cors.cjs` performs no network or bucket writes. It checks
the bucket identity, rejects malformed/ambiguous CORS input, preserves prior
entries and their response headers, and adds only missing GET origins. It refuses
wildcard or write-method additions. The final update is a separate production
action, authorized by the owner running it. For a pinned, reviewed repair, use
the commit-specific source URL from the PR instead of a moving branch URL.

After a successful update, reload the PR #100 preview and the main site. A
saved-page image timeout now also confirms that the front page itself is saved;
an image read failure does not roll back the Firestore save. If loading still
fails, inspect the actual browser Storage request and current bucket metadata.

## Automated verification

`firebase.workspace-test.json` and
`tests/workspace-storage-rules.cjs` both read `storage.rules`.
The Storage emulator tests cover item images, map images, owner/DM/player
permissions, MIME/size restrictions, and immutable map uploads.

The repository intentionally does **not** automatically deploy Storage rules
when opening or merging a PR; that is a separate production security change.

## Marker styles and named regions

DM Workspace → Map supports five point-marker styles: Location, City, Castle, Landmark and Point of interest. These are presentation choices for a location/city. Region is a separate area type: use Add a region area, give it a name and description, and draw 3–12 boundary corners. Undo corner and Redraw boundary adjust the shape. Keyboard users can add corners using percentage coordinates. Finish boundary validates a nonzero area without repeated corners or crossing edges; Keep place in draft retains it in the working draft.

Regions have the existing picture, shared-World link and Reveal to players controls. Their shaded boundaries and labels open the same description as the accessible places list. Hidden regions, including their geometry and names, are omitted from the published snapshot. Saving a draft does not change the player map. Publishing sends revealed points and regions atomically. Existing point and region markers without boundaries remain readable and normalize with their previous City style.

**Deploy the updated Firestore rules with this feature.** Published pins now allow validated optional `markerStyle` and `boundary` fields. Rules limit boundaries to 3–12 numeric points in the map bounds, reject extra vertex fields, and permit nonempty geometry only on a Region. Revision, membership, private-draft and publication checks are retained. Storage rules are unchanged; no production migration is needed. No deployment or migration is performed by preparing this PR.

Validation: `npm --prefix tests run test:map-styles-regions` exercises geometry, all five styles, pointer/keyboard drawing, undo/redraw, hidden areas, publication, reading, mobile layout and accessibility. The existing campaign-map browser suite and `test:campaign-map-rules` remain required, including malformed geometry and atomic publication checks.
