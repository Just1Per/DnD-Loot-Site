# Player publishing and navigation fixes — 21 October 2026

World entries belong in Journal → World. Recaps now contain player recaps and completed chapters only; they no longer query or subscribe to World posts. Home keeps its campaign introduction and edit action, without a second copy of the main navigation at the bottom.

World and Story NPC editors share top-level **Save draft** and **Publish to players / Publish changes** actions. They remain visible while scrolling within the editor. Archive, preview and print are under More options. Preview is called Player preview; eligible post previews include the illustration and caption, while Monster/Boss illustrations remain private. NPC publishing now includes the saved text, illustration and caption in one action. Save draft never updates the player version. Publishing first saves valid dirty fields, then snapshots only the player text/image, excluding DM notes, statistics and goals.

## Why the illustration reader changed

The previous authenticated Storage read has to consult campaign deletion state, membership and the exact published image reference. Cloud Storage rules allow only two Firestore document lookups; these three independent checks cannot reliably fit that production limit. The Storage emulator does not model every production limit, so its successful authorization tests did not establish that this path would work in production.

The publisher now creates a bounded image copy (at most 1600px on the long edge and 512KiB, reduced further if needed) under `campaigns/{campaignId}/playerIllustrations/{kind}/entries/{entryId}`. It is saved atomically with the public post. The original uploaded file stays unchanged in private Storage. Image bytes are fetched separately from the list snapshots, avoiding large image payloads in World/NPC queries. No public download tokens or unauthenticated URLs are created.

Firestore rules check the live campaign, active membership and exact current publication before a player can read the image copy. Unpublishing, removing the image, archiving/reclassifying the source, revoking membership or deleting the campaign ends access. Anonymous accounts, unrelated campaigns and global admins without campaign rights cannot read the images. Stale and incorrectly scoped writes fail. Already downloaded image bytes cannot be recalled.

## Deployment and existing posts

**Updated Firestore rules and the frontend are required together. Storage rules are unchanged by this fix.** After that update, open an affected World post or Story NPC and choose Publish changes once. That explicitly creates its published image copy; no production backfill/migration is performed. Metadata-only legacy releases retain authenticated Storage fallback where it works. If neither path is available, the reader asks the DM to publish the entry again.

No production rules, images or documents have been changed by this work. A GitHub merge alone does not prove that the Firestore rules are published.

## Verification

- `test:publishing-feedback`: all five reported problems, existing metadata-only release repair, top controls, combined World/NPC publication, private later drafts, denied-original player image access, mobile layout and WCAG.
- `test:published-illustrations-rules`: actual Firestore emulator tests for World/NPC/chapter copies, transaction scope, size/MIME/schema, stale writes, role boundaries, and membership/unpublish/archive/deletion revocation.
- Updated existing Home/navigation/Recap/World/NPC/illustration tests follow the intended single navigation and publishing flows. The existing private Storage boundary tests remain enabled.
