# Private item catalogue capture and migration handoff

The [complete proposals](reports/item-catalogue-decisions.md) cover all 659 reviewed records: 302 licensed replacement payloads and 357 withholding/retirement recommendations. They are unapproved. Original records and artwork must be privately preserved and verified before production changes. The October 19 owner instruction preserves ChatGPT-generated illustrations: the 302 retained items keep their art; the 357 retired items and their images move into the already-created private destination campaign. Shared image files used by retained variants remain shared. Do not create a new campaign or strip all illustrations. The migration checks the exact destination ID, name and owner before writing. Existing campaign copies, inventories and character gear are outside this cleanup.

## Why an owner-side capture is needed

The cloud machine's existing credential binding could not authenticate the Firebase export: the Firebase Admin credential loader reported a missing service-account identity field. No credential values were inspected or copied. The old sanitized report cannot establish that today's production records still match.

Use an existing authorized local Google Cloud operator session to read Firestore. The capture command reads only the selected campaign identity and complete root item collection. It makes no database or Storage writes, downloads no artwork and grants no approval. Private exports stay on your computer; the separate shareable status contains destination identity, item counts, changed document IDs and readiness flags.

## Exact steps for the owner

1. Use the prepared operator bundle or a checkout containing this change. Open a terminal in its root. Node 22 or 24 is supported. Install locked operator dependencies:

   ```sh
   npm ci --prefix functions --no-audit --no-fund
   ```

2. Use existing Application Default Credentials for an account permitted to read the project. If you use a local Google Cloud CLI login and have not configured ADC, run:

   ```sh
   gcloud auth application-default login
   ```

   Complete the browser login with your authorized project account. Firebase CLI login alone does not supply Admin SDK ADC. If `GOOGLE_APPLICATION_CREDENTIALS` is set, the SDK uses that file before local ADC: keep it only if it is an authorized Google credential for this project. Do not paste credentials into chat or commit them. No new service-account key is needed just for this capture. [Google's ADC instructions](https://cloud.google.com/docs/authentication/provide-credentials-adc).

3. Choose a new private directory outside every Git checkout. The example uses your local home directory. Existing capture files are never overwritten.

   ```sh
   mkdir -m 700 "$HOME/campaignatlas-item-review-2026-10-18"
   node scripts/prepare-item-catalogue-decisions.mjs capture \
     --campaign YOUR_CAMPAIGN_DOCUMENT_ID \
     --directory "$HOME/campaignatlas-item-review-2026-10-18"
   ```

   Replace `YOUR_CAMPAIGN_DOCUMENT_ID` with the exact destination ID already supplied in chat; it is intentionally absent from this public document. The command reads the actual campaign name, owner UID and inventory version, then captures the root collection. It writes owner-only files (0600):

   - `target.json`: exact destination identity read from Firestore.
   - `root-snapshot.json`: **private original records**, potentially including restricted descriptions and image tokens. Never attach it to chat, a public issue or artifact.
   - `item-decisions.json`: a complete **unapproved** worksheet, created only if every current item ID and content hash matches the review.
   - `shareable-review-status.json`: sanitized destination/readiness metadata. This is the only file to send back.

   A successful capture reports `productionWrites: 0`. If `reviewMatches` is false, keep the private snapshot and send only the shareable status. It lists changed/added/removed IDs without exposing original prose. Do not force old decisions onto changed records.

4. Confirm that the name/owner in the shareable status identify the intended destination and send that status back. An inventory version other than 2 is a separate prerequisite; do not migrate or upgrade merely to bypass a check.

## Steps after capture

These are subsequent operations, not instructions to apply now:

- Review exact replacement text, edition/variant choices, six SRD renames, temporary bonus-armor withholding and homebrew decisions. Resolve rights questions before approving decisions. The tool does not impersonate the owner or fill approval dates.
- Arrange a durable private backup of originals and legacy artwork. This capture is not a complete backup, and ephemeral cloud task storage is not durable storage.
- Generate a pinned offline plan using exact campaign name/owner and the unchanged snapshot. Run the existing authenticated read-only `check` for inventory readiness, bucket privacy, artwork paths and source revisions.
- Present the concrete plan, backup destination and rule changes for review. Only then perform separately approved migration and rule publication described in [the migration guide](reviewed-item-catalogue.md).

Fix the precise failed read operation if access or network settings are missing. Do not weaken rules, disable verification or publish private exports.
