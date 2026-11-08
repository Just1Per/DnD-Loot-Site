# Cleric domain mechanics

All 20 selectable domains were checked against pinned `class/class-cleric.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. This includes the fourteen legacy domains and six revised domains, with separate FRHoF Knowledge and RHW Grave mechanics. Source prose is kept in the ignored local cache; shipped text uses original short descriptions.

Fixed spell grants use a generated name/level-only reference. Expanded spell lists and unchosen options are excluded. Arcana, Death and Nature cantrip choices and Arcane Mastery grants are separately validated against edition, class list, spell school and exact spell level. Granted cantrips use Cleric Wisdom, including Potent Spellcasting when eligible.

Shared Channel Divinity now lists each new domain's exact effect instead of a generic placeholder. Legacy Cleric/Paladin multiclass uses the existing shared pool; revised pools remain class-specific. Domain counters recover according to their own rules, including revised Light's level-6 Short Rest recovery, revised War Priest, Peace's proficiency-based Bond and Twilight flight uses.

Knowledge skills grant real Expertise. Revised Knowledge grants an artisan tool, telepathy guidance and Intelligence save training or a selected untrained replacement. Forge grants its resistances/immunity and Heavy-armor AC; its item blessing applies only to one owned nonmagical weapon or suit of armor and expires on the next Long Rest. Twilight grants 300-ft Darkvision and guarded dim-light flight activation with an end control. Revised War's Avatar resistance applies to all relevant damage, unlike the legacy nonmagical-attack restriction.

Legacy level-8 optional Blessed Strikes replaces, rather than stacks with, the original Potent Spellcasting/Divine Strike. Existing legacy Light guidance was corrected: Light is the bonus cantrip, and Corona imposes disadvantage on saves against Fire/Radiant spells rather than vulnerability. Legacy target/visibility restrictions and Knowledge's Visions timing were also corrected.

Targets, saves, critical-hit adjudication, aura membership, ally movement/reactions, external healing and temporary HP remain table decisions with explicit numbers and timing. The sheet does not mutate another player's character or invent an encounter clock. These boundaries remain visible in the mechanics audit.

Validation: `tests/cleric-subclasses.cjs`, the existing seven domain suites, shared Channel Divinity, spellcasting and action tests, plus the divine-resource browser fixture covering concrete Twilight channel selection and flight activation/end.
