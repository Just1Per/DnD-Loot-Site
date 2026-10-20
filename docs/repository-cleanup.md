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

The notebook-only npm script and CI step are retired with the demo. A current root README replaces missing-file setup advice as the default GitHub entry point; generated DOM output is ignored. Actual `test:player-images`, `test:player-images-rules`, `test:campaign-journal`, `test:campaign-journal-rules`, SRD import and full application tests remain. The approved map demo remains an isolated design reference; the working map was integrated by PR #144.

## Preserve

- `scripts/operator-packages/`, package checksums, authorization/decision reports and migration/recovery modules: the launcher, packaging, CI and owner-run recovery still use these. Do not infer obsolescence from absence of a browser import.
- Data builders and audits, including manually invoked class/SRD/Adobe generators: they reproduce active data and licensing/coverage evidence.
- Legal pages, source hashes and rights metadata: required attribution/audit inputs, not redundant descriptions.
- `docs/campaign-experience-backlog.md` and `docs/overview-ui-backlog.md`: preserve remaining recommendations, paused One Shots work and deferred Overview checks.
- Firestore/Storage rules and backward-compatible saved-data readers: deleting old-looking schema paths could break existing campaigns.
- Agent skills and environment setup: external developer workflows may use them; absence of an app caller is not proof that they are unused.

## Approved follow-up cleanup

The owner approved the narrower follow-up on 20 October 2026, with the historical Foundation migration explicitly retained for recovery. No further confirmation is outstanding for this scope.

| Item | Result |
| --- | --- |
| `README.txt`, `README-FIRST.txt` | Removed obsolete patch-copy instructions; `README.md` is the current setup entry point. |
| `js/items.js` | Removed the empty seed export and commented book list; no runtime caller. |
| `js/migration-v2.3.js` | Retained for historical recovery. Current catalogue/private-library migration and diagnostic tools are also preserved. |
| `functions/index.js` and Firebase Functions target | Removed the empty starter endpoint scaffold and its unused deployment configuration. Hosting, Firestore and Storage configuration remain. |
| Functions dependencies | Removed unused `firebase-functions` and `firebase-functions-test`. `functions/` remains the historical `firebase-admin` SDK install location used by local operators; its manifest/lockfile are kept. Published operator ZIPs and checksums are unchanged. |
| Hosting file list | Excludes the operator dependency folder, rules, readmes, logs and audit-only reference hashes while retaining runtime assets and legal attribution. |
| Workspace delivery log | Removed duplicate `connected-workspace-progress.md`; current architecture and verification guidance live in `phase-3-architecture.md`. |

Nothing in this cleanup runs an import, migration, production rule deployment or production data operation. Removed Git-tracked artifacts remain recoverable from history.

## Verification for this PR

The current engine suite passes (27 reported test entries), the aggregate UI suite passes 363 DOM checks, and focused auth passes 9 checks. Actual app browser coverage passes for character loot/saved cards, editor/navigation guards, player image sharing and party Journal behavior. The existing 33-state page audit also passes at desktop and mobile sizes with no axe violations. Demo retirement does not remove the real app or emulator suites. No additional production rule deployment is required by this cleanup.

Follow-up verification: clean `npm ci --prefix functions --ignore-scripts --no-audit --no-fund` installs 178 dependencies instead of 538 lock entries; the operator's Admin SDK app/Firestore/Storage modules load without credentials. Operator regression tests pass 44 checks with two platform-specific skips. `test:packaging` verifies Firebase's actual Hosting file selection, including required runtime modules/styles/data and legal assets. Published operator ZIPs/checksums and the historical migration are unchanged. Linux/Windows CI also clean-installs and checks the retained SDK.
