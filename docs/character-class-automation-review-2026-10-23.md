# Character class automation review — 2026-10-23

Reviewed main `48d12f9`, after Expertise/languages #198. This is a runtime/code review of core class training, choices and shared progression across the thirteen offered class IDs. It is not an assertion that every feature in every sourcebook/subclass has been source-verified or automated. Reference descriptions and display pins alone do not constitute automation. The historical Adobe scan remains a discovery inventory.

## Verified behavior and gaps

| Class | Present in the engine | Remaining checks or gaps |
| --- | --- | --- |
| Artificer (2014 source) | Class training, half-caster progression, Tool Expertise reminder | Tool checks are manual; infusion choices and source-specific subclasses need dedicated coverage |
| Barbarian | Starting/multiclass training; unarmored AC alternative | Rage conditions, uses, damage and subclass choices require a separate mechanics pass |
| Bard | Starting skills, spell progression; edition-aware Expertise choices | **Confirmed:** Jack of All Trades is absent from automatic skill/initiative calculations |
| Cleric | Starting/multiclass armor training, spell progression; Knowledge expertise reminder | 2024 Divine Order selection and its skill modifiers are not registered in the class-choice engine |
| Druid | Druidic in Overview, class training/spells; Wild Shape uses character training | 2024 Primal Order selection/modifiers are not registered; Wild Shape is not complete combat resolution |
| Fighter | Starting training, class Fighting Style registry, Battle Master maneuvers, supported equipment effects | Fighting Style entitlement vs manually selected feats and additional subclass choices need review |
| Monk | Training and unarmored AC alternative | Martial Arts, Focus/Ki resources, conditional effects and Tongue of Sun and Moon need a mechanics/reminder pass |
| Paladin | Training, edition-dependent spell access, Fighting Style registry | Class Fighting Style accounting, auras and resource counters need review |
| Ranger | Training/spells/styles; 2024 Deft Explorer/Expertise choices | 2014 optional Canny is manual; Favored Enemy/Natural Explorer and additional language choices need explicit controls/reminders |
| Rogue | Training; edition-aware Expertise; Thieves’ Cant | Extra multiclass skill and 2024 extra language choices need controls/reminders; conditional Reliable Talent needs a clear reminder, not a flat skill bonus |
| Sorcerer | Training and spell progression; Draconic AC alternatives | Metamagic is absent from the class-choice registry; Sorcery Point accounting and subclass effects need a separate pass |
| Warlock | Edition/class-level invocation choices, prerequisites, Pact Boon (2014), separate Pact Magic slots; Lessons origin choices | Many invocation effects are explicitly manual; multiclass/cross-class choice accounting needs additional adversarial tests |
| Wizard | Training/spell progression; 2024 Scholar with all six eligible skills, including Medicine | School choices, spell preparation and class resource behavior need feature-by-feature review |

Shared tested subsystems include class HP/hit dice and slot progression (`character-progression.js`), class/subclass reference unlocks (`character-class-progression.js`), class choices (`character-class-feature-choices.js`), skill totals (`character-sheet-model.js`), equipment (`character-equipment.js`), and feat eligibility/budgets (`character-play-rules.js`). Supported automatic effects are selective; the existence of a reference entry must never imply a working counter or calculation.

## Reproduced defects

1. **Multiclass normal feat/ASI allowance used total character level and the starting class.** Fighter 1 / Wizard 3 at character level 4 returned one normal choice; neither class has reached its level-4 milestone, so the correct allowance is zero. The accompanying fix counts each actual class's milestones, including Fighter/Rogue extras, caps assignments at total character level, and leaves unassigned levels ungranted. Legacy single-class data falls back to the selected class/character level. Saved spending is retained and excess reported. DM-approved additional feats/ASIs remain separate. It does not remove saved feats or their effects.
2. **Jack of All Trades is missing.** With all ability scores 10 and no training, Bard 2 derives Athletics +0 in both editions. Expected is +1 (half of proficiency +2, rounded down). In 2014 its untrained ability-check benefit also covers initiative; 2024 restricts the benefit to untrained skill checks. Manual Half circles work but do not provide a class-aware reminder or correct automatic coverage.

The class-choice registry also lacks Divine/Primal Order and Metamagic groups. These are confirmed registry gaps; their complete source-specific behavior still needs individual acceptance cases before implementation.

## Repair queue

1. Correct multiclass normal feat/ASI milestones — implemented with this review, engine/browser/save tests required before release.
2. Implement Bard Jack of All Trades with edition differences, multiclass gates, manual/automatic training nonstacking, Overview/print and a clear explanation.
3. **User-requested priority: Weapon Mastery choices.** Add per-class and Weapon Master feat selections beside training, enforce proficiency and edition/count limits, persist choices and show active mastery properties on weapon attacks. Existing equipment text only says “only if unlocked”; that does not unlock anything. Review Fighter/Barbarian scaling and Paladin/Ranger/Rogue allowances.
4. Reconcile Fighting Style allowances with class choice groups to avoid granting the same entitlement twice; test multiclass Fighter/Paladin/Ranger and feat removal/replacement.
5. Add explicit secondary-class skill/language choices and pending-choice reminders. Cover Rogue, Bard, Ranger, 2024 Rogue extra language, and 2024 Ranger Deft Explorer languages. Do not silently grant an unchosen language.
6. Add 2024 Divine Order / Primal Order choices and their eligible skill modifiers.
7. Add Sorcerer Metamagic choices and class-level-scaled limits; preserve unavailable saved choices as inactive.
8. Review rest/resource counters and conditional class features one class at a time, starting with Rage, Bardic Inspiration, Channel Divinity, Focus/Ki, Sorcery Points, Second Wind and Reliable Talent. Conditional checks need reminders or explicit play controls, not unconditional bonuses.
9. Re-run the supported-source class/subclass choice audit and reconcile all unexplained gaps. Optional/UA content is a discovery queue, not blanket permission to enable it.

Every behavior change needs edition, actual class level, multiclass, change/remove/reopen and conflicting/manual-source checks. Update the Guide and contextual explanations with the affected feature. State Firebase rule requirements in each PR; this milestone fix changes no stored schema or permissions and requires no new rules or migration.

## Sources

[2014 Basic Rules class features](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 Basic Rules class features](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), and the repository's normalized SRD feature metadata (`character-srd-class-data.js`, with revision and CC-BY attribution). Non-SRD optional features require their sourcebooks; no long source prose is copied here.

## Follow-up: shared Fighting Style allowance

Class choices and the legacy Feats selector now share actual Fighter/Paladin/Ranger class-level allowances. Duplicate class selections grant one supported effect. Saved aliases are counted once and retained; rendering no longer copies Feats into class choices. An older style on Feats can be removed there before replacing it in class choices. Champion additional styles and Fighting Initiate remain separate coverage work, not completed by this fix.

## Expanded acceptance scope

Audit every supported class, including Artificer, at every level 1–20 against the selected edition/source. Record each feature's structured choices, derived values, resources, sheet/print presentation and implementation gaps. Then verify multiclass unlocks, nonstacking effects, persistence and class-level changes. A feature listed in progression text is not evidence of automation. Optional and edition-specific variants must remain explicit.

Next concrete task: verify standard 27-point buy and add selectable 15/15/15/8/8/8, 15/14/13/12/10/8 and 14/14/14/10/10/10 presets before bonuses. Each costs 27. Continue the feature matrix and class implementations afterward.
