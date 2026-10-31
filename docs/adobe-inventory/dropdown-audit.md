# Original Adobe dropdown audit

Static review of all 93 nonempty exported option lists, across all original pages and optional templates. Lists are source metadata, including the supplied character’s imported content; they are not a second mechanics catalogue. No PDF script is executed.

The searchable Adobe pickers use the existing authoritative field options and shared engine. Selected values survive filtering. Rule edition and campaign source restrictions still apply. This audit records the remaining differences explicitly; it does not certify complete 1:1 functional parity.

| Original dropdown family | Fields | Current behavior / remaining difference |
| --- | ---: | --- |
| Race / background | 2 | Edition and campaign catalogue; retain the current saved choice. Imported PDF names do not automatically grant web mechanics. |
| Background detail | 1 | Editable per-background text. The PDF options are the filled source character’s current background variant; do not offer its Haunted One list for every other background. |
| Resistances | 6 | All 13 original damage types are suggestions for manual rows. Automatic resistances remain calculated; custom text stays editable. |
| Armor | 1 | Shared recognized armor, owned names and +1/+2/+3 variants; Unarmored clears worn armor. Source Mage Armor, Inertial Armor and manual Unarmored Defense formula overrides are not yet independent named-equipment commands. |
| Save DC ability | 3 | The original six ability choices, with full names and shared spell/secondary-DC keys. |
| Recovery | 16 | Calculated from the actual feature/item pool. Arbitrarily replacing a class feature recharge is not exposed as a cosmetic dropdown. |
| Attack weapon | 5 | Shared supported weapon catalogue, owned equipment and existing attack references; +1/+2/+3 recognition retained. Conditional racial/spell/source attacks require their actual grants. |
| Attack ability | 5 | Six original abilities plus Auto for supported attack rows; computed rows retain their engine ability. |
| Attack damage | 5 | Computed for equipment/action references; retained in the editable manual damage text. Separate source damage-type override remains pending. |
| Ammunition | 2 | All 16 original ammunition names, plus retained custom names; same original icon/load relationships. |
| Background feature | 1 | Derived from the selected background. Independent feature replacement is still a parity task. |
| Log faction | 1 | Original faction choices with the existing private log header. |
| Companion type | 1 | All four original roles: Cohort, Companion, Familiar and Mount. Manual Wild Shape reference remains an additional existing web role. |
| Companion creature | 1 | Shared permitted creature catalogue, with Familiar/Wild Shape restrictions. Arbitrary player-race entries are not creature statistics. |
| Companion size / type / alignment | 3 | All original six sizes, fourteen creature types and nine alignments; bounded private companion fields. |
| Companion attack | 9 | Only that creature’s calculated natural attacks; full creature attack choice/override parity remains pending. |
| Owned magic item | 7 | Only owned magic items, preserving ownership/attunement and source slot order. Original catalogue acquisition remains separate. |
| Feat | 4 | Native selected-first feat dialog; source/edition/level/budget and existing grants apply. Source PDF imported names alone do not grant a feat. |
| Wild Shape creature | 4 | Actual edition/level-eligible forms and retained known/seen references. |
| Wild Shape calculated fields | 16 | Derived from the selected form; not an editable replacement for that creature’s rules. |

Source: `data/adobe-pages/*.json`; rerun `node scripts/audit-adobe-dropdowns.cjs --markdown`. The original PDF and the full static/dynamic function inventory remain the parity reference.
