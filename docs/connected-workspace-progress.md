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

## Stage 2 — Creatures & NPCs

World Building now switches between world entries and a searchable/category-filtered unified creature library. Story NPCs, monsters, bosses and companions share one record, with appearance, personality, voice, goals, relationships, optional combat, abilities, saving throws, actions, resistances and boss mechanics. The live card updates without closing the editor. Templates have an explicit revision and can be snapshotted for encounters.

Validation: creature normalization/defaults, statistic bounds and independent snapshots have unit coverage; the browser verifies creating, saving and reopening a 45-HP/16-AC monster and its live card.

## Stage 3 — Chapters and shared references

Chapter Tracker saves ordered chapters, planned/current/completed status, introductions, objectives, scenes, rewards, session notes and starting/target levels. Shared link pickers connect world entries, creatures and chapters by ID; saves resolve links inside the current campaign and reject missing/cross-campaign references. Archive preserves linked masters.

Milestone approvals record eligible characters and the target level, approver and timestamp. Approval is idempotent per character and does not choose class levels, HP or feats. Open sheet uses the existing builder. Browser checks confirm completing/approving a chapter leaves the character’s existing level unchanged.

## Stage 4 — Licensed SRD catalogue

The local catalogue contains 334 2014 and 341 2024 API records (675 total), each with source ID, edition, SRD version, Creative Commons licence, attribution and normalization notes. The importer uses only the two approved SRD endpoints, resumes through a local cache and atomically writes the completed JSON. API artwork is not downloaded or included. The bundled catalogue works without live API calls and is fetched only when opened.

The creature editor searches by name/type/CR, filters allowed editions and creates an editable campaign copy with retained attribution. Global records are not mutated. All 675 entries pass normalization/statistic/source/unique-ID checks; browser coverage verifies a 7-HP Goblin import, source attribution and edition selection.

## Stage 5 — Independent encounters

Encounters use explicit creature snapshots with unique combatant IDs. Initiative, temporary HP, damage/healing, conditions, concentration, rounds and reset affect only this encounter. Updating statistics from the master is an explicit action and preserves/clamps current HP. Saved creature templates and other encounters remain unchanged.

Four engine tests and a real browser scenario verify six independent combatants, damage, rounds, saved state and an unchanged master card.
