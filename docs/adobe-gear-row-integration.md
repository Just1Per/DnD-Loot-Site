# Original Gear row operations — v58

Follow-up to v57 / PR #250, equipment backlog point 3. Native row controls retain the original source fields and shared private character save. This checkpoint does not complete catalogue placement, page/companion transfers or full equipment parity.

Static reference: `MakeInventoryLineMenu`, `InventoryLineOptions`, `InvInsert`, `InvDelete` and `AddToInv` in the supplied PDF's Functions1. Exported page 2 has 54 Gear rows; page 3 has 36. Each column has 18. The Attuned Magical Items footer reserves index 50 for its heading and 51–53 for three item references. The current companion template export contains no Gear fields; companion equipment needs a separate source/layout review before transfers are offered.

The pure draft operations retain name, amount, unit weight, location and an opaque stable reference together. Move swaps adjacent records, including between columns; it cannot cross the footer heading. Insert shifts only to the first empty row below within the section and refuses a full section. Delete compacts only the current column; Clear leaves its position blank. Footer operations retain the heading and ordinary gear. Column moves refuse a full destination atomically instead of the original AddToInv fallback spilling into another column or losing a deleted source. Blank and zero numeric fields remain distinct; decimal comma is accepted; expressions are not executed.

## Connected controls and protection

Original Adventuring Gear/Extra Equipment arrows and Enter/double-click on their name, amount or weight open the native menu over Adobe. Top Save/Done remain visible on mobile. Change item and Edit fields start collapsed for populated rows. The owned selector uses the same light searchable Adobe picker; an already visible owned reference swaps positions, while a cleared reference can be restored without adding physical stock. Full source Gear/Tool catalogue placement remains separate work.

Move/Insert/Clear/Delete/column operations preserve stable physical and copied references, source field values and explicit blank positions. Delete also works on a blank gap. Clear/Delete require confirmation and keep physical stock, equipment effects and uses unchanged. Name, amount, unit weight and container/location are private paper overrides; Apply validates the whole field draft before changing anything. An unrelated action cannot discard unapplied field changes silently; Done/Escape discards that local draft. Blank unit weight restores the automatic value, while explicit zero stays zero. Unknown automatic weights stay unknown when an unrelated field is edited. Cancelled confirmations and stale account/session/inventory controls cannot apply.

Private `paperInventory.gearLayout` inside the existing schema-14 grants envelope retains bounded positions, hidden paper references and field overrides. New physical gear joins free automatic positions; missing ownership remains named and unavailable. Copied references keep their independent blank quantities and selected destinations. Footer toggling retains arranged gear and displaces it without discarding owned rows. No Firestore/Storage rule, index, schema version or production migration.

Adobe selected-section totals and original column subtotals/printing use the projected paper fields. Physical Inventory weight keeps the original quantities and unit weights. These two explicit weight sources are documented in v57's Weight Carried settings. Location is retained in the native fields; the supplied rendered pages have no visible Gear Location fields.

## Remaining source operations

- Provide the source Gear/Tool catalogue operation and shared recognition/eligibility. Overwriting a row needs a reviewable confirmation that explains what happens to its previous physical reference.
- Add page transfers only when source and destination can be applied atomically. Review source duplicate-name arithmetic without merging independent physical records just because their names match. Companion records must stay independent.
- Review remaining source footer/magic row actions and new source unit-system/layout variants independently; the ordinary character Gear menu does not imply those are complete.

## Validation

Pure tests cover source four-field operations/boundaries, private reference stability, changed physical ordering/new stock, blank/zero values, unknown/missing ownership, copies/footer, restoration and bounded state. The connected browser test covers isolated field drafts, invalid/decimal edits, selected weight versus physical stock, full-section rejection, confirmations, restored owned selection, Insert/Delete gap behavior, Save/reopen, actual PDF, mobile/axe and stale/detached controls. Existing item information remains available from Read full item description inside the menu. Required engine/DOM, full Adobe, packaging and private permission checks apply before publishing this checkpoint.
