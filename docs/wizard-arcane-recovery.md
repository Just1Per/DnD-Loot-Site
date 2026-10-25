# Wizard: Arcane Recovery

Combat’s existing resource panel now has one compact recovery workflow. Expand **Choose slots to recover**, choose the full set of expended slots, then **Recover selected slots**. The selected slot counts and the feature’s used flag change together; Save retains both. Print includes remaining uses and the current class-level budget. Guide and hover/focus field help explain the controls.

The budget is half the character’s **actual assigned Wizard levels, rounded up**. It does not use total character level, proficiency bonus or unused/unassigned levels. Level-6+ slots are excluded. Eligible ordinary and Pact slots share the same recovery budget but keep separate spending counters. No HP, temporary HP, conditions or other class pools change.

Using less than the available budget still consumes the one activation. It cannot be split across subsequent rests. Invalid counts, over-budget choices, unavailable slots and unknown pool IDs leave state untouched. There is no generic Use/Undo control that could restore the feature while retaining recovered slots.

## Edition and recovery

- **2014:** use once per in-game day after a Short Rest. **New day · reset recovery** only becomes available after use. Press it when the table advances to the next day; it resets this feature without changing slots. A generic Short/Long Rest does not silently advance the campaign calendar.
- **2024:** use after a Short Rest; finishing a Long Rest restores eligibility. Another Short Rest alone does not.

The user confirms that the eligible rest/day has occurred, as with the existing rest controls. Changing editions preserves independent used flags. Class-reference metadata also reflects the source-specific timing, including stale remote reference imports.

## Verification

Engine tests cover both editions and levels 1–20, complete plan validation/atomicity, level-6+ rejection, ordinary/Pact slot isolation, class-level caps and duplicates, finite activation, source changes, resets and the existing save envelope. Browser tests cover budget feedback, no premature slot mutation, save/reopen of both slot kinds, print, source timing, mobile targets and accessibility.

This implements Arcane Recovery, not a complete Wizard audit. Spell Mastery, Signature Spells, source/subclass exceptions and the remaining spellbook workflows need separate review.

Source facts checked against the official [2014 Wizard](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Wizard](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Descriptions here are concise original summaries.

No Firestore/Storage rule changes, deployment or migration required. Slot counters and the existing class-feature string-array save envelope carry the state; no top-level stored fields are added.
