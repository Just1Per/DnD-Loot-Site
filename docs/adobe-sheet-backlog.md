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

## Adobe owns every workflow — revised requirement

The user approved **collapsed initially, then remember the choice** for Sheet tools. After testing, the user clarified that Adobe must provide every setting itself and is intended to become the future standard. Opening Standard/builder panels is an interim bridge, not completed Adobe parity. Shared rules, private persistence and catalogue data remain reusable.

The immediate priority is a native class/level/subclass dialog opened by a single click on Level or Class and Levels. It must include rule/source eligibility, multiclass allocation, class choices and training, HP review, Apply/Cancel, and retained resources. Follow with native origins/abilities/feats/spells/equipment/companions and the remaining paper tools; remove each legacy navigation bridge only when its replacement is working and tested. Do not switch the global default until this complete path has been tested. The remaining numbered mechanics/layout tasks above still apply.

### Native configuration checkpoint v43

Implemented in the #250 worktree: single-click Level/Class and Levels popup with isolated draft, class/edition/subclass/source selection, multiclass allocation, XP and one-shot limits, class choices, invocation cantrips, class skills/Expertise/weapon training, Artificer tools and HP review. An independent abilities/saves/skills popup includes point-buy validation and collapsed starting spreads. Both keep the paper visible and the old builder hidden. They retain unrelated state and require the normal Save sheet after Apply. The remaining origins/feat/spell/equipment/companion and paper-tool bridges are still open work; this checkpoint does not mark native parity complete.

### Native feat checkpoint v44

Added an Adobe-owned selected-first feat dialog for granted/advancement choices, rule information, supported effect controls, weapon choices, simple resources, description display and Magic Initiate selection/free use/spellbook actions. The existing pure entitlement/effect functions remain authoritative. The native class Training step now includes the revised Rogue’s extra language. Origins, DM feat-grant/approval administration, class spell management, equipment, companions and remaining paper-tool bridges remain open; the global default is unchanged.

### Feedback from the first preview test

Hide unavailable choices from the other rule edition in Adobe pickers, preserving existing saved selections. The next display task is a continuous editable stack of the connected paper sheets with a fixed left shortcut rail (including direct Spell slots navigation) and a compact mobile alternative. Keep the shared character engine, input validation, private save and printing; avoid disconnected screenshots or a second character draft per page.

### Continuous display checkpoint v45

View → All sheets adds a continuous editable stack with a fixed left shortcut menu and compact mobile Jump to. It reuses the same live fields/controllers and session, keeps caster/companion/continuation contexts separate, mounts pages on demand, retains invalid/focused drafts, and preserves the existing private save and print paths. Single page remains an alternative with the selected layout retained. The preference is local and scoped per user/character. No global default or rules changed. See [continuous-sheet behavior and tests](adobe-continuous-sheets.md). The remaining native editor bridges and numbered mechanical/layout parity tasks remain open.

## Preview feedback — v46

- Left navigation now lists actual numbered sheet pages, without a second section-shortcut list.
- Native Add pages offers spell, companion and rules pages first, plus original templates. Repeated companions/continuations retain independent data. Blank optional choices persist locally after a successful open and join the connected print output.
- Readable/searchable Adobe pickers replace raw browser menus on source fields and native class/ability/feat dialogs. Race/background lists come from shared catalogues rather than the Standard DOM; names stay short on paper and source details appear in the picker. Source resistance/ammo suggestions, six companion sizes and Cohort/Mount roles are included.
- [All exported nonempty option lists are reviewed](adobe-inventory/dropdown-audit.md); computed fields and unimplemented source overrides are explicitly recorded. This is not full functional parity.
- The user’s self-contained Adobe requirement remains the release target. Origins, full spell/equipment/advanced companion management and the remaining legacy editor bridges still require native replacement. Do not merge #250 as a completed 1:1 version.

### v48 stability follow-up

Navigation reclaims older prefetch views at completion, even for cached destinations. Visible, focused, selected and invalid drafts are retained; the prefetch buffer alone cannot exceed the twelve-view budget. The regression covers a tall viewport with delayed animation frames and checks each completed jump. Keyboard opening/canceling a picker leaves a clean character unchanged. The associated UI build is v48; no rules change.
