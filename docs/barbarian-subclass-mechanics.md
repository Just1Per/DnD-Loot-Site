# Barbarian subclass mechanics

Reviewed source: `5etools-v1`, revision `b9061583536101068b3a59d27e886d1fa664e366`, `class/class-barbarian.json`. The local cache retains source entries; shipped code contains original short mechanical summaries only.

All nine selectable 2014 paths and four 2024 paths now have level-gated reports through Barbarian 20. Actual Barbarian levels determine feature unlocks and class scaling; total character level determines proficiency-based uses and DCs. Edition/subclass mismatches grant nothing. Class assignments consume the total-level budget, and duplicate class rows do not add features.

Implemented integrations:

- Builder choices for Totem animals and Tiger skills, Storm environment, legacy Zealot damage type, Beast form/adaptation, Giant cantrip/element, and Wild Heart animals.
- Shared Combat/paper counters for Consult the Spirits, Magic Awareness, Bolstering Magic, Infectious Fury, Call the Hunt, Fanatical Focus, Zealous Presence, revised Warrior of the Gods, Rage of the Gods, Intimidating Presence and group Tree travel.
- Short/Long Rest recovery and explicit **Enter Rage** control. Generic spending does not reset subclass counters. Enter Rage spends one use and resets once-per-Rage counters atomically; unlimited legacy Rage does not spend a finite counter.
- Revised Zealous Presence/Intimidating Presence can spend one Rage to restore their independent use. This is distinct from entering Rage.
- Permanent Storm Soul resistance/swim, Bestial Soul swim/climb, Wild Heart senses/swim/climb, Tiger skill proficiency, and Bear Aspect carrying/lifting capacity. Walking-derived movement follows class speed bonuses.
- Ritual and limited-feature spell grants in the existing spell selector, separate from preparation allowances and without granting Barbarian spell slots. Casting restrictions survive conversion to sheet rows.

Remaining work before declaring Barbarian complete:

- Automatic application of temporary combat forms, auras and conditional hit modifiers. Current reports specify dice, DCs, action timing, targets, equipment requirements and duration; they do not change every attack or permanently activate Rage bonuses.
- Automatic handling of event-specific temporary HP, damage reduction, death prevention, ally effects, forced movement and slot recovery received by another character.
- Giant language selection and equipment-specific attack rows for natural/spiked/infused weapons.

The mechanics audit deliberately retains `partial-mechanics` for these paths. A source review or a report is not a claim of full automation.

Validation: `tests/barbarian-subclasses.cjs`, existing Rage/Berserker, movement, carrying, spellcasting and resource tests, plus the Rage browser regression covering spending, save/reopen, subclass recharge, print, accessibility and narrow viewports.
