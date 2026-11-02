# Inline character choices in Adobe

PR #250, checkpoint v65. Adobe keeps the existing character, rules engine and private save path. The global default remains unchanged.

## Player flow

- On the first page, choose **Class**, then **Subclass** immediately to its right. **Multiclass — add another class…** is the last Class option and opens the Adobe class/level popup. Add another class there, allocate each class's levels, then Apply or Cancel. Level opens the same popup for rules, class choices, training and HP review.
- A subclass can be selected early. The sheet marks it as planned and shows the activation level. It grants no subclass effects or spells before the required level **in that class**, irrespective of total character level. Increasing or reducing that class's level activates or deactivates the selection without forgetting it.
- Choose **Background** and **Race** directly on the first page. Choices follow the selected edition and existing campaign restrictions. **Custom / manual** stays at the bottom.
- On the second page, **Add Features** opens an anchored background menu. Hover, click or tap **Personality trait**, **Ideal**, **Bond** or **Flaw**. Keyboard users can focus a category and press Enter, Space or Right Arrow. Left Arrow returns to its category; Escape closes the menu.
- Suggestions come from the selected background's existing story profile. **Custom — write my own** is always at the bottom and focuses the existing text box without erasing it. Text remains editable; replacing existing text asks first. Ideals' alignment labels are guidance, not automatic alignment changes. Changing background preserves written text.
- **Save sheet** persists choices. Print connected pages includes the chosen class/subclass and narrative text, without menu controls.

## Reviewed source facts

The two `data/rules/adobe-choice-reference-*.json` manifests retain class identities, source IDs, feature reference IDs and subclass unlock levels from the reviewed betterR20 JSON snapshot at commit `0ba85d82acfed1d7d106ebdccb34179fc584e97c`. `character-rule-choice-data.js` is the small runtime index. This imports facts, not an executable userscript or book descriptions. Existing shared feature implementations remain authoritative; this checkpoint does not claim complete external catalogue or feature parity.

2014 uses the class-specific unlock levels (for example Cleric 1, Wizard 2 and Rogue 3). Revised core classes use level 3. Artificer's legacy and revised source-specific choices remain separate; the older reviewed snapshot does not replace the site's revised Artificer catalogue.

To reproduce the manifests from already reviewed JSON class directories:

```sh
python3 scripts/build-adobe-rule-choice-index.py --legacy /path/to/data2014/class --modern /path/to/data/class
```

No foreign JavaScript is executed by this command.

## Persistence and validation

The existing private `rulesChoices.grants.__adobe.data.classLevels` envelope stores optional `plannedSubclassId`. Only an unlocked selection is exposed as `subclassId` to the existing feature/spell engine. Save normalization uses the character's edition. No Firestore or Storage rule changes, production migration or catalogue writes are required.

Coverage: all supported class unlock levels from 1–20 in both editions; actual Wizard 2014 level 1→2 and revised level 2→3→2; multiclass class-level isolation; planned save/reopen and emulator access restrictions; native multiclass Apply/Cancel; direct race/background changes; hover/touch/keyboard narrative selection, editable/custom text, replacement cancellation, stale menus; unchanged spent resources; mobile accessibility; connected PDF and existing Adobe browser regressions.
