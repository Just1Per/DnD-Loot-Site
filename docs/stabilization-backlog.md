# Current stabilization backlog

Order agreed with the owner: stabilize merged behavior, complete UX/code/performance/CI cleanup, then expand One Shots. New test failures take priority over larger features. Each PR describes tests and rules requirements; merges and production changes remain owner actions.

- [x] Confirm #168 reached main (3f4f8aa) with its six passing checks.
- [x] Record owner confirmation that #167 Firestore rules are published.
- [ ] Complete live DM/player testing of World/NPC illustrations, recaps, map/regions, Library, item removal and recoverable campaign removal. Synthetic browser/emulator checks do not establish production behavior.
- [x] Finish post-release loading/retry stabilization: shared World/NPC/chapter states and DM Overview partial-failure recovery (#169 merged).
- [ ] Review #170: deliberate character-note-to-recap drafting and DM moderation of shared player recaps (owner requested October 21). Preserve private character notes and author drafts; test real permission boundaries.
- [ ] Continue consistent navigation, back actions, save/publish feedback and empty states from concrete test findings.
- [ ] Continue compact character-sheet help where repeated controls add clutter; retain section explanations, hover and keyboard access. First delivery merged in #168.
- [ ] Keep header Guide and contextual help current in each feature PR.
- [ ] Review #171: canceled World/NPC editor returns preserve the remembered reader; obsolete reference rendering is removed from the chapter path. Continue cleanup from concrete findings.
- [ ] Measure remaining startup and image-heavy-page bottlenecks. Library CPU/DOM measurements now show the remaining broad-result cost; current follow-up bounds results to 48 cards per page, retaining full-list filtering/counts. See docs/library-result-pages.md. Library snapshots/shared-image concurrency are already merged.
- [ ] Maintain CI clarity and reliability; parallel jobs, early checks, ready-for-review previews and the landscape map test fixture are implemented.
- [ ] Validate One Shot groundwork live, then add participant/invitation/assigned-sheet overview.
- [ ] Clarify One Shot status, completion and archive/reopen behavior.
- [ ] Add remaining One Shot NPC/map/item/loot/recap tools while preserving campaign isolation; finish the complete desktop/mobile flow.
