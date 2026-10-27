# First-page Control prototype

Open a character sheet, choose **+ Page → Open Control prototype**, or visit `/prototypes/character-control/`. It opens in a separate tab. The existing Character Builder and saved character are unchanged.

This is a visual/manual concept test of the **first page** of the user-supplied MorePurpleMoreBetter v13.0.4 Printer Friendly PDF. It is not the Player Reference page. Generic artwork, shading, labels and source attribution retain the original layout; real browser controls occupy the PDF’s field rectangles.

## Included

- 295 editable controls: 150 text inputs, four multiline areas, 36 dropdowns and 105 checkboxes.
- Original dropdown choices for background, race, damage types, weapons, ability selection, recovery and ammunition. The PDF’s scripted save-DC selector has empty display captions; the six standard ability names supply its options. The class text field also offers the thirteen base-class names through a datalist.
- Manual ability scores and modifiers, saves and skill bonuses, HP, AC, initiative, speed, hit dice, inspiration, proficiencies, languages/tools, limited features, actions, attack rows and ammunition.
- Fit-width and 100–300% zoom with contained scrolling, accessible labels, keyboard interaction and visible focus.
- Download/Open draft for separate JSON copies, validated/atomic draft restoration, confirmation before overwriting entries, and confirmation before clearing.
- One-page print at the source PDF dimensions, with the prototype toolbar removed. The original source attribution remains on the sheet.
- Top Guide and contextual help explain the prototype and its separation from the saved character.

## Deliberately not connected yet

Changing a score, class, race or weapon does not calculate modifiers, grant features or change any other field. No SDK, authentication client or character engine is loaded by the standalone page. There are no Firebase writes, automatic grants, resource actions or changes to existing character data. Small PDF script buttons/icons are artwork in this first version; the banner makes that limit explicit.

Entries remain in the open page. Download draft keeps a local file and Open draft restores a valid file. The prototype does not silently save data to the browser or campaign. It starts empty rather than copying the supplied character’s personal values.

Future work can map approved fields to the appropriate engine after the appearance and interaction concept have been reviewed. This PR does not replace Character Builder or introduce a new character data model.

## Generation and validation

`python scripts/build-adobe-control-prototype.py /path/to/reference.pdf` rebuilds the generic background and field definition with PyMuPDF/Pillow. It reads graphics and form metadata, never executes embedded PDF JavaScript, and removes filled text, selections and checkbox marks. Only generic labels/artwork/attribution remain in the background. The original filled PDF is not published.

The background is about 185 KB and the field definition about 50 KB, loaded only when the standalone page opens. Existing app startup does not fetch them.

`npm --prefix tests run test:control-prototype` exercises the actual + Page link, retry after a field-load failure, native control counts, blank initial values, manual editing without cross-field calculations, saved-character isolation, null opener, contained mobile zoom, keyboard order, draft export/import, invalid-draft preservation, reset cancellation/confirmation, single-page printed values and axe checks.

No Firestore/Storage rules, migration or production data changes are required. No merge or live deployment is performed by the assistant.
