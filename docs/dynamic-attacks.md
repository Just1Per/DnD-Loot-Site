# Dynamic backgrounds and Overview attacks

## Before saving

Publish this branch's **complete `firestore.rules`**. Automatic actions use schema **10**, preserving their references against older clients. Existing manual attacks, character text, and formats 1–9 continue to load.

No Functions or production data migration is required. The bundled spell catalogue now uses metadata version 3. An older Firestore catalogue falls back to the bundled one; the existing `scripts/import-rules.mjs` can optionally publish the new version.

## Overview → Add attack

Choose a looted item, standard weapon reference, selected spell/cantrip, Dragonborn breath weapon, improvised weapon, unarmed strike, or custom/manual action. Review the live preview and add it. Saved automatic actions have Edit and Remove controls on Overview. Combat's Add attack opens the same picker; existing manual fields remain available.

Actions save source references and choices rather than frozen damage strings. Current abilities, proficiency, edition, item mechanics, and supported feat bonuses are recalculated whenever the sheet updates. Referenced inventory must still belong to the character. Returning/using up an item marks its action unavailable without deleting the reference. An item in the backpack is labelled as needing to be readied; adding an action does not equip it or change AC.

- Battleaxe with STR 18 and PB +3: **+7**, **1d8 + 4 slashing**; choose two hands for **1d10 + 4**.
- Finesse weapons use the better STR/DEX modifier by default; thrown melee weapons retain their appropriate weapon ability. Supported equipment overrides and attunement requirements are respected.
- 2024 Net uses **DEX save DC 8 + PB + DEX**, with no damage. 2014 Net retains its weapon-attack rules.
- Improvised attacks use 1d4 and omit proficiency unless the supported Tavern Brawler feature grants it. DM adjudication still decides damage type and whether an object should use a standard weapon profile.
- Spell attacks use the sheet's casting ability (or an explicit per-action feature override), proficiency, and spell adjustments. Saving-throw spells show their target save and DC instead of a fabricated attack roll. Spells do **not** automatically add casting ability to damage. Spiritual Weapon does, according to its rules.
- Structured cantrip scaling and supported simple upcasting are applied. Eldritch Blast, Scorching Ray and Magic Missile show damage **per beam/ray/dart** and their count. Spiritual Weapon handles the different 2014/2024 upcast interval.
- Dragonborn breath uses the selected ancestry, edition, character level, CON modifier and proficiency.

These are formula calculations, not automatic dice rolls or combat resolution. Adding an action does not spend slots, ammunition, charges or racial uses. Generic unarmed attacks do not yet infer Martial Arts or other class-specific replacements. Spell riders, multiple damage phases, weapon-dependent spells such as True Strike, unsupported upcasting, invocations such as Agonizing Blast, and other conditional features remain explicit manual work. Unsupported spell damage is labelled **See spell effect**, not guessed. A feat/racial spell using a different casting ability needs its per-action ability override. Choose spells in the spellbook first; adding an attack does not grant spell access.

## Background suggestions

All four Story dropdowns now follow the selected background. Equivalent 2014/2024 backgrounds and variants map to the corresponding profile. Switching background refreshes the suggestions but preserves existing writing as Other, so it does not erase a character's history.

The supplied Adobe PDF contains only Acolyte's actual personality table. That table is still used. Other named backgrounds currently have clearly labelled, original background-specific prompts; these are **not a reproduction of the missing Adobe tables**. Exact matching requires the expanded PDF or its background data. The resolver prioritizes exact tables from `CharacterAdobeData.story` when supplied. Custom/manual remains available everywhere.

## Validation and references

Passed: 121 calculation/data tests, 179 DOM checks, and 33 Firestore permission/persistence checks (333 total).

Tests cover live ability changes, versatile/thrown weapons, ownership loss, edition-specific Nets, casting attack/save differences, cantrip/upcast scaling, multiple projectiles, spell ability damage, racial prerequisites, dynamic backgrounds, picker editing, and persistence. Firestore emulator checks enforce schema protection and the 60-action limit. Browser screenshot/print acceptance remains for preview review; no local Chromium is available.

Mechanical reference: https://www.dndbeyond.com/sources/dnd/br-2024/equipment . Spell data derives from the pinned SRD/metadata sources documented by `build-rules-catalog.py` and the existing catalogue attribution. Background fallback prompts are original writing.
