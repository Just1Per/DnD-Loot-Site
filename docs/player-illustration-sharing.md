# Published player illustrations

World and Story NPC entries publish text, illustration and caption together through the top Publish to players / Publish changes action. Save draft retains private changes. Images are no longer a separate hidden publishing step for these entries. Completed chapters retain their existing separate image-sharing control.

Original PNG/JPEG/WebP uploads below 5 MB stay private and unchanged in Storage. Publishing creates a bounded image copy under the protected Firestore playerIllustrations path, separately fetched from the post list. This avoids the production Storage cross-service lookup limit when checking deletion, membership and publication. No public token URLs are generated.

Unpublishing, removing an image, archiving/reclassifying, revoked membership and campaign deletion deny player image reads. Private notes/statistics are never part of a publication. Older metadata-only releases retain authenticated Storage fallback where available; affected posts can be repaired with Publish changes after the rules/frontend update.

**Deployment for this fix: updated Firestore rules and frontend together. Storage rules are unchanged.** No production migration, backfill or deployment has been performed. Details and tests: [Player publishing fix](player-publishing-fix-2026-10-21.md).
