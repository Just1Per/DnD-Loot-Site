# Campaign loot and character equipment

New saves use **schema 7**. Publish the complete `firestore.rules` before saving a sheet. Formats 1–6 remain readable; older clients cannot overwrite version 7. No Functions, migration or catalogue import is required.

## Use on the site

1. The DM edits a **campaign item**, opens **Character sheet equipment**, and selects its base weapon, armor, shield or accessory. Set permanent AC / weapon attack / weapon damage bonuses, attunement and any reminders. Root templates remain under the global admin; changing campaign mechanics does not change the template.
2. Loot/assign using the existing item buttons. The owned card and weapon attack appear in the sheet automatically. Ownership is never copied into editable manual attack rows.
3. In **Equipment & treasure**, select **Equipped / worn**, and **Attuned** when required, then save the sheet. A stack gives one bonus, not one bonus per copy. Three attunement slots are supported. Swapping armor or shields unequips the previous one.
4. The overview lists weapon attack modifiers, damage expressions, range, properties and rule reminders. Abilities and proficiency recalculate as character choices change. Ability/proficiency overrides support features outside the current class engine.
5. Loot, consumption, transfers and unloot update an open sheet through private inventory listeners. DM edits update the permitted item catalogue and private owned snapshots, including hidden items. Closing the sheet or leaving the campaign stops listeners; late callbacks are ignored. No other player's inventory is queried by a player.

## AC

New sheets default to automatic armor / unarmored AC. Existing sheets keep their entered manual base and begin with all equipment unselected.

Automatic mode: armor base plus its Dexterity contribution, or 10 + DEX without armor. Add one shield, active item bonuses, supported Defense, and the explicit Other AC adjustment. Medium armor caps the Dexterity contribution at +2 but retains negative modifiers; heavy armor ignores Dexterity. 2024 shield AC requires shield training. In manual mode the entered base replaces the armor formula, and must exclude equipped shield, item and Defense bonuses. Use that mode for class-based unarmored defense, natural armor, Mage Armor or other alternative formulas.

Example: an accessory with **AC bonus 1** adds exactly 1 while equipped and, if required, attuned. Setting this does not imply saving-throw bonuses or other effects. A shield's AC bonus field is an enhancement **in addition to** its normal +2.

The sheet shows each AC component. Removing the last owned copy or unequipping the item removes its effect without rewriting the base. Inventory entry IDs remain in saved preferences so reacquiring the same campaign item can restore the prior selection; inspect equipment after reacquiring loot.

## Weapons

The bundled factual profiles cover the standard weapon tables, firearms, and the edition-specific Net. Exact standard names (including a trailing +1/+2/+3) can be recognized without DM setup. Homebrew and other magic items need the DM's explicit equipment fields. An explicit “No automatic mechanics” overrides name recognition. Description/property prose never supplies bonuses automatically.

Calculations cover Strength / Dexterity, Finesse choosing the better modifier, class/feat weapon proficiency, magic attack and damage bonuses, normal/thrown range, Reach, Versatile damage, and omission of a positive ability modifier on the extra Light-weapon attack. 2024 Archery adds to ranged weapon attacks, not thrown melee weapons. Supported 2024 Defense uses actual worn armor in automatic AC mode. Trident, Lance, War Pick and Net respect their selected edition. Mastery is displayed as a reminder; it is not automatically unlocked.

Attack/damage expressions are displayed, not rolled. Ammunition/charges, target conditions, mastery effects, critical hits, special on-hit effects, fighting-style damage exceptions and complete combat action resolution remain manual. Loading, Heavy, shield/two-hand conflicts, armor training, Stealth and strength restrictions produce reminders; speed penalties and spellcasting restrictions are not enforced automatically. Multiple equipped weapons represent ready alternatives, not permission to attack with all of them simultaneously. Attunement prerequisites beyond the three-slot limit still need player/DM review. Custom always-on damage is an expression displayed on the attack, not code.

## Data and isolation

- Campaign item `mechanics`: versioned structured metadata; writable only by the campaign DM through existing campaign-item rules. Root item metadata follows existing root admin permissions.
- Private sheet `equipmentState`: AC mode/adjustment and at most 200 inventory selection records. Item statistics and quantities are resolved from authorized inventory/catalogue data, not sheet preferences.
- DM item saves preserve mechanics on copy and loot. After saving the item, per-record transactions refresh owned snapshots while retaining current ownership/quantity; they cannot recreate a consumed/unlooted record. Partial refresh failure is reported and can be retried by reopening and saving the item. No bulk live database migration is run by this change.
- Sheet ownership and DM access remain unchanged; global admins gain no campaign access.

## Sources and checks

Weapon/armor statistics and edition distinctions were checked against the official [2024 equipment rules](https://www.dndbeyond.com/sources/dnd/br-2024/equipment) and [2014 equipment rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment). Profiles contain factual names, dice, properties and numeric statistics, with original UI reminders. Existing SRD attribution is in `rules-attribution.html`.

Validation: calculation tests cover removal, zero quantity, repeated derivation, duplicate rows, attunement, shield training, armor formulas, weapon modes, edition differences and manual AC compatibility. DOM checks exercise equip/save/reopen, live loot changes, DM edits, access loss, listener cleanup and editor permissions. Firestore emulator tests exercise schema protection and actual root-copy → campaign-edit → player-loot → hidden-item-update → DM-unloot, including player/admin write denial. No production records were modified during these tests.
