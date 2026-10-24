# Level-20 ability features

The class engine now applies the following ability increases from actual class level 20:

| Feature | Edition | Abilities | Increase | Maximum |
| --- | --- | --- | --- | --- |
| Barbarian: Primal Champion | 2014 | Strength and Constitution | +4 each | 24 |
| Barbarian: Primal Champion | 2024 | Strength and Constitution | +4 each | 25 |
| Monk: Body and Mind | 2024 | Dexterity and Wisdom | +4 each | 25 |

The feature source and actual applied amount appear beside the affected abilities. Overview and printed Skills pages show the source, increase and maximum. Guide/contextual help explain the automatic behavior.

In Base mode, the feature runs after valid origin/feat increases and before magic item overrides. Scores already above its maximum are preserved. Derived modifiers, skills, saves, defenses and supported attacks follow the effective scores. Constitution changes flow through automatic HP once, with Primal Champion identified in the HP breakdown. Revised Monk feature DC follows the new Wisdom modifier.

The pure model retains compatibility with older Final totals data: it shows the feature as a reference and does not add it a second time. The current editor uses Base mode; this change does not add a new score-mode switch or alter its existing conversion behavior.

Total character level 20 does not unlock the feature when its actual class level is lower. Duplicate assignments cannot manufacture level 20. Recalculation and save/reopen retain original ability inputs; removing levels or changing edition removes the automatic feature without rewriting personal scores.

Engine tests cover both class progressions through levels 1–20, exact maxima, higher saved scores, Final totals compatibility, saves/checks/AC/HP/DC, multiclass caps, magic item overrides and save-envelope parity. Browser checks cover real ability readouts, source labels, automatic HP, save/reopen, Overview, print, revised Monk AC/DC, compatible reference rendering, source removal, mobile and accessibility.

Sources: [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes), Primal Champion; [2024 Basic Rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), Primal Champion and Body and Mind. Mechanical facts with original interface summaries.

No Firestore/Storage rule changes, deployment or data migration.
