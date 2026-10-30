# Continuous Adobe sheets

In Adobe preview, choose **View → All sheets**. The character's five main layouts and relevant spell, companion, form, log and continuation sheets appear in one vertical stack. The left menu jumps to a sheet or a specific section. **Spell slots** focuses the first caster's slot tracker without opening another editor or spending a slot. Caster-specific sheet links remain separate.

On narrow screens, **Jump to** replaces the side rail. Its sticky position follows the actual site-header height. Selecting a shortcut or clicking a paper selects that sheet; the menu highlight and Print selected sheet's title identify it. **Print selected sheet** prints that paper. **Print connected pages** retains the existing complete output and long-text continuations.

Every page edits the existing character draft. The normal **Save sheet** keeps applied edits. View selection is a local user/campaign/adventure/character preference. **Single page** remains available and opens the selected sheet without changing the character.

## Rendering and state

Both displays call the same interactive field/button builder. Connected views own their layout context, continuation offsets, caster/companion selection and control descriptors. They share the session, derived values, field adapters, controllers, validation, save store and permission envelope. There is no second character engine or per-page save record.

Pages mount as they approach the viewport. The source metadata cache is shared; page space is reserved before images arrive, including the selected zoom. Distant mounted views are limited to twelve where possible; focused, invalid or selected views remain mounted. Unmounting removes their authority to edit, and rebuilding reads the current character. Actor/session changes and abandoned loads cannot append a stale page.

Continuations keep stable destination keys, including caster, companion and offset. Print-only explanatory resource/Hit Dice notes are not turned into editable journal copies. Existing full print continuations remain unchanged. Notes options and More notes use the selected continuation's context.

## Verification and scope

The connected browser check exercises real source fields, native class popup, invalid-input focus, Wizard/Pact separation, notes/companion HP, private save/reopen, Standard round-trip, the remembered preference, single-page fallback, both actual PDFs, mobile/axe and header overlap. A 24-sheet case verifies lazy mounting, the twelve-view cap, distinct note-line preferences and native More notes. Closing/reopening while a page request is held verifies abandoned-load cleanup.

This is a display and navigation change. It introduces no Firestore/Storage rules or production migration. The remaining editor bridges and source-function parity work are listed in the [backlog](adobe-sheet-backlog.md) and [function ledger](adobe-inventory/web-bindings.md). Continuous display does not make an unfinished source action complete.
