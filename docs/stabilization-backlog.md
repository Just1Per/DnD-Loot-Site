# Current stabilization backlog

Order agreed with the owner: stabilize merged behavior, complete UX/code/performance/CI cleanup, then expand One Shots. New test failures take priority over larger features. Each PR describes tests and rules requirements; merges and production changes remain owner actions.

- [x] Confirm #168 reached main (3f4f8aa) with its six passing checks.
- [x] Record owner confirmation that #167 Firestore rules are published.
- [ ] Complete live DM/player testing of World/NPC illustrations, recaps, map/regions, Library, item removal and recoverable campaign removal. Synthetic browser/emulator checks do not establish production behavior.
- [ ] Finish post-release loading/retry stabilization: shared World/NPC/chapter states and DM Overview partial-failure recovery (current PR).
- [ ] Add deliberate character-note-to-recap drafting and DM moderation of shared player recaps (owner requested October 21). Preserve private character notes and author drafts; test real permission boundaries.
- [ ] Continue consistent navigation, back actions, save/publish feedback and empty states from concrete test findings.
- [ ] Continue compact character-sheet help where repeated controls add clutter; retain section explanations, hover and keyboard access. First delivery merged in #168.
- [ ] Keep header Guide and contextual help current in each feature PR.
- [ ] Remove obsolete code and consolidate repeated rendering in small, behavior-preserving changes.
- [ ] Measure remaining startup, Library search and image-heavy-page bottlenecks; Library snapshots/shared-image concurrency are already merged.
- [ ] Maintain CI clarity and reliability; parallel jobs, early checks, ready-for-review previews and the landscape map test fixture are implemented.
- [ ] Validate One Shot groundwork live, then add participant/invitation/assigned-sheet overview.
- [ ] Clarify One Shot status, completion and archive/reopen behavior.
- [ ] Add remaining One Shot NPC/map/item/loot/recap tools while preserving campaign isolation; finish the complete desktop/mobile flow.
