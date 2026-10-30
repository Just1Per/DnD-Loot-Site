# Adobe sheet parity backlog

Agreed with the user on 30 October 2026. Keep this work in PR #250. No assistant merge, live/rules deployment or production migration. A finished numbered point does not mean the entire PDF is complete. The [function ledger](adobe-inventory/web-bindings.md) records source actions individually.

1. **Original modifier and field-option menus — implemented; verification is recorded in PR #250.**
   - Shared native modifier dialog: original manual bonus, formula, live result, automatic calculation/training origins, Apply/Cancel and restore original bonus.
   - Bounded arithmetic with six ability modifiers, Prof, min/max, aliases and companion references to the character. No Acrobat/user code execution.
   - Saves, skills, all-skill/all-ability-save bonuses, initiative, passive Perception, custom checks, AC adjustments, stable attack hit/damage/dice, ordinary slot adjustments and caster-specific attack/DC/preparation settings.
   - Optional proficiency-dice field setting, retaining fixed passive/DC calculations and manual roll resolution.
   - Skill ordering and training-origin menu, with source/companion/print parity.
   - Shared persistent tool disclosure over the paper. Source Show extra features opens it; page, zoom and print remain directly available. Disclosure is a local scoped preference, separate from character mechanics.
   - The feature-specific menus for items, logs and layouts belong to points 3, 4 and 7; their unresolved actions remain explicit in the function ledger.
2. **Movement and encumbrance.** Accurate encumbered speed and movement/condition/equipment coupling. Keep both rule editions clear.
3. **Equipment and magic items.** Additional weight-inclusion choices, attuned-display/footer behavior, remaining item commands and supported computed/custom pools/effects.
4. **Adventure Log.** Remaining page/date options, add/reset/remove behavior and controlled character XP/treasure transfers.
5. **Class-specific companions.** Per-feature class/level scaling beyond ordinary creature Hit Dice, with multiclass and retained-state tests.
6. **Background choices and action reminders.** Source-specific background lists and supported class/spell action/bonus-action/reaction population.
7. **Conditional layouts and printing.** Remaining show/hide fields/sections/pages, original text/layout settings and print variants.
8. **Final PDF parity audit.** Review every relevant original button/function, end-to-end characters, multiclass, private save/reopen and actual PDFs. Passing field counts are not a completion percentage.

Character data stays in the existing private save/grants envelope. Each point must state tests and any actual rule changes in the PR. Keep future unsupported options read-only/unavailable and describe their remaining scope honestly.

## Later UX discussion

The user approved **collapsed initially, then remember the choice** for Sheet tools. The current Level field does not open a level-up popup; class levels are assigned separately. A guided level-up review (class allocation, automatic features, required choices, HP and confirmation) was discussed as a separate possible flow. It is not included in point 1; verify total/assigned-level consistency when that flow is designed.
