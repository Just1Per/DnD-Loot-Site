# Character rules engine: race, class and background foundations

This branch builds on the merged character sheets. It targets 2014 rules, matching the supplied PDF and SRD 5.1. It is not a 2024 rules implementation: those rules move ability increases to backgrounds.

## Available choices

The race dropdown includes all nine base race entries found in the supplied PDF's embedded base race list: Dragonborn, Hill Dwarf, High Elf, Rock Gnome, Lightfoot Halfling, Half-Elf, Half-Orc, Human and Tiefling. Dragonborn has all ten ancestry choices. It is not an exhaustive catalogue of all published books. The website's short descriptions and structured mechanics are original adaptations of the CC-licensed SRD 5.1, with attribution in the visible rules-attribution.html page. None of the PDF's Acrobat scripts execute on the website.

All twelve SRD base classes are selectable. Acolyte is the supplied SRD background; other backgrounds and races remain custom/manual. Class selection sets the class label and initial spellcasting ability; selecting Custom/manual retains the last class label for editing. Multiclass, subclasses, feats and level-up ASIs still require manual handling.

## Automatic effects

- Racial ability bonuses contribute to effective scores, saving throws, skills, attacks, initiative and spell DCs when Base mode is enabled.
- Half-Elf requires two distinct non-Charisma ability choices and two distinct skill choices. Invalid/duplicate selections display warnings and are never applied twice. Incomplete drafts can be saved.
- Race traits, movement, size, darkvision, resistances, languages, proficiencies and granted spells appear in a calculated summary. Notes, manual proficiencies and manually recorded skills remain separate.
- Hill Dwarf maximum-HP bonus scales with character level. The shared Base/Final mode controls both ability and racial HP bonuses. Constitution changes and class HP are not otherwise automated.
- Dragonborn breath weapon scales at levels 6, 11 and 16, with ancestry-specific shape, resistance and save. Its DC uses effective Constitution and proficiency.
- High Elf offers a wizard cantrip choice; Tiefling racial spells unlock at levels 3 and 5. These are shown as racial grants without overwriting the manually entered spellbook. Their use/recovery is tracked manually.
- Class hit dice and saving throws; selected class skills; racial and background skill grants. Skill proficiency is combined with manual training using the higher rank, never added twice.
- Optional class spell slots: full caster, Paladin/Ranger half-caster, or Warlock Pact Magic. Slots spent remain manual. Lowering a level can require correcting spent slots before saving. Warlock Mystic Arcanum, rests, subclass spells and multiclass slots are not automated.
- Acolyte grants Insight, Religion, two language choices and its background feature summary.

## Existing sheets and schema

Existing sheets default to **Final totals**, with no race or class inferred from free text. Their original numbers and notes remain unchanged. New sheets default to **Base scores / HP**. Choose the correct mode before applying automation to a manually completed character.

Sheets now save as schemaVersion 2. The UI accepts version 1 and 2. Version 2 prevents old clients from opening and silently dropping builder data, and rules reject a downgrade to version 1. Unsaved drafts in an older open tab still use the revision conflict check. Refresh the preview after deployment; module URLs are versioned to avoid mixing cached files.

## Firebase rules update required

Publish this branch's firestore.rules before saving with the new builder. The change adds `build` to the allowed private sheet fields, accepts schema 2, checks its rules edition, and rejects schema downgrades. Access remains restricted to the owning player and campaign DM/owner. No Functions or Storage changes are needed.

## Testing

Run `npm test` and `npm run test:rules` from `tests/` after `npm ci`.

- 26 calculation/data tests: legacy compatibility, all racial bonuses, switching races, Half-Elf validation, proficiency combination, dwarf HP/healing, breath progression, innate spells, class skills, full/half/pact slots and normalization.
- 59 DOM checks: existing sheets/loot plus builder options, changes, persistence, notes preservation and reopen.
- 19 Firestore emulator checks: private reads/writes, simultaneous edits, conflicts, schema upgrade validation, downgrade prevention and revoked membership.

No production data or Firebase Console settings are changed by these tests. Real browser/mobile visual review remains a user acceptance step on the preview.
