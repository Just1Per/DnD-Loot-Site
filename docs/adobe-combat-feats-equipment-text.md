# Combat feat reminders and direct equipment edits

Selected, eligible combat feats now appear at the start of the Adobe Limited Features list and add short, source-specific cues to relevant attack descriptions. Clicking a feat row opens its rule cue. Existing paper hide/reorder actions still work; remaining features continue to the overflow page and print notes.

Savage Attacker has one shared turn counter in both editions. The 2014 cue applies to melee weapon damage; the 2024 cue applies to weapon hits. Start my turn resets the same counter used by Combat. Duplicates and unmet feat prerequisites cannot create extra reminders or spendable pools. Martial Adept and Strike of the Giants also use their selected feat's shared allowance and recovery.

The curated cues cover core damage, reroll and extra-attack feats, relevant fighting styles and several supplemental combat feats. Other combat-tagged metadata can show named feature reminders without inferred numerical effects. These are short original cues checked against the pinned feat source (`b9061583536101068b3a59d27e886d1fa664e366`, `data/feats.json`); full source entries are not shipped.

Polearm Master, Great Weapon Master, 2014 Crossbow Expert, Dual Wielder and 2014 Charger expose eligible equipped-weapon Bonus Action references. They can fill free paper attack rows or be chosen under Special attacks. Names and notes state their action cost and conditions. Pole Strike uses 1d4 Bludgeoning; Dual Wielder omits positive ability damage unless Two-Weapon Fighting applies. They do not increase the ordinary Attack-action count or spend any resource on selection. Conditional bonuses such as 2014 −5/+10 and revised Great Weapon Master's Attack-action damage remain explicit cues, because attack timing and targets are table decisions. Crossbow Expert 2024 ignores Loading and includes its Light crossbow extra-attack ability modifier once, including overlap with Two-Weapon Fighting.

On Equipment and Extra Equipment, populated ordinary item name, amount and weight cells are editable directly. Enter or Tab applies the edit; Escape discards typing. Double-click selects text. The existing row arrow opens arrangement, source-selection and other item options. Blank rows use that menu to choose or add an item.

Edits use the existing private paper overrides and stable item keys. Names are sheet labels; physical stock, catalogue records, equipped mechanics and recorded uses retain their values. Amount and unit-weight overrides feed Adobe weight totals. Moved or removed sources cannot silently receive an edit intended for another row. Edits persist with Save sheet and appear in the connected PDF.

Regression coverage includes `tests/character-feat-combat.cjs`, field-adapter assertions, and `tests/adobe-combat-feats-equipment-browser.cjs`: editions, feat eligibility and duplicates, counter recovery, conditional attack formulae, direct text/amount/weight edits, source isolation, moves, stale sessions, save/reopen, mobile accessibility and actual PDF output. Existing gear-row and attack suites remain registered.

## Feat reactions

The source review in [feat-reaction-audit.md](feat-reaction-audit.md) covers all 305 pinned feat entries and classifies all 56 direct reaction/opportunity-attack mentions, plus the revised Mage Slayer negative control. Records distinguish the player's reaction, other actors' reactions, passive changes and source-specific opportunity attacks.

Selected eligible feats populate free Reaction fields on the first page, without replacing or storing copies over manual player notes. Clicking an automatic row opens its concise trigger, costs and current feat allowance. Hide/Restore controls retain the feat and its spent uses; only hidden source keys are stored in `adobe.paperCombat.hiddenReactions`. Further automatic rows appear on the existing combat continuation; remaining reactions and full rule cues are included in print notes.

Sentinel, Polearm Master, legacy Mage Slayer, Orcish Fury, Greater Mark of Sentinel and Zhentarim Tactics provide applicable reaction-attack references. Normal weapon/unarmed calculations are reused, and selecting a reference does not spend a Reaction or feature use. Sentinel 2014 retaliation and Polearm Master 2024 Reactive Strike are explicitly not opportunity attacks. The revised Sentinel trigger is an opportunity attack; Mage Slayer 2024 does not inherit its legacy trigger. Greater Sentinel enhances the existing Guardian reaction rather than granting another reaction or pool.

Reaction-specific feat allowances use the existing saved feat counter and recovery path. Spell slots, Hit Dice, target saves, temporary AC, resistance and healing remain explicit instructions and their existing controls. Other actors' reactions and passive opportunity-attack avoidance never become additional player attacks.
