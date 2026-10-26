# Feats reading view and compact Character Builder

The Feats page now starts with **Your feats**. Its cards include ordinary selections, background feats, race-granted feats and class Fighting Styles, each labelled by origin, rules edition and source. Choosing the Human Additional Origin feat immediately updates its card; the dropdown also confirms what was selected and points to the reading view. The existing class progression and selection budgets remain in force.

**Choose & manage feats** follows the cards, with background/race dropdowns, granted training choices, advancement budget and a collapsible catalogue. Existing choice storage is retained. Supported feat-specific options remain with their card; Combat keeps its existing resource-use controls. A selected card’s disclosure preserves its state during recalculation, while changing the feat starts the new card with appropriate choices visible.

The **i** button opens the feat reference. Bundled information and source metadata remain available even when no automation adapter exists. Missing full rules text offers **Look up full feat rules** through the existing lookup with name, edition and source prefilled. Opening information or lookup does not automatically call an AI service or change the catalogue. The popup closes with Escape and returns keyboard focus. Repeated lookup icons are omitted from the new reading cards; lookup is offered inside the information popup when needed.

Background Magic Initiate variants such as Magic Initiate (Wizard) remain visible even when the catalogue stores a single base Magic Initiate definition. This is a presentation fallback, not a new automation adapter or an extra feat. Print uses the same selected-source inventory and includes source labels, descriptions, selected ability/training choices, warnings and Magic Initiate spell selections. Metadata-only entries keep a source-specific external lookup link. Catalogue results, dropdowns and action buttons are omitted from print.

## Existing Origin feat corrections

Build-granted Skilled already applies its race/background training through the origin rules. The catalogue previously asked for the same training again and generated false empty-choice warnings. It now validates and displays the existing build choices without adding proficiency twice. Changing that training links to the existing granted-choice fields. Older saved Origin Skilled training is read into the existing build fields when no newer choices are present, without mutating the saved input or overriding newer partial choices. Editing a granted selection clears its obsolete training copy so clearing or replacing choices cannot resurrect stale training. Ordinary advancement Skilled retains its own feat choices. Incomplete/duplicate granted choices remain flagged. Build-granted Tough now describes its existing HP effect without applying it again.

Common 2024 Origin feat cards reuse the explanatory text already shipped in the rules module, rather than showing only feature names.

## Builder and point buy

- **Class Skill Proficiencies** replaces Class training.
- **Race Skill Proficiencies** replaces Species & ancestry choices; remaining race trait fields stay available.
- Standard, extra race and eligible background language choices are grouped under **Rules & character**, retaining edition and grant availability.
- Race size is no longer an editable dropdown. Its existing value remains in a hidden form field and survives saving; no stored size is erased or changed.
- Training uses more compact spacing. Section help remains available; individual labels use hover/focus help.
- **Start with a 27-point spread** uses a keyboard-accessible native disclosure. It can be collapsed without changing scores; its state survives recalculation while the current sheet is open. Preview, Apply, Swap, point-buy limits and budgets retain their existing behavior.

## Validation and deployment

Focused engine coverage exercises granted Skilled sources, nonstacking proficiency and Tough HP reporting. Real-browser coverage exercises selected-first ordering, source cards, changes, save/reopen, information/lookup, class and ordinary selections, granted training, missing adapters, print, language location, retained size, responsive layout and accessibility. Existing point-buy tests additionally cover collapse, recalculation and keyboard reopening.

No Firestore or Storage rules changes, new persistence schema, production migration or deployment. Top Guide and contextual help describe the new arrangement.
