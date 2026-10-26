# Usability review — 26 October 2026

The user’s tester found the site difficult to understand. This first pass targets a measured problem in the existing DM flow, while the class-engine work continues separately. It does not claim to finish the site-wide usability review.

## First implemented changes

At 390px, the DM Workspace section menu used **266px** for seven buttons in four rows plus its heading. Combined with the global header, campaign context and main navigation, it pushed preparation content far down the page. The same routes now use one labelled native selector on screens up to 760px: **98px**, a reduction of about **63%**. Desktop retains the familiar sidebar. The current section stays selected, including when a user cancels navigation to protect unsaved edits. Existing role checks still prevent players from opening DM routes.

World also showed the same category filter twice: a strip of category buttons and the sidebar’s Category dropdown. There is now one Category dropdown, with entry counts in its options. Standard/custom category names, escaping, search, visibility, archive filtering and category-aware creation still behave as before. Editing or publishing an entry keeps its category selected and the saved entry discoverable. Redundant category-strip markup and styles are removed. The introduction names the publishing destination explicitly: Journal → World.

The DM Guide explains the mobile section selector and the single category filter. The navigation selector has a clear label and relies on the Guide instead of adding another automatic question-mark control. Changed styles and scripts receive a fresh asset version.

## Validation and limits

A dedicated browser test covers 320/390/760px, the desktop sidebar, current-route synchronization, canceled dirty-draft navigation, counted World categories, stale-player access and accessibility. Existing World publishing/custom-category/private-image and campaign-information tests exercise the new single-filter control. Existing DM workspace, focused planning DOM and help checks remain required. No Firestore/Storage rules, saved schema, data migration or production deployment are involved.

Measurements come from isolated browser fixtures with real application scripts, not a production account. Screenshots show fixture campaign data.

## Next review points

| Priority | Area | What to verify next |
| --- | --- | --- |
| 1 | Main navigation and campaign context | At 390px, primary navigation still takes 116px. Keep the active destination obvious, distinguish reading from preparation and test how quickly a new player finds World, their character and items. |
| 2 | Mobile browse → edit | Lists and filters can appear before an editor on a narrow screen. Review a focused editor view with a clearly named return action that preserves search and position. |
| 3 | Character sheet density | Review the many tabs and simultaneous controls with a real player task. Keep a readable summary and reveal editing/settings when needed, preserving the sheet design the user likes. |
| 4 | Help and repeated actions | Remove explanations from self-evident navigation controls; retain useful section guidance and precise help for rules. Audit duplicate destinations and inconsistent action labels. |
| 5 | Complete role-based journeys | Test new player onboarding and the DM’s prepare → save → publish → player-read flow before expanding the pattern elsewhere. |

The tester’s specific pain points have been requested. These priorities can be adjusted to that feedback without replacing the current working features.
