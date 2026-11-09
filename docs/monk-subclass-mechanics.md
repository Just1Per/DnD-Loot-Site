# Monk subclass mechanics

All ten 2014 traditions and four 2024 warriors were checked through level 20 against pinned `class/class-monk.json` revision `b9061583536101068b3a59d27e886d1fa664e366`. Four Elements disciplines were also checked against pinned `optionalfeatures.json`.

The shared Ki/Focus pool pays subclass actions atomically, including multi-point/variable costs and features with a second limited-use pool. Harm and other eligible effects track once-per-turn use. Open Hand healing uses distinct edition formulas and recovery. Mercy adds training, healing/harm results, enhanced Flurry and Ultimate Mercy counters. Shadow grants correct spells, revised darkvision and component restrictions. Elements and Astral forms have explicit activation/end controls affecting self movement, reach, damage and AC. Long Death tracks temporary HP and paid survival; Drunken Master applies its temporary movement. Dragon breath/wings/aura use independent counters and Ki alternatives. Kensei grants selected weapon/tool training, Martial Arts eligibility and active sharpening; Sun Soul provides a calculated ranged spell attack reference.

Target conditions, visibility, valid attack triggers, Flurry prerequisites, spell resolution and ally healing are explicit table decisions. Users end effects when their listed timing/conditions require it. The audit consequently retains partial-mechanics status rather than claiming encounter automation.

Regression coverage: `tests/monk-subclasses.cjs`, existing Monk base-class tests, and `tests/monk-subclasses-browser.cjs` cover edition/level boundaries, shared payment, healing, forms, movement, reach, spell grants, discipline gates and rendered activation/end/rest controls.
