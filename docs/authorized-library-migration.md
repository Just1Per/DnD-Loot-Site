# Run the owner's adopted catalogue recommendations

On 2026-10-19 the owner explicitly delegated adoption of the existing recommendations instead of reviewing all items individually. The recorded policy is `docs/reports/catalogue-recommendation-authorization.json`. This authorization covers the exact pinned set of 659 proposals: 302 SRD replacement publications and 357 shared-catalogue retirements, with original fields and generated illustrations preserved in the owner-private library. It does not assert that the owner personally reviewed every entry or grant undocumented rights to original publisher material.

The normal unapproved worksheet generator remains unchanged. The new `prepare-authorized-library-migration.mjs` command is an explicit delegated-adoption workflow. It checks the policy's proposal digest, regenerates all recommendations from pinned checksum-verified SRD source bytes and verifies the live snapshot membership and hashes. Changed recommendations or live items stop preparation; they are not silently adopted.

## What the plan does

- Preserve all 659 originals, revisions and matched illustrations in the owner-private library, outside campaigns.
- Publish the 302 recommended replacement payloads under their existing shared IDs. Preserve their generated illustrations.
- Remove the 357 recommended retired records from the shared root catalogue only after private copies and images verify. Retired originals remain archive-only, separate from reusable reviewed templates.
- Leave existing campaign copies, supply, inventories and character equipment unchanged.

No production operation was performed when creating this tool or its operator ZIP. The actual version-bound plan must be generated on the owner's computer with working Google access. There is no production snapshot or owner credential in the package.

## Owner commands

Native Windows/PowerShell is supported by the new [Windows operator package](windows-item-library-operator.md), using ACL validation rather than POSIX modes. The commands below also work with Node 22/24 and Google Cloud CLI on Linux/macOS. Unzip the matching operator package and open a terminal in its root.

```sh
npm ci --prefix functions --no-audit --no-fund
gcloud auth application-default login
```

Prepare using the existing own campaign solely to identify its current owner UID (no items are written to that campaign):

```sh
node scripts/prepare-authorized-library-migration.mjs prepare \
  --campaign YOUR_EXISTING_CAMPAIGN_ID
```

Alternatively use `--owner YOUR_FIREBASE_UID` instead of `--campaign`. Do not supply both. The library owner account must exist in the selected project.

Preparation creates a new private directory under the user's home folder on POSIX or under LocalAppData/CampaignAtlas-Private on Windows and prints its path. It writes:

- `root-snapshot.json`: private originals, potentially including original prose and image tokens.
- `authorized-decisions.json`: the exact recommendations adopted under the owner's recorded delegation, with the live-source checks and approval provenance.
- `library-migration-plan.json`: the full immutable, source-version-bound migration plan, including private originals.
- `shareable-library-plan-status.json`: readiness, counts and digest without item prose or tokens. This is the only file intended to be sent back to chat.

Preparation also runs the authenticated read-only preflight for owner identity, source revisions, legacy inventory prerequisites, bucket privacy and image availability. It makes zero Firestore/Storage writes. A successful plan should report `ready: true`, 659 total, 302 publish, 357 retire and zero unresolved artwork. If it stops, retain the files and send only the shareable status or error text. No individual item review is requested; changed data requires updating the technical plan.

## Execute the prepared plan

Use the printed private directory in place of `YOUR_PRIVATE_PLAN_DIRECTORY`. Keep a durable private backup location outside Git, temporary/cloud task storage and public/synced export folders. Publish the Firestore and Storage rules from the private-library change before enabling client access; Hosting alone does not publish them. These tools never deploy rules.

```sh
node scripts/prepare-authorized-library-migration.mjs check \
  --directory "YOUR_PRIVATE_PLAN_DIRECTORY" \
  --backup-dir "$HOME/campaignatlas-private-library-backup"
```

When the preflight succeeds, execute that exact generated plan using its printed SHA-256:

```sh
node scripts/prepare-authorized-library-migration.mjs apply \
  --directory "YOUR_PRIVATE_PLAN_DIRECTORY" \
  --backup-dir "$HOME/campaignatlas-private-library-backup" \
  --confirm-plan EXACT_PRINTED_PLAN_SHA256
```

`apply` is the production-changing operation. It requires the exact digest, backs up all originals and legacy artwork, verifies owner-private copies before shared mutation and rechecks original revisions in transactions. A failed prerequisite cannot be bypassed by the delegation. Rerunning the unchanged plan can resume verified completion; changed private copies or shared source records stop the run. Do not delete shared records or images manually.

The prior library import tool remains separate: `private-item-library.mjs` imports only reviewed reusable templates into the same owner's own future campaigns. Original archived publisher text is not automatically eligible for import.
