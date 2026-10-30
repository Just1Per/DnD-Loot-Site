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

- `npm --prefix tests test`: 611 unit checks and 369 DOM checks pass at the latest local checkpoint, including adapter validation, shared rules and regression coverage.
- `npm --prefix tests run test:adobe-connected`: twenty-eight functional browser flows covering core editing, spells, items, companions, Wild Shape, XP, private pictures, natural attacks, logs, complete printing, paper actions/ammunition, AC/secondary DC, hit dice and typed equipment, with save/reopen, validation and applicable print/accessibility checks. Browser and PDF tools must be installed; accessibility dependencies use the same optional browser-test setup as existing tests.
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

When XP mode is explicitly enabled, the source Add Experience text field accepts an amount directly on the first page. Enter or its button applies it through the same controller as the Standard Add experience control, without opening an editor. With no pending amount, the paper button opens the shared progression controls. It updates the ordinary experience field; the existing progression owns level and multiclass calculations. Amount/total limits are validated without making an unapplied amount block sheet saving. Enter activates Add XP, and gaining a level prompts review of class allocation and new choices. Numeric paper fields display the common parsed XP total, including saved values containing thousands separators. Browser coverage checks invalid amounts, overflow, milestone mode, shared multiclass advancement, preservation and save/reopen.

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

The 400-page limit also covers added notes and fails explicitly. A session closed while the continuation template loads removes the measured private DOM and cancels printing. Browser coverage checks every one of 3,700 distinct history/feature/note tokens in a real PDF, fitting continuation columns, literal HTML and Danish text, unchanged data/page and cleanup. Print page/native single-page printing intentionally retains the original fixed page; Print connected pages supplies complete long-text continuations. Remaining original print-menu/conditional variants are still tracked separately.

### Original Notes options

Notes.Options now opens an accessible menu for the current notes page. Left/right writing lines are independent private preferences, normalized to 150 page indices and stored in the existing Adobe envelope. Source mask geometry is exported from the original hidden Whiteout fields without any filled values. White masks sit above the blank art and below text; active note fields and connected print pages use the same preference. Defaults retain lines. More notes uses existing bounded navigation; Open Journal uses the shared editor. Destructive hide/remove-page commands remain pending. Dialog state is guarded against changed sessions/pages and removed on sheet close.

### Actions and ammunition checkpoint

Source Action, Bonus Action and Reaction now have twelve private reminder rows each. Their row menus mirror moves, opposing overflow columns, insertion, deletion and clearing without dropping occupied rows. Standard Combat exposes the same collapsed editor. Automatic class/spell insertion into these reminders is not yet implemented.

Both original ammunition trackers keep remaining and loaded counts, source-specific 8/10/20/50 positions and the original static glyphs. Reload loads from remaining ammunition and never grants gear or changes owned inventory quantities. Hidden source variants are exported as blank geometry and shown by the shared tracker projection; no Acrobat scripts run. Both print styles include the state, and populated action overflow selects its source page without repeating other lists.

### Armor components and second DC checkpoint

The original AC readouts now show additive components from the same selected armor formula as the character total, including class/racial natural armor. Armor selection uses actual carried gear through the existing equipment controller. Components cannot grant a separate paper AC or bypass ownership/attunement.

The original Show/Hide 2nd DC control switches its original single/dual selector geometry and static glyph. Its independent secondary ability and bounded extra adjustment use the shared casting-stat calculation and persist with the private character. Toggling a displayed ability DC never changes a caster profile’s actual casting ability. Source and Standard printing include the second DC.

### Character hit-dice pools

Used counters now follow actual capped class levels grouped by die size; saved spent values remain keyed to the die when class order or levels change. Standard Combat shows all active pools. The original three paper rows remain, with a complete notes continuation when a fourth die size is active.

Long Rest recovery is explicit and edition-aware: 2014 permits an allocation up to half the total dice, rounded down (minimum one); 2024 recovers all spent dice. Counters and recovery do not heal HP, restore spell slots, change feature uses, award XP or touch inventory. The existing rest buttons continue to identify their own scope.

### Typed equipment names

Original armor, shield and five attack name fields now accept typed names with native suggestions. Known +1/+2/+3 names use the common parser and equipment engine. Existing owned items are reused; otherwise the explicit edit adds and equips personal gear without spending coins or changing shared stock/catalogue. Explicit item mechanics take priority over names. Unsupported names fail visibly without adding equipment.

Paper attack placement stores stable references rather than copied bonuses; proficiency and ability choices use the shared controllers. Clearing a paper row retains its gear. Deleted references display unavailable. Rendering and printing never assign IDs or change character data. The Guide documents these behaviors. Original attack menus and broader source-rule parity remain unfinished.

### Original attack-row options

The first-page PF attack arrows now open native accessible menus for moving complete references, inserting blanks, clearing/deleting paper rows, displaying common engine values and copying recognized weapon references to personal Backpack. Deleting/clearing a paper row retains actual gear and shared Combat references. Full rows and full inventory reject atomically; spells/non-weapons cannot create physical gear. Existing owned weapons are not duplicated. Copying never equips, spends coins or changes campaign stock.

Explicit Active gear/Backpack column choices now survive model normalization and saving; the previous normalizer dropped this UI choice. Source and Standard continue to use the same private gear records and save path.

### Shared limited-feature counters

Editable paper Used cells now use the same bounded class/feat setters as Standard Combat. Maximum and recovery remain calculated. Counters do not roll, heal, cast or change spell slots. Arcane Recovery, Wild Shape and Channel Divinity retain their dedicated related-effect workflows. Earlier spent counts remain readable after class/level reduction; Standard Undo can still reduce those counts. Original row arrangement menus and custom item-charge recovery remain pending.

### Original Limited Feature row menus

The original sixteen PF feature rows now arrange stable class/feat references across the eight-row first/overflow boundary. Clearing/deleting hides only the paper reference; actual grants, spent counters and Standard Combat remain intact. Restore automatic rows resets only paper order/visibility. Untouched automatic spaces still accept newly granted features. Full insertions fail without dropping a row.

Connected printing now includes resource overflow and action overflow together on one original combat overflow layout, without repeating the item/feat lists. Pool state remains read from the common engine, and printing never rewrites the paper arrangement.


### Private item-use and charge counters

Supported owned inventory rows now project a shared private counter into Standard Combat and the original Limited Feature rows. The imported metadata contains 76 named literal definitions from the supplied 2014 reference; 16 computed, ambiguous or unsupported entries are excluded rather than guessed. Static extraction never executes Acrobat callbacks. Future edition-specific item references remain separate work.

Existing inventory starts with an unknown remaining amount. The player explicitly records the current amount before using a counter. A stack does not multiply capacity; separately tracked copies need separate inventory rows. Charges/uses require integers; durations are converted to minutes in six-second rounds. Used, Use and Undo preserve the inventory and never spend campaign stock, coins, HP or spell slots.

Dawn on the source paper opens eligible item recovery. Shared controls also offer item-only Short/Long Rest recovery. Full recharge and partial rolled/manual amounts are separate, validated operations; entering a partial roll never restores the whole pool. A stale or canceled dialog changes nothing. Removing/renaming an inventory row retains its spent record; unavailable counters can be explicitly forgotten to free private ledger space.

Both print styles include the counters. Source rows beyond sixteen continue on complete read-only notes pages, independent of journal and fourth-hit-die notes. Initialization, decimal source editing, invalid-field saving, partial Dawn, item rest recovery, save/reopen, removed/restored inventory, mobile/axe, actual exported PDF completeness and other-character access denial are tested. Custom/computed item pools, item-specific destruction rolls, automatic magic-item spells/effects and a consolidated whole-character rest workflow remain pending.


### Original built-in icon library and private header pictures

The original HeaderIcon, Adventure Log header and organization symbol now open an artwork chooser with the supplied reference’s 13 class icons, 15 faction variants and 10 Adventure League season icons. Collection cards preview the artwork before Apply; Cancel keeps the previous value. The private upload path uses the existing type validator, resizer and character-document budget. Header and log icons stay separate, with the log choice reused across its continuation pages. Standard Background retains its organization-symbol controls and exposes the same choosers.

Header printing is explicit and initially off, following the source widgets’ original nonprinting flags. Both print styles include opted-in artwork and retain the same private symbol. Icon choices do not change class features, faction membership or access. The exporter whitelists exactly 38 SaveIMG fields and renders only their icon Form XObjects into fresh blank documents; source values, portraits, pages and callbacks are never exported or executed. The 424 KB library is deferred until a chooser or a saved icon needs it.

Tests cover preview/cancel, original asset metadata, normalization, separate choices, actual private save/reopen, unchanged character rules/inventory, built-in symbol conversion, private uploads, rejected SVG, printed image embedding and explicit exclusions, mobile accessibility and a stale detached Apply button. PDF image import/conversion, the original default-reset variants and further portrait popup operations remain partial.


### Adventure Log arithmetic without executable source code

Starting balances and gains/spending now accept ordinary arithmetic with precedence, parentheses, unary signs and decimal comma/dot. The parser supports +, −, × and ÷ without eval, Function or Acrobat execution. Exact rational intermediates avoid cent drift; final gold values require at most two decimal places and other balances require whole numbers. Division by zero, unsupported syntax, excessive nesting/length/intermediate sizes and results beyond the existing bounds fail before any record changes.

An optional bounded expression annotation preserves the entered calculation beside its numeric amount. Old numeric records retain their shape. Moving or copying a record carries its annotation, clearing/replacing an amount removes it, and normalization drops invalid/inconsistent annotations while retaining recorded numeric balances. Source paper retains the calculation in its input; Standard print shows calculation = amount alongside the running total. Later opening balances and totals stay read-only. Label/focus help replaces repeated help badges on the Standard numeric log fields. Validated annotations are memoized with weak object keys and text/value checks, so a full 600-expression log does not reparse every calculation during ordinary sheet refreshes; edits invalidate the affected value.

Tests cover exact fractions/cents across paper pages, signs/precedence, expression preservation, invalid-save guards, private persistence/access, print content and unchanged character XP/coins. General JavaScript expressions and automatic XP/treasure transfer remain unimplemented.


### Native Adventure Log row menus

The original entry arrows now open direct Move up/down, Insert empty, Delete and Clear tools, with the existing duplicate command and an exact Edit this entry link. Source and Standard share one guarded command controller and the same private log records. Commands preserve calculations/notes and follow the selected record across six-entry page boundaries. The final recorded entry may move into the next empty position, within the unchanged 120-entry limit.

Clear/Delete retain confirmation and reject stale sessions or lost authentication. Invalid shared amounts stay visible and block commands through inline feedback with guarded delayed focus. The native menu keeps Edit/Done visible while its body scrolls. Browser checks cover source/shared editing, cross-page order and balances, formulas, insertion/copy/delete/cancel, persistence, mobile/axe, invalid pending amounts and stale/ownership changes. Header-level page/logo/date-format options and automatic XP/treasure transfer remain pending.


### Equipment column weights from the shared carried projection

The original three main equipment subtotals and two-column continuation subtotals now use the same quantity/unit-weight calculation as Standard Inventory. Source rows retain unit weights, matching the supplied CalcWeightSubtotal function; each subtotal multiplies quantity for its own eighteen-row column. Base, first extra and later extra offsets remain separate. Coins contribute only to Weight Carried, so they are not counted again in every column.

Unknown weights stay explicit: a compact + marks a known minimum and ? means there is no known subtotal. Short computed subtotal values may shrink within a readable font bound to fit the original narrow box; long values still use the existing complete-text print continuation. No carrying-capacity formula or encumbrance penalty is invented. Browser coverage includes quantities, actual unknown entries, scoped/un-carried/other-character exclusion, unit rows, continued columns, live inventory updates, unchanged data/currency, narrow-field layout, actual PDF content and save/reopen.


### Inline XP additions and pending drafts

The original first-page Add Experience field now shares the Standard control’s single pending amount. Typing an amount leaves character data and its dirty state unchanged. Only Enter or Add Experience awards XP through the existing progression and multiclass workflow. The pending amount and its inline validation state are shared across styles; an invalid unapplied amount does not prevent saving the actual character.

Unapplied amounts are excluded from printed fields and text-overflow continuations, and are cleared on reopen. Old detached controls, another opened character session and lost authentication cannot award XP. Browser coverage checks direct additions, limits, multiclass advancement, unaffected HP/coins/inventory/companions, save/reopen, actual PDF text and stale-session guards. No new persisted fields, Firebase rules or production migration.


### Lifestyle choices and daily-cost guidance

Background & appearance and Extra background now show the original seven-choice Lifestyle dropdown and its matching daily cost. The factual names/prices come from the supplied PDF’s static Lists.Lifestyles table; no Acrobat code is executed. Both paper layouts use the existing profile.lifestyle field and the same pure lookup as Standard.

Standard keeps its editable lifestyle text with compact suggestions and a cost hint, so custom descriptions survive unchanged. Existing capitalization/spacing is preserved until a new choice is made. An unknown custom description has no guessed price; empty selections clear the displayed cost. Lifestyle selection is guidance and never subtracts coins. Coverage includes all seven prices, custom/blank values, continuation background, save/reopen, actual printed names/costs, read-only viewing/printing and unchanged coins/XP/inventory. No Firebase rules, persisted schema changes or migration.


### Original spell-slot total labels

The nine SpellSlots.Extra level labels now follow the original SetSpellSlotsCheckboxes behavior: a pool above four slots shows OF followed by its maximum; four or fewer shows no extra label. The value is calculated from the same pool as the adjacent remaining/maximum tracker. A selected Warlock uses Pact Magic at its own slot level, while other caster views use ordinary Spellcasting. Druid-created independent pools retain their existing identity.

The labels remain read-only and open the existing Spells controls through Enter/double-click. Tests cover boundaries, unchanged maxima during spending, shared maximum edits, ordinary/Pact separation, read-only viewing/printing, save/reopen, actual PDF output and unchanged coins/XP/inventory. This connects existing totals without introducing slot arithmetic, stored state or rules changes.


### Remaining unmapped fields in the live layout audit

A read-only browser pass through all seventeen layouts, using a synthetic 2014 Wizard 20, still finds these unmapped fields after the XP, weight, lifestyle, slot-label and Tool-row connections:

- First page: encumbered speed. Background Extra is connected by the subsequent increment below.
- Features & equipment: encumbrance threshold, push/drag/lift, carrying-capacity field and two attuned-item display/heading controls. The carrying-capacity and carried-weight option buttons also remain unavailable.

This is a field-binding audit for one scenario, not a completion percentage or a full rules audit. Enabled links to shared editors remain partial equivalents; original dynamic menus, class-specific companion scaling, conditional layouts and unimplemented automation still require the per-function review in the ledger. These findings are separate from the static scan’s 567 repeated pushbutton occurrences and 287 dynamic UI sites.


### Original custom Tool row

The original first-page Tool name, Prof, Exp and calculated bonus now share one private custom-check record with Standard Abilities & skills. An explicit parenthesized ability, such as Thieves’ Tools (Dex), selects the modifier; without one the total remains blank, matching UpdateTooSkill. The compact shared editor adds an ability picker and bounded adjustment, with inline label help instead of repeated question buttons.

Known tool names inherit the existing proficiency and class expertise, including the separate Artificer sources. Granted ranks cannot be unchecked here; manual ranks stay with this check and survive class changes. Proficiency is included once, or twice in total for expertise. Existing Artificer per-tool selections remain unchanged. A common untrained-check calculation covers 2014 Bard and Champion rounding, skills and initiative; revised Bard receives half proficiency on skills only. Class levels are capped and duplicate rows do not unlock benefits.

Coverage includes all six abilities, levels 1–20, source/edition switches, multiclass/removal, invalid adjustments, unchanged other character/inventory state, private persistence/access, stale controls, mobile/axe and source/Standard print with actual PDF verification. The bounded record stays in the existing private grants envelope; no Firebase rule change or migration. Original global/arbitrary expression modifiers and proficiency-dice variants are still separate parity work.


### Pending XP feedback and tool-training categories

Rejected XP additions now retain their explanation through unrelated recalculation and unchanged blur. Both styles still use one pending input; correcting it through the shared controls clears the paper error without awarding XP. Applying an addition continues to use the existing progression controller, and unapplied drafts remain excluded from saving and printing.

Automatic Tool-row training now requires a recognized shared-catalogue tool or an explicit derived tool-training/expertise record. Armor and weapon proficiency text cannot grant a bonus to a generic ability check. Unclassified custom checks keep their manual proficiency/expertise controls. Tests cover the category boundary, real manual tool training, protected grants and the XP draft's redraw/blur/correction lifecycle. No data format or rules changes.


### Background Extra and per-background details

The original first-page Background Extra field now edits the same short detail as Standard Background & appearance. It supports the source's free-text fallback (temple, specialty or former role); it does not rename the Custom Background, change background entitlements or invent an extra-choice list. Native source-specific dynamic dropdown variants still require a separate metadata review.

Details are retained independently when switching backgrounds, including separate legacy/revised background IDs. Up to 64 nonempty details of 200 characters use the existing bounded private grants envelope. Clearing a detail removes only that background's entry. Detached editors, lost authentication and attempts to edit the previously selected background are rejected. Shared invalid input blocks saving through the existing validation. Source and Standard prints include the active detail without mutating data. No schema, Firestore/Storage rule, production write or migration change.

Coverage includes direct/shared edits, switching away/back, custom-name and HP/coin/skill/inventory isolation, malformed key/value normalization, validation, private save/reopen/access, mobile/axe, both print styles and actual PDF text. Full Adobe parity remains unfinished and this PR remains draft.


### Original average HP method

The common HP engine and both sheet styles now offer **Adobe average HP** alongside the existing fixed, rolled and maximum methods. A static review of `calcHPtotals` and `SetHPTooltip` confirms that Adobe maximizes the first character level, keeps exact later die averages, applies the per-level minimum of one HP after Constitution, then rounds the accumulated total once. For a CON 10 Wizard, level 3 is 13 average HP versus 14 fixed HP. This optional source method does not change the default table method. No Acrobat callback or imported expression is executed.

The shared breakdown lists final rounding separately from minimum-HP corrections, so class, Constitution, rounding and supported feat/item contributions reconcile exactly. Multiclass uses the first character level, not a new maximum for each added class. Switching methods preserves recorded rolls, current/temp HP, death saves and other resources; HP is not healed automatically. The original Set Max HP button now opens the native-style one-shot/automatic/manual menu described below. Companion-specific average calculations remain a separate unfinished source workflow.

Coverage includes all thirteen classes at levels 1–20, odd/even totals, Constitution minimums, multiclass, separate bonus/rounding contributions, fixed/rolled/max preservation, source/shared updates, save/reopen/private access, mobile/axe and both print styles with actual PDF. The optional method remains in the existing private envelope; no schema change, Firebase rules or production migration.


### Shared carrying limits and original weight controls

Inventory now has one collapsible Carrying capacity section, used by the original second-page weight buttons and fields. It uses final shared Strength, actual size categories (Small and Medium have the same factor), structured source-specific larger-size build traits and a separately bounded additional multiplier. Firbolg, legacy/revised Goliath, Bugbear, Centaur, legacy Orc, Loxodon, Giff and the expanded Exandria Orc record carry the relevant metadata; removing/changing the race removes that grant. Temporary creature forms and class/feat capacity effects without structured metadata remain separate work; the extra multiplier is only for an agreed additional effect.

Standard capacity is 15 × effective Strength/size factor; push/drag/lift maximum is twice capacity. Optional **2014 variant encumbrance** uses strict 5×/10× thresholds. Whole-pound ranges match the original paper, while fractional carried weights are tested against precise thresholds. Variant movement/disadvantage is guidance in the capacity readout, not an automatic second modification of the normal walking-speed field. Source encumbered-speed formulas and global movement/condition coupling remain unfinished.

Coins can be included at 50 coins/lb or excluded from the same shared weight total. Changing that choice never spends coins. Owned, carried quantities are counted once; attacks, paper placements and magic-item references do not add another copy. Unknown item weights remain explicit and cannot confirm a safe load. A known subtotal over capacity still proves excess even if more weights are unknown. Other original per-section inclusion flags are not yet reproduced.

The original carrying-capacity artwork is extracted separately with other widgets removed, and the hidden heavily-encumbered field is restored at its original coordinates. Basic and variant print layouts switch correctly without overlapping fields or changing gear pagination. The large source weight hit area is restricted to the weight header/value so it does not cover the smaller settings button. Shared invalid values block save, style changes and returning to the paper; stale controls and lost authentication cannot write. Both prints include capacity information, with actual PDF checks. Settings remain in the existing private grants envelope; no schema, Firebase rules or production migration.


### Native maximum-HP options and direct final totals

The original Set Max HP menu now offers the source’s three calculated totals (Adobe average, fixed, maximum dice) as one-shot choices while preserving the selected automatic method. A bounded direct edit of the original HP Max field uses the same operation. A one-shot total survives redraw and save/reopen; class/Constitution/supported HP-bonus changes resume the selected automatic method, and the controller discards the expired override so reverting a build choice does not revive it. Non-HP fields and retained roll history do not invalidate a fixed/average choice.

The separate automatic menu supports fixed, Adobe average, rolled, maximum and Manual. Manual freezes the entered final maximum, including all desired bonuses: automatic CON/feat/item bonuses are not added again. Standard’s shared advancement controls expose the same method, options and bounded manual field. Both paper styles print the same final maximum. Calculation rows include the difference from the reference total so they reconcile without presenting a manual total as an automatic rule result. These operations do not heal current HP, spend hit dice, change temporary HP/death saves or replace saved rolls.

HP options are guarded by the current authenticated session and a snapshot of the character/build/loot. Invalid paper/shared entries block saving and returning from the shared editor until corrected. One-shot basis/value and manual mode remain in the existing private grants envelope, with the final maximum in the existing HP field; no schema/rule changes, duplicate sheet store or migration. No Acrobat JavaScript is executed. The 32nd connected browser flow covers source/shared/direct operations, automatic expiry, retained resources, private save/reopen, actual PDF/both print styles, mobile/axe and stale/account guards. Unit tests exercise all classes at levels 1–20, low/high Constitution, multiclass, bonuses and malformed state. Native companion HP and Heal menus remain unfinished.


### Original Heal and companion recovery

The main Heal and Comp.Heal controls now open a native-themed recovery preview. The same action is available beside shared HP controls and with each saved companion’s optional HP/Hit Dice controls. It restores the selected character/creature to its final maximum HP, clears temporary HP and resets death saves. A completed 2014 Long Rest permits half the total Hit Dice, rounded down (minimum one); the original largest-first allocation is the default, with bounded redistribution. 2024 recovers all spent dice. Turning off dice recovery supports HP-only recovery agreed at the table. No rest happens merely by opening the dialog.

Character pools use the existing multiclass Hit Dice controller, including all four pool sizes and retained old spent counts. Companion allowance uses the chosen creature’s own known Hit Dice; unspecified dice retain the stored count instead of guessing from character level. Other companions, active Wild Shape/familiar resources, coins, quantities, spell slots, conditions and class/feat/item uses are unchanged. Those controllers handle their own recovery. Manual maximum HP and one-shot totals remain final; this action does not change the HP method or duplicate bonuses.

Recovery is computed before mutation, cancelled/invalid plans keep the draft intact, and a session/character/loot snapshot rejects stale confirmations. Changes use the current private sheet and require its normal Save sheet action. Both print styles use the resulting same HP/Hit Dice values. The top Guide and function ledger describe the operation. No new persisted fields, schema, rules, indexes or production migration. Source callbacks were statically reviewed, never executed. Native companion maximum-HP calculations remain separate work.

## Companion maximum-HP choices — v41

The original companion maximum-HP button now opens its own menu and is shared with the existing companion cards. Existing saved totals stay Manual until explicitly changed. Adobe average, fixed and maximum methods use the creature’s own Hit Dice and Constitution for every die; the first die is not maximized. Average retains fractions until final rounding. A separate bounded adjustment supports explicit additional HP. One-shot totals preserve the automatic method and expire permanently when HP inputs change; Manual retains a final total without adding bonuses again. Unknown Hit Dice keep cached HP and expose Manual rather than inventing statistics.

The selected companion’s current HP, temporary HP, spent dice and death counters are unchanged by HP method/maximum edits, as are the character and other companions. Direct paper/shared maximum edits use the same controller. Private save/reopen and both print styles reuse the same record. No new rules, indexes, schema or production migration. This completes ordinary creature-dice HP menus; class-specific companion scaling and source callback effects remain separate audit work. #250 remains draft while the full sheet is unfinished.
