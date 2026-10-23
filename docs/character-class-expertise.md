# Class Expertise and fixed class languages

Abilities & Skills includes class Expertise choices alongside the existing training controls. Only proficient skills qualify. Overview links incomplete choices back to this section. Save sheet retains choices in the existing `rulesChoices.grants.__adobe.data.classFeatureChoices` envelope. No migration or new Firebase rules are required.

| Class | 2014 choices | 2024 choices |
| --- | --- | --- |
| Rogue | 2 at class level 1, 4 at 6; one choice may be proficient thieves’ tools | 2 skills at 1, 4 at 6 |
| Bard | 2 at 3, 4 at 10 | 2 at 2, 4 at 9 |
| Ranger | Optional Canny reminder; manual Expertise circle | 1 at 2, 3 at 9 |
| Wizard | None | Scholar at 2: one proficient Arcana, History, Investigation, Medicine, Nature or Religion |

Class levels determine choices; total character level determines proficiency bonus. Skill bonuses, Overview, print and Wild Shape training use the same derived Expertise. It doubles proficiency once and never stacks with feat or manual Expertise. Existing manual ranks are preserved when selecting or clearing a class choice. Ineligible, duplicate and higher-level saved choices remain stored but grant nothing until eligible again. Explicitly editing an over-limit group replaces its inactive overflow choices.

Tool Expertise is shown as a proficiency contribution plus an ability modifier; the application does not roll tool checks. Artificer Tool Expertise, optional 2014 Ranger Canny, Knowledge Domain and Scout Survivalist have manual reminders. Other unsupported source features can still use manual Expertise circles. This is not a claim that all class features are automated.

Rogue level 1 derives Thieves’ Cant and Druid level 1 derives Druidic in Overview, including multiclass characters and print. Removing that class removes its derived language. Additional manual languages are preserved. Elective languages remain manual entries; no unchosen language is automatically granted.

Sources: [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Basic Rules class features](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). The Scholar pool includes Wisdom-based Medicine.

Validation: edition and class-level thresholds, actual multiclass allocations, proficiency requirements, duplicate/feat nonstacking, manual preservation, inactive saved choices, tool reminders and automatic languages have engine tests. The browser regression covers selecting/clearing, saving/reopening, Overview languages, printed training, keyboard access, narrow screens and WCAG checks. Existing character header button minimum-height override is removed as requested; shared button styling continues to apply.
