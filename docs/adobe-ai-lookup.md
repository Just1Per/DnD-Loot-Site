# AI Lookup on the Adobe character sheet

The original automatic book-button decoration scans the document body and legacy catalogue selectors. The Adobe paper lives in a shadow root, while native spell and feat dialogs use different selectors. Those controls therefore lacked a lookup entry point even though the shared provider dialog still worked.

The current sheet provides:

- A book beside the magnifier/printer controls on every connected page, plus **Show extra features → Table tools → AI Lookup**. This opens a manual lookup with the character’s edition and a spell or rule/feature type.
- Source-filled books in the class spell preview, readable spell list, additional-spell catalogue preview and individual spell-information dialog.
- Books beside native feat information controls, the selected subclass and owned-item information. A subclass must be selected before its book is enabled.

All paths reuse `AiLookup.open`, its existing Firebase AI Logic configuration and Google Search fallback. Explicit `button` and `reference` helpers pass name, type, edition, book and optional level/page metadata. Personal notes, descriptions, ability scores, resources and character identity are not added to the prompt. The rule/feature type supports manual references beyond spells, feats, items, subclasses and creatures.

Opening a book fills the dialog only. **Search with Gemini** explicitly submits a request. Plain-text results, safe source links, sandboxed search suggestions, the existing cooldown and actionable configuration/quota/billing messages remain in use. Results are not persisted to character, catalogue or campaign records.

The underlying editor stays open, preserving its draft; closing lookup returns focus to the book. Native entry points have current-session guards. Closing the character invalidates its pending lookup, and responses from a closed/replaced lookup or changed account cannot populate another session. Reopening the shared dialog invalidates the previous request synchronously rather than relying on a delayed close event.

`tests/adobe-ai-lookup-browser.cjs` uses a stubbed provider to exercise the production module order, the paper book and native spell/reader/additional/feat/subclass/item books, source-prefill, explicit requests, withheld personal notes, unchanged character state, fallback/error states, keyboard focus, 320/390px layouts, axe and stale-request cleanup. It is part of the connected Adobe suite. Existing Library/legacy lookup tests remain unchanged. This UI change does not enable or reconfigure the external service and requires no database migration or rules deployment.
