# Campaign opening: concurrent access reads

Opening a campaign requires the current campaign record and the current user's membership. These independent document reads now start together. Previously the membership request started only after the campaign request completed. This removes one sequential network wait; it does not reduce the number of reads or bypass an authorization check.

The application still waits for both results before loading characters, inventory, saved items and campaign rules. Missing/deleted campaigns and missing/revoked memberships remain denied. Owners retain their existing access without a membership record. Account changes and newer navigation invalidate pending results, and read errors fail closed. No additional cache is introduced.

Validation: the runtime tests use separately controlled pending requests to prove both reads start immediately and protected content waits for both results. They cover denial, owner access, account/navigation changes and read failures. The app navigation browser suite checks fresh role changes, private routes, saved-edit guards and mobile accessibility. Production timing depends on network and Firestore latency and has not been measured for this change.

No Firestore/Storage rule changes, indexes, migrations or deployment.
