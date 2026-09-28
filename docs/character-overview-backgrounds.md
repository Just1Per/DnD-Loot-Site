# Read-only overview, spell information and backgrounds

This update starts from merged PR #2. It uses the supplied Adobe/MPMB sheet as a visual reference: a narrow ability column, compact skill/saving-throw rows, vitals, defenses and an attacks table. It does not copy Adobe/MPMB artwork or execute its embedded JavaScript.

## Layout and interaction

- **Overview** contains computed output only. Identity is edited in **Character builder**, scores/proficiencies in **Abilities & skills**, HP/conditions/manual actions in **Combat**, and equipment in **Inventory**. There are no duplicate editable fields on the overview.
- **Feats** is a separate tab containing the catalogue, selected feat effects, Human/custom-background Origin choices, Variant Human feat choice and Magic Initiate selections. Background-granted feats remain automatic.
- **Spells** has an accessible `i` button for catalogue results and saved spells. Its modal shows edition, level/school, casting time, range, components, duration, description and source. Saved custom notes are supported and escaped as text. Closing the sheet clears its private popup.
- Full spell descriptions are limited to the existing licensed catalogue text and user-entered saved notes. Other records show their source reference explicitly. This release does not invent missing spell descriptions or add spell-damage execution.
- Overview values recalculate after edits on other tabs, feat changes and live equipment updates. The compact display has responsive layouts for narrow screens. Printing retains the existing full-journal behavior.

## Background coverage and automation

There are **35 named profiles** plus Custom/manual:

- All **16 PHB 2024** backgrounds.
- **13 PHB 2014** backgrounds and **6 legacy variants**: Spy, Gladiator, Guild Merchant, Knight, Retainers and Pirate.

This is the core Player's Handbook set, not every background from every setting/supplement. Each selection displays its edition, source/page, skill grants, fixed/selected tools, language count, and either its Origin feat/ability choices or legacy feature name. Narrative feature outcomes and starting equipment remain DM-managed. Selecting a background never creates campaign inventory or changes coins.

Background skill, tool and language proficiencies are derived from the current selection. A duplicate background skill supports a different untrained replacement; stale or invalid replacement/tool/language choices do not grant extra benefits. The Guild Merchant tool-or-extra-language option is supported. Changing backgrounds removes the previous background's derived bonuses without deleting manual character notes.

2024 choices restrict +2/+1 or +1/+1/+1 to the background's allowed abilities (up to 20, in Base mode). Their fixed Origin feat connects to the existing feat engine, including Tough HP, Alert initiative, Lucky resources, Crafter/Musician training and Magic Initiate selections. Unsupported conditional feat effects remain manual and are labelled. 2014 backgrounds do not gain ability increases or Origin feats under 2014 rules. Using a legacy background with 2024 rules adds the 2024 ability/Origin choices while retaining legacy proficiencies.

## Storage and installation

New saves/exports use **schema 8** so older clients cannot discard new background selections. Formats 1–7 remain readable. **Publish the complete current `firestore.rules` before saving**, then reload the site. Owner/DM privacy and revision checks are unchanged. No Functions or live database import are needed.

Generated factual metadata lives in `js/modules/character-background-data.js`. Rebuild it with:

```
python scripts/build-backgrounds.py
```

The script pins the metadata index to 5etools revision `b9061583536101068b3a59d27e886d1fa664e366`, limits extraction to PHB/XPHB and excludes source prose. Rules context was checked against the official [2024 backgrounds article](https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024), [2024 character origins](https://www.dndbeyond.com/sources/dnd/br-2024/character-origins), and [2014 background rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background). Existing SRD text attribution remains in `rules-attribution.html`.

## Validation

Calculation tests cover all profile metadata, ability caps, background switching, edition compatibility, duplicate skills, allowed tools/languages and Guide's spell grant. DOM checks cover the read-only overview, all 18 skills, unique input locations, dedicated Feats tab, saved selections, popup lifecycle and safe custom text. Firestore emulator checks protect schema 8 and background choice persistence.

The supplied PDF's first page was rendered and reviewed as the layout reference. Browser screenshot acceptance remains on the preview: the local Chromium download failed, so DOM checks must not be described as rendered desktop/mobile visual QA.
