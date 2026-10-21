# Completed chapter overview and personal notes

Campaign members open **Chapter overview** in Journal → Completed chapters. It contains only completed chapters explicitly shared by a campaign manager, ordered by their chapter order. It is separate from the DM-only **Chapter Tracker** tab.

## DM recap workflow

In Chapter Tracker, mark the chapter **Completed** and choose **Publish to players** beside **Save draft**. Publish saves current edits and includes the title, summary, chapter order, introduction, recap, illustration and caption in one action. No separate image-publication step is needed. Both introduction and recap are included when different and nonempty; identical text is shown once. Preview and non-private print include both text sections.

The DM editor groups chapter details, player recaps, private preparation, linked entries and milestone approvals into separate sections. Progress shortcuts and search filter the chapter list while preserving its selected editor. See `docs/chapter-tracker-workflow.md` for the preparation and approval workflow.

Completing a chapter does not automatically publish it or change character levels. Private preparation, scenes, objectives, rewards, session notes, connections and milestone approvals remain private. Later saves do not update the shared recap; use **Publish to players** again deliberately.

**Unpublish**, beside Save draft, hides the shared chapter and its illustration while keeping the source chapter, source image and any unsaved edits. Archiving it or returning its status to Planned/Current atomically removes its shared snapshot. Restoring/completing it again does not silently publish it.

## Player notes

Expand a shared chapter to load **Your private notes**. Notes are private to that account; other players, campaign managers and campaign owners cannot read them through the application. Save and reload use revision checks. A conflict keeps the local draft and offers an explicit reload after copying/discarding it.

Filtering and live recap updates preserve note drafts and typing focus. Tab/campaign navigation warns before discarding unsaved notes. Account changes clear the old account's note UI and invalidate late saves. If a chapter is unshared while a player is typing, its public recap disappears and a separate personal draft recovery area allows copying or discarding the unsaved text.

Personal notes are retained when a chapter is unshared, but cannot be fetched or edited while its shared parent is absent. Sharing the same chapter again restores access to that account's previously saved notes. Notes are not copied into shared recaps or the DM's private preparation.

## Data and validation

`campaigns/{campaignId}/playerChapters/{chapterId}` holds a strictly validated snapshot of a completed source chapter. The optional `introduction` field preserves the saved introduction alongside `content` (recap, or introduction fallback). Rules validate it against the source; private preparation fields are never included. Existing publications without it remain valid. `playerChapters/{chapterId}/notes/{uid}` stores at most 8,000 characters, revision and update metadata for that UID. Rules restrict note reads/writes to the current active member/owner's own document and require the chapter to be shared; note collection queries are denied.

```sh
npm --prefix tests run test:campaign-chapters
npm --prefix tests run test:campaign-chapters-rules
```

Browser scenarios exercise deliberate sharing, recap preview/print, ordering, safe text, note save/reopen/conflicts, filter/live-update preservation, unshare recovery, account isolation and mobile/axe accessibility. Emulator checks exercise source secrecy, completed-only publication, stale revisions, denied roles, atomic unsharing, private note ownership/length and membership revocation. Existing character, campaign, NPC, UI and permission regressions remain required.

**Updated Firestore rules are required** for publications containing both introduction and recap. Publish this branch’s complete `firestore.rules` before the frontend release; it also includes #170’s already-merged moderation rules. Storage rules are unchanged. Existing chapters need an explicit Publish to players to refresh text/image snapshots; no migration or automatic release is performed. Hosting previews do not publish them. No production merge, rules publication or deployment is performed by this implementation. One Shots feature work remains paused.
