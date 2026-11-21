# Invitation email backend

Invitation emails are the only enabled email category in this implementation. Delivery is **off by default** and nothing is deployed or sent by preparing/merging the PR. The existing Hosting workflow deploys the website only. Firebase Authentication's email/password switch is independent of these invitation emails.

The isolated `functions/email` codebase contains two Node 22 Firebase Functions in `europe-west1`: `queueCampaignInvitationEmail` watches new `campaignInvites` documents; `deliverAccountEmail` processes their private `emailDeliveries` jobs. The shared transport uses Resend's HTTPS API through native `fetch`, with its credential in Secret Manager. The existing `functions/package.json` and local migration/operator tools remain separate.

## What the player receives

One HTML/plain-text invitation identifies the campaign and links to the configured CampaignAtlas website. An email-address invitation uses its validated address; an invitation to a registered user resolves their current Firebase Auth email on the server. A player signs in or creates an account with that address, then accepts or declines on the existing dashboard. Opening the email never accepts an invitation or grants membership.

No DM notes, loot, campaign-change emails, mailing lists or recurring messages are connected. The bell and its read/dismiss state continue independently. Invitation creation and dashboard acceptance still work when email is disabled, suppressed or unavailable; the website does not claim that an email was delivered.

## Activate later

Run these steps from the repository after reviewing/merging the PR, or from its branch when preparing deployment. No keys are needed to run the tests.

1. Enable Firebase's **Blaze** billing plan for `dnd-loot-site`. Set a billing alert appropriate to your group. The concurrency/daily limits below reduce volume; they are not a hard cap on Firebase billing.
2. Create a Resend account, verify your sender domain using its DNS instructions, and create a restricted sending API key. Use a real sender such as `CampaignAtlas <invites@your-domain>`; Resend's sandbox/test sender cannot deliver invitations to arbitrary group members.
3. Install backend dependencies:

   ```bash
   npm ci --prefix functions/email --ignore-scripts --no-audit --no-fund
   ```

4. Copy `functions/email/.env.example` to `functions/email/.env.dnd-loot-site`. Set `EMAIL_FROM` to the verified sender and `EMAIL_SITE_URL` to your actual HTTPS website origin, without paths or query strings. Optionally set a single `EMAIL_REPLY_TO` address. Keep `EMAIL_DELIVERY_ENABLED=false` for the first deployment. The local config file is Git-ignored and excluded from uploaded source; Firebase passes its parameters to the functions separately.
5. Store the provider key interactively in Firebase Secret Manager. Do not put it in browser code, GitHub, Firestore or the `.env` file:

   ```bash
   firebase functions:secrets:set RESEND_API_KEY --project dnd-loot-site
   ```

6. Deploy the codebase and its explicit private-queue rules. Firebase may prompt to enable Functions/Cloud Build/Eventarc/Secret Manager APIs and select an Artifact Registry cleanup policy. The worker needs the configured secret even for a disabled first deployment.

   ```bash
   firebase deploy --only functions:email,firestore:rules --project dnd-loot-site
   ```

7. When ready, change `EMAIL_DELIVERY_ENABLED=true` in the local config and redeploy:

   ```bash
   firebase deploy --only functions:email --project dnd-loot-site
   ```

8. Create one **new** invitation to an address you control. Verify the provider receipt/inbox and the existing sign-in/dashboard acceptance flow. Old invitations are not automatically mailed. If your test address already has a pending invitation, deliberately cancel it in the existing UI before creating a replacement. No live verification emails have been sent by the implementation/tests.

To turn delivery off, set `EMAIL_DELIVERY_ENABLED=false` and redeploy the codebase. Future trigger invocations stop queueing/sending; a message already accepted by the provider cannot be recalled. Enabling email again does not replay suppressed jobs or existing invitations.

## Defaults and delivery behaviour

| Setting or limit | Default |
| --- | --- |
| `EMAIL_DELIVERY_ENABLED` | `false` |
| `EMAIL_FROM` | Empty; required and validated when enabling |
| `EMAIL_REPLY_TO` | Empty; optional |
| `EMAIL_SITE_URL` | `https://dnd-loot-site.web.app` |
| `EMAIL_DAILY_LIMIT` | 50 reservations across the project per UTC day; configurable 1–1000 |
| Per inviter / recipient | At most 20 / 5 reservations per UTC day |
| Function capacity | Zero idle instances; at most two instances per function; concurrency one |
| Retry policy | Up to five claimed attempts, exponential backoff starting at 30 seconds; respect provider `Retry-After` up to one hour |

Reservations are atomic and are not refunded on failure. They limit newly queued invitations, not provider retry requests; duplicate event deliveries do not reserve again. Suppressed invitations remain pending on the website. There is no automatic bulk resend/backfill or client-accessible email endpoint.

Each invitation has one deterministic job ID and one provider idempotency key. A short transactional lease excludes concurrent workers; the rendered payload stays frozen during retries. If the provider accepted an email but the receipt write failed, a retry uses the same payload/key. The worker stops for manual review after 23 hours from the first attempt, within Resend's 24-hour idempotency window. It never blindly retries uncertain sends after that window. Source invitations older than 24 hours are ineligible for automatic email, using Firestore's server creation time rather than a browser timestamp.

The worker rechecks live pending status, recipient identity, campaign existence and the inviter's current owner/DM authority before contacting the provider. Changes made while a provider request is already in flight cannot unsend it. Recipient addresses come from the invitation or Firebase Auth, not a browser-written outbox. Secret values, provider response bodies and recipient addresses are not written to logs.

## Monitoring and retention

Only backend Admin SDK access can read/write `emailDeliveries` and `emailRateLimits`; even website admins cannot access them through the client SDK. View records through the Firebase/Google Cloud console with your operator permissions. `sent` means **accepted by the provider**, not confirmed inbox delivery; use Resend's dashboard for bounces/delivery. Bounce webhooks and inbox tracking are outside this first release.

Delivery records expose `status`, `reason`, `attempts`, `retryAt`, `providerId` and timestamps. `needs-review` means an outcome may be uncertain: check the provider before deciding whether a new invitation is appropriate. Do not clear the receipt, reset an old job or change its frozen payload to force a resend.

Jobs have `expiresAt` 30 days after creation; quota documents have seven-day retention markers. Enable Firestore TTL on the `expiresAt` field for collection groups `emailDeliveries` and `emailRateLimits` in the console if automatic cleanup is wanted. Until TTL is configured, these timestamps do not delete records. Delivery payloads contain the recipient address and campaign invitation text, and should remain backend-private.

## Tests and extension points

```bash
npm --prefix functions/email test
node scripts/test-profiles.cjs install emulator
node scripts/test-profiles.cjs run emulator -- node tests/dependencies/emulator/node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-vault-test --config firebase.workspace-test.json "node tests/invitation-email-rules.cjs"
```

Tests use synthetic addresses, a fake provider and a demo Firestore emulator; they never contact Resend or production Firebase. The SDK wiring test also proves the queue trigger returns disabled without making database/provider requests.

To add another email category later, add an explicit source adapter with its own audience/access checks and opt-in preference policy, a template in `templates.cjs`, and a corresponding type validation/dispatch branch in `service.cjs`. Reuse the private job store, status/lease handling and provider transport. Give each type its own deterministic source identity and tests. Changing providers also requires checking that provider's idempotency retention and adjusting the retry window. No other category or user preference is implicitly opted in by invitation delivery.
