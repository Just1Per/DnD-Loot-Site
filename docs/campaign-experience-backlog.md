# Campaign experience backlog

This is the proposed delivery order for the campaign experience. Each delivery should have its own reviewable PR. Preserve saved records, existing character behavior and the parchment/burgundy/gold styling. Merge and production deployment require the project owner's approval.

| Priority | Delivery | Status | Acceptance criteria |
| --- | --- | --- | --- |
| P0 | Refresh restoration and save before leaving sheets | Merged PR #99; CI passed | Reload the active campaign, permitted tab and selected character/section or saved DM entry; offer save/discard/stay on sheet exits; retain drafts on save failure and recheck campaign access. |
| P0 | Reported campaign cover upload/display failure | Owner verified production loading after CORS repair | Identify the actual upload/save/read error; verify Storage rules and authenticated-read CORS; preserve member-only image access. Production changes require approval. |
| P0 | DM-customizable campaign front page | Merged PR #89 | Description and campaign information/table rules on the left; large campaign map or intro image at the upper right; readable mobile stacking; DM edit/preview/save; member read access; safe conflict handling. |
| P0 | Campaign cover uploads | Integrated into main by PR #95 and PR #100 | DM file upload, authenticated member reads, immutable replacements, removal and PNG/JPEG/WebP/size checks. Same-file retry, immediate local upload preview, 20-second loading feedback and visible read/save guidance. Prepared CORS repair preserves existing settings; bucket publication and verification remain owner actions. |
| P0 | Inline front-page editor | Integrated into main by PR #95; CI passed | Edit the front page directly without a popup; text on the left, image preview and upload on the right; on-page save/preview/cancel; preserve draft and permission protections. |
| P1 | Player campaign information | Integrated into main by PR #95 | DM explicitly selects World Builder entries to share; members get a deeper campaign guide from a link beneath the front page; private notes and unrevealed records remain inaccessible. |
| P1 | Player NPC catalogue | Integrated into main by PR #95 | Only DM-revealed NPCs appear; searchable names and player-facing descriptions; hidden identities, motives and combat prep stay private. |
| P1 | Player chapter overview and notes | Integrated into main by PR #95 | DM publishes completed chapters deliberately; players see the published recap and can save their own chapter notes; unrevealed chapter plans remain private. |
| P1 | Consolidated DM and player navigation | Navigation and DM workspace merged (#103–#105); character/page-editor follow-ups remain | Player destinations: Home, Journal (campaign guide, known NPCs, completed chapters), My Character (sheet, equipment/loot, saved items), Library. DMs additionally receive one DM Workspace with Overview, World, Creatures & NPCs, Chapters, Party & Loot. Campaign settings/members/invites move to a header action. Preserve records, permission checks, refresh restoration, draft guards and existing styling; One Shots remains paused. |
| P1 | Simple World entry creation | PR #112, pending review | Name and Description first; optional preparation collapsed; preserve categories, records, private notes, images/maps, connections and sharing. |
| P1 | Explanatory archive/restore dialogs | PR #113, pending review | Explain preservation, archived lists, player visibility, restoration and saved draft changes; accessible Cancel/confirm actions. |
| P2 | Shared UI styling consistency | Implemented, pending review | Match buttons, fields, optional sections, uploads and dialogs to the existing palette; test focus, contrast, mobile and print. |
| P2 | Shared character sheet, gear and wishlist | Unfinished local work preserved | Reconcile with full Saved cards/actions from #107; preserve character isolation, active loot target, guards and print. |
| P2 | Page-based item and campaign editors | Unfinished local work preserved | Retain actor/session checks, draft protection and error recovery while moving large forms onto pages. |
| P2 | Dedicated DM Creatures & NPCs tab | Merged PR #96; CI passed | Move creature authoring/catalogue access into a clear dedicated tab while preserving existing records, SRD attribution, personal templates and encounter references. |
| P2 | World Builder cleanup | Merged PR #97; CI passed | Focus on setting, locations, factions and player-facing campaign information; distinguish drafts, shared content and DM secrets; keep existing IDs, links, maps and uploads. |
| P2 | Chapter Tracker cleanup | Merged PR #98; CI passed | Clear chapter preparation, completion, recap and publish actions; separate DM planning from player-visible recap; retain milestone approval and character independence. |
| P3 | Creature & NPC editor cleanup | Merged PR #101 | Story-first NPC preparation and optional combat-stat sections; preserve hidden statistics, boss phases, source attribution, personal templates and encounter snapshots when toggling sections. |
| P3 | Campaign front-page layout preferences | Queued | Offer limited book-style layout/section options after reviewing the current page; preserve the existing default, accessible images and saved text. |
| Paused | One Shots cleanup | Paused by owner | Simplify adventure setup, invitations, host permissions and roster choices; retain the existing isolation of one-shot sheets, gear and combat from campaign records. |

PRs #90–#94 were originally merged into their parent feature branches. Integration PR #95 has since been merged onto `main`. Subsequent deliveries target `main`; review earlier dependent PRs first to keep feature diffs focused. Merge and production deployment continue to require the owner's approval.

## DM-only navigation and paused work

World Building, Creatures & NPCs, Chapter Tracker and One Shots are DM-only authoring tabs. Players use Campaign information, NPC catalogue and Chapter overview instead. Re-evaluate visibility whenever entering a campaign, including transitions from a campaign the user manages to one where they are only a player. Direct tab selection must enforce the same restriction.

Pause all One Shots feature development. Existing records and behavior are retained; run regression checks when shared infrastructure changes, but do not redesign or expand One Shots while paused.

## Front-page follow-ups

- Image-save feedback: keep successful filenames visible, place the required description by the preview and associate validation errors with the field without losing the uploaded draft. Prepared for review; verify the owner's reported save behavior separately from authenticated image-read/CORS configuration.
- Cover uploads are implemented in PR #90, with authenticated member reads and format/size validation.
- Links below the front page open Campaign information, NPC catalogue and Chapter overview in the current review stack.
- Optional campaign layout/section preferences after the first layout is reviewed.

## Public information boundary

“Public” in this backlog means revealed to authenticated campaign members. Publishing on the open Internet is a separate product decision.

Player pages must not read private World Builder, creature or chapter documents and then hide secret fields in the browser. Publish a deliberately selected, sanitized player-facing snapshot into a separately authorized collection. Unpublishing must end member access, and switching campaigns/accounts must discard late asynchronous responses. Test active members, removed members, unrelated campaigns, global administrators and anonymous users against actual Firestore rules.

For NPCs, an encounter or an NPC's existence must not automatically reveal it. For chapters, a completed status must not silently publish a recap or increase character levels. Decide explicitly whether chapter notes are personal or shared; the first version should use personal notes unless the owner requests a shared journal.

## Workspace redesign boundary

Inspect existing workflows and keep the working data model unless a specific change is necessary. A redesigned editor should migrate or adapt old records without deleting them. Starting an editor from scratch does not authorize resetting campaign data.

## Validation for every delivery

Run the relevant browser and Firestore permission checks plus affected existing character/workspace tests. Check DM and player roles, save/reopen, conflict/failure recovery, unsaved navigation, keyboard/axe accessibility and mobile layout. Preserve readable character and workspace print output.
