# Campaign front page

Campaigns open on **Campaign home**, a member-facing introduction using the existing parchment, burgundy and gold palette. The Library, character sheets and DM workspaces remain available through their existing tabs and the home page’s shortcuts.

Campaign owners and active campaign DMs can select **Edit front page**, either from Campaign home or Campaign Settings in DM Tools. The editor saves a tagline, introduction, table expectations, optional HTTPS cover-image URL, accessible image description and artwork credit. Preview shows the current draft; cancelling a changed draft asks before discarding it. Existing campaigns use their description until an introduction is saved.

All front-page text is visible to campaign members. DM secrets remain in the separate private world/chapter/encounter workspace. Images are supplied by URL in this first version; file uploads are a follow-up. Use publicly accessible artwork, rather than private world-map URLs. Failed cover images fall back to the readable introduction.

## Persistence and permission checks

`campaigns/{campaignId}.frontPage` stores the fields and a monotonic revision. A transaction checks the expected revision and updates only the front page plus `updatedAt`. Concurrent updates retain the editor draft and report the conflict. Changing campaign/account during the transaction invalidates the captured session. Players, removed members, unrelated DMs and global administrators without campaign access cannot edit.

The Firestore rules add `frontPage` to the permitted settings fields and enforce the data shape, field lengths, HTTPS image URL, nonempty image description when a cover is set, and the next revision. Existing ownership and campaign-settings restrictions remain in force.

## Validation

From the repository root:

```sh
npm --prefix tests run test:campaign-home
npm --prefix tests run test:campaign-home-rules
```

The browser tests use mocked Firebase data and verify save/reopen, preview, escaping, draft cancellation, conflict/permission failure recovery, in-flight campaign changes, player access, navigation, mobile layout and axe accessibility. The permission tests run against `demo-vault-test`, never production. The existing campaign workspace CI runs both checks.

## Release requirement

The new save operation requires the updated `firestore.rules`. Review and publish those rules to the intended Firebase project together with the application release through the existing manual approval process. Hosting preview automation does not publish Firestore rules. No production deployment or rules publication is part of this implementation.

## Follow-up backlog

1. Campaign cover uploads with member-readable Storage permissions and image-size/type checks.
2. Separate saved drafts from the member-visible introduction, if DMs need an explicit publish step.
3. Curated player-visible chapter recaps and world links, preserving the private workspace boundary.
4. Extend monster/NPC catalogue discovery and personal templates already present on main, rather than duplicating their storage or editors.
