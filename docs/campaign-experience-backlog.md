# Campaign experience backlog

This is the proposed delivery order for the campaign experience. Each delivery should have its own reviewable PR. Preserve saved records, existing character behavior and the parchment/burgundy/gold styling. Merge and production deployment require the project owner's approval.

| Priority | Delivery | Status | Acceptance criteria |
| --- | --- | --- | --- |
| P0 | Audit and restrict shared item catalogue | Audit/report/migration code #119–#121 merged; Hosting deployment succeeded; approved publication list and production migration pending | Inventory root items and artwork, record evidence separately for text and images, preserve reviewed private copies before removing shared records, refresh caches and leave other campaign gear intact. |
| P0 | Premature Overview subclass warning | Merged PR #122; CI passed | Use the same edition-aware unlock level as the subclass picker: class level 3 in 2024, class-specific levels in 2014. Check each multiclass entry independently and retain the working Fix action once eligible. |
| P0 | Refresh restoration and save before leaving sheets | Merged PR #99; CI passed | Reload the active campaign, permitted tab and selected character/section or saved DM entry; offer save/discard/stay on sheet exits; retain drafts on save failure and recheck campaign access. |
| P0 | Reported campaign cover upload/display failure | Owner verified production loading after CORS repair | Identify the actual upload/save/read error; verify Storage rules and authenticated-read CORS; preserve member-only image access. Production changes require approval. |
| P0 | DM-customizable campaign front page | Merged PR #89 | Description and campaign information/table rules on the left; large campaign map or intro image at the upper right; readable mobile stacking; DM edit/preview/save; member read access; safe conflict handling. |
| P0 | Campaign cover uploads | Integrated into main by PR #95 and PR #100 | DM file upload, authenticated member reads, immutable replacements, removal and PNG/JPEG/WebP/size checks. Same-file retry, immediate local upload preview, 20-second loading feedback and visible read/save guidance. Prepared CORS repair preserves existing settings; bucket publication and verification remain owner actions. |
| P0 | Inline front-page editor | Integrated into main by PR #95; CI passed | Edit the front page directly without a popup; text on the left, image preview and upload on the right; on-page save/preview/cancel; preserve draft and permission protections. |
| P1 | Player campaign information | Integrated into main by PR #95 | DM explicitly selects World Builder entries to share; members get a deeper campaign guide from a link beneath the front page; private notes and unrevealed records remain inaccessible. |
| P1 | Player NPC catalogue | Integrated into main by PR #95 | Only DM-revealed NPCs appear; searchable names and player-facing descriptions; hidden identities, motives and combat prep stay private. |
| P1 | Player chapter overview and notes | Integrated into main by PR #95 | DM publishes completed chapters deliberately; players see the published recap and can save their own chapter notes; unrevealed chapter plans remain private. |
| P1 | Consolidated DM and player navigation | Navigation/workspace #103–#105 and character/page integration #117 merged | Player destinations: Home, Journal (campaign guide, known NPCs, completed chapters), My Character (sheet, equipment/loot, saved items), Library. DMs additionally receive one DM Workspace with Overview, World, Creatures & NPCs, Chapters, Party & Loot. Campaign settings/members/invites move to a header action. Preserve records, permission checks, refresh restoration, draft guards and existing styling; One Shots remains paused. |
| P1 | Simple World entry creation | Merged into main (#112) | Name and Description first; optional preparation collapsed; preserve categories, records, private notes, images/maps, connections and sharing. |
| P1 | Custom World entry categories | Merged #123; saved-category visibility fix prepared locally | Choose Custom in Entry type, enter a 1–80 character name, reuse saved campaign categories and filter by them. After saving a new/changed type, select it and clear only filters that would hide the saved entry; name the type in save feedback. Retain standard categories, saved records, draft guards and deliberate player sharing. |
| P1 | Explanatory archive/restore dialogs | Merged into main via #117 | Explain preservation, archived lists, player visibility, restoration and saved draft changes; accessible Cancel/confirm actions. |
| P2 | Shared UI styling consistency | Merged into main via #117 | Match buttons, fields, optional sections, uploads and dialogs to the existing palette; test focus, contrast, mobile and print. |
| P2 | Shared character sheet, gear and wishlist | Merged into main via #117 | Reconcile with full Saved cards/actions from #107; preserve character isolation, active loot target, guards and print. |
| P2 | Page-based item and campaign editors | Merged into main via #117 | Retain actor/session checks, draft protection and error recovery while moving large forms onto pages. |
| P2 | Dedicated DM Creatures & NPCs tab | Merged PR #96; CI passed | Move creature authoring/catalogue access into a clear dedicated tab while preserving existing records, SRD attribution, personal templates and encounter references. |
| P2 | World Builder cleanup | Merged PR #97; CI passed | Focus on setting, locations, factions and player-facing campaign information; distinguish drafts, shared content and DM secrets; keep existing IDs, links, maps and uploads. |
| P2 | Chapter Tracker cleanup | Merged PR #98; CI passed | Clear chapter preparation, completion, recap and publish actions; separate DM planning from player-visible recap; retain milestone approval and character independence. |
| P3 | Creature & NPC editor cleanup | Merged PR #101 | Story-first NPC preparation and optional combat-stat sections; preserve hidden statistics, boss phases, source attribution, personal templates and encounter snapshots when toggling sections. |
| P3 | Campaign front-page layout preferences | Merged into main (#118) | Offer limited book-style layout/section options after reviewing the current page; preserve the existing default, accessible images and saved text. |
| P1 | One Shots cleanup | Resumed under owner’s October 21 instruction to continue the agreed plan | Simplify adventure setup, invitations, host permissions and roster choices; retain the existing isolation of one-shot sheets, gear and combat from campaign records. |

PRs #90–#94 were originally merged into their parent feature branches. Integration PR #95 has since been merged onto `main`. PRs #113–#116 were reviewed and merged into their feature-branch bases after #112 reached main. Their combined changes reached `main` through #117. Book layouts #118, read-only item audit #119, item review #120 and reviewed catalogue implementation #121 have also merged. New deliveries target `main` to avoid further parent-branch merges. Merge and production deployment continue to require the owner’s approval.

## DM-only navigation and paused work

World Building, Creatures & NPCs, Chapter Tracker and One Shots are DM-only authoring tabs. Players use Campaign information, NPC catalogue and Chapter overview instead. Re-evaluate visibility whenever entering a campaign, including transitions from a campaign the user manages to one where they are only a player. Direct tab selection must enforce the same restriction.

The owner’s October 21 continuation resumes One Shots after the World reading and stabilization work. Simplify the existing adventure setup, invitations and independent sheets first; preserve server-enforced host scope and existing records. Earlier delivery notes describing the pause remain historical.

## Front-page follow-ups

- Image-save feedback: keep successful filenames visible, place the required description by the preview and associate validation errors with the field without losing the uploaded draft. Prepared for review; verify the owner's reported save behavior separately from authenticated image-read/CORS configuration.
- Cover uploads are implemented in PR #90, with authenticated member reads and format/size validation.
- Links below the front page open Campaign information, NPC catalogue and Chapter overview in the current review stack.
- Book layouts are implemented in #118: Classic remains standard, with Chronicle, Atlas and Grimoire available from Layout options.

## Public information boundary

“Public” in this backlog means revealed to authenticated campaign members. Publishing on the open Internet is a separate product decision.

Player pages must not read private World Builder, creature or chapter documents and then hide secret fields in the browser. Publish a deliberately selected, sanitized player-facing snapshot into a separately authorized collection. Unpublishing must end member access, and switching campaigns/accounts must discard late asynchronous responses. Test active members, removed members, unrelated campaigns, global administrators and anonymous users against actual Firestore rules.

For NPCs, an encounter or an NPC's existence must not automatically reveal it. For chapters, a completed status must not silently publish a recap or increase character levels. Decide explicitly whether chapter notes are personal or shared; the first version should use personal notes unless the owner requests a shared journal.

## Workspace redesign boundary

Inspect existing workflows and keep the working data model unless a specific change is necessary. A redesigned editor should migrate or adapt old records without deleting them. Starting an editor from scratch does not authorize resetting campaign data.

## Validation for every delivery

Run the relevant browser and Firestore permission checks plus affected existing character/workspace tests. Check DM and player roles, save/reopen, conflict/failure recovery, unsaved navigation, keyboard/axe accessibility and mobile layout. Preserve readable character and workspace print output.

## Reviewed shared item follow-up

The [complete 659-item proposal package](reports/item-catalogue-decisions.md) now supersedes the pilot's limited coverage: 302 replacement proposals (including six licensed SRD renames) and 357 withholding/retirement proposals. The latter include 306 original withholding recommendations, 16 authorship/permission cases, 34 normalized bonus-armor rarity cases and one redundant generic weapon template. Every decision remains unapproved. Full migration-payload compatibility and read-only capture helpers are tested; current production source revisions, target identity and durable backup remain operator prerequisites. See [the exact capture handoff](item-catalogue-operator-handoff.md). The destination ID supplied in chat is stored privately, outside this repository.

The package also has a [self-contained visual review view](item-catalogue-visual-review.md): search all 659 decisions, read proposed replacement text/source/edition, inspect withholding reasons and record/export review notes. Original descriptions and artwork remain outside this downloadable review. Notes do not publish content or authorize a production migration.

The [first replacement batch](reports/item-replacements-batch-01.md) prepares 12 explicit SRD-derived proposals: four healing potions, three bonus longswords, +1/+2 shields, Bag of Holding, Cloak of Protection and Immovable Rod. Pinned source bytes/licence metadata and reference fingerprints are verified; replacements include attribution and no artwork. Ten proposals are 2014 and two are explicitly 2024. Every approval remains false. This is a partial content review, not a production manifest or migration; the other 647 decisions, fresh private snapshot, durable backup and owner review remain outstanding. The normalized +1 chain-mail rarity is flagged for direct official-source checking and excluded from this batch.

The October 16 report covers 659 root items: 331 concept candidates for verified SRD replacements, 22 rename/authorship/permission cases and 306 current editions to withhold without further evidence. These are recommendations, not a production approval list. See [the Danish report](reports/item-catalogue-review-2026-10-16.md) and [the operator migration and access design](reviewed-item-catalogue.md). Private-copy verification, artwork/token retirement, explicit approval markers and cache/import boundaries are merged in #121; the main Hosting deployment succeeded. No production migration or Firestore/Storage rule publication has been performed by this development session; owner-side publication remains unverified. The approved-only frontend can show an empty shared catalogue until approved replacements are published. Next prepare the explicit replacement text, edition/variant, attribution and artwork decisions, then obtain a private snapshot, backup and read-only migration check before proposing production changes. Per the owner's decision, the first pass covers only the shared catalogue and new imports; do not rewrite existing campaign copies, inventories or character gear.

### October 19 notebook and import refinement

The chosen direction is the notebook direction: title and description for World and Chapters, an always-private short DM notes box, and independent image sharing. Hiding a page hides its image too. New categories appear immediately in the top bar. The standalone demo has been retired; the application now implements independent image sharing, covered by `test:player-images`. NPCs and Encounters retain detailed preparation and stat blocks; their player pages never include combat statistics or DM notes.

The actual SRD creature picker now supports checkboxes, selection across filters, select visible, clear selection and importing up to 100 independent private campaign copies at once. Single-entry drafts remain available. Partial failures keep remaining selections for retry; imported NPCs can be changed to Story NPC and their description revealed without their statistics. Current editor drafts are preserved.

The catalogue plan now preserves generated artwork under the owner's October 19 instruction. The 357 retired shared items and their images must be verified in the existing private campaign before removal. Retained images and shared variants remain available. Production migration is still pending.
