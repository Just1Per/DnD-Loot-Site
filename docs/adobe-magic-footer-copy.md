# Original footer Copy to Magic Items — v63

PR #250, equipment backlog point 3. Statically checked `MakeInventoryLineMenu`, `InventoryLineOptions` → `copy` and `AddMagicItem` in the supplied PDF. No Acrobat JavaScript is executed.

The original three Attuned Magical Items footer arrows now open an Adobe-owned row popup with Save sheet/Done, Copy to Magic Items (page 3), full description, confirmed Clear reference and Equipment layout. The footer’s hidden heading arrow stays hidden. Copy reuses the same owned magic identity if already visible. Otherwise it restores its hidden reference into the first empty magic row; a full table refuses without replacing anything. Named missing ownership cannot be copied.

The correct magic row opens and focuses, including repeated five-row additional-detail pages in both Single page and All sheets. The view mode/style are retained. Clear reference removes only the footer reference, retaining its owned record and magic-table appearance. Cancel, changed sessions, closed controls, resources and private Save/reopen are covered. Print shows the connected destination. Destination-load failure retains the applied change with a visible retry explanation.

The web shares its existing equipped/attuned state and attunement limits. Copying a paper reference does **not** silently equip/attune an item or reactivate effects disabled when its magic row was cleared. Those choices stay explicit in the magic-item menu. Full source free-text recognition, unknown items, catalogue/base-gear choices and all other footer editing/move branches remain separate parity work. This checkpoint connects the owned-reference Copy action, not the complete source footer menu.

No Firestore/Storage rule, index, schema version or migration. The existing bounded private paperMagic/paperInventory records are reused. Physical stock and shared equipment effects remain unchanged.

Validation: pure reuse/first-empty/full/missing-ownership cases; connected original arrows, full refusal, hidden restore and correct repeated-continuation focus, Single/All sheets, private persistence, actual PDF, clear cancellation/confirmation, retained physical/equipped/attuned/resource state, mobile/axe and stale controls. Existing Gear, magic-row, footer-layout, navigation and continuous-page checks cover shared behavior.
