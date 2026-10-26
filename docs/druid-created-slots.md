# Druid: created spell slots

Combat → Wild Shape → **Create a spell slot with Wild Shape** adds the two 2024 class conversions:

- **Wild Resurgence, actual Druid 5:** one Wild Shape use creates one extra level 1 slot, once per Long Rest.
- **Nature Magician, actual Druid 20:** choose 1–4 unspent Wild Shape uses to create one slot of level 2/4/6/8, respectively, once per Long Rest. Its limit is separate from Wild Resurgence.

These conversions take no action. They work even when ordinary slots are full. Cost, resulting slot level, availability and the feature's own limit are visible before applying. Payment and creation are committed together; invalid, insufficient or over-capacity choices spend nothing. Generic Wild Shape Undo cannot refund them. Actual capped class levels and edition apply; the 2014 base class does not gain these features.

## Explicit table rule

**The user chose the house rule that created Druid slots expire at Long Rest.** The Druid source does not explicitly specify that lifetime. The UI, Guide, print and tests identify the agreed rule; this is not presented as a quoted universal source rule.

Short Rest, initiative and turn resets retain created slots and both creation limits. Long Rest clears ready and spent created slots and both creation limits, including after source/class changes. Existing rest controls retain their stated scope: Combat restores feature uses without restoring ordinary/Pact slots; Spells restores its slot pools without automatically restoring Wild Shape. Both record a Long Rest and expire the created pool. Catalogue Long Rest actions also apply expiry.

## Separate slot pool

**View created slots in Spells** opens the extra pool. Each record shows its level, feature source and availability. **Use created slot** records spending; **Undo slot use** corrects only that slot record. It does not undo a spell effect, dismiss a familiar, refund Wild Shape or undo another feature. Ordinary slot maxima/usage and the independent Pact counter are retained. Optional Overview slot display and print include the extra pool.

Created slots can also pay Wild Companion, the own-turn Wild Resurgence recovery and 2024 Bard Font of Inspiration. Wizard Arcane Recovery can recover eligible spent created slots below level 6 within the same activation budget; higher-level created slots remain excluded. All consumers preserve the pool identity. The app's usual manual use/correction controls are records, not a global cast/target resolver.

## Persistence and verification

Records use the existing class-choice string-array map. Each legal level has one ready/spent record: level 1 from Wild Resurgence and one of 2/4/6/8 from Nature Magician. The independent activation flags prevent repeated creation. Unknown/malformed nonempty records cannot grant available slots and clear at Long Rest. Capacity checks precede resource mutation, including mixed Arcane Recovery plans.

Tests cover both editions and levels 1–20, exact costs and output, full ordinary slots, independent limits, save/reopen, source changes, corruption/capacity failures, slot Use/Undo, the four supported consuming/recovery paths, active familiar lifetime, rest controls, optional Overview, print, keyboard focus, responsive sizing and accessibility.

**Firestore and Storage rules are unchanged. No migration or production deployment is required.** This does not claim the complete Druid/subclass audit is finished. Longevity remains a reference reminder.

Source: [2024 Druid: Wild Resurgence and Archdruid](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). The Long Rest expiry is the explicit table decision above.
