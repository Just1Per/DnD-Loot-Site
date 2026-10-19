# Campaign notebook direction

The [interactive example](../design/world-notebook.html) refines the selected notebook layout. It is a standalone design, excluded from Firebase Hosting and not wired to the live application. Its changes stay in the current tab. It contains synthetic example content only.

World Building and Chapters use a title and description, plus a short always-visible DM notes box. Categories run across the top; adding a category creates an empty category immediately. There is no search box in this design. NPCs and Encounters keep the detailed stat blocks and preparation tools already present in the application. Those tools do not belong on the player page.

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

An imported creature can become a Story NPC by changing its entry type. The existing Reveal NPC control publishes the saved player description. Its stat block, tactics, relationships and secrets remain on DM-only records. The notebook prototype's independent image sharing still needs application store, publication and Storage rule integration before live deployment; current journal uploads in the application remain DM-only.

## Validation

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm --prefix tests run test:notebook-design
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm --prefix tests run test:creature-bulk-import
```

The notebook checks upload validation, separate image/text snapshots, private notes/stat exclusion, desktop/mobile sizing and WCAG checks. The real-application importer checks filtering, partial failure, lost acknowledgement, selection limits, draft preservation, source preservation, player publication boundaries and campaign changes. The CI workflow runs both with Playwright's installed Chromium.
