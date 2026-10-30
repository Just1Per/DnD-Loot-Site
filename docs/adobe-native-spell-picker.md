# Native Adobe spell selection

In Adobe preview, open a spell page and choose **Choose spells**. The button is available in the single-page toolbar, above each caster's page in All sheets, and on the original paper. The page's caster is selected initially. No Standard panel opens.

The dialog offers **Available spells** and **Your selection**, with name/search, reachable spell level and school filters. Exact names rank first. Clicking a name previews casting time, range, components, duration, description and source before choosing it. On mobile, the reference opens as a detail view with **Back to spells**. Results are rendered in batches of forty.

The existing CharacterSpellcasting profiles, casting statistics, automatic grants and CharacterCatalog filters remain authoritative. A multiclass caster selects from its own class-level reach, even if shared slots are higher. Class switching retains each draft. Wizard spellbook minimums are guidance; preparation is bounded. Known/fixed/prepared classes retain their existing selection allowances. Automatic grants are separate and locked. The existing generator uses the same shared selection validation helper.

Existing manual, unassigned, duplicate and unavailable records are retained. An imported over-limit pool may stay unchanged or decrease, but cannot increase. Manual/unassigned spell authoring is outside this picker. New choices follow current campaign sources and edition; source-specific Artificer fallback follows the existing catalogue policy.

**Apply to sheet** updates only the character's spell array. **Save sheet** persists it. **Cancel** or Escape discards the dialog draft. Actor/session changes, concurrent character or inventory changes and policy changes are checked before applying. Selection does not spend spell slots, restore resources, grant feats or modify campaign data. Ordinary and Pact slot controls keep their separate existing route.

No Firestore/Storage rule, schema, index or production migration is required. This closes the native selection bridge; it does not complete every source spell tool, custom spell editor or the full 1:1 conversion.

Verification covers shared pool limits/grants and inherited exceptions, Wizard preparation/book behavior, multiclass selection/reach, private save/reopen, cancellation, unchanged HP/coins/ordinary/Pact slots and inventory, retained manual/unassigned notes, actual PDF exclusion of unapplied picks/UI, mobile/accessibility, and stale/session cleanup.
