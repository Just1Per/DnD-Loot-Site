# Shared party journal

Journal now opens a shared overview, with notebook reading for individual entries. Existing Campaign guide, Known NPCs and Completed chapters remain available in the secondary navigation. The persistent Journal navigation is the single route to these sections; Home does not duplicate it.

## Writing and reading

Active campaign members, including campaign DMs and the owner, can write session recaps. Each recap has a title, session number/date, author name, optional character perspective, main text and optional “Remember this” / “For next time” notes. New recaps suggest the next known session number. Names are the author's chosen display text; ownership is enforced using the authenticated UID.

1. **Save private draft** stores the author's working text, visible only to that author. DMs and the owner cannot read another member's drafts.
2. **Preview** opens an escaped-text reading preview without writing or publishing.
3. Choose **Everyone in this campaign** and select **Share recap** to save and share in one action. Session details and extra notes are optional disclosures.
4. Later draft edits stay private until the author chooses the shared audience and selects **Share recap** again. **Make private** removes the shared copy while retaining the saved draft.

The feed contains player recaps and completed chapter summaries. World posts belong only in Journal → World and are not queried by Recaps. It never reads private workspace source records. DM labels distinguish those snapshots from player accounts. The notebook preserves paragraphs and optional note cards. Existing explicitly shared chapter illustrations and captions load through protected publication copies with authenticated legacy Storage fallback; opening a page never publishes an image. NPCs and private chapter notes remain in their existing reference sections.

Filters and text search narrow the feed. The sidebar shows the author's drafts, and surfaces the next-session note from the latest applicable shared player recap. Empty campaigns get a useful empty state rather than fabricated sessions.

## Saving and access boundaries

- Leaving a dirty recap offers Save private draft and continue, Discard changes, or Stay. Failed saves retain typed text; pending writes block navigation. Browser reload/close uses the browser's unsaved-change prompt. Only saved drafts survive a reload.
- Transactions compare revisions for draft saves, publication and unsharing. A conflicting write requires copying the draft text and reopening/refreshing the saved version; it never silently overwrites another window.
- Private and shared subscriptions are campaign/UID scoped. Account changes and permission failures clear loaded text and previews; late callbacks cannot refill a new session. Temporary connection failures retain the current working draft for retry.
- Existing access and publication rules for DM preparation, NPC statistics and chapter notes are unchanged.

## Firestore rules update required

The new records use:

- `campaigns/{campaignId}/journalDrafts/{uid}/entries/{entryId}` — read/write only for that author while the author remains an active campaign member or owner. No draft collection listing is granted to other users, including DMs.
- `campaigns/{campaignId}/journalRecaps/{entryId}` — read by active campaign members/owner. Only the author can publish, update or remove their own snapshot. Published text must exactly match their saved draft and source revision. Allowed fields and lengths are checked server-side.

**Publish the Firestore rules from this change before making the new UI available in production.** The repository's Hosting deployment workflows do not publish Firestore rules. An operator with the appropriate Firebase access can run, from the reviewed checkout:

```sh
firebase deploy --only firestore:rules --project dnd-loot-site
```

This command is an operator instruction; it has not been run by the implementation agent. If the UI is published before the rules, the new Journal shows an unavailable/retry state; existing reference sections remain separate. No index changes or Storage rules changes are required. No data migration or backfill is needed: existing shared DM pages appear through their current collections, and recaps are created only by user action.

## Validation

- `npm --prefix tests run test:campaign-journal`: real application markup/modules in Chromium fixtures, desktop plus 390/320px, WCAG checks through 2.2 AA, private save/reopen, explicit sharing, independent draft edits, unsharing, preview, filters/search, shared DM text/illustrations, dirty-navigation save failure/retry, account isolation and permission/connection errors.
- `npm --prefix tests run test:campaign-journal-rules`: actual Firestore emulator checks for private draft isolation, author ownership, exact publication snapshots, revision conflicts, revoked/unrelated/anonymous accounts, size/field validation and context changes.
- Existing navigation, campaign home, lore/NPC/chapter browser suites, the 91 UI/print checks and aggregate engine/363 DOM checks passed during implementation. Existing lore, chapter and NPC permission suites also passed against the updated rules.

Browser tests use deterministic Firebase fixtures and Chromium. They do not send production requests, verify production credentials, or establish Safari/assistive-technology conformance. Existing shared-image Storage permissions are unchanged.

See [Visual Journal and campaign map](visual-journal-and-map.md) for full-width cards and the DM-managed map added later.

## Reading and return navigation

Read recap opens a clean paragraph reader. The list’s search/filter controls are hidden while reading, and Other journal entries is an optional collapsed disclosure below the story. Back to Recaps restores search, filter, scroll and the originating read button’s keyboard focus. Returning from your own draft focuses the reader title. Draft editing and explicit sharing remain separate. List preferences live only in memory per account/campaign, survive in-app navigation/Refresh, and clear on account changes. No new backend rules or data migration are needed.
