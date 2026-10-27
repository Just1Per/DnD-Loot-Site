# Base Monk Martial Arts

The existing **Add attack / action** picker now calculates base Monk Martial Arts for Unarmed Strike and eligible Monk weapons. No additional controls panel is added. Automatic ability uses the higher Strength/Dexterity modifier; an explicit ability selection remains an override. The attack references stay saved as references, so values update when class level, source, scores or worn/readied equipment changes.

| Actual Monk level | 2014 die | 2024 die |
| --- | --- | --- |
| 1–4 | 1d4 | 1d6 |
| 5–10 | 1d6 | 1d8 |
| 11–16 | 1d8 | 1d10 |
| 17–20 | 1d10 | 1d12 |

Martial Arts applies only without worn armor or a wielded shield, while unarmed or wielding only Monk weapons. Overview explains when a physical condition disables the automatic benefit. The equipment list uses the same equipped/readied interpretation already used by Fighting Styles; packed weapons do not block it.

- **2014 base weapons:** Shortswords and Simple Melee weapons without Heavy/Two-Handed. A Versatile staff or spear remains eligible when used in two hands.
- **2024 base weapons:** all Simple Melee weapons plus Light Martial Melee weapons. This includes Greatclub and Scimitar; ranged weapons do not become Monk weapons merely through proficiency. Existing Light-martial proficiency handling is retained rather than granting new proficiency indiscriminately to multiclass Monks.

Damage uses the Martial Arts die when better than the existing normal/Versatile die. Multiple-die values are compared by their average, and unrecognized formulas remain untouched. Magic bonuses, attunement, damage types, offhand modifier rules, Fighting Styles and explicit ability choices are retained. Thrown attacks with a qualifying melee Monk weapon retain their range and benefit. Basic Unarmed Strikes remain melee even if an obsolete saved mode says Thrown. Improvised/spell attacks do not gain the weapon benefit.

Unarmed action notes explain the **2014 Attack-action prerequisite** for the Bonus Action strike and the **2024 independent Bonus Action strike**. Revised notes also show the separate Strength and Dexterity Grapple/Shove save DCs. These reminders do not grant additional Attack-action attacks, spend Focus/Ki, resolve targets or let one Bonus Action be spent twice with Flurry of Blows.

Overview has a short derived summary; the Guide and printable Combat page explain the conditions. The action picker, owned-weapon attacks, saved automatic actions and print use the same calculation. Normal HP, ability scores, resources and manually entered attack formulas are not rewritten.

## Scope and verification

This is base-class automation. Kensei, optional Dedicated Weapon, Astral Self, racial natural-weapon damage/types and other exceptions require their own source choices or overrides; they are not inferred merely from proficiency or a weapon’s name. Level-6 empowered/magical strike features and target/action resolution remain separate work. The class audit remains partial, not a claim that every Monk/subclass feature is complete.

Thirteen focused engine cases cover both editions at every level 1–20, all shipped weapon profiles, stronger normal/Versatile/custom dice, armor/shield/readied/packed weapons, multiclass caps, manual/negative ability values, magic attunement, thrown/offhand attacks, Dueling/Two-Weapon Fighting, saved envelopes and no mutation. Real-browser checks exercise the actual picker, manual/automatic ability choices, save/reopen, source change, armor suppression/recovery, level-17 scaling, print, mobile and accessibility. Existing equipment/actions and Ki/Focus regressions remain required.

**Firebase:** no new Firestore/Storage rules, saved schema, migration or production deployment. All effects are derived from existing fields.

Primary rules checked 26 October 2026:
- [Legacy Monk — Martial Arts and class table](https://www.dndbeyond.com/classes/11-monk)
- [2024 Monk — Martial Arts and class table](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)
