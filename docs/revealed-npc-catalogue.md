# Revealed NPC catalogue

Players open **NPC catalogue** from the campaign front page or main navigation. It contains only Story NPCs explicitly revealed by a campaign manager. Names, summaries and story descriptions are searchable; entries retain the existing parchment styling and accessible expandable reading layout.

In Creatures & NPCs, save a **Story NPC**, review its story description, and select **Reveal NPC to players**. Later saved changes remain private until **Update shared version** is selected. **Remove from NPC catalogue** keeps the private source. Archiving the entry or changing its type away from Story NPC atomically removes the revealed snapshot; restoring/reclassifying it does not automatically reveal it again.

Only title, summary, story description, category and publication metadata are copied to `campaigns/{campaignId}/playerNPCs/{creatureId}`. Statistics, goals, relationships, hidden tactics, private notes and arbitrary creature data remain in the DM-only source. Player reads never fetch private creature records. Firestore rules verify the snapshot against the saved Story NPC, restrict publication to campaign managers and reject secret/extra fields, stale revisions, cross-campaign access and removed/anonymous accounts.

Private authoring navigation is refreshed on every campaign entry, including a DM-to-player transition. World Building, Chapter Tracker and One Shots remain DM-only. Player NPC and campaign information pages remain distinct from these editors. One Shots feature development is paused; no One Shots implementation or saved adventure data changes in this delivery.

Validation commands:

```sh
npm --prefix tests run test:campaign-npcs
npm --prefix tests run test:campaign-npcs-rules
```

Browser checks cover explicit reveal, excluded secrets, private edits, player navigation/search, escaping, mobile/axe accessibility, unrevealing, revoked access, reclassification/archive and hidden/blocked DM tabs after switching roles. Permission checks use the demo Firebase emulator, including actual player queries and atomic unsharing. The existing campaign information, workspace and character regressions remain required.

This PR is stacked on the player campaign information delivery. Review and publish the included Firestore rules with the approved application release. No merge or production deployment is performed.
