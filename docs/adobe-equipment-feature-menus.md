# Adobe Add Equipment and Choose Feature — v66

These original second-page buttons now open dedicated Adobe workflows. No Standard page is opened. Their detailed visual structure can be adjusted to the reference screenshots the user will supply.

## Add Equipment

The popup has Specific equipment, Equipment packs, Your background and Custom item. The initial background section matches the selected background's name, source and rules edition. It offers each structured option from the reviewed reference, including legacy fixed items plus separate choices and revised equipment-versus-gold options. Unavailable or unsupported backgrounds show an explanation and retain the other categories; a different background's package is never substituted.

Quantities and unit weights are visible before adding. Generic instruments, artisan tools, gaming sets and holy symbols require a concrete selection. Nested equipment packs expand into physical items. Missing reference weights remain empty until entered, including an explicit 0 for weightless items. Starting coins are a separate checkbox; the coins-only option has its own clear action. A confirmation lists items and coin additions. Physical equipment enters the character's backpack; wearing, attunement and campaign stock are unchanged. Normal Save sheet persists additions.

The new lazy-loaded factual reference is built from the reviewed JSON snapshot at `DeathStalker471/betterR20` commit `0ba85d82acfed1d7d106ebdccb34179fc584e97c`. It contains item/source identities, quantities, weights, reference prices and structured starting choices. No userscript is executed and no book descriptions are imported. Source editions use the site's existing background-source classification. The snapshot covers older supported background sources and the revised core backgrounds; newer books absent from that snapshot remain unavailable.

Reproduce using already reviewed JSON files:

```sh
python3 scripts/build-adobe-starting-equipment.py --items-base /path/to/items-base.json --items /path/to/items.json --backgrounds /path/to/backgrounds.json
```

## Choose Feature

Choose Feature opens a focused version of the existing native class-choice editor, without Class/Level/HP tabs. Its category list contains the current class/subclass's unlocked groups and shared skill/tool/weapon training. The first incomplete group is selected initially. Multiclass rows remain separate; another class's empty heading or unrelated invocation follow-up is not shown in a focused category. Prerequisites, duplicate restrictions, class levels and existing effects stay in the shared engine. Apply/Cancel retains the existing isolated draft contract.

Druid forms is a direct action in this popup, with its Druid-level-2 unlock shown. It hosts the existing Wild Shape component in a dedicated modal over Adobe, focuses known/seen form selection, and restores the component when closed. Creature data, known/seen limits, form uses, active forms, HP and edition/subclass rules retain their shared implementation. Opening the component does not navigate to Standard. Its spell action opens the native Adobe spell picker. Leaving unapplied feature edits for forms asks before discarding them.

## Validation and rollout

The pure starting-equipment tests cover source matching, exact revised/legacy Acolyte choices, concrete tool selection, coin-only options, nonmutation, limits and atomic rejection. Browser coverage includes custom/background additions, explicit coins, Cancel/confirm, maneuvers, Devil's Sight effects, Druid known-form selection/component restoration, private save/reopen, mobile layout and accessibility. Existing native class, editor, inline-choice and Wild Shape checks remain required.

No Firestore/Storage rule changes or production migration are required. Items, coins and feature choices use existing private fields and Save. PR #250 remains a test build for the ongoing complete Adobe replacement; this checkpoint does not complete all original catalogue/effect/menu parity.
