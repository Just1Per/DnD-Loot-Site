> Current automation follow-up: [23 November expansion](rule-automation-expansion.md) and [coverage / remaining review](rule-automation-audit.md). These supersede the early implementation limits below; all 186 subclasses have adapters, while targeting/timing and other recorded table decisions remain explicit.

> Current release: read-only Overview, separate Feats tab, spell information and 35 backgrounds. New saves use schema **8**. See [overview/background update](character-overview-backgrounds.md).

> Latest equipment update: new saves use schema **7**; publish the current Firestore rules. See [campaign equipment](character-equipment.md) for loot integration, AC and weapon calculations. Earlier schema references below describe previous updates.

# Character builder: 2024 default, with 2014 support

## Builder and Overview display

Character Builder's calculated information is collapsed at the top and can be
pinned to Overview. Each unlocked class/subclass reference feature has independent
name and description display controls. Preferences are stored in the existing
Adobe settings grant; descriptions remain live catalogue references, not copied
text. Pins for a previous class, subclass, edition or higher level stay saved but
are hidden until that feature is available again.

The old Advancement editor is removed. Feats displays ASI reservations read-only
for players, with reservation controls for the campaign DM. Lessons of the First
Ones grants Origin choices from actual eligible invocation selections, including
repeatable selections within the level limit, instead of an independent checkbox.

## HP breakdown and Warlock invocation limits

Combat's maximum HP panel uses the advancement engine's actual calculation:
class hit dice, Constitution at every character level, species/feat bonuses and
minimum-HP adjustments. Named item changes to Constitution are explained beside
that contribution and are not added a second time. Origin Tough is applied once.

Invocation limits use Warlock class level and the selected edition. Level 6 allows
3 total in 2014 or 5 total in 2024. The Rules page reads the same progression table
as the core choice engine. The core setter rejects extra slots, unknown choices,
non-repeatable duplicates and unmet prerequisites. It keeps slot positions stable
when an earlier slot is empty. Saved choices beyond a reduced allowance are
preserved as inactive and reported; editing the group keeps only allowed slots.

References: [2014 Warlock](https://www.dndbeyond.com/classes/7-warlock) and
[2024 Warlock](https://www.dndbeyond.com/classes/2190885-warlock).

New sheets default to **2024** and **Base scores / HP**. Previously saved sheets
keep their edition; absent edition data means 2014. Previously manual sheets keep
Final totals and are not guessed from free text. Choose the correct score mode
before automating an existing character.

## Starting ability bonuses on the Adobe sheet

Click any first-page ability score to open **Ability scores & skills**. Its
**Starting ability bonuses** section uses the current edition and origin profile:

- **2014:** display fixed racial increases and choose any source-defined variable
  increases. Half-Elf retains its two non-Charisma choices; Variant Human,
  Warforged, Simic Hybrid, Custom Lineage and flexible lineages use their actual
  allowance and exclusions. Flexible lineages offer +2/+1 or +1/+1/+1.
- **2024:** choose +2/+1 or +1/+1/+1 within the background’s three allowed
  abilities. All 57 selectable 2024 backgrounds have pinned ability pools, including
  the 41 Forgotten Realms, Eberron, Ravenloft and Lorwyn supplement entries. Legacy/custom backgrounds use the existing unrestricted ability
  adaptation. Racial increases never stack with background increases.

Selections must be distinct and permitted before applying automatic scores.
Changing an origin makes incompatible saved choices inactive until replaced.
Each score previews its starting increase, effective total and modifier; a
starting increase cannot raise it above 20. Feat, class and item effects still
use the shared calculation pipeline. Origins apply once per character, including
multiclass characters, and never overwrite the six entered scores.

**Scores and maximum HP** exposes the existing shared Base/Final totals mode.
Existing final-total characters stay in that mode; starting choices are reference
only until the player explicitly selects Base values. Switching mode does not
convert entered scores or maximum HP: enter values before bonuses when converting
an existing sheet and review maximum HP in Combat. Point buy always uses Base
mode. Apply updates the sheet draft; Cancel discards the entire popup draft.
Save sheet persists the selected choices. Current HP, temporary HP, inventory,
coins, used resources and class allocation are preserved.

Pinned-source review also corrected the five EGW profiles: Pallid Elf and Lotusden
Halfling use DEX +2 / WIS +1; Draconblood Dragonborn uses INT +2 / CHA +1; Ravenite
Dragonborn and Orc of Exandria use STR +2 / CON +1. These replace the previously
incorrect generic flexible package. No source rule prose is stored.

## Choices and editions

The race/species dropdown contains 79 entries: ten 2024 core species and 69
2014-era entries. Labels explicitly show 2024 or 2014 plus the source abbreviation.
MPMM (2022) entries belong to the 2014 rules family, not the 2024 PHB.

- Human (2024): one skill and an additional Origin feat, alongside the background
  feat; Heroic Inspiration reminder. No species ability-score increase.
- Human — Variant (2014): two distinct +1 abilities, one skill, and a manually
  recorded feat. Normal Human (2014) also remains available.
- The ten 2024 entries have version-specific lineage choices and traits, including
  Dragonborn d10 breath scaling, Dwarf toughness, Elf/Gnome lineages, Goliath giant
  ancestry, Orc short-rest recovery and Tiefling legacies.
- All 37 Exotic/Monstrous names supplied by the user are represented, plus six PHB
  alternatives, 16 setting options, Custom Lineage and the original nine entries.
  Plane Shift, UA playtests, dragonmarks and additional book variants remain manual.
  Ravenloft entries model new-character creation; retained ancestral traits during
  a transformation remain manual, as explained in the character summary.

Twelve single-class selections use edition-specific starting proficiencies,
class skills and spell slots. Paladin/Ranger have two level-1 slots at level 1 in
2024, but begin spellcasting at level 2 in 2014. Class features and subclasses
are not a complete automated class progression engine.

2024 backgrounds currently include the four SRD entries: Acolyte, Criminal, Sage
and Soldier. Other backgrounds use Custom/manual. Acolyte (2014) is also available.
With 2024 selected, backgrounds supply +2/+1 or +1/+1/+1, capped at 20, and an
Origin feat. Legacy species ASIs are ignored under 2024 rules. The custom/legacy
background option allows unrestricted abilities and a chosen Origin feat.

Origin feats have a restricted selection list. Alert initiative, Tough HP and
Skilled's three skill/tool choices are calculated. Magic Initiate now has version-specific spell choices and a saved free-use counter;
other feat effects remain manual and are labelled accordingly. A Human may
select a different additional Origin feat; non-repeatable duplicates are rejected.
Skilled can repeat, with distinct training. Alert and Harengon cannot add PB twice.

## Form behavior

Race, class and background use dropdowns. Their free-text fields appear only for
Custom/manual. Hidden manual race/background text stays saved and reappears when
returning to Custom. Selecting a class deliberately sets its shared class label.
Additional feature/proficiency/language notes are clearly separate from automatic
results. Race changes never stack old bonuses or overwrite those notes.

Missing/invalid options produce warnings and grant no invalid bonuses. Incomplete
drafts remain saveable. Selected skills combine with manual training by taking
the higher rank; expertise is not overwritten. Spellcasting from species does
not change the class casting ability. Racial spells stay separate from the
manually entered spellbook.

Base mode adds origin ability and HP bonuses. Final mode assumes these are already
included in the entered numbers. CON changes and class HP are otherwise manual.
Natural armor is a calculated reference; it does not overwrite Combat AC.
Conditional advantage, powers, attacks, resource use, rest recovery, armor effects,
level-up ASIs, multiclassing and unimplemented feat effects remain manual.

## Files and sources

The boot order is `character-race-catalog.js`, `character-rules-2024.js`, then
`character-rules.js`, followed by sheet model/store/UI. Node tests load equivalent
modules. Structured source data and original short reminders include book/version
labels. SRD 5.1 and 5.2.1 attribution is visible in `rules-attribution.html`.
Supplement summaries are not represented as SRD-licensed book text. No Acrobat
scripts from the supplied PDF execute on the website.

## Firestore update required before saving 2024 sheets

Manually publish **this branch's current `firestore.rules`**, including schema 6.
The existing private characterSheets collection remains unchanged. Rules allow:

- schema 1: original manual sheets;
- schema 2: 2014 builder sheets;
- schema 3: 2014 or 2024 builder sheets;
- schema 4: catalogue feat/spell selections and resources;
- schema 5: automatic feat effect choices and repeated feat instances;
- schema 6: multiple-use feat pools and additional Origin automation.

All new saves use schema 6, including 2014 sheets with expanded race choices.
Switching back to 2014 retains schema 6.
Rules reject schema downgrades, protecting the data from older website clients.
UI accepts schemas 1–6; optimistic revision and identity checks remain in place.
Owning player and campaign DM/owner retain private access; global admin alone
gets no campaign bypass. No Functions, Storage changes or bulk migrations.

Preview shares the existing Firebase project: use test characters. Refresh after
deployment; module cache versions change together. Do not merge before preview
acceptance and publishing the rules.

## Validation

From `tests/`: `npm test` and `npm run test:rules`.

- 51 calculation/data checks.
- 80 DOM checks, including all 79 race selections, both Human versions,
  nonduplicate form fields, option gating, save/reopen and edition switching.
- 23 Firestore emulator checks, including private access, concurrent edits,
  2024 persistence, invalid editions and schema downgrade protection.

Emulator and DOM tests do not modify production data. Full rendered browser/mobile
acceptance remains a preview test, not a claim made by these automated checks.

## Spell / feat catalogue

See [catalogue import and usage](rules-catalog.md) for coverage, schema 6, testing and the optional database import.
