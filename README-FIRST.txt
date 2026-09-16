REGISTERED USER INVITE UPGRADE

Replace these project files:

public/index.html                       <- index.html
public/js/modules/admin.js              <- admin.js
public/js/modules/invitations.js        <- invitations.js
public/js/modules/data.js               <- data.js
firestore.rules                         <- firestore.rules

No app.js change is required.

After copying, deploy from the Firebase project root:

firebase deploy --only firestore:rules,hosting

Then hard-refresh the site (Ctrl+Shift+R).

How it works:
- Every account gets a safe /userDirectory/{uid} record containing uid, display name, masked email hint, and updatedAt.
- Admin login backfills the directory for older /users records.
- Invite User can search the directory and target an existing account by Firebase Auth UID.
- Manual email invitations still work.
- Existing invitation acceptance is preserved; it now accepts either targetUid or matching email.
