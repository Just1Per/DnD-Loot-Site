# Continue without downloading a ZIP

Repository: `Just1Per/DnD-Loot-Site`.
Branch: `notebook-srd-import-artwork-handoff`.

This branch preserves the notebook design, implemented bulk SRD creature import,
generated-artwork migration changes, catalogue review tools, and earlier local
campaign-layout fixes. It is a development checkpoint, not a production release.
It has not been merged, deployed, or used to migrate live data.

## Environment action

In the Codex environment settings, preserve existing allowed domains and add
`storage.googleapis.com`. Keep `api.github.com` if already configured. Save and
publish the updated environment, then start a new setup task selecting this
repository and branch. The old chat's configuration draft is stale and cannot
save the network change.

Suggested task prompt:

> Use cloud-environment-onboarding:setup. Work on Just1Per/DnD-Loot-Site at
> notebook-srd-import-artwork-handoff. Read
> docs/cloud-storage-emulator-handoff.md and finish the Firebase Storage emulator
> validation. Preserve the existing work and do not deploy or migrate production.

## Current validation and remaining scope

Read [the validation report](reports/notebook-and-import-validation-2026-10-19.md)
and [the notebook design](notebook-design.md). Browser, unit and Firestore checks
passed as recorded there. Actual Storage rule validation was blocked when the
Firebase CLI tried to download its Storage emulator and received 403 Domain
forbidden. The migration integration used a Storage contract double; it does not
substitute for the actual Storage rules emulator.

After setup, retry from the repository root:

```sh
XDG_CONFIG_HOME=/workspace/.config XDG_CACHE_HOME=/workspace/.cache \
FIREBASE_EMULATORS_PATH=/workspace/.cache/firebase/emulators CI=1 \
tests/node_modules/.bin/firebase emulators:exec --only firestore,storage \
  --project demo-vault-test --config firebase.workspace-test.json \
  'node tests/workspace-storage-rules.cjs'
```

Use normal TLS and download verification. These demo tests do not require
production Firebase credentials. Install locked dependencies if the environment
does not retain them.

Notebook image sharing is an interactive design and still needs application
integration. Actual journal uploads remain DM-only. The bulk SRD import is in
application code. Generated item-artwork preservation is implemented in the
migration tools, but production item decisions are still unapproved and no live
items or images have been moved. The private destination campaign identity and
fresh snapshot still need the documented read-only operator capture. No private
exports, destination identifiers, credentials or backups are stored in this
branch.
