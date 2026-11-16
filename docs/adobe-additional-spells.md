# Additional spells and numeric spell reminders (v90)

The Adobe spell-sheet heading now offers **Add other spells**. The same dialog is available through **Generate spell sheet → Add other spells** and **Show extra features → Sheet choices → Add other spells**, including for characters without a spellcasting class.

The catalogue can be filtered by campaign-permitted rules edition, spell level and search. It deliberately has no class-list or class-level filter. **Write a spell** accepts a name, level, casting facts, short description and full personal notes. Selected entries can be removed; handwritten entries can also be edited. Cancel discards the draft. Apply updates the sheet; Save sheet persists the changes.

Additional entries use the existing private spell schema with `classId: additional`. They receive a separate spell sheet and source label. Class spellbook, known-spell and prepared-spell allowances, automatic grants, slots and free-cast resources remain independent. Their casting ability is the character's existing manual `spellAbility`; special casting limits belong in the entry's notes. The workflow records additional spells; it does not establish a rules entitlement or grant spell slots. Existing catalogue attack references reuse the ordinary attack engine and are revoked when their entry is removed. Handwritten attacks remain manual.

Saved rows are editable directly on the paper. Personal short descriptions and full notes persist separately. Applying additional spells reveals their page, including restoring a previously removed additional-spell page without deleting its content. Existing class-generation workflows preserve these separate entries. The shared restoration path also clears the final removed-page record correctly; an empty normalized list must not merge the old deletion back in.

## Damage, areas and scaling

`character-spell-effect-data.js` contains display-only numeric facts for all 969 catalogue source records (583 spell names), derived from the pinned source revision `b9061583536101068b3a59d27e886d1fa664e366`. `build-spell-effect-reference.py` extracts numeric damage tags, explicit geometry and scaling metadata. `spell-effect-overrides.json` supplies original concise reminders for conditional effects, edition differences, summons, multi-part damage, walls, light radii and slot increments. Full source entries and copied rule prose are not emitted.

The generated [audit](spell-effect-description-audit.json) flags 369 source records with direct damage metadata/tags and 324 with geometry metadata/text; none of those flags lack a display fact. Additional reminders cover healing and linked summon stat blocks. These totals describe metadata coverage, not complete rule automation. Creature-dependent effects without a fixed spell damage value retain their qualitative reminder; creature actions are resolved using the relevant creature sheet. Area reminders distinguish explosions, target spacing, light, image/object dimensions and summoning spaces rather than treating casting range as a blast radius.

The short text is used on paper, in the readable spell list and in spell previews. The reader's expanded facts show damage/healing, area and scaling separately. Existing personal short text takes precedence and is never replaced; the reader supplements it with source facts. Long paper text uses the existing print-overflow notes so PDF export retains the complete reminder.

- **SL**: spell slot level; **CL**: character level; **SC**: spellcasting ability modifier.
- Hunter's Mark: **+1d6 per hit**, weapon damage in 2014 and Force on attack-roll hits in 2024. Higher slots extend duration; they do not add damage dice.
- Fireball: **8d6 Fire, 20-ft-radius sphere, +1d6 per slot level above 3**.
- Cantrip upgrades use character level. Spiritual Weapon's 2014 two-slot increment is separate from the 2024 per-slot increment.
- Display facts never become attack formulas. Existing mechanical damage data remains the engine's source of truth.

Regenerate from the ignored pinned cache with `python3 scripts/build-spell-effect-reference.py`; verify reproducibility with `--check`. No catalogue/Firebase migration is required.

## Verification

`character-additional-spells.cjs` covers class and multiclass boundaries, retained grants, noncasters, capacity, policy, atomic validation, handwritten persistence and revocable attack references. `character-spell-effect-data.cjs` checks catalogue/audit coverage, edition differences, cantrip/slot scaling, conditional effects, areas, summons and personal text. `adobe-additional-spells-browser.cjs` exercises the production module order, normal class restrictions, catalogue/custom entry, Cancel/Apply, edits/removal, direct paper input, unchanged resources, private save/reopen, mobile, axe, actual PDF output, changed source policy and stale sessions. Existing spell-picker, reader, source-generator, spell-page, page-deletion and attack tests remain part of the connected suite.
