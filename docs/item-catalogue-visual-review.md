# Review the item proposals visually

Build a single HTML file from the sanitized legacy metadata and complete proposal package:

```sh
node scripts/build-item-catalogue-review.mjs --output /path/to/new-item-review.html
```

Download/open the HTML file in a browser. It needs no Firebase login or server and contains its own data, styling and script. The builder refuses to overwrite an existing file. The page does not connect to Firebase or load external scripts, fonts or artwork.

## What to inspect

- Search by old/proposed name or document ID. Filter replacement versus withholding proposals, edition, reason and review status.
- For a replacement, read the complete proposed description, explicit edition, rarity, category and attunement, then check attribution and the pinned source link. Variant alternatives and known concerns are shown separately.
- For withholding, inspect the reason: missing rights evidence, unknown authorship, uncertain normalized armor rarity, or the redundant generic template. These are recommendations, not legal findings.
- Original descriptions and artwork are intentionally absent. In the application, **website administrators** can use **Admin → Root Catalogue** to inspect original root records. A campaign DM role alone is insufficient. An authenticated private export is the alternative; do not publish or attach raw originals to chat.

## Record and return feedback

Choose **Accept proposal**, **Request changes**, **Needs checking**, or leave an item unreviewed. Add notes for a different edition/variant, source correction, authorship evidence or other change. A reviewer name is optional.

Notes are stored in this browser when supported. If browser storage is blocked, the page says so and downloading still works. Use **Download review notes** to keep a portable JSON copy and send that notes file back. **Import saved review notes** resumes a matching export after confirmation. Imports from a different proposal package/item revision are refused.

The notes export contains IDs, original/proposal fingerprints, decisions and notes; it omits item descriptions and artwork. It is **not** a migration manifest, does not set canonical publication approvals, and never changes Firebase data. Private backup, current-source verification and production review remain separate steps.

## Validation

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node --test tests/item-catalogue-review-browser.cjs
```

Omit the executable override when using Playwright's installed Chromium. Tests cover content/evidence boundaries, readable replacements and withholding reasons, searching/filtering/pagination, saved notes, export/import and mismatch rejection, blocked-storage recovery, script-like labels, desktop/mobile layout and WCAG checks. The HTML is served through a deterministic browser fixture; no production service is contacted.
