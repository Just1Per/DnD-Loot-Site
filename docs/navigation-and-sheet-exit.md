# Returning to a campaign and saving before leaving

Refreshing the page restores the signed-in user's campaign and active tab in the same browser tab. Character sheets also restore the selected character and section. DM workspaces restore a saved entry and workspace kind, including the encounter list. New unsaved workspace records return to the list. Explicitly leaving a campaign remembers the dashboard; explicitly signing out removes that account's remembered destination.

The sessionStorage cache contains locations only: campaign, tab, character, section, workspace kind and saved record IDs. It never contains sheet data or editor drafts. Saved data is loaded again on refresh. This is not draft recovery or a shareable URL.

Campaign membership is checked again before restoring a destination. DM tabs require campaign management permission, even when the account has a global DM role. Unauthorized or missing campaigns return to the dashboard; removed characters and entries fall back to an accessible sheet or list. Invalid cached data and unavailable browser storage cannot prevent normal navigation. Startup and campaign reads discard responses belonging to an earlier account.

Leaving a changed character sheet through its close button, another tab, character chooser, campaign exit, catalogue/admin navigation or logout opens a keyboard-accessible dialog:

- **Save and continue** uses the existing validated, revision-checked sheet transaction and continues only after a successful save with no remaining changes.
- **Leave without saving** discards the draft and continues.
- **Stay here** or Escape retains the draft and current location.

Validation errors, denied saves and revision conflicts keep the dialog and draft available. Choices are disabled while saving. Changing accounts cancels the pending continuation, and the transaction rechecks the captured account and editor session before writing.

Browser-controlled refresh/close warnings still use the browser's own buttons. Browsers do not allow a custom Save button in that warning. Save the sheet before refreshing or closing the browser; only saved data can be reopened.

## Verification

`npm --prefix tests run test:navigation` uses real browser reloads and the application's authentication/startup loaders against an isolated Firebase fixture. It covers saved destinations, current permissions, account isolation, failed/conflicting/pending saves, validation, logout, focus containment, Escape, mobile layout and axe checks. It also verifies malformed or missing destinations and disabled storage. Existing character, workspace, front-page and Firestore permission suites remain in use. No One Shots feature work is included.

## Grouped campaign navigation

Home, Journal, My Character, Library and the campaign-DM-only DM Workspace are the primary destinations. Journal groups the campaign guide, known NPCs and completed chapters; the existing member-facing snapshots remain the source for those pages. My Character groups the existing character list and full sheet. DM workspaces retain their concrete routes inside secondary navigation. The Settings header action opens campaign settings, members, invitations and rules together. It requires campaign management permission, including for global administrators.

Remember concrete subsections rather than group names, so refresh and returning from Admin restore the actual page. Home shortcuts open the relevant Journal subsection directly, and returning to Journal retains its last visited subsection. Existing Save/Discard/Stay guards run before changing the visible navigation. No data migration, permission rules changes or One Shots feature development are included.

## Shared DM workspace

The persistent sidebar groups Overview, World, Creatures & NPCs, Chapters and Party & Loot. Overview links to a saved Current chapter, falling back to Planned, and recent nonarchived preparation. Loading summaries creates no workspace draft or document writes. Party & Loot owns the existing character/inventory controls and rarity guidance. One Shots remains a collapsed paused utility.

A chapter can show linked saved NPC/location references beside its editor. References preserve the current form, including unsaved changes, and cannot reveal/publish/update an entry. Opening the full reference editor still uses existing discard/busy guards. Late or unlinked private reads are ignored after account, campaign, chapter or permission changes. Player snapshots and normal chapter print remain separate from DM references.
