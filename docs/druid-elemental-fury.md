# Druid: Elemental Fury

Under **2024 rules**, actual Druid level 7 unlocks **Elemental Fury** in Character Builder. Choose one option in the existing class-feature selector; saving retains the choice in the current class-choice map. The 2014 base class does not gain this feature. Changing editions or lowering assigned levels preserves saved choices while making unavailable effects inactive.

- **Potent Spellcasting:** the current effective Wisdom modifier is added to supported damaging Druid cantrips. Zero and negative modifiers are respected. Guidance/Resistance check dice and Shillelagh’s weapon enchantment are not treated as direct cantrip damage. At actual Druid 15, eligible cantrip ranges of at least 10 feet increase **by 300 feet**. Nondamaging ranged cantrips qualify too; Touch, Self and 5-foot spell ranges are unchanged.
- **Primal Strike:** Combat, qualifying saved weapon actions and the active Beast-form card show the optional once-on-your-own-turn hit reminder, with 1d8 changing to 2d8 at Druid 15. Choose Cold, Fire, Lightning or Thunder when the hit happens. The app does not roll this extra die, select a target, apply target HP damage or enforce a turn counter. It is deliberately not permanently added to every hit. Unarmed actions, ordinary spell attacks, the revised Net save and non-Beast legacy elemental forms do not gain that action reminder.

The selected option and its current formula also appear in Overview and print. Guide and inline hover/focus help explain the choice; there is one section help badge, rather than a question mark for each field. The compact selector keeps a 44px touch target.

## Spell ownership and ranges

Druid and Warlock copies of the same named cantrip retain their own class bonuses and ranges. Druid modifiers use a separate per-class map, leaving the existing invocation map compatible. An action with an ambiguous casting source is prompted to choose its class instead of combining bonuses. Class levels are capped by the total character level; duplicate or inactive saved entries cannot unlock the feature.

The revised **Spare the Dying** range also follows its own character-level doubling before the Druid-level range extension. At character level 17 with Druid 15, its 120-foot range becomes 420 feet. Its 2014 Touch version is unchanged. Explicit manual spell-row range overrides remain preserved outside an active computed modifier. Other conditional spell text and weapon-dependent damage remain governed by the existing supported catalogue mechanics.

The normal sheet remains the normal-character reference while Wild Shape is active. The own-form card uses its current retained Wisdom and shows the appropriate class reminder; this does not add a global form overlay to every spell page. Circle features and slot conversions remain separate work.

## Validation and persistence

Engine coverage spans Druid levels 1–20, both core editions, Wisdom changes, shared Druid/Warlock cantrips and overlapping range modifiers, non-damage check dice, class caps/duplicates, source changes, save-envelope round trips, weapon reminders and Beast-versus-elemental forms. Real browser checks cover selection, live spell/action readouts, save/reopen, print, mobile sizing, inline help and accessibility. Existing Warlock invocation behavior remains covered by its regressions.

**Firestore and Storage rules are unchanged.** Only an existing string-array class-choice entry is saved; all modifier/readout data is derived. No new top-level character fields, migrations or production deployments are involved.

Source: [Druid, 2024 Basic Rules / SRD 5.2.1](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), Elemental Fury and Improved Elemental Fury. This is a scoped improvement, not completion of the entire Druid/circle audit.
