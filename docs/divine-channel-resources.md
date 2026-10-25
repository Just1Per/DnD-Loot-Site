# Cleric and Paladin divine resources

Combat’s existing resource panel now provides a compact **Channel Divinity effect** selector, the selected effect’s class-based DC/formula and finite **Use selected effect / Undo use** controls. Saving/reopening retains the last used effect and spending. Print includes the class pools and unlocked effect details. Guide and inline hover/focus help explain the source rules without extra question-mark buttons.

## Edition and multiclass pools

- **2014:** Cleric 2/6/18 permits 1/2/3 uses. Paladin 3 permits one. A multiclass character shares **one pool with the higher limit**, rather than adding the limits. Short or Long Rest restores it.
- **2024:** Cleric 2/6/18 permits 2/3/4 uses; Paladin 3/11 permits 2/3. Each class has its own pool. Short Rest restores one use in each eligible pool; Long Rest restores all.

Actual capped/assigned class levels set the limits. The primary class or total level does not unlock another class’s effects. Edition changes preserve separate counters. Removing a class hides its unavailable effects without deleting saved choices.

## Effect choices

Revised Clerics choose Divine Spark healing, Radiant damage, Necrotic damage or Turn Undead. The current Wisdom modifier and actual Cleric-level die scaling are shown. Turn Undead carries the source-specific Sear/Destroy reminder. Revised Paladins choose Divine Sense and, from 9, Abjure Foes. Their DC uses Charisma; Cleric effects use Wisdom, including the current generic spell-DC adjustment. The primary caster’s spellcasting ability is not substituted.

An eligible selected oath/domain also exposes a labelled subclass-effect entry using that class’s pool/DC. It is a use counter and source reminder; exact subclass-specific target/action automation remains separate. A legacy Paladin without an eligible chosen oath cannot spend that oath entry. Invalid effects and empty pools cannot consume a use.

Legacy Divine Sense remains separate from Channel Divinity: **1 + current Charisma modifier**, possibly zero, with Long Rest recovery. Revised Divine Sense uses the Paladin Channel Divinity pool. Neither grants a permanent sight bonus.

Rolls, healing, damage, targets and conditions resolve at the table. These controls do not modify HP, temporary HP, spell slots, permanent saving throws or other class resources. Undo reverses a mistaken use; it is not an action log or automatic reversal of a resolved table effect.

## Validation and scope

Tests cover both editions and levels 1–20, Cleric/Paladin multiclass sharing and separation, finite use/undo, source/level/subclass guards, final ability modifiers, class-specific DCs, partial/full rests, source changes, save/reopen, print, mobile and accessibility. The existing all-class save-envelope matrix covers the new readouts too.

This implements base divine use tracking and effect selection, not complete Cleric/Paladin audits. Auras, smite, Divine Intervention, all domain/oath effects and automatic target/condition handling need separate work.

Official sources: [2014 classes](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2014 SRD multiclass rules](https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0_License_live%20links.pdf), and [2024 classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Descriptions are concise original summaries; mechanical reference data retains its existing source attribution.

No Firestore/Storage rule changes, production catalogue publication, deployment or migration required. The existing class-feature string-array envelope stores counters and the last used effect; no top-level fields are added.
