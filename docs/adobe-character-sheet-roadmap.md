# Complete Adobe character-sheet option

The goal is a selectable Adobe/MPMB presentation of the **same saved character** used by Standard, reproducing the supplied sheet's pages, fields, text and functions. Keep one rules engine and save/revision/access-control path. Do not create a second character or silently import the standalone prototype draft.

This is one ongoing draft PR. Review and test intermediate versions here; full parity is not claimed by the initial visual prototype.

## Source inventory

Static inspection has produced the following counts across the six active pages and twelve named templates (including internal helpers):

| Inventory | Count |
|---|---:|
| Active page widgets | 1,235 |
| Active/template page objects | 18 |
| All widget occurrences | 4,548 |
| Pushbutton occurrences | 567 |
| Widgets with action callbacks | 2,355 |
| Fields in original calculation order | 463 |
| Named script/data modules | 24 |
| Dynamic UI sites needing expansion/review | 287 |

Counts include repeated templates, hidden controls and artwork. They are **not distinct feature counts or completion percentages**. Static scanning must be followed by per-function review, particularly menus/dialogs built dynamically in JavaScript. No embedded Acrobat code is executed, and no filled character values are published.

The source is MPMB v13.0.4 Printer Friendly with added content. Preserve both existing 2014/2024 rule editions and Artificer sources; Adobe styling must not silently substitute 2014 rules for a 2024 character. Original reference text must identify its edition.

## Rolling milestones

- [x] Check in reproducible static control/action/template inventory, with dynamic sites explicitly unreviewed.
- [x] Generate blank active and optional/template layouts, retaining original attribution and clearing supplied character values/portraits.
- [ ] Standard/Adobe selector using shared character identity, data, derived totals, revisions and permissions.
- [ ] Field adapter: raw inputs, computed outputs and validated commands; hidden Standard inputs cannot overwrite Adobe edits.
- [ ] First-page core mechanics and save/reopen/style-switch equivalence.
- [ ] Features, equipment, feats, magic items, background, portrait and notes pages.
- [ ] Spells, companions/familiars, Wild Shape, overflow and adventure logs.
- [ ] Every source button/menu workflow matched to a verified web command or tracked as an unresolved gap.
- [ ] Fill missing shared-engine rules and source-specific class/subclass/feat/item effects.
- [ ] Source/content management, import/export and Acrobat-specific workflow equivalents.
- [ ] Selected-page print, lazy loading, mobile zoom/keyboard/accessibility and large-character overflow.
- [ ] Full parity verification, including editions, levels 1–20, multiclass, source changes, save/reopen, stale-write/access-loss handling and round trips between styles.

## Architecture constraints

The presentation reads common derived outputs and edits through the existing controller. Calculated fields must not develop separate formulas. New narrative data belongs in the shared model and should be visible/preserved in Standard as well. Existing UI choices, protected advancement and role restrictions remain effective in either layout.

Keep the dense paper styling isolated from global app CSS. Load layouts only when the Adobe view/page is opened. Preserve unsaved edits and current page when switching style, and reject invalid edits clearly instead of silently saving an older value.

## Current implementation checkpoint

The committed source inventory is in [adobe-inventory](adobe-inventory/README.md). The reproducible exporter creates six active and eleven user-facing optional layouts under `data/adobe-pages/`; the internal remember template is intentionally excluded. Layouts and artwork load only when requested.

The connected preview adds a Standard/Adobe selector for the same saved character. Initial bindings cover identity, current/temporary HP, inspiration, common ability/save/skill totals and manual training, race/background catalogue choices, death saves, languages/resistances, coins, appearance/personality/organization fields, existing journal entries, selected feats with their shared source/reference descriptions, and the existing private portrait. Shared editors retain their original DOM, handlers and save path. Calculated fields remain read-only; unsupported fields are explicitly unfinished. Raw profile additions are preserved and editable in Standard too.

This is an intermediate foundation, not complete source parity. Automatic training, item effects and computed values come from the existing engine; PDF-specific menus are not a substitute for missing shared rules. Spells, companions, Wild Shape, adventure logs, conditional layouts, full source-button semantics and many per-page bindings remain pending. Opening a related editor does not mean that every PDF menu action has been implemented.

### Verification

- `node --test tests/adobe-field-adapter.cjs tests/character-play-rules.cjs`: 22 passing checks for derived outputs, whitelist validation, limits, protected training, death counters, journal bindings and profile round trips.
- `npm --prefix tests run test:adobe-connected`: functional browser flow for lazy loading, shared editing, style round trips, actual save/reopen, validation and mobile zoom. Browser and PDF tools must be installed; accessibility dependencies use the same optional browser-test setup as existing tests.
- Development browser: Chromium 154. The first connected checkpoint also passed the GitHub Engines and DOM job, including the connected browser/print/accessibility check. New increments must pass their own exact-head checks.

No Firestore or Storage rule changes are included. Existing session access controls and save envelope apply. No assistant merge, production deployment, rule deployment or data migration is authorized.

The first-page print check verifies one page at the source dimensions (approximately 595 × 792 pt) and the character name in extracted PDF text. The final Adobe view passes the selected WCAG A/AA axe rules in Chromium 154. These checks do not establish full keyboard, screen-reader or all-page parity.

A shared armor-training predicate recognizes the existing “All armor” entitlement. This also removes a false untrained-armor warning for legacy Fighter/Paladin characters; Medium-only training still does not grant Heavy armor. The Adobe indicator uses that same predicate.

The scanner also walks the AcroForm tree independently of page widgets, records calculation order and page lifecycle actions, and checks action chains for cycles. The supplied PDF has no unplaced leaf fields or page lifecycle actions. Calculation-order entries may refer to parent field groups rather than individual widgets; both are inventoried. Synthetic PDF tests cover inherited actions, hidden fields, unplaced fields, cycle handling, dynamic menu discovery and omission of filled values/script arguments.
