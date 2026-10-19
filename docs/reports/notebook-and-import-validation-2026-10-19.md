# Notebook, creature import and artwork preservation — October 19, 2026

## Delivered

- `design/world-notebook.html`: interactive design for simple World/Chapter pages, separate text/image sharing and an always-private DM notes box. NPC/Encounter examples retain private stat-block preparation. This file is excluded from Hosting and makes no Firebase requests.
- Actual SRD creature picker: checkboxes, selection across filters, select visible, clear selection, up to 100 independent private campaign copies, partial-failure recovery, fixed retry destination IDs and preservation of the current editor draft.
- Migration: preserve the owner's generated illustrations with retained items. Move retired items and all matched artwork into the already-existing identity-pinned private campaign, verify copies before shared item removal, and retain image files used by both retained and retired variants. Missing explicitly referenced images stop apply.
- Generated artwork publication uses a backend-only Firestore registry. Unknown/unregistered original artwork remains administrator-only; private archives are DM-only.

## Passed

- 53 engine/content/store tests, covering catalogue evidence, private snapshots, approval boundaries, generated artwork policy, workspace records and normalized creature imports.
- Notebook browser: independent text/image snapshots, hidden notes/stats, upload validation, mobile widths 390/320, desktop, WCAG and no external requests.
- Bulk-import browser: filtering and selection, partial failures, lost acknowledgements, 100-item limit, current draft/source preservation, player publication excluding stats, account/campaign scope and mobile accessibility.
- Existing creature editor, workspace and NPC catalogue browser suites: detailed preparation, independent encounter copies, single-creature imports, private images, player publication, archived/reclassified NPCs and access revocation.
- Catalogue review browser: all proposals readable, safe metadata, local review persistence, notes export/import and blocked-storage fallback.
- Firestore emulator: real migration REST transactions and restart, 8 NPC publication permission groups and 7 workspace permission groups.
- Operator ZIP extracted and its 41 catalogue tests passed independently.
- JavaScript syntax and `git diff --check`.

The migration integration uses real Firestore emulator transactions and a deterministic Storage contract double. This proves the migration orchestration; it does not validate production IAM, asset availability or actual Storage rules.

## Blocked and not run

The actual Storage rules emulator could not start: Firebase's download of `cloud-storage-rules-runtime-v1.1.3.jar` returned **403 Domain forbidden**. The required `storage.googleapis.com` destination is absent from the running environment's network policy. No Storage rule pass is claimed.

An attempt to save an additive network configuration update failed because this chat's environment draft has a stale base version. The save was not confirmed. The transferable proposed change is provided as `/workspace/storage-emulator-network-update.json`; it preserves the known `api.github.com` custom domain and adds `storage.googleapis.com`.

To finish this check, open a new setup chat from the current cloud environment settings and attach that JSON. The setup should read the current draft, preserve its custom domains and add `storage.googleapis.com`, then save/publish the environment and retry:

```sh
cd /workspace/DnD-Loot-Site
XDG_CONFIG_HOME=/workspace/.config XDG_CACHE_HOME=/workspace/.cache \
FIREBASE_EMULATORS_PATH=/workspace/.cache/firebase/emulators CI=1 \
tests/node_modules/.bin/firebase emulators:exec --only firestore,storage \
  --project demo-vault-test --config firebase.workspace-test.json \
  'node tests/workspace-storage-rules.cjs'
```

Do not bypass the proxy or disable download verification. This validation uses a demo project and needs no production credentials.

## Production status

No live database migration, production rule publication, Hosting deployment or inventory modification ran. Item decisions remain unapproved in the generated worksheets. The destination campaign name/owner and fresh snapshot still need the already-documented read-only operator capture. Notebook image-sharing is a design example; the application still keeps its current journal uploads DM-only until the publication/store/Storage integration is implemented and verified.
