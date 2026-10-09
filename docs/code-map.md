# CampaignAtlas runtime code map

## Startup and shared state

`index.html` loads `js/app.js`, the single module entry point. It imports Firebase and loads the feature scripts in `FEATURE_FILES` order. Those scripts intentionally share a browser scope: rules and stores load before UI adapters, and `ui-auth.js` starts authentication last. Keep that order when adding a module. `ASSET_VERSION` invalidates feature-script caches; the entry-point version in `index.html` must change with a release.

`core.js` owns session state and role helpers. `rootItems` contains global templates; `items` contains campaign copies. `inventory` holds the permitted character ownership entries, while `campaignSupply` contains DM stock/revisions. `campaignLoadGeneration` and captured campaign IDs prevent late reads from replacing a newer campaign's state. Do not combine global catalogue data with private ownership.

Global account roles and campaign membership are independent. `isAdmin()` grants global account/catalogue administration; `isDM()` permits campaign creation. `canManageCampaign()` and `canUseCharacters()` depend on the active campaign's membership. Firestore rules and transactional store checks enforce writes; hiding a button is not authorization.

## Module responsibilities

| Area | Modules | Responsibility |
| --- | --- | --- |
| Accounts and navigation | `ui-auth`, `dashboard`, `data` | Bind existing UI actions, load/create UID profiles, load accessible campaigns, restore the dashboard, clear private state on sign-out. |
| Campaign permissions | `invitations`, `dm-approval`, `admin`, `dm-tools` | Campaign invitations/membership, global DM applications, global account/root management, campaign-only management and bonus advancement. |
| Campaign data and policies | `campaign-store`, `campaign-items`, `campaign-rules`, `campaign-rules-ui` | Transactional loot/stock changes, campaign item copies, edition filtering, campaign feat overrides and custom feats. |
| Connected campaign workspace | `campaign-workspace-store`, `campaign-workspace-ui`, `campaign-creatures`, `campaign-creatures-ui`, `campaign-chapters-ui`, `campaign-encounters`, `campaign-encounters-ui` | Campaign journal, shared masters/references, explicit milestones, independently saved combat state and private/public print modes. |
| One-shot scope | `campaign-one-shots-store`, `campaign-one-shots-ui` | Proposals/approval, invitations, bounded roster transactions, adventure-specific sheet context and private encounter copies. |
| SRD creatures | `campaign-monster-import`, `campaign-monster-catalog-ui` | Normalize approved SRD data, retain licensing metadata, lazily search the local catalogue and make campaign copies. |
| Library | `library`, `library-state`, `catalog-cache`, `images` | Card editors/rendering, filters and lookup maps, versioned root-item caching, lazy artwork resolution. |
| Player records | `player` | Own character lists, saved items and private looted-item views. |
| Character sheet | `character-sheet`, `character-sheet-model`, `character-sheet-store`, `character-build-validation` | Sheet UI/session, normalized data and derived values, revision-checked persistence, actionable incomplete-build notices. |
| Progression and rules | `character-rules`, `character-rules-2024`, `character-progression`, `character-class-progression`, `character-class-feature-choices`, `character-adobe-engine`, `character-backgrounds`, `character-race-catalog` | Supported edition-specific effects, class levels/features, origin choices and derived character statistics. |
| Equipment | `character-equipment`, `character-magic-armor`, `character-magic-items`, `character-equipment-ui`, `character-inventory-ui` | Base equipment, magical AC/effects, worn/attuned choices, owned loot and personal gear. |
| Actions and play | `character-actions`, `character-action-ui`, `character-play-rules`, `character-play-ui`, `character-point-buy-ui` | Attack formulas/picker, supported play resources, rest/slot controls, base-score budget. |
| Feats and catalogue | `character-feat-rules`, `character-feat-reference`, `character-catalog`, `character-catalog-ui`, `character-rules-catalog-store` | Supported feat effects, source descriptions, reference loading/search and structured rules publication. |
| Spells | `character-spellcasting`, `character-spellcasting-ui` | Per-class spell choices/allowances and casting statistics, shared Spellcasting slots and separate Pact Magic slots. |
| Builder and optional pages | `character-adobe-builder-ui`, `character-adobe-pages`, `character-creature-ui` | Class/subclass/feature editors, optional pages, companion/Wild Shape cards and creature choices. |
| Story and presentation | `character-story`, `character-journal-ui`, `character-overview-ui`, `character-sheet-print` | Background writing prompts, portrait/journal entries, compact Overview, read-only paper layouts. |
| Help | `site-help-data`, `site-help` | Explanations and role-guide copy, dynamically restored badges, native-dialog tooltips, optional local guide preferences. |
| Reference data | `character-adobe-data`, `character-background-data`, `character-expanded-background-data`, `character-expanded-race-data`, `character-subclass-data`, `character-expanded-subclass-data`, `character-srd-class-data`, `character-feat-data`, `character-magic-item-data`, `character-creature-data` and its four numbered files | Source/versioned catalogue facts. Keep attribution, identifiers and edition labels when updating them; these are data, not duplicate application code. |

## Persistence and recovery

`createCampaignStore(sdk)` validates IDs, access, quantities and revisions inside mutations. Root templates, campaign copies, supply and character inventory have separate storage responsibilities. Keep stock and ownership updates atomic.

`createCharacterSheetStore(sdk)` saves sheet and character identity together. It rejects a stale sheet revision or an identity changed in another window. The `rulesChoices.grants.__adobe` envelope is retained for existing Firestore rules and saved records. Defaults create fresh nested objects for each character.

`loadCurrentUser()` loads or creates the actual Auth UID profile, then synchronizes the optional discovery directory and rules reference. Directory/reference fallbacks must not deny a valid account. Startup logs `Successfully logged in as <name>` only after the dashboard and guide initialize; errors retain their diagnostic messages. Passwords and account objects are not logged.

`catalog-cache.js` holds a versioned global item snapshot in IndexedDB. Metadata writes share `writeCatalogMetadata()`. Cache/version failures remain recoverable and must not undo a saved item. `images.js` uses in-memory/session URL caching and resolves near-viewport cards; late image results do not update detached cards.

Help preferences are optional per-account/per-guide browser state. `rememberGuide()` handles storage failures without blocking a guide. Badges are not form inputs and their clicks must not toggle surrounding labels or disclosure panels.

## Console output and maintenance

Normal browser startup, rules-publication success and catalogue hit/refresh messages are omitted. Keep actionable error/fallback warnings. Migration, audit and preview-cleanup scripts retain progress, dry-run/write-mode and failure output because those commands are operational tools. Do not run migration scripts as part of routine UI startup or cleanup.

## Verification

From `tests/`, run `npm run test:auth-cleanup` for runtime/account/cache/persistence tests plus the real auth-callback DOM scenarios. `npm test` runs the broader core and DOM suite. Focused scripts cover equipment, forms, campaign policy, spells, print and help. Browser verification should use mocked Firebase data for role changes, editor actions, guide preferences and print without modifying a live campaign.

At the cleanup baseline (main `45e8027`, merged PR #72), the aggregate legacy DOM suite has 11 known scenario failures. Compare failures against that baseline rather than claiming the aggregate suite is green. This cleanup does not change Firestore rules, catalogue records, CSS or printed-page layouts.
