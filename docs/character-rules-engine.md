# Character builder: 2024 default, with 2014 support

New sheets default to **2024** and **Base scores / HP**. Previously saved sheets
keep their edition; absent edition data means 2014. Previously manual sheets keep
Final totals and are not guessed from free text. Choose the correct score mode
before automating an existing character.

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
Skilled's three skill/tool choices are calculated. Other feat effects, spell
choices and active uses remain manual and are labelled accordingly. A Human may
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

Manually publish **this branch's current `firestore.rules`**, including schema 3.
The existing private characterSheets collection remains unchanged. Rules allow:

- schema 1: original manual sheets;
- schema 2: 2014 builder sheets;
- schema 3: 2014 or 2024 builder sheets.

2024 saves use schema 3. Once upgraded, switching back to 2014 retains schema 3.
Rules reject schema downgrades, protecting the data from older website clients.
UI accepts schemas 1–3; optimistic revision and identity checks remain in place.
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
