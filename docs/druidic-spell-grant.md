# Revised Druidic: Speak with Animals

The 2024 Druidic feature grants Druidic and always-prepared Speak with Animals from actual Druid level 1. The existing spell generator now adds that spell automatically, marks it Always prepared and excludes it from the ordinary prepared-spell allowance. Open Spells → Generate Druid spells → Apply to include it in an existing sheet. Existing selected spells and their class assignments are preserved.

This does not grant a free casting or spend Wild Shape: resolve casting/ritual rules normally. The 2014 base feature does not gain this automatic spell. The regression test also exposed uncapped spell profiles: profiles now count every assigned class (including martial classes) against the character-level budget, ignore duplicate class rows and preserve saved assignments. An explicit noncasting assignment cannot fall back to a stale primary-class field. Multiclass profiles use actual capped Druid levels; another class’s copy of a spell remains separate. Save/reopen and print keep the Druid copy.

Tests cover levels 1–20, edition and class isolation, extra preparation counts, a capped multiclass dip, locked automatic generation, save/reopen, print and preserved choices after edition changes. Guide and feature-audit notes describe the distinction. Firestore and Storage rules are unchanged; no migration or production deployment.

Source: [2024 Druidic, SRD 5.2.1](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Secret-message interactions remain table-resolved; this does not mark the whole Druid class complete.
