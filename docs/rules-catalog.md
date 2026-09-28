> Latest equipment update: new saves use schema **7**; publish the current Firestore rules. See [campaign equipment](character-equipment.md) for loot integration, AC and weapon calculations. Earlier schema references below describe previous updates.

# Feats and spells: install and test

This is part of PR #2 on `feature/character-rules-engine`. Keep the existing repo
folders. No Cloud Functions were added or changed, and GitHub Hosting deployment
continues as before. **Publish this branch's complete `firestore.rules` manually
before saving sheets with this version.** Sheet format 6 prevents an old client
from erasing new spell/feat selections. Existing formats 1–5 remain readable.

## On the sheet

- **Overview → Feat catalogue:** search 2014 or 2024 feats and choose one. Additional
  selections have their own source, text/reference and remove button. Variant Human
  (2014) receives the first chosen 2014 feat in its existing racial feat field when
  that field is empty. That field can still be edited for homebrew.
- **Spells → Choose spells from the catalogue:** filter by edition, class, spell
  level and name, then Add spell. “Both editions” permits explicit legacy choices.
  Versions have separate IDs; adding the same version twice is prevented.
- Spellbook entries are editable snapshots. They keep their source/version when
  the catalogue later changes or the character's edition changes. Existing manual
  spells and notes are preserved.
- Magic Initiate from a background, Human, Variant Human, or additional feat gets
  two cantrip selectors and one level-1 selector. Validation uses that feat's
  edition and class list. 2024 uses a chosen INT/WIS/CHA; 2014 uses its class ability.
  Attack/DC use the actual character scores and proficiency. Duplicate cantrips and
  invalid spell levels/lists are flagged. 2024 repeats require different lists;
  2014 is not repeatable. Each grant has its own saved free-use counter.
- “Add chosen spells to spellbook” copies the chosen entries. 2024's level-1 spell
  is marked prepared on insertion. Changing the feat later does not erase manually
  edited spellbook entries: remove obsolete entries yourself.
- The long-rest button resets **spell slots and Magic Initiate free uses only**.
  HP, hit dice and other resources remain manual. Changing a feat's choices does
  not refill its free use. “Undo use” corrects an accidental click.
- Save sheet commits all these changes together to the existing private sheet.
  Only the character owner and campaign DM can read it.

General feat prerequisites need DM review. Adding a catalogue feat does not spend
an ASI or automatically implement all its combat effects. Supported ability bonuses
are calculated as listed below.
Existing Origin Alert/Tough/Skilled automation remains in the original builder;
additional catalogue feats now have the supported calculations listed below. Class learning/preparation limits, multiclassing,
subclasses and spell-slot spending on casts are not fully automated.

## Coverage and text

The committed manifest has 969 spell editions: 525 legacy and 444 revised-era.
It includes **all 361 PHB (2014) and all 391 PHB (2024) spells**, plus the 16 other
source files in `data/rules/manifest.json`. It is a pinned published index, not a
promise about future books, homebrew or every adventure-only ability. There are
302 feat references. 2014/2024 labels identify the source rules family, not a
blanket compatibility approval from your DM.

658 spell entries have full licensed SRD text (319 + 339). Others provide factual
metadata and a book/page reference, not copied full book descriptions. See
`rules-attribution.html`. Non-SRD spell material costs/details and other rules must
be checked in the source. Search class lists are base-class lists, not subclass
expanded lists or a full eligibility engine.

## Database import (optional for testing the website)

The website already includes the same catalogue in `data/rules/catalog.json`, so
choices work even before importing. When a published Firestore catalogue exists,
the site checks its SHA-256 and uses it. If it is unavailable or invalid, it shows
that it is using the bundled catalogue. Refresh the page after publishing a new
catalogue to load the new release.

Run from the repository root on a computer with Node.js 22 or newer:

```sh
npm ci --prefix scripts
node scripts/import-rules.mjs --project YOUR_FIREBASE_PROJECT_ID
```

This is a **dry run**: prints counts and release ID, makes no database writes and
needs no credentials. For the real import, use a Google account with Firestore
write IAM permissions for that project. If using the Google Cloud CLI:

```sh
gcloud auth application-default login
node scripts/import-rules.mjs --project YOUR_FIREBASE_PROJECT_ID --write
```

Replace the project placeholder with the project ID in your Firebase console (the
project used by `js/firebase.js`). Firebase CLI login alone does not supply Admin
SDK credentials. An existing local `GOOGLE_APPLICATION_CREDENTIALS` setup also
works; keep credentials outside this repository. Never put credentials in frontend
JavaScript. The import runs locally; it does not install a Firebase Function.

Writes are limited to:

```text
rulesCatalog/current
rulesCatalog/{sha256}/parts/{0000,0001,...}
```

A release is fully written before the current pointer changes. Interrupted runs
can be rerun; stable IDs and content-addressed releases make retries idempotent.
Older releases remain for recovery. No root items, campaign inventory, users,
races in the existing builder, or saved character sheets are overwritten.

Browser Firestore rules allow signed-in catalogue reads and global-admin writes.
The local Admin SDK uses IAM permissions and bypasses client rules as normal.
Global admins still get no campaign-sheet access bypass. No production import has
been executed as part of these development tests.

## Rebuild and test

Normal installation uses the committed data; no scraping happens on deploy.
To intentionally regenerate from the pinned source revisions:

```sh
python scripts/build-rules-catalog.py
npm ci --prefix tests
npm test --prefix tests
```

The source cache in `scripts/.source-cache` is ignored and excluded from Hosting.
The generator explicitly extracts metadata fields; it does not copy non-SRD
`entries`, book descriptions, images or lore into the output. Inspect the manifest
and tests before updating source revisions.

To test the rules and a real import/retry against a local Firestore emulator:

```sh
npx --prefix tests firebase emulators:exec --only firestore --project demo-vault-test --config firebase.test.json "node tests/character-sheet-rules.cjs && node tests/catalog-import.cjs"
```

This needs Java for the emulator and `npm ci --prefix scripts` for the importer.
The command uses demo data, not the live database. Hosting ignores both `scripts/`
and `tests/`. Automated DOM tests cover selection, duplicate prevention, Magic
Initiate resources, and save/reopen. They do not replace a visual mobile/browser
review on the Firebase preview.

## Automatic feat effects (schema 5 update)

The current sheet now calculates the following effects. A feat's card explicitly
lists what is automated; **this is not full automation of every feat**.

| Feats | Automated sheet effects |
| --- | --- |
| 178 catalogue feats with structured ability increases | Fixed/selected abilities, +2 versus two +1 for ASI, caps of 20/30, level and numeric ability prerequisites |
| Ability Score Improvement and other repeatable feats | Independent saved selections per occurrence; removing one preserves the others |
| Alert (2014/2024) | Initiative +5 / proficiency bonus, with duplicate Origin prevention |
| Tough (2014/2024) | +2 HP per level in Base mode |
| Resilient (2014/2024) | Selected ability +1 and matching saving throw proficiency; 2024 requires an untrained save |
| Skilled (2014/2024) | Three skill/tool choices; supported repeatable 2024 selections |
| Skill Expert (TCE/2024) | Ability +1, new skill and expertise in a proficient skill |
| Observant (2014) | Ability increase and passive Perception +5; passive Investigation remains manual |
| Observant (2024) | Ability increase and selected proficiency/expertise; Search action remains manual |
| Archery (2024) | +2 only for attacks marked Ranged weapon, after confirmation of Fighting Style eligibility |
| Defense (2024) | +1 effective AC when armor is confirmed; entered AC must exclude this bonus |
| Boon of Truesight (2024) | Ability increase and 60-ft Truesight in the feature summary |
| Selected 2024 limited-use effects | Independent counters for Boon of Fate, Boon of Combat Prowess, Grappler and Savage Attacker, with their stated turn/initiative/rest recovery events |

Feat Constitution modifier increases also add HP for all character levels in
**Base mode**. Enter maximum HP before feat bonuses. Current HP is not healed by
selecting a feat. In **Final totals mode**, ability and HP entries remain final;
other proficiency/initiative effects still apply, as with the existing builder.
Do not duplicate calculated bonuses in manual adjustment fields.

A Variant Human's recognized PHB feat participates in these calculations. Existing
background/Human Origin calculations remain separate and do not stack duplicate
non-repeatable feat bonuses. Variant Human's existing field still supports manual
homebrew. Origin choices outside the existing supported calculations remain manual;
the new resource buttons apply to additional catalogue feats.

Known numeric prerequisites are checked before the feat's own ability increase.
Other requirements (class features, race, previous feats, campaign permissions,
spellcasting, etc.) require an explicit checkbox confirming review with the DM.
This is a rules aid, not a permission system or a complete level-up engine.
Combat targeting, movement, advantage/disadvantage, conditional damage, dice rolls,
actions/reactions and encounter adjudication are still manual unless listed above.

Publish the updated complete `firestore.rules` before saving: new saves now use
**schema 5**, which protects effect selections from schema-4 clients. Existing
sheets remain readable. The automation definitions ship with the website, so they
work with the previous database catalogue without another import. The catalogue
also corrects an upstream 2014 Grappler transcription error against SRD 5.1 p.75:
pinning uses another grapple check, not a maneuver-DC saving throw. The frontend
applies that correction to older imported catalogues too.

## More feat automation (schema 6)

This update adds the following calculations and choices without requiring another
catalogue import. The definitions ship with the website and work with an existing
imported catalogue.

| Feat | Added support |
| --- | --- |
| Lucky, 2014 | Three points, with individual use/undo and long-rest recovery |
| Lucky, 2024 | Points equal to proficiency bonus, including background/Human Origin selections |
| Crafter, 2024 | Three distinct choices from its eight eligible artisan tools |
| Musician, 2024 | Three instrument proficiencies and a proficiency-based ally limit reminder |
| Linguist, 2014 | Three different language choices from the builder's language catalogue |
| Keen Mind, 2024 | Selected knowledge skill proficiency or expertise |
| Lightly / Moderately / Heavily Armored | Correct training for each edition, including differing shield grants; other prerequisites remain subject to DM confirmation |
| Mobile, 2014 / Speedy, 2024 | Walking speed +10 ft; the two versions cannot stack |
| Athlete, 2024 | Climb speed equal to effective walking speed, including other supported speed bonuses |
| Boon of Speed, 2024 | Walking speed +30 ft, gated to level 19+ |
| Boon of Fortitude, 2024 | +40 maximum HP in Base mode and a once-per-turn extra-healing tracker |
| Boon of Skill, 2024 | All 18 skill proficiencies and one eligible expertise |

Lucky, Crafter, Musician and Savage Attacker also work when selected as a 2024
background/Human Origin feat. Duplicate Origin/non-repeatable selections do not
grant extra pools or effects. Existing Origin Alert/Tough/Skilled calculations
remain in their original builder controls.

The combat overview now contains **Feat resources**, so spending and restoring
points does not require visiting the Character builder. Use/Undo change one point
at a time and cannot spend beyond capacity. Reducing a character's level does not
refill spent points. Short-rest, initiative and start-of-turn buttons reset only
features with that recovery rule. The combat long-rest button restores feat uses,
including Magic Initiate, but does not change HP or spell slots. The Spells tab's
existing long-rest button also resets spell slots. All changes require Save sheet.

This does not roll dice, decide advantage, choose targets, apply Musician inspiration
to another character, spend money for Crafter, create temporary crafted items, or
automatically heal for Boon of Fortitude. Its extra-healing button is a use tracker;
apply the eligible healing amount through the existing HP controls. Mobile/Speedy
terrain/opportunity-attack effects and non-walking movement adjustments not listed
above remain manual. Current HP is never increased by selecting a feat.

The Resilient calculation also now copies class saving-throw arrays before adding
feat proficiency, preventing bonuses from leaking into other characters or
remaining after a feat is removed.

**Publish the complete updated `firestore.rules` before saving.** New saves use
schema 6 because a schema-5 client normalizes a numeric use counter to 0/1. Older
clients must not overwrite a pool with several spent points. Formats 1–5 remain
readable and campaign privacy is unchanged. No Firebase Functions or production
imports are needed for this update.
