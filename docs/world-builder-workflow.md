# World Builder workflow

World Building is a campaign-owner/DM workspace for Worlds, Regions, Locations, Factions and Lore. Creatures & NPCs have their own tab. This cleanup changes presentation and browsing; existing entry IDs, revisions, maps, markers, connections and chapter/encounter links remain in their existing records.

## Browsing and preparation

Category shortcuts show counts for active entries, or archived entries when **Show archived** is selected. They synchronize with the sidebar category filter. Search matches titles, summaries, descriptions and related-place/person text. Filtering keeps the selected editor and its unsaved text open.

Player-visibility badges and filters distinguish **Private draft**, **Shared with players** and **Versions differ**. “Versions differ” compares the saved entry revision with the explicitly shared snapshot revision; it does not automatically publish an update. New entries and unsaved edits have a separate editor status. Archived entries show **Archived** and bypass the visibility filter.

Sharing metadata is read from `playerInformation`, with live updates when Firebase subscriptions are available. If that metadata cannot be read, badges show **Sharing unknown** and visibility filtering is disabled. Refresh retries without replacing the editor. Workspace navigation and campaign/account changes invalidate pending reads and subscriptions, and queued callbacks after a permission failure cannot restore stale metadata.

The editor separates:

- **Entry details**: title, category and summary.
- **Description for players**: description plus existing explicit sharing controls.
- **DM preparation**: private notes and related places/people.
- **Private map & markers**: existing image uploads and marker editing.
- **Campaign connections**: existing links to world entries, creatures, chapters and encounters.

Saving retains preparation privately. Sharing publishes only the saved title, summary, description and category through the existing sanitized snapshot transaction. Later saves remain private until explicitly shared again. Archive removes the publication atomically; restore does not republish it.

## Print and permission boundaries

Player-description printing excludes private notes, connections, world maps and marker labels. Selecting **Include private preparation and maps in print** produces the DM copy with that preparation. On-screen preview continues to show only the player description.

World entries, private notes and maps remain DM-only. This delivery adds no collections, schema changes or permission-rule changes. Published descriptions remain restricted to authenticated campaign members. Existing public-information, character and One Shots behavior is retained; One Shots feature work remains paused.

## Validation

`npm --prefix tests run test:campaign-information` covers category/visibility filtering, version changes, description/connection search, retained editor text, failed/queued sharing reads, archive/restore, late navigation, mobile layout, axe accessibility and existing player publication flows.

`test:workspace-browser` verifies saved maps and markers, private/public print behavior, cross-tab links and existing creature/encounter/adventure flows. `test:campaign-information-rules` verifies actual Firestore access and publication boundaries. Existing NPC/chapter browser, character engine/DOM and UI browser checks also run for the shared rendering hooks.
