# Adobe sheet parity backlog

Agreed with the user on 30 October 2026. Keep this work in PR #250. No assistant merge, live/rules deployment or production migration. A finished numbered point does not mean the entire PDF is complete. The [function ledger](adobe-inventory/web-bindings.md) records source actions individually.

1. **Original modifier and field-option menus — implemented; verification is recorded in PR #250.**
   - Shared native modifier dialog: original manual bonus, formula, live result, automatic calculation/training origins, Apply/Cancel and restore original bonus.
   - Bounded arithmetic with six ability modifiers, Prof, min/max, aliases and companion references to the character. No Acrobat/user code execution.
   - Saves, skills, all-skill/all-ability-save bonuses, initiative, passive Perception, custom checks, AC adjustments, stable attack hit/damage/dice, ordinary slot adjustments and caster-specific attack/DC/preparation settings.
   - Optional proficiency-dice field setting, retaining fixed passive/DC calculations and manual roll resolution.
   - Skill ordering and training-origin menu, with source/companion/print parity.
   - Shared persistent tool disclosure over the paper. Source Show extra features opens it; page, zoom and print remain directly available. Disclosure is a local scoped preference, separate from character mechanics.
   - The feature-specific menus for items, logs and layouts belong to points 3, 4 and 7; their unresolved actions remain explicit in the function ledger.
2. **Movement and encumbrance — implemented in v55; validation recorded in PR #250.** One shared carried-weight projection drives final character Speed, optional 2014 encumbrance, Heavy armor, supported item/racial exceptions and recognized edition-specific movement conditions. Native Movement/Conditions popups explain the result. Unknown weights remain explicit; other condition effects are reminders. Creature/form inheritance and per-section weight flags remain points 5 and 3. See [scope and calculations](adobe-movement-and-load.md).
3. **Equipment and magic items.** Additional weight-inclusion choices, attuned-display/footer behavior, remaining item commands and supported computed/custom pools/effects.
4. **Adventure Log.** Remaining page/date options, add/reset/remove behavior and controlled character XP/treasure transfers.
5. **Class-specific companions.** Per-feature class/level scaling beyond ordinary creature Hit Dice, with multiclass and retained-state tests.
6. **Background choices and action reminders.** Source-specific background lists and supported class/spell action/bonus-action/reaction population.
7. **Conditional layouts and printing.** Remaining show/hide fields/sections/pages, original text/layout settings and print variants.
8. **Final PDF parity audit.** Review every relevant original button/function, end-to-end characters, multiclass, private save/reopen and actual PDFs. Passing field counts are not a completion percentage.

Character data stays in the existing private save/grants envelope. Each point must state tests and any actual rule changes in the PR. Keep future unsupported options read-only/unavailable and describe their remaining scope honestly.

## Adobe owns every workflow — revised requirement

The user approved **collapsed initially, then remember the choice** for Sheet tools. After testing, the user clarified that Adobe must provide every setting itself and is intended to become the future standard. Opening Standard/builder panels is an interim bridge, not completed Adobe parity. Shared rules, private persistence and catalogue data remain reusable.

The class/level priority has a native Level popup since v43 and direct Class/Subclass choices since v65. The final Class option, Multiclass, opens the allocation popup. It includes rule/source eligibility, multiclass allocation, class choices and training, HP review, Apply/Cancel, and retained resources. Continue the remaining native origins/equipment/companion workflows and paper tools; remove each legacy navigation bridge only when its replacement is working and tested. Do not switch the global default until this complete path has been tested. The remaining numbered mechanics/layout tasks above still apply.

### Native configuration checkpoint v43

Implemented in the #250 worktree: single-click Level/Class and Levels popup with isolated draft, class/edition/subclass/source selection, multiclass allocation, XP and one-shot limits, class choices, invocation cantrips, class skills/Expertise/weapon training, Artificer tools and HP review. An independent abilities/saves/skills popup includes point-buy validation and collapsed starting spreads. Both keep the paper visible and the old builder hidden. They retain unrelated state and require the normal Save sheet after Apply. The remaining origins/feat/spell/equipment/companion and paper-tool bridges are still open work; this checkpoint does not mark native parity complete.

### Native feat checkpoint v44

Added an Adobe-owned selected-first feat dialog for granted/advancement choices, rule information, supported effect controls, weapon choices, simple resources, description display and Magic Initiate selection/free use/spellbook actions. The existing pure entitlement/effect functions remain authoritative. The native class Training step now includes the revised Rogue’s extra language. Origins, DM feat-grant/approval administration, class spell management, equipment, companions and remaining paper-tool bridges remain open; the global default is unchanged.

### Feedback from the first preview test

Hide unavailable choices from the other rule edition in Adobe pickers, preserving existing saved selections. The next display task is a continuous editable stack of the connected paper sheets with a fixed left shortcut rail (including direct Spell slots navigation) and a compact mobile alternative. Keep the shared character engine, input validation, private save and printing; avoid disconnected screenshots or a second character draft per page.

### Continuous display checkpoint v45

View → All sheets adds a continuous editable stack with a fixed left shortcut menu and compact mobile Jump to. It reuses the same live fields/controllers and session, keeps caster/companion/continuation contexts separate, mounts pages on demand, retains invalid/focused drafts, and preserves the existing private save and print paths. Single page remains an alternative with the selected layout retained. The preference is local and scoped per user/character. No global default or rules changed. See [continuous-sheet behavior and tests](adobe-continuous-sheets.md). The remaining native editor bridges and numbered mechanical/layout parity tasks remain open.

## Preview feedback — v46

- Left navigation now lists actual numbered sheet pages, without a second section-shortcut list.
- Native Add pages offers spell, companion and rules pages first, plus original templates. Repeated companions/continuations retain independent data. Blank optional choices persist locally after a successful open and join the connected print output.
- Readable/searchable Adobe pickers replace raw browser menus on source fields and native class/ability/feat dialogs. Race/background lists come from shared catalogues rather than the Standard DOM; names stay short on paper and source details appear in the picker. Source resistance/ammo suggestions, six companion sizes and Cohort/Mount roles are included.
- [All exported nonempty option lists are reviewed](adobe-inventory/dropdown-audit.md); computed fields and unimplemented source overrides are explicitly recorded. This is not full functional parity.
- The user’s self-contained Adobe requirement remains the release target. Origins, full spell/equipment/advanced companion management and the remaining legacy editor bridges still require native replacement. Do not merge #250 as a completed 1:1 version.

### v48 stability follow-up

Navigation reclaims older prefetch views at completion, even for cached destinations. Visible, focused, selected and invalid drafts are retained; the prefetch buffer alone cannot exceed the twelve-view budget. The regression covers a tall viewport with delayed animation frames and checks each completed jump. Keyboard opening/canceling a picker leaves a clean character unchanged. The associated UI build is v48; no rules change.

## Native spell selection — v49

Choose spells now opens an Adobe-owned catalogue/selection draft, with class/level/school filters, exact-name search ranking, inline spell facts/description and separate selected list. Reach and limits reuse CharacterSpellcasting and CharacterCatalog; Wizard book/preparation, automatic grants, both rule editions and Artificer source profiles remain shared. Class switch retains draft choices, while existing manual/unassigned/out-of-list entries and other resources remain intact. Apply changes only spells; Cancel/Escape/session guards discard the local draft. Mobile has a dedicated detail view and Back to spells. Paper, single-page toolbar and per-caster All sheets headings provide entry points. The single-spell information window is unchanged.

This replaces the spell-selection bridge. Slot spending retains its existing separate route, and custom spell authoring, additional spell tools and the other remaining native-editor bridges still need parity work. No new rules or migration. See [spell picker](adobe-native-spell-picker.md).

## Cleric reference list and daily preparation (v52)

Fixed the native and shared generator using prepared-class allowance as the reference-list cap. Cleric and other prepared classes can add reachable reference spells, independently mark Prepared, and retain both states through Save/reopen and Standard round trips. Cantrip/known/fixed-prepared limits and separate always-prepared grants remain in force. Guide and regression coverage updated; no Firebase rule change.

## Direct paper preparation (v53)

Prepared spell circles on the source paper now enable all prepared classes, using the same shared preparation action and allowance. Single/continuous/continuation, keyboard, blocked over-preparation, grant/cantrip protection, class/resource isolation and private Save/reopen have browser coverage. The popup remains optional for daily preparation.

## Stay on Adobe and readable armor choices (v54)

Remaining shared editors now open as bounded modal sections over the Adobe paper, retaining the original form/controller and Save button. Close restores controls and focus; errors/save status stay visible inside the popup. Rules route to the source reference page; unknown routes remain on Adobe. Explicit Sheet style selection is the deliberate Standard switch. Source dropdowns and nested popup choices share the light searchable picker, with mechanics-derived Light/Medium/Heavy/Shield labels at the right. These changes close navigation escapes, while specialized source-layout parity work remains. See [navigation audit](adobe-native-navigation-audit.md).

## Source equipment operations — local work after v55

The original magic-item menu is audited action by action in [the equipment function audit](adobe-equipment-function-audit.md). The next component preserves the source Move/Insert/Clear/Delete distinctions, owned-item selection, full text and common equipment/attunement rules. Empty positions and removed references are private paper state; Clear/Delete end the removed reference’s effects while retaining inventory ownership/uses. Catalogue/type/gear variations, attunement visibility and weight inclusion/modifiers still remain. The original footer and copy destinations are implemented in the next local component. Point 3 is open.

## Weight Carried settings — v57

The original twelve section choices and separate unit-weight fields now have a native draft with Apply/Cancel, section subtotals, movement preview and automatic reset. Inventory remains available; the explicit Adobe mode follows the original additive calculation, coin rounding and total ammunition. Preferences save privately and feed the shared movement engine. Legacy manual/final ability totals are retained during unrelated recalculations; selecting Point buy still explicitly uses base scores. Gear-row direct edits, magic catalogue/type variants and checkbox visibility remain open in point 3. See [weight settings](adobe-weight-settings.md).

## Equipment paper rows — v58

The original character Gear/Extra Equipment arrows now open native row options. Stable moves, column moves, first-empty Insert, distinct Clear/current-column Delete and private paper fields preserve physical ownership/resources. Owned selection swaps/restores references; selected-source weight and print follow edited amounts/weights. Light searchable choices, top Save/Done and collapsed editing keep the menu compact. Catalogue Put Gear/Tool, page/companion transfers, magic variants/visibility and unit-system options still keep point 3 open. See [Gear scope](adobe-gear-row-integration.md).

## Source blank-amount rule — v59

The original CalcWeightSubtotal uses one unit when an equipment amount is blank. Corrected all source columns and selected-section totals, including footer/copied references and private row overrides; 0 still counts none. Physical Inventory weight is unchanged. Source tests and the Gear/footer browser flows cover this distinction before continuing Put Gear/Tool catalogue work.

## Original Gear and Tools catalogue — v60

Original row menu Put Gear/Tool now offers 106 Gear and 37 separate Tools with categories, source amounts, weights and prices. Preview/Cancel stays read-only; Add & place applies private inventory plus paper placement together, preserving overwritten stock/effects and spending no coins. Unknown tool weights require an explicit value; campaign edition policy, limits and stale guards apply. Metadata loads on demand with Retry. Save/reopen, PDF and mobile/accessibility have a dedicated connected flow. Page/companion transfers, magic variants/visibility and units remain open; point 3 is not complete. See [catalogue placement](adobe-gear-catalogue-placement.md).

## Equipment page transfers — v61

Ordinary Gear and copy references move atomically between the original page-2/page-3 tables, with source-column compaction and first-empty target placement. Fields, independent reference identity and physical stock are retained. The destination opens/focuses the moved row in Single/All sheets; full targets refuse without losing data. Multiple copied references survive moving to one page and can be cleared individually. Native close handling prevents focus jumping back. Companion transfers, original matching-name amount combination, footer-specific Magic Item actions, magic variants/visibility and units remain open. Functionality and calculations from the supplied Adobe sheet remain the primary target; visual work supports those flows.


## Original matching-name amount combination — v62

Gear page transfers now offer an explicit previewed Move & combine when the destination contains a matching name. It shows existing + incoming = result, destination unit weight and location before confirmation, including full-page destinations. Original blank/0 incoming and blank existing fallback arithmetic is retained; the source column compacts while physical records/effects/uses stay unchanged. Save/reopen and print retain the private paper amount. The ordinary Move option keeps references separate. This covers numeric/blank matching-name arithmetic, not full source synonym parsing, catalogue combining or nonnumeric amounts. Companion transfers, footer-specific Magic Item actions, magic variants/visibility and units remain open in point 3. See [transfer scope](adobe-gear-page-transfers.md).


## Footer Copy to Magic Items — v63

Footer arrows now open native Save/Done, owned-reference Copy, full text and confirmed Clear. Copy reuses an existing magic row or restores a hidden one into its first empty position, focusing the correct repeated continuation in Single/All sheets. Physical records, effects, attunement and resources are retained; full tables and stale controls refuse. Source free-text recognition and other footer editing/move branches remain open alongside companion transfers, magic catalogue/variants/visibility and units. Point 3 is not complete. See [footer scope](adobe-magic-footer-copy.md).


## Original magic variants — v64

Six Giant Strength belt types and ten Resistance ring types now have native preview/Cancel/Apply, shared STR/resistance/attunement behavior, private save/reopen and source print. Choices live on the existing equipment state, retain original records/resources and follow the owned item in both presentations. The original-source guard catches catalogue changes during confirmation. Other magic families, base-gear choices and remaining point-3 functions stay open. See [scope](adobe-magic-item-variants.md).

### Direct character choices checkpoint v65

Class and Subclass now sit together on the first paper page; the final Class option, Multiclass, opens the native allocation popup. A selected future subclass is retained as planned and activates only at the correct class level for its edition/source. The reviewed 2014/2024 JSON class facts supply activation thresholds; existing shared effect rules remain authoritative. This is a source foundation, not a completed external catalogue import.

Background and Race remain direct filtered dropdowns with Custom last. Add Features on page two opens an anchored background-specific Personality trait/Ideal/Bond/Flaw menu with hover, touch and keyboard support. Suggestions remain editable; Custom focuses the existing text field, and replacement asks first. Guide and contextual information are updated. No rules deployment or production migration is needed. See [implementation scope](adobe-inline-character-choices.md) and [Danish preview test](adobe-v65-testplan-da.md). Numbered points 3–8, remaining external source/effect coverage and final 1:1 audit remain open.

### Source Equipment / Feature menu checkpoint v66

Original page-two Add Equipment now opens a dedicated preview with edition/source-filtered individual gear, packs, exact background options, real tool/instrument/holy-symbol choices and Custom item. Optional starting coins remain separate from physical inventory and are explicit in confirmation. Current reviewed facts include 81 legacy and 16 revised background packages; absent newer-source packages remain unavailable. Source class Choose Feature opens the focused native class-feature category popup, with shared training and an owned Druid forms popup. Normal Level/class setup remains available separately. Shared Wild Shape controls reject detached/stale-session events. Guide and [scope/testing](adobe-equipment-feature-menus.md) are updated. No rules deployment or production migration is needed. The supplied screenshots will be used to refine the menu structure; remaining full source/effect/parity coverage stays open.
