# Campaign-scoped journal images: deployment and permissions

These illustrations are **never global catalogue assets**. Every picture is bound to one campaign, one journal record kind, and one entry ID.

- Storage: `campaign-journal-images/{campaignId}/{kind}/{entryId}/{imageId}`
- Entry metadata: `campaigns/{campaignId}/{collection}/{entryId}.data.journalImage`
- Kinds: world (including regions, areas, locations, factions and lore), creature (including NPCs, monsters and bosses), chapter and encounter.
- Supported images: PNG/JPEG/WebP, each **under 5 MB**.
- A replacement uploads a new immutable object. Remove only detaches the entry reference. Old uploaded objects are deliberately not deleted, pending a future audited garbage collection procedure.
- Pictures are readable and uploadable **only by the campaign owner or active campaign DM**. An item that was imported from another campaign or the personal creature template library never carries that campaign's image path.
- Sharing the entry's textual description with players does **not** publish the image or a Storage download URL. This avoids spoilers. A future explicit player-visible image publishing flow must use its own Storage access rules and player records.

## Set up after review

1. Review the changed `firestore.rules`, `storage.rules` and tests in this PR. The new rules do not grant public or all-member read access to DM-private images.
2. Merge the feature PR and ensure Firebase Hosting deployment succeeds.
3. In the Firebase project **dnd-loot-site**, publish both rules files. If you have Firebase CLI project access from a trusted local terminal: `firebase deploy --only firestore:rules,storage --project dnd-loot-site`. Or paste the corresponding additions through Firebase Console → Firestore Database → Rules and Storage → Rules. Hosting-only deploys **do not** publish Storage rules.
4. Sign in as a campaign owner/DM, open DM Workspace → World or Creatures & NPCs → a record, choose an illustration and enter the optional caption/alt text. Press **Save** to persist its reference. Reopen to verify the image reloads.
5. Sign in as a player or a DM from another campaign: the image is not accessible. DM-private illustrations do not appear in player journal publications.

## Data/permission design

Firestore rules accept `data.journalImage` only if its path embeds the exact `campaignId`, the exact `kind`, and the exact workspace `recordId`. The client independently checks the same scope before opening Storage. Storage rules permit only active campaign DMs and campaign owners to read/create within this path and require an image MIME type and size under 5 MB. Public and inactive users are denied. Image objects cannot be overwritten or deleted through the web app.

The existing World Building private map/markers under `campaign-world-images` remain separate and unchanged. Existing campaign cover and item image permissions are also preserved.

Tests cover immutable Storage writes, cross-campaign attempts, player/private read denial, cross-record Firestore references, and Chromium upload/save/reopen without leaking to player previews.
