# Druid Beast Spells and legacy Archdruid components

The active Wild Shape card in Companions now shows its spellcasting rules directly, with **Review spells & component requirements** linking to Spells. Each selected spell has a compact component-status label. Its existing information button explains the reason. Spell-action notes and printable spell sheets use the same check; the source’s original component text stays intact.

- **2014 Druid 18–19:** Beast Spells permits Druid-spell Verbal/Somatic components in Wild Shape, but no Material components, including an ordinary material or focus.
- **2014 Druid 20:** Archdruid ignores Verbal/Somatic and unpriced, unconsumed Material components for Druid spells, in normal form as well as Wild Shape. Costly or consumed materials are still required in normal form and unavailable in Wild Shape. Other classes do not gain this legacy component waiver.
- **2024 Druid 18+:** Beast Spells permits spells in Beast form, including other casting classes, except spells with costly or consumed Material components. It does not grant the legacy Archdruid component waiver outside Wild Shape.

Actual Druid levels follow the existing capped, source-aware Wild Shape progression, including multiclass and XP advancement. A retained invalid form prompts a check. Lower-level subclass exceptions, unassigned legacy casting sources, unknown Material data and optional consumption request source/DM review; they never silently become eligible. Ending Wild Shape removes its component labels, while the legacy level-20 normal-form benefit remains.

These are **component-permission reminders**, not spellcasting transactions. Preparation, known spells, slots, targets, concentration and other restrictions still apply. Reading, navigation and print do not mutate spells, slots, HP, resources or another character’s sheet. A status does not override subclass-specific exceptions or resolve spell effects.

## Verified metadata without a catalogue migration

`character-spell-component-data.js` contains only mechanical flags (Material present, priced, consumed/conditional) for all 969 shipped spell IDs. It is generated from the same pinned reference revision as the existing catalogue. No material descriptions or other non-SRD prose are copied. The 47 KB supplement loads with the deferred sheet tools, and works even if the campaign still reads an older Firestore catalogue. No remote catalogue update is needed.

Reproduce it from pinned source metadata:

```sh
python scripts/build-spell-component-flags.py --cache /tmp/campaignatlas-spell-source-cache
```

The generator rejects inherited, mismatched or unsupported component metadata instead of guessing. Unknown future/custom Material spells remain review cases. Tests verify exact catalogue-ID coverage, component agreement, representative flags and valid flag shapes.

## Validation and deployment

Engine tests cover both editions at levels 1–20, legacy/modern boundaries, normal and active forms, class ownership, multiclass caps, costly/consumed/ordinary/unverified materials, optional consumption, invalid forms and read-only action derivation. Browser checks cover the Companions link, statuses, information dialog, ending the form, save/reopen, both printable views, responsive layouts and accessibility. Existing Wild Shape, spell-generation, deferred-loader, help and print regressions remain required.

**No Firestore or Storage rules, saved-schema changes, production data migration or deployment.** The class audit remains partial because subclass exceptions and spell effects are not fully automated.

Primary rules checked 26 October 2026:
- [Legacy Druid — Beast Spells and the full Archdruid component benefit](https://www.dndbeyond.com/classes/3-druid)
- [D&D Beyond Basic Rules 2024 — Druid level 18](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)
- [Wizards SRD 5.1](https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf)
