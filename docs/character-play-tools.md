# Character sheet play tools

This follows the merged overview/background PR. It preserves private owner/DM access and the existing browser Firestore architecture. No new Cloud Functions are required.

## Publish and test

1. Publish this branch's **complete `firestore.rules`** in the Firebase console before saving a character with this build. New sheets save as **schema 9**. Versions 1–8 load normally; older clients cannot overwrite the new profile or advancement data.
2. Open the PR's Firebase preview, use a test character, and reload once to load the new scripts/CSS.
3. Test these tabs: Character builder → Abilities & skills → Story & notes → Feats → Spells → Inventory. Save, close, and reopen.
4. Print with **A4 portrait**, 100% scale, browser headers/footers disabled. Panels flow continuously, with smaller overview metrics and print-specific spell columns. Very long notes or large attack lists can still extend the overview beyond one page; content is not silently clipped.

## Changes

- All editors share the overview's compact paper-style boxes. Skill training uses Half / Proficient / Expertise circles; automatic training is marked and cannot be reduced by a manual click. Removing a manual upgrade restores automatic proficiency.
- Ability cards show base score, race/background contribution, feat contribution, effective score and modifier. 2014 racial and 2024 background increases stay separate. Final-totals mode stays available for imported characters whose scores already include bonuses.
- Story has gender, age, descriptive size, height in cm, weight in kg, hair, eyes, skin color and all nine alignments. Alignment updates the read-only overview. Descriptive size does not override species mechanics; permitted species-size choices stay in Character builder.
- The supplied Adobe PDF embeds **one** background personality table (Acolyte: 8 traits, 6 ideals, 6 bonds, 6 flaws). Its actual suggestions are available to any character, plus **Other** for custom writing. Existing writing is preserved. This does not claim to contain personality tables absent from the uploaded PDF.
- Origin configuration and Skilled proficiency selectors live in Character builder. Feats contains the catalogue, selected feats and their effect/spell controls. Both editions can be searched together.
- Feat choices share a class-level advancement budget with ASIs: ordinary milestones, extra Fighter and Rogue levels, 2024 Fighting Style choices, and one optional Warlock Lessons of the First Ones invocation. Variant Human retains its 2014 starting feat. Known level/ability requirements and repeated selections are checked before adding. Existing over-budget selections remain saved and produce a review warning. Other prerequisites need source/DM confirmation; this is not a full multiclass/subclass/invocation engine. An ASI already entered manually must reserve a choice in Builder, rather than also selecting an ASI feat.
- The spell page shows selected spells in level/name order with prepared state, short description, save, school, casting time, range, components, duration, source and page. Its header shows ability, DC and attack modifier. Slot circles update the existing spent-slot data and long-rest reset. Slot totals remain explicitly configured for the character; they are not inferred for multiclass/Pact Magic. Individual spell edits remain in an expandable editor. Source-only entries are labelled; no spell description has been invented.
- Inventory has a campaign gear picker, 106 Adobe SRD gear choices, 7 Adobe packs and 29 PHB background equipment presets across both editions. Background alternatives use their fixed items/option A; unresolved equipment choices and coins are shown for separate selection/recording. The DM can create hidden, finite, assignment-only campaign copies. Existing copies/stock are preserved on retry. Players claim only DM-enabled campaign items via the existing transaction flow. Item cards and their controls remain available inside compact expandable inventory rows.

## Optional root gear database import

The sheet's dropdown data ships with the site. DMs can create campaign copies from it without running a script. To additionally put base gear, weapons, armor and shields in the shared root catalogue (158 templates):

```sh
npm --prefix scripts ci
node scripts/import-base-gear.mjs --project YOUR_FIREBASE_PROJECT_ID
node scripts/import-base-gear.mjs --project YOUR_FIREBASE_PROJECT_ID --write
```

The first command invocation is a dry run. The write command uses local Firebase Admin application-default credentials, like the existing rules importer. It creates only missing deterministic root IDs and never replaces existing templates, campaign items, supply or inventory. DMs then copy templates into their campaigns and configure stock/visibility normally. Do not commit credentials.

To update an existing Firestore spell/feat catalogue with save metadata:

```sh
node scripts/import-rules.mjs --project YOUR_FIREBASE_PROJECT_ID
node scripts/import-rules.mjs --project YOUR_FIREBASE_PROJECT_ID --write
```

Until the database catalogue is upgraded to metadata version 2, this client automatically uses the bundled catalogue. No import is needed to test the spell table.

## Data and validation

- `scripts/build-adobe-data.py STREAM_DIRECTORY --backgrounds BACKGROUNDS_JSON` extracts static literal lists without executing PDF JavaScript. Its source is the user-provided MPMB PDF and the same pinned background metadata used by `build-backgrounds.py`.
- `scripts/build-rules-catalog.py` adds factual save metadata; full text remains limited to licensed SRD content. See the existing catalogue attribution files.
- Class progression reference: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes . Original feats use the existing 2014 rules data.
- Passed: 107 calculation/data tests, 164 DOM interaction checks, 31 Firestore permission/persistence checks, and 2 real emulator import/retry checks (304 total). Tests do not modify production data.
- Browser screenshot and physical-print acceptance still need preview review: local Chromium installation is unavailable. DOM and calculation checks are not a visual-layout guarantee.
