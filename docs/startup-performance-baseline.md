# Offline ordered-loader baseline — October 21, 2026

`PLAYWRIGHT_PATH=<compatible Playwright module> node scripts/benchmark-startup.cjs` measures the existing `js/app.js` bootstrap with its real ordered feature loader and all current feature files. Only its Firebase imports are replaced with the deterministic browser-test SDK. All external requests are blocked; authentication callbacks are registered but no login occurs. The script asserts readiness, working navigation/World/Guide modules, no fixture writes and exactly one request per feature file.

Three fresh-page runs per case use 4× Chromium CPU throttling. Timing starts immediately before the module entry is appended and ends at `campaignatlas:ready`. The optional 40 ms request delay applies independently to each feature-file request; it is not a real network bandwidth/connection model.

| Simulated feature request delay | Ready times | Median |
| --- | --- | --- |
| 0 ms | 303, 276, 307 ms | 303 ms |
| 40 ms per request | 257, 350, 287 ms | 287 ms |

Both cases requested all 102 feature files exactly once, registered the auth callback and made no campaign writes. The existing preload links already overlap feature downloads while preserving execution order. Timing variation is larger than the injected-delay effect in this fixture; these results do not establish a production startup bottleneck or justify another loader change.

This excludes real Firebase SDK imports/initialization, App Check, authentication/account restoration, Firestore latency, real cache/network conditions and actual catalogue/image loading. Library items are already lazy-loaded, and image queues have separate coverage. The bootstrap readiness event does not mean a signed-in campaign has finished loading.

Next useful startup evidence is a production browser trace separating public landing readiness, sign-in/account restoration, campaign loading and an explicit Library load on the owner's representative device/network. No performance guarantee or live-production validation is inferred from this offline baseline. No authentication, credential, access-rule, loader behavior or deployment change accompanies this audit.
