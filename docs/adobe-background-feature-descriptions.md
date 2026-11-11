# Adobe background feature descriptions

The Background Feature box uses short original summaries, rather than a source-only placeholder.

- **2014 backgrounds:** show the selected narrative feature and its summary. Source/page metadata remains available on the feature option and in the projected reference.
- **2024 backgrounds:** show the background’s granted feat and explain the edition difference. PHB feats include a concise benefit summary. Supplement feats without a local summary show the actual feat name and where to configure its choices. Backgrounds with multiple eligible feats show the choices until a valid one is selected.
- Explicitly edited descriptions, including intentionally empty text, take priority. They stay associated with their background, survive saving, and print through the existing connected-page system.
- These descriptions do not grant proficiencies, feats, HP or resources. Existing background/feat rules continue to handle those effects. Automatic 2024 feat text does not add a second narrative trait.

No full source entries or source prose are included. Factual background/feat names, editions and source references come from the existing background catalogues. Custom/manual features and saved legacy choices remain supported.

Validation: `tests/character-background-features.cjs` checks catalogue-wide nonempty defaults, edition-specific content, eligible feat choices, preserved writing and unchanged grants. `tests/adobe-background-feature-weight-browser.cjs` checks real sheet fields, edits, save/reopen, mobile accessibility and generated PDFs for both editions.
