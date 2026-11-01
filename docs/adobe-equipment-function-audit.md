# Adobe equipment function audit — source first

PR #250, backlog point 3. The provided MPMB 13.0.4 PDF defines the required paper appearance and source actions. Better web interaction does not remove an original function. This audit is partial implementation tracking, not a claim of complete parity. Acrobat code is read statically, never executed.

## Source magic-item row menu

Checked `MakeMagicItemMenu_MagicItemOptions` in source module `Functions3`, including its commit branches.

| Original action | Web status / remaining work |
| --- | --- |
| Apply / change item | Existing owned-item selector changes the paper order; full original catalogue application remains required |
| Change item choice / base gear type | Remains required, using source-specific mechanical choices |
| Show full text | Existing private item reference; new native row-menu entry implemented locally |
| Move up / down, including third/overflow boundary | Existing stable order; native row controls implemented locally |
| Insert empty item | Implemented locally: explicit empty position, first empty slot below, no destructive insertion when full |
| Delete item / clear item | Implemented locally: Clear leaves a blank; Delete shifts later rows and respects the partly empty first-page boundary. Both end the removed reference’s equipment/attunement effects, retaining physical ownership, quantity and uses |
| Show attuned checkbox | Remains required; visibility and mechanical attunement must stay explicit, with shared limits enforced |
| Copy to Adventuring Gear | Implemented locally: reuse an existing destination row, or add a reference with the original blank quantity; no new physical item or weight |
| Copy to Attuned Magical Items | Implemented locally: conditional original footer action, three reference rows and original footer display option |
| Copy to Extra Equipment | Implemented locally: fixed page-3 Extra Equipment destination, no overwrite when full; retained reference on a continuation after inventory growth |

The local native menu includes the existing equipped/attuned controls, original description, owned-item selection and source Move/Insert/Clear/Delete actions, with top Save. Original catalogue type/gear variants and checkbox visibility remain open; this is not the completed source menu. Removing ownership leaves a named unavailable position until explicitly changed or cleared, rather than silently shifting the source rows.

## Source carried-weight dialog

Checked `WeightToCalc_Button` in module `Functions1`. Original flags are Armor, Shield, Weapons, left/right ammunition, Coins, page-2 left/middle/right equipment columns, page-3 left/right extra equipment columns, and Magic Items. Implemented in v57: all twelve flags, original defaults (coins and page-2 columns), additive selected-section totals, original imperial coin rounding, unit field overrides and total-ammunition integration. Inventory remains the existing default and counts each physical item once; the explicit Adobe calculation adds selected fields exactly as the source does, including independently selected representations of the same item. Copy-reference quantities remain blank. Source CalcWeightSubtotal counts a blank equipment amount as one unit (corrected in v59); physical Inventory still counts owned stock only. Unknown weights stay marked. Gear-row direct edits, unit-system settings and remaining original gear actions are separate work.

## Preserve the agreed release boundary

Movement point 2 is a separate tested checkpoint. Equipment work continues on its own branch until its source actions, visual behavior, private persistence, permission boundaries and actual PDF output are checked. Do not label point 3 complete, switch the global default or merge PR #250 as a finished 1:1 version.

## Original footer and copy destinations (v56)

Equipment layout selects the original Attuned Magical Items footer: the page-2 title and three reference rows use the exported source geometry and whiteout rectangle. Displaced owned gear moves into Extra Equipment. Footer references survive switching back to the full gear column. The magic-item menu exposes the original Adventuring Gear/Extra Equipment copy actions and the footer copy action when that layout is enabled. Original copying passes a blank quantity; references follow that behavior and retain known unit weight without creating ownership or extra physical mass. Existing destination appearances are reused. Full sections reject copying; later inventory growth preserves displaced references on a continuation, with their location shown in Equipment layout. Clearing a reference leaves equipment and attunement unchanged.

## Other original equipment row menus still to finish

`MakeInventoryLineMenu` / `InventoryLineOptions` in source module `Functions1` define more than item information: Put item on this line (Gear/Tool, overwriting the current fields), Move up/down, Move to left/middle/right column, Move to Equipment/Extra Equipment/another companion, Insert line, Delete line and Clear line. The footer’s magic rows additionally offer Copy to Magic Items. Footer boundaries restrict row moves. Implemented in v58 for character Adventuring Gear/Extra Equipment: stable Move up/down and column moves, first-empty Insert, Clear versus current-column Delete, restored owned selection and native name/quantity/unit-weight/location edits. Clear/Delete retain physical ownership/effects; field overrides feed Adobe source totals. Original catalogue Put Gear/Tool is connected in v60: 106 Gear and 37 Tools, preserved source amounts, preview/confirmation, explicit missing weights and atomic private stock/row placement. Page-2/page-3 transfers are connected in v61 with atomic source/target edits, destination focus and independently retained copy references. Companion transfers and the original AddToInv matching-name amount combination remain required/reviewed separately. Existing information and shared inventory editors are not claimed to complete them. Companion transfers must preserve independent creature records and physical ownership.

The static footer caption was checked directly on the original read-only field: **ATTUNED MAGICAL ITEMS**. No filled character values were copied during this check.
