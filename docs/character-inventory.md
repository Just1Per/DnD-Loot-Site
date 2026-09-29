# Character inventory

The Inventory tab adds basic gear and packs directly to the opened character's private sheet. It no longer creates campaign stock. Players and the campaign DM can edit the character's gear; existing campaign inventory permissions remain unchanged.

- Choose specific gear, a background equipment selection, an equipment pack, or a custom item. Save the sheet to persist it.
- Packs expand into editable rows. Choice placeholders need a selection; starting coin entries are reminders to update the coin fields. Adding a pack does not charge coins or enforce a starting-equipment budget.
- Rows contain name, quantity, weight per item, line total, storage location, and a carried checkbox. Zero weight may need filling in for a background placeholder or custom item.
- The top Armor and Shield dropdowns equip owned items or add and equip standard gear. The live shield badge shows AC with a DEX/armor/bonus breakdown; selecting armor activates automatic AC. Special class/spell AC formulas still use manual settings.
- Personal gear can be equipped in the details below the ledger. Recognized weapon and armor names use the existing attack/AC engine. Uncarried or depleted personal gear grants no equipment benefit.
- Campaign loot appears alongside personal gear, retaining full cards and existing consume/return/DM controls. It is not copied into editable personal rows. Campaign stock is unchanged by personal gear edits.
- Coins, carried weight and attuned items appear in a side column. Unknown campaign weights are flagged. Coins use 50 per pound. Containers are descriptive storage locations, not automatic weight-reducing magic bags; carrying-capacity traits and encumbrance penalties remain manual.

## Deploy

Publish this branch's full `firestore.rules` before saving. Schema 11 adds up to 200 private personal-gear rows and prevents older clients from overwriting them. No Functions or database import is required. Older sheets open with an empty personal-gear list; free-text equipment notes remain intact.

Reference data includes the supplied PDF's base gear, packs, weapon and armor weights, with editions labelled. Labels describe source data; the character's selected edition still drives equipment mechanics.

Automated checks cover direct player additions, unchanged campaign stock, coin preservation, quantities/weights/locations/notes, equipment benefits, uncarried gear, pack expansion, save/reopen, removal, privacy and schema downgrade protection. Review the responsive/printed layout on the Firebase preview before merging.
