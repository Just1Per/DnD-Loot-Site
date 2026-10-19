# Campaign notebook direction

The [interactive example](../design/world-notebook.html) records the notebook direction and remains a standalone design excluded from Hosting. The application now offers **Notebook layout** in World Building and Chapters. The preference is remembered per signed-in user, campaign and entry kind in this browser; existing detailed layouts remain selectable.

The live notebook uses the existing saved title, description, private notes, illustrations and sharing controls. Switching layouts preserves unsaved text, image references and opaque preparation fields. A short DM notes box stays visible. Additional preparation, progress, connections, maps and print options remain under **More preparation, connections and print options**. Notebook browsing has no search box. Chapter progress and milestone approvals retain their existing behavior. NPCs and Encounters retain their detailed editors.

**Add category** saves an empty campaign category immediately, independently of the open entry. Category counts start at zero; category choices survive reopening and are available to the campaign's DMs. Categories are immutable records under `workspaceCategories`; duplicate names are prevented by the UI and fixed IDs make retries safe. Existing categories inferred from entries remain available. New records start in the selected category. Chapter category changes do not alter story progress.

World Building and Chapters use a title and description, plus a short always-visible DM notes box. Categories run across the top; adding a category creates an empty category immediately. There is no search box in notebook mode. NPCs and Encounters keep the detailed stat blocks and preparation tools already present in the application. Those tools do not belong on the player page.

## Sharing behavior

| Content | Default | Explicit action |
| --- | --- | --- |
| Title and description | Hidden from players | Share with players; Update player page; Hide from players |
| Uploaded illustration/map and its caption | Hidden from players | Share image with players; Update shared image; Hide image |
| DM notes, stat block, actions and preparation | Campaign DMs only | Never included in the player publication |

The image belongs to the player page, so the page must be shared before its image can be shared. Hiding the page hides its image too; sharing the page again does not reveal the image automatically. Hiding just the image leaves the text shared. Replacement images and caption edits remain private until Update shared image is chosen. Updating the image never publishes draft text. Removing an image also hides the published image.

Save draft does not update player publications. Player preview distinguishes the current published page from a draft preview; the latter is only a DM preview and never includes private notes or stat blocks. PNG, JPEG and WebP are accepted below 5 MB; invalid image bytes cannot replace an existing illustration.

## Application work included now

The existing SRD creature catalogue has real multi-selection controls. Select across search/edition filters, select up to 100 visible creatures, clear selection and import all selected. Import saves independent campaign creatures with fresh IDs and private preparation, without replacing the editor's current draft or writing player publications. Completed selections are removed; a partial failure retains remaining selections, and fixed destination IDs prevent duplicates after a lost acknowledgement. Campaign/account changes stop further writes.

An imported creature can become a Story NPC by changing its entry type. The Reveal NPC control publishes the saved player description. Its stat block, tactics, relationships and secrets remain on DM-only records. Independent saved-image publication is implemented for World entries, NPCs and completed chapters; see [player illustration sharing](player-illustration-sharing.md). Encounter images remain DM-only.

**Preview draft description** shows the unsaved description only. **View published player page** fetches the actual shared snapshot and its explicitly shared illustration, excluding draft text and DM notes. Neither preview writes to Firebase.

## Rule requirements

The notebook adds DM-only Firestore `workspaceCategories` records with bounded names and immutable creation metadata. Publish the updated Firestore rules before using Add category. Independent player images additionally require the Firestore and Storage rules described in the illustration guide. No rules or application deployment or production migration was performed during implementation.

## Validation

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm --prefix tests run test:notebook-design
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm --prefix tests run test:creature-bulk-import
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm --prefix tests run test:notebook-editor
npm --prefix tests run test:notebook-categories-rules
```

The notebook checks upload validation, separate image/text snapshots, private notes/stat exclusion, desktop/mobile sizing and WCAG checks. The real-application importer checks filtering, partial failure, lost acknowledgement, selection limits, draft preservation, source preservation, player publication boundaries and campaign changes. The CI workflow runs both with Playwright's installed Chromium.
