# Campaign front page

Campaigns open on **Campaign home**, a member-facing introduction using the existing parchment, burgundy and gold palette. On desktop, the description and campaign information/table rules sit on the left, with a large campaign map or intro image at the upper right. On narrow screens the columns stack; maps retain their full image rather than being cropped. The Library, character sheets and DM workspaces remain available through their existing tabs and the home page’s shortcuts.

Campaign owners and active campaign DMs can select **Edit front page**, either from Campaign home or Campaign Settings in DM Tools. This switches the front page itself into edit mode, with editable text on the left and a live image preview and **Upload image** control on the right; no popup is opened. Save, Preview and Cancel stay on the page. On mobile, the image controls stack beneath the text.

The editor saves a tagline, introduction, table expectations, optional HTTPS cover-image URL, accessible image description and artwork credit. Uploading a cover immediately updates the image preview; the saved page changes only after **Save front page**. Preview shows the draft in the same page, and **Back to editing** restores its fields. Reselecting Campaign home preserves the draft; cancelling or navigating away from a changed draft asks before discarding it. Existing campaigns use their description until an introduction is saved.

All front-page text is visible to campaign members. DM secrets remain in the separate private world/chapter/encounter workspace. Images can be supplied by HTTPS URL or uploaded as PNG/JPEG/WebP files smaller than 5 MB. Uploaded covers are read through authenticated Storage requests and browser object URLs; they do not use public download tokens. Each replacement creates an immutable `campaign-cover-images/{campaignId}/{imageId}` object. Members may read covers, while only campaign managers may upload. Private world-map paths cannot be used as cover references. Failed cover images fall back to the readable introduction.

## Persistence and permission checks

`campaigns/{campaignId}.frontPage` stores the fields and a monotonic revision. A transaction checks the expected revision and updates only the front page plus `updatedAt`. Concurrent updates retain the editor draft and report the conflict. Changing campaign/account during the transaction invalidates the captured session. Players, removed members, unrelated DMs and global administrators without campaign access cannot edit.

The Firestore rules add `frontPage` to the permitted settings fields and enforce the data shape, field lengths, HTTPS image URL, nonempty image description when a cover is set, and the next revision. Existing ownership and campaign-settings restrictions remain in force.

## Validation

From the repository root:

```sh
npm --prefix tests run test:campaign-home
npm --prefix tests run test:campaign-home-rules
```

The browser tests use mocked Firebase data and verify inline editing, right-side upload placement, live image preview, save/reopen, preview validation, escaping, draft cancellation, conflict/permission failure recovery, in-flight campaign changes, player access, navigation, mobile layout and axe accessibility in both read and edit modes. The permission tests run against `demo-vault-test`, never production. The existing campaign workspace CI runs both checks.

## Release requirement

The new save operation requires the updated `firestore.rules`; uploaded covers also require the included `storage.rules`. Authenticated image reads need the bucket’s GET CORS configuration to include the intended production/preview origins (see `docs/world-map-storage-deployment.md`). Review and publish those rules to the intended Firebase project together with the application release through the existing manual approval process. Hosting preview automation does not publish Firestore rules. No production deployment or rules publication is part of this implementation.

## Follow-up backlog

1. Optional layout and section preferences after the inline editor is reviewed.
2. Separate saved drafts from the member-visible introduction, if DMs need an explicit publish step.
3. Extend monster/NPC catalogue discovery and personal templates already present on main, preserving their storage and editors.

Cover uploads, curated campaign information, revealed NPCs and completed chapter recaps are implemented in the review stack; see `docs/campaign-experience-backlog.md` for their review status.

Unused uploads are retained when an editor is cancelled or a cover is replaced. Object cleanup is a separate maintenance task; this feature does not delete saved or potentially referenced artwork.

Failed uploaded-image reads display an accessible explanation and **Try loading image again**, both in the editor and on the saved page. Retrying reads preserves the saved reference and revision. Failed uploads allow choosing the same file again. An image description is required to save a cover, with visible guidance beside the save controls. For upload/save/read diagnosis and the separate production Storage rules and CORS requirements, see [Campaign image permissions and CORS](world-map-storage-deployment.md).
