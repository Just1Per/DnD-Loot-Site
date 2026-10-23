# Shared party journal

Journal now opens a shared overview, with notebook reading for individual entries. Existing Campaign guide, Known NPCs and Completed chapters remain available in the secondary navigation. The persistent Journal navigation is the single route to these sections; Home does not duplicate it.

## Writing and reading

Active campaign members, including campaign DMs and the owner, can write session recaps. Each recap has a title, session number/date, author name, optional character perspective, main text and optional “Remember this” / “For next time” notes. New recaps suggest the next known session number. Names are the author's chosen display text; ownership is enforced using the authenticated UID.

1. **Save private draft** stores the author's working text, visible only to that author. DMs and the owner cannot read another member's drafts.
2. **Preview** opens an escaped-text reading preview without writing or publishing.
3. Choose **Everyone in this campaign** and select **Share recap** to save and share in one action. Session details and extra notes are optional disclosures.
4. Later draft edits stay private until the author chooses the shared audience and selects **Share recap** again. **Make private** removes the shared copy while retaining the saved draft.

The Recaps feed contains only explicitly shared session recaps. Chapters are read in Journal → Chapters, World posts in Journal → World, and NPCs in their own section. Recaps never queries or subscribes to chapter/World publications or private workspace records. The notebook preserves recap paragraphs and optional note cards.

From the DM includes recaps authored by the campaign owner and campaign DMs. Player recaps includes authors whose campaign membership is Player, including users with a global DM role who play in this campaign. The labels come from the author UID and existing public campaign ownership/membership, not editable display names or the viewer’s role. Older recaps are grouped without rewriting records or requiring their authors to republish. Moderating a player’s shared copy preserves the player group.

The groups follow the current campaign roster, including role updates; they are display categories and grant no access. If an author no longer has a known role, their recap remains in All entries with a neutral Recap label. If roster loading fails, All entries and writing remain available and the UI offers a retry rather than mislabelling DM entries as players.

Filters and text search narrow the feed and its next-session sidebar note. Private drafts remain visible only to their author. Empty campaigns get a useful empty state rather than fabricated sessions. This feed/grouping correction requires no new Firestore or Storage rules and performs no data migration. Existing public campaign/member reads are used.

## Saving and access boundaries

- Leaving a dirty recap offers Save private draft and continue, Discard changes, or Stay. Failed saves retain typed text; pending writes block navigation. Browser reload/close uses the browser's unsaved-change prompt. Only saved drafts survive a reload.
- Transactions compare revisions for draft saves, publication and unsharing. A conflicting write requires copying the draft text and reopening/refreshing the saved version; it never silently overwrites another window.
- Private and shared subscriptions are campaign/UID scoped. Account changes and permission failures clear loaded text and previews; late callbacks cannot refill a new session. Temporary connection failures retain the current working draft for retry.
- Existing access and publication rules for DM preparation, NPC statistics and chapter notes are unchanged.

## Existing Firestore prerequisites

The existing Journal records use:

- `campaigns/{campaignId}/journalDrafts/{uid}/entries/{entryId}` — read/write only for that author while the author remains an active campaign member or owner. No draft collection listing is granted to other users, including DMs.
- `campaigns/{campaignId}/journalRecaps/{entryId}` — read by active campaign members/owner. Only the author can publish, update or remove their own snapshot. Published text must exactly match their saved draft and source revision. Allowed fields and lengths are checked server-side.

**The original Journal publication and moderation rules must already be published. No additional rules are needed for the recap-only feed and author grouping.** The repository's Hosting deployment workflows do not publish Firestore rules. An operator with the appropriate Firebase access can run, from the reviewed checkout:

```sh
firebase deploy --only firestore:rules --project dnd-loot-site
```

This command is an operator instruction; it has not been run by the implementation agent. If the UI is published before the rules, the new Journal shows an unavailable/retry state; existing reference sections remain separate. No index changes or Storage rules changes are required. No data migration or backfill is needed: shared chapter/World pages remain in their dedicated sections, and recaps are created only by user action.

## Validation

- `npm --prefix tests run test:campaign-journal`: real application markup/modules in Chromium fixtures, desktop plus 390/320px, WCAG checks through 2.2 AA, private save/reopen, explicit sharing, independent draft edits, unsharing, preview, DM/player filters and search, chapter exclusion, legacy DM recaps, author-group loading/retry, dirty-navigation save failure/retry, account isolation and permission/connection errors.
- `npm --prefix tests run test:campaign-journal-rules`: actual Firestore emulator checks for private draft isolation, author ownership, exact publication snapshots, revision conflicts, revoked/unrelated/anonymous accounts, size/field validation and context changes.
- Existing navigation, campaign home, lore/NPC/chapter browser suites, the 91 UI/print checks and aggregate engine/363 DOM checks passed during implementation. Existing lore, chapter and NPC permission suites also passed against the updated rules.

Browser tests use deterministic Firebase fixtures and Chromium. They do not send production requests, verify production credentials, or establish Safari/assistive-technology conformance. Existing shared-image Storage permissions are unchanged.

See [Visual Journal and campaign map](visual-journal-and-map.md) for full-width cards and the DM-managed map added later.

## Reading and return navigation

Read recap opens a clean paragraph reader. The list’s search/filter controls are hidden while reading, and Other journal entries is an optional collapsed disclosure below the story. Back to Recaps restores search, filter, scroll and the originating read button’s keyboard focus. Returning from your own draft focuses the reader title. Draft editing and explicit sharing remain separate. List preferences live only in memory per account/campaign, survive in-app navigation/Refresh, and clear on account changes. No new backend rules or data migration are needed.
