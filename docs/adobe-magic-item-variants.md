# Original magic-item choices — v64

PR #250, equipment backlog point 3. This checkpoint connects the original choice branch for **Belt of Giant Strength** and **Ring of Resistance**, read statically from `ListsMagicItems` in the supplied MPMB 13.0.4 PDF. No Acrobat code is executed. It does not complete all magic-item catalogue/base-gear menus.

## Original choices and effects

Belts offer Hill 21, Frost 23, Stone 23, Fire 25, Cloud 27 and Storm 29, with original rarity labels. The existing ability-override engine applies that STR while worn and attuned, preserving a higher natural score. Ordinary attacks and carrying calculations consume the same resulting ability. Rings offer Acid, Cold, Fire, Force, Lightning, Necrotic, Poison, Psychic, Radiant and Thunder. The existing resistance engine applies the selected type while worn and attuned. Both generic parent items now correctly require attunement before a variant is chosen. Shared attunement limits and class-specific limits remain authoritative.

## Native interaction

The original magic-row popup has a compact Choose item variant disclosure. A generic item without a saved type opens it initially. Readable searchable choices are available for the supported families, including already specific source names. Selection only previews the resulting character STR or resistances and whether item effects are active. Apply asks for confirmation; Cancel/closing leaves the current data intact. Wearing and attunement remain explicit existing controls. Save sheet persists the selected type; Single/All sheets, Standard calculations, source print and item references use the same selection. Use original item removes the private override and restores the current catalogue/personal source, including a specific source variant.

## State and safeguards

The bounded optional `magicVariant` key is normalized in the existing `equipmentState.loadout` row, keyed by owned inventory identity. It is independent of the old UI and of paper row position. Projection produces a read-only effective item name/rarity and a short selected-variant property, preserving explicit mechanics, recorded weight, original descriptions and actual ownership. Catalogue/inventory/personal records are unchanged. Equip/attune controls and quantities/HP/coins/slots/uses are retained.

Only the matching supported source family can receive a choice. Missing ownership, zero quantity, forged values and selection-limit overflow refuse atomically. Retained choices are inactive when the item disappears or changes to another family. Duplicate raw choices follow the same first-record rule as equipment normalization. Repeated projection unwraps its original source, so overrides do not accumulate or prevent reset. Magic-menu guards compare the original records too, detecting source changes hidden by the selected display name while confirmation is open.

No new Firestore/Storage rule, schema version, index or production migration. Existing private sheet access/revision rules apply; permission tests save/reload the new optional choice and deny unrelated readers/writers. No global default change or old-interface removal.

## Validation and remaining scope

Unit tests cover all sixteen source effects, both editions, higher natural STR, multiclass weapon totals, normalization/round trips, duplicate/invalid input, projection/reset, missing/changed source and attunement limits. Connected browser coverage includes real searchable choices, preview/Cancel/Apply, active/inactive effects and fourth-item rejection, Save/reopen, Standard equivalence, unchanged records/resources, actual PDF, mobile/axe and stale confirmation. Shared engine/DOM, relevant item/weight/armor/companion controls and unchanged permission checks are run before publication.

Other item families, armor/weapon base-gear variants, full catalogue application, remaining footer operations, companion transfers, attuned-checkbox visibility and units remain open in point 3. The complete original-PDF audit is still required before Adobe replaces the old interface.
