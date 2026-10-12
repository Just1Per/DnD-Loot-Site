# DM Creatures & NPCs

Campaign owners and active campaign DMs have a dedicated **Creatures & NPCs** tab between World Building and Chapter Tracker, plus a shortcut in DM Tools. Players use the separate **NPC catalogue**, which contains only deliberately revealed Story NPC descriptions.

The tab lists the campaign's existing Story NPCs, monsters, bosses and companions. Search, category filters, archived entries, save/reopen, private tactics, combat statistics and player-description preview retain their existing behavior. **Import SRD creature** and **My Creature Library** are available above the list even before selecting or creating an entry. An import creates an unsaved independent campaign draft; Save keeps it. Finishing a slow campaign-list request preserves an imported draft.

Linked creatures in chapter preparation open this dedicated tab. World Building focuses on setting entries; the top-level Creatures & NPCs tab opens creature preparation. Unsaved-change confirmations apply to these transitions and top-level tab navigation. Leaving the workspace or changing campaigns clears its catalogue dialogs.

## Records and privacy

No data migration is needed. Masters stay at `campaigns/{campaignId}/creatures/{creatureId}`, and their private notes stay in `workspaceSecrets/creature-{creatureId}`. IDs, revisions, world/chapter links, encounter template references and source attribution remain intact. Encounters retain independent combatant HP and conditions.

SRD imports respect campaign editions and preserve licence/source attribution. Personal-template imports preserve the original template and strip campaign-specific links. Editing a personal template preserves existing campaign copies. NPCs are shared only through **Reveal NPC to players** after saving a Story NPC; moving the editor does not reveal records automatically.

The new tab uses the same campaign management checks as World Building and Chapter Tracker. Global DM/admin status grants no extra campaign access. Direct tab navigation and direct workspace rendering are guarded. Existing Firestore permissions remain unchanged and deny player access to masters and private preparation.

## Validation

- `npm --prefix tests run test:workspace-browser`: dedicated tab/shortcut, empty-state imports, slow-list recovery, personal-template independence, save/reopen, cross-tab chapter links, encounter independence, SRD attribution and existing adventure regressions.
- `npm --prefix tests run test:dm-planning` and `test:ui`: DM/player/owner/global-role navigation, dashboard order, responsive layout and existing UI behavior.
- `npm --prefix tests run test:campaign-npcs` and `test:campaign-npcs-rules`: explicit reveal, private-field exclusion, player restrictions, revocation and archive/reclassification.
- `npm --prefix tests test`, `test:workspace` and `node tests/personal-creature-library.test.cjs`: existing engines, UI fixtures and personal template storage.

One Shots feature development remains paused. This delivery includes no production deployment or permission-rule publication.
