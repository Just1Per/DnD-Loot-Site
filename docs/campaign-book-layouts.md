# Campaign opening-page layouts

The default is Classic: the existing introduction on the left and illustration on the right. Campaigns without a layout preference, and unknown preferences loaded by this client, use Classic.

Edit front page → Layout options opens an inline radio-card selector. Chronicle uses a chapter heading and facing pages; Atlas presents an uncropped map or image above a two-column introduction; Grimoire uses a leather-coloured frame, burgundy heading and gold details. The compositions use original CSS and the campaign's existing image; no publisher artwork or page design is bundled.

Selecting a card previews the captured draft without writing. Text, uploaded cover references, alt text and credits stay intact. Back to editing returns to the same fields. Save front page publishes the preference to campaign members with the existing optimistic revision check; Cancel, navigation guards and failed saves preserve their existing behavior. Uploaded files are reused locally during preview switches instead of being downloaded again.

`frontPage.layout` is optional and accepts only `classic`, `chronicle`, `atlas` or `grimoire`. Saving Classic omits this field, preserving the old payload. The Firestore rules change permits only these values, retaining existing campaign-role, revision, image and content validation.

## Deployment order

Firebase Hosting previews do not deploy Firestore rules. The owner must publish the reviewed Firestore rules before saving a non-default layout against production. Existing Classic pages continue using the legacy payload. No production rules, merge or deployment is performed by this PR.

### Diagnosing a denied layout save

`Could not save: Missing or insufficient permissions.` is a Firestore rejection, not a failed image upload. If the same DM can save Classic but Atlas/Chronicle/Grimoire fail, compare the **currently published** `validFrontPage(page)` function with the layout support below. This is strong evidence of older rule validation, but current server rules must be checked before claiming a confirmed production diagnosis.

The narrow layout change adds `'layout'` to the existing `page.keys().hasOnly(...)` list and adds this condition immediately afterward:

```text
&& (!('layout' in page) || page.layout in ['classic','chronicle','atlas','grimoire'])
```

Retain every other existing field restriction, role check, revision check and image constraint. Do not replace the complete production rules with repository `firestore.rules` solely to fix layouts: the repository also includes separately reviewed catalogue/private-archive changes. Start from an export of the active rules, prepare a minimal diff, test it and review that exact change before publishing. If Classic also fails, investigate campaign DM membership, revision and front-page validation instead of assuming layout is the sole cause.

The browser regression now saves **each** of the four layouts, reopens stored data for both DM/player roles, verifies one revision increment and preserves all text/private-image fields. Permission-denied drafts remain editable with recovery guidance. Browser fixtures do not establish that production rules have been published.

Validation: six real-browser scenario groups cover layout previews, no writes before Save, content/image retention, private uploads, player/DM access, cancel/failure/conflict recovery, fallback/reset, native radio keyboard controls, Escape/focus, 320/390px layout, WCAG A/AA and print heading contrast. Existing campaign-home upload/save regressions and UI/PDF checks pass. Emulator tests verify all supported layouts, malformed values, legacy payloads, role boundaries and revision checks. Production network/image availability is not verified by fixtures.
