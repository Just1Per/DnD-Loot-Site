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
| Named script/data modules | 24 |
| Dynamic UI sites needing expansion/review | 287 |

Counts include repeated templates, hidden controls and artwork. They are **not distinct feature counts or completion percentages**. Static scanning must be followed by per-function review, particularly menus/dialogs built dynamically in JavaScript. No embedded Acrobat code is executed, and no filled character values are published.

The source is MPMB v13.0.4 Printer Friendly with added content. Preserve both existing 2014/2024 rule editions and Artificer sources; Adobe styling must not silently substitute 2014 rules for a 2024 character. Original reference text must identify its edition.

## Rolling milestones

- [ ] Check in reproducible complete control/action/template inventory, with dynamic sites explicitly unreviewed.
- [ ] Generate blank active and optional/template layouts, retaining original attribution and clearing supplied character values/portraits.
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

## Initial publication status

The approved standalone first-page prototype is merged in main. The comprehensive scanner, blank-page exporter and initial field adapter have been started locally. Their code/artifacts will be added as the managed environment recovers; this initial checkpoint records the scope and measured inventory only. A layout match or a registered option is not evidence that all its functions work.

No assistant merge, production deployment, rule deployment or data migration is authorized.
