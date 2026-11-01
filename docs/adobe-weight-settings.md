# Original Weight Carried settings — v57

PR #250, equipment backlog point 3. The supplied PDF's `WeightToCalc_Button` and `CalcWeightCarried` define this operation. Scripts were inspected as reference data, never executed. Native web controls retain the source choices and existing private character engine.

## Original blank equipment amounts — v59 correction

Static review of `CalcWeightSubtotal` confirms that blank equipment amounts count one unit, including copied/footer/tool references. Explicit 0 counts none; decimals multiply normally. Adobe column subtotals and selected-section totals follow this rule. Physical Inventory totals still use owned quantities and do not count copied references. The earlier v57 blank-as-zero assumption has been corrected; source mode remains explicitly additive. No data migration or rule change.

## Use and calculation

Click page 2's Weight Carried value/button, Sheet tools → Weight Carried settings, or Inventory → Weight settings. This is a draft: Apply to sheet changes the character; Save sheet retains it. Cancel/Escape discards the draft. The weight/speed result stays visible while reviewing lower sections. The capacity/Speed explanation remains a separate existing control.

- **Inventory** keeps the existing physical carried-item calculation: quantities, optional coins, known unit weights and explicit unknowns; no repeated physical count from paper references. This remains the compatible default for existing sheets.
- **Adobe sheet sections** offers the original twelve flags: armor, shield, weapons, left/right ammunition, coins, page-2 left/middle/right equipment columns, page-3/continuation left/right columns and magic items. Original defaults select coins and the three page-2 columns. Selected fields are additive: selecting two representations counts both, exactly as in the PDF. Shown subtotals make that choice visible before Apply. Physical ownership is unchanged.
- Imperial coins total all five denominations, divide by 50, then floor to one decimal place, as the source function does. Inventory's existing precise coin weight remains available in Inventory mode.
- Ammunition uses the recorded total remaining amount; loaded icons do not add ammunition again. Known standard types resolve their shared per-unit weights.
- The separate armor/shield/attack/ammunition/magic weight fields accept bounded nonnegative numeric overrides (decimal dot/comma); blank or Automatic restores the known value. Overrides follow stable references. Expressions are rejected; no user/Acrobat code runs.
- Original footer and copied references keep blank quantities and do not create physical stock. Physical gear displaced by the footer retains its correct source column/continuation.

Source zero displays blank, while unknown weights stay explicit. The selected known weight drives the existing main-character carrying/movement calculation; no extra armor penalty is stacked on the optional variant. Base speed, abilities, HP, slots, coins, item quantities, feature uses and ammunition records are not rewritten by weight derivation. Other condition effects remain reminders as documented in the movement scope.

## Persistence and protection

Preferences live in `adobe.paperWeight` inside the existing private schema-14 grants envelope. No new Firestore/Storage rules, index, schema version or production migration. Source coin inclusion and the existing carrying coin control stay consistent. Session/identity/inventory snapshots prevent applying stale drafts. Invalid weights remain visible until corrected/reset; switching source cannot hide an unresolved invalid field. View/controller cleanup closes abandoned dialogs.

Manual/legacy final ability scores retain their mode during unrelated UI recalculation. The point-buy UI now forces Base only when Point buy is actually selected, rather than silently converting manual totals. Point-buy limits and racial/class ability calculations remain unchanged.

## Validation and remaining work

Pure tests cover original defaults/additive fields/coin rounding, selected unknowns, numeric bounds, enhanced weights, original columns/footer, ammunition, stable magic references and selected-weight/movement coupling. The connected browser test covers draft/Cancel, all twelve choices, preview versus live model, invalid/decimal overrides and reset, mobile pinned results/accessibility, private save/reopen, actual PDF, stale/account/session guards and retained resources/legacy final-score mode. Existing point-buy, carrying, engine/DOM, full Adobe, packaging and private permission checks remain required.

Ordinary character Gear field/row operations are connected in v58. Original Gear/Tool catalogue placement is connected in v60. Page/companion transfers, magic catalogue/type/base-gear choices, checkbox visibility and unit-system/layout variants remain open. This component does not complete the whole source equipment system or PR #250's full 1:1 audit.
