# Recoverable campaign deletion

A campaign owner can select Delete campaign in campaign settings or beside their campaign on the dashboard. A global administrator can list campaigns in Admin and delete any campaign without receiving access to its private preparation. Delegated DMs can edit campaigns they help manage but cannot delete another owner's campaign. Players have no deletion control.

The keyboard-accessible confirmation names the campaign, starts with Cancel focused, and explains the effect: the campaign disappears from the app and members lose Firestore and Storage access. Its underlying records and files are retained for recovery. This is recoverable application deletion, not a permanent recursive data or file purge. Recovery requires a privileged operator; the browser cannot remove the deletion marker or reuse the campaign ID.

The deletion transaction rechecks the current account, campaign owner or administrator role and the campaign's availability. It writes a deletion marker to the root campaign record. Both rulesets require an undeleted campaign for owner/member access, including saved image paths. Stale membership indexes cannot reopen the campaign; pending invitations cannot grant access to a deleted campaign. Existing records are not migrated or rewritten. A successful delete of the current campaign clears its local session and returns to the dashboard.

**Updated Firestore and Storage rules are required together.** The rules permit narrowly scoped deletion metadata only for the owner/admin and reserve the campaign ID. Deploying only the UI would leave deletion unavailable; deploying only one ruleset would leave inconsistent access to records and files. No production campaign was deleted and no deployment or migration was performed while preparing this feature.

Validation: `test:campaign-deletion` covers owner/admin entry points, delegated-DM/player boundaries, cancellation, account changes, cleanup and desktop/mobile accessibility. `test:campaign-deletion-rules` verifies real Firestore/Storage revocation, retained records, strict metadata, denied ID reuse/restoration and admin isolation from campaign-private documents.
