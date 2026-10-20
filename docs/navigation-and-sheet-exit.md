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

## World reading and Library sections

Journal → World shows image cards with a category and description excerpt. Read post opens a dedicated reader with its published image, caption and paragraphs. Back to World retains the current account/campaign's search, category, scroll position and originating card focus. These browsing preferences live only in memory and are cleared on account changes. Publication removal and permission failures remove the displayed post; late reads cannot restore it.

A campaign DM can choose Edit post to open that exact saved World entry. Back to World returns to the filtered list through the existing unsaved-change guard. Save as draft stays in the editor. Release to players saves and publishes the current text, illustration and caption together using the existing snapshot transaction. The release summary explicitly names what is included. Later draft saves remain private.

Library uses the same section navigation as Journal: Items and Reusable content. Reusable content browses the existing personal creature/NPC templates for campaign DMs. Create campaign draft opens an independent unsaved copy in DM Workspace; it never alters the original template. Spells remain in character sheets. No new collections or permission changes are introduced by this navigation change.

`npm --prefix tests run test:world-navigation` covers the full read/edit/draft/release/return flow, published illustrations, retained filters/focus, template search/import, player access, mobile layouts and WCAG checks. Existing Journal cards, campaign information, simple World and grouped app navigation suites remain in use.

## NPC reading and return navigation

Journal → NPCs follows the World reading pattern: cards show a name, category, portrait when shared, and an introduction before Read NPC opens a dedicated reader. Paragraphs and captions are preserved, and portrait images fit inside the reader without cropping. Back to NPCs restores the current account/campaign’s search, category, list scroll and card focus.

Campaign DMs can choose Edit NPC to open the exact creature record in DM Workspace. Back to NPCs uses the existing unsaved-change guard. Saving a draft does not reveal its new text; Reveal NPC to players or Update shared version remains an explicit action. NPC illustrations still use the existing separate Share image with players control. The reader only consumes playerNPCs snapshots, so private statistics, goals and DM notes are never read for this page.

No additional Firestore or Storage rule changes, data migrations or deployments are required for this navigation change. The earlier stacked map and campaign-deletion PRs retain their documented rule requirements. `npm --prefix tests run test:npc-navigation` covers reading, exact-record editing, draft isolation, explicit reveal, canceled navigation, keyboard opening, retained filters/scroll/focus, revoked entries, campaign isolation and desktop/mobile accessibility.

## Collapsible Library DM tools

Campaign managers get a single DM tools disclosure containing Create Campaign Item, Add from Root Catalogue, DM quick controls and Quick show by rarity. It starts collapsed. Its open/closed preference is stored locally per signed-in account, survives refresh, and is independent of other accounts. Storage failures fall back to a collapsed panel. Players and global admins without campaign management permission do not see it. Item search, filters and Refresh Items remain available outside the panel. No backend rules or production changes are required.

## Library browsing feedback

Item search accepts multiple words across names, descriptions, categories, rarity, source, classes and property text. Active filters are visible as removable buttons, with a single Clear search & filters action. Opposing status choices (looted/unlooted, attunement/no attunement and highlighted/not highlighted) deselect each other. Result totals count only items available under the current campaign’s permissions. Empty campaigns and filtered-out results offer different guidance.

Reusable content offers a category filter, multi-word search, clear action and a preview with rules edition, creature type and combat values when enabled. In-app return retains the current account/campaign’s search, category and open previews. Create campaign draft still imports an independent unsaved copy and never changes the source template. No new rules, collections, migrations or deployment are required.
