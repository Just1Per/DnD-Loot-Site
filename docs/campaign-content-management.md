# Campaign maps and DM content management

## Controls

| Content | DM control | Result |
| --- | --- | --- |
| Maps | Maps → DM map actions → Delete map | Remove its publication and private draft, clear its ordering/main-map selection and revoke player image/pin access. |
| Map places, regions, roads and party routes | Remove from draft, then Publish changes | Remove the selected shape from the next publication. |
| World posts, NPCs, creatures and chapters | More options → Delete entry | Delete the source, DM notes, player publication and protected journal illustration copies together. |
| Campaign encounters and One Shots | Delete entry in the editor | Remove that entry; preserve other campaign records and player character data. |
| One-shot encounters | Delete entry in the adventure encounter editor | Delete only the adventure-scoped encounter, including when a campaign encounter has the same ID. |
| DM-authored recaps | Open your saved recap → Delete recap | Delete your private working draft and its shared version together. |
| Other authors’ shared recaps | Remove from Journal | Existing moderation removes the shared copy; the author’s private original stays inaccessible to the DM. |
| Campaign custom feats | Campaign settings → feat editor → Delete custom feat | Delete the campaign definition. Existing character selections remain unavailable references; its automatic bonuses stop. Hide availability instead to preserve current benefits. |
| Library items | Existing Delete item control | Existing inventory-aware item removal remains unchanged. |

An unsaved new map can also be discarded with **Delete map**, without creating or deleting server records. Map copy/clone/delete controls are absent from player view and player preview. **Organise maps** retains ordering and main-map controls.

Delete actions require confirmation, recheck context and refuse stale saved revisions. Archive/Restore remains available when preservation is wanted. Deleting a linked entry does not cascade through related entries; its old connections show Unavailable entry and can be removed or replaced. Deleting a World post returns the mobile editor to its browse list.

## Copy places or clone a map

Use the always-visible **DM map actions** below the map heading. **Copy pins…** selects another saved map and the places/regions/routes to add. Select a pin and use **Copy pin to another map…** in its details to preselect just that pin. Existing destination pins remain. **Clone map…** creates a separately named private map, including its background and optional overview. Both offer an Include place pictures checkbox. A clone can use a replacement background, so an unreadable original need not block recovery; copying places into an existing map never needs the old background to load.

Copies retain text, relative percentage positions, marker styles, region appearance, boundaries/routes and same-campaign World links. Each pin receives a new ID. Copied pins start hidden; inspect their positions, reveal the desired places and explicitly Publish changes. Copying never publishes, modifies or deletes the source, and never silently replaces destination pins. The 100-place and 50-map UI limits remain. Source/destination revision checks stop a late copy from overwriting newer work.

Pictures use new destination-scoped immutable paths and protected exact-byte copies. Prefer an existing protected source copy; the DM may fall back to authenticated Storage originals. No public download token or cross-campaign image alias is introduced. When an original cannot be read, turn off place pictures or choose a replacement background; source/destination documents remain unchanged after failure. Interrupted image preparations may leave private, unreferenced uploads, as with ordinary interrupted uploads.

## Retention and permissions

Map deletion replaces the published map with a minimal retirement record containing only deletion actor/time and revision. It retains no title, image path or pin description. The private draft is deleted. Old pin documents and immutable image bytes remain private; player rules deny them once their map is retired. The retirement record cannot be overwritten, republished or removed by the client, preventing revision-1 pins from reappearing under a reused map ID. After deleting the original `main` map, a new map receives a fresh ID.

This is removal from the campaign interface and publication, not a bucket-wide data purge. Uploaded originals and detached one-shot character history are retained privately. Other campaign entries, character sheets, loot and authors’ private records are not cascaded or rewritten.

Campaign owner/active DM access is enforced by Firestore. Players, revoked DMs, outsiders and unrelated global administrators gain no deletion rights. Source workspace removal must remove its shared publication and private notes in the same atomic operation. A DM can delete only their own private recap; moderation never grants access to another author’s draft.

## Release

Deploy the accompanying **Firestore rules** before releasing the frontend:

```sh
firebase deploy --only firestore:rules --project dnd-loot-site
```

Storage rules, indexes, dependencies and Cloud Functions are unchanged. No production deployment or data backfill is performed by this PR. The image MIME repair itself does not broaden permissions; see [map image access](campaign-map-image-access.md). After release, run **Repair image access** on affected maps. Follow its per-image report: refresh after an in-place repair; review and **Publish changes** after a rebuilt copy. The latest rules also restore legacy published pin pictures; an earlier rules deployment does not contain this fix.

## Verification

- `campaign-content-management.cjs`: independent copy identities, byte preservation, geometry and existing destination content, missing-image recovery, revision/context races, limits, retirement and atomic workspace/recap deletion.
- `campaign-map-media.cjs`: legacy MIME normalization for PNG/JPEG/WebP without byte changes, unsupported-image diagnostics and authentication boundaries.
- `campaign-content-management-rules.cjs`: actual Firestore delete/copy/retirement rights, revocation of old manifests/chunks/pins, forbidden identifier reuse, source/publication/note deletion, own-author recaps, scoped adventure encounters and custom feats.
- `campaign-map-management-browser.cjs`: 4-of-13 repair failures, remaining-image recovery, missing MIME, DM preview/player pictures, private copies, explicit publication, mobile/axe, cancel/delete and a fresh map after deleting all old maps.
- `campaign-map-recovery-browser.cjs`: corrupted finalized copies, explicit publication, healthy-copy diagnostics, visible DM controls, selected-pin copy, cloning and saved/unsaved deletion, mobile layout and accessibility.
- `campaign-workspace-deletion-browser.cjs`: mobile confirmation, browse restoration, retained linked records, stale revisions, recap/custom-feat deletion and unchanged player originals/selections.

The existing named-map, map-media, Storage, World/NPC/chapter, One Shot, journal, notification and Adobe regression suites remain enabled.
