# Chapter Tracker workflow

Chapter Tracker remains a campaign-owner/DM workspace, separate from the players' Chapter overview. The cleanup keeps existing chapter IDs, order, progress, preparation, links, milestones and published recap snapshots in their current records.

## Browse and prepare

Chapters are ordered numerically and show their chapter order in the list. **All chapters**, **Planned**, **Current** and **Completed** shortcuts show counts for active entries, or archived entries when **Show archived** is selected. Search includes introductions, recaps, objectives and scenes. Filtering preserves the selected editor and its unsaved text.

New chapters wait for the saved list to load, then suggest the next order after existing entries, including archived chapters, up to the existing limit of 9999. Order remains editable; existing chapters are never renumbered automatically.

The editor separates:

- **Chapter details & progress**: title, order, status and summary.
- **Recap for players**: introduction and chapter recap. Save draft, Publish to players and Unpublish are in the sticky top action bar.
- **Private chapter preparation**: objectives, scenes, rewards, session notes and secrets.
- **Locations, people & encounters**: existing links and grouped preparation references.
- **Milestone approvals**: starting/target levels, approvals and character-sheet actions.

**Prepare encounters** opens the existing encounter workspace, with unsaved-change protection. **Refresh linked entries** refreshes both the preparation groups and connection picker without replacing the chapter editor. Late reads cannot repopulate a closed or different chapter.

## Progress and publication

Saving Completed progress does not publish a recap. Choose **Publish to players** beside Save draft. It saves current edits and releases the title, summary, order, introduction, recap, illustration and caption together. Later Save draft actions remain private until Publish to players is selected again. Unpublish hides the player version without saving or discarding the current draft.

Returning to Planned/Current or archiving atomically removes the shared snapshot. Completing/restoring again does not republish it. Personal player notes remain stored and private, with access only while their chapter is shared. Player preview and default print include both introduction and recap and exclude private preparation.

## Milestone approvals

Approving saves the current chapter edits and one approval for the selected character; the confirmation explains this. Actual levels, class choices, HP and features are applied separately in the character sheet. Approval remains independent of story status and publication.

Characters at/above the target, a target of zero, or an already approved identical target/from-level combination disable repeat approval. Failed saves restore the previous approval while retaining the current editor text for correction/retry. Buttons are not replaced when unrelated text loses focus, so a click after editing reliably registers. Save completion updates button state after releasing the save lock.

## Validation and release

`npm --prefix tests run test:campaign-chapters` covers initial-load numbering, progress/archive filtering, retained drafts, milestone failure/retry and replacement rollback, refreshed links, mobile/axe checks, deliberate publication, private print, unchanged character levels, personal notes, progress unsharing and late reads.

`test:workspace-browser` covers existing linked-entry navigation, milestone approval and encounter/adventure independence. `test:campaign-chapters-rules` verifies actual Firestore publication and personal-note permissions. World/NPC and existing engine/DOM/UI regressions exercise the shared rendering hooks.

No schema migration or permission-rule changes are added. One Shots feature work remains paused. This delivery performs no production merge, rules publication or deployment.
