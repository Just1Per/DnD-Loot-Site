# Original character equipment page transfers — v61 / v62

PR #250, equipment backlog point 3. Source reference: `InventoryLineOptions` → `movepage`, `InvDelete` and `AddToInv`, read statically from the supplied PDF. Character Gear references can move between Equipment (page 2) and Extra Equipment (page 3); later equipment continuations can move into either original table.

## Behavior

The native Gear row menu names the destination before the click. One private state update closes only the source column's gap and fills the destination's first empty row. Name, amount, unit weight, location, field overrides and stable reference identity follow the item. Footer heading/rows are protected. Full destinations reject before removing anything. An explicit move may fill a saved blank even when automatic physical placement would leave it open.

The popup closes and Adobe opens/focuses the moved row. Both Single page and All sheets retain their view mode. Native dialog closing is idempotent so its later close event cannot return focus to the old continuous page. Abandoned page loads cannot focus a different character. Save sheet retains the move; physical inventory, equipment effects, item uses, HP, coins and spell slots stay unchanged.

Copied references have bounded private identities independent of their current destination. Legacy copies use their existing destination/id identity; cross-page moves retain that key. Several copies of one owned item may share a page without being discarded by normalization. Copy-to-destination checks actual appearances, and clearing a particular reference removes only its own position/overrides. Equipment layout names its actual current page. Missing owned rows stay named/unavailable without accumulating duplicate status suffixes when moved.

Preferences reuse private `paperInventory` in the existing schema-14 grants envelope. No Firestore/Storage rule, index, schema version or production migration.

## Remaining original branches

Source `AddToInv` matching-name arithmetic is available as an explicit **Move & combine paper amounts** action in v62. The existing Move action still keeps references separate. When a matching name exists on the destination page, a preview shows the existing and incoming amounts, resulting amount, destination unit weight and location. Confirmation retains the destination fields, hides the source paper reference and closes only its source column. It can use a full destination because no new row is required. Blank incoming amounts and incoming 0 count one, following the original combine function; a blank existing amount counts one, while an existing 0 stays zero. This is distinct from ordinary subtotal calculation, where 0 counts none.

Combining is a snapshot of the paper fields, not a merge of owned stock. Separate owned identities, equipment effects and item uses are retained. Destination weight/location win, so section mass can change; the preview makes these fields explicit. The combined amount is private and survives Save/reopen and print. Matching ignores case, apostrophes and container indentation, retaining enhancement signs; it does not attempt the source’s full synonym/regular-expression catalogue parsing. Invalid or overflowing amounts, missing ownership and changed sessions refuse without partial application. Source nonnumeric amount expressions are outside the web’s bounded numeric/blank paper fields. Catalogue placement and reference-copy commands retain their existing separate behavior. Companion transfers, footer-specific Copy to Magic Items and remaining magic catalogue/type/checkbox options also remain open. The current companion template's missing Gear fields require further static layout/layer review.

## Validation

Pure tests cover source-column limits, first-empty targets, full-page refusal, retained fields/stock, independent same-name and copied references, copy-after-move/individual removal, legacy normalization, later continuations and missing references. The connected browser flow covers original arrows, source/physical weight, destination page/focus in Single and All sheets, correct copy labels, private Save/reopen, resource isolation, connected PDF, full target, mobile/axe and stale controls. The broader engine/DOM, full Adobe and private permission checks apply before publishing this checkpoint.
