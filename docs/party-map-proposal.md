# Party map proposal — discussion only

The current map has one DM-managed image, named clickable pins, shared descriptions and authenticated campaign-member viewing. Players cannot upload or edit maps under the current Firestore/Storage rules. This proposal does not enable uploads or change permissions.

Keep Journal navigation to two choices: Recaps and Maps. Recaps retain their prominent New entry action. Maps shows thumbnail cards with a name, uploader and Private/Submitted/Shared badge, plus one Upload map action. A shared active-map card can be pinned first. Opening a map gives the image most of the screen, pan/zoom controls and a place-description panel (below the image on a phone).

Recommended player workflow: Upload image → preview and name it → save a private map draft → submit for DM approval → DM publishes it to the party. The author can replace their private upload before submission. Replacing a published image creates a new version rather than silently moving existing pins. Keep the current image limits initially: PNG, JPEG or WebP under 5 MB, with useful upload/size errors and an explicit Save/Submit result.

Players can suggest a labelled pin and short note; DMs can approve it, edit canonical places, choose the active map and keep DM-only places separate from revealed pins. Shared pins open a small description with an optional link to an existing NPC/world entry. Shared descriptions and private preparation stay separate; private pins must not be sent to players and merely hidden on screen.

For the first version, use draft/submitted/shared states, author-owned drafts, campaign-only published maps and DM-controlled publication. Player direct-sharing remains an alternative for groups that prefer it. The sharing preference is awaiting the owner's response; do not implement these permissions from this proposal alone.

Implementation of player uploads/multiple maps will require reviewed Firestore and Storage rules in addition to UI/store changes. Keep the existing DM map available while introducing the gallery; do not overwrite it or discard its pins. No production migration or rules deployment is authorized by this design document.
