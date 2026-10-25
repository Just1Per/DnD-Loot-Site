# Paladin: Lay on Hands

The existing Combat resource panel shows **five healing points per actual Paladin level**. Choose a whole-number amount, then **Spend points** or **Undo points**. The amount stays selected while using the pool; saving and reopening retains spending. Only a Long Rest restores the active edition’s pool.

The compact options disclosure distinguishes editions:

- **2014:** an Action; five points per disease/poison cure; Undead and Constructs are ineligible.
- **2024:** a Bonus Action; five points to remove Poisoned. From Paladin 14, Restoring Touch also permits its listed conditions at five points each.

Cure/condition-removal points do not also heal. Enter their combined cost in the same amount field. Apply healing and condition changes to the actual recipient separately; spending does not silently change the Paladin’s HP, any other character, conditions or spell slots. Print includes the pool, action cost and unlocked options in full. Guide and contextual resource help explain the controls. The amount field uses hover/focus help instead of another question-mark button.

Amounts must be integers from 1 to 100 and fit the available/previously spent points. Invalid and over-budget actions leave saved data unchanged. Fixed-cost resources still accept only their existing one-use changes. Class-level caps prevent a small Paladin multiclass dip from gaining a full-character-level pool; duplicate/unassigned class rows do not grant extra points. Edition changes retain separate counters. Lowering levels preserves recorded spending and never invents available points.

Verification covers levels 1–20 in both editions, multiclass/level changes, finite spending/undo, isolation, recovery and the existing save envelope. Browser checks cover input validity, preserved amount/disclosure state, save/reopen, print, source-specific options, mobile widths and accessibility. Existing Bard/Ranger/Sorcerer resource regressions cover the shared controls.

This is the healing-pool workflow, not a completed Paladin audit: Channel Divinity, auras, smite and oath features still need their own review. Target selection and automatic cross-character healing are outside this change.

Source facts checked against the official [2014 Paladin](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Paladin](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes). Descriptions are concise original summaries.

No Firestore/Storage rule changes, deployment or data migration required. The spent-point counter uses the existing class-feature string-array save envelope; it adds no top-level stored fields.
