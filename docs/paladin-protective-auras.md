# Paladin: own protective auras

From actual Paladin 6, Saving throws includes the character’s own **Aura of Protection** once, using the final current Charisma modifier with a minimum +1. It is not proficiency and does not change skills, attacks, spell DC or AC. Range is 10 ft, increasing to 30 ft at actual Paladin 18. A multiclass dip or duplicate class rows cannot unlock or stack it.

The existing Saving throws section has a compact **Apply my aura when available** checkbox. It defaults on; save/reopen retains a manual suppression independently per edition. Use it for table restrictions not represented by recorded conditions, or when replacing the own-aura contribution with another Paladin’s aura through the existing manual adjustments. Do not add the same aura again as a manual save bonus.

## Condition differences

- **2014:** the source requires consciousness. Recorded Unconscious disables the aura; Stunned alone does not.
- **2024:** recorded Incapacitated, or the named conditions that imply it (Unconscious, Stunned, Paralyzed, Petrified), disable it.

Detection uses recognised condition names separated by commas, semicolons, pipes or newlines; a trailing parenthetical duration is allowed. Free-text prose such as “not stunned” or an immunity note is not treated as a positive condition. Use the manual checkbox for other situations. HP 0 alone does not invent unconsciousness: exceptional class effects can allow consciousness at zero.

From actual Paladin 10, the source-specific **Aura of Courage** availability/range reminder appears too. It does not delete an existing Frightened condition record, propagate conditions to allies or automatically alter other characters. Competing Aura of Protection bonuses do not stack; other sources and spatial eligibility remain table-resolved.

## Totals and visibility

The derived bonus is included in all six saves, including the Constitution save used for Concentration, and in the death-save contribution while the own aura is available. Existing training, item contributions and manual adjustments are preserved. Overview and print show the same values and aura state. Death-save labels now describe the total bonus, rather than calling a combined contribution proficiency.

Guide and hover/focus help explain the checkbox; there is no new per-field question-mark badge. The existing layout and navigation remain unchanged.

## Validation and scope

Tests cover both editions and levels 1–20, minimum/final Charisma, feat-derived ability changes, source-specific conditions, manual suppression, save/reopen, class/level caps, nonstacking duplicate rows, preservation of other values, Monk death-save coexistence, print, mobile and accessibility. The all-class/multiclass save-envelope matrix includes the new derived aura readout.

This implements the own-aura contribution and conditional Courage reminder. Allied-character automation, map range/cover, subclass auras and remaining Paladin features require separate review.

Sources: official [2014 Paladin](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Paladin](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Descriptions are concise original summaries.

No Firestore/Storage rule changes, production catalogue publication, deployment or migration required. The suppression preference uses the existing class-feature string-array envelope; the calculated aura fields are not new top-level stored fields.
