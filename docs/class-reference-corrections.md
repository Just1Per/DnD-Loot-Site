# Corrected class-reference imports

The pinned Open5e/SRD import had three small reference defects. This change corrects their displayed names and summaries without changing the sheet layout or adding new resource controls.

- **2024 Monk:** level 3 is **Deflect Attacks**. **Stunning Strike** unlocks once at level 5, rather than appearing at both 3 and 5. The level-2 feature is named **Unarmored Movement**.
- **2024 Fighter:** the level-13 feature is named **Studied Attacks**.
- **Warlock, both editions:** the four Mystic Arcanum entries now describe spell levels **6, 7, 8 and 9** at class levels **11, 13, 15 and 17**, respectively. The import previously repeated the first description for all four.

Checked against the official [2024 class rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes) and [2014 class rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes). SRD-derived records retain their CC-BY attribution.

The build script applies these corrections when regenerating the pinned data. The runtime also corrects the affected records from an older remote rules catalogue, so republishing the global catalogue is not required. Unrelated records and the input catalogue are preserved. Saved Overview preferences are retained; an obsolete level-3 Stunning Strike pin no longer displays a feature the character has not unlocked.

These changes fix the class reference and its Overview reminders. They do not yet automate Deflect Attacks rolls, Studied Attacks advantage or Arcanum spell choices/counters. Those remain on the class-feature backlog.

No Firestore or Storage rule change, data migration or production deployment is required.

## Missing ASI milestones

The pinned normalized import omitted three named milestones: legacy Cleric 12, legacy Warlock 16 and revised Rogue 10. The local reference, reproducible importer and stale-remote fallback now retain those rows. Existing correct rows and unrelated source records remain unchanged.

The numeric feat/ASI budget already included these levels. This correction makes the builder/class reference and level-by-level inventory agree with that existing budget; it does not award additional feats or change saved choices. Regression coverage compares all supported classes at levels 1–20 in both core editions and checks missing/correct remote rows without mutation or duplication.

Official source tables: [2014 Cleric and Warlock](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Rogue](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). The builder’s existing ASI guidance and controls remain applicable. No Firestore/Storage rule changes, catalogue publication, deployment or migration required.
