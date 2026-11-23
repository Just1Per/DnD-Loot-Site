# Rule automation audit

Source revision: `b9061583536101068b3a59d27e886d1fa664e366`. This inventory distinguishes source facts, automatic sheet calculations, explicit counters/choices and table decisions. Counts of structured facts are not counts of fully automated features.

| Inventory | Count |
| --- | ---: |
| Species | 105 |
| Subclass adapters | 186 |
| Missing subclass adapters | 0 |
| Selectable feats | 302 |
| Feats with additional exported mechanics | 89 |
| Feat spell packages with fixed/choice adapters | 51 |
| Feat spell packages with filtered choices | 15 |
| Other feat spell packages requiring review | 31 |
| Spells with numeric damage facts | 394 |
| Spells with numeric area facts | 335 |
| Spells with action damage formulas | 203 |
| Damage references still requiring manual resolution | 184 |
| Pinned item facts | 1253 |
| Base items | 230 |
| Generic item templates, including inherited templates | 230 |
| Item spell bonus records with reviewed scope adapters | 51 |

## Subclass status

All 186 subclasses have an adapter. `partial-mechanics` still denotes table-resolved targets, timing, recipients and duration controls; it does not mean 186 missing implementations. The subclass audit retains this compatibility status and now separately records implementation and its reason.

## Remaining review

- Alternative feat spell packages, expanded class lists, and choices outside the bounded adapter: Abjuration Adept (AU); Boon of Magic School Mastery (AU); Boon of Misty Escape (ABH); Boon of Revelry (FRHoF); Boon of Siberys (EFA); Cartomancer (BMT); Cloying Mists (ABH); Cold Caster (FRHoF); Conjuration Adept (AU); Divination Adept (AU); Divinely Favored (DSotDQ); Emerald Enclave Fledgling (FRHoF); Enchantment Adept (AU); Evocation Adept (AU); Illusion Adept (AU); Initiate of High Sorcery (DSotDQ); Light Bringer (ABH); Magic Connoisseur (AU); Mark of Handling (EFA); Necromancy Adept (AU); Outlands Envoy (SatO); Ritual Caster (PHB); Ritual Caster (XPHB); Rune Shaper (BGG); Scion of the Outer Planes (SatO); Spell Sniper (PHB); Strixhaven Initiate (SCC); Strixhaven Mascot (SCC); Transmutation Adept (AU); Treacherous Allure (ABH); Vampire Touched (ABH).
- Damage without an action formula remains a readable reference; weapon-dependent, multi-stage and conditional formulas must be reviewed individually. Numeric display facts alone do not establish a safe unconditional damage formula.
- Item bonus/immunity records without reviewed scope remain manual: see `itemBonusReview` in the JSON. Metadata may describe an activated aura or conditional power. Netherese Ring of Protection applies its general +1; its +4 disarm protection stays conditional. Stone of Ill Luck stays with the DM.
- Source training alternatives and unrepresented prerequisites remain guided table decisions.

- Targets, recipient HP, positioning, auras, reactions and encounter time.
- Concentration, activated spell buffs, conditional damage, curse state and conditional item powers.
- Source prerequisites without a represented character choice; unknown requirements do not activate new item bonuses.

Generate: `node scripts/audit-rule-automation.cjs`. Verify: `node --test tests/rule-automation-audit.cjs tests/rule-automation.cjs`. The complete shipped inventory is in [JSON](rule-automation-audit.json); no source entries or copied rule prose are included.
