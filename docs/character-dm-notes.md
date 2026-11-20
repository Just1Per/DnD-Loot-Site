# Private DM notes on character sheets — v95

The connected Adobe sheet has a **DM notes** panel on its right at desktop widths of at least 1280px. At narrower widths it sits above the sheets as a collapsible section. It remains with the character while navigating paper pages. Notes are plain text with a 6,000-character limit and use the normal **Save sheet** transaction; they are not autosaved or added to the printed sheet.

Only campaign owners/DMs can edit. For a one-shot, its approved host is also its scoped DM. The assigned active player can read the saved text and keep editing their own character journal, but cannot change the DM text. Other players, outsiders and site admins without the campaign/character role cannot read the private sheet. Current roster ownership determines access; it is not a second independently maintained sharing list.

Storage is the optional string `data.dmNotes` in the existing private `characterSheets/{characterId}` document, including the existing one-shot namespace. Nothing is stored in the public character roster, campaign notes, localStorage, Library or AI Lookup. Existing schema 14, bounded normalization, identity/revision checks and backup behavior remain. Old sheets normalize to empty notes without migration.

Firestore validates the text type/length and protects it on both initial creation and update. Normal player saves must preserve the current DM text; omitting or clearing a saved note is rejected. Deleting just a private sheet with nonempty DM notes is also DM-only. Existing player character archiving remains unchanged. The standard stale-revision guard retains drafts instead of overwriting another editor’s changes; reopen the sheet to read later changes from another window. This is not a real-time collaborative editor.

A note typed during an in-flight save remains unsaved after the earlier text is persisted. Failed saves keep the local draft and show the normal error in the panel. Character/account switching and disposal invalidate old controls; role loss removes the sidebar content. The guide describes the panel separately from the player’s own journal.

## Deployment

Publish the PR’s **firestore.rules** before relying on server-enforced DM authorship. The existing merge workflow deploys Hosting only; it does not publish database rules. Hosting previews use their configured Firebase project’s deployed rules. Tests use a demo emulator, not production. There is no data migration, new collection, Storage change or new dependency.

From an authenticated maintainer checkout, the rules-only deployment command is:

```sh
firebase deploy --only firestore:rules --project dnd-loot-site
```

The assistant does not merge or deploy live rules. Review and publish the current rules with the normal maintainer workflow.

## Validation

- Model regression: legacy/empty notes, plain text, type/length bounds and idempotence.
- Emulator regression in `character-dm-notes-rules.cjs`: actual store save/read, DM/owner/player rights, unrelated players/admins/outsiders, creation/update/omission/deletion forgery, ordinary player saves, stale revisions, approved one-shot hosts, ownership/hosting/membership revocation and public-roster exclusion. It runs in `test:rules` with the existing sheet permission suite.
- Connected browser regression: right-side layout, explicit save/reopen, player read-only state with editable personal journal, approved host/player scope, unchanged character resources, print exclusion, failed/in-flight drafts, detached controls, character/account isolation, mobile keyboard and axe.
