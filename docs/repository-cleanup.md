# Repository cleanup inventory

Audit: 20 October 2026. Runtime references were checked across `index.html`, all browser modules and their dynamic HTML, plus tests, workflows, package scripts and operator packaging. All browser feature modules are loaded by `FEATURE_FILES`; the shared scope means an isolated-file unused-code rule is insufficient.

## Verified code cleanup

Removed six unused helpers: `loadItemState`, `patchItemState`, `rerenderCard`, `refreshStatsBar`, `createMiniCard` and `buildRenderContext`. New auth startup no longer invokes the no-op catalogue seeding hook. Its tiny compatibility function remains so a cached old auth script cannot fail during a mixed-cache refresh; it can be retired after a later cache-version rollout. The card renderer does not consume the old character/user/save maps produced by `buildRenderContext`; removing it also avoids building unused maps for every Library render. Current inventory/saved-card context fields remain intact.

Removed the old mini-card renderer styles, obsolete wishlist-modal card styles and old inline character-creation form styles. `mini-card-grid` is retained because the current loot/saved containers still use it. Current full item cards and character creation in the builder remain covered by app tests.

## Retired non-operational artifacts

The old standalone notebook and Journal concept demos are replaced by the working app, not deleted as product requirements:

- `design/world-notebook.html` and its demo-only browser test.
- `docs/prototypes/journal-concepts.html`, its explanatory Markdown, three PNG screenshots and its demo-only browser test.
- `docs/notebook-design.md`, the stale Storage-emulator handoff and the old notebook/import validation report. Their claims that image sharing is not implemented and Storage cannot be tested are superseded by the current app and permission tests.

The notebook-only npm script and CI step are retired with the demo. A current root README replaces missing-file setup advice as the default GitHub entry point; generated DOM output is ignored. Actual `test:player-images`, `test:player-images-rules`, `test:campaign-journal`, `test:campaign-journal-rules`, SRD import and full application tests remain. The approved map demo stays while map integration PR #144 awaits rollout.

## Preserve

- `scripts/operator-packages/`, package checksums, authorization/decision reports and migration/recovery modules: the launcher, packaging, CI and owner-run recovery still use these. Do not infer obsolescence from absence of a browser import.
- Data builders and audits, including manually invoked class/SRD/Adobe generators: they reproduce active data and licensing/coverage evidence.
- Legal pages, source hashes and rights metadata: required attribution/audit inputs, not redundant descriptions.
- `docs/campaign-experience-backlog.md` and `docs/overview-ui-backlog.md`: preserve remaining recommendations, paused One Shots work and deferred Overview checks.
- Firestore/Storage rules and backward-compatible saved-data readers: deleting old-looking schema paths could break existing campaigns.
- Agent skills and environment setup: external developer workflows may use them; absence of an app caller is not proof that they are unused.

## Larger changes requiring the separate review

The initial combined deletion/configuration/dependency batch was rejected by automatic approval review as too broad and potentially affecting recovery material and Firebase behavior. The narrower code/demo cleanup proceeded after reference checks and replacement app tests. These larger changes are not part of the code cleanup yet:

| Candidate | Evidence and proposed action |
| --- | --- |
| `README.txt`, `README-FIRST.txt` | Old patch-copy instructions refer to missing architecture/migration files and obsolete installation paths. Replace with root `README.md`, then remove both old files. |
| `js/items.js` | Empty export plus a commented book list. No runtime import; automatic seeding hook is gone. Remove the unused file. |
| `js/migration-v2.3.js` | Old manually imported Foundation migration, no current runtime/test/workflow caller. Remove only after confirming this historical recovery command is no longer needed; retain current catalogue/private-library migration tools. |
| `functions/index.js` | `require('./functions')` reports zero exports; only Firebase's commented starter endpoint and unused imports remain. Remove the scaffold, not the `functions/` Admin SDK dependency location. |
| `firebase.json` Functions block | Points only at the empty scaffold. Remove that block together with retiring the scaffold. Keep Hosting, Firestore and Storage configuration. No deployment command is proposed. |
| `firebase-functions`, `firebase-functions-test` packages | No endpoint or test uses them. Remove from `functions/package.json` and regenerate its lockfile. Keep `firebase-admin`, the Node engine and operator SDK paths. Existing packaged operator ZIPs remain byte-for-byte unchanged. |
| Hosting ignore list | Exclude `functions/**`, `firestore.rules`, root readmes, logs and audit-only source hashes from Hosting. Those files can remain in Git; the browser does not need them. Validate the resulting Hosting file set. |
| `docs/connected-workspace-progress.md` | Old delivery log overlaps `phase-3-architecture.md` and references a removed rules fragment. Consolidate current operational guidance into the architecture document before removing the log. |

Nothing in this cleanup runs an import, migration, production rule deployment or production data operation. Removed Git-tracked artifacts remain recoverable from history.

## Verification for this PR

The current engine suite passes (27 reported test entries), the aggregate UI suite passes 363 DOM checks, and focused auth passes 9 checks. Actual app browser coverage passes for character loot/saved cards, editor/navigation guards, player image sharing and party Journal behavior. The existing 33-state page audit also passes at desktop and mobile sizes with no axe violations. Demo retirement does not remove the real app or emulator suites. No additional production rule deployment is required by this cleanup.
