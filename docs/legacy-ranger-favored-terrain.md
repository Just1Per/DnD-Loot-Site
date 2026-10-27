# Legacy Ranger favored terrain

In the existing class builder, **2014 Ranger → Natural Explorer · favored terrain** now provides one terrain choice at Ranger 1, two at 6 and three at 10. Choices must be distinct and come from Arctic, Coast, Desert, Forest, Grassland, Mountain, Swamp or Underdark.

The chosen names appear beside short, clearly labelled controls, in Overview and in print. Terrain benefits folds away until needed, and the fields share a single header help button; dropdowns show terrain names instead of repeated source/implementation labels. Extra selections remain stored but inactive after a level reduction; returning to the original class level restores them. Switching to 2024 hides this legacy feature without deleting its choices. Setup checks use assigned class levels, matching the visible Builder; extra inactive choices get an explanatory notice rather than a red marker on a valid current choice. Multiclass reports use actual Ranger levels, not total character level.

Natural Explorer's double proficiency applies only to related Intelligence/Wisdom checks using a proficient skill. It does not stack another proficiency multiplier on Expertise. Its travel benefits require at least an hour in favored terrain. Choosing Forest therefore does not permanently increase every Intelligence/Wisdom check, change movement or reveal map content. These situational rules are explained in the top Guide and retained as references; travel resolution remains with the table.

This covers base 2014 Natural Explorer. The optional Tasha's replacement and Favored Enemy/language choices require their own workflows. The audit remains partial for the complete feature.

## Sources and tests

The level thresholds, conditional checks and travel rules match the repository's pinned [Wizards SRD 5.1 feature data](https://github.com/open5e/open5e-api/blob/0acbf263c74caf8ad080af7a16d86d3700a1ac8f/data/v2/wizards-of-the-coast/srd-2014/ClassFeature.json), `srd_ranger_natural-explorer`. The SRD lists seven surface terrains; the additional Underdark option is labelled **PHB 2014** and retains only its option name. See the Ranger’s Natural Explorer feature in the 2014 Player’s Handbook.

Seven engine tests cover both editions at levels 1–20, distinct choices, invalid/stale slots, actual multiclass caps, removal, saved envelopes, edition changes, inactive choices and unchanged skill modifiers. The real browser checks selection/duplicate prevention, explanations, save/reopen, Overview/print, source/level changes, mobile fit and accessibility. Existing Ranger resource/action/print behavior remains covered.

No new Firestore or Storage rules, saved field, migration or production deployment is required or performed. Choices use the existing class-feature string-array map.
