# Player campaign information

Campaign members can open **Campaign information** from the front page or main navigation. The page searches and filters revealed places, lore and factions, and expands each entry into its complete player-facing description. Text uses the existing parchment/burgundy styling and remains readable on narrow screens.

## DM sharing workflow

In World Building, save an active entry, review its **Player description**, then select **Share with players**. This shares a snapshot of its saved title, summary, category and description. Private notes, maps, markers, connections and arbitrary workspace data are excluded. Updating or previewing the private entry does not automatically update the player page. Use **Update shared version** after saving when the party should see the new version.

**Remove from player information** removes only the shared snapshot. The source world entry and secrets remain. Archiving a world entry atomically removes its shared snapshot; restoring the world entry does not silently share it again. Conflicting saves/publications require a refresh, preserving the editor draft.

The player page subscribes to shared snapshots while open, so updates and removals arrive without a full page reload. Permission failures clear displayed information. Leaving the page, switching campaigns or signing out ends the subscription and discards late responses.

## Data and permissions

`campaigns/{campaignId}/playerInformation/{worldEntryId}` is a separate member-readable collection. Players do not fetch raw private workspace records. Publication transactions read the authoritative saved world record and copy only an explicit field allowlist. Firestore rules enforce that shape, match its text to the saved source, verify source/publication revisions and restrict writes to campaign owners/active DMs. Unrelated accounts, removed members, anonymous users and global admins without campaign membership cannot read it.

This is sharing with authenticated campaign members, not publishing on the open Internet. Images and linked records remain private in this delivery; NPC catalogues and chapter recaps/notes are subsequent backlog items.

## Validation and release

```sh
npm --prefix tests run test:campaign-information
npm --prefix tests run test:campaign-information-rules
```

Browser checks cover explicit sharing, safe player rendering, filtering, live update/removal, revoked-access recovery, mobile/axe accessibility, stale reads and archive/unpublish behavior. Emulator tests cover actual member queries, source secrecy, denied roles, stale revisions, injected fields, archiving and membership revocation. Existing character, workspace, UI and Storage checks remain required.

The included Firestore rules must be reviewed and published with the application release. Preview Hosting automation does not publish database rules. No merge or production deployment is part of this work.
