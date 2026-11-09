# Subclass mechanics validation

The class-by-class source review covers all 186 selectable subclasses and 1,365 pinned feature names/levels, through class level 20. Source revision: `b9061583536101068b3a59d27e886d1fa664e366`. Feature metadata was regenerated from the ignored local source cache and compared semantically with the committed reference; names, levels and canonical source selections match.

Both audit generators now report 186 concrete adapters and zero reference-only subclasses. `partial-mechanics` remains the status for adapters that require table resolution of targets, aura membership, positioning, reactions, recipients and explicit durations. It is not a claim that all encounter events are simulated. Class-specific mechanics documents record these boundaries, including companion current HP and armor infusion/replication allocation.

Validated on 9 November 2026:

- Complete latest Node suite: 1,010 tests passed.
- Complete DOM suite: 371 checks passed; subsequent focused tests also cover Kensei choice slots, ranged ability selection, combined Channel Divinity ledger limits and Genie Wish as an actual Arcanum.
- Thirteen class browser regressions passed: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard and Artificer.
- The feature and mechanics audit generators completed without missing pinned subclasses or runtime feature lists.
- `git diff --check` passed.

Main commands:

```sh
npm --prefix tests test
node scripts/audit-subclass-mechanics.cjs
node scripts/audit-subclass-features.cjs
```

The browser regressions use the repository's isolated character-sheet fixture. Generated spell references contain only spell names, source identity, grant kind and level data; source rule entries are not copied into these adapters.
