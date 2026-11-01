# Original character equipment page transfers — v61

PR #250, equipment backlog point 3. Source reference: `InventoryLineOptions` → `movepage`, `InvDelete` and `AddToInv`, read statically from the supplied PDF. Character Gear references can move between Equipment (page 2) and Extra Equipment (page 3); later equipment continuations can move into either original table.

## Behavior

The native Gear row menu names the destination before the click. One private state update closes only the source column's gap and fills the destination's first empty row. Name, amount, unit weight, location, field overrides and stable reference identity follow the item. Footer heading/rows are protected. Full destinations reject before removing anything. An explicit move may fill a saved blank even when automatic physical placement would leave it open.

The popup closes and Adobe opens/focuses the moved row. Both Single page and All sheets retain their view mode. Native dialog closing is idempotent so its later close event cannot return focus to the old continuous page. Abandoned page loads cannot focus a different character. Save sheet retains the move; physical inventory, equipment effects, item uses, HP, coins and spell slots stay unchanged.

Copied references have bounded private identities independent of their current destination. Legacy copies use their existing destination/id identity; cross-page moves retain that key. Several copies of one owned item may share a page without being discarded by normalization. Copy-to-destination checks actual appearances, and clearing a particular reference removes only its own position/overrides. Equipment layout names its actual current page. Missing owned rows stay named/unavailable without accumulating duplicate status suffixes when moved.

Preferences reuse private `paperInventory` in the existing schema-14 grants envelope. No Firestore/Storage rule, index, schema version or production migration.

## Remaining original branches

Source `AddToInv` can combine matching names. This checkpoint preserves separate owned/copy references rather than silently combining their amounts, weights or locations; original matching-name combination remains a separate parity task. It is not claimed complete here. Companion transfers, footer-specific Copy to Magic Items and remaining magic catalogue/type/checkbox options also remain open. The current companion template's missing Gear fields require further static layout/layer review.

## Validation

Pure tests cover source-column limits, first-empty targets, full-page refusal, retained fields/stock, independent same-name and copied references, copy-after-move/individual removal, legacy normalization, later continuations and missing references. The connected browser flow covers original arrows, source/physical weight, destination page/focus in Single and All sheets, correct copy labels, private Save/reopen, resource isolation, connected PDF, full target, mobile/axe and stale controls. The broader engine/DOM, full Adobe and private permission checks apply before publishing this checkpoint.
