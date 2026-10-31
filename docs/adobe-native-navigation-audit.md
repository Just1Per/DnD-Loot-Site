# Adobe navigation and editor audit

Normal Adobe controls retain the paper. The Sheet style selector is the explicit way to switch between Adobe and Standard. This audit concerns navigation, not a claim that every original PDF function or layout is finished.

| Entry point | Behavior in Adobe |
| --- | --- |
| Level, class and class feature choices | Native class dialog |
| Ability scores, saves, skills and formulas | Native abilities/modifier dialogs; direct supported paper fields |
| Feats and spell selection | Native selected-list dialogs; information stays in a separate reference popup |
| Prepared circles | Direct paper toggle with class allowance; class grants locked |
| Named armor, shields and weapons | Editable text plus searchable suggestions; shared name/enhancement recognition |
| Origins, equipment, resources, journal, background and companions | Modal section over the paper using existing controls and Save action |
| Spell slots and additional controls | Modal section over the paper; same pools/controllers |
| Original Portrait button | Background popup; same private image controller |
| Source rules/reference section | Original reference page |
| Unknown future section route | Notice on Adobe; no fallthrough into Standard |
| Unconnected PDF controls | Remain disabled/read-only rather than redirecting elsewhere |

The generic popup moves the original form body and Save button temporarily, showing only its selected section. It restores them exactly when closing or disposing the session. Shared state, validation, inventory handlers, publication controls and save permissions remain authoritative. Errors and save status appear inside the popup. Closing keeps applied edits on the sheet; Save persists them. The paper remains visible behind the native modal and regains focus on close.

Dropdowns use a light appearance, including when the operating system prefers dark mode. Armor suggestions and owned armor selectors show a right-side Light, Medium or Heavy badge from the existing equipment profile. Shields, Unarmored and custom definitions have explicit labels. Enhancement values are retained, and searching a type finds its choices. This display does not grant armor training or change armor calculations.

Browser regressions cover every Sheet tools option, original source actions, nested searchable choices, original Save/status, Escape/focus/restoration, rules/unknown routing, session disposal, mobile/accessibility, armor types/enhancements, dark-system appearance and cancellation. The broader Adobe suite retains save, print, class, spell, inventory and companion checks. No Firebase rules or data migration are required.
