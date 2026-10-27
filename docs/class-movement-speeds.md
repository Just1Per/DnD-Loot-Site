# Monk and Barbarian walking speed

The existing Overview Speed metric now includes permanent class movement bonuses. **Movement breakdown** below the metrics is collapsed by default, works with the keyboard and explains the calculation and any blocking equipment. Combat print includes the same source explanation. The header Guide and Speed help explain where to find it.

| Actual class level | Walking-speed bonus |
| --- | --- |
| Monk 1 | None |
| Monk 2–5 | +10 ft |
| Monk 6–9 | +15 ft |
| Monk 10–13 | +20 ft |
| Monk 14–17 | +25 ft |
| Monk 18–20 | +30 ft |
| Barbarian 1–4 | None |
| Barbarian 5–20 | +10 ft |

Both 2014 and 2024 use these tables. Monk Unarmored Movement requires no worn armor and no readied shield. Barbarian Fast Movement permits light/medium armor and shields, but not Heavy armor. Equipment's existing physical loadout determines these conditions, even when AC is entered manually or a magical suit lacks attunement. Packed, removed and zero-quantity items do not block a bonus.

The two class bonuses combine only when each is eligible. Actual class assignments are capped by character level; duplicate assignments cannot grant another copy. Live assignments take precedence over an old save envelope. No saved base speed, class choices, ability scores or HP are rewritten.

Item walking-speed minima apply to the class-adjusted speed. A 2014 Halfling Monk 2 has 25 + 10 = 35 ft with Boots of Striding and Springing, rather than an incorrect 30 + 10 = 40 ft. A supported magical climbing speed tied to walking speed follows the resulting total.

## Scope and sources

This change automates the permanent walking-speed part of the two base-class features. Ranger Roving, Monk vertical/liquid movement permission, temporary speed effects, armor Strength penalties, conditions and alternate forms require their own source-specific work. The complete Monk Unarmored Movement feature therefore remains **partial** in the audit. This is not a general movement/condition simulator.

The table and armor restrictions were verified against the pinned Wizards SRD 5.1/5.2.1 imports at Open5e revision `0acbf263c74caf8ad080af7a16d86d3700a1ac8f`:

- [2014 feature text](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/ClassFeature.json) and [class table values](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/ClassFeatureItem.json).
- [2024 feature text](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2024/ClassFeature.json) and [class table values](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2024/ClassFeatureItem.json).

The legacy pinned import previously omitted Unarmored Movement because all its unlock entries were table-column values. The importer now retains its first unlock at level 2. Older remote catalogues receive the same missing-entry correction without mutating their records or duplicating an existing feature.

Eight engine cases cover levels 1–20 in both editions, armor/shield/attunement/manual-AC distinctions, multiclass caps and combination, item minima and climbing, saved envelopes and unchanged data, and stale-reference correction. The real-browser check covers keyboard disclosure, shield gating, source/multiclass totals, save/reopen, saved base preservation, print, 320/390/1440px layout, 44px disclosure target and accessibility.

No new persisted fields, Firestore/Storage rules, migration or production deployment are needed or performed.
