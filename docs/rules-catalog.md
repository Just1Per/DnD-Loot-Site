# Feats and spells: install and test

This is part of PR #2 on `feature/character-rules-engine`. Keep the existing repo
folders. No Cloud Functions were added or changed, and GitHub Hosting deployment
continues as before. **Publish this branch's complete `firestore.rules` manually
before saving sheets with this version.** Sheet format 4 prevents an old client
from erasing new spell/feat selections. Existing formats 1–3 remain readable.

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
an ASI or automatically implement all its combat effects or ability bonuses.
Existing Origin Alert/Tough/Skilled automation remains in the original builder;
additional catalogue feats are reference selections, with Magic Initiate choices
supported as described above. Class learning/preparation limits, multiclassing,
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
