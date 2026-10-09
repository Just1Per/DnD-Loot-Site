# Connected campaign workspace

Implemented in PR #80 through six staged commits, on top of PR #79. Existing campaign records and character sheets require no migration. The interface retains the parchment/burgundy/gold theme, DM Tools shortcuts and dedicated planning tabs. Help remains manually opened.

## Records and access

All paths below start at `campaigns/{campaignId}/`. Workspace records have immutable IDs, author/timestamps, schema version and incrementing revision. Saves reject stale revisions and retain the draft. Archive preserves references; hard deletion is unavailable.

| Path | Contents | Access |
| --- | --- | --- |
| `worldEntries/{id}` | Worlds, regions, locations, factions, lore, descriptions, map paths and markers | Campaign DMs |
| `creatures/{id}` | Unified Story NPC, Monster, Boss and Companion master cards | Campaign DMs |
| `chapters/{id}` | Ordered chapters, progress, objectives, levels, rewards, notes, links and milestone approvals | Campaign DMs |
| `encounters/{id}` | Scene, combatant snapshots, initiative, individual HP/conditions/concentration and rounds | Campaign DMs |
| `oneShots/{id}` | Hook, progress, target level, creation mode, approved host and participant UIDs | Campaign DMs, proposal author, approved host and invited members |
| `workspaceSecrets/{kind}-{id}` | Private preparation text, stored separately | Campaign DMs; for one-shots only, approved host or unapproved proposal author |
| `oneShots/{id}/participants/{uid}` | Invited/accepted/declined status | DM manages invitations; each member answers their own invitation |
| `oneShots/{id}/characters/{characterId}` | Independent identity and assigned owner | Campaign DM/approved host; accepted assigned owner |
| `oneShots/{id}/characterSheets/{characterId}` | Existing revision-checked full sheet format | Campaign DM/approved host; accepted assigned owner |
| `oneShots/{id}/rosterState/main` | Transactional creation sequence; maximum 20 sheets | Manager or accepted participant, constrained by matching character creation |
| `oneShots/{id}/encounters/{encounterId}` | Private, independently editable encounter copies | Campaign DM/approved host only |

World records, creature masters, chapters and campaign encounters remain private. Player preview and ordinary print are deliberate read-aloud/display tools; this release does not publish a world encyclopedia to player accounts. A DM run-sheet checkbox explicitly includes permitted preparation and statistics in print. Uploaded map images are retrieved with authenticated Storage requests, never persisted public download tokens.

## Shared records and encounter instances

`data.links` stores same-campaign `{kind,id}` references. Transactional saves resolve them inside the captured campaign. Entries show both connected records and incoming references. Renaming a master updates dereferenced labels; archiving retains its ID. Limits are 40 links, 50 map markers and 50 combatants per encounter.

Creature templates contain reusable statistics and source attribution. Adding a creature to an encounter takes an independent snapshot with its template ID/revision and a unique instance ID. Damage, healing, temporary HP, conditions and concentration affect only that instance. Updating statistics from a master is explicit, preserving/clamping current HP. Reset never changes a master or another encounter.

The campaign DM can copy an encounter into a one-shot, including only that encounter's preparation. An approved host runs its private copy without reading campaign encounters or creature masters. The copied state cannot modify the source. Hosts can add homebrew combatants by creating their own adventure encounter; importing additional campaign creatures remains a campaign-DM action.

## One-shot permissions and sheets

An active campaign player can propose an unapproved adventure. The author can edit its preparation until approval, but cannot approve a host or issue invitations. The campaign DM approves a host, sets the target level/creation mode and invites existing members. Hosting grants preparation, combat and roster access for that adventure only. It never changes campaign membership or grants campaign secrets. Revoking the host or active membership immediately ends server-authorized access.

Accepted participants edit their own assigned sheets and can create sheets when Player-created/Mixed mode allows it. Managers can create multiple pre-generated sheets and assign them to accepted participants. Participants cannot accept for others, reassign sheets, change host permissions, widen level limits or set protected DM advancement grants. Creation uses a bounded transactional counter, not a client-only limit.

The existing sheet repository takes an optional `adventureId`; load/save, identity, navigation and equipment use the adventure scope. Character names/classes/levels are edited in the full sheet. Campaign editions and feat policy still apply. One-shot sheets do not become the campaign loot recipient, subscribe to campaign inventory or mutate the main character list. Personal gear remains available. HP, resources, notes and leveling stay separate; no rewards or outcomes automatically carry back to the main campaign.

## Milestones

Completing a chapter records story progress only. The DM explicitly approves a target level per eligible character, retaining approver/time and replacing duplicate acknowledgments. The existing builder still handles actual class levels, HP and feature choices. A target of zero means no milestone. Approval and completion never silently level a sheet.

## Catalogue and uploads

The bundled `data/rules/monsters.json` contains 675 licensed SRD records, with edition/source/licence/attribution/change metadata. The browser fetches it lazily and filters by campaign edition policy. Import creates a modifiable campaign copy; global records stay unchanged. No live external API or global Firestore catalogue is required. `scripts/import-srd-monsters.cjs` rebuilds the file from approved SRD endpoints with resumable local caching. Upstream artwork is excluded.

No Firebase Functions are introduced. The updated Firestore rules need manual publication. Because the deployed Storage rules were absent from the repository, `storage-workspace.rules` is a merge-only fragment, not a replacement or production deployment configuration. Merge its map match/function into existing Storage rules, retaining existing item-image access. Configure bucket GET CORS for the preview/production origins. Immutable uploads are retained when replaced; reviewed storage cleanup is separate.

See [connected-workspace-progress.md](connected-workspace-progress.md) for stage details and reproducible verification commands.
