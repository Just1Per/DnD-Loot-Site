# Focused Gear & Loot and Wishlist reads

Opening the character workspace previously requested campaign items, inventory, saved items and DM supply together. The request set now follows the section:

| Section | Player reads | DM reads |
| --- | --- | --- |
| Wishlist | Items + own saves (2) | Items + campaign saves (2) |
| Gear & Loot | Visible items + own inventory (2) | Items + campaign inventory + supply (3) |

Before this change these paths made 3 player collection requests or 4 DM requests. Supply is already skipped for players by the existing supply loader. Saved cards do not display inventory or supply; gear cards do not display saved-item controls. DM gear keeps current supply labels and all existing transfer/unloot/use controls. The viewed character remains separate from the Library's active save/loot target.

The workspace renderer no longer starts an extra item fetch for missing saved-item details. The section's explicit open/refresh loads items once, including when unavailable bookmarks remain in the list. Those bookmarks still offer Remove saved. The legacy Manage characters list retains its separate fallback loader.

Each opening still fetches fresh section data. No new cache, persistent storage or changes to query permissions are introduced. `refresh(false)` remains a render-only update after local actions; full campaign refresh after inventory operations is unchanged. Refresh outside the two sections retains the prior full request set. The Guide explains the current section names, picker and equipment-edit destination.

Validation extends the existing `test:character-workspace` browser suite with real SDK query counts for player and DM panels, cold missing item details, unavailable bookmarks and retry after a rejected request. Existing coverage continues to verify save/move/remove, equipment editing, consumptions/transfers, delayed refresh during character switching, navigation restoration, role revocation, mobile layouts, keyboard focus and WCAG.

Counts are measured in an isolated browser fixture. Production latency and billed-document totals are not inferred from them. No Firestore/Storage rules, indexes, migration or production deployment required.
