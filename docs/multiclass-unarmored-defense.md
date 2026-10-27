# Unarmored Defense across class sources

The old equipment calculation offered both Barbarian and Monk formulas in every edition and chose the higher value. That could grant a second **Unarmored Defense** feature under the legacy multiclass rules.

- **2014:** keep the first granting class in the saved class-list order. A later Barbarian or Monk does not grant this feature again. For example, DEX 14 / CON 12 / WIS 18 gives a Barbarian-first character AC 13, rather than silently using the later Monk formula for AC 16.
- **2024:** compare eligible formulas and use one highest total; never add their ability contributions together. The same character can use AC 16 regardless of which class is first.
- Worn armor replaces unarmored formulas. A Monk formula is unavailable with a wielded shield; a permitted Barbarian formula allows a shield. Natural armor and Draconic Resilience retain their separate legal alternatives.

The existing ordered class list is the available acquisition-order information; no historical class choices are reconstructed or migrated. Live sheet state takes precedence over its old save envelope, and only class levels within the current character-level budget can grant a formula. The calculation never rewrites ability scores, manual notes or equipment.

Inventory's existing **Armor & defenses** panel explains the edition-specific multiclass rule without introducing another panel or choice. The top Guide, AC help and printable Combat defenses include the explanation. The class audit marks only these feature scopes complete; other Monk/Barbarian features remain separately reviewed.

## Sources checked

The repository's pinned Open5e import of Wizards' SRD rules, revision `0acbf263c74caf8ad080af7a16d86d3700a1ac8f`, retains the different multiclass texts:

- [SRD 5.1 multiclass rules](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/Rule.json), `srd_multiclassing_unarmored-defense`: “If you already have the Unarmored Defense feature, you can't gain it again from another class.”
- [SRD 5.2.1 multiclass rules](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2024/Rule.json), `srd-2024_multiclassing_armor-class`: “If you have multiple ways to calculate your Armor Class, you can benefit from only one at a time.”

## Tests and Firebase

Equipment engine tests cover both class orders and editions through character levels 2–20, negative/competing modifiers via existing defense tests, shield conditions, worn/natural armor, Draconic alternatives, clipped/removed classes, live state versus saved envelopes and read-only derivation. The existing Monk browser suite additionally checks the actual Inventory explanation, AC values, saved/reopened class order, recalculation after order/source changes and Combat print. Existing Martial Arts behavior remains covered in the same suite.

No Firestore or Storage rule change, new saved field, migration or production deployment is required or performed.
