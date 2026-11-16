# Race/species description audit

All **105 selectable species** have original explanations for their **427 source feature occurrences**. Remaining missing explanations: **0**.

Pinned 5etools revision: `b9061583536101068b3a59d27e886d1fa664e366`. Identity bindings retain the exact printing, including inherited/subrace features, replacement features and newer EFA/RHW/LFL versions. Only names, page/level metadata and original concise summaries are committed; source entries stay in the ignored cache.

The earlier catalog had direct cross-race instructions for Shadar-kai, Sea Elf and Feral Tiefling; Pallid Elf, Lotusden Halfling, Fire Genasi, Simic Hybrid and revised Tiefling included empty trait lists. Several recent entries only listed names. Some earlier explanations used different headings: the “missing named explanation before” column records absent explicit source headings, not a count of wholly absent mechanics.

Descriptions cover actions, range, saves, uses, recovery, level unlocks and available options where relevant. Legacy PHB, MPMM and revised traits are separate: for example MPMM Trance grants two temporary weapon/tool proficiencies; PHB Trance does not. Descriptions include future benefits with their required character levels. Selected options are identified, and selected Darkvision ranges follow the current profile.

**Scope:** this completes descriptive coverage. It does not implement remaining race mechanics, add missing choice controls, or certify complete engine automation. Existing partial/manual indicators stay intact. Numerical effects, grants, spell resources, existing choices and saved characters are unchanged. In particular, newer lineage controls and source/engine differences such as EFA Khoravar’s one flexible skill/tool versus the older two-skill preset still need a separate mechanics review. Longer text uses the existing Notes continuation when printed.

Regenerate with `python3 scripts/build-species-feature-reference.py` (pinned cache required), then `node scripts/audit-species-descriptions.cjs`. Check source reproducibility with `python3 scripts/build-species-feature-reference.py --check`. CI can test the shipped reference without downloading source entries.

| Species | Rules | Source | Missing named explanation before | Missing now |
| --- | --- | --- | --- | --- |
| Dragonborn | 2014 | PHB | 1 | 0 |
| Dwarf — Hill dwarf | 2014 | PHB + PHB | 3 | 0 |
| Elf — High elf | 2014 | PHB + PHB | 4 | 0 |
| Halfling — Lightfoot | 2014 | PHB + PHB | 0 | 0 |
| Human | 2014 | PHB | 0 | 0 |
| Gnome — Rock gnome | 2014 | PHB + PHB | 5 | 0 |
| Half-Elf | 2014 | PHB | 1 | 0 |
| Half-Orc | 2014 | PHB | 1 | 0 |
| Tiefling | 2014 | PHB | 1 | 0 |
| Dwarf — Mountain dwarf | 2014 | PHB + PHB | 4 | 0 |
| Elf — Wood elf | 2014 | PHB + PHB | 4 | 0 |
| Elf — Drow | 2014 | PHB + PHB | 4 | 0 |
| Gnome — Forest gnome | 2014 | PHB + PHB | 3 | 0 |
| Halfling — Stout | 2014 | PHB + PHB | 1 | 0 |
| Human — Variant | 2014 | PHB + PHB | 2 | 0 |
| Aarakocra | 2014 | MPMM | 2 | 0 |
| Aasimar | 2014 | MPMM | 5 | 0 |
| Changeling | 2014 | MPMM | 2 | 0 |
| Deep Gnome | 2014 | MPMM | 4 | 0 |
| Duergar | 2014 | MPMM | 4 | 0 |
| Eladrin | 2014 | MPMM | 5 | 0 |
| Fairy | 2014 | MPMM | 2 | 0 |
| Firbolg | 2014 | MPMM | 4 | 0 |
| Genasi — Air | 2014 | MPMM + MPMM | 4 | 0 |
| Genasi — Earth | 2014 | MPMM + MPMM | 3 | 0 |
| Genasi — Fire | 2014 | MPMM + MPMM | 3 | 0 |
| Genasi — Water | 2014 | MPMM + MPMM | 4 | 0 |
| Githyanki | 2014 | MPMM | 3 | 0 |
| Githzerai | 2014 | MPMM | 3 | 0 |
| Goliath | 2014 | MPMM | 3 | 0 |
| Harengon | 2014 | MPMM | 4 | 0 |
| Kenku | 2014 | MPMM | 3 | 0 |
| Locathah | 2014 | LR | 5 | 0 |
| Owlin | 2014 | SCC | 3 | 0 |
| Satyr | 2014 | MPMM | 0 | 0 |
| Satyr | 2014 | MOT | 1 | 0 |
| Sea Elf | 2014 | MPMM | 4 | 0 |
| Shadar-Kai | 2014 | MPMM | 5 | 0 |
| Tabaxi | 2014 | MPMM | 4 | 0 |
| Tortle | 2014 | MPMM | 4 | 0 |
| Triton | 2014 | MPMM | 5 | 0 |
| Verdan | 2014 | AI | 5 | 0 |
| Bugbear | 2014 | MPMM | 6 | 0 |
| Centaur | 2014 | MPMM | 3 | 0 |
| Goblin | 2014 | MPMM | 4 | 0 |
| Grung | 2014 | OGA | 6 | 0 |
| Hobgoblin | 2014 | MPMM | 4 | 0 |
| Kobold | 2014 | MPMM | 3 | 0 |
| Lizardfolk | 2014 | MPMM | 5 | 0 |
| Minotaur | 2014 | MPMM | 3 | 0 |
| Orc | 2014 | MPMM | 4 | 0 |
| Shifter | 2014 | MPMM | 3 | 0 |
| Yuan-Ti | 2014 | MPMM | 4 | 0 |
| Kender | 2014 | DSotDQ | 2 | 0 |
| Kalashtar | 2014 | ERLW | 4 | 0 |
| Warforged | 2014 | ERLW | 4 | 0 |
| Dhampir | 2014 | VRGR | 5 | 0 |
| Hexblood | 2014 | VRGR | 4 | 0 |
| Reborn | 2014 | VRGR | 3 | 0 |
| Loxodon | 2014 | GGR | 4 | 0 |
| Simic Hybrid | 2014 | GGR | 2 | 0 |
| Vedalken | 2014 | GGR | 3 | 0 |
| Astral Elf | 2014 | AAG | 6 | 0 |
| Autognome | 2014 | AAG | 6 | 0 |
| Giff | 2014 | AAG | 3 | 0 |
| Hadozee | 2014 | AAG | 3 | 0 |
| Plasmoid | 2014 | AAG | 5 | 0 |
| Thri-kreen | 2014 | AAG | 5 | 0 |
| Leonin | 2014 | MOT | 3 | 0 |
| Custom Lineage | 2014 | TCE | 2 | 0 |
| Feral Tiefling | 2014 | PHB + SCAG | 4 | 0 |
| Chromatic Dragonborn | 2014 | FTD | 4 | 0 |
| Gem Dragonborn | 2014 | FTD | 5 | 0 |
| Metallic Dragonborn | 2014 | FTD | 4 | 0 |
| Pallid Elf | 2014 | PHB + EGW | 6 | 0 |
| Lotusden Halfling | 2014 | PHB + EGW | 5 | 0 |
| Draconblood Dragonborn | 2014 | PHB + EGW | 4 | 0 |
| Ravenite Dragonborn | 2014 | PHB + EGW | 4 | 0 |
| Orc of Exandria | 2014 | EGW | 4 | 0 |
| Changeling | 2024 | EFA | 2 | 0 |
| Kalashtar | 2024 | EFA | 4 | 0 |
| Khoravar | 2024 | EFA | 5 | 0 |
| Shifter | 2024 | EFA | 3 | 0 |
| Warforged | 2024 | EFA | 5 | 0 |
| Dhampir | 2024 | RHW | 4 | 0 |
| Hexblood | 2024 | RHW | 3 | 0 |
| Lupin | 2024 | RHW | 4 | 0 |
| Reborn | 2024 | RHW | 4 | 0 |
| Boggart | 2024 | LFL | 4 | 0 |
| Faerie | 2024 | LFL | 3 | 0 |
| Flamekin | 2024 | LFL | 3 | 0 |
| Kithkin | 2024 | LFL | 5 | 0 |
| Lorwyn Changeling | 2024 | LFL | 4 | 0 |
| Lorwyn-Shadowmoor Elf | 2024 | LFL | 5 | 0 |
| Rimekin | 2024 | LFL | 3 | 0 |
| Human | 2024 | XPHB | 1 | 0 |
| Dragonborn | 2024 | XPHB | 5 | 0 |
| Dwarf | 2024 | XPHB | 4 | 0 |
| Elf | 2024 | XPHB | 5 | 0 |
| Gnome | 2024 | XPHB | 3 | 0 |
| Goliath | 2024 | XPHB | 3 | 0 |
| Halfling | 2024 | XPHB | 4 | 0 |
| Orc | 2024 | XPHB | 3 | 0 |
| Tiefling | 2024 | XPHB | 3 | 0 |
| Aasimar | 2024 | XPHB | 5 | 0 |
