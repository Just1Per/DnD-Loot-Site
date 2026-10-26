# Druid: Wild Resurgence recovery

From actual **2024 Druid level 5**, Combat's existing Wild Shape resource has a compact **Regain Wild Shape with a spell slot** disclosure. It converts exactly one available spell slot into one Wild Shape use only when the Wild Shape pool is empty. Higher-level slots still restore one use. Ordinary Spellcasting and Warlock Pact Magic are separate payment options; unrelated slots are retained.

This takes no action and does not cast a spell. It can be used while already in Wild Shape and does not replace the active form, alter its HP, dismiss a familiar or change the character's HP/equipment/spell selections.

## Own-turn limit

The player confirms **This is my own turn**. A successful conversion records the once-per-own-turn limit and spends the selected slot together; it cannot be undone through the generic Wild Shape correction button. **Start my next turn** clears only that limit and should be used when the next own turn begins. It does not restore Wild Shape, spell slots, HP or other feature resources. The app does not infer turn ownership from a wall clock or a separate encounter.

The recorded limit survives save/reopen and class/edition changes. Explicit turn and Long Rest events clear it; Short Rest/initiative do not clear it. An ordinary Short Rest still restores the source-correct Wild Shape use independently. Both Combat's feature reset and Spells' slot-only Long Rest reset clear the limit, as do the established catalogue Long Rest controls. Each existing rest control retains its stated scope.

## Persistence, permissions and scope

Uses the existing normalized class-choice string-array map, ordinary slot fields and independent Pact counter. Payment updates the stored ordinary maximum before normalization, or the established separated Pact marker. Availability/caps, exact payment, acknowledgement and choice-map capacity are checked before any mutation. Source/class level caps and duplicate prevention use the same actual Druid levels as Wild Shape. Existing source records and manual companion cards remain intact.

**No Firestore or Storage changes, migration or production deployment are required.** The 2014 base class is unchanged. Guide, inline hover/focus help and Combat print explain the supported conversion without extra question-mark badges on repeated fields.

This implements the spell-slot-to-Wild-Shape direction. The separate [created-slot controls](druid-created-slots.md) now implement Wild Resurgence slot creation and level-20 Nature Magician. This recovery control remains distinct: creating a slot has its own Long Rest limit and does not clear the once-per-own-turn recovery limit.

Tests cover levels 1–20, source gates, ordinary/higher/Pact payment, exhaustion, atomicity/capacity, own-turn repetition, resets, capped multiclass assignments, active form/familiar conservation, actual save/reopen, print, loading boundaries, mobile layout and accessibility.

Source: [2024 Druid — Wild Resurgence](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes).
