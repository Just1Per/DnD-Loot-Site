# Magic-item attunement and inventory

Library remains the entry point for acquiring magical items. The owned item's existing automatic Magic Items reference remains unchanged.

Changing **Attuned** on a Magic Items circle or in the native item menu now enables automatic inventory references. The first three currently effective attunements fill the original **ATTUNED MAGICAL ITEMS** footer on Equipment. Further slots, including Artificer and revised Thief slots, appear under **ATTUNED MAGICAL ITEMS — CONTINUED** on a generated equipment continuation. The shared character-level/class-level attunement limit determines which saved attunements are currently effective.

The circle is a native checkbox with an item-specific accessible label. Click and Space toggle the same shared equipment choice. Its label has an expanded pointer/touch target while the visible circle retains the source geometry. The checkbox stays above the expanded target, and the target stays above neighbouring text fields. Items that do not require attunement and unavailable entries retain their existing disabled state and explanation.

The automatic footer reads actual carried/owned entries and shared attunement state. Ending attunement, clearing a magic-item row, losing ownership, or reducing the available slots updates the generated list. Names cannot be replaced or hidden through paper-only field overrides. The generated row's existing options dialog exposes **End attunement**; the old manual **Clear reference** behavior is retained for manually arranged legacy footer references. Automatic rows do not offer another manual Copy-to-footer step.

`paperInventory.autoAttuned` is a private boolean inside the existing schema-14 Adobe grant data. It is enabled by an actual attunement change; existing manual layouts keep their prior behavior until then. Footer visibility remains an equipment-layout preference. Turning it off preserves attunement; a subsequent attunement change shows the automatic list again. No Firestore rule, catalogue migration or extra physical item is required.

References preserve item identity, quantity, charges, notes, equipment choices and catalogue records. Physical carried weight counts each owned item once. Automatically mirrored references are excluded from paper column subtotals and Adobe section sums to avoid counting that representation again. Ordinary paper references and the explicit selected-section weight rules retain their existing behavior; enabling the footer moves displaced ordinary gear into Extra Equipment as before.

Validation covers pointer/nearby touch/keyboard toggles, native-menu synchronization, equipped AC effects, three and six slots, rejected extra attunement, continuation visibility, ending attunement from inventory, private save/reopen, ownership/counters/notes, column totals, actual PDF output, mobile accessibility and existing manual footer workflows.
