# Mobile World editing

At widths of 760px or below, DM Workspace → World shows either the browsing list or the selected post editor. Opening or creating a post brings its editor and Save/Publish controls into view. **Back to World posts** restores the same list, search, category, visibility, list scroll and page scroll.

Returning to the list keeps the live form mounted. **Resume unsaved draft** or selecting that same post returns to those exact edits, including unsaved image and layout choices. This is not a save: leaving the workspace or opening a different entry still uses the existing unsaved-change warning. Saves and publication remain explicit. The return/resume controls ignore clicks while a save or image operation is busy. A failed entry read remains visible in the list.

Desktop keeps the existing list and editor together. This change is scoped to World; NPC and chapter preparation keep their current layout. The top Guide explains the mobile flow.

## Validation

`npm --prefix tests run test:world-editor-navigation` covers the real browser at 320, 390, 760 and 1440px: retained form values, filter/scroll restoration, same-record resume without a discard prompt, save/publish and secret exclusion, failed entry reads, workspace navigation guards, new drafts, player denial, horizontal fit and axe accessibility checks.

Existing simple-World, publication/image, per-post-layout, compact DM navigation, app-navigation and navigation-feedback browser tests and the 19 planning DOM checks also pass. The simple-World test now explicitly returns to the list before using its filters on mobile.

No stored schema, Firestore rules, Storage rules, migration or production deployment is required or performed.
