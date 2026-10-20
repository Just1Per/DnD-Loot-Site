# DM-published campaign map

The Journal map now uses the approved interactive design in the real app. DMs can upload a map, create City/Region pins, add descriptions and optional pictures/alt text, select a shared World Builder entry, and mark which pins are revealed. Pins offer hover/focus previews and persistent click/tap details. The map supports zoom, bounded pointer/keyboard panning and Reset view. Phone layouts place details below the map; the place list is another keyboard/touch route to each pin.

## Editing and publishing

1. Open DM Workspace → Map. World Building remains the written setting editor. Journal → Map is a published-only reader; DMs get a Manage map shortcut to the separate workspace.
2. Upload/replace an image and edit places. Replacing the image preserves coordinates and descriptions; review their positions on the replacement.
3. Keep place in draft updates the local working copy. Save private draft persists that copy for campaign DMs. Unsaved navigation is guarded; failed saves preserve input.
4. Publish changes first saves any completed local draft changes, then atomically publishes the map and revealed pins. Complete/cancel an open place form first.
5. Preview as player shows the last actual publication, not the working draft. Hidden pins stay in the DM draft. An empty revealed-pin set publishes the map without places.

Only shared World entries are offered for links. Publication checks their shared documents again and omits links that are no longer shared. The live shared-entry feed removes unavailable actions; clicking also rechecks access and opens the existing World reader at that entry. Publishing a map never publishes a private World entry or copies DM secrets.

PNG/JPEG/WebP uploads must be under 5 MB. Maps support up to 100 places in one atomic publication. Larger existing maps are not truncated: saving reports the limit rather than silently deleting places. Text is rendered as plain text. Uploads use unique immutable paths and authenticated blob reads; the UI creates no download-token URLs.

## Data and access model

- `campaigns/{campaign}/campaignMapDrafts/main`: title, image path, bounded place array, draft revision and base published revision; campaign DMs only.
- `campaigns/{campaign}/campaignMaps/main`: published metadata and monotonically increasing revision. New publications use `schemaVersion: 2`.
- `campaignMaps/main/pins/{pin}`: explicit safe fields only, with `publishedRevision`. Player queries/read rules require the current map revision. Removed/hidden pins from earlier versions are inaccessible even if their image path is unchanged. Old documents are retained, not deleted as a side effect of publication.
- `campaign-maps/{campaign}/{image}`: existing immutable map objects; players can read only the currently published map path.
- `campaign-map-place-images/{campaign}/{pin}/{image}`: new immutable place pictures; players can read only the exact picture on a pin from the current publication. Draft uploads and replaced/hidden pictures remain DM-only.

The draft and published revisions are checked inside transactions. Concurrent DM changes and account/context changes cannot silently overwrite another version. Publication updates all revealed pins and the map pointer together. Listener recovery distinguishes a normal publication advancing from actual membership revocation; revoked access clears images, place data and object URLs.

Existing legacy map documents remain readable. The first DM draft is initialized from the current map and its existing pins, without a migration or automatic write. Legacy pin queries remain valid until the first version-2 publication. Old browser bundles cannot downgrade an adopted version-2 map; refresh those sessions after rollout. No old documents or images are deleted by this change.

## Rollout — owner action required

Both `firestore.rules` and `storage.rules` must be deployed **before merging this map PR**, because the existing main-branch workflow deploys Hosting automatically on merge. Hosting does not deploy rules. The rule changes retain legacy map support, so deploying them first is compatible with the current site.

From a checkout of this PR, using the owner's Firebase credentials:

```sh
firebase deploy --only firestore:rules,storage --project dnd-loot-site
```

Then merge the PR, let Hosting deploy, refresh old browser sessions, and test with a campaign DM and a separate active player. Verify an unshared draft/picture is unavailable to the player, publish a revealed pin, follow its World link, then hide the pin and publish again. No production migration command is required. This work has not deployed rules, deployed Hosting, or migrated production data.

A Hosting preview uses the same Firebase backend and therefore also requires these rule updates before DM draft editing works. The earlier standalone design preview remains synthetic and requires no Firebase access.

## Validation

- `node tests/campaign-map-browser.cjs`: isolated app fixture, upload/save failure retention, saved draft reopen, hidden/revealed publication, player-only view, hover/focus/Escape, pictures, World reader linking/unpublishing, navigation guards, mobile layouts at 320/390px, WCAG A/AA checks, zoom/pan/reset, superseded listeners, revocation and late-account responses.
- `npm --prefix tests run test:campaign-map-rules`: Firestore + Storage emulators, legacy compatibility, draft/picture denial, atomic publication, exact-current-image access, hidden and stale pin denial, removed picture access, cross-campaign and extra-field rejection, revision conflicts and first publication at the 100-place limit.
- Adjacent World browser/permission and shared Storage regression checks.

## Separate map setup and reader

The `dm-map` route opens the private editor directly and is restored on refresh only after checking the current campaign DM role. `campaign-map` loads the published map only, including for DMs; it does not request private drafts. Existing map documents and Storage paths are unchanged. Private World-entry map attachments remain separate DM preparation and are not silently moved or deleted.

If private draft loading fails, the DM workspace keeps the published map readable, disables editing/publication and offers Refresh with guidance. A draft denial does not prove the published map is inaccessible. Primary map permission failures still clear the entire view. The owner confirmed the reported production access failure cleared after deploying both map rule files on 20 October 2026. Separate error handling still prevents a private-draft failure from hiding an otherwise readable publication. This navigation/error-handling change requires no additional rules beyond the map rules already documented above.

Main campaign maps accept PNG, JPEG and WebP files up to 50 MiB (52,428,800 bytes), without resizing or compression. Pin pictures retain their separate limit below 5 MiB. Deploy the updated Storage rules alongside the app change; Firestore rules are unchanged.
