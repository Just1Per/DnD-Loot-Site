# Navigation and reading UX pass — 20 October 2026

The review follows actual browse/read/edit/return paths using isolated browser fixtures. It covers campaign managers, players and global administrators without campaign management permissions, at desktop, 390px and 320px widths. These changes require no additional backend rules or production migration.

| Area | Friction found | Result |
| --- | --- | --- |
| Library DM preparation | Bulk controls competed with browsing | One collapsed DM tools panel with an account-specific local preference; browsing and refresh remain outside |
| Recaps | List controls and the full contents index crowded reading; return lost position | Paragraph reader, optional collapsed contents, preserved search/filter/scroll/focus and exact own-draft editing |
| Items | Active filters were hard to see or undo; contradictory status checkboxes hid everything | Removable filter chips, clear action, exclusive opposite statuses, permitted result counts and useful empty states |
| Reusable content | Only free-text search, sparse preview context | Category search, edition/type/combat previews and retained in-app browsing state; independent unsaved imports |
| Library loading | Generic catalogue wording and alert-only failure | Named campaign destination, inline escaped error with retry, retained error while filtering and per-request/account/campaign completion guards |
| World and NPC lists | A failed search required manually clearing each control | Visible clear action plus an empty-results recovery button, with focus returned to search |
| Journal World links | A link opened a general list after reading one specific post | Open World post opens that exact shared entry |
| Library filter labels | Small labels failed text contrast | Larger labels with WCAG AA text contrast |

Validation includes the dedicated library-dm-panel, recap-navigation, library-browsing and navigation-feedback suites, and existing World/NPC/Journal, page editor, root-picker, grouped navigation and UI-consistency checks. Permission checks remain unchanged; browser coverage exercises account changes, private draft isolation and revoked content. Full GitHub Campaign workspace checks run per PR, including engine/DOM and Firebase emulator checks. See each PR for its exact final CI result.

This is a focused UX pass, not a claim that every possible campaign configuration has been visually reviewed. Existing item editing, publication and inventory transactions keep their original permission boundaries. No deployment, production data changes or PR merges were performed by Codex.
