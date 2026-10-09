# Phase 3 architecture: campaign world, chapters and one-shots

Status: proposed implementation architecture. This delivery adds informational DM Tools cards and guides, not persistent editors. It introduces no Firestore collections or security-rule changes.

## User flow

DM Tools presents Item Controls, World Building, Chapter Tracker and One Shots in one responsive row. Each new card explains the purpose and expands into a practical guide. Future editors open inside the campaign workspace, with clear save/cancel, unsaved-change protection and a return to DM Tools. Player access to published lore and assigned one-shots belongs in the player workspace, not the DM Tools tab.

Start with the campaign’s world introduction. Add the first locations and NPCs, organize chapters around them, then attach optional side missions or one-shots. Links point to shared entries rather than copying their descriptions. An archived entry retains its ID and displays an archived reference; it is not silently deleted.

## Storage boundaries

All paths below start at `campaigns/{campaignId}/`. Documents include `schemaVersion`, `revision`, `createdBy`, `createdAt`, `updatedBy` and `updatedAt`. Mutations capture campaign ID/account ID, validate access and reject stale revisions.

| Path | Purpose and suggested fields | Access |
| --- | --- | --- |
| `worldEntries/{entryId}` | Type (world, region, location, NPC, faction), title, summary, player description, parent ID, tags, same-campaign links, publication/archive status | Campaign DMs edit; active members read explicitly published entries |
| `worldSecrets/{entryId}` | Hidden motives, encounter plans, unrevealed history and private notes | Campaign DMs only |
| `chapters/{chapterId}` | Title, order key, planned/active/completed status, player recap, links and publication/archive status | Campaign DMs edit; members read published recaps |
| `chapterPrep/{chapterId}` | Objectives, scene order, private notes, expected starting level, optional target-level milestone, explicit awarded-character acknowledgments | Campaign DMs only |
| `adventures/{adventureId}` | One-shot/side-mission type, title, player hook, level, player count, duration, linked chapter/world IDs, draft/ready/running/completed/archive status | Campaign DMs and approved host edit; accepted participants read safe metadata |
| `adventurePrep/{adventureId}` | Scenes, encounters, rewards and private run notes | Campaign DMs and that adventure’s approved host only |
| `adventures/{adventureId}/participants/{uid}` | Invitation/acceptance status, player/host role, assigned character IDs | Campaign DMs/approved host manage; a player reads/accepts only their own invitation |
| `adventures/{adventureId}/characters/{characterId}` | Display identity, createdBy, optional assigned owner UID and pre-generated/player-built origin | Campaign DMs/approved host manage roster; assigned owner reads their identity |
| `adventures/{adventureId}/characterSheets/{characterId}` | Existing serialized sheet envelope and revision | Campaign DMs/approved host and assigned owner, with active campaign membership and adventure access |

Separate secret documents are mandatory: hiding fields in the UI does not stop a Firestore reader from seeing them. Do not publish secret titles or snippets through search, parent summaries or link previews. Player queries must include the published/access filters required by rules. Do not implement public internet sharing as part of this feature.

Every linked record must belong to the same campaign. Reject invalid/cross-campaign IDs and limit content size, link count, scene count and roster size. Render user text as escaped text, not arbitrary HTML. Derive author/account IDs from authentication and keep ownership changes restricted. Archiving, publication and permission changes have explicit transactions; conflict recovery retains the unsaved draft.

## Permissions and delegated hosting

Reuse active campaign membership, not the global account role. A global admin or global DM account receives no campaign secrets without campaign DM membership.

The campaign DM can create an adventure or enable player proposals. An enabled player proposal is a private draft accessible to its author and campaign DMs. It cannot publish campaign material, appoint hosts or issue invitations until approved. The DM approves a host in an adventure-specific permission record. A host can prepare and run that adventure, invite existing campaign players and manage its roster. Hosting never promotes the player to campaign DM and grants no `worldSecrets`, `chapterPrep`, campaign stock or other adventure access.

Accepted players edit only their own assigned sheets. They cannot change owner UID, host role, participant permissions, campaign edition policy or DM grants. The host cannot turn an invitation into acceptance on behalf of the player. Removing membership or hosting immediately ends the corresponding private access; the saved records remain intact.

This can use the existing browser/Firebase SDK approach with explicit Firestore rules and transactions. No Firebase Functions are introduced. Any future action requiring trusted background processing needs a separate design.

## Character-sheet integration

Introduce a CharacterContext/repository boundary before enabling the one-shot roster: scope (`campaign`, `personal`, `adventure`), campaign ID when applicable, adventure ID when applicable, character ID and owner ID. Storage, access, inventory, rules, sheet navigation and print must all use this context. Changing only sheet document paths would leave campaign globals and inventory leaking into the one-shot.

A DM or approved host can create multiple pre-generated sheets without assigning them immediately. Assignment to an accepted participant is an explicit, revision-checked operation. Support a mixed roster: some pre-generated sheets and some sheets created by invited players. Character creation policy defines allowed mode, target level and sheet limits. It inherits campaign editions and feat availability and can narrow them, never widen them without the campaign DM changing the campaign policy.

Keep one-shot HP, resources, gear, notes and advancement separate from main campaign characters. A future “use my character” option takes an explicit snapshot into an adventure sheet, retaining source ID/revision for reference; it must not edit the source or copy campaign loot ownership. Importing a personal character requires the personal-character repository proposed with PR #74; the initial one-shot roster can begin with new sheets. Do not enforce the main campaign’s ten-active-character limit on an unrelated adventure roster; define and validate a separate limit.

One-shot sheets must not become the selected main-campaign loot recipient. Campaign loot cannot be claimed through an adventure sheet; one-shot gear/rewards use adventure-scoped records. At completion, the host proposes an outcome and any rewards. Only the campaign DM approves story changes or creates campaign rewards through existing supply/ownership transactions. Never automatically merge loot, levels or depleted resources into the main campaign.

## Chapters and milestone leveling

Chapters have independent story status and milestone status. Completion records a recap; it does not modify character sheets. A milestone stores its intended target level and the eligible character IDs. The DM reviews each character and applies earned class levels through the existing builder. Store an acknowledgment per character so a repeat click does not award the same milestone again. Multiclass choices, subclasses, HP and feature choices remain explicit player/DM decisions in the sheet.

World entries and adventures link to chapters, but archiving/completing a chapter never deletes those records or advances unrelated characters. Support a chapter without a level-up and multiple chapters at the same level.

## Delivery and verification gates

1. World storage adapter, real security rules and world editor; migration-free additive collections. Test save/reopen, revisions, secrets/publication, archived links and campaign switching.
2. Chapter storage/editor with stable ordering and milestone acknowledgments. Test empty chapters, reordering, partial milestone application and repeated completion.
3. Adventure permissions/editor and invitations before character creation. Test proposal approval, accepted/declined invitations, host revocation, removed members and another campaign/adventure.
4. Context-aware sheet repository and isolated roster/equipment. Test multiple pre-generated sheets, player-owned builds, assignment conflicts, policy restrictions, no cross-roster reads and no main-sheet/loot mutations.
5. Linked navigation, player views, search, mobile/keyboard help and printable world/chapter/one-shot run sheets. Include only explicitly selected, permitted records in exports.

Run Firebase emulator permission tests as each collection is introduced. Test owner, campaign DM, participant, host, spectator, unrelated/global admin, removed member and revoked host. Verify real browser save/error/unsaved-change flows and mobile/print layouts. Preserve existing character paths and catalogue data until any migration is separately reviewed and verified.
