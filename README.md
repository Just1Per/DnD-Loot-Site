# CampaignAtlas

A campaign website for character sheets, a shared item catalogue, private campaign inventories, DM preparation and deliberately published player journals, World pages and NPCs.

## Repository layout

- `index.html`, `css/`, `js/`: Firebase Hosting frontend. `js/app.js` loads the shared-scope feature modules in dependency order.
- `data/rules/`: licensed, versioned reference data. Some files are build/audit inputs rather than browser downloads; retain their attribution.
- `firestore.rules`, `storage.rules`: access rules, verified with demo emulators.
- `tests/`: engine tests, fixture-based app/browser tests and emulator permission tests.
- `scripts/`: data generators, read-only audits, preview maintenance and owner-run migration/recovery tools. They are not app startup code.
- `functions/`: the historical dependency location used by local operator tools for `firebase-admin`. The current scaffold exports no Cloud Functions; campaign operations use the browser Firestore store and rules.
- `docs/`: feature behavior, operational instructions and the remaining product backlog.

Start with [the code map](docs/code-map.md), [the campaign experience backlog](docs/campaign-experience-backlog.md) and [the cleanup inventory](docs/repository-cleanup.md).

## Development and tests

Use Node 22/24 and Java 21 for Firebase emulators. Install the locked test dependencies:

```sh
npm ci --prefix tests
npx --prefix tests playwright install --with-deps chromium
npm --prefix tests test
```

For focused UI checks:

```sh
npm --prefix tests run test:auth-cleanup
npm --prefix tests run test:character-workspace
npm --prefix tests run test:campaign-journal
npm --prefix tests run test:player-images
```

Browser fixtures use synthetic data, not production accounts. The campaign workspace workflow runs the broader browser, print and permission suites. Its print checks require Poppler (`pdftotext`). Emulator suites use project `demo-vault-test`:

```sh
npm --prefix tests run test:workspace-rules
```

The additional package scripts under `tests/package.json` select individual features. Use the existing emulator configuration and project flags rather than production credentials.

## Deployment and operational tools

Merging into `main` triggers Firebase Hosting deployment. PRs get separate preview channels. Neither workflow deploys Firestore/Storage rules. Review the affected feature's deployment guide before merging a rules-dependent change. Do not run broad `firebase deploy` commands as part of local testing.

Current reference guides:

- [Saved player illustrations](docs/player-illustration-sharing.md)
- [Private item library](docs/private-item-library.md)
- [Windows library operator](docs/windows-item-library-operator.md)
- [Campaign-image CORS preparation](docs/world-map-storage-deployment.md)
- [Rules catalogue and generators](docs/rules-catalog.md)

Operator tools may intentionally have no app caller. They support private backups, diagnostics, audit evidence and owner-run recovery. Keep private exports and credentials local. Migration and import commands are never routine setup steps. Licensing evidence, hashes, package checksums and legal attribution remain part of the repository.
