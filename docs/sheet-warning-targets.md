# Red character-sheet setup markers

The red `!` is a setup warning, not a save indicator. A filled value can still be invalid (for example, the second copy of a skill or language). The marker must identify the actual invalid choice and explain why.

Previously the completeness checker guessed a field from words in a warning. A missing **Skilled** choice contains “skill”, so it could flag Class Skill Proficiencies instead of the feat. When inactive higher class-skill slots retained old values, the fallback could point at a completed first slot. Other warnings guessed the first empty field, incorrectly blaming a valid first selection when a later filled selection was duplicated.

Rules now attach read-only choice-location metadata where each covered warning is generated. The completeness checker uses those precise selectors for class/race skills and tools, legacy Half-Elf skills, race/background ability choices, standard/background languages, background replacement skills/tools and granted feats/Skilled. Warnings already owned by a feat report stay on that feat card instead of being interpreted again as race/class training warnings. Identical warnings retain their distinct invalid targets; valid choices in the same group stay unmarked. The existing human-readable warning strings remain in place. This metadata is derived only and is never saved.

Markers are applied after all repeating editors finish rendering. Redundant granted-feat rerenders that erased freshly drawn markers are removed. Markers sit beside the label, can receive keyboard focus, and retain the reason in their title and accessible label. Multiple reasons on the same field share one marker. General section notices remain in the setup summary without incorrectly marking an arbitrary child. Fix opens the owning section, focuses an applicable visible choice and shows its explanation in the sheet status.

The earlier removal of the race-size picker also left an impossible “Choose Small or Medium” warning on a new character. An empty size choice now derives the race's legal default (Medium for the current races that offered this choice), while existing Small/Medium choices are retained. Fixed-size races keep their normal size; stored values are not rewritten.

This does not remove real warnings or treat every nonempty value as valid. Correcting the invalid choice clears its marker; duplicate or disallowed selections remain identified.

## Validation

Focused engine regressions cover missing/duplicate/already-trained Human Skilled, background/Human source separation, completed/inactive class slots, precise race/class/legacy skill positions, duplicate filled languages/abilities, background tools/languages/replacement skills and removed-size defaults with preserved choices. Real-browser coverage exercises the original false class marker, corrected Feats markers and Fix navigation, label placement, focused explanations, clearing/correcting choices, duplicate filled fields, save/reopen, combined reasons, responsive layout and accessibility. Existing Feats, guide and print checks remain required.

No Firestore or Storage rules changes, persisted schema changes, production data migration or deployment. The top Guide explains red setup markers.
