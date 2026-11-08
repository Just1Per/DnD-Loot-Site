# Warlock patron mechanics

All fourteen patrons were checked from their native start through level 20 against pinned `class/class-warlock.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. The generator separately exports legacy expanded spell choices. Legacy patrons do not automatically learn those spells; revised prepared grants do not consume the normal allowance. Genie lists follow the selected kind, including Wish at the correct Arcanum level.

Implemented mechanics include independent patron resources/recovery, Pact-only slot recharge, Celestial variable healing dice/rest temporary HP and Radiant Soul, Fiend temporary HP/Luck/Hurl differences, Archfey source-specific steps/defenses, GOO defenses/Hex instructions, Fathomless swim/tentacle damage and counters, Genie resistance/flight/Long Rest countdown, Hexblade owned-weapon CHA and scoped curse instructions, Undying healing, and source-specific Undead Dread/Husk/flight/immunities. Long Rest countdowns survive subclass removal. Husk writes Exhaustion into the persisted condition field.

Precise target eligibility, companion commands, curse targets, spell prerequisites, recipient state, reflection damage and timing remain table decisions. Explicit end controls stop forms. Ward and resource displays do not infer an encounter clock. Audit status stays partial mechanics for those boundaries.

Tests cover native level/edition progression, spell list versus grants, variable healing, independent Pact payment, countdowns, Dread states, Exhaustion, owned-weapon scoping and tentacle formulas. Browser regression checks revised Dread payment, temporary HP, flight and ending.
