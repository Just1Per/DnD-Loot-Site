# Character movement and load — v55

Backlog point 2 in PR #250. Applies to the main character in Adobe and Standard, using the same private model and controls. No Firestore/Storage rule, schema, index, deployment or migration change.

## Calculation and interaction

1. Calculate permanent walking speed, actual class-level bonuses and active item minima with the existing engine.
2. Use final Strength, supported size/build traits and the selected capacity multiplier for carrying limits. Inventory and model share carried quantities, recognized unit weights and optional coin weight (50 coins/lb). Already-scoped entries are deduplicated by ID; attack references do not manufacture extra gear.
3. Standard capacity applies the worn Heavy armor Strength requirement's −10 ft, with the legacy dwarf Speed trait and active, attuned Boots of Striding and Springing exceptions. The optional **2014 variant ignores the armor Strength column**: strictly above five times Strength gives −10 ft; strictly above ten times gives −20 ft and a physical-roll Disadvantage reminder. Size/build and explicit capacity factors scale these thresholds. Active boots prevent slowing, not burden/disadvantage or capacity limits. Revised dwarf has no legacy Speed exception.
4. Apply recognized movement conditions after flat reductions. Grappled, Restrained, Paralyzed, Petrified and Unconscious stop supported speeds. Stunned stops movement in 2014; it does not do so in 2024. Explicit `Exhaustion 2`–`Exhaustion 4` halves legacy speeds (rounded down); level 5 stops movement. Revised Exhaustion subtracts 5 ft per level. Level 6 carries a death reminder in either edition. Zero speed overrides class/item bonuses. Prone and Frightened have movement reminders, not a numerical base-speed penalty.

Adobe: double-click/Enter Speed, or Sheet tools → Movement & carrying. Conditions & movement opens the original private condition field in a modal section over the paper. Separate active canonical names with commas, semicolons or new lines; include an explicit Exhaustion level. Ended/negated notes do not activate conditions. Remove an active name when the condition ends. Save sheet retains the choices/text; private save/reopen and both print paths use the same calculated values. A focused computed Speed stays live when inventory updates; editable field drafts remain protected.

Unknown weights are not zero. Only a penalty established by the known minimum load is applied, and incomplete weight is explained. Standard over-capacity is a warning, not an invented zero/5-ft speed or permission to carry it. Push/drag movement is a separate action not selected here. Recognized magical armor/weapons use physical base weight unless an explicit unit weight overrides it.

## Boundaries

- Other condition effects (d20 penalties, Disadvantage, HP changes and death handling) are reminders. This change does not rewrite manual HP or roll adjustments, determine immunity, end conditions on a rest, or simulate actions.
- Base speed, HP, coins, spell/feature uses and saved equipment remain unchanged by derivation. An edition change reinterprets the retained condition text.
- Temporary forms/companions retain their existing creature movement rules. Class-specific form inheritance is backlog point 5. Remaining section-inclusion flags and containers that alter contents' weight are point 3; a bag does not silently remove weight.
- The original 2014 reference-page artwork remains labelled 2014; it is not a live 2024 rules page.

## Sources and validation

Movement/condition facts were checked against Open5e's SRD 5.1 and revised SRD condition exports, pinned at `e69ac13b49dae6a9d84abf38fc674fe1db5b392b` in `open5e/open5e-api`: `data/v1/wotc-srd/Condition.json` and `data/v2/wizards-of-the-coast/srd-2024/ConditionDescription.json`. Existing [SRD attribution](../rules-attribution.html) applies; website descriptions are original shortened reminders. Optional variant encumbrance is the separately selected 2014 Player's Handbook chapter 7 rule (p. 176), not a 2024 default. The supplied PDF was inspected as reference data; its Acrobat callbacks are not executed.

Pure regressions cover exact load boundaries, fractional/unknown weights, enhanced physical gear, coin inclusion, final Strength/size, Heavy armor/variant replacement, dwarf versions, active/inactive boots, multiclass bonuses, both condition tables and state preservation. The connected browser flow covers real native popups, scoped inventory updates with computed-field focus, both editions, private save/reopen and actual generated source PDFs. Existing Adobe, shared engines, DOM and permission checks remain required.
