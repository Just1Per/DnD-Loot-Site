# Fighter feature resources

Combat now tracks Fighter resources from their actual class levels. Overview and print show the counts and recovery, while Combat explains each feature's current effect.

| Feature | 2014 | 2024 |
| --- | --- | --- |
| Second Wind | 1 use from Fighter 1; Short or Long Rest restores it | 2 uses from Fighter 1, 3 at 4, 4 at 10; Short Rest restores one use, Long Rest restores all |
| Action Surge | 1 use at Fighter 2, 2 at 17; Short or Long Rest | Same limits; reminder excludes the Magic action |
| Indomitable | 1 use at Fighter 9, 2 at 13, 3 at 17; Long Rest | Same limits; add actual Fighter level to the reroll |

Second Wind displays `1d10 + Fighter level` healing. Revised Tactical Mind gets a dedicated success-spend button from Fighter 2 using the same Second Wind pool; if the improved check still fails, no use is spent. The button's status message explains Undo for a mistaken spend. Revised Tactical Shift adds its Bonus Action movement reminder from Fighter 5, explicitly separate from Tactical Mind.

Use/Undo stops at the counter limits. Action Surge's once-per-turn restriction is a reminder; the app does not infer table turns. Rolls, movement, action choice and healing resolve at the table. Counters do not alter HP or apply Indomitable/Tactical Mind as permanent save/skill bonuses.

Rest recovery stays independent in a multiclass build. Monk points recover on Short/Long Rest, Flash of Genius on Long Rest, and revised Second Wind regains just one use on Short Rest. A saved over-cap Second Wind spend is preserved after level reduction until the player acts; Short Rest then grants the correct one available use within the current maximum. Inactive class/edition spending is retained.

The existing class-choice save fields store use counts. Source-specific keys keep legacy and revised pools separate. The Guide and resource section help explain the controls. The custom Tactical Mind button retains keyboard focus after use; controls share the existing mobile grouping and 44px targets.

Tests cover all Fighter thresholds at levels 1–20 in both editions, finite spend/undo, source-specific partial/full recovery, unchanged saves/skills, multiclass caps, mixed resource pools, over-cap recovery, source/class changes and save-envelope parity. Browser checks exercise real counters, shared Tactical Mind spending, focus, exhaustion, rest, save/reopen, Overview/print, source switch, mobile and accessibility. Existing Monk and Artificer regressions verify the shared renderer.

Sources: [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 Basic Rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), Fighter feature tables and Second Wind/Action Surge/Indomitable/Tactical Mind/Tactical Shift. Mechanical facts with original interface summaries.

No Firestore/Storage rule changes, deployment or data migration.
