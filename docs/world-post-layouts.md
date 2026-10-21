# Per-post World layouts

World posts now open in a wider reading area. Existing publications without a saved layout use **Illustration right**: story text on the left and the whole illustration/caption on the right. At narrow widths the illustration stacks above the text. Posts without illustrations use the available text area rather than reserving an empty image column. NPC presentation and campaign-home layout preferences are unchanged.

A DM can choose a different design for each World post in **DM Workspace → World → Post layout**:

- **Illustration right** (`split`): the wider default, similar to the campaign home.
- **Illustration left** (`reverse`): picture and text exchange sides.
- **Panorama** (`panorama`): wide illustration above a broad article.
- **Classic article** (`classic`): a centered reading page with its illustration above.

The chooser includes miniature diagrams and a **Preview selected layout** action. The actual preview uses the current text, illustration and caption, excluding private DM notes. **Save draft** stores `data.postLayout` only on that post's private source. **Publish changes** copies the saved choice to the player's publication as `postLayout`, together with the usual text/image release. Layout changes never update another post or silently change the player's saved snapshot. Unsupported reader values safely fall back to the wider default.

## Rules and rollout

**Updated Firestore rules are required before releasing the frontend. Storage rules are unchanged.** Rules accept only the four layout values on World drafts and require a published layout to match its saved source. Existing source/publication documents without layout fields remain compatible. Existing posts gain the wider default without a migration; selecting another layout requires saving/publishing that post. No production deployment, backfill or data migration is included.

## Validation

`npm --prefix tests run test:world-post-layouts` tests all four designs through the actual editor, preview, save/reopen and publish/read flow. It checks per-post independence, private later layout changes, failed-save recovery, player-only reading with private Storage denied, no-image/unknown/legacy fallbacks, desktop geometry, 390/320px mobile layouts and WCAG. Screenshots are included in the browser CI artifact as `world-layout-{layout}-{width}.png`.

`test:campaign-information-rules` now checks layout publication, forged/unsupported/missing choices, player writes and private draft updates against the real Firestore emulator. Existing workspace and protected illustration permission suites also pass locally. The new browser suite runs early in CI; all previous suites remain enabled.
