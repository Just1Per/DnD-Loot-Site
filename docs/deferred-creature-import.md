# Creature catalogue on demand

The public startup no longer loads or preloads `campaign-monster-catalog-ui.js`. Both Import SRD creature buttons load that public script through the existing shared optional-feature loader when clicked. The unused browser entry `campaign-monster-import.js` is also removed from startup; it remains available to the separate `scripts/import-srd-monsters.cjs` tool and its unit tests.

Mandatory startup files drop from 92 to 90. The two files total 9,780 uncompressed source bytes. Only the 7,135-byte catalogue UI is needed later in the browser. These are source/request-list measurements, not a measured production latency improvement. The existing SRD JSON catalogue remains fetched only on opening the picker.

## User flow and scope

Both toolbar and editor buttons display Loading creature catalogue while the code arrives and become enabled again afterwards. An inline error explains how to retry with the same button. Empty feedback is hidden to avoid adding space to the normal editor. The Guide and button help explain Open as draft versus Import selected, preserving the current draft and the separate publication step.

Concurrent requests share one script download. The latest valid opening can show one picker. Pending opens are cancelled by account, campaign, workspace, record or DM-role changes. Loading public code after such a change does not open a stale dialog or write any campaign data. The code uses already captured workspace/store interfaces and works after temporary SDK bootstrap bindings have been removed.

Selecting/importing, allowed-edition filtering, private stat blocks, partial-batch retry, lost-acknowledgement recovery and publication controls are otherwise unchanged. Public code promises contain no account data, credentials or tokens. No new private cache is introduced.

## Validation and timing limits

`test:creature-import-loading` runs the actual loader and script without either import module in its startup fixture. It checks absence of initial requests, rejected-code retry, both entry points, shared pending loads, one dialog, a real private draft save, unchanged player publication, stale account/campaign/navigation/record/role guards, player boundaries and mobile/WCAG.

An initial local run observed 70 ms to the first successful picker and 125 ms on reopening. These include browser automation, scrolling and rendering; both use an in-memory SDK/JSON fixture. They are not production or before/after timing claims. The reliable assertion is that the first successful opening downloads the UI script and later openings reuse it. The public startup request list separately proves both modules are no longer requested at boot. Production startup/function timings should be repeated after deployment; this change performs no deployment.

The existing bulk-import and creature-editor browser suites and workspace/import engine tests cover behaviour after the new loading boundary. Full engine/DOM and Guide checks remain in CI, alongside the new regression.

No Firestore/Storage rules, indexes, data migration or production deployment required.
