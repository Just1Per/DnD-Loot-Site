# Account notifications — v98

The signed-in header has a bell at the far right. It opens a parchment panel with All/Unread filters, timestamps, a live unread badge, Mark read, Dismiss, Mark all as read, Clear read and Refresh. Dismissal affects only the notification display; it never deletes notes, returns loot, declines invitations or reviews applications. Escape, outside-click dismissal, focus return, explicit Tab wrapping and narrow-screen layouts are supported. Notifications are excluded from character-sheet printing.

## First-release sources

- Changed **saved DM notes** on a campaign or adventure character: open a freshly loaded private sheet and reveal its DM-notes panel. Ordinary saves with unchanged DM notes create no event. Repeated note edits coalesce into the latest notification for that character.
- **DM-assigned loot and transfers**: notify the receiving character's player and open the sheet inventory. Claims, consumption, unloot and the actor's own assignments do not notify them.
- **Pending campaign invitations**: live email and UID queries deduplicate the same invitation; opening it uses the dashboard's existing accept/decline flow. Acceptance, decline and cancellation remove it from the feed.
- **Global DM-creation applications**: applicants see their current reviewed outcome; website admins additionally see the current pending review queue. This preserves the distinction between global DM creation and campaign-specific DM membership. Reviewing remains an explicit action in Admin. Opening a reviewed outcome reloads both the decision and the account capabilities, so a newly approved creator can use New Campaign immediately.

Campaign and character context are shown on each applicable row. Activity is collected across the account's campaigns, including assigned adventure sheets. The feed watches small event metadata, not complete private sheets or the magical-item catalogue. Each owned character contributes up to 20 recent events; the panel displays the 100 newest visible notifications. Existing pending invitations and application decisions appear immediately. Historical note/loot changes are not backfilled.

## Storage and permission boundaries

New note/loot events are immutable reference documents in `campaigns/{campaignId}/characterNotifications/{characterId}/entries/{eventId}`. Adventure notes use `campaigns/{campaignId}/oneShots/{adventureId}/characterNotifications/{characterId}/entries/{eventId}`. They contain only kind, source ID, source version, actor UID, timestamp and quantity. DM prose and inventory item descriptions are never copied into events.

Events are created in the same transaction as the source mutation. Rules require the actual note-text change or positive inventory delta and matching source version/timestamp; a DM cannot create a detached event about an unchanged source. Event updates/deletes and player-forged events are denied. Event lists require the live campaign and the current character owner (or its permitted campaign DM/adventure manager). Adventure players also need accepted participation. Other players and unrelated global admins cannot read the events. Archive, owner reassignment, membership/participation revocation, host changes and campaign deletion remove applicable player access. Source listeners are stopped and rows removed when scope ends; late callbacks and account changes are guarded.

Read/dismiss state lives separately under `users/{uid}/notificationState/{sourceKey}`. Only that exact account can get or change it, including when the caller is a global admin. Transactions merge concurrent device updates. Each source retains up to 200 read IDs and 200 dismissed IDs; those flags contain no note or item text. Other devices receive updates through snapshots. Source records remain untouched. Older immutable events are retained; future backend retention/cleanup is a separate reviewed task.

Opening a notification rechecks its source and uses the existing navigation/unsaved-edit guards. Cancellation leaves the notification unread and retains the draft. Typing or changing views during a slow source lookup cancels that pending navigation. A DM-note notification waits for the paper’s initial navigation before focusing the notes input. It reloads saved notes after those guards; it never overwrites an open player's draft just because an event arrives. Failures are shown in the panel with Refresh, rather than claiming the account has no activity.

## Rollout

Publish this PR's **Firestore rules** before releasing the frontend:

`firebase deploy --only firestore:rules --project dnd-loot-site`

Then merge/release and reload the website for both DM and player accounts. No Storage rules, indexes, Cloud Functions, production migration, public image URLs, browser push permission or third-party notification service is needed. No production rules deployment or live data mutation is performed by preparing this PR.

This applies to the in-app bell. The separate [invitation email backend](invitation-email-setup.md) is disabled by default and has its own manual Functions/provider activation. Only new campaign invitations can send email after activation; the bell's DM notes, loot and application sources are not wired to email.

The frontend probes its own read-state path before enabling transactional event creation. With older rules, existing character, loot, invitation and approval actions continue using their existing paths; the panel reports unavailable synchronization and offers Refresh. Upgraded clients start generating note/loot notifications after the new rules are available. Refresh/reload after publishing rules enables that capability.

## Regression coverage

`tests/account-notifications.cjs` covers source discovery, deduplication/coalescing, state synchronization, source mutation behavior, authority changes and stale callbacks. `tests/account-notifications-rules.cjs` exercises real Firestore rules for atomic source-bound events, ordinary inventory/stock behavior, independent adventure scope, private state, forgery, role boundaries and revocation/deletion. `tests/account-notifications-browser.cjs` exercises the header and full navigation/state flows, private text separation, existing invitation/application controls, unsaved drafts, multiple accounts, mobile layout, keyboard and WCAG. The browser fixture accepts a dependency hook before module initialization so subscribed SDK functions are realistic and testable.
