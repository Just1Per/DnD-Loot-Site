# Campaign experience backlog

This is the proposed delivery order for the campaign experience. Each delivery should have its own reviewable PR. Preserve saved records, existing character behavior and the parchment/burgundy/gold styling. Merge and production deployment require the project owner's approval.

| Priority | Delivery | Status | Acceptance criteria |
| --- | --- | --- | --- |
| P0 | DM-customizable campaign front page | Draft PR #89 | Description and campaign information/table rules on the left; large campaign map or intro image at the upper right; readable mobile stacking; DM edit/preview/save; member read access; safe conflict handling. |
| P1 | Player campaign information | Next | DM explicitly selects World Builder entries to share; members get a deeper campaign guide from a link beneath the front page; private notes and unrevealed records remain inaccessible. |
| P1 | Player NPC catalogue | Queued | Only DM-revealed NPCs appear; searchable names and player-facing descriptions; hidden identities, motives and combat prep stay private. |
| P1 | Player chapter overview and notes | Queued | DM publishes completed chapters deliberately; players see the published recap and can save their own chapter notes; unrevealed chapter plans remain private. |
| P2 | Dedicated DM Creatures & NPCs tab | Queued | Move creature authoring/catalogue access into a clear dedicated tab while preserving existing records, SRD attribution, personal templates and encounter references. |
| P2 | World Builder cleanup | Queued | Focus on setting, locations, factions and player-facing campaign information; distinguish drafts, shared content and DM secrets; keep existing IDs, links, maps and uploads. |
| P2 | Chapter Tracker cleanup | Queued | Clear chapter preparation, completion, recap and publish actions; separate DM planning from player-visible recap; retain milestone approval and character independence. |
| P2 | One Shots cleanup | Queued | Simplify adventure setup, invitations, host permissions and roster choices; retain the existing isolation of one-shot sheets, gear and combat from campaign records. |

## Front-page follow-ups

- Cover uploads with campaign-member read access, format/size checks and artwork descriptions. PR #89 starts with publicly accessible HTTPS image URLs.
- Links below the front page to Campaign information, NPC catalogue and Chapter overview as those pages are delivered.
- Optional campaign layout/section preferences after the first layout is reviewed.

## Public information boundary

“Public” in this backlog means revealed to authenticated campaign members. Publishing on the open Internet is a separate product decision.

Player pages must not read private World Builder, creature or chapter documents and then hide secret fields in the browser. Publish a deliberately selected, sanitized player-facing snapshot into a separately authorized collection. Unpublishing must end member access, and switching campaigns/accounts must discard late asynchronous responses. Test active members, removed members, unrelated campaigns, global administrators and anonymous users against actual Firestore rules.

For NPCs, an encounter or an NPC's existence must not automatically reveal it. For chapters, a completed status must not silently publish a recap or increase character levels. Decide explicitly whether chapter notes are personal or shared; the first version should use personal notes unless the owner requests a shared journal.

## Workspace redesign boundary

Inspect existing workflows and keep the working data model unless a specific change is necessary. A redesigned editor should migrate or adapt old records without deleting them. Starting an editor from scratch does not authorize resetting campaign data.

## Validation for every delivery

Run the relevant browser and Firestore permission checks plus affected existing character/workspace tests. Check DM and player roles, save/reopen, conflict/failure recovery, unsaved navigation, keyboard/axe accessibility and mobile layout. Preserve readable character and workspace print output.
