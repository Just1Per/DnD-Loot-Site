# Bard subclass mechanics

Source review: pinned 5etools `b9061583536101068b3a59d27e886d1fa664e366`, `class/class-bard.json`. All eight selectable legacy colleges and six revised colleges are included, including both Spirits printings and College of the Moon. Shipped descriptions are original short mechanical summaries.

Implemented:

- Actual Bard levels gate features, Inspiration dice, Psychic Blades, creation value/size, and mantle scaling; character level supplies proficiency-based durations, save DCs and Spirit Session participant limits.
- Lore skill choices and extra spells; Moon Druidic, skill/cantrip choice and Moonbeam; edition-specific Glamour grants; both Guidance grants with 60-ft range; revised Spirits' Spirit Guardians.
- Valor/Swords weapon/armor training and Swords Fighting Style use existing proficiency/style calculations. Extra Attack remains in the existing attack-count engine.
- Dance unarmored AC and Dexterity/Bardic unarmed damage require no armor or shield. Eloquence exposes minimum check totals without adding a false +10 to every roll.
- Subclass actions spend the same Inspiration pool as ordinary Inspiration. Revised Peerless Skill spends only when the revised result succeeds. Level-14 Master's Flourish/Lunar Vitality can use their free d6. Flourishes enforce one per turn and Defensive Flourish adds temporary AC until next turn.
- Separate rest counters cover Glamour, Creation, Eloquence, Whispers, Moon and Spirits. Eligible Inspiration/ordinary/Pact slot payments either restore a feature or pay for an alternate use without conflating the free counter with the spell-slot pool.
- Both twelve-result spirit/tale tables have separate original summaries, shared-pool channeling, one held result, explicit release and rest expiry. Mystical Connection doubles can select a result above the normal die maximum.
- Legacy Spirit Session checks spell school, reachable spell level, participant count/proficiency and activation; the temporary grant expires on Long Rest.

Table decisions remain explicit: targets, hearing/visibility, action/reaction eligibility, hit or save outcomes, valid spell-focus use, ally temporary HP/movement/conditions, created objects, and Dancing Item commands. These do not permanently change unrelated rolls or another character's sheet. Counters and computed self effects are automated; this is not a claim that the sheet runs an entire combat encounter.

Tests: `tests/bard-subclasses.cjs`, shared Inspiration, spellcasting, style, attack and resource regressions, plus the Bard browser fixture covering subclass actions, temporary AC, turn reset, spirit release and the existing save/reopen/accessibility flow.
