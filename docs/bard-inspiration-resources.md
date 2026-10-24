# Bardic Inspiration and recovery

Combat now tracks a shared Bardic Inspiration pool using current Charisma (minimum one use), with an inspiration die based on actual Bard levels: d6 at 1, d8 at 5, d10 at 10 and d12 at 15. Give inspiration spends one use; Undo reverses it. The source reminder distinguishes the 2014 ten-minute/before-outcome rule from the 2024 one-hour/after-failed-test rule, and reminds players that a creature can hold only one inspiration die at a time.

Both editions regain all uses on a Long Rest. Font of Inspiration adds Short Rest recovery from Bard 5. Revised Font also provides a slot picker: expend one available ordinary or Pact Magic slot to regain one expended inspiration use. Any slot level restores one use; no action is required. The slot and inspiration count change together and are retained by Save sheet. Full pools and exhausted slots cannot be converted.

Superior Inspiration follows the selected edition:

- 2014, Bard 20: regain one use on Initiative only when empty.
- 2024, Bard 18: regain expended uses on Initiative until two are available, bounded by the current pool maximum.

Initiative recovery uses current derived Charisma, including supported origin, feat and item changes. It does not reset Fighter, Monk or Artificer resources. Uses above a reduced maximum remain saved until the player spends, undoes or deliberately recovers. Class and edition changes preserve inactive spending rather than overwriting it.

Overview and printed Combat pages show remaining uses, die and recovery. Guide and the existing resource section help explain the flow; the Font slot field uses inline hover/focus help. Controls retain mobile grouping and 44px targets. The recipient rolls and applies their die at the table; this does not write inspiration tokens into other players' sheets.

Engine checks cover levels 1–20 in both editions, use limits/die progression, finite spending, Font thresholds, Superior recovery, current Charisma, mixed-class recovery, save-envelope parity and ordinary/Pact slot exchange. Browser checks exercise the real controls, exhausted/full states, rest/Initiative, both slot types, save/reopen, Overview/print, source switch, mobile and accessibility. Other class-resource browser regressions verify shared rendering/reset behavior.

Sources: [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 Basic Rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), Bardic Inspiration, Font of Inspiration and Superior Inspiration. Original interface summaries of mechanical facts.

No Firestore/Storage rule changes, deployment or data migration.
