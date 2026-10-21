# Bounded Library results

Large item catalogues now display 48 cards per page. Search, filters, visibility checks and the statistics bar still operate on every permitted campaign item. The item range and page number distinguish the displayed subset from total matches. Previous/Next controls appear above and below multi-page results; they are hidden for 48 or fewer matches. Disabled controls mark the first and last pages.

Changing a search/filter or clearing filters returns to the first page. Account, campaign, campaign-load generation, management role and active-character changes invalidate the page offset. Ordinary item refreshes retain the offset and clamp it to the last available page if results shrink. The lazy Library load gate clears stale pagination. The page state is in memory only.

A deliberate page change moves keyboard focus to the top result summary and scrolls it below the sticky site header. Background renders do not move focus or scroll. Existing item actions, source licences, images, catalogue imports and character inventory views remain available. The header Guide and search infobox explain full-list search and result pages.

## Measurements

Run `PLAYWRIGHT_PATH=<compatible Playwright module> node scripts/benchmark-library-render.cjs`. This uses the isolated Firebase browser fixture, generated items, 4× Chromium CPU throttling and five timed synchronous renders after warming each query. Images/network are excluded. These are local synthetic CPU/DOM results, not production timing promises.

Same-executor measurements on October 21, 2026:

| Items | Query | Before cards / median | After cards / median |
| --- | --- | --- | --- |
| 500 | All | 500 / 95 ms | 48 / 11 ms |
| 1,000 | All | 1,000 / 187 ms | 48 / 12 ms |
| 2,000 | All | 2,000 / 538 ms | 48 / 16 ms |
| 2,000 | Needle | 20 / 10 ms | 20 / 9 ms |
| 2,000 | No matches | 0 / 10 ms | 0 / 7 ms |

The broad-result improvement comes from building fewer card DOM nodes and handlers, not reduced database reads. The complete permitted item list is still loaded before client-side filtering. This does not establish startup/network/image performance; those remain separate backlog work.

## Validation and rollout

Expanded Library browser coverage checks first/middle/last pages, full-list search and counts, unchanged-filter reset, ordinary refresh retention, shrinking result clamping, account/campaign isolation, lazy-load cleanup, no campaign writes, keyboard focus, and 1440/390/320px overflow/WCAG. Screenshots are `library-pages-{1440,390,320}.png` in browser artifacts. Item removal, root catalogue selection/import, collapsed DM tools, Guide DOM, responsive UI audit and packaging are checked separately.

No Firestore/Storage rule changes, migrations, production data writes or deployment are required. Existing Library permission policy still runs before pagination. This PR does not include #170's separate recap moderation rule changes.
