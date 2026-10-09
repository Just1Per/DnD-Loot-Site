# Connected campaign workspace delivery

One PR receives six tested implementation commits: world records/maps, reusable creatures, linked chapters, approved SRD imports, independent encounters and delegated one-shot rosters.

## Stage 1 — World foundation

World Building now opens a campaign journal with searchable active/archived entries, category, title, summary, player description, DM secrets, related-place notes and private image/map uploads with named markers. Save/reopen uses revision checks; editing does not recreate the form. Archive preserves IDs and secrets. Player preview and print omit DM notes.

`campaign-workspace-store.js` centralizes typed campaign paths and transactions. Description records and `workspaceSecrets` are separate. Every current workspace collection is DM-private. Later host grants will be scoped to individual one-shots.

### Manual configuration before using uploads

Publish the updated `firestore.rules` through your existing manual process. The repository did not contain the deployed Storage rules, so **merge** the `workspaceDM()` function and `campaign-world-images` match from `storage-workspace.rules` into the existing rules. Do not replace your existing item-image rules with that isolated file. The production Firebase configuration deliberately does not deploy Storage rules.

Map images are fetched through authenticated `getBlob()` and temporary browser object URLs, rather than stored public download tokens. Configure the bucket's CORS for GET requests from your production/preview origins if not already configured. Firebase's instructions: https://firebase.google.com/docs/storage/web/download-files#cors_configuration .

Replacing a map uses an immutable new path. Unreferenced uploads are retained rather than risking deletion of a referenced map; storage cleanup will require a separate reviewed maintenance operation.

### Verification commands

- `node --test tests/workspace-store.cjs`
- `firebase emulators:exec --only firestore --project demo-vault-test --config firebase.workspace-test.json "node tests/workspace-rules.cjs"`
- `firebase emulators:exec --only firestore,storage --project demo-vault-test --config firebase.workspace-test.json "node tests/workspace-storage-rules.cjs"`
- `PLAYWRIGHT_PATH=<installed Playwright module> node tests/workspace-browser.cjs`

Emulator fixtures use demo projects and never modify a live campaign. The browser fixture mocks Firebase while using native forms, file inputs and page layout.
