# Separate private item-artwork archive

The existing `dnd-loot-site.firebasestorage.app` bucket remains the source of existing images. Do not change its IAM, object ACLs, tokens, public-access setting or uniform-access setting to unblock this migration. Previously generated retained/shared images remain there. Only exclusively retired artwork is deleted, after the existing durable-backup, private-copy and database verification gates.

Create a new archive in the same project and location. These are owner-run commands; Codex does not create it. Creation changes cloud infrastructure and can incur storage charges when the migration later copies images. It does not migrate any data or alter the existing bucket. Run in PowerShell with the authorized Google account:

```powershell
$archiveLocation = gcloud storage buckets describe gs://dnd-loot-site.firebasestorage.app --format="value(location)"
if ($LASTEXITCODE -ne 0 -or -not $archiveLocation) { throw 'Could not read the existing bucket location.' }
gcloud storage buckets create gs://dnd-loot-site-private-item-library --project=dnd-loot-site --location="$archiveLocation" --uniform-bucket-level-access --public-access-prevention
if ($LASTEXITCODE -ne 0) { throw 'Archive creation failed. Do not continue or reuse an unknown bucket.' }
```

The archive requires uniform access, enforced public-access prevention, matching source/destination project numbers, no public bucket IAM grants and a different name from the source. If this globally unique name is unavailable, stop and choose a new name; use `-ArchiveBucket NAME` during Prepare to bind that exact name. No bucket policy or IAM mutation is performed by the migration tool. Do not register this archive for public Firebase client use or create download tokens. It is an operator-only GCS archive. Existing project/organization IAM administrators can still access it; it is not private from project administrators.

Download and extract the updated Windows operator ZIP into a new folder. Keep the previous private output/backup directories. In the folder containing `Start-ItemMigration.ps1`, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-ItemMigration.ps1 -CampaignId p9HParLkC57s6RwI71LI -ArchiveBucket dnd-loot-site-private-item-library
```

This is a new **read-only preparation**, not Apply. It creates fresh local private outputs and reads current Firebase/GCS state. Send only `shareable-library-plan-status.json` from its printed output directory. Both bucket names are bound to the fresh plan SHA-256 and source-version checks. The launcher refuses old plans lacking that binding. Check/Apply select the destination from the saved plan, not an overridable argument. Keep original snapshots, plan and backup files private. Do not run Apply as part of setup.

Later explicit Apply copies from locally verified backups into the separate archive with generation-match-zero creation. It does not copy source tokens or ACLs. Checksums, metadata and unauthenticated HEAD denial (401/403; missing/404 is not evidence) must pass before private database copies or shared publication/retirement. Privacy is rechecked before publication and before deleting retired artwork; retired source deletion uses its pinned generation. Retained, shared and unrelated artwork remains in the original bucket. A stop can leave verified private copies for safe retry; it does not roll back earlier completed operations.

Archived image fields and template assets include the private bucket name as well as the object path and checksum. The separate archive has no website/client rules deployment in this PR. Manual future library imports must use both the campaign image bucket (`--bucket`) and matching private archive (`--archive-bucket`); the source asset's bucket must match. Imported campaign copies are still stored in the existing campaign bucket and must pass their existing privacy checks. UI access to the new private bucket is not enabled by this operator work.
