# Rule automation expansion — 23 November 2026

Source: locally pinned 5etools revision `b9061583536101068b3a59d27e886d1fa664e366`. Generators export names, source identity, bounded choices and mechanical facts. Full rule entries and copied source prose are excluded.

## Species and free casting

Every unlocked racial spell whose declared usage is once per Long Rest now has an independent use/undo counter and Long Rest recovery. Spending does not consume a spell slot. Character-level gates, chosen casting ability and source identity remain separate from class level and class resources. Qualified spell names such as Nondetection (no material component) resolve to the catalogue while preserving the restriction in the action notes. Legacy Tiefling Hellish Rebuke retains its second-level free casting. Flamekin and Rimekin gain their fixed source cantrips and level-3/5 spells; only the Rimekin racial Flame Blade deals Cold damage.

## Feats

New structured facts cover fixed training/expertise, resistance, damage/condition immunity and senses. Damage-resistance choices have bounded selectors, reject duplicates and remain inactive until valid. Bonus Darkvision extends the final species/class range. Only fixed facts from an unambiguous proficiency package are applied; source alternatives are not combined.

51 feat spell packages have fixed and/or selected spell references. 15 packages include source-filtered choices for spell level, class list, school, ritual or attack requirements. Examples include Fey Touched, Shadow Touched, Artificer Initiate, Wood Elf Magic and Aberrant Dragonmark. Complete ability-score and casting-ability choices in Feats. Fixed spells and valid choices appear as separate spell-sheet/attack sources, without using a class learning/preparation allowance. Free castings have separate counters. Fey Teleportation and Aberrant Dragonmark recover on Short or Long Rest; ordinary daily grants recover on Long Rest. Unknown shared pools and alternative packages are not combined or converted into invented uses.

Missing optional spell configuration does not disable an independent feat reaction. A feat casting of a spell also known by a class retains its own ability and item-bonus scope. Additional rules, such as a familiar command, Metamagic, concentration exception or forced transformation, retain concise source-specific instructions and the existing explicit feature controls.

## Items

The generator resolves all 67 standalone item copy chains before filtering relevant facts and all five inherited generic templates. The resulting export has 1,253 relevant items, 230 base items and all 230 generic templates. It retains child overrides, parent requirements, source edition and inherited casting family. It never imports parent rule entries. A new or unsupported mechanical copy modification fails generation rather than silently changing a fact.

Reviewed held/worn and attuned items apply scoped spell-attack/DC bonuses. Artificer tools, Wizard grimoires, Sorcerer vials, Bard instruments, Moon Sickles and Pact Keeper rods affect only their named casting classes. Devout amulets and general spell bonuses follow their reviewed source scope. Within one bonus family, use the highest bonus; different eligible families can combine. The actual allocated class levels determine eligibility, including legacy Artificer Magic Item Savant. Unknown additional prerequisites leave new bonuses inactive with a warning. Feat-only spellcasters can qualify for general spellcaster items.

Protection and luck items apply their reviewed save/check bonuses to ability saves, death saves, skills, tools, initiative and passive checks. Wearing/holding is represented by Equipped; required attunement must also be active. Removing ownership, equipping state or attunement removes derived bonuses. The Netherese ring's general bonus is +1; its special +4 applies only to the stated dropping/disarming check. Stone of Ill Luck's concealed curse remains a DM decision. Activated auras and conditional immunities are not made permanent from metadata alone.

## Spell actions

Ice Knife shows its separate piercing hit and Cold explosion, with the explosion's own upcasting, save DC and target-area reminder. Flame Blade uses the correct edition-specific scaling and the revised spellcasting damage modifier. Chromatic Orb and Chaos Bolt retain their damage-type choice instructions and slot scaling. Available area facts appear beside action notes. A reference never spends a slot, chooses targets or applies damage to another character.

## Coverage and remaining work

[The reproducible audit](rule-automation-audit.md) inventories all 105 selectable species, 302 feats, 969 spells and 186 subclasses. All 186 subclass adapters exist. Their retained `partial-mechanics` status describes explicit table decisions and is now accompanied by a separate implementation status/reason.

This delivery does not close all rule automation. The JSON identifies 31 other feat spell packages for review, 184 damage references without an action formula, and item metadata whose conditional scope has no reviewed automatic adapter. These are distinct from missing source descriptions or missing subclass adapters. Next work should review alternative spell packages/class-list expansion, individual compound or weapon-dependent spell formulas, and explicit spell/item activation and duration controls. Keep conditional powers tied to deliberate controls rather than granting permanent buffs.

## Validation

`tests/rule-automation.cjs` covers the new facts, source/level/edition boundaries, same-spell multiclass isolation, use/recovery, removal and immutability. `tests/rule-automation-audit.cjs` verifies the committed audit from shipped metadata without requiring the ignored source cache. The connected browser regression exercises the real native feat choices, spell selection, free-casting controls, private Save/reopen, mobile reflow and axe checks while preserving HP, slots, coins and inventory. Existing engines, DOM and Firestore access/revision checks remain required.

No Firebase rules, schema migration, dependency or production catalogue write is required. Merge and deployment remain owner actions.
