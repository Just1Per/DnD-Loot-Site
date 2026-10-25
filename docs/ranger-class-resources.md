# Ranger resources and Hunter’s Mark

The existing Combat resource panel now tracks revised Ranger class features:

- **Favored Enemy / Hunter’s Mark:** 2 free castings at Ranger 1, 3 at 5, 4 at 9, 5 at 13 and 6 at 17. These follow actual Ranger levels, not total character proficiency. Ordinary slot casts do not spend this allowance.
- **Tireless, Ranger 10:** uses equal current Wisdom modifier, minimum one. Temporary HP is 1d8 plus the actual signed modifier, minimum **one total**, not a minimum +1 modifier.
- **Nature’s Veil, Ranger 14:** Wisdom-based uses, minimum one; Bonus Action and Invisible-until-end-of-next-turn reminder.

The three pools have finite Use/Undo and recover on a Long Rest. The buttons leave spell slots, HP, temporary HP and conditions unchanged. Roll Tireless and apply temporary HP in its existing field; temporary HP do not stack. Reduce Exhaustion after the eligible Short Rest and track Invisibility separately. Optional legacy Tasha’s features are not activated by default.

Legacy Ranger 20 instead gains a **Foe Slayer** once-per-own-turn pool, with the current Wisdom modifier and favored-enemy restriction. **Start my turn** restores that use. It never becomes a flat attack or damage bonus.

## Conditional effects and senses

Revised Relentless Hunter at 13 reminds the player that damage cannot break Concentration on Hunter’s Mark; other causes remain relevant. Precise Hunter at 17 applies Advantage only against the marked target. Neither feature modifies every attack or Concentration check.

Feral Senses at 18 uses the correct edition. Revised Rangers get **Blindsight 30 ft** in Senses. Legacy Rangers get a conditional awareness/attack reminder, not Blindsight. Other senses are retained; ranges are not added together.

## Hunter’s Mark is a damage rider

The source catalogue marked revised Hunter’s Mark as a spell attack. Saved actions now correctly say **No attack roll** and show extra damage on a qualifying marked-target hit:

- 2014 spell: 1d6 extra damage on a hit with a weapon attack.
- 2024 spell: 1d6 Force on a hit with an attack roll.
- Revised Ranger 20: the character’s own Hunter’s Mark, including a feat-granted copy uses **1d10** instead.

The cast itself deals no immediate attack damage. Action notes show Concentration and the selected slot’s 1/8/24-hour duration. Class-specific rider notes appear in generated spell sheets, the legacy spell table, saved-spell information and print. A character without actual revised Ranger 20 does not gain the larger die; the shared catalogue is never rewritten.

## Verification and scope

Tests cover both editions and levels 1–20, Wisdom thresholds/minima, multiclass caps, finite spending/recovery, slot/HP isolation, legacy turn recovery, senses, per-class spell riders, source changes, save/reopen and immutable catalogue data. Browser coverage includes action/spell/information/print views, responsive layout and accessibility. Guide and the shared resource help explain conditions and recovery. Shared help is concise; each resource and Guide carry the class-specific details.

Roving movement, legacy Favored Enemy/Natural Explorer choices, optional Tasha’s replacements, subclass features and full target/condition automation still need their own review. This is not a completed Ranger audit.

Sources: official [2014 Ranger rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Ranger rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Text here is a concise original summary.

No Firestore/Storage rule changes, catalogue publication, production deployment or data migration are required. Counters use the existing class-feature string-array save envelope; senses and rider changes are derived.
