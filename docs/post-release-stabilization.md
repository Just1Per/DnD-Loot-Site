# Post-release reading and overview recovery

Shared World, NPC and chapter pages now distinguish loading, failed access and a successfully loaded empty list. Search/category/clear controls stay disabled until loading succeeds; queued filter events cannot overwrite a loading or failure message. The existing Refresh action becomes Loading… during a pending request and Try again after failure. Repeated clicks cannot start overlapping refreshes. Retry retains browsing filters and the selected record, and revoked access still immediately removes content and image URLs; stale results cannot restore it.

DM Overview now offers Retry chapter overview and Retry recent work directly on the affected cards. A retry retains successful summaries and fetches only the failed kinds. Pending actions are disabled, no records are created or saved, and the existing campaign/account/route generation guard rejects late responses. Returning to Overview still performs a fresh load. A failed read is never labelled as an empty campaign.

The header Guide and section help explain recovery. No new Firestore or Storage rules, data migration or production deployment are included. The owner confirmed that the earlier #167 Firestore rules are published; this is an owner confirmation, not an independent inspection of production rules.

## Validation

`test:read-page-recovery` reproduces the original failed-read/filter bug and covers all three shared sections, initial errors, escaped messages, pending requests, retry, preserved filters, revoked access, queued callbacks, campaign switches and 1440/390/320px WCAG. It runs early in CI. `test:dm-workspace` additionally covers partial failures, inline retry, failed-kind-only requests, duplicate prevention and no writes; prior draft/reference/print/stale-account tests remain enabled. Existing publication, World layout, World/NPC navigation, chapter private-note, guide and packaging suites pass locally.
