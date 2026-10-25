# Sorcerer points and Metamagic

The existing Character Builder now offers distinct Metamagic choices at the appropriate class levels. Combat’s existing Feature resources section tracks one Sorcery Point pool and can spend a chosen option’s full cost. The sheet’s navigation and page structure are unchanged.

| Rule | 2014 | 2024 |
| --- | --- | --- |
| Sorcery Point maximum | Actual Sorcerer level, from level 2 | Same |
| Metamagic options | 2 at 3, 3 at 10, 4 at 17 | 2 at 2, 4 at 10, 6 at 17 |
| Heightened Spell | 3 points; first save | 2 points; saves against that spell |
| Seeking Spell | 2 points, optional Tasha’s choice | 1 point |
| Twinned Spell | Spell level as cast, minimum 1 for a cantrip | 1 point, for eligible spells that gain targets at higher slot levels |
| Short Rest recovery | Sorcerer 20: regain 4 points each Short Rest | Sorcerer 5: regain up to half Sorcerer level, rounded down, once per Long Rest |
| Long Rest recovery | All class points | All class points; clears the Restoration limit |

All ten options have source-specific costs and reminders. Legacy Seeking and Transmuted Spell are labelled Tasha’s choices. Careful/Empowered Spell reminders use the current Charisma modifier, minimum one. The 2024 level-17 Metamagic reference is also restored when an older remote catalogue omits it.

**Use Metamagic** spends the selected option’s full cost atomically, refusing unchosen options and insufficient points. Legacy Twinned Spell asks for the spell’s level as cast. **Spend 1 point / Undo 1 point** supports other eligible feature costs and corrections. No spell DC, damage, range or duration is permanently changed by selecting an option: temporary per-cast effects, targets and dice resolve at the table. Normally one Metamagic applies per spell; Empowered and Seeking describe their combination exceptions.

Restoration does not consume the revised once-per-Long-Rest use when the pool is full. Taking another Short Rest still restores other eligible class pools even after that use is spent. Multiclass limits use actual capped Sorcerer levels. Edition-specific choices, counts and recovery flags are retained when changing editions or reducing levels, and survive save/reopen through the existing grants envelope.

## Still pending

Font of Magic’s spell-slot conversion and created temporary slots need a separate, coordinated implementation. Metamagic Adept’s extra choices and restricted two-point pool are not folded into this class pool. Innate Sorcery, later class features and subclass-specific resources also remain on the class audit backlog. This PR does not claim complete Sorcerer automation.

## Manual test

1. At Sorcerer 5, choose Quickened and Heightened Spell in Character Builder. In 2024 each costs 2 points; the class pool has 5.
2. Use both from Combat: 1 point remains and another two-point use is unavailable.
3. Take a Short Rest: 2 points return. A second Short Rest restores no further Sorcerer points until a Long Rest. Save/reopen should retain that limit.
4. On a 2014 character choose Twinned Spell. A level-3 cast costs 3 points; a cantrip costs 1. Heightened costs 3 in this edition.
5. Check Overview and print against Combat, then add a multiclass level: the pool must follow Sorcerer levels, rather than total character level.

Sources: official [2014 class rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 class rules and Metamagic options](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), and Tasha’s Cauldron of Everything for the two optional legacy choices. Descriptions here are concise original summaries.

No Firestore/Storage rules, production data migration or global rules-catalogue publication is required. Engine/browser tests cover levels, costs, finite spending, conditional recovery, multiclass, save/reopen, print, inline help, mobile and accessibility. A Firestore emulator test saves the choices and recovery flag and rejects unrelated readers/writers.
