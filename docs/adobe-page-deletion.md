# Adobe page deletion — v89

The user-selected behavior is **remove the page, retain its content**. Deleting a companion page does not remove the creature or change its equipment carrier; deleting a spell sheet does not remove spells, slots or recorded uses.

| Action | Your pages | Printing | Return to the page |
| --- | --- | --- | --- |
| Hide | Remains listed, switch off | Omitted unless Include hidden pages is checked | Turn its switch on |
| Delete page | Removed from the list | Always omitted, including when printing hidden pages | Manage pages → Add pages → Removed pages → Add page again |

Delete is available in each paper's **⋯ → Delete this page** menu and beside its visibility switch in **Manage pages → Your pages**. A native confirmation explains what changes. Cancel leaves the layout intact. At least one page must remain visible; its Delete action is disabled.

The private character's existing `adobe.pageLayout` now retains a bounded `deleted` list of canonical page identities. Removing a page also removes its manual `added` declaration and any `hidden` declaration. The normalizer strips content and unsupported fields, deduplicates identities, and keeps the old layout shape when no pages are deleted. No schema version, access rule, index or production migration changes.

Generated pages are filtered before building the live page list and before printing. Recalculation cannot resurrect them. Exact caster, companion and continuation identities remain independent. Removed pages appear separately under Add pages; restoring a page reconnects its retained content. Explicit navigation to a specific removed sheet can also reopen it. Add another allocates unused offsets, including avoiding offsets belonging to removed pages. Required print continuations for remaining visible content are still generated normally.

Save sheet persists the layout through the same private store, including a second device without local preferences. Delete only modifies page layout; character data, journal, companions, gear, ownership, HP, spell selections, class choices, charges and counters are retained. Pending confirmations reject changed data, saving sessions, account/session changes and detached page-manager controls. Closing the sheet dismisses its own deletion confirmation. A delayed old mount cannot take ownership of a newly restored page with the same identity.

Validation covers pure normalization/removal/restoration/limits and exact live/print filtering, plus the production browser path: paper menu, manager, Cancel, hidden-versus-deleted behavior, independent companions/casters/notes, all character data retained, recalculation, private save/reopen without local storage, a real PDF with hidden printing enabled, restoration, last-page guard, phone layout/accessibility and stale/account-changed confirmations. Existing page-addition and visibility browser suites remain included.
