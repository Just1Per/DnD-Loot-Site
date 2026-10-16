# Character workspace

My Character opens the existing character sheet. A shared Viewing character selector stays above Character Sheet, Gear & Loot and Wishlist. Manage characters retains creation, active-target selection, archive/restore and deletion.

Viewing a different character does not change the active Library save/loot target. The header names that target explicitly. Gear & Loot retains full owned-item cards and Use actions; campaign managers retain Unloot/Transfer. Manual equipment opens the real sheet inventory. Wishlist uses the full Saved cards from #107, including Remove/Move, properties, lookup and removable unavailable bookmarks.

Players can view only their own campaign characters. Campaign managers can open party characters. The displayed context is cleared on campaign/account changes and checked after delayed loads. Refresh restores the permitted character and section, reloading saved data rather than drafts. One-shot sheets retain their separate context.

Sheet sections, print, revision checks and Save / Discard / Stay are preserved. Choosing another character or section does not discard a dirty sheet. Returning from a pending load cannot select an old character over a newer selection.

Validation: `test:character-workspace` covers real authentication/campaign entry, full bookmarks and inventory actions, picker focus, character/role isolation, saved-data reload, dirty guards, superseded reads, print entry, narrow mobile layout and WCAG A/AA. Existing navigation, engine/DOM and UI/PDF print regressions also apply. Fixtures use deterministic Firebase responses; they do not prove production service availability.
