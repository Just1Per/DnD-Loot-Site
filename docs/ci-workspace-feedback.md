# Workspace CI feedback

The previous workspace workflow ran every group on one runner. In the successful PR #162 rerun (job 119037928883), the character engine/DOM step took about 164 seconds, and all subsequent browser and emulator checks waited for it. Late failures required rerunning the whole serial sequence.

The workflow now runs three independent groups:

- **Engines and DOM**: packaging first, character/store engines, full DOM fixtures, catalogue logic and planning/account cleanup scenarios.
- **Browser and navigation**: actual Chromium flows, publication/image regressions, mobile/accessibility, print, navigation and all campaign editors.
- **Firestore and Storage permissions**: all emulator suites, including illustrations, membership revocation, campaign deletion, catalogue isolation and One Shots boundaries.

All 55 original test command invocations remain. Java/emulators run in the permission job; Chromium and PDF utilities are installed wherever needed. Emulator downloads are cached by OS and test lockfile. Superseded runs of the same PR are cancelled; other PRs keep running.

The final **workspace** check still exists and succeeds only if all three groups succeed. Failure, cancellation or a skipped group fails that gate. Existing branch protection referring to workspace continues to wait for the full suite. This change does not edit branch protection or repository settings.

Engine logs and browser screenshots use separate artifact names (`campaignatlas-ui-checks-engine` and `campaignatlas-ui-checks-browser`). Engine failure annotations are retained. The real PR run, rather than a predicted speedup, establishes the new duration; runner queue/setup time and concurrency availability affect results.

Validation before pushing: actionlint, exact comparison of all test command invocations before/after, and execution of the final gate with success/failure/cancelled/skipped outcomes. No application or Firebase-rule changes.
