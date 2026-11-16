# Rules catalogue and source information

Reviewed 16 November 2026. The public [rules and source information](../rules-attribution.html) explains edition coverage, original reminders, SRD attribution and table rulings. The in-app **Player guide** follows the current Adobe sheet, with optional class and equipment references in foldable sections.

## Current character workflow

Choose 2014 or 2024 beside Player Name on page one. Campaign rules determine available editions and catalogue choices. Select Class, Subclass, Race and Background directly on the paper; Level and Choose Feature open source-aware allocation and class-choice dialogs. A planned subclass activates at its own class-level minimum. Artificer has distinct legacy and revised source choices.

Generate spell sheet reviews class/race/feat sources. Choose spells handles each class’s reachable list, spellbook and preparation allowance. Display preferences do not teach or prepare additional spells. Ordinary Spellcasting, Warlock Pact Magic and supported feature-created slots retain their separate rules.

Add other spells records permitted off-list or handwritten entries on a separate Additional spells page without granting slots or free castings. Saved name and short-description fields remain editable. Personal short text and full notes persist independently; Cancel discards a popup draft, Apply updates the sheet and Save sheet persists it. See [additional spells and numeric reminders](adobe-additional-spells.md).

Species reminders include inherited traits within the selected species. A 2014 narrative background feature differs from a 2024 Origin-feat reminder. Editing or clearing the feature box does not change training or feats. Equipment bundles and checked starting coins require an explicit preview and confirmation. Page deletion removes a paper instance from the live sheet and print while retaining its content for restoration.

The private sheet schema is **14**. This guide/source-information update requires no database migration, rules deployment or catalogue import. The older schema 5–8 rollout instructions are superseded; the current store and security rules determine write compatibility.

## Coverage and text

- 969 versioned spell records: 525 legacy and 444 revised-era, representing 583 names. All 361 PHB (2014) and 391 PHB (2024) spells are indexed, plus the sources in [the manifest](../data/rules/manifest.json).
- 319 SRD 5.1 and 339 SRD 5.2.1 spell records have licensed full descriptions. Non-SRD records provide metadata, citations and original short reminders rather than full book entries.
- 302 versioned feat references include 178 entries with structured ability-increase facts. Other supported effects, choices and counters are implemented individually; selecting a feat does not automate every rule in its description.
- [Feature-level coverage](subclass-feature-coverage.md) records 186 selectable subclasses. The [mechanics audit](subclass-mechanics-audit.json) distinguishes supported mechanics and manual/table instructions. Catalogue counts are not a complete automation claim.
- [Spell display facts](spell-effect-description-audit.json) are generated from the pinned source plus original concise exceptions. Damage, area and scaling reminders are separate from attack formulas. Cantrip upgrades follow character level; slot upgrades and conditional dice retain their own rules.

Edition labels identify source rules families rather than blanket compatibility approval. The public source page preserves the separate Fan Content notice and Creative Commons attribution; SRD licensing does not extend to every referenced supplement or user upload. The pinned Open5e and 5etools revisions are linked there.

## Selected mechanics and table decisions

Current character choices supply supported training, defenses, movement, spells and resource limits. Conditional feat attacks/reactions, targets, rolls, concentration and table-specific exceptions require player review. Use the offered Use/Undo, preparation, rest and turn controls to record supported state. Read each control’s scope rather than assuming a rest resets every resource or heals current HP.

Additional spell entries and manual feature text do not establish a rules entitlement. Personal movement text changes the displayed reminder, not the engine’s underlying movement calculation. Existing blocked or obsolete selections remain recoverable on the sheet, while new choices follow campaign policy.

See [native spell selection](adobe-native-spell-picker.md), [feat combat reminders](adobe-combat-feats-equipment-text.md), [feat reactions](feat-reaction-audit.md), [background reminders](adobe-background-feature-descriptions.md) and [Artificer versions](artificer-source-versions.md) for their concrete supported scope.

## Optional catalogue publication

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
Global admins still get no campaign-sheet access bypass. Publication is a separate operator action; updating guide text does not publish data.

## Rebuild and verification

Normal installation uses the committed data; no source scraping happens on deploy. Intentionally rebuilding the catalogue and the separate numeric spell reminders uses the pinned source revisions:

```sh
python3 scripts/build-rules-catalog.py
python3 scripts/build-spell-effect-reference.py --check
```

The ignored local cache is excluded from Hosting. Catalogue generation extracts permitted metadata and licensed SRD descriptions. Spell reminders emit numeric/geometry facts and original concise overrides, without full non-SRD entries, book prose, artwork or lore. Review generated differences before changing source revisions.

Use the split dependency profiles for focused checks:

```sh
node scripts/test-profiles.cjs install core browser
node scripts/test-profiles.cjs run core -- npm --prefix tests run test:help
node scripts/test-profiles.cjs run core -- node --test tests/character-catalog.cjs tests/character-spell-generator.cjs tests/character-spell-summaries.cjs tests/character-spell-effect-data.cjs
node scripts/test-profiles.cjs run browser -- node tests/adobe-player-guide-browser.cjs
```

The browser test requires the profile’s Playwright Chromium and axe dependencies. It verifies guide shortcuts, keyboard behavior, draft preservation, the public source link, attribution links/anchors, responsive width and accessibility. CI also covers character save/reopen, campaign permissions and the connected Adobe workflows. The guide/source-page update itself performs no catalogue or character writes.
