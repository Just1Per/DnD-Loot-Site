# Multiple campaign maps

Journal → **Maps** shows the names of published campaign maps across the top. Opening the area selects the designated main map. Players can switch maps and read each map's own published places and regions. Unpublished draft names, images and places stay out of the player view and the DM's player preview.

In DM Workspace → **Maps**, use **Add map**, enter its name, upload its image and save a private draft or publish. Each map has a separate draft and publication. **Organise maps** stays collapsed by default. Move earlier/later works with keyboard and touch; dragging any map name also changes order. **Make main map** selects one published map to open first. Organisation changes save immediately and do not republish map content or alter pin revisions. The interface supports up to 50 maps in its order list.

The selected name has a visible selected state and remains within the scrollable name row on mobile. Add map stays outside that scrolling row. Image-quality details are folded below the upload field to keep editing compact. Guide and contextual descriptions cover switching, ordering, publication and main-map selection.

## Compatibility and data

- The existing `main` map, its original paths, five marker styles, named region boundaries, pictures and publishing behavior remain supported without migration.
- Additional maps use their own document IDs in `campaignMaps/{mapId}` and `campaignMapDrafts/{mapId}`. Each store instance is bound to a map ID; late reads from another map cannot change the current view.
- Additional immutable images use `campaign-maps/{campaignId}/{mapId}/{imageId}`; place pictures use `campaign-map-place-images/{campaignId}/{mapId}/{pinId}/{imageId}`. A pin ID reused on two maps cannot expose the other map's picture.
- `mapPreferences/main` stores ordered IDs, one optional published main-map ID, a revision and update metadata. It contains no draft titles, descriptions or images. DM transactions reject stale organisation changes. Missing preferences fall back to the existing `main` map, or the first published map.
- Order/main selection does not change map publication revisions, keeping existing pin queries valid. Replacing one map does not replace any other map's images or places.
- Existing overview-first loading and unchanged original zoom detail continue to work. Each open map owns and clears its own object URLs. No new persistent private-data cache is introduced.

## Rules required

**Publish both `firestore.rules` and `storage.rules` with this feature.** Firestore permits named map IDs, DM-only drafts, scoped pin publications and revision-checked map preferences. Storage permits exactly the selected map's currently published original/overview and place pictures for active members. Original flat `main` paths remain supported. Uploads and unrevealed places stay private; revocation and campaign soft deletion end access.

No indexes, Cloud Functions or data migration are required. No production rules have been deployed and no production data has been migrated or deleted by this work.

## Verification

- 19 Firestore/Storage emulator scenarios cover existing single-map behavior plus independent named map drafts/publications, scoped images, identical pin IDs on different maps, malformed/cross-map paths, private drafts, order/main permissions, revision races, the 50-entry order boundary, revocation and soft deletion.
- New real browser flow uploads/names/publishes two maps, saves a third private map, orders with buttons and dragging, chooses the main map and exercises player/default/exact-editor navigation. It verifies dirty-draft cancellation/discard, failed organisation writes, isolated places, no player draft-collection reads, privacy in player preview, stale reads and revoked/account-changed sessions.
- Mobile/desktop screenshots, selected-tab visibility, no overflow and WCAG checks run at 1440, 390 and 320 px for DM/player views.
- Existing map, five-style/region, overview loading, navigation, Guide/help and Hosting packaging regressions are retained.
