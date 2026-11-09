# Wizard tradition mechanics

All eighteen traditions were reviewed through level 20 against pinned `class/class-wizard.json`, revision `b9061583536101068b3a59d27e886d1fa664e366`. The canonical feature reference selects Tasha’s Bladesinging revision for the legacy selectable entry.

Arcane Ward has separate bounded HP, once-per-Long-Rest creation, casting refill, absorption and revised paid-slot refill. Divination records individual d20 Portents, consumes them once per turn and discards old rolls at Long Rest; Expert Divination validates recovered slots. Evocation adds INT to one Wizard Evocation damage roll and pays/records escalating Overchannel recoil. Illusion has source-specific cantrip, summon and duplicate counters. Bladesong validates armor/shields, applies AC/speed/Concentration and revised INT weapons or legacy damage; Arcane Recovery restores one revised use. Chronurgy/Graviturgy have actual resources, Initiative and self density. War Magic tracks held surges and explicit Concentration state. Transmuter stones apply only to their actual holder and stop on consumption. Necromancy has healing and defense. Conjuration has recoverable transposition. Enchantment’s per-target effects have short table instructions.

Scribes has rituals, spectral mind/remote casts, scroll and damage-negation counters. Selected lost book spells block attack references until their individual rolled Long Rest countdowns expire, including while the subclass is removed. Revised Savant and legacy added book spells enter spell-selection drafts unprepared, separate from automatic prepared grants.

Targets, summons, illusion geometry, spell eligibility, per-target charm locks and time/Concentration boundaries remain table decisions. Explicit activation/end controls apply self states; the audit retains partial-mechanics status for those boundaries.

Regression tests cover every edition/level, Ward transactions, Portent, slot recovery, Bladesong, Overchannel, surges, stone consumption and Scribes loss/recovery. Browser coverage checks separate Ward creation/absorption.
