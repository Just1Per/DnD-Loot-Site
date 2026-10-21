# Library rendering measurements — 21 October 2026

The Library repeatedly searched the complete item list and inventory for each item during visibility checks, filtering, card creation and statistics. Matching cards also searched saved items independently. This amplified the work as a campaign catalogue grew.

Build item/inventory/saved-item indexes once per synchronous Library render and pass them through that render. Filter text before deriving ownership state. These indexes are local variables, discarded after the render; there is no persistent cache or additional Firestore read. Subsequent renders read current items, inventory, saves and the selected character. Other card contexts retain their existing behavior.

## Reproduction and scope

After installing test dependencies and Chromium, run `node scripts/benchmark-library-render.cjs`. `PLAYWRIGHT_PATH` can select an existing compatible Playwright wrapper. The script uses the app's deterministic Firebase fixture, actual Library/card rendering and synthetic items; no production records are read or written. It applies 4× CPU throttling, warms each query and reports the median/max of five synchronous renders at 100, 500, 1,000 and 2,000 items. Images are omitted to isolate CPU/DOM work; network latency, startup and real image decoding are not measured here.

Initial before/after measurements on the same executor:

| Items | Query / rendered cards | Before median | After median |
| --- | --- | --- | --- |
| 500 | No matches / 0 | 8 ms | 3 ms |
| 1,000 | No matches / 0 | 15 ms | 4 ms |
| 2,000 | No matches / 0 | 45 ms | 9 ms |
| 2,000 | Needle / 20 | 47 ms | 11 ms |
| 2,000 | All / 2,000 | 573 ms | 429 ms |

A second optimized run measured 10, 9 and 393 ms for the three 2,000-item cases. These are local synthetic measurements, not production timing guarantees. Rendering thousands of complete cards remains expensive; pagination could address that later if real campaign sizes justify it. No pagination or user-facing layout changes are included here.

## Validation

Library browsing/search/filter/mobile/WCAG checks pass, including a new regression for inventory, saved-state and player-visibility updates on subsequent renders. Item removal, character gear/saved cards and root catalogue selection tests pass. No Firestore or Storage rule changes, production deployment or migration.
