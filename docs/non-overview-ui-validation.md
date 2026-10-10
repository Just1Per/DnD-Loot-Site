# Non-Overview UI cleanup

This change completes the non-Overview portions of the P1/P2/P3 audit checklist. Character Overview rendering and its design remain deferred. The shared main landmark required updating the print container whitelist; this preserves existing Overview output rather than redesigning it.

## Completed checklist

| Priority | Audit points | Result |
| --- | --- | --- |
| P1 | 01 / S02 | DM planning tabs and direct editor entry require campaign DM rights. Approved player hosts use My One Shots from My Characters, with adventure-scoped preparation/rosters/encounters and no campaign navigation or secrets. Includes the pending PR #81 navigation guard. |
| P1 | 02 / S01 | Five legacy overlays use native dialogs: focus containment, Escape, backdrop close and focus restoration share one helper. |
| P1 | 03 / S03; 04 / C01 | Site captions, character actions and non-Overview sheet eyebrows use readable dark colors on pale backgrounds. Gold remains decorative. |
| P1 | 05 / C02 | Creature picker, all companion skill selectors and traits have accessible names. |
| P1 | 06 / C03 | Story traits use labelled editable textareas, separate suggestion buttons and keyboard dismissal/selection, without invalid combobox semantics. |
| P2 | 07 / E01; 08 / S06 | Shared palette and site action components cover primary, secondary, destructive, focus, disabled and feedback states. Existing character theme remains scoped; Overview token migration is deferred. |
| P2 | 09 / S04 | Admin and Root Catalogue content precede the unchanged legal footer inside the main landmark. |
| P2 | 10 / S05 | My Characters creates directly into the builder; saved sheet identity drives the list. Duplicate name/class/level creation inputs are removed. |
| P2 | 11 / S07 | Guide remains manual. Removed the misleading auto-open checkbox and its unused preference code. |
| P2 | 12 / S08 | Password recovery validates email, prevents repeated pending requests and reports accessible success/failure. |
| P2 | 13 / S09 | Skip link, main landmark, screen heading and existing catalogue semantics are retained together. |
| P2 | 14 / C04 | Companion search correctly splits multiple terms on whitespace. |
| P2 | 15 / C05 | Non-Overview help targets are larger and sit outside disclosure summaries. Overview targets and duplicate hints remain deferred. |
| P2 | 16 / C06 | + Page is outside the ARIA tablist in its own navigation row; tab reordering still operates on tabs only. |
| P2 | 17 / C07; 18 / C08 | Class spell tables have named keyboard scroll regions; spell-generator, portrait and print-dialog secondary text is readable. |
| P2 | 19 / startup | Static introduction/loading/retry feedback exists before module initialization. Ordered module execution remains intact while module fetching starts in parallel. |
| P2 | 20 / E02 | Aggregate tests now reflect current schemas, editable Story controls, Active Gear, DM advancement and native constraints. Chromium independently rejects 28/27 point buy without saving. |
| P3 | 21–22 / S10 | Item Controls, Campaign Settings, World Building, Chapter Tracker and One Shots share a five-column desktop row. Settings expand on demand; policy/feat controls use the same workspace styles. Responsive breakpoints use three, two and one columns. |
| P3 | 23 / C09 | Inventory Actions column has an explicit heading. |
| P3 | 24–25 / C10 | Builder has section jump links; one Companion uses a sensible reading width, with existing collapsible skills and persistent manual adjustments preserved. |
| P3 | 26 / E01 | Reviewed all 56 CSS candidates. Removed 99 proven obsolete standalone selector branches; retained shared/dynamic/print rules and deferred Overview candidates. See the CSS review. |

During validation, the core catalogue's generic Magic Initiate origin feat was found to be discarded by normalization. It now persists alongside the existing class-qualified legacy choices, with engine and save/reopen coverage.

## Shared palette

| Role | Color | Use |
| --- | --- | --- |
| Paper / soft paper | `#FDFBF7` / `#F4EFE6` | Fields, dialogs, cards |
| Parchment | `#E9DFCF` | Secondary surfaces |
| Ink | `#342D26` | Body text |
| Muted text | `#655744` | Captions and descriptions |
| Heading | `#5C1D1D` | Burgundy headings |
| Primary / hover | `#9B1D1D` / `#651313` | Main actions |
| Cream | `#F5E6C8` | Text on dark actions |
| Gold | `#D4AF37` | Decorative accents |
| Dark accent text | `#7D6608` | Readable gold-family text |
| Border / soft border | `#8A7355` / `#C8B89A` | Frames and field boundaries |
| Danger / success | `#8B2D2D` / `#3F642E` | Destructive actions / status |

Existing rarity colors remain labelled metadata. The burgundy, gold and parchment identity is preserved; pale gold is no longer used for the audited low-contrast body text.

## Verification

- **180 passing character engine tests and 336 passing aggregate DOM checks**, including meaningful native-form constraints in the fixture.
- **88 passing real Chromium checks** for keyboard, accessibility, responsive layouts and PDF content in `tests/ui-cleanup-browser.cjs`. All ten non-Overview sheet pages are checked at 320 px and 390 px and with axe WCAG 2 A/AA, 2.1 AA, 2.2 AA and best-practice rules.
- All eleven print sections must contain the character's name in extracted PDF text. Long notes must span multiple pages and retain their final marker. Sampled Overview remains one page; shared cleanup does not change its measured screen dimensions, typography, padding or colors.
- Workspace store/creature/import/encounter engine tests and browser flows cover world records, private print, chapters, milestone approvals, independent combatants and one-shot sheets.
- Firestore/Storage emulators verify campaign isolation, revoked membership, protected DM advancement, revision conflicts, private image type/size limits, delegated host scope and separate one-shot sheets.
- A broader 51-state fixture audit covers site pages, dialogs and mobile states: no runtime errors, no non-Overview axe violations; the two Overview help target-size findings remain deferred. Automated accessibility checks supplement visual and keyboard review; they do not establish complete assistive-technology conformance.

CI installs Chromium and Poppler, then runs the character, browser, workspace and permissions checks. Browser artifacts are written to the temporary `campaignatlas-ui-checks` directory (override with `UI_OUTPUT_DIR`).

### Test repairs and practical limits

The aggregate suite contained stale expectations reproduced on unchanged main. Tests now target current controls and schema 14 rather than hidden/removed fields. The former schema-replacement wrapper for permissions is replaced with explicit current access/envelope/revision/persistence tests; journal and policy suites separately enforce protected DM grants. Current Firestore rules intentionally normalize nested sheet choices in the client core rather than duplicating every nested shape in server rules. No production rules are changed or published by this PR.

Authentication and campaign data in browser tests are deterministic fixtures; password-reset delivery and a production signed-in session require deployment smoke testing. Permission checks use actual local Firebase emulators. No real recovery email is sent. Browser tests run in Chromium, not Safari or Firefox. Cold/repeat loading times on real devices remain a deployment measurement, not a performance claim based on fixture timing.

The separate product proposals (27: standalone characters; 28: optional compact combined print mode) are outside P1/P2/P3 and are not implemented here.
