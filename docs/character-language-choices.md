# Character language choices

**Character Builder → Rules & character → Languages** now includes an **Additional learned languages** selector. Its Standard, Rare and Setting/dialect groups expose the existing catalogue beyond the 2024 starting-language list: Abyssal, Celestial, Deep Speech, Infernal, Primordial, Sylvan, Undercommon, the Primordial dialects and setting languages are available when granted by another feature, training or the DM.

Select a language and choose **Add language**. Learned entries appear as compact removable chips, on Overview and in print. Already-known or already-added choices cannot be added again. Removing a learned entry does not remove an automatic class, race or starting language. **Custom languages & saved text** preserves earlier free text and allows table-specific entries. Typing does not rebuild the field on each keystroke.

The two revised starting-language fields remain limited to the Standard Languages table. The existing 2024 list already correctly includes Draconic and Common Sign Language. Abyssal is a Rare language, so adding it to that default list would silently change character-creation rules. The new learned-language selector records a separately granted language; it does not award extra starting choices. Druidic and Thieves’ Cant normally come from class features; custom text remains available for DM-approved exceptions.

## Revised Rogue feature

Actual **2024 Rogue 1**, including a multiclass level, grants Thieves’ Cant and **one** additional language from the Standard or Rare tables. A separate, source-labelled selector now records that choice. It accepts legal Rare-table options, including Druidic where the feature allows it, while rejecting languages already known. Missing/invalid choices point to this exact field, and correcting the choice clears its marker. The legacy Rogue gains the fixed Thieves’ Cant language without the revised extra choice.

The Rogue choice lives in the existing `2024:rogue:languages` string-array record. Class or edition removal retains the saved value without keeping an unavailable benefit active. A full class-choice map rejects an added record atomically. Learned entries use the existing `languages` text field, retain custom text and respect its 12,000-character limit. No new saved field or schema is introduced.

## Help, print and validation

The top Guide, section help and label explanations describe starting versus learned languages and the Rogue feature. Overview and the printable Builder show derived and learned/custom languages. UI actions verify the active actor/campaign/account before changing a sheet.

Seven focused engine cases cover option groups, duplicate/fixed/secret handling, text preservation and capacity, both editions at levels 1–20, capped multiclass eligibility, saved envelopes, source changes, exact issue targets and no mutation during derivation. Real-browser coverage exercises add/remove, custom typing, save/reopen, source changes, the revised Rogue selector, help, print, stale-account protection, mobile layouts and accessibility. Firebase emulator checks save both existing text and the source choice through the actual revision-checked store, allow the character owner/DM and deny unrelated users.

**Firebase:** no Firestore or Storage rules, migration, production catalogue write or deployment.

Primary rules checked 26 October 2026:
- [Creating a Character — Standard and Rare Languages](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character)
- [2024 Rogue — Thieves’ Cant](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)
