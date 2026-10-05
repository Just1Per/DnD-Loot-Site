# Adobe / MPMB class-feature choice audit

This is the first checked-in baseline for the reusable class/subclass choice engine.

The audit was run against the user's supplied MorePurpleMoreBetter/Adobe character sheet plus the extracted WotC/UA rule bundle. The scanner reads structured JavaScript metadata only and does not execute Acrobat JavaScript or copy long rules descriptions.

## Baseline result

- 77 distinct choice groups / extension sets discovered.
- 10 core/base-class choice groups discovered in the base Adobe data.
- 43 direct subclass/add-on choice groups discovered.
- 124 helper-added option records found through AddFeatureChoice, AddWarlockInvocation and AddFightingStyle.
- Current web registry coverage: 8 covered, 9 partial, 60 missing across the full Adobe/add-on scan.

The full count intentionally includes optional WotC/UA/add-on material. It is a discovery queue, not a claim that every experimental option must be enabled for players.

## Core/base-class status

| Class | Feature | Status | Next action |
|---|---|---|---|
| Bard | Expertise | Missing | Add reusable skill Expertise picker |
| Fighter | Fighting Style | Covered | Wire straightforward effects into calculations |
| Ranger | Favored Enemy | Partial | Add explicit Ranger choice group |
| Ranger | Natural Explorer | Missing | Add terrain choice group for 2014 |
| Ranger | Fighting Style | Reference options found | Register Ranger-specific unlock/allowed list |
| Paladin | Fighting Style | Reference options found | Register Paladin-specific unlock/allowed list |
| Rogue | Expertise | Missing | Reuse the same Expertise picker as Bard |
| Sorcerer | Metamagic | Missing | Add level-scaled Metamagic choices |
| Warlock | Eldritch Invocations | Covered | Expand source coverage and automate safe effects |
| Warlock | Pact Boon | Covered for 2014 | 2024 pact choices remain invocations |

Battle Master 2014 Maneuvers are also covered by the new subclass choice registry.

## High-priority missing subclass/add-on groups

The scan also found many choice-producing subclass features that are not yet represented in CharacterClassFeatureChoices, including:

- Path of the Totem Warrior totem selections.
- Way of the Four Elements elemental disciplines.
- Arcane Archer Arcane Shot options.
- Rune Knight rune selections.
- Storm Herald environment choices.
- Cavalier and Samurai proficiency/language-style choices.
- Divine Soul and other Sorcerer subclass choices.
- Several Wizard subclass option sets.
- Additional Warlock invocations and Fighting Styles added by later WotC sources.
- Artificer/infusion-related extension choices.

## How to rerun

Directly from an Adobe/MPMB PDF:

    python scripts/audit-class-feature-choices.py "/path/to/dnd character sheet js.pdf" \
      --markdown docs/adobe-class-feature-choice-audit.md \
      --json /tmp/adobe-class-feature-choice-audit.json

To include an extracted MPMB rule bundle as well:

    python scripts/audit-class-feature-choices.py "/path/to/dnd character sheet js.pdf" "/path/to/mpmb-rules.js" \
      --markdown docs/adobe-class-feature-choice-audit.md \
      --json /tmp/adobe-class-feature-choice-audit.json

PDF input requires pypdf. The script never executes the embedded JavaScript.

Use --strict in CI or locally when we eventually want incomplete choice coverage to fail the audit.

## Definition of done for this area

1. Every supported 2014/2024 class and subclass choice-producing feature is represented in the registry.
2. Level-scaled pick counts and replacement rules are correct.
3. Hard prerequisites are machine-validated; manual prerequisites are clearly labelled.
4. Choices survive save/reload and multiclass/subclass/edition changes safely.
5. Straightforward sheet effects are automated; complex table-play effects remain clear reference/manual entries.
6. Running this audit against the supported source set leaves no unexplained missing groups.
