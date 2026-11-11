# Adobe page layout

Manage pages replaces the old Add pages entry in the sidebar and mobile navigation. Your pages lists every current page with a visibility switch. Add pages keeps the existing optional-page and repeat-copy controls. Hidden pages stay in the list and retain their content and character mechanics.

Each paper header has a Page options menu next to zoom and print. Hide this page removes that exact page from the sheet and navigation; an Undo notice restores it. At least one page remains visible. Hiding an active page moves focus to an adjacent visible page. Invalid field edits must be corrected before pages can be hidden. Explicit navigation to a hidden page restores it; ordinary recalculation does not.

Layout is stored in the private character sheet’s existing Adobe grants envelope as `pageLayout`. It contains validated, deduplicated hidden page plans, up to 40 manually added plans, and the Include hidden pages when printing preference. Stable page identities include caster, companion and continuation offsets. Existing browser-only extra pages are read as a fallback and included when the layout is next edited and saved. New saves therefore restore added and hidden pages without local browser preferences.

Connected printing, header printing and Ctrl/Cmd-P use the visible page selection by default. The manager’s Include hidden pages when printing switch restores all pages for output. Necessary overflow notes follow the visible source pages; hiding pages does not erase text, spells, companions or resources.

Tests cover bounded normalization, exact page identities, large automatic continuations, reversible visibility, keyboard menus, invalid drafts, separate companion copies, recalculation, private save/reopen after clearing local storage, both print selections, last-page protection, mobile layout and accessibility. Firestore emulator coverage checks that the layout persists inside the existing private envelope and retains owner/DM access boundaries.
