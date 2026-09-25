# Character sheets: first functional release

Initial release: `feature/character-sheets`.

The follow-up `feature/character-rules-engine` adds a structured 2014 rules builder; see [character-rules-engine.md](character-rules-engine.md).

Open **My Character → Character sheet**, or **DM Panel → Characters → Character sheet**. Existing characters need no migration. An empty sheet is created only when first saved.

## Included

- Responsive, six-section character journal styled to match the existing site.
- Character name, class/subclasses and level remain in the shared roster. Species, background, abilities, notes and all other detailed sheet data are private.
- Six ability scores; saving throw proficiency; 18 skills with none/half/proficient/expertise; manual bonuses; passive perception and initiative.
- Current, maximum and temporary HP; damage/healing controls; inspiration, AC, speed, death saves, conditions, resistances and hit dice.
- Editable attacks with ability, proficiency and extra attack bonus. Damage expressions are entered manually.
- Spellcasting ability, calculated attack/DC, nine levels of spell-slot totals and usage, and a custom spellbook with prepared flags.
- Existing campaign loot rendered as full item cards for this character. Existing inventory controls remain authoritative. Coins and mundane equipment can be entered separately.
- Features, limited resources, proficiencies, languages, appearance, personality, ideals, bonds, flaws, allies, backstory and session notes.
- Explicit saving, unsaved-change close confirmation, JSON backup export, and a print layout including all sections and complete notes.
- Revision checking prevents simultaneous DM/player edits from silently overwriting each other. A conflict leaves the local draft available for export.

The PDF supplied in this conversation informed the field coverage. Its embedded Acrobat code and reference databases were not copied. This is not yet an automatic class builder: class/race features, spells, slot totals, rests, attunement effects, damage formulas and multiclass decisions are manual. Core modifiers follow the familiar 5e calculations with adjustment fields for exceptions. JSON export is a backup/reference format; import and PDF form filling are not included in this release.

## Database and access

Private document: `campaigns/{campaignId}/characterSheets/{characterId}`.

Only the campaign owner/DM and an active member who owns that character can read or edit the sheet. Site admin status alone gives no access. Other players can still read the existing basic character roster. Archived characters retain their sheets; removed members lose access.

The document contains `schemaVersion`, `revision`, `data`, `updatedAt` and `updatedBy`. Name/class/level and sheet data save together in a Firestore transaction. The existing `characters` documents are not replaced, so ownership and archive status are preserved.

## Before testing on Firebase

Publish the branch's `firestore.rules` manually in Firebase Console, as with the current workflow. The only rules addition is the `characterSheets` collection. Existing campaign/item rules remain intact. No Storage changes or Firebase Functions are required.

A branch push does not deploy production under the repository's current workflow: production deploys only from `main`. A PR may create a Firebase preview using the existing workflow. The preview uses the configured Firebase project, so editing a sheet there can change real data. Use a test campaign and accounts.

If rules have not been published, opening the sheet reports a permissions error with instructions. There is no fallback to storing private sheet data in the public roster.

## Validation

From `tests/`, run `npm ci`, `npm test`, then `npm run test:rules` (Java required for the emulator).

Completed locally:
- 8 calculation/normalization tests.
- 51 DOM interaction checks, including 34 existing site regressions and 17 sheet checks.
- 18 actual Firestore emulator tests: save/reload, owner/DM permissions, player/admin isolation, malformed writes, stale revisions, simultaneous saves, identity conflicts, archived characters and revoked membership.
- JavaScript syntax and Git whitespace checks.

Tests use a demo Firebase project, not production. DOM checks use linkedom and test adapters; they do not establish rendered-browser or mobile visual fidelity. Print styling and real-account flows still need browser review before merging. Tests use Firebase JS 11.10; the app retains its existing CDN version 12.16.0.

## File responsibilities

- `character-sheet-model.js`: pure data normalization and arithmetic.
- `character-sheet-store.js`: private Firestore persistence with revision checks.
- `character-sheet.js`: journal UI, editing, inventory, export and print.
- `css/character-sheet.css`: responsive and print layouts.
- Existing player and DM modules provide entry buttons; campaign switching/logout clears the private dialog.

Tests and documentation are excluded from Firebase Hosting uploads. The functions folder and deployment workflows are unchanged.
