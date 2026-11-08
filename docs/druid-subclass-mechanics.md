# Druid circle mechanics

All eleven selectable circles were checked against pinned `class/class-druid.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. Original short descriptions and structured numbers are shipped; source entries stay in the ignored cache.

Circle features use actual Druid levels. Native Moon forms continue to use the established Wild Shape engine for CR, movement restrictions, AC, temporary HP, elemental exceptions, form saves and attack guidance. The existing tested legacy-Moon compatibility path in that engine is preserved.

Land spell packages remain distinct, including the revised cantrips. Unchosen packages grant nothing. Natural Recovery validates one atomic slot plan, its rounded-up class-level budget, eligible expended slots and once-per-Long-Rest use. Revised Land has an independent free Circle Spell use.

Alternate forms spend the existing Wild Shape pool. Symbiotic Entity grants its own non-stacking temporary HP and doubles Halo damage while those HP remain; replacing a higher existing pool requires explicit selection. Starry Form has constellation choices, Dragon flight, Full of Stars resistance, Archer attack formulas and a Chalice roll calculation. Legacy Stars' free Guiding Bolt/Cosmic Omen pools use proficiency; revised Stars uses Wisdom. Sea keeps permanent swimming separate from active Stormborn and correctly charges two uses for Oceanic Gift affecting self and an ally.

Dreams has its class-level d6 pool and per-activation half-level cap. Shepherd adds Sylvan and level-scaled totem/summon guidance. Spores adds its condition immunities and reaction calculations. Wildfire uses shared Wild Shape summons and separate Cauterizing Flames/Blazing Revival counters with explicit timing. Moonlight Step restores exactly one use per level-2+ slot.

Targets, rolls/saves, movement, summon stat blocks and command turns, light, available space and durations remain table adjudications. Form/end controls must be used when durations or ending conditions occur. External temporary-HP replacement cannot be inferred from an unrelated player's actions.

Validation: `tests/druid-subclasses.cjs`, existing Wild Shape, Beast Spells, Elemental Fury and Druid conversions, plus the Wild Resurgence browser fixture covering Starry activation/end and the Natural Recovery slot plan.
