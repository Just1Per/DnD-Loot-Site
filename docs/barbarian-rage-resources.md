# Barbarian Rage uses

Combat's existing **Feature resources** panel now tracks Rage uses from actual Barbarian level. Overview and Combat print show the remaining pool. No new large controls panel is introduced.

| Actual class level | Uses | Rage Damage reminder |
| --- | --- | --- |
| 1–2 | 2 | +2 |
| 3–5 | 3 | +2 |
| 6–8 | 4 | +2 |
| 9–11 | 4 | +3 |
| 12–15 | 5 | +3 |
| 16 | 5 | +4 |
| 17–19 | 6 | +4 |
| 20 | 2014: Unlimited; 2024: 6 | +4 |

**Spend 1 Rage use** and **Undo use** track finite resources. Unlimited legacy uses have no misleading finite-spend controls. Source changes retain each edition's separate history. Ordinary attacks, HP, saves and resistances are not rewritten when a use is recorded.

## Recovery and conditions

- **2014:** Long Rest restores uses. Short Rest, next-turn and ordinary Initiative resets do not. Base Rage lasts up to one minute and retains the legacy end conditions; Persistent Rage from level 15 removes the attack/damage maintenance condition, not the one-minute cap.
- **2024:** Short Rest restores one expended use and Long Rest all. From Barbarian 15, **Initiative · regain all Rage uses** explicitly invokes Persistent Rage recovery once per Long Rest. An ordinary Initiative reset does not consume this optional recovery. Short Rest does not clear its used flag. The flag survives saving and reopening.
- **Rage benefits & duration** explains the edition's Strength-based damage eligibility, current damage bonus, resistance, Strength advantage, Heavy armor, spell/Concentration restrictions and duration. Revised Persistent Rage's level-15 ten-minute duration and Unconscious/Heavy-armor end conditions remain distinct from the base Incapacitated rule.

This is resource automation and conditional reference, not an active-Rage combat state machine. Starting/ending Rage, resolving its duration, applying conditional attack damage/resistance, and subclass spending are still table decisions. The audit deliberately leaves the complete Rage and Persistent Rage features partial.

## Sources and verification

Counters, damage columns and feature text were checked against Wizards' SRD 5.1/5.2.1 data in the same pinned Open5e revision already used by the app, `0acbf263c74caf8ad080af7a16d86d3700a1ac8f`:

- [2014 feature descriptions](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/ClassFeature.json) and [level columns](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/ClassFeatureItem.json).
- [2024 feature descriptions](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2024/ClassFeature.json) and [level columns](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2024/ClassFeatureItem.json).

Eight focused engine tests cover both editions at levels 1–20, finite/unlimited limits, invalid changes, source-specific rest recovery, optional Initiative confirmation and limits, over-cap saved spending, multiclass caps, independent pools, saved envelopes and inactive choices. `test:barbarian-rage` exercises real Combat controls, save/reopen, print, HP isolation, source changes, unlimited uses, mobile layout and accessibility. The top Guide explains the flow.

State uses the existing string-array class-feature-choice map. No Firestore/Storage rule change, new persisted schema, migration or production deployment is required or performed.

## Resource action regression

The complete GitHub browser run exposed a Sorcerer Short Rest click that left the pool at 1/5 instead of 3/5. Reproduction showed the transient Metamagic help popup overlapping the rest button and receiving the click; the resource calculation itself was correct. Hover/focus help now allows pointer actions to reach the controls underneath. Explicitly pinned help remains interactive, and Escape closes it without closing the sheet.

The Sorcerer browser test deliberately displays the real help over the rest action, checks hit testing and uses a raw pointer click before asserting the correct recovery and once-per-Long-Rest limit. It also checks pinned-help interaction and Escape. This regression check does not hide the tooltip, retry the click or change point totals directly.
