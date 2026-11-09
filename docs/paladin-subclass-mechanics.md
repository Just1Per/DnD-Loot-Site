# Paladin oath mechanics

All 14 selectable oaths were reviewed at levels 3–20 against pinned `class/class-paladin.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. Every oath has native Channel Divinity options and source-level spell grants. Legacy multiclass characters retain one shared Cleric/Paladin pool; revised pools remain separate.

Implemented self mechanics include Devotion Charmed immunity and owned Sacred Weapon attack bonus; Ancient revised resistances and distinct Sentinel healing; Glory speed, skill advantage and legacy carrying; Watchers Initiative; Redemption Persuasion; Oathbreaker melee weapon damage; Genie unarmored AC, elemental resistance and Djinni defenses. Limited-use defenses and all applicable capstone forms have counters, activation/end controls and eligible level-5 slot recharge. Active angel/genie flight, Watcher Truesight, Conquest resistances and Ancient regeneration affect the sheet.

The source descriptions distinguish action timing, edition-specific duration, ally effects, fear/save restrictions, transfer damage, target exceptions and aura ranges. These remain concise table instructions rather than automated target state. End duration controls explicitly when required. The audit retains partial-mechanics status for these boundaries.

Tests: `tests/paladin-subclasses.cjs` covers all edition/level boundaries, shared/independent CD payment, grants, aura suppression, healing, capstone and slot payment, Genie AC and owned-weapon scoping. Existing Channel Divinity tests now select the concrete Sacred Weapon option instead of the replaced placeholder. Browser coverage checks capstone activation, self flight and ending.
