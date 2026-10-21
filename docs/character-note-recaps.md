# Character notes and shared recap moderation

## Share one note deliberately

In your own **Character sheet → Notes**, select a note and choose **Share in Journal…**. The existing sheet Save and continue / Leave without saving / Stay here guard handles unsaved sheet edits. The selected note’s current title/text and character perspective are copied into a new **private recap editor**. No other notes, portrait, sheet fields or preparation are imported. Nothing is shared automatically.

Review the copy, choose the session details and use **Only me · Draft** to save privately, or explicitly select **Everyone in this campaign** and **Share recap**. Later edits are independent of the character note. Campaign DMs viewing another player’s sheet do not receive this export action. Adventure sheets use the same explicit campaign audience; this does not publish to the open Internet.

A failed initial Journal load retains the pending copy in memory for Try loading Recaps again. Leaving or changing account/campaign cancels the handoff. Notes can contain 20,000 characters, while recaps retain their existing 12,000-character limit: long copies remain intact in the editor with a validation message and must be shortened there. The source note is never silently truncated.

## Campaign DM controls

When reading another player’s shared recap, campaign DMs and the campaign owner see **Edit shared recap** and **Remove from Journal** beside Back to Recaps. These controls operate only on `journalRecaps/{id}`. They never read or write the author’s private recap draft or character notes.

Editing preserves the original `authorId`, displayed author/character names and `sourceRevision`. The shared revision increments and records `moderatedBy` / `moderatedAt`; readers see **Edited by a campaign DM**. The editor clearly says it updates the shared copy, and its Save shared changes / Preview actions remain visible while scrolling. Leaving with edits offers save/discard/stay with wording that explains the shared update. Save failures and revision conflicts retain the typed correction.

Removal requires confirmation and deletes only the shared copy. The private original is kept. This is moderation of the current publication, not a ban: the author can deliberately publish a new version later. Author re-publication replaces the shared snapshot from their own saved draft and removes the prior moderation marker. It is not automatically restored by private note/draft edits.

## Rules and rollout

**Updated Firestore rules are required for DM moderation before releasing this frontend. Storage rules are unchanged.** Active campaign DMs/owner may update or remove shared recaps, with immutable attribution/source and bounded fields. Other players may still manage their own authored copies but cannot moderate someone else’s. Global admin status alone, another campaign’s ownership, inactive DM membership and anonymous access grant no moderation rights.

Private recap drafts remain author-only, including when a campaign DM is moderating the shared copy. Character-sheet note permissions are unchanged. No migration, backfill, production rules publication or deployment is performed here. These rules are a new change beyond #167, whose publication the owner already confirmed.

## Validation

`test:character-note-recaps` covers selected-note-only copying, sheet save/stay guards, explicit private/party audience, escaped text, source preservation, DM editing/removal/confirmation, attribution, no author-draft reads, failed saves, revision conflicts, moderation leave guards, deliberate author re-sharing, long-note validation, transfer retry, 1440/390/320px layout and WCAG. The suite runs early in CI.

Real Firestore emulator tests cover owner/DM moderation, forged attribution/source/audit/private fields, stale revisions, role/campaign boundaries, revoked DM access, private-draft isolation and author re-publication. Existing character-note/advancement permissions and journal/navigation/guide/layout tests remain enabled. Browser artifacts include `dm-recap-moderation-{1440,390}.png`.
