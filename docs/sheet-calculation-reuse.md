# Reuse sheet calculations for spell row labels

Each `updateSheetCalculations()` already derives current character stats and passes them to the play UI. The spellcasting UI previously derived them again to decorate manual spell rows with class names and preparation controls. Pass the existing result to that synchronous step instead. Standalone row rendering retains its fallback calculation.

A controlled Chromium fixture counted three full `CharacterSheetModel.derive()` calls per unchanged refresh before this adjustment and two afterward. The independent catalogue calculation remains separate, preserving its current treatment of equipment and feat eligibility. Changed ability scores also refresh feat search and use three calls in the regression fixture. All updates remain synchronous; no debouncing, long-lived stats cache or stale-result reuse is introduced. This count reduction is not a production latency measurement.

`test:sheet-calculation-reuse` covers direct refreshes, real input/change events, immediate Intelligence/Wisdom readouts, separate Wizard/Cleric spell labels, standalone row fallback and save/reopen. Existing spellcasting, form and character workspace tests also pass. No Firebase rules, data migration or deployment is required.
