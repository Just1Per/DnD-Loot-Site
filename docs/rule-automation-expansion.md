# Rule automation expansion — 23 November 2026

Source: locally pinned 5etools revision `b9061583536101068b3a59d27e886d1fa664e366`. Generators export names, source identity, bounded choices and mechanical facts. Full rule entries and copied source prose are excluded.

## Species and free casting

Every unlocked racial spell whose declared usage is once per Long Rest now has an independent use/undo counter and Long Rest recovery. Spending does not consume a spell slot. Character-level gates, chosen casting ability and source identity remain separate from class level and class resources. Qualified spell names such as Nondetection (no material component) resolve to the catalogue while preserving the restriction in the action notes. Legacy Tiefling Hellish Rebuke retains its second-level free casting. Flamekin and Rimekin gain their fixed source cantrips and level-3/5 spells; only the Rimekin racial Flame Blade deals Cold damage.

## Feats

New structured facts cover fixed training/expertise, resistance, damage/condition immunity and senses. Damage-resistance choices have bounded selectors, reject duplicates and remain inactive until valid. Bonus Darkvision extends the final species/class range. Only fixed facts from an unambiguous proficiency package are applied; source alternatives are not combined.

69 feats with spell-grant adapters have fixed and/or selected spell references. 27 feats include source-filtered choices for spell level, class list, school, ritual or attack requirements. Examples include Fey Touched, Shadow Touched, Artificer Initiate, Wood Elf Magic and Aberrant Dragonmark. Complete ability-score and casting-ability choices in Feats. Fixed spells and valid choices appear as separate spell-sheet/attack sources, without using a class learning/preparation allowance. Free castings have separate counters. Fey Teleportation and Aberrant Dragonmark recover on Short or Long Rest; ordinary daily grants recover on Long Rest. Unknown shared pools and alternative packages are not combined or converted into invented uses.

Alternative packages now include Strixhaven colleges, High Sorcery moons, Spell Sniper lists, Scion planes, Siberys spell selection, Magic Connoisseur and conditional replacement cantrips. One package is active at a time. Scion resistance stays tied to its cantrip; replacement cantrips need explicit confirmation of the already-known cantrip. Magic Connoisseur uses the actual completed 2024 Magic Initiate list and ability. Siberys suggestions do not require owning a dragonmark; its one free casting recovers on Short or Long Rest.

Ritual Caster has distinct edition adapters. Legacy books select one of six class lists and its casting ability, two initial level-1 rituals and up to 40 recorded copied rituals filtered by list, ritual tag and the current half-level limit (rounded up). Copying time and cost remain explicit; no coins are spent. These are ritual-only references, without a daily pool or normal slot casting. Revised Ritual Caster selects level-1 rituals equal to current Proficiency Bonus, uses its increased ability, and has a separate Quick Ritual counter recovering on Long Rest. Existing choices remain available while a newly unlocked choice is empty.

Rune Shaper selects half Proficiency Bonus (rounded down) known runes. Each rune has an explicit inscribed/worn-or-carried checkbox; inactive runes supply no spell reference and cannot spend their free use. Their counters remain visible, with undo available. Long Rest restores daily counters and fades all inscriptions; confirm new inscriptions afterward. Comprehend Languages has its own daily casting. Daily spell ledgers also recover while a feat or species is deselected, without resetting unrelated class counters or spell slots. Rune swaps, eligible objects, ritual-book copying and spell targets remain explicit decisions.

Cloying Mists and Treacherous Allure supply their always-prepared spells and individual Long Rest castings using the feat's increased ability. Vampire Touched adds a filtered level-1 Enchantment/Illusion choice and a separate Spider Climb casting; the free Spider Climb is self-only. Fog occupancy, speed reduction and the Charmed target remain explicit; Treacherous Allure adds an attack reminder without a permanent hit bonus. Outlands Envoy requires the actual Outlands Scion package and inherits its chosen casting ability, independently of the Envoy ability increase. Misty Step and Tongues retain distinct daily counters and the Tongues material-component exception. Invalid saved casting abilities outside a feat's allowed list no longer generate spell grants or free-casting counters.

All twelve Eberron dragonmark expanded spell tables now extend actual Spellcasting/Pact Magic class lists. Each class keeps its own learning/preparation rules and reachable spell levels; expanded lists do not create free preparation, slots or spellcasting for a martial class. Mark of Handling’s two fixed free castings remain separate. Emerald Enclave Fledgling’s prepared Speak with Animals has no invented free-use pool and retains its 8-hour ritual reminder.

Missing optional spell configuration does not disable an independent feat reaction. A feat casting of a spell also known by a class retains its own ability and item-bonus scope. Additional rules, such as a familiar command, Metamagic, concentration exception or forced transformation, retain concise source-specific instructions and the existing explicit feature controls.

## Items

The generator resolves all 67 standalone item copy chains before filtering relevant facts and all five inherited generic templates. The resulting export has 1,253 relevant items, 230 base items and all 230 generic templates. It retains child overrides, parent requirements, source edition and inherited casting family. It never imports parent rule entries. A new or unsupported mechanical copy modification fails generation rather than silently changing a fact.

Reviewed held/worn and attuned items apply scoped spell-attack/DC bonuses. Artificer tools, Wizard grimoires, Sorcerer vials, Bard instruments, Moon Sickles and Pact Keeper rods affect only their named casting classes. Devout amulets and general spell bonuses follow their reviewed source scope. Within one bonus family, use the highest bonus; different eligible families can combine. The actual allocated class levels determine eligibility, including legacy Artificer Magic Item Savant. Unknown additional prerequisites leave new bonuses inactive with a warning. Feat-only spellcasters can qualify for general spellcaster items.

Protection and luck items apply their reviewed save/check bonuses to ability saves, death saves, skills, tools, initiative and passive checks. Wearing/holding is represented by Equipped; required attunement must also be active. Removing ownership, equipping state or attunement removes derived bonuses. The Netherese ring's general bonus is +1; its special +4 applies only to the stated dropping/disarming check. Stone of Ill Luck's concealed curse remains a DM decision. Activated auras and conditional immunities are not made permanent from metadata alone.

## Spell actions

A reviewed numeric override set now fills 38 further missing action formulas, bringing the catalogue to 241 computed damage references. It covers direct spells such as Catapult, Arms of Hadar, Frost Fingers, Snowball Swarm, gravity spells and Psychic Lance. Crown of Stars and Minute Meteors scale their projectile counts while retaining per-projectile damage. Remaining projectile uses are tracked explicitly at the table.

Ice Storm and Flame Strike now show both damage types and their edition-specific slot scaling. Contact Other Plane displays the caster’s fixed DC 15 Intelligence save; Synaptic Static’s concentration penalty no longer creates a second Constitution save in the spell’s primary-save field. Damage/area short descriptions retain these distinctions.

The pinned class-source lookup stores some original supplement lists under `classVariant`. The catalogue now includes those class memberships only when the spell’s own source defines them: 122 spell records are corrected. For example, 2014 Ice Knife and Synaptic Static return to their real class lists. Unrelated optional expansions, such as Tasha’s additions to a PHB spell, are not imported through this rule; campaign edition filters are retained. [Provenance ledger](spell-class-list-audit.json). `build-rules-catalog.py --spells-only` regenerates spell/catalogue outputs without replacing independently maintained feat references.

Compound damage now retains each component’s real type. A type-specific bonus, such as Cold Elemental Affinity, applies to the matching component; a general one-roll bonus appears only once with an instruction to assign its component. Unresolved damage-type choices wait for that choice before applying type-dependent bonuses. Explicit Psychic conversion and Rimekin’s Cold conversion are resolved before eligibility for elemental bonuses.

The paper uses separate compact dice/type fields and short save labels, while keeping full human-readable source details in the attack information. Spell-attack proficiency circles are marked correctly. Manual hit/DC/dice/damage adjustments update the compact fields too; the browser checks actual text fit and an exported PDF.

Saved class spell actions are checked against the current class level, source list and edition. Losing a class/feat/list grant disables the action without deleting its saved spell. Explicit Additional spells and unassigned legacy references remain available through their intended manual source. Access is calculated once per action pass and shared with granted-spell resolution.

Ice Knife shows its separate piercing hit and Cold explosion, with the explosion's own upcasting, save DC and target-area reminder. Flame Blade uses the correct edition-specific scaling and the revised spellcasting damage modifier. Chromatic Orb and Chaos Bolt retain their damage-type choice instructions and slot scaling. Available area facts appear beside action notes. A reference never spends a slot, chooses targets or applies damage to another character.

## Coverage and remaining work

[The reproducible audit](rule-automation-audit.md) inventories all 105 selectable species, 302 feats, 969 spells and 186 subclasses. All 186 subclass adapters exist. Their retained `partial-mechanics` status describes explicit table decisions and is now accompanied by a separate implementation status/reason.

This delivery does not close all rule automation. The JSON identifies 13 other feat spell-grant groups for review, 146 damage references without an action formula, and item metadata whose conditional scope has no reviewed automatic adapter. These are distinct from missing source descriptions or missing subclass adapters. Next work should review remaining source-dependent spell packages, individual compound or weapon-dependent spell formulas, and explicit spell/item activation and duration controls. Keep conditional powers tied to deliberate controls rather than granting permanent buffs.

## Validation

`tests/rule-automation.cjs` covers the new facts, source/level/edition boundaries, same-spell multiclass isolation, use/recovery, removal and immutability. `tests/rule-automation-audit.cjs` verifies the committed audit from shipped metadata without requiring the ignored source cache. The connected browser regressions exercise the real native feat choices, spell selection, free-casting controls, ritual books/copying, rune inscription/fading, private Save/reopen, mobile reflow and axe checks while preserving HP, slots, coins and inventory. Existing engines, DOM and Firestore access/revision checks remain required.

No Firebase rules, schema migration, dependency or production catalogue write is required. Merge and deployment remain owner actions.
