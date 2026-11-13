# Experience on the first Adobe page

Click the Experience total or the small XP box beside it to open **Experience**. The box indicates whether experience-based leveling is enabled. The dialog contains **Use experience-based leveling**, **Total XP**, **Bonus XP**, and the **Next level XP** threshold.

Bonus XP adds a positive whole amount to the current total, with the existing 1,000,000,000 XP total limit. Use **Add bonus XP** (or Enter) to preview the new total, **Apply XP** to update the sheet draft and **Save sheet** to persist it. Cancel and Escape discard dialog changes. A bonus still waiting to be added cannot be silently discarded by Apply.

When XP reaches a different level, Apply waits for **Choose level N**. The existing class setup then requires class levels to add up to the XP level. Players choose which existing class receives a new level, or add a multiclass; the sheet does not silently give that level to the starting class. Returning to Experience retains the dialog draft. HP, spent resources, gear and companions keep their recorded values.

The paper's small Bonus XP field also supports Enter. Below a level threshold, it adds XP through the existing shared path. At a threshold, it opens the same draft and class-allocation flow before changing the character.

Next level XP uses the total character level, including multiclass levels, for both editions. It also works for milestone characters with no XP recorded: level 4 shows 6,500; level 5 shows 14,000; level 19 shows 355,000; level 20 shows Max. The XP thresholds are cumulative totals. Turning XP leveling off retains recorded XP and the character's current level.

The popup uses the existing session/campaign guards, allocation limits, progression and spent-slot validation. It introduces no new stored character fields. Printing includes recorded total XP and the next threshold while excluding the mode button and unapplied bonus.

Validation: `tests/adobe-front-experience-browser.cjs`, the existing XP/inline-XP suites, progression threshold assertions through levels 1–20, field-adapter tests, and the generated popup inventory.
