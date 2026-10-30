# Continuous Adobe sheets

In Adobe preview, choose **View → All sheets**. The character's five main layouts and relevant spell, companion, form, log and continuation sheets appear in one vertical stack. The numbered left buttons represent the actual source sheet pages, in their displayed order. Section-level shortcuts are no longer mixed into the page menu. Each caster and companion retains its own page destination.

On narrow screens, **Page** and **Add pages** replace the side rail. Their sticky position follows the actual site-header height. Clicking a page button or a paper selects that sheet; the menu highlight and Print selected sheet's title identify it. **Print selected sheet** prints that paper. **Print connected pages** includes selected optional pages and the existing complete output and long-text continuations.

**Add pages** is an Adobe-owned modal. Spell sheet, Companion and Player reference are shown first, with the remaining original templates under **Other original pages**. Existing pages open their own saved data. Add another creates a separate companion (up to twelve) or the next valid continuation; it never removes existing content. Spells/companion/rules toggles and creature data use the existing private character save. Blank manual continuation choices are remembered locally for the user/campaign/adventure/character, after the destination has successfully opened. Both live and print plans deduplicate those destinations. An abandoned load cannot persist a page into a reopened character.

Every page edits the existing character draft. The normal **Save sheet** keeps applied edits. View selection is a local user/campaign/adventure/character preference. **Single page** remains available and opens the selected sheet without changing the character.

## Rendering and state

Both displays call the same interactive field/button builder. Connected views own their layout context, continuation offsets, caster/companion selection and control descriptors. They share the session, derived values, field adapters, controllers, validation, save store and permission envelope. There is no second character engine or per-page save record.

Pages mount as they approach the viewport. The source metadata cache is shared; page space is reserved before images arrive, including the selected zoom. Distant mounted views are limited to twelve where possible; focused, invalid or selected views remain mounted. Unmounting removes their authority to edit, and rebuilding reads the current character. Actor/session changes and abandoned loads cannot append a stale page.

Continuations keep stable destination keys, including caster, companion and offset. Print-only explanatory resource/Hit Dice notes are not turned into editable journal copies. Existing full print continuations remain unchanged. Notes options and More notes use the selected continuation's context.

## Verification and scope

The connected browser check exercises real source fields, native class popup, invalid-input focus, Wizard/Pact separation, notes/companion HP, private save/reopen, Standard round-trip, the remembered preference, single-page fallback, both actual PDFs, mobile/axe and header overlap. A 24-sheet case verifies lazy mounting, the twelve-view cap, distinct note-line preferences and native More notes. Closing/reopening while a page request is held verifies abandoned-load cleanup.

This is a display and navigation change. It introduces no Firestore/Storage rules or production migration. The [original dropdown audit](adobe-inventory/dropdown-audit.md) reviews every nonempty exported list and records source/engine differences. Searchable native pickers work on paper and inside the Adobe class/ability/feat dialogs, retaining engine validation and Cancel behavior. Race/background names stay short on paper; edition/source details appear in the picker. Resistance and ammunition suggestions preserve custom typing; original companion sizes and roles are included. The remaining editor bridges and source-function parity work are listed in the [backlog](adobe-sheet-backlog.md) and [function ledger](adobe-inventory/web-bindings.md). Continuous display does not make an unfinished source action complete.
