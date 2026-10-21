# Returning from a Journal editor

A DM can open a World/NPC reader, choose Edit post/Edit NPC, and use Back to World/Back to NPCs to return to the filtered list with its original focus and scroll position.

Previously, clicking this Back button cleared the remembered article before the unsaved-changes confirmation. Canceling correctly kept the draft open, but a later ordinary Journal navigation unexpectedly opened the list instead of the remembered reader. The return action now restores the remembered selection when the editor remains active after a rejected leave. Successful Back navigation still restores the list, search, category, focus and scroll.

The shared renderer also removes an obsolete World/NPC rendering branch: those entries already use their dedicated reference reader. Chapter rendering retains chapter order, open details, private note controls, focused selections and illustrations. Header Guide and contextual World/NPC help explain the navigation behavior.

Validation: the new World regression failed before the fix (the expected reader never appeared). Expanded World/NPC browser suites pass with cancel, retained draft, later ordinary navigation, explicit successful Back, images and responsive WCAG checks. Existing chapter/private-note, shared-page failure/retry, Guide DOM and repository packaging checks pass.

No Firestore or Storage rule changes, migrations, backfills or production deployment are required. This navigation change adds no rules. Merged #170 requires its own Firestore rules for DM recap moderation. This main-targeted follow-up restores #171/#172 after their PRs were merged into feature branches.
