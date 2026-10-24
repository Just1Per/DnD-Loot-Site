# Warlock cantrip invocations

Character Builder shows the cantrip choices beside Eldritch Invocations. Overview flags missing configurations and links directly to the fields. Repeated copies of a revised invocation require different named cantrips; one cantrip can have both Agonizing Blast and Eldritch Spear.

| Rules | Agonizing Blast | Eldritch Spear |
| --- | --- | --- |
| 2014 | Automatically adds Charisma to known Eldritch Blast damage rolls | Eldritch Blast range becomes 300 ft |
| 2024 | Choose a known damaging Warlock cantrip; adds current Charisma | Choose a known damaging Warlock cantrip with a base range of 10+ ft; adds 30 ft per actual Warlock level |

The revised range option accepts qualifying save cantrips too; it is not limited to attack-roll cantrips. Touch/Self and 5-foot ranges are excluded. The same named spell in two editions cannot be used to bypass the distinct-cantrip requirement.

Spell sheets show the computed damage modifier and range. Linked actions apply the modifier to supported damage formulas; Eldritch Blast shows the bonus per beam. Damage scaling uses total character level while revised Spear uses Warlock levels. Conditional/weapon-dependent cantrips keep their separate computed invocation modifier without inventing a missing base damage formula.

## Multiclass casting sources

The attack picker labels known spells by class. A spell known by Wizard and Warlock can be selected separately for either source; automatic attacks use that class’s casting ability and revised invocation effects apply only to the Warlock source. Explicit ability overrides remain available. An ambiguous old action keeps its reference and prompts the player to choose a casting class rather than applying a Warlock-only modifier to another class’s spell.

Source-bound actions encode `spell ID::class ID` in the existing string reference field. Older plain spell IDs still work. Editing an old action selects its existing matching source when possible. No new saved action fields or Firebase schema are needed.

Cantrip choices use the existing class feature choice arrays, indexed by invocation slot. Missing spells, removed invocations, lower class levels and inactive choices do not delete stored selections. Base spell ranges and manual spell/ability values are retained. Catalogue loading is shared, failures are escaped and retryable, and a completed request cannot update a different sheet session.

## Verification

Engine tests cover both editions, repeated choices, save-based cantrips, ineligible ranges, multiclass levels/abilities, mixed-class copies of the same cantrip, explicit overrides, edition duplicates, stale choices and save-envelope parity. Browser checks cover real selectors, damage/range readouts, source-labelled attack choices, save/reopen, all relevant print sections, incomplete-build links, loading failure/retry, inline help and responsive accessibility.

Rules references: [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Basic Rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Mechanical facts and original UI descriptions only.

No Firestore or Storage rule changes, production deployment or data migration.
