# Campaign appearance

Campaign settings → **Campaign appearance → Change appearance** lets the campaign owner or an active campaign DM choose a shared look. Members receive saved changes live while viewing that campaign. The dashboard, account administration and other campaigns restore their own colours. Existing campaigns without appearance data retain the original Classic look.

The editor exposes three colours:

| Control | Changes |
| --- | --- |
| Buttons | Main action colour, with automatically derived headings, hover and focus shades |
| Page background | The canvas around content panels, including a dark canvas for horror campaigns |
| Accent | Decorative highlights, with readable companion shades for text and borders |

Classic, Ocean, Forest and Horror presets provide starting points. Colour pickers and six-digit hex fields support custom choices. Very pale or saturated button colours are adjusted to readable shades; this is explained in the editor. Text, hover, heading and focus colours are derived rather than exposed as independent settings. Content panels remain light, and the original Adobe character paper remains white. This is a campaign colour setting, not an all-surfaces dark mode.

**Preview** changes only the DM's current screen and never writes data. **Cancel** or Escape restores the latest saved look. **Reset to Classic** selects the defaults; it still needs Save appearance. Saving writes only campaign appearance and its update time, without touching characters, equipment, source data or game mechanics. Account/campaign changes close the editor, remove its preview and ignore late callbacks from the old context. Conflicting edits and save failures preserve the draft and explain how to retry.

## Storage and deployment

The campaign document's optional `appearance` map contains `schemaVersion: 1`, a preset ID, `primary`, `background`, `accent` hex values and an increasing `revision`. Only validated colours are converted to known CSS custom properties; arbitrary CSS, image URLs and HTML are not supported. All saved campaign members may read the map through existing campaign access. The owner or an active DM may update it. Global admin status alone does not grant editing access. Transactions and Firestore rules enforce revision checks and prohibit ownership changes.

**Publish the updated `firestore.rules` when releasing this feature.** The website alone cannot make the new appearance field writable under the older whitelist. Old rules fail safely and leave the editor's choices available; no Storage rules update is needed. No Firebase rules are deployed by the browser tests.

`css/theme-tokens.css` remains the palette API. `campaign-appearance.js` derives screen tokens, and `campaign-appearance-ui.js` applies them only during campaign viewing. The browser theme-colour metadata follows the campaign header and resets on exit. The print token overrides take precedence over inline screen preferences, preserving neutral print colours.

The appearance controller captures its Firebase SDK reference and creates its store during ordered initialization. The bootstrap deletes `window.__DND_VAULT_DEPS__` afterwards; event handlers and campaign listeners must use the captured reference. The browser regression removes that bridge before exercising saves, campaign changes and live member updates, matching the deployed lifecycle.

## Regression checks

- `tests/campaign-appearance.cjs`: legacy/default handling, strict colour inputs, 1,000 colour combinations, permission checks, isolated writes, revision conflicts and account changes during transactions.
- `tests/campaign-appearance-browser.cjs`: actual settings/editor interactions; preset/custom preview, Cancel, save, reopen, live player updates, dark-background screens, 320/390/768/1440 layouts, axe contrast/accessibility, failed/conflicting saves, character-data/dirty-state preservation, neutral printing, account transitions and dashboard/logout reset. Screenshots are saved under `campaign-appearance/` in the palette-review CI artifact.
- `tests/campaign-appearance-rules.cjs`: real Firestore emulator checks for owner/DM writes, member reads, denied players/outsiders/removed DMs/global admins, malformed colours/schema, stale revisions, reset and campaign creation.

The browser and permission checks run in the required campaign workspace workflow. Browser data and authentication use isolated fixtures; tests do not modify live campaigns or send messages.
