# Point Buy starting spreads

Standard Point Buy has 27 points. The pre-bonus scores range from 8 through 15; costs are 0, 1, 2, 3, 4, 5, 7 and 9 respectively. Spending fewer than 27 is allowed. Race/background and feat increases are applied after these base scores and do not consume points. Standard Array and Point Buy remain different creation methods, but the standard array is also a legal 27-point purchase.

The existing calculator and input bounds match that table. Three starting spreads are available on Abilities & Skills when Point Buy is selected:

| Spread | Base scores in STR, DEX, CON, INT, WIS, CHA order | Cost |
| --- | --- | --- |
| Three strong scores | 15, 15, 15, 8, 8, 8 | 27 |
| Standard array | 15, 14, 13, 12, 10, 8 | 27 |
| Balanced spread | 14, 14, 14, 10, 10, 10 | 27 |

Choosing a spread previews it; **Apply spread** replaces the six base scores. The order is explicit, so players can use the two ability selectors and **Swap scores** to assign strong scores to the abilities their character needs without recalculating cost. Existing race/background, feat and advancement choices are retained. Save the sheet to persist the new scores. The reset-to-8 action remains available. Manual/rolled mode hides these controls.

Validation covers every cost, range/fraction rejection, overspending, all presets, score permutations and race bonuses remaining outside Point Buy. Browser checks cover apply/swap/reset, same-ability feedback, save/reopen and desktop/390/320px layouts.

No Firestore or Storage rule changes, production migration or deployment are required.
