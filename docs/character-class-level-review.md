# Class features: level-by-level review

This inventory covers every supported base class at levels 1–20 using the references shipped with the app. It does **not** certify that every source-book feature is imported or automated. Subclass features require their own pass. Both Artificer sources are inventoried separately: Tasha’s legacy class on either compatible core edition and revised Eberron on 2024 core rules.

- **Implemented**: the stated scope has structured controls/calculations and named test evidence.
- **Partial**: some support exists; the remaining scope is explicit.
- **Unreviewed**: source comparison and complete field coverage are still outstanding.

The runtime matrix separately checks that core derivation succeeds for every class/level and preserves values across multiclass/save-envelope cases. Passing that matrix does not make unreviewed features implemented.

## Artificer · Tasha’s legacy · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Magical Tinkering **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Infuse Item **[unreviewed]** |
| 3 | Artificer Specialist **[unreviewed]**<br>The Right Tool for the Job **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Artificer Specialist feature **[unreviewed]** |
| 6 | Tool Expertise **[implemented]** |
| 7 | Flash of Genius **[implemented]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Artificer Specialist feature **[unreviewed]** |
| 10 | Magic Item Adept **[partial]** |
| 11 | Spell-Storing Item **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Magic Item Savant **[partial]** |
| 15 | Artificer Specialist feature **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Magic Item Master **[implemented]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Soul of Artifice **[partial]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Magical Tinkering · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Infuse Item · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Artificer Specialist · 3 | Source-rule comparison and structured fields still need review. | Pending |
| The Right Tool for the Job · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Artificer Specialist feature · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Tool Expertise · 6 | Tool ability controls calculate the current ability modifier plus double proficiency, once, from actual Artificer level 6; includes print and multiclass overlap. | [tests/artificer-tool-training.cjs](../tests/artificer-tool-training.cjs), [tests/artificer-tool-training-browser.cjs](../tests/artificer-tool-training-browser.cjs) |
| Flash of Genius · 7 | Conditional Intelligence bonus, finite uses, Use/Undo, Long Rest recovery, Overview and print. The chosen reaction and target roll resolve during play. | [tests/artificer-flash-of-genius.cjs](../tests/artificer-flash-of-genius.cjs), [tests/artificer-flash-of-genius-browser.cjs](../tests/artificer-flash-of-genius-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Artificer Specialist feature · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Magic Item Adept · 10 | Four attunement slots work from actual Artificer 10. Crafting benefits still need a structured workflow. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs), [tests/artificer-attunement-browser.cjs](../tests/artificer-attunement-browser.cjs) |
| Spell-Storing Item · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magic Item Savant · 14 | Five attunement slots work from actual Artificer 14. Source-specific item prerequisites still need review. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs) |
| Artificer Specialist feature · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magic Item Master · 18 | Six attunement slots from actual Artificer 18, including shared equipment/magic item limits and preserving excess saved choices after level reduction. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs), [tests/artificer-attunement-browser.cjs](../tests/artificer-attunement-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Soul of Artifice · 20 | Owned attuned magic items add to all six saves and death saves at actual Artificer 20, including unworn items; Cheat Death still needs controls. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |

## Barbarian · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Rage **[unreviewed]**<br>Unarmored Defense **[unreviewed]** |
| 2 | Danger Sense **[unreviewed]**<br>Reckless Attack **[unreviewed]** |
| 3 | Primal Path **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]**<br>Fast Movement **[unreviewed]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Feral Instinct **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Brutal Critical **[unreviewed]** |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Relentless Rage **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Brutal Critical **[unreviewed]** |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | Persistent Rage **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Brutal Critical **[unreviewed]** |
| 18 | Indomitable Might **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Primal Champion **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Rage · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Unarmored Defense · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Danger Sense · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Reckless Attack · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Primal Path · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Fast Movement · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Feral Instinct · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Brutal Critical · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Relentless Rage · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Brutal Critical · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Persistent Rage · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Brutal Critical · 17 | Source-rule comparison and structured fields still need review. | Pending |
| Indomitable Might · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Primal Champion · 20 | Automatic level-20 ability increases in Base mode with source-specific maximum; recalculated modifiers, saves, checks, defenses and applicable HP/DC. Final totals stay unchanged and show a source reference. Actual class-level gating, persistence and print verified. | [tests/class-ability-capstones.cjs](../tests/class-ability-capstones.cjs), [tests/class-ability-capstones-browser.cjs](../tests/class-ability-capstones-browser.cjs) |

## Bard · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Bardic Inspiration **[implemented]**<br>Spellcasting **[partial]** |
| 2 | Jack of All Trades **[partial]**<br>Song of Rest **[unreviewed]** |
| 3 | Bard College **[unreviewed]**<br>Expertise **[implemented]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Bardic Inspiration **[implemented]**<br>Font of Inspiration **[implemented]** |
| 6 | Countercharm **[unreviewed]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Song of Rest **[unreviewed]** |
| 10 | Bardic Inspiration **[implemented]**<br>Expertise **[implemented]**<br>Magical Secrets **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Song of Rest **[unreviewed]** |
| 14 | Magical Secrets **[unreviewed]** |
| 15 | Bardic Inspiration **[implemented]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Song of Rest **[unreviewed]** |
| 18 | Magical Secrets **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Superior Inspiration **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Bardic Inspiration · 1 | Actual Bard-level die, current Charisma minimum-one use limit, finite Give/Undo, source-specific duration/trigger reminders, save/reopen and print. The recipient rolls the die at the table. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Jack of All Trades · 2 | Automatic half proficiency for untrained skills and initiative, with rounded nonstacking totals. Other untrained ability/tool checks still need general check controls. | [tests/bard-jack-of-all-trades.cjs](../tests/bard-jack-of-all-trades.cjs), [tests/bard-jack-of-all-trades-browser.cjs](../tests/bard-jack-of-all-trades-browser.cjs) |
| Song of Rest · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Bard College · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Expertise · 3 | Proficient skill choices at the source's class levels, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Bardic Inspiration · 5 | Actual Bard-level die, current Charisma minimum-one use limit, finite Give/Undo, source-specific duration/trigger reminders, save/reopen and print. The recipient rolls the die at the table. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Font of Inspiration · 5 | Short Rest recovery from actual Bard 5. Long Rest also restores uses. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Countercharm · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Song of Rest · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Bardic Inspiration · 10 | Actual Bard-level die, current Charisma minimum-one use limit, finite Give/Undo, source-specific duration/trigger reminders, save/reopen and print. The recipient rolls the die at the table. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Expertise · 10 | Proficient skill choices at the source's class levels, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Magical Secrets · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Song of Rest · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Magical Secrets · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Bardic Inspiration · 15 | Actual Bard-level die, current Charisma minimum-one use limit, finite Give/Undo, source-specific duration/trigger reminders, save/reopen and print. The recipient rolls the die at the table. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Song of Rest · 17 | Source-rule comparison and structured fields still need review. | Pending |
| Magical Secrets · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Superior Inspiration · 20 | Initiative recovery from actual Bard 20, one use only when empty with current derived Charisma, without resetting other class pools. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |

## Cleric · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Divine Domain **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Channel Divinity **[implemented]** |
| 3 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Destroy Undead **[partial]** |
| 6 | Channel Divinity **[implemented]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]**<br>Destroy Undead **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Divine Intervention **[unreviewed]** |
| 11 | Destroy Undead **[partial]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Destroy Undead **[partial]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Destroy Undead **[partial]** |
| 18 | Channel Divinity **[implemented]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Divine Intervention **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Divine Domain · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Channel Divinity · 2 | Source-specific finite pool, base effect choices, Wisdom DC/Divine Spark formula, use/undo, rest limits and save/print. Legacy multiclass Cleric/Paladin share the higher use limit; revised pools are separate. Resolve rolls, targets and conditions at the table; subclass effects retain their own source rules. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Destroy Undead · 5 | Source-level CR threshold is derived in the Turn Undead effect details. The chosen target and destruction are resolved at the table. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Channel Divinity · 6 | Source-specific finite pool, base effect choices, Wisdom DC/Divine Spark formula, use/undo, rest limits and save/print. Legacy multiclass Cleric/Paladin share the higher use limit; revised pools are separate. Resolve rolls, targets and conditions at the table; subclass effects retain their own source rules. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Destroy Undead · 8 | Source-level CR threshold is derived in the Turn Undead effect details. The chosen target and destruction are resolved at the table. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Divine Intervention · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Destroy Undead · 11 | Source-level CR threshold is derived in the Turn Undead effect details. The chosen target and destruction are resolved at the table. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Destroy Undead · 14 | Source-level CR threshold is derived in the Turn Undead effect details. The chosen target and destruction are resolved at the table. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Destroy Undead · 17 | Source-level CR threshold is derived in the Turn Undead effect details. The chosen target and destruction are resolved at the table. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Channel Divinity · 18 | Source-specific finite pool, base effect choices, Wisdom DC/Divine Spark formula, use/undo, rest limits and save/print. Legacy multiclass Cleric/Paladin share the higher use limit; revised pools are separate. Resolve rolls, targets and conditions at the table; subclass effects retain their own source rules. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Divine Intervention · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Druid · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Druidic **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Druid Circle **[unreviewed]**<br>Wild Shape **[partial]** |
| 3 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 4 | Ability Score Improvement **[partial]**<br>Wild Shape **[partial]** |
| 5 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]**<br>Wild Shape **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Beast Spells **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Archdruid **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Druidic · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Druid Circle · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Wild Shape · 2 | Own form card under Companions: actual Druid CR/movement/known-or-seen gates, source HP/tempHP/overflow, uses/recovery, retained mental scores/training, scoped Moon adjustments, persistence and print. Normal sheet remains a reference; full circle/slot-conversion automation remains pending. | [tests/druid-wild-shape.cjs](../tests/druid-wild-shape.cjs), [tests/druid-wild-shape-browser.cjs](../tests/druid-wild-shape-browser.cjs), [tests/druid-wild-shape-rules.cjs](../tests/druid-wild-shape-rules.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Wild Shape · 4 | Own form card under Companions: actual Druid CR/movement/known-or-seen gates, source HP/tempHP/overflow, uses/recovery, retained mental scores/training, scoped Moon adjustments, persistence and print. Normal sheet remains a reference; full circle/slot-conversion automation remains pending. | [tests/druid-wild-shape.cjs](../tests/druid-wild-shape.cjs), [tests/druid-wild-shape-browser.cjs](../tests/druid-wild-shape-browser.cjs), [tests/druid-wild-shape-rules.cjs](../tests/druid-wild-shape-rules.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Wild Shape · 8 | Own form card under Companions: actual Druid CR/movement/known-or-seen gates, source HP/tempHP/overflow, uses/recovery, retained mental scores/training, scoped Moon adjustments, persistence and print. Normal sheet remains a reference; full circle/slot-conversion automation remains pending. | [tests/druid-wild-shape.cjs](../tests/druid-wild-shape.cjs), [tests/druid-wild-shape-browser.cjs](../tests/druid-wild-shape-browser.cjs), [tests/druid-wild-shape-rules.cjs](../tests/druid-wild-shape-rules.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Beast Spells · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Archdruid · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Fighter · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Fighting Style **[partial]**<br>Second Wind **[implemented]** |
| 2 | Action Surge **[implemented]** |
| 3 | Martial Archetype **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]** |
| 6 | Ability Score Improvement **[partial]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Indomitable **[implemented]** |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Extra Attack **[implemented]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Indomitable **[implemented]** |
| 14 | Ability Score Improvement **[partial]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Action Surge **[implemented]**<br>Indomitable **[implemented]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Extra Attack **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Fighting Style · 1 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Second Wind · 1 | Actual class-level use limit, healing formula, finite Use/Undo, source-specific Short/Long Rest recovery, save/reopen and print. Healing is resolved at the table; this counter does not change HP. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Action Surge · 2 | Actual class-level use limit, finite Use/Undo, Short/Long Rest recovery and edition-specific action restriction reminders. Actions resolve during play. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Martial Archetype · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Ability Score Improvement · 6 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Indomitable · 9 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Extra Attack · 11 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Indomitable · 13 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Ability Score Improvement · 14 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Action Surge · 17 | Actual class-level use limit, finite Use/Undo, Short/Long Rest recovery and edition-specific action restriction reminders. Actions resolve during play. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Indomitable · 17 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 20 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |

## Monk · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Unarmored Defense **[unreviewed]** |
| 2 | Ki **[partial]** |
| 3 | Deflect Missiles **[unreviewed]**<br>Monastic Tradition **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]**<br>Slow Fall **[unreviewed]** |
| 5 | Extra Attack **[implemented]**<br>Stunning Strike **[unreviewed]** |
| 6 | Ki-Empowered Strikes **[unreviewed]** |
| 7 | Evasion **[unreviewed]**<br>Stillness of Mind **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Purity of Body **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Tongue of the Sun and Moon **[unreviewed]** |
| 14 | Diamond Soul **[implemented]** |
| 15 | Timeless Body **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Empty Body **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Perfect Self **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Unarmored Defense · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Ki · 2 | Shared point pool, actual class-level maximum, finite spend/undo, Short/Long Rest recovery, current feature DC, save/reopen and print. Individual technique actions, revised Uncanny Metabolism and Perfect Focus recovery remain in the wider review. | [tests/monk-ki-and-focus.cjs](../tests/monk-ki-and-focus.cjs), [tests/monk-ki-and-focus-browser.cjs](../tests/monk-ki-and-focus-browser.cjs) |
| Deflect Missiles · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Monastic Tradition · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Slow Fall · 4 | Source-rule comparison and structured fields still need review. | Pending |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Stunning Strike · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Ki-Empowered Strikes · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Evasion · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Stillness of Mind · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Purity of Body · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Tongue of the Sun and Moon · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Diamond Soul · 14 | Automatic proficiency in all saves at actual Monk 14, separate death-save contribution, and a failed-save reroll button spending one point from the shared Ki/Focus pool. The player rolls the die at the table and keeps the new result. | [tests/class-saving-throw-training.cjs](../tests/class-saving-throw-training.cjs), [tests/class-saving-throw-training-browser.cjs](../tests/class-saving-throw-training-browser.cjs), [tests/monk-ki-and-focus.cjs](../tests/monk-ki-and-focus.cjs), [tests/monk-ki-and-focus-browser.cjs](../tests/monk-ki-and-focus-browser.cjs) |
| Timeless Body · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Empty Body · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Perfect Self · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Paladin · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Divine Sense **[implemented]**<br>Lay on Hands **[partial]** |
| 2 | Divine Smite **[unreviewed]**<br>Fighting Style **[partial]**<br>Spellcasting **[partial]** |
| 3 | Divine Health **[unreviewed]**<br>Sacred Oath **[partial]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]** |
| 6 | Aura of Protection **[implemented]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Aura of Courage **[partial]** |
| 11 | Improved Divine Smite **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Cleansing Touch **[unreviewed]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Aura of Courage **[partial]**<br>Aura of Protection **[implemented]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Divine Sense · 1 | Separate 1-plus-current-Charisma pool, including zero uses, with finite use/undo and Long Rest. Source-specific detection/range/duration reminder; no permanent sight change. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Lay on Hands · 1 | Actual Paladin-level healing pool, variable point spending/undo, Long Rest, source-specific cure options, persistence and print. Apply healing and condition removal to the chosen recipient separately; no cross-character mutation. | [tests/paladin-lay-on-hands.cjs](../tests/paladin-lay-on-hands.cjs), [tests/paladin-lay-on-hands-browser.cjs](../tests/paladin-lay-on-hands-browser.cjs) |
| Divine Smite · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Fighting Style · 2 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Spellcasting · 2 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Divine Health · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Sacred Oath · 3 | Existing oath choice and an eligible oath-effect entry use the shared legacy Channel Divinity pool with Cleric. Specific oath effect automation still requires its own review. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Aura of Protection · 6 | Actual Paladin 6/18 unlock/range, current final Charisma minimum-one contribution once to own saves, concentration-relevant Constitution/death-save totals, source-specific canonical condition suppression, manual override, save/reopen and print. Allied/competing auras are table-resolved. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Aura of Courage · 10 | Actual Paladin 10, shared 10/30-ft range and source-specific availability are derived and displayed/printed. Existing conditions and allied sheets are not deleted or automatically rewritten. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Improved Divine Smite · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Cleansing Touch · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Aura of Courage · 18 | Actual Paladin 10, shared 10/30-ft range and source-specific availability are derived and displayed/printed. Existing conditions and allied sheets are not deleted or automatically rewritten. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Aura of Protection · 18 | Actual Paladin 6/18 unlock/range, current final Charisma minimum-one contribution once to own saves, concentration-relevant Constitution/death-save totals, source-specific canonical condition suppression, manual override, save/reopen and print. Allied/competing auras are table-resolved. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |

## Ranger · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Favored Enemy **[unreviewed]**<br>Natural Explorer **[unreviewed]** |
| 2 | Fighting Style **[partial]**<br>Spellcasting **[partial]** |
| 3 | Primeval Awareness **[unreviewed]**<br>Ranger Archetype **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]** |
| 6 | Favored Enemy **[unreviewed]**<br>Natural Explorer **[unreviewed]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]**<br>Land's Stride **[unreviewed]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Hide in Plain Sight **[unreviewed]**<br>Natural Explorer **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Favored Enemy **[unreviewed]**<br>Vanish **[unreviewed]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Feral Senses **[partial]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Foe Slayer **[partial]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Favored Enemy · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Natural Explorer · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Fighting Style · 2 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Spellcasting · 2 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Primeval Awareness · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ranger Archetype · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Favored Enemy · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Natural Explorer · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Land's Stride · 8 | Source-rule comparison and structured fields still need review. | Pending |
| Hide in Plain Sight · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Natural Explorer · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Favored Enemy · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Vanish · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Feral Senses · 18 | Legacy conditional unseen-attack/30-ft invisible-creature awareness is shown, explicitly without granting Blindsight. Conditions and targets remain table resolved. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Foe Slayer · 20 | Once-per-own-turn finite use/undo/reset and current Wisdom bonus are shown. The eligible favored-enemy attack/damage roll still resolves at the table. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |

## Rogue · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Expertise **[implemented]**<br>Thieves' Cant **[implemented]** |
| 2 | Cunning Action **[unreviewed]** |
| 3 | Roguish Archetype **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Uncanny Dodge **[unreviewed]** |
| 6 | Expertise **[implemented]** |
| 7 | Evasion **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Ability Score Improvement **[partial]** |
| 11 | Reliable Talent **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Blindsense **[unreviewed]** |
| 15 | Slippery Mind **[implemented]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Elusive **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Stroke of Luck **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Expertise · 1 | Proficient skill/tool choices, level allowance, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Thieves' Cant · 1 | Fixed language appears from actual Rogue levels without rewriting personal language notes; roleplay uses resolve in play. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs) |
| Cunning Action · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Roguish Archetype · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Uncanny Dodge · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Expertise · 6 | Proficient skill/tool choices, level allowance, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Evasion · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 10 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Reliable Talent · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Blindsense · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Slippery Mind · 15 | Saving throw proficiency from actual Rogue level 15: Wisdom in 2014, Wisdom and Charisma in 2024. Automatic, nonstacking, preserved manual adjustments; source reminders and print. | [tests/class-saving-throw-training.cjs](../tests/class-saving-throw-training.cjs), [tests/class-saving-throw-training-browser.cjs](../tests/class-saving-throw-training-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Elusive · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Stroke of Luck · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Sorcerer · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Sorcerous Origin **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Font of Magic **[partial]** |
| 3 | Metamagic **[partial]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Metamagic **[partial]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Metamagic **[partial]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Sorcerous Restoration **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Sorcerous Origin · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Font of Magic · 2 | Class Sorcery Point maximum, finite spend/undo, Metamagic cost spending and rest recovery are tracked. Spell-slot-to-point conversion and temporary slot creation remain pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Metamagic · 3 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Metamagic · 10 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Metamagic · 17 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Sorcerous Restoration · 20 | Legacy Sorcerer 20 restores four points on each Short Rest; revised Sorcerer 5 restores half class level rounded down once per Long Rest. Recovery uses capped actual class levels and persists the once-per-Long-Rest limit. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |

## Warlock · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Otherworldly Patron **[unreviewed]**<br>Pact Magic **[unreviewed]** |
| 2 | Eldritch Invocations **[partial]** |
| 3 | Pact Boon **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Mystic Arcanum **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Mystic Arcanum **[unreviewed]** |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | Mystic Arcanum **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Mystic Arcanum **[unreviewed]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Eldritch Master **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Otherworldly Patron · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Pact Magic · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Eldritch Invocations · 2 | Passive effects and Agonizing Blast/Eldritch Spear have structured fields and source-specific modifiers. Casting invocations, pact weapons/boons and expanded source options still need review. | [tests/warlock-invocation-effects.cjs](../tests/warlock-invocation-effects.cjs), [tests/warlock-invocation-effects-browser.cjs](../tests/warlock-invocation-effects-browser.cjs), [tests/character-class-feature-choices.cjs](../tests/character-class-feature-choices.cjs), [tests/warlock-cantrip-invocations.cjs](../tests/warlock-cantrip-invocations.cjs), [tests/warlock-cantrip-invocations-browser.cjs](../tests/warlock-cantrip-invocations-browser.cjs) |
| Pact Boon · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Mystic Arcanum · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Mystic Arcanum · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Mystic Arcanum · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Mystic Arcanum · 17 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Eldritch Master · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Wizard · 2014

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Arcane Recovery **[implemented]**<br>Spellcasting **[partial]** |
| 2 | Arcane Tradition **[unreviewed]** |
| 3 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 4 | Ability Score Improvement **[partial]** |
| 5 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Spell Mastery **[unreviewed]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Signature Spells **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Arcane Recovery · 1 | Atomic selection/recovery of expended slots, combined rounded-up actual Wizard-level budget, no level-6+ slots, one activation, ordinary/Pact pool separation, source-specific daily/Long Rest reset, save/reopen and print. The player confirms the eligible Short Rest; calendar advancement is explicit in legacy rules. | [tests/wizard-arcane-recovery.cjs](../tests/wizard-arcane-recovery.cjs), [tests/wizard-arcane-recovery-browser.cjs](../tests/wizard-arcane-recovery-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Arcane Tradition · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Spell Mastery · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Signature Spells · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Artificer · Tasha’s legacy · 2024 core / legacy 2014 source

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Magical Tinkering **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Infuse Item **[unreviewed]** |
| 3 | Artificer Specialist **[unreviewed]**<br>The Right Tool for the Job **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Artificer Specialist feature **[unreviewed]** |
| 6 | Tool Expertise **[implemented]** |
| 7 | Flash of Genius **[implemented]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Artificer Specialist feature **[unreviewed]** |
| 10 | Magic Item Adept **[partial]** |
| 11 | Spell-Storing Item **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Magic Item Savant **[partial]** |
| 15 | Artificer Specialist feature **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Magic Item Master **[implemented]** |
| 19 | Ability Score Improvement **[partial]** |
| 20 | Soul of Artifice **[partial]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Magical Tinkering · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Infuse Item · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Artificer Specialist · 3 | Source-rule comparison and structured fields still need review. | Pending |
| The Right Tool for the Job · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Artificer Specialist feature · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Tool Expertise · 6 | Tool ability controls calculate the current ability modifier plus double proficiency, once, from actual Artificer level 6; includes print and multiclass overlap. | [tests/artificer-tool-training.cjs](../tests/artificer-tool-training.cjs), [tests/artificer-tool-training-browser.cjs](../tests/artificer-tool-training-browser.cjs) |
| Flash of Genius · 7 | Conditional Intelligence bonus, finite uses, Use/Undo, Long Rest recovery, Overview and print. The chosen reaction and target roll resolve during play. | [tests/artificer-flash-of-genius.cjs](../tests/artificer-flash-of-genius.cjs), [tests/artificer-flash-of-genius-browser.cjs](../tests/artificer-flash-of-genius-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Artificer Specialist feature · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Magic Item Adept · 10 | Four attunement slots work from actual Artificer 10. Crafting benefits still need a structured workflow. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs), [tests/artificer-attunement-browser.cjs](../tests/artificer-attunement-browser.cjs) |
| Spell-Storing Item · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magic Item Savant · 14 | Five attunement slots work from actual Artificer 14. Source-specific item prerequisites still need review. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs) |
| Artificer Specialist feature · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magic Item Master · 18 | Six attunement slots from actual Artificer 18, including shared equipment/magic item limits and preserving excess saved choices after level reduction. | [tests/artificer-attunement.cjs](../tests/artificer-attunement.cjs), [tests/artificer-attunement-browser.cjs](../tests/artificer-attunement-browser.cjs) |
| Ability Score Improvement · 19 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Soul of Artifice · 20 | Owned attuned magic items add to all six saves and death saves at actual Artificer 20, including unworn items; Cheat Death still needs controls. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |

## Barbarian · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Rage **[unreviewed]**<br>Unarmored Defense **[unreviewed]**<br>Weapon Mastery **[partial]** |
| 2 | Danger Sense **[unreviewed]**<br>Reckless Attack **[unreviewed]** |
| 3 | Barbarian Subclass **[unreviewed]**<br>Primal Knowledge **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]**<br>Fast Movement **[unreviewed]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Feral Instinct **[unreviewed]**<br>Instinctive Pounce **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Brutal Strike **[unreviewed]** |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Relentless Rage **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Improved Brutal Strike **[unreviewed]** |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | Persistent Rage **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Improved Brutal Strike (Enhanced) **[unreviewed]** |
| 18 | Indomitable Might **[unreviewed]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Primal Champion **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Rage · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Unarmored Defense · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Weapon Mastery · 1 | Weapon choices, class-level allowance, proficiency gating and property reminders exist. Audit remaining property-specific statistics/conditions against the source. | [tests/weapon-mastery.cjs](../tests/weapon-mastery.cjs), [tests/weapon-mastery-browser.cjs](../tests/weapon-mastery-browser.cjs) |
| Danger Sense · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Reckless Attack · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Barbarian Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Primal Knowledge · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Fast Movement · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Feral Instinct · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Instinctive Pounce · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Brutal Strike · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Relentless Rage · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Improved Brutal Strike · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Persistent Rage · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Improved Brutal Strike (Enhanced) · 17 | Source-rule comparison and structured fields still need review. | Pending |
| Indomitable Might · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Primal Champion · 20 | Automatic level-20 ability increases in Base mode with source-specific maximum; recalculated modifiers, saves, checks, defenses and applicable HP/DC. Final totals stay unchanged and show a source reference. Actual class-level gating, persistence and print verified. | [tests/class-ability-capstones.cjs](../tests/class-ability-capstones.cjs), [tests/class-ability-capstones-browser.cjs](../tests/class-ability-capstones-browser.cjs) |

## Bard · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Bardic Inspiration **[implemented]**<br>Spellcasting **[partial]** |
| 2 | Expertise **[implemented]**<br>Jack of All Trades **[implemented]** |
| 3 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Font of Inspiration **[implemented]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Countercharm **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Magical Secrets **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Superior Inspiration **[implemented]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Words of Creation **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Bardic Inspiration · 1 | Actual Bard-level die, current Charisma minimum-one use limit, finite Give/Undo, source-specific duration/trigger reminders, save/reopen and print. The recipient rolls the die at the table. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Expertise · 2 | Proficient skill choices at the revised class levels, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Jack of All Trades · 2 | Automatic half proficiency on untrained skills, without initiative/saving throw bonuses; includes print and Wild Shape checks. | [tests/bard-jack-of-all-trades.cjs](../tests/bard-jack-of-all-trades.cjs), [tests/bard-jack-of-all-trades-browser.cjs](../tests/bard-jack-of-all-trades-browser.cjs) |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Font of Inspiration · 5 | Short Rest recovery from actual Bard 5. Available ordinary or Pact spell slot converts into one use, with shared spell-slot spending and save/reopen. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Countercharm · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magical Secrets · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Superior Inspiration · 18 | Initiative recovery from actual Bard 18 to two uses with current derived Charisma, without resetting other class pools. | [tests/bard-inspiration-resources.cjs](../tests/bard-inspiration-resources.cjs), [tests/bard-inspiration-resources-browser.cjs](../tests/bard-inspiration-resources-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Words of Creation · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Cleric · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Divine Order **[implemented]**<br>Spellcasting **[partial]** |
| 2 | Channel Divinity **[implemented]** |
| 3 | Cleric Subclasses **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Sear Undead **[partial]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Blessed Strikes **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Divine Intervention **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Improved Blessed Strikes **[unreviewed]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Greater Divine Intervention **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Divine Order · 1 | Structured Order choice grants its weapon/armor training or extra class cantrip allowance and current Wisdom (minimum +1) to the specified Intelligence skill checks; source-aware readouts, multiclassing, persistence and print. Select cantrips in the existing Spells builder. | [tests/divine-and-primal-orders.cjs](../tests/divine-and-primal-orders.cjs), [tests/divine-and-primal-orders-browser.cjs](../tests/divine-and-primal-orders-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Channel Divinity · 2 | Source-specific finite pool, base effect choices, Wisdom DC/Divine Spark formula, use/undo, rest limits and save/print. Legacy multiclass Cleric/Paladin share the higher use limit; revised pools are separate. Resolve rolls, targets and conditions at the table; subclass effects retain their own source rules. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Cleric Subclasses · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Sear Undead · 5 | From actual Cleric 5, Turn Undead shows the current Wisdom/minimum-one d8 damage reminder and notes that this damage does not end turning. Targets and rolls remain table resolved. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Blessed Strikes · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Divine Intervention · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Improved Blessed Strikes · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Greater Divine Intervention · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Druid · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Druidic **[partial]**<br>Primal Order **[implemented]**<br>Spellcasting **[partial]** |
| 2 | Wild Companion **[partial]**<br>Wild Shape **[partial]** |
| 3 | Druid Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Wild Resurgence **[unreviewed]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Elemental Fury **[partial]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | Improved Elemental Fury **[partial]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Beast Spells **[unreviewed]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Archdruid **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Druidic · 1 | Druidic language is automatic; the spell generator adds source-correct Speak with Animals as always prepared, additional to the normal preparation allowance. Secret-message detection and table interactions remain source reminders. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/divine-and-primal-orders-browser.cjs](../tests/divine-and-primal-orders-browser.cjs) |
| Primal Order · 1 | Structured Order choice grants its weapon/armor training or extra class cantrip allowance and current Wisdom (minimum +1) to the specified Intelligence skill checks; source-aware readouts, multiclassing, persistence and print. Select cantrips in the existing Spells builder. | [tests/divine-and-primal-orders.cjs](../tests/divine-and-primal-orders.cjs), [tests/divine-and-primal-orders-browser.cjs](../tests/divine-and-primal-orders-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Wild Companion · 2 | Base 2024 summoning from actual Druid 2: CR0 Beast/Fey familiar, atomic Wild Shape/ordinary/Pact payment, independent HP/max/temp, pocket return and permanent/0HP/Long Rest expiry, one-familiar acknowledgement, persistence and print. Pact/circle-specific creature alternatives and automatic buff effects remain separate. | [tests/druid-wild-companion.cjs](../tests/druid-wild-companion.cjs), [tests/druid-wild-companion-browser.cjs](../tests/druid-wild-companion-browser.cjs), [tests/druid-wild-shape-rules.cjs](../tests/druid-wild-shape-rules.cjs) |
| Wild Shape · 2 | Own form card under Companions: actual Druid CR/movement/known-or-seen gates, source HP/tempHP/overflow, uses/recovery, retained mental scores/training, scoped Moon adjustments, persistence and print. Normal sheet remains a reference; full circle/slot-conversion automation remains pending. | [tests/druid-wild-shape.cjs](../tests/druid-wild-shape.cjs), [tests/druid-wild-shape-browser.cjs](../tests/druid-wild-shape-browser.cjs), [tests/druid-wild-shape-rules.cjs](../tests/druid-wild-shape-rules.cjs) |
| Druid Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Wild Resurgence · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Elemental Fury · 7 | Structured 2024 level-7 choice. Potent adds current Wisdom to supported damaging Druid cantrips; level15 adds300ft to qualifying ranges with per-class ownership preserved. Primal displays a source-correct conditional weapon/Beast hit reminder, not automatic target damage or a turn counter. Guide, persistence and print covered. | [tests/druid-elemental-fury.cjs](../tests/druid-elemental-fury.cjs), [tests/druid-elemental-fury-browser.cjs](../tests/druid-elemental-fury-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Improved Elemental Fury · 15 | Structured 2024 level-7 choice. Potent adds current Wisdom to supported damaging Druid cantrips; level15 adds300ft to qualifying ranges with per-class ownership preserved. Primal displays a source-correct conditional weapon/Beast hit reminder, not automatic target damage or a turn counter. Guide, persistence and print covered. | [tests/druid-elemental-fury.cjs](../tests/druid-elemental-fury.cjs), [tests/druid-elemental-fury-browser.cjs](../tests/druid-elemental-fury-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Beast Spells · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Archdruid · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Fighter · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Fighting Style **[partial]**<br>Second Wind **[implemented]**<br>Weapon Mastery **[partial]** |
| 2 | Action Surge **[implemented]**<br>Tactical Mind **[implemented]** |
| 3 | Fighter Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]**<br>Tactical Shift **[implemented]** |
| 6 | Ability Score Improvement **[partial]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Indomitable **[implemented]**<br>Tactical Master **[unreviewed]** |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Two Extra Attacks **[implemented]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Indomitable **[implemented]**<br>Studied Attacks **[unreviewed]** |
| 14 | Ability Score Improvement **[partial]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Action Surge **[implemented]**<br>Indomitable **[implemented]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Three Extra Attacks **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Fighting Style · 1 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Second Wind · 1 | Actual class-level use limit, healing formula, finite Use/Undo, source-specific Short/Long Rest recovery, save/reopen and print. Healing is resolved at the table; this counter does not change HP. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Weapon Mastery · 1 | Weapon choices, class-level allowance, proficiency gating and property reminders exist. Audit remaining property-specific statistics/conditions against the source. | [tests/weapon-mastery.cjs](../tests/weapon-mastery.cjs), [tests/weapon-mastery-browser.cjs](../tests/weapon-mastery-browser.cjs) |
| Action Surge · 2 | Actual class-level use limit, finite Use/Undo, Short/Long Rest recovery and edition-specific action restriction reminders. Actions resolve during play. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Tactical Mind · 2 | Uses the shared Second Wind pool with a dedicated success-spend button and Undo; the failed-check 1d10 and no-spend-on-failure conditions are explained. Roll the die at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Fighter Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Tactical Shift · 5 | The Second Wind control gains its Bonus Action movement reminder at Fighter 5. Actual movement resolves at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Ability Score Improvement · 6 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Indomitable · 9 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Tactical Master · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Two Extra Attacks · 11 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Indomitable · 13 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Studied Attacks · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 14 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Action Surge · 17 | Actual class-level use limit, finite Use/Undo, Short/Long Rest recovery and edition-specific action restriction reminders. Actions resolve during play. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Indomitable · 17 | Actual class-level use limit, finite reroll/Undo, Long Rest recovery and the revised Fighter-level bonus shown only for its reroll; saved and printed. Dice are rolled at the table. | [tests/fighter-class-resources.cjs](../tests/fighter-class-resources.cjs), [tests/fighter-class-resources-browser.cjs](../tests/fighter-class-resources-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Three Extra Attacks · 20 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |

## Monk · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Martial Arts **[unreviewed]**<br>Unarmored Defense **[unreviewed]** |
| 2 | Monk's Focus **[partial]**<br>Unarmored Movement **[unreviewed]**<br>Uncanny Metabolism **[unreviewed]** |
| 3 | Deflect Attacks **[unreviewed]**<br>Monk Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]**<br>Slow Fall **[unreviewed]** |
| 5 | Extra Attack **[implemented]**<br>Stunning Strike **[unreviewed]** |
| 6 | Empowered Strikes **[unreviewed]** |
| 7 | Evasion **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Acrobatic Movement **[unreviewed]** |
| 10 | Heightened Focus **[unreviewed]**<br>Self-Restoration **[unreviewed]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Deflect Energy **[unreviewed]** |
| 14 | Disciplined Survivor **[implemented]** |
| 15 | Perfect Focus **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Superior Defense **[unreviewed]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Body and Mind **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Martial Arts · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Unarmored Defense · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Monk's Focus · 2 | Shared point pool, actual class-level maximum, finite spend/undo, Short/Long Rest recovery, current feature DC, save/reopen and print. Individual technique actions, revised Uncanny Metabolism and Perfect Focus recovery remain in the wider review. | [tests/monk-ki-and-focus.cjs](../tests/monk-ki-and-focus.cjs), [tests/monk-ki-and-focus-browser.cjs](../tests/monk-ki-and-focus-browser.cjs) |
| Unarmored Movement · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Uncanny Metabolism · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Deflect Attacks · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Monk Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Slow Fall · 4 | Source-rule comparison and structured fields still need review. | Pending |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Stunning Strike · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Empowered Strikes · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Evasion · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Acrobatic Movement · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Heightened Focus · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Self-Restoration · 10 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Deflect Energy · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Disciplined Survivor · 14 | Automatic proficiency in all saves at actual Monk 14, separate death-save contribution, and a failed-save reroll button spending one point from the shared Ki/Focus pool. The player rolls the die at the table and keeps the new result. | [tests/class-saving-throw-training.cjs](../tests/class-saving-throw-training.cjs), [tests/class-saving-throw-training-browser.cjs](../tests/class-saving-throw-training-browser.cjs), [tests/monk-ki-and-focus.cjs](../tests/monk-ki-and-focus.cjs), [tests/monk-ki-and-focus-browser.cjs](../tests/monk-ki-and-focus-browser.cjs) |
| Perfect Focus · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Superior Defense · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Body and Mind · 20 | Automatic level-20 ability increases in Base mode with source-specific maximum; recalculated modifiers, saves, checks, defenses and applicable HP/DC. Final totals stay unchanged and show a source reference. Actual class-level gating, persistence and print verified. | [tests/class-ability-capstones.cjs](../tests/class-ability-capstones.cjs), [tests/class-ability-capstones-browser.cjs](../tests/class-ability-capstones-browser.cjs) |

## Paladin · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Lay On Hands **[partial]**<br>Spellcasting **[partial]**<br>Weapon Mastery **[partial]** |
| 2 | Fighting Style **[partial]**<br>Paladin's Smite **[unreviewed]** |
| 3 | Channel Divinity **[implemented]**<br>Paladin Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]**<br>Faithful Steed **[unreviewed]** |
| 6 | Aura of Protection **[implemented]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Abjure Foes **[partial]** |
| 10 | Aura of Courage **[partial]** |
| 11 | Radiant Strikes **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Restoring Touch **[partial]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Aura Expansion **[implemented]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Lay On Hands · 1 | Actual Paladin-level healing pool, variable point spending/undo, Long Rest, source-specific cure options, persistence and print. Apply healing and condition removal to the chosen recipient separately; no cross-character mutation. | [tests/paladin-lay-on-hands.cjs](../tests/paladin-lay-on-hands.cjs), [tests/paladin-lay-on-hands-browser.cjs](../tests/paladin-lay-on-hands-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Weapon Mastery · 1 | Weapon choices, class-level allowance, proficiency gating and property reminders exist. Audit remaining property-specific statistics/conditions against the source. | [tests/weapon-mastery.cjs](../tests/weapon-mastery.cjs), [tests/weapon-mastery-browser.cjs](../tests/weapon-mastery-browser.cjs) |
| Fighting Style · 2 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Paladin's Smite · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Channel Divinity · 3 | Actual Paladin-level pool, Divine Sense and Abjure Foes choices/reminders, Charisma DC, finite uses, one-use Short Rest/full Long Rest recovery and persistence. Revised Cleric use counts stay separate. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Paladin Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Faithful Steed · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Aura of Protection · 6 | Actual Paladin 6/18 unlock/range, current final Charisma minimum-one contribution once to own saves, concentration-relevant Constitution/death-save totals, source-specific canonical condition suppression, manual override, save/reopen and print. Allied/competing auras are table-resolved. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Abjure Foes · 9 | Effect choice unlocks at actual Paladin 9, shares the class pool and shows current Charisma target count/DC, range/duration and condition restrictions. Targets/conditions remain table resolved. | [tests/divine-channel-resources.cjs](../tests/divine-channel-resources.cjs), [tests/divine-channel-resources-browser.cjs](../tests/divine-channel-resources-browser.cjs) |
| Aura of Courage · 10 | Actual Paladin 10, shared 10/30-ft range and source-specific availability are derived and displayed/printed. Existing conditions and allied sheets are not deleted or automatically rewritten. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Radiant Strikes · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Restoring Touch · 14 | Correct level-14 condition list and five-point-per-condition cost appear with the same Lay on Hands pool and in print. Target conditions are updated explicitly by the player. | [tests/paladin-lay-on-hands.cjs](../tests/paladin-lay-on-hands.cjs), [tests/paladin-lay-on-hands-browser.cjs](../tests/paladin-lay-on-hands-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Aura Expansion · 18 | Protection/Courage range expands to 30 ft from actual Paladin 18; total multiclass levels do not unlock it. | [tests/paladin-protective-auras.cjs](../tests/paladin-protective-auras.cjs), [tests/paladin-protective-auras-browser.cjs](../tests/paladin-protective-auras-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |

## Ranger · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Favored Enemy **[implemented]**<br>Spellcasting **[partial]**<br>Weapon Mastery **[partial]** |
| 2 | Deft Explorer **[partial]**<br>Fighting Style **[partial]** |
| 3 | Ranger Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Extra Attack **[implemented]** |
| 6 | Roving **[unreviewed]** |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Expertise **[unreviewed]** |
| 10 | Tireless **[partial]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Relentless Hunter **[partial]** |
| 14 | Nature's Veil **[partial]** |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Precise Hunter **[partial]** |
| 18 | Feral Senses **[implemented]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Foe Slayer **[implemented]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Favored Enemy · 1 | Always-prepared Hunter’s Mark already exists; free-casting counts now follow actual Ranger levels, with finite use/undo, Long Rest and separate ordinary spell slots. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Weapon Mastery · 1 | Weapon choices, class-level allowance, proficiency gating and property reminders exist. Audit remaining property-specific statistics/conditions against the source. | [tests/weapon-mastery.cjs](../tests/weapon-mastery.cjs), [tests/weapon-mastery-browser.cjs](../tests/weapon-mastery-browser.cjs) |
| Deft Explorer · 2 | Expertise choice works. Bonus languages and replacement/source rules still need structured review. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs) |
| Fighting Style · 2 | Base class and Feats choices share the correct allowance, with duplicate/alias guards. Additional subclass/feat style sources and situational effects remain in the wider review. | [tests/fighting-style-entitlements.cjs](../tests/fighting-style-entitlements.cjs), [tests/fighting-style-entitlements-browser.cjs](../tests/fighting-style-entitlements-browser.cjs) |
| Ranger Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Extra Attack · 5 | Derived attacks per normal Attack action on your turn use actual class levels and the highest allowance, never add multiclass sources, and remain separate from damage, spells, Bonus Actions and Reactions. Compatible Bard/Wizard/Artificer subclasses and conditional Warlock pact-weapon counts are covered; special attack replacements still resolve from their own rules. | [tests/class-extra-attack.cjs](../tests/class-extra-attack.cjs), [tests/class-extra-attack-browser.cjs](../tests/class-extra-attack-browser.cjs) |
| Roving · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Expertise · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Tireless · 10 | Wisdom-based finite uses and signed 1d8-plus-Wisdom/minimum-one-total formula are shown. Temporary HP and the Short Rest Exhaustion decrease remain explicit table/manual updates. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Relentless Hunter · 13 | Hunter’s Mark-specific Concentration protection is shown without granting global immunity or changing other spells. Checks still resolve at the table. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Nature's Veil · 14 | Wisdom-based finite uses, Bonus Action/end-of-next-turn reminder, use/undo and Long Rest recovery are tracked. Invisibility/duration are not changed automatically. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Precise Hunter · 17 | Marked-target-only Advantage reminder appears with Hunter’s Mark; unrelated attack bonuses are unchanged. No target binding/roll automation is added. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Feral Senses · 18 | Blindsight 30 ft is derived at actual Ranger 18 and shown in Senses without replacing other senses or stacking ranges. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Foe Slayer · 20 | Actual revised Ranger 20 changes the character’s Hunter’s Mark rider die to d10 in action, spell-sheet, information and print views, including a feat-granted copy. Characters without that Ranger feature and generic catalogue records stay unchanged. | [tests/ranger-class-resources.cjs](../tests/ranger-class-resources.cjs), [tests/ranger-class-resources-browser.cjs](../tests/ranger-class-resources-browser.cjs) |

## Rogue · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Expertise **[implemented]**<br>Sneak Attack **[unreviewed]**<br>Thieves' Cant **[partial]**<br>Weapon Mastery **[partial]** |
| 2 | Cunning Action **[unreviewed]** |
| 3 | Rogue Subclass **[unreviewed]**<br>Steady Aim **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Cunning Strike **[unreviewed]**<br>Uncanny Dodge **[unreviewed]** |
| 6 | Expertise **[implemented]** |
| 7 | Evasion **[unreviewed]**<br>Reliable Talent **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Ability Score Improvement **[partial]** |
| 11 | Improved Cunning Strike **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Devious Strikes **[unreviewed]** |
| 15 | Slippery Mind **[implemented]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Elusive **[unreviewed]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Stroke of Luck **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Expertise · 1 | Proficient skill choices, level allowance, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Sneak Attack · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Thieves' Cant · 1 | Fixed language appears. The additional language choice still needs structured support. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs) |
| Weapon Mastery · 1 | Weapon choices, class-level allowance, proficiency gating and property reminders exist. Audit remaining property-specific statistics/conditions against the source. | [tests/weapon-mastery.cjs](../tests/weapon-mastery.cjs), [tests/weapon-mastery-browser.cjs](../tests/weapon-mastery-browser.cjs) |
| Cunning Action · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Rogue Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Steady Aim · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Cunning Strike · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Uncanny Dodge · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Expertise · 6 | Proficient skill choices, level allowance, nonstacking contribution and persistence. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs), [tests/class-expertise-browser.cjs](../tests/class-expertise-browser.cjs) |
| Evasion · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Reliable Talent · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 10 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Improved Cunning Strike · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Devious Strikes · 14 | Source-rule comparison and structured fields still need review. | Pending |
| Slippery Mind · 15 | Saving throw proficiency from actual Rogue level 15: Wisdom in 2014, Wisdom and Charisma in 2024. Automatic, nonstacking, preserved manual adjustments; source reminders and print. | [tests/class-saving-throw-training.cjs](../tests/class-saving-throw-training.cjs), [tests/class-saving-throw-training-browser.cjs](../tests/class-saving-throw-training-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Elusive · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Stroke of Luck · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Sorcerer · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Innate Sorcery **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Font of Magic **[partial]**<br>Metamagic **[partial]** |
| 3 | Sorcerer Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Sorcerous Restoration **[implemented]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | Sorcery Incarnate **[unreviewed]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | Metamagic **[partial]** |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Metamagic **[partial]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Arcane Apotheosis **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Innate Sorcery · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Font of Magic · 2 | Class Sorcery Point maximum, finite spend/undo, Metamagic cost spending and rest recovery are tracked. Spell-slot-to-point conversion and temporary slot creation remain pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Metamagic · 2 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Sorcerer Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Sorcerous Restoration · 5 | Legacy Sorcerer 20 restores four points on each Short Rest; revised Sorcerer 5 restores half class level rounded down once per Long Rest. Recovery uses capped actual class levels and persists the once-per-Long-Rest limit. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Sorcery Incarnate · 7 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Metamagic · 10 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Metamagic · 17 | Edition-specific choices, costs, conditional reminders and spending from the class Sorcery Point pool are structured. Temporary per-cast spell modifications still resolve at the table. Metamagic Adept choices and its restricted extra points remain separate and pending. | [tests/sorcerer-points-and-metamagic.cjs](../tests/sorcerer-points-and-metamagic.cjs), [tests/sorcerer-points-and-metamagic-browser.cjs](../tests/sorcerer-points-and-metamagic-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Arcane Apotheosis · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Warlock · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Eldritch Invocations **[partial]**<br>Pact Magic **[unreviewed]** |
| 2 | Magic Cunning **[unreviewed]** |
| 3 | Warlock Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Contact Patron **[unreviewed]** |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | Mystic Arcanum **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | Mystic Arcanum **[unreviewed]** |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | Mystic Arcanum **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | Mystic Arcanum **[unreviewed]** |
| 18 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Eldritch Master **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Eldritch Invocations · 1 | Passive effects and Agonizing Blast/Eldritch Spear have structured fields and source-specific modifiers. Casting invocations, pact weapons/boons and expanded source options still need review. | [tests/warlock-invocation-effects.cjs](../tests/warlock-invocation-effects.cjs), [tests/warlock-invocation-effects-browser.cjs](../tests/warlock-invocation-effects-browser.cjs), [tests/character-class-feature-choices.cjs](../tests/character-class-feature-choices.cjs), [tests/warlock-cantrip-invocations.cjs](../tests/warlock-cantrip-invocations.cjs), [tests/warlock-cantrip-invocations-browser.cjs](../tests/warlock-cantrip-invocations-browser.cjs) |
| Pact Magic · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Magic Cunning · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Warlock Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Contact Patron · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Mystic Arcanum · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Mystic Arcanum · 13 | Source-rule comparison and structured fields still need review. | Pending |
| Mystic Arcanum · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Mystic Arcanum · 17 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Eldritch Master · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Wizard · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Arcane Recovery **[implemented]**<br>Ritual Adept **[unreviewed]**<br>Spellcasting **[partial]** |
| 2 | Scholar **[implemented]** |
| 3 | Wizard Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Memorize Spell **[unreviewed]** |
| 6 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 7 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 8 | Ability Score Improvement **[partial]** |
| 9 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 10 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 11 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 15 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Spell Mastery **[unreviewed]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Signature Spells **[unreviewed]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Arcane Recovery · 1 | Atomic selection/recovery of expended slots, combined rounded-up actual Wizard-level budget, no level-6+ slots, one activation, ordinary/Pact pool separation, source-specific daily/Long Rest reset, save/reopen and print. The player confirms the eligible Short Rest; calendar advancement is explicit in legacy rules. | [tests/wizard-arcane-recovery.cjs](../tests/wizard-arcane-recovery.cjs), [tests/wizard-arcane-recovery-browser.cjs](../tests/wizard-arcane-recovery-browser.cjs) |
| Ritual Adept · 1 | Source-rule comparison and structured fields still need review. | Pending |
| Spellcasting · 1 | Class-aware spell access, preparation and multiclass profiles exist. Verify the complete feature and all source-specific exceptions at every level. | [tests/character-spellcasting.cjs](../tests/character-spellcasting.cjs), [tests/character-progression.cjs](../tests/character-progression.cjs) |
| Scholar · 2 | Choose an eligible proficient Scholar skill at Wizard 2; expertise contribution is calculated once. | [tests/character-class-expertise.cjs](../tests/character-class-expertise.cjs) |
| Wizard Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Memorize Spell · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Spell Mastery · 18 | Source-rule comparison and structured fields still need review. | Pending |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Signature Spells · 20 | Source-rule comparison and structured fields still need review. | Pending |

## Artificer · Eberron revised · 2024

| Class level | Features arriving at this level |
| --- | --- |
| 1 | Spellcasting **[partial]**<br>Tinker's Magic **[partial]** |
| 2 | Replicate Magic Item **[unreviewed]** |
| 3 | Artificer Subclass **[unreviewed]** |
| 4 | Ability Score Improvement **[partial]** |
| 5 | Subclass feature **[unreviewed]** |
| 6 | Magic Item Tinker **[unreviewed]** |
| 7 | Flash of Genius **[implemented]** |
| 8 | Ability Score Improvement **[partial]** |
| 9 | Subclass feature **[unreviewed]** |
| 10 | Magic Item Adept **[partial]** |
| 11 | Spell-Storing Item **[unreviewed]** |
| 12 | Ability Score Improvement **[partial]** |
| 13 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 14 | Advanced Artifice **[implemented]** |
| 15 | Subclass feature **[unreviewed]** |
| 16 | Ability Score Improvement **[partial]** |
| 17 | No new named base-class feature in the shipped reference; check scaling and subclass progression separately. |
| 18 | Magic Item Master **[implemented]** |
| 19 | Epic Boon **[unreviewed]** |
| 20 | Soul of Artifice **[partial]** |

| Feature / level | Review scope | Test evidence |
| --- | --- | --- |
| Spellcasting · 1 | Fixed prepared counts and cantrip allowances at levels 1–20, extra Mending through the spell generator, source-aware spell membership and multiclass slot contribution. Subclass grants still need review. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Tinker's Magic · 1 | Mending is an additional automatic spell-generator grant. Temporary gear creation and its use counter remain table tracked. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Replicate Magic Item · 2 | Source-rule comparison and structured fields still need review. | Pending |
| Artificer Subclass · 3 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 4 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Subclass feature · 5 | Source-rule comparison and structured fields still need review. | Pending |
| Magic Item Tinker · 6 | Source-rule comparison and structured fields still need review. | Pending |
| Flash of Genius · 7 | Reaction reminder for a failed check/save, Intelligence bonus and uses with minimum 1, source-specific saved count, Use/Undo and rest recovery. Roll resolution remains at the table. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Ability Score Improvement · 8 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Subclass feature · 9 | Source-rule comparison and structured fields still need review. | Pending |
| Magic Item Adept · 10 | Four attunement slots at actual Artificer 10; crafting controls still pending. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Spell-Storing Item · 11 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 12 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Advanced Artifice · 14 | Five attunement slots and one Flash of Genius use recovered on a Short Rest from actual Artificer 14. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Subclass feature · 15 | Source-rule comparison and structured fields still need review. | Pending |
| Ability Score Improvement · 16 | Actual class-level feat/ASI budget exists. Verify every ability-increase path, caps and user-facing choice against the source. | [tests/character-play-rules.cjs](../tests/character-play-rules.cjs), [tests/multiclass-asi-browser.cjs](../tests/multiclass-asi-browser.cjs) |
| Magic Item Master · 18 | Six attunement slots at actual Artificer 18 without counting levels in other classes. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |
| Epic Boon · 19 | Source-rule comparison and structured fields still need review. | Pending |
| Soul of Artifice · 20 | Short Rest restores all Flash of Genius uses while attuned to an owned magic item at actual Artificer 20. Cheat Death and replicated-item ending still need controls. | [tests/artificer-source-versions.cjs](../tests/artificer-source-versions.cjs), [tests/artificer-source-versions-browser.cjs](../tests/artificer-source-versions-browser.cjs) |

