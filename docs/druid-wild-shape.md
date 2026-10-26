# Druid: own Wild Shape under Companions

Druids gain a dedicated Wild Shape panel at the top of **Companions** from actual Druid level 2. **Choose form in Companions** in Combat opens that optional page. Existing companion, familiar and manually prepared Wild Shape cards remain below and are not migrated or replaced.

Choose an eligible form and **Assume selected form**. The active card shows form scores, AC, initiative, walking speed, printed movement/senses, supported saves/skills and source actions/traits. Mental scores and supported character training are retained. Passive Perception uses the form’s resulting skill total, and supported class senses such as Devil’s Sight remain visible. The main sheet remains the normal-character reference: use this separate card for form rolls. Returning to normal form never refunds a use. Save the sheet to retain form state, known/seen choices, HP and spending. Guide and hover/focus help explain the workflow without question-mark badges on every field.

## Source rules

| Rule | 2014 | 2024 |
| --- | --- | --- |
| Selection | Eligible animals the character has seen; confirmation and recent history | Known forms: 4, then 6 at Druid 4, 8 at Druid 8 |
| Base CR | 1/4; 1/2 at Druid 4; 1 at Druid 8 | Same base thresholds |
| Movement | No swim until Druid 4; no fly until Druid 8 | Swimming allowed; no fly until Druid 8 |
| Action | Action; legacy Moon uses Bonus Action | Bonus Action |
| Duration | Half Druid level, rounded down, in hours | Half Druid level in hours, rounded down |
| HP | Separate form HP; temporary HP first; only excess damage passes to preserved normal HP on reversion | Character HP retained; gain Druid-level temporary HP with explicit keep/replace/higher choice; never stack |
| Uses | 2, Short/Long Rest recovery; unlimited at Druid 20 | 2; 3 at Druid 6; 4 at Druid 17; Short Rest regains 1, Long Rest all; Druid 20 initiative regains 1 only if empty |
| Interruption | Recorded Unconscious | Recorded Incapacitated, or Stunned/Paralyzed/Petrified/Unconscious |

Condition recognition uses canonical names separated by commas, semicolons, pipes or newlines, optionally with a trailing parenthetical. Free-text negations are not treated as positive conditions. An explicit Dead record also ends either form. HP 0 does not invent unconsciousness because exceptional features can allow consciousness at zero. Record the resolved condition explicitly; interruption clears the active state permanently rather than hiding and later resurrecting it. Duration is a game-time reminder, not a real-time timer. Half-level duration rounds down in both editions under the general [Round Down rule](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game); odd modern levels therefore do not produce fractional hours.

2024 known forms can be edited when granted or replaced after a Long Rest according to the source; the UI explains that limit rather than forcing a session/day clock. Stored choices above a temporarily lowered level remain saved and inactive; they can be cleared. Printed Beast attack bonuses are not blindly rebased to character proficiency. Supported changes to physical ability modifiers adjust matching printed attack/hit damage; conditional effects and printed save DCs remain table-resolved.

## Equipment and multiclassing

Normal scores, inventory, equipped-item choices and existing companion records remain canonical. **Merged** and **Dropped** omit worn item effects. **Wear current loadout** applies supported item ability/AC/speed effects; the DM must approve the form’s anatomy and item fit. This is the current complete loadout, not a second per-item equipment editor. Available Monk/Barbarian Unarmored Defense formulas are alternatives rather than additions, using the first acquired feature. Supported retained saves, Expertise and own Paladin aura use actual capped multiclass levels.

Legacy Moon supports its CR/action thresholds, magical-attack reminder and four level-10 elemental exceptions costing two uses. Revised Moon supports expanded CR, the AC alternative, triple-Druid temporary HP, level-6 Constitution-save bonus and Radiant-damage reminder, plus the level-14 damage reminder. These are scoped Moon adjustments, not a completed audit of all circle features.

**Other features using this pool** spends a use for an independently resolved unlocked feature. It does not conjure a familiar, restore/create slots, heal or execute that feature. Undo applies only to the latest other-feature spend; transformations and intervening rests cannot be refunded through it. Generic resource Use/Undo controls are deliberately unavailable for this managed pool.

The explicit [Wild Resurgence recovery](druid-wild-resurgence.md) control in Combat can now spend a spell slot to regain one use when empty, once on an acknowledged own turn. This is distinct from the generic other-feature spend/correction controls.

## Loading, persistence and permissions

A reproducibly generated, attributed subset of the pinned local SRD monster catalogue contains 170 Beasts and 4 legacy elementals. It loads on opening Companions or resuming a saved active form, not during ordinary login/sheet startup. Search is restricted to eligible source records. Failed requests expose Retry, and a saved form can always be ended even if the catalogue is unavailable. Catalogue loading never writes to a saved character.

State uses the existing normalized string-array `classFeatureChoices` map in the Adobe save envelope. There are no new top-level Firestore fields or Storage objects. **Firestore and Storage rules are unchanged; no publication, migration or production deployment is required for this change.** Real emulator coverage verifies owner persistence and rejects another player’s reads/writes for both sources.

## Remaining Druid work

This does not claim complete Druid or subclass automation. [Wild Companion](druid-wild-companion.md) now has its own familiar card and lifecycle. [Wild Resurgence and Nature Magician slot creation](druid-created-slots.md) now use a separate extra-slot pool with the agreed Long Rest expiry. Other circles, optional-feature replacement, detailed worn-item anatomy, conditional weapon effects, form hit-die spending, exhaustion/condition effects on rolls and a global form overlay for other sheet pages remain separate work. Beast Spells currently appears as a source-specific reminder, with spell-component exceptions resolved at the table. Normal HP, manual companion cards and existing sheet workflows remain intact.

Sources: [2014 Druid](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), [2024 Druid](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [2024 Moon changes](https://www.dndbeyond.com/posts/1755-the-2024-circle-of-the-moon-druid-and-changes-to). Creature attribution remains in the generated catalogue and is displayed/printed on the active card. Rebuild locally with `node scripts/build-wild-shape-catalogue.cjs`.
