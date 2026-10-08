# Campaign builder and catalogue controls

This change covers the eight approved improvements in one PR:

1. Each class has a **Level up** button. With milestone/manual leveling, it raises total character level when necessary. XP characters can only assign levels they have earned, and level 20 remains the limit. Multiclass selectors offer different classes.
2. Fighter, Paladin and Ranger Fighting Style choices live with their class levels. The class reference links directly to the choice. Existing feat-based styles are recognized; changing that style removes only the matching legacy style selection. Archery, Defense, Dueling and Two-Weapon Fighting use the core calculations.
3. Overview **Fix** buttons open the appropriate tab and details, scroll to the missing field and highlight it. Builder summary warnings also offer a direct Fix button. Selected feat warnings target that feat's controls.
4. Spell generation merges automatic class/subclass grants with player selections. Grants are locked, labelled **Always prepared**, deduplicated by catalogue ID and excluded from preparation counts. Paladin class grants, Paladin oath tables, Cleric domain tables and current Warlock patron tables use individual class levels. 2014 Warlock expanded lists are not automatically prepared. The implemented grant tables are in `CharacterSpellcasting.grantTables`; this is not a claim of complete automation for every supplement subclass. Custom/manual spell rows and other classes' spells survive regeneration; exceeding 150 rows blocks the operation instead of truncating them.
5. Inventory gear choices show full unit names, including **Fine clothes**, while retaining IDs, quantities, prices and weights. The Adobe-data generator uses the same naming rule.
6. DM Tools can create campaign feats with a name, editable description and optional minimum level, HP per level, speed bonus and armor training. Players select those feats and can pin their descriptions to Overview. The DM can assign a custom feat with a protected bonus allowance.
7. DM Tools selects **2014 only**, **2024 only** or **both**. Disallowed editions disappear from new character, background, species, subclass, feat, spell, equipment-pack and campaign loot choices. Edition-neutral equipment remains available. Backgrounds granting removed feats cannot be newly selected. Existing character choices are retained, with an unavailable-choice placeholder where needed. Saved effects remain available for existing characters. Live policy updates refresh current controls.
8. DM Tools edits standard feat names/descriptions and hides or restores feats for this campaign. Standard mechanical identities stay intact. Reset removes standard overrides and archives custom records so existing characters retain their references. The global catalogue and character documents are not deleted.

## Storage and rollout

Campaign settings use `campaigns/{campaignId}.allowedEditions`. Campaign feat overrides use `campaigns/{campaignId}/featCatalog/{featId}`. The new Firestore rules permit active members to read these records and only campaign owners/DMs to modify them. Bonus advancement remains protected on private sheets.

Publish the updated `firestore.rules` (revision 29) when enabling this release. The Hosting workflow does not publish Firestore rules. An old campaign without policy settings remains usable if the new collection rules have not been published yet; its new DM controls explain that the rules must be published. Configured policies fail closed if their feat records cannot be loaded.

No production deployment or merge is performed by this PR.

## Validation

- 170 core/rules-model tests pass, including policy isolation, bounded custom effects, preserved standard feat mechanics, automatic spell counts, grant/catalogue integrity, subscriptions and rollout behavior.
- 144 focused DOM checks pass across policy, form, gear, Story and Builder/Overview flows. They cover save/reopen, DM assignment, reset preservation, allowed and excluded choices, stale DM controls, HP/proficiency effects and Fighting Style attack/AC calculations.
- The same 144 interactions pass in Chromium with mocked Firebase data. Desktop and 390px mobile layouts were checked, with no new controls outside the viewport and no browser exceptions.
- 9 Firestore emulator groups pass for owner/DM writes, player reads, denied player/outsider writes, invalid policies/payloads, campaign isolation, reset/archive behavior and protected custom-feat assignment.
- The legacy aggregate DOM runner has the same 26 failure entries on base commit `a9288e2` and on this change. These include expectations for eight tabs, old Story controls, read-only Overview controls and the mocked form-validity API. No additional failure entries were introduced. Older broad permission tests likewise expect field-level validation that revision 28 intentionally replaced with an opaque, versioned private-sheet envelope; the new permission suite tests the current rules directly.

Reproduce the focused checks from the repository root:

```sh
npm --prefix tests run test:policy
npm --prefix tests run test:form
npm --prefix tests run test:gear
npm --prefix tests run test:story
npm --prefix tests run test:builder
npm --prefix tests run test:policy-rules
```

Rules sources: [2024 Basic Rules classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [2014 Basic Rules classes](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), and the source-labelled mechanical catalogue already bundled with the app. Spell descriptions remain in the existing licensed/reference catalogue.
