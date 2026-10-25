# Extra Attack and multiclassing

Combat and Overview show the character’s attack allowance inside the existing attack area. It is derived from assigned class levels and source-compatible subclasses. Print uses the same result. Characters without a supported allowance above one receive no additional panel.

| Source | Required class level | Attacks per normal Attack action on your turn |
| --- | --- | --- |
| Fighter, either edition | 5 / 11 / 20 | 2 / 3 / 4 |
| Barbarian, Monk, Paladin, Ranger | 5 | 2 |
| College of Valor, College of Swords | Bard 6 | 2 |
| Bladesinging / Bladesinger | Wizard 6 | 2 |
| Armorer, Battle Smith — legacy or revised Artificer | Artificer 5 | 2 |
| Thirsting Blade with Pact of the Blade | Warlock 5 | 2 with the pact weapon only |
| Revised Devouring Blade with valid Pact of the Blade and Thirsting Blade | Warlock 12 | 3 with the pact weapon only |

Multiclass counts never add together. Fighter 11 / Paladin 5 has **3**, not 5. Warlock 12 / Fighter 8 has **2 with ordinary weapons and 3 with the pact weapon**. Fighter 11 / Warlock 9 still has 3 with either; Thirsting Blade does not reduce or add to the higher Fighter allowance.

The supported subclass IDs are explicit in `CharacterAttackProgression.subclasses`. Source checks reject modern subclasses on a 2014 sheet, wrong-class subclass IDs and mismatched Artificer rulebooks. Existing legacy subclasses remain compatible with 2024 core rules where the app already supports them. The legacy Bladesinging entry is labelled SCAG; this change does not silently add the Tasha’s revision’s cantrip replacement.

Pact prerequisites must actually qualify in the current, unlocked invocation slots. A saved Devouring Blade name without valid Pact of the Blade and Thirsting Blade cannot grant extra attacks. Pact counts are shown separately rather than assigned to every weapon: choosing/binding the actual pact weapon remains part of the later Pact workflow.

## Scope and restrictions

The readout covers a normal **Attack action on your turn**. It does not multiply damage, Eldritch Blast beams, spell actions, Flurry of Blows, offhand/Light-weapon attacks, Opportunity Attacks, readied attacks outside your turn or monster Multiattack. Roll and resolve each attack separately. Loading, the 2014 Net and limited actions such as Haste can impose stricter limits. Action Surge can supply another eligible action; it does not change attacks per action.

Subclass cantrip/spell replacements and other conditional extra attacks still resolve under their own feature rules. No resource is spent by this readout and no weapon ownership/proficiency is granted.

Counts follow actual assigned class levels. Unassigned character levels, duplicate class rows and overflow beyond the character level do not manufacture a higher allowance. Removing a source removes its allowance without deleting saved choices or attacks.

Class-reference printing also now passes the selected Artificer rulebook to the existing reference/choice helpers. This prevents a revised Artificer’s printed builder from showing legacy Tool Expertise and class features.

## Verification

Engine tests cover every base class at levels 1–20 in both core editions, every supported subclass’s threshold/source, multiclass order and non-stacking, Warlock prerequisites, unchanged per-attack/spell damage, malformed input and save-envelope parity. Browser checks exercise level changes, save/reopen, Overview/Combat/print, source-correct Artificer references, 320/390/1440px layout, one contextual help button and accessibility.

Sources: official [2014 classes](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes) and [2024 multiclassing](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character). Subclass level/source facts were cross-checked against the class reference data for [Artificer](https://github.com/5etools-mirror-3/5etools-src/blob/main/data/class/class-artificer.json), [Bard](https://github.com/5etools-mirror-3/5etools-src/blob/main/data/class/class-bard.json) and [Wizard](https://github.com/5etools-mirror-3/5etools-src/blob/main/data/class/class-wizard.json). Descriptions are concise original summaries.

No new stored character fields, Firestore/Storage rules, catalogue publication or data migration are required. Guide and contextual help explain the readout and its limits. No production action is performed.
