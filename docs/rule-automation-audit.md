# Rule automation audit

Source revision: `b9061583536101068b3a59d27e886d1fa664e366`. This inventory distinguishes source facts, automatic sheet calculations, explicit counters/choices and table decisions. Counts of structured facts are not counts of fully automated features.

| Inventory | Count |
| --- | ---: |
| Species | 105 |
| Species with reviewed non-spell resource adapters | 22 |
| Reviewed non-spell species counters | 34 |
| Explicit temporary species effect adapters | 6 |
| Subclass adapters | 186 |
| Missing subclass adapters | 0 |
| Selectable feats | 302 |
| Feats with additional exported mechanics | 119 |
| Feats with fixed/choice spell adapters | 82 |
| Feats with filtered spell choices | 29 |
| Other feat spell grants requiring review | 0 |
| Feat expanded class-list adapters | 12 |
| Supplement spell class-list corrections | 122 |
| Spells with numeric damage facts | 394 |
| Spells with numeric area facts | 335 |
| Spells with action damage formulas | 271 |
| Damage references still requiring manual resolution | 116 |
| Pinned item facts | 1253 |
| Base items | 230 |
| Generic item templates, including inherited templates | 230 |
| Item spell bonus records with reviewed scope adapters | 60 |
| Item save/check bonus records with reviewed scope adapters | 17 |
| Item immunity records with reviewed passive adapters | 5 |

## Subclass status

All 186 subclasses have an adapter. `partial-mechanics` still denotes table-resolved targets, timing, recipients and duration controls; it does not mean 186 missing implementations. The subclass audit retains this compatibility status and now separately records implementation and its reason.

## Remaining review

- Alternative feat spell packages, expanded class lists, and choices outside the bounded adapter: All spell-grant groups identified by this inventory have an adapter, including dedicated conditional transformations.
- Expanded spell tables add class-list choices rather than free prepared spells: Mark of Detection (EFA); Mark of Finding (EFA); Mark of Handling (EFA); Mark of Healing (EFA); Mark of Hospitality (EFA); Mark of Making (EFA); Mark of Passage (EFA); Mark of Scribing (EFA); Mark of Sentinel (EFA); Mark of Shadow (EFA); Mark of Storm (EFA); Mark of Warding (EFA). They extend actual Spellcasting/Pact Magic class lists, retain each class’s learning/preparation limits and spell-level reach, and grant no free preparation; fixed free-casting grants are audited separately.
- Damage without an action formula remains a readable reference; weapon-dependent, multi-stage and conditional formulas must be reviewed individually. Numeric display facts alone do not establish a safe unconditional damage formula.
- Item bonus/immunity records without reviewed scope remain manual: see `itemBonusReview` in the JSON. Metadata may describe an activated aura or conditional power. Netherese Ring of Protection applies its general +1; its +4 disarm protection stays conditional. Stone of Ill Luck stays with the DM.
- Source training alternatives and unrepresented prerequisites remain guided table decisions.

- Targets, recipient HP, positioning, auras, reactions and encounter time.
- Concentration, activated spell buffs, conditional damage, curse state and conditional item powers.
- Spell-grant abilities omitted by the pinned feature require an explicit player/DM choice. Conditional school triggers, Hit Dice, temporary HP/healing, card preparation/expiry and mascot positions/daily actions are resolved explicitly.
- Source prerequisites without a represented character choice; unknown requirements do not activate new item bonuses.

Generate: `node scripts/audit-rule-automation.cjs`. Verify: `node --test tests/rule-automation-audit.cjs tests/rule-automation.cjs`. The complete shipped inventory is in [JSON](rule-automation-audit.json); no source entries or copied rule prose are included.
