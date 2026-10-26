# Cleric: Blessed Strikes (2024)

At actual Cleric 7, Character Builder offers one Blessed Strikes choice. It replaces an older subclass's Divine Strike or Potent Spellcasting, rather than adding another copy. Actual class level, not total character level, unlocks the feature and its Cleric 14 improvement. Legacy 2014 base-class behavior remains unchanged.

- **Potent Spellcasting:** current final Wisdom modifier contributes to damaging Cleric cantrips. Source-labelled spell copies keep Cleric, Druid and Warlock modifiers separate; an ambiguous multiclass copy receives no guessed bonus. Guidance/Resistance check dice and Shillelagh's weapon enchantment do not qualify. Conditional Toll the Dead damage carries the modifier as a reminder without inventing a fixed base damage expression.
- **Divine Strike:** weapon actions show the conditional once-per-own-turn rider, 1d8 Necrotic or Radiant, increasing to 2d8 at Cleric 14. Choose the type on a hit. It does not inflate every attack's damage or apply to unarmed attacks, Beast attacks, spells or the 2024 Net attack replacement. Resolve the hit and extra dice at the table.
- **Improved Potent Spellcasting, Cleric 14:** Combat → Blessed Strikes → Grant temporary HP after cantrip damage. Select the damaging Cleric cantrip and confirm it actually damaged a creature, then choose yourself or another creature within 60 ft. The amount is twice current Wisdom; zero/negative Wisdom grants no positive temporary HP. No positive minimum is invented.

Self records only temporary HP, never normal HP, healing or revival. Existing temporary HP can be kept, replaced, or compared to keep the higher amount; it never stacks. A fresh damage acknowledgement is required after recording the benefit. Rendering the sheet, choosing the feature or casting a non-damaging spell never grants HP. Another recipient receives instructions and makes their own keep/replace decision; their private sheet is never written. No unsupported per-turn/day cap is imposed on this cantrip-damage trigger.

The existing sheet save persists the choice and self temporary HP. Overview, print, the top Guide and contextual label help describe the choice. Class/source changes retain saved choices without keeping an unavailable derived benefit active.

## Validation and scope

Fourteen engine cases exercise both editions, levels 1–20, current Wisdom, conditional damage, weapon exclusions, shared class cantrips, multiclass ambiguity, capped/duplicate class rows, atomic invalid requests, temporary HP modes, recipient privacy and saved envelopes. Real-browser coverage exercises selection, triggered use, nonstacking, replacement, live Wisdom, save/reopen, stale authentication, Divine upgrade, responsive layout and accessibility. The Firebase emulator saves and reloads the choice and temporary HP through the actual store, allows DM editing and denies unrelated users. Existing Druid and Warlock regressions remain required.

This is partial automation: attack hits, turn eligibility, damage resolution, recipient range and another creature's HP are resolved at the table. It does not claim complete Cleric/subclass automation. See the generated class-level review for remaining features.

**Rules/deployment:** no Firestore or Storage rule changes, migration or production deployment. The choice uses the existing `classFeatureChoices` string-array map; temporary HP uses the existing field.

Source: [D&D Beyond Basic Rules 2024, Cleric levels 7 and 14](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), checked 26 October 2026; shipped SRD 5.2.1 reference. No new table rule is needed for this Cleric feature.
