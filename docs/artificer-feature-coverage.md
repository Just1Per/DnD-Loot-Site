# Artificer feature automation: legacy class

This tracks the existing Artificer class from the 2014-era rules (Eberron / Tasha's). It does not claim support for a revised Artificer class. The application permits this legacy class in compatible campaigns; changing the sheet's core edition does not turn it into a different Artificer source.

| Artificer level | Main-class feature or milestone | State / next structured work |
| --- | --- | --- |
| 1 | Starting proficiencies | Fixed training exists; one artisan-tool choice still needs a structured selector |
| 1 | Magical Tinkering | Needs object/effect choices and Intelligence-based capacity |
| 1 | Spellcasting | Spell access/preparation exists; verify every level and multiclass spell progression in the wider audit |
| 2 | Infuse Item | Needs known infusion choices, prerequisites and active assignments to owned items |
| 3 | Artificer Specialist | Subclass source/progression and features need individual review |
| 3 | The Right Tool for the Job | Needs created-tool choice/state |
| 4, 8, 12, 16, 19 | ASI / feat choices | Existing shared class-level milestone budget; no automatic feat or ability assignment |
| 6 | Tool Expertise | Existing reminder only; needs tool check fields and automatic double proficiency |
| 7 | Flash of Genius | Needs use tracking and Intelligence-based bonus/limits |
| 10 | Magic Item Adept | **Attunement capacity implemented: 4**; crafting benefits need their own workflow |
| 11 | Spell-Storing Item | Needs eligible spell and item selection, uses and effect statistics |
| 14 | Magic Item Savant | **Attunement capacity implemented: 5**; item prerequisite handling still needs review |
| 18 | Magic Item Master | **Attunement capacity implemented: 6** |
| 20 | Soul of Artifice | Needs attuned-item saving throw bonus and infusion-ending survival action |

The class/specialist features not listed as implemented above are not declared complete merely because their names occur in source data or descriptive text.

## Attunement behavior and verification

Active Gear enforces and displays 3 slots normally, then 4/5/6 at Artificer class levels 10/14/18. Equipment AC and the separate magic-item effects use the same allowed item IDs, in saved loadout order. Owned, attuned items consume slots even when not worn; quantity, duplicate rows and missing items cannot add slots. Effects still require wearing/equipping when appropriate.

The regression visits every supported class at levels 1–20 for this specific rule, checks multiclass boundaries and character-level caps, both equipment pipelines, reordered inventory, backpack items, ownership and level reductions. This is not a claim that every feature of every class has been audited. Browser coverage tests the actual Active Gear buttons, failed extra attunement, save/reopen and changing class levels.

A lower limit keeps the saved selection and deactivates excess effects; the player can end an old attunement and choose another item. No production records are rewritten.

No Firestore or Storage rule changes, production deployment or data migration are required.
