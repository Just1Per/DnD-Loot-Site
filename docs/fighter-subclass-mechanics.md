# Fighter subclass mechanics

All 15 selectable Fighter archetypes were checked from level 3 through 20 against pinned revision `b9061583536101068b3a59d27e886d1fa664e366`, `class/class-fighter.json`, with the maneuver, rune and shot metadata in `optionalfeatures.json`. Runtime text consists of original short instructions.

- Champion: edition-specific critical thresholds, second style, revised Initiative/Athletics advantage, Heroic Inspiration and Survivor turn recovery. Existing legacy physical-check rounding remains shared with custom checks.
- Battle Master: known maneuver progression, artisan tool, revised skill, STR/DEX DC, dice scaling, individual maneuver resolution, temporary AC, revised free d8 per turn, Know Your Enemy recharge and legacy empty-pool Initiative recovery.
- Eldritch Knight: native edition spell profiles, INT Wizard list, cantrip/known/prepared allowances, legacy school quota, single-class third-caster slots and deduplicated multiclass contribution. Bond and attack substitution have explicit table instructions.
- Arcane Archer: shot selection, skill/cantrip, shared once-per-turn shot resource, damage scaling and empty Initiative recovery.
- Rune Knight: level-gated known/carried rune choices; passive training, senses and resistances; rune uses and active Frost/Hill effects; shared tool Expertise; Giant’s Might size, carrying, reach and once-per-turn extra damage.
- Psi Warrior: independent edition-specific die counts, Fighter-level die size, recovery, protective/strike calculation, Leap flight, Psychic resistance and die-paid feature recharge. Fighter Psi dice never use a Rogue pool.
- Cavalier, Samurai and Echo Knight: ability-based independent resources, source scaling, Fighting Spirit temporary HP, courtier skill/save choices and exact high-level instructions.
- Legacy Purple Dragon Knight and revised Banneret: social training, ally recovery/surge instructions, revised independent Group Recovery, Indomitable payment, ritual spell and level-18 immunities.

Resource spending does not activate a form. Activation and end controls track self effects explicitly; rests and turn/Initiative events reset only eligible counters. Target saves, movement geometry, echo locations, ally state and attack eligibility remain table decisions. These boundaries remain marked as partial mechanics in the audit.

Validation: `tests/fighter-subclasses.cjs` covers all archetype level/edition boundaries, independent pools, actual multiclass levels, rune prerequisites and equipment presence, critical scope, recovery, spell slots, self effects and once-per-turn limits. Browser regression exercises the shared resource panel and subclass actions.
