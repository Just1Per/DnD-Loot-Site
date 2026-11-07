# Original Gear/Tool catalogue placement — v60

Follow-up to v59, equipment backlog point 3. The source Put Gear/Tool branch is connected to the native character Gear menu. Page/companion transfers and the remaining source magic-item variants/layout options are separate work; this does not finish full equipment parity.

Static review of the supplied PDF's `Base_GearList`, `Base_ToolsList` and `InventoryLineOptions` found 106 Gear choices and 37 separate Tool choices. The existing shared data omitted Tools and normalized 97 blank Gear amounts to physical quantity 1. The new factual JSON preserves the original amounts separately, along with the Tools' names/categories/prices/weights. Three gaming sets have unspecified weights; these remain `null`, not invented weightless items. The static extractor parses a restricted data literal using JSON, never evaluates PDF JavaScript and refuses executable expressions before writing output. Existing packs, story/backgrounds and runtime gear data are unchanged.

`character-paper-gear-catalog.js` produces a local, atomic proposal for private `personalGear` plus `paperInventory`. Source blank amounts display blank and count one under v59's original column rule; ammunition retains its bundled amount/per-unit mass. Put overwrites the selected paper reference while retaining the previous physical item/effects/uses in Inventory. The new item is carried but is not automatically equipped/attuned. Coins, HP, spells, counters and campaign/root catalogue data are untouched. Source placement retains location and container indentation. An unspecified weight requires an explicit value, including 0, before the proposal can be applied. The existing 200-row private inventory cap, bounded identity/weights and protected footer apply.

## Native controls

Open an ordinary Adventuring Gear/Extra Equipment row's original arrow, then expand **Put Gear / Tool on this line**. The grouped, searchable picker previews amount, per-unit weight and reference price before **Add & place on this line**. Selecting a catalogue item is read-only. A populated row asks for confirmation before replacing its paper reference. This stays distinct from **Change item**, which selects already owned equipment.

Original Tools/source-amount facts load only when this section opens. Failed reads offer Retry; successful static facts are reused across characters without retaining private data. Three gaming sets have unspecified weights and require an explicit value, including 0 if appropriate. The original reference is 2014 equipment and follows the campaign's enabled editions; an excluded catalogue explains why while owned choices remain available. Eligibility is checked again after confirmation. Stale identity/inventory/session dialogs cannot apply, and closed responses do not rebuild an abandoned menu.

The same private Save sheet keeps both the owned item and source placement. Shared equipment calculations recognize the new personal gear; adding it does not grant tool proficiency or automatically equip/attune it. Current coins, HP, spells, feature/item uses and ammunition counters stay unchanged. Original source blank amounts remain blank on paper and count one under v59's column rule; bundled ammunition retains its amount and unit weight. Actual source printing includes the new rows.

No Firestore/Storage rule, schema version, index or production migration. The existing private `personalGear` and schema-14 grants envelope are reused; campaign/root stock and images are not modified.

## Validation

Pure checks cover the complete source list, eligibility, blank/bulk/zero quantities and weights, atomic overwritten references with retained stock, source location/indentation, unknown weights, limits/identity/footer protection and rejected executable input. The connected browser flow covers delayed metadata loading/retry/cache, real searchable choices, preview/Cancel, confirmation/placement, unknown-weight correction, source versus physical weight, retained resources/training, Save/reopen, campaign policy revocation before and during confirmation, actual PDF, mobile/axe and stale controls. Full engine/DOM, connected Adobe and private persistence checks remain required before publishing.

Focused verification: `node --test tests/character-paper-gear-catalog.cjs` and `node tests/adobe-gear-catalog-browser.cjs` with the normal browser prerequisites. The original source scripts/filled character data stay outside the repository; only factual equipment fields are generated.
