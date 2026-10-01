# Ability scores and point buy

Abilities & skills contains the score method selector, the existing base/final input mode, the entered-score sum and final-score sum. Point buy is optional and preserved on the private sheet as `build.scoreMethod` under schema 11; existing rules already permit it.

Point buy uses the standard 27-point budget and costs 0,1,2,3,4,5,7,9 for base scores 8 through 15. It excludes species/background and feat bonuses. Scores outside the range and overspending produce warnings, not silent changes or blocked saves. In Final totals mode the budget is unavailable because the original base scores cannot be recovered reliably.

Each ability shows the base score, edition-appropriate race/background source, and named feat/ASI increases. The displayed gains come from the calculation engine and show actual capped amounts. Final totals mode labels source bonuses as reference-only to avoid double counting. Class ASIs appear when selected through Feats; increases already entered into base scores and unsupported class features cannot be separately attributed.

Overview retains final scores and modifiers, with six decorative line icons: flexed arm, feather, heart, book, eye and star. Detailed budgets and sources stay in Abilities & skills. Icons are hidden from assistive technology and use small absolute positions in print so they do not expand the printed ability column.

Inventory keeps pack previews and owned loot, but no longer contains Refresh campaign loot or Claim/assign controls. Existing Library and DM assignment flows and the live inventory subscription remain.

Point-buy reference: https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character
