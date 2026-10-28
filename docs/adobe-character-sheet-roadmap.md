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

The committed source inventory is in [adobe-inventory](adobe-inventory/README.md). The [web function ledger](adobe-inventory/web-bindings.md) distinguishes connected commands, partial editor links and unresolved source workflows. The reproducible exporter creates six active and eleven user-facing optional layouts under `data/adobe-pages/`; the internal remember template is intentionally excluded. Layouts and artwork load only when requested.

The connected preview adds a Standard/Adobe selector for the same saved character. Initial bindings cover identity, current/temporary HP, inspiration, common ability/save/skill totals and manual training, race/background catalogue choices, death saves, languages/resistances, coins, appearance/personality/organization fields, existing journal entries, selected feats with their shared source/reference descriptions, and the existing private portrait. Shared editors retain their original DOM, handlers and save path. Calculated fields remain read-only; unsupported fields are explicitly unfinished. Raw profile additions are preserved and editable in Standard too.

This is an intermediate foundation, not complete source parity. Automatic training, item effects and computed values come from the existing engine; PDF-specific menus are not a substitute for missing shared rules. Spells, companions and Wild Shape are connected in the later checkpoints below. Structured adventure logs, conditional layouts, remaining source-button semantics, whole-sheet print and some per-page bindings are still pending. Opening a related editor does not mean that every PDF menu action has been implemented.

### Verification

- `npm --prefix tests test`: 563 unit checks and 369 DOM checks pass at the latest local checkpoint, including adapter validation, shared rules and regression coverage.
- `npm --prefix tests run test:adobe-connected`: eight functional browser flows for core editing, spells, items, companions, Wild Shape, XP, private companion pictures and natural attacks, with save/reopen, validation and applicable print/accessibility checks. Browser and PDF tools must be installed; accessibility dependencies use the same optional browser-test setup as existing tests.
- Development browser: Chromium 154. The first connected checkpoint also passed the GitHub Engines and DOM job, including the connected browser/print/accessibility check. New increments must pass their own exact-head checks.

No Firestore or Storage rule changes are included. Existing session access controls and save envelope apply. No assistant merge, production deployment, rule deployment or data migration is authorized.

The first-page print check verifies one page at the source dimensions (approximately 595 × 792 pt) and the character name in extracted PDF text. The final Adobe view passes the selected WCAG A/AA axe rules in Chromium 154. These checks do not establish full keyboard, screen-reader or all-page parity.

A shared armor-training predicate recognizes the existing “All armor” entitlement. This also removes a false untrained-armor warning for legacy Fighter/Paladin characters; Medium-only training still does not grant Heavy armor. The Adobe indicator uses that same predicate.

The scanner also walks the AcroForm tree independently of page widgets, records calculation order and page lifecycle actions, and checks action chains for cycles. The supplied PDF has no unplaced leaf fields or page lifecycle actions. Calculation-order entries may refer to parent field groups rather than individual widgets; both are inventoried. Synthetic PDF tests cover inherited actions, hidden fields, unplaced fields, cycle handling, dynamic menu discovery and omission of filled values/script arguments.

### Connected spell-page checkpoint

The spell and continuation templates now show the shared selected spell rows and reference metadata, with separate caster headers for multiclass ability/attack/DC. Prepared choices invoke the existing Wizard controller and enforce its allowance; known/fixed-prepared lists do not gain a new preparation toggle. Ordinary Spellcasting and Pact Magic counts stay separate, including after save/reopen. Full information opens through the existing spell dialog. The same row presentation supplies the current Standard generated table, including invocation ranges, class effects and Beast Spells reminders.

Each template reserves a column-heading row: the first page holds 55 spells and continuation pages 70. Navigation preserves all 150 supported model entries. Generic table-frame artwork is retained from the blank template; source character values and portraits remain excluded. Browser tests use 132 imported spell references to exercise continuation and verify independent Wizard/Warlock values, preparation limits, slot pools, persistence, source-size print, browser Print and mobile accessibility.

This does not complete the source spell-sheet menus or every conditional PDF variant. Automatic grants still follow the existing generator; choosing/generating spells remains available through the shared controls. Spell-row layout customization, source row commands and additional rules parity remain tracked work.

### Owned items and inventory checkpoint

Magic-item slots use carried records from the existing inventory. Their dropdowns arrange those records on the paper; they cannot grant an unowned item. The private `paperMagicOrder` presentation preference is bounded, deduplicated and saved in the existing Adobe metadata envelope. Attunement invokes the existing controller, including ownership and class limits. Rejected commands restore the displayed state without blocking a valid sheet save. Item and feat arrows open the existing information dialogs.

Combined continuation pages show further feats, magic items and equipment; the original overflow template also displays magic slots 6–12, feats 5–8 and limited features 9–16. A hidden-row preference in the supplied filled PDF is cleared for generic inventory layouts so equipment row 51 remains available. Generic attunement-frame artwork is retained without importing source character values. Tool and individual-weapon indicators now read the common class/feat entitlements, including Rogue tools.

Weight uses one shared projection in both views: scoped carried entries plus coins, with unknown item weights made explicit. No carrying-capacity or encumbrance formula is invented for unconnected fields. The original SR/LR feature buttons invoke the shared feature recovery commands; unsupported PDF controls remain visibly unavailable while their mappings are completed.

Browser coverage includes three-slot rejection and recovery, unchanged item ownership/catalogue data, live AC, item ordering and save/reopen, removed-item isolation, equipment row 51, continuation and alternate overflow layouts, source-size print and mobile accessibility. No new Firestore or Storage rules are needed.

### Source printing and combat readouts

Per-annotation print flags hide source UI commands from paper, while data indicators for prepared spells and remaining spell slots remain printable. The browser regression checks real generated PDF content and source dimensions. Manual attacks now appear beside equipped attacks and use the existing derived attack bonuses; damage remains the shared manual text. Feat resource rows join class resources and invoke the existing common resource controls. Both spend and long-rest recovery are verified without a second resource model.

### Connected companion-page checkpoint

The original companion template selects existing companion/familiar cards and edits the same bounded model. Its creature dropdown calls the existing picker and preserves familiar filters. Core identity/size, separate HP, AC, movement, abilities, saves, skills, proficiency, traits and notes are connected. A shared companion projection now supplies both Standard cards and paper readouts, including initiative and passive Perception. Shared-editor updates are recalculated when returning to the paper.

Manual Wild Shape reference cards preserve the existing mental-score, PB and skill inheritance. They are explicitly separate from the Druid’s active Wild Shape engine and its use/HP state. The dedicated Wild Shape template, companion images, source attack-table semantics and other unsupported fields remain pending. Browser coverage checks separate companions, creature filtering, bounded edits, inherited fields, shared-editor visibility, save/reopen, print and mobile accessibility.

### Connected Wild Shape checkpoint

The four-form original template uses the shared Wild Shape engine. A pure `referenceProfile` reuses its calculation path without assuming a form or changing uses, active state, HP, or worn gear. Inactive references explicitly use merged equipment. Modern choices edit the existing known-form list and its allowance; legacy paper preferences only arrange reference IDs and do not confirm that a beast has been seen. Continuation preserves further choices. Transformation, seen confirmation, equipment, temporary HP and return-to-normal commands remain in the existing Companions editor.

The active card reads the actual engine profile and its HP edits call the shared `setHP`: 2014 form HP stays separate and reaching zero ends the form, while 2024 current HP belongs to the normal character. Saves, skill ranks, passive Perception and attack text come from that same engine. Other creature actions, missing hit-die metadata, conditional source menus and complete per-template semantics remain pending. Browser coverage verifies both editions, unchanged resources during references, active HP, known continuation, save/reopen, validation, source printing and mobile accessibility.

### Equipment notes

The large Notes field on the equipment page and each combined continuation is editable. Stable journal IDs preserve separate page notes inside the same bounded journal; they are also accessible in Standard, with descriptive titles and the Items category. General Notes pages omit these reserved equipment entries so writing ordinary notes cannot overwrite equipment-page text. Existing journal size and count limits still apply atomically. Browser coverage checks separate continuation text, ordinary notes, save/reopen and printing.

### Organization symbol

The background symbol frame now opens a collapsed Organization symbol editor in Standard Background. It uses the same MIME validation, resizing and bounded JPEG output as the existing portrait uploader, with a separate private saved image. Removing the symbol preserves the portrait. Both Adobe and Standard print show the symbol; source background PDF tests verify artwork plus both private images, rejected SVG input, removal, isolation and save/reopen. This does not reproduce all original image-menu operations or add companion images.

### Shared XP addition

The source Add Experience button opens a compact Add experience control in the existing progression editor, available when XP mode is explicitly enabled. It updates the ordinary experience field; the existing progression owns level and multiclass calculations. Amount/total limits are validated without making an unapplied amount block sheet saving. Enter activates Add XP, and gaining a level prompts review of class allocation and new choices. Numeric paper fields display the common parsed XP total, including saved values containing thousands separators. Browser coverage checks invalid amounts, overflow, milestone mode, shared multiclass advancement, preservation and save/reopen.

### Companion descriptions and counters

Companion descriptions (height, weight, age, gender, alignment and creature type), additional feature notes and bounded death-save counters are now shared fields. Standard exposes these inside Notes & manual adjustments, preserving the compact card; the original paper fields edit the same card. Loading another catalogue creature restores its catalogue creature type. Descriptions and additional notes do not grant mechanical bonuses.

Standard companion print now reuses `CharacterCompanionCards.project`, removing its separate copies of skill/save calculations. Browser checks verify description/counter isolation, persistence, literal feature text, ordinary character values and printed metadata. Companion images, hit-die data and source attack-table semantics remain unfinished.

### Private companion pictures

Each companion now has its own bounded private picture, editable from the original paper frame or inside its collapsed Standard adjustments. It reuses the character portrait validator/resizer. The two overlapping source image controls share one accessible web surface. Upload completion verifies the original card/session still exists, so removal/reordering cannot attach a late file to a different creature. Both print styles include the picture.

The store exposes a non-mutating estimate of its persisted UTF-8 data, excluding the duplicate runtime Adobe alias. All shared image uploads check that budget before changing a picture, retaining space below Firestore’s document ceiling. Oversized candidates leave existing data intact. No image upload to public Storage or rule change is introduced. Tests cover independent pictures, removal, rejected SVG, save/reopen, generated PDF images, late completion and budgeting.

### Saved creature lookup and hit dice

The shared creature catalogue now resolves stored display names as well as IDs. This fixes the source dropdown appearing empty after choosing/saving a creature, missing catalogue senses, and clearing valid creatures on companion-role changes. Names match without incidental case/whitespace differences.

Companion hit-die count and die come from the selected creature’s actual catalogue metadata through the common projection. A separate bounded used counter persists on that companion; loading another catalogue creature resets it with its other fresh statistics. Standard adjustments and print use the same values. No hit dice are inferred from HP, and this change does not implement automatic dice rolling/healing or rest recovery. Browser tests cover saved selection, senses, role changes, real catalogue dice and used-counter persistence.

### Shared base-creature combat and training

The earlier compact creature data omitted source attack modifiers and full skill/save/trait information. A reproducible literal-only parser now supplements the 127 existing creatures from the supplied PDF, validating unchanged base attack facts before writing. It never executes PDF scripts, callbacks or expression strings; synthetic tests verify this. The browser does not load the parser or its build-time dependency.

One `CharacterCompanionRules` module supplies Standard cards, Adobe fields and print: natural to-hit/damage, fixed-damage exceptions, explicit save DCs and saved per-card paper attack selections. Creature selection fills its actual skill/save training, full trait text, alignment, languages and vulnerabilities. It retains genuine manual attack notes and avoids printing old auto-generated attack text twice. Familiar action restrictions remain tied to the summoning feature; printed conditional DCs and effects remain source references.

Validation covers all 127 base creatures and 168 attacks, owl/cat fixed damage, wolf scaling, mephit DC modifiers, source information arrows, training, metadata fidelity, paper selections, save/reopen and both print views. The source catalogue is identified as 2014; the character’s selected edition is unchanged.

### Connected Adventure Log checkpoint

The ALlog template uses six entries per page, up to 120 private records in the existing Adobe metadata envelope. Original hidden start/total controls are restored at their original coordinates. The first opening balance is editable; later starts and totals carry forward through all pages. As in the source calculation, unused gains hide their total and later starts appear only when the current/previous entry has a gain. Gold accounting uses integer hundredths to avoid decimal drift. Other balances use whole numbers. Signed spending and comma decimals are supported; executable/formula input is rejected.

Standard Notes contains a collapsed, lazily rendered Adventure Log editor for the same records. Source entry arrows open that exact entry. Both styles save together and Standard Notes print includes escaped log records; Adobe Print page retains original dimensions. Invalid edits stay visible and block saving/navigation until corrected. Expanding an early note cannot silently truncate a later note when the 100,000-character log budget is full.

The log is a private record, separate from campaign Journal/recaps. It does not award character XP, coins or owned items. Original expression syntax, insert/reorder/duplicate/delete menus, explicit character-transfer actions and remaining conditional options are still pending; opening the shared editor is not full original popup parity. No Firebase rule changes or migration.

### Adventure Log entry operations

The shared editor now moves complete entries earlier/later, inserts blanks, duplicates, clears in place and removes/shifts records. Opening balances stay global and later balances recalculate. Clear/remove use the existing accessible confirmation dialog; its session/log/index guard prevents an old confirmation modifying a replaced sheet. Row and note-space limits reject an operation atomically. Copying an entry repeats its recorded rewards only inside the log. Editing a field no longer replaces the editor DOM on blur, so a pending edit does not consume the next command click.

Original expression syntax, other log menu variants and explicit XP/treasure transfer remain pending. These entry operations do not change character XP, coins, inventory or campaign recaps.

### Connected multi-page printing

Print connected pages snapshots the existing character, identity and scoped inventory, then renders blank source layouts with the same field adapter and shared engine. It includes five base layouts, populated combined equipment/feat/item continuations, ordinary notes, each caster’s spell ranges, recorded companions, Druid references and Adventure Log pages. The 2014 reference remains optional through the existing Rules-page flag. Per-caster headers preserve their casting statistics and ordinary/Pact slot pools. No page or character state is changed by preparing the batch.

A pure plan validates counts and fails explicitly above 400 pages. Generation/session/auth guards cancel abandoned asynchronous preparations; images decode before printing, and afterprint removes the temporary DOM. Original print flags continue to omit UI-only controls. The regression inspects an actual 15-page PDF, including last continuation content and source dimensions, private picture nodes, Wizard/Warlock slot separation, stable data/page, invalid inputs and closing the sheet while a page is loading.

This adds connected-page batch printing, not complete source print parity. Long text remains inside original fixed-size fields and can clip; the control and Guide disclose this. Automatic text overflow, other conditional variants and remaining source customization are still pending. No new Firebase rules, uploads or production changes.

### Long text in connected printing

Connected printing now measures text at actual print dimensions in a temporary, inaccessible offscreen layout. Fields that cannot contain their text show a numbered reference; original Notes template pages carry the complete text, not only a clipped prefix. Short records share columns; longer records continue with a repeated heading. Text stays at a readable size. The split preserves whitespace and grapheme boundaries and uses textContent for literal user text. There is no character-data mutation. Static column headings are not archived as character prose, and printed spell footer text describes the pools without web-control instructions.

The400-page limit also covers added notes and fails explicitly. A session closed while the continuation template loads removes the measured private DOM and cancels printing. Browser coverage checks every one of3,700 distinct history/feature/note tokens in a real PDF, fitting continuation columns, literal HTML and Danish text, unchanged data/page and cleanup. Print page/native single-page printing intentionally retains the original fixed page; Print connected pages supplies complete long-text continuations. Remaining original print-menu/conditional variants are still tracked separately.
