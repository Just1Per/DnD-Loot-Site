# Stabilization before One Shots

The owner's delivery order is: validate merged behavior, fix reported problems, complete common UX cleanup, remove unused code, measure performance, improve CI, then resume the larger One Shots work. Existing One Shots behavior stays available; the local layout exploration is preserved separately and is not part of stabilization PRs.

## Current fixes

PR #162 is merged: World entries no longer appear in Recaps, duplicate Home shortcuts are removed, World/Story NPC publishing includes the illustration and caption, and Save draft/Publish actions stay visible within the editor. Existing affected entries require an explicit Publish changes after the updated frontend and Firestore rules are released. Storage rules did not change in that PR.

The Recaps recovery fix keeps a retry action outside the hidden list header, so a failed subscription while reading does not strand the reader. Temporary failures retain the current content; permission revocation immediately clears it. Retrying rechecks access and preserves the search/filter. A loading state replaces the misleading empty-journal message before the initial request finishes. The unused World-specific reader branches are removed.

## Live verification still needed

A merge and successful emulator tests do not establish which Firebase rules are currently deployed. The owner should confirm that production Firestore rules include map regions, retained-record campaign deletion and protected published illustrations, then verify the live frontend as both DM and player. The publishing rollout requires the frontend and Firestore rules together. No production deployment, migration or backfill is authorized as part of this work.

Verify World text/image publication and later private drafts, NPC illustration publication, Recap reads/writes, map marker styles and named regions, Library DM control collapse, removal of catalogue copies, and DM/admin campaign removal with records retained. Record failures with the role, page and action; resolve these before expanding One Shots.

## Next engineering checks

Measure CI step duration before changing workflow structure. Retain all browser and permission checks. Measure startup, Library filtering and image pages using fixtures before selecting caching, lazy loading or pagination; do not add these without a demonstrated bottleneck. Keep cleanup PRs small and preserve navigation guards and saved records.
