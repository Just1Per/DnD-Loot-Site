# Windows / PowerShell operator package

Use the new `campaignatlas-windows-library-migration-operator.zip`. Keep the old `campaignatlas-item-review-operator` folder until the new package works. Do not upload that folder: it may contain private captures. The new package does not require it, Ubuntu, WSL, or a service-account key.

Extract the new ZIP to a separate folder. Open PowerShell in the folder containing `Start-ItemMigration.ps1`. Node 22/24 for Windows and the existing Google Cloud CLI must be installed. Reopen PowerShell after an installation if PATH has not refreshed.

## First run: read-only preparation

The separate archive must exist first: follow [the archive setup instructions](separate-private-archive.md). This changes only the new bucket; the preparation below remains read-only.

If Application Default Credentials have not been configured for your authorized Google account, sign in once:

```powershell
gcloud auth application-default login
```

Then run, replacing the placeholder with the previously agreed campaign document ID:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-ItemMigration.ps1 -CampaignId YOUR_EXISTING_CAMPAIGN_ID
```

The execution-policy option applies only to this child PowerShell process; it does not change machine/user policy. The launcher installs the locked `functions` dependencies if absent. The campaign only identifies its owner; it is not a migration destination. The existing recommendations remain fixed: preserve all 659 originals privately, publish 302 replacements and retire 357 shared records after verification.

Preparation creates a new private folder under `%LOCALAPPDATA%\CampaignAtlas-Private`, outside Desktop/OneDrive. The tool creates and verifies its ACL, reads current Firebase data, verifies the source/recommendation hashes and runs the original read-only preflight. **It makes no production writes.** It prints the output folder and plan digest.

Send back only `shareable-library-plan-status.json` from that output folder. Keep `root-snapshot.json`, `authorized-decisions.json`, `library-migration-plan.json`, backup files and credentials private. If preparation stops, send only the error text or shareable status; do not force changed items through the old plan.

## Later operations — not first-run steps

Use the exact private directory printed by Prepare:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-ItemMigration.ps1 -Action Check -PlanDirectory "YOUR_PRIVATE_PLAN_DIRECTORY"
```

Check is read-only. Apply changes production and is a separate owner-run action after readiness and durable-backup checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-ItemMigration.ps1 -Action Apply -PlanDirectory "YOUR_PRIVATE_PLAN_DIRECTORY" -BackupDirectory "YOUR_PRIVATE_BACKUP_DIRECTORY" -ConfirmPlan EXACT_PRINTED_SHA256
```

No digest is auto-filled. Changed source versions, destination identity, approvals, missing artwork, archive verification, backup or bucket-privacy failures still stop execution. No rules are deployed by this package. Private-library client access still requires the separate private-library UI/Firestore/Storage rollout described in `docs/private-item-library.md`; this package restores the operator-only tools from that earlier feature branch without publishing those clients or rules.

## Private filesystem behavior

POSIX platforms retain directory/file mode checks (0700/0600). Native Windows uses Windows PowerShell 5.1/.NET ACL inspection and creation. Allowed principals are the current user, SYSTEM and local Administrators, equivalent to recognizing that operating-system administrators can access local data. Newly created directories have protected inheritable ACLs. Every private file is checked before its content is written; existing backups are checked before reuse. Exports are never overwritten.

The tool rejects extra allow grants, foreign owners, malformed ACL results, reparse points/junctions, OneDrive paths and ancestors that let untrusted accounts replace path components. It does not silently tighten existing folders or disable permission checks. If a selected folder fails, choose a new local profile folder or use the default. The helper invokes a bundled local script with literal path arguments; no path is evaluated as PowerShell code. No file contents or credentials are printed by ACL inspection.

Download the code package anywhere convenient, including Desktop if necessary; private output uses the separate local protected location. A package directory and a private output directory serve different purposes. Keep durable backups in a protected location you retain; do not delete the output folder after applying.

## Separate private archive setup

If preparation reports “Private archive requires uniform bucket-level access”, do not change the existing bucket. Follow [the separate archive instructions](separate-private-archive.md) to create a new private destination and prepare a fresh plan. The updated launcher defaults to `dnd-loot-site-private-item-library`; `-ArchiveBucket NAME` selects a different new bucket during Prepare. Old plans without source/destination bucket bindings are rejected by Check/Apply.

The read-only diagnostic remains available as `node .\scripts\audit-storage-access.mjs`. It prints aggregate counts without object names, tokens or identities and changes no permissions.
