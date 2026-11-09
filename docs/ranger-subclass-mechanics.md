# Ranger subclass mechanics

All fourteen selectable subclasses were checked through level 20 against pinned `class/class-ranger.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. Companion numeric metadata was additionally checked in pinned XPHB, TCE and FTD bestiary files. No rule entries are shipped.

Hunter has native level-gated options and damage/extra-attack turn controls. Gloom Stalker distinguishes revised limited Psychic strikes from legacy first-turn attacks, adds Initiative, darkvision, save training and temporary speed. Fey Wanderer adds skill/Wisdom checks and independent spell pools. Horizon Walker and Monster Slayer have independent recovery, damage resolution and target instructions. Swarmkeeper has shared per-turn choice, flight and dispersal counters. Winter Walker has Cold resistance, rolled temporary HP/healing, reaction counters and active immunities. Hollow Warden spends the existing Favored Enemy pool, adds active AC, Constitution saves, healing/survival, Exhaustion immunity and slot recharge.

Beast Master distinguishes PHB companion rules, optional Tasha Primal Companion, and revised Primal Companion. Derived companion reference values use the correct class level, Wisdom/PB, AC, HP, attack, damage, movement and attack count. Drakewarden has summon/slot payment, active essence resistance, breath scaling, reaction pool and derived drake values. Companion current HP, commands and target state remain in the creature record or at the table.

Edition-specific spell grants enter the Ranger profile separately from normal spell allowance. Target damage immunity/resistance, per-recipient Fey/Polar strikes, movement geometry, durations and recipient effects remain explicit table decisions. Audit status remains partial mechanics for these boundaries.

Regression coverage includes all edition/level boundaries, native Hunter choices, Gloom/Fey calculations, companion editions, active drake resistance, shared Favored Enemy payment, Hollow survival and Winter immunities. Browser coverage checks Hollow activation/payment and ending.
