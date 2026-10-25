# Artificer: separate class rulebooks

Character Builder keeps its existing layout and adds one **Class rulebook** selector inside the Artificer card:

- **Tasha’s Cauldron of Everything**: the legacy Artificer, compatible with either core edition.
- **Eberron: Forge of the Artificer**: the revised Artificer, requiring 2024 core rules.

Existing characters remain legacy until their owner explicitly changes the selector. Newly adding Artificer in a campaign that allows only 2024 defaults to Eberron. Campaign edition restrictions still apply to new choices. No production data migration or Firebase rule change is required.

The choice and per-version subclass caches use the existing `classFeatureChoices` string-array map in the stable `rulesChoices.grants.__adobe` save envelope. Changing rulebook preserves the other version’s subclass and Flash of Genius count. Spell selections are retained for review; changing rulebook does not silently replace the player’s chosen spells.

## What follows the selected rulebook

| Area | Tasha’s legacy | Revised Eberron |
| --- | --- | --- |
| Prepared spells | Intelligence modifier + half actual Artificer level, rounded down; minimum 1, including on a 2024 sheet | Fixed class-table counts, tested at every level 1–20 |
| Cantrips | Class table | Class table plus Mending as an extra spell-generator grant |
| Spell catalogue | Legacy Artificer membership; use updated same-name spells on a 2024 sheet | Revised spell membership; avoid duplicate legacy/updated records |
| Tool Expertise | Double tool proficiency from actual Artificer 6 | Not granted by this class |
| Multiclass training | Legacy tools and armor training | Tinker’s Tools and armor training, plus one chosen skill; no automatic Thieves’ Tools |
| Flash of Genius | Intelligence bonus; minimum one use; Long Rest recovery | Minimum +1 bonus after a failed check/save; minimum one use; Long Rest recovery |
| Artificer 14 | Five attunement slots | Five attunement slots; Short Rest restores one Flash use |
| Artificer 18 | Six attunement slots | Six attunement slots |
| Artificer 20 | Saving throws, including death saves, gain +1 per owned attuned magic item | While attuned to an owned magic item, Short Rest restores all Flash uses |
| Class reference / Overview pins | Legacy feature list | Revised feature list; edition-only remote references cannot mix the two classes |
| Subclass selection | Legacy Artificer subclasses | Revised Eberron subclasses, including Cartographer |

Attunement counts require an owned item and include attuned items that are not currently worn. Saved choices survive level changes; excess multiclass levels cannot activate training. The use counters apply bonuses as reminders for the relevant table roll; they do not alter every roll automatically.

## Still pending

This is source separation and selected automation, not a completed Artificer audit. Infusions, Replicate Magic Item plans and item lifecycle, Magic Item Tinker actions, temporary gear creation, Spell-Storing Item, subclass-specific actions/resources and either version’s Cheat Death still need structured controls. The shipped class reference explicitly reminds the player about those features. Full subclass spell grants also need review.

The source facts in [artificer-source-facts.json](artificer-source-facts.json) list reference URLs, numeric tables and spell-name membership. They contain no copied long-form source text. The [level review](character-class-level-review.md) inventories both Artificer sources separately and marks incomplete automation honestly.

## Suggested manual test

1. Open an existing Artificer: the selected rulebook should still be Tasha’s. Check its subclass and tools.
2. On a 2024 sheet choose revised Eberron. Choose a compatible subclass; generate/update its spell sheet and confirm Mending is extra rather than using one of the ordinary cantrip choices.
3. At Artificer 14, spend Flash uses and take a Short Rest: exactly one use should return. At 20, repeat with an owned attuned magic item: all uses should return.
4. Switch back to Tasha’s: the original subclass and its separate Flash count should return. Tasha’s 6 has Tool Expertise; revised Eberron 6 does not.
5. Save and reopen. The chosen source, subclass, spells and current resource count should persist.
6. At Tasha’s Artificer 20, attune an owned magic item and verify all six saving throws and the death-save bonus increase once. Unequipping the item should not remove attunement; removing ownership should remove the bonus.

Automated coverage includes the source-specific level tables, multiclass/save-envelope matrix, browser save/reopen and source selection, mobile layout, accessibility, existing Artificer regression checks, and saving the new choices through the Firestore emulator with unchanged rules.
