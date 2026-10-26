# Cleric Divine Intervention

Combat now has a compact Divine Intervention card from actual Cleric level 10. Its status and last recorded result remain visible; the action and detailed rules expand separately. Read spell information before recording a modern cast. The top Guide, contextual label help, Overview and printable Combat page explain the feature and its recovery.

## 2024

Choose a campaign-approved 2024 Cleric spell from cantrip through level 5, excluding spells with Reaction casting. Preparation is not required. Confirm the Magic action and select **Cast with Divine Intervention**. This records the feature use without changing ordinary, Pact Magic or created spell slots, known/prepared spells, HP or another character’s sheet. The spell is cast as part of that Magic action without Material components. Remaining spell requirements, concentration, targets and effects are resolved at the table.

At actual Cleric 20 the selector also includes Wish. Roll 2d4 at the table and enter its integer total, 2–8. The whole feature remains unavailable until that many Long Rests have been recorded. This is independent of Wish’s own effects, stress and consequences; the sheet does not waive or apply those automatically.

Use one existing Long Rest recovery action when a rest actually finishes. Combat feature recovery, catalogue Long Rest and Spells’ Long Rest slot reset each advance the countdown exactly once per activation. These existing actions restore their respective resources; do not click multiple rest actions for the same rest. Short Rest and initiative do not advance this wait. The full catalogue reset’s label/confirmation now accurately mentions tracked features as well as slots.

## 2014

Describe the requested help to the DM, confirm your action and enter the percentile result from 1 to 100. On percentile dice, 00 is 100. A result no greater than actual Cleric level succeeds. At Cleric 20 no roll is required and success is automatic. The DM determines the intervention itself.

A failed attempt becomes available after a Long Rest. Success instead starts a seven-campaign-day wait. Confirm and record **one completed campaign day** only when that day has elapsed in the game. Long Rests do not decrement this day-based wait. No wall-clock date or assumption of one rest per day is used.

## Persistence, access and scope

Each edition has its own `classFeatureChoices` string-array ledger, inside the existing Adobe save envelope. Class/source removal or level reduction retains records. Long Rest recovery advances a retained rest-based record even if the class/source is temporarily inactive; it never erases a successful legacy day-based wait. New uses require actual eligible class levels capped by character level. Full maps fail atomically when adding a record would exceed the existing 100-key limit. Invalid cooldown records block use rather than pretending the feature is ready.

UI handlers recheck the active actor, campaign/account and current rules before changing the sheet. Save uses the existing revision-checked private character store. This is partial automation: the player records actions, dice and elapsed campaign time, and the table resolves divine/spell effects. There is no automated recipient edit, spell resolution or claim of complete Cleric/domain support.

Engine tests cover both editions at levels 1–20, multiclass caps, valid/invalid spells, acknowledgement, percentile boundaries, Wish totals, independent recovery, source changes, persistence, capacity and malformed records. Browser checks cover spell information, normal/Pact slot preservation, recovery entry points, legacy days, stale account protection, save/reopen, print, 320/390/1440 layouts and accessibility. Firebase emulator checks use the actual store to save/reload both ledgers, permit owner/DM edits and deny unrelated users.

**Firebase:** no Firestore or Storage rule changes. No migration, production data write or deployment.

Primary rules checked 26 October 2026:
- [D&D Beyond Basic Rules 2024 — Cleric levels 10 and 20](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)
- [D&D Beyond Basic Rules 2014 — Cleric Divine Intervention](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes)

No new house rule is introduced.
