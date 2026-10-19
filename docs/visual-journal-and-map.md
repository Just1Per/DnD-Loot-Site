# Visual Journal and campaign map

Journal pages now use the available tab width instead of separate 1040/1180px containers. NPCs and World display responsive cards with already shared images, names, categories and short descriptions. Entries without a shared image get an initial placeholder. Opening a card reveals its published description; it never fetches DM preparation. Search, categories, live updates and existing chapter/private-note behavior remain intact.

Recap writing now starts with title, text and an audience selector. **Save draft** stores only a private draft. Choosing **Everyone in this campaign** changes the same button to **Share recap**; that action saves and shares in one flow, with no second publication confirmation. Session/author details and extra notes are in an optional disclosure with prefilled valid defaults. Failed sharing retains the saved private draft for retry; existing shared copies stay unchanged until sharing succeeds. Previously saved drafts and permissions are unchanged. The overview no longer reserves a permanent sidebar column.

## Map: player experience

The new Map tab is under Journal. Players see the saved image and named pins. Clicking a pin opens its short description beside the map (below it on mobile). The matching named place list offers the same reading path without precision clicking. Pins keep percentage positions when the map resizes.

## Map: DM experience

1. Open **Journal → Map → Edit map**.
2. Upload a PNG/JPEG/WebP smaller than 5 MB, name it and select **Save map**. The upload remains DM-only until saved.
3. Select **Add a place**, click its position, add a name/description and select **Save place**. The place is immediately visible to campaign members.
4. Select a place to edit, move or remove it. **Done editing** returns to the reading view.

Keyboard users can choose **Place at centre instead** and adjust horizontal/vertical percentage fields under Pin position. Save failures retain typed text and position. Navigation warns about unsaved map/place edits; pending writes block leaving. Stale revisions and context changes reject writes instead of overwriting another DM's work.

This version has one shared map per campaign. Replacing its image starts a new set of visible pins; the upload field states this before saving. Previous image objects and pin records are retained but no longer visible to players. No existing campaign data is migrated or deleted. A map and every saved place on it are campaign-visible; private DM preparation stays in the existing World Building workspace.

## Rules and rollout

Both **Firestore and Storage rules must be published from this change before releasing the new map UI**. Hosting workflows do not deploy these rules. The existing item, journal-art and cover permission paths are preserved.

- Firestore: `campaigns/{campaignId}/campaignMaps/main`, with individual `pins/{pinId}` documents. The owner/active campaign DMs can write; active members/owner can read the saved map. Member pin queries must match the map's current image. Field whitelists, position bounds, lengths, updater identity and revisions are checked server-side.
- Storage: `campaign-maps/{campaignId}/{imageId}`. Only campaign DMs/owner can create an immutable image of a permitted type/size. Players can read only the path selected by the current saved map. Pending/replaced images remain DM-only; clients cannot overwrite or delete image objects.

An authorized operator can publish the reviewed rule files with:

```sh
firebase deploy --only firestore:rules,storage --project dnd-loot-site
```

This is an operator instruction, not a command performed by the implementation agent. No indexes, production migration, third-party map service or Google credentials on the client are needed. If rules are missing or access is denied, the map fails closed rather than exposing an image or pin.

## Validation

- Populated NPC/world card grids: full tab width, desktop columns, mobile fit, expanded paragraphs, search and axe WCAG checks through 2.2 AA.
- Map browser suite: upload without publication, saved map/pins, pointer and keyboard placement, failure/retry, dirty navigation, named pin reading, desktop/390/320px layout, accessibility, DM/player controls, removals, access revocation and late account responses.
- Map emulator suite: actual Firestore/Storage rules for DM-only writes, private uploads, exact current-image reads, immutable/type/size boundaries, unrelated/removed/anonymous users, malformed data, revisions, context changes and replaced-map pin isolation.
- Existing journal, reference, image-sharing, navigation, engine/DOM and UI/print suites supplement the new tests. Screenshots use deterministic local fixture data; no test map or example NPCs are inserted into production.

The browser fixtures use Chromium. They do not establish Safari or complete screen-reader conformance, and live Storage credentials/network behavior still needs a deployment smoke check.
