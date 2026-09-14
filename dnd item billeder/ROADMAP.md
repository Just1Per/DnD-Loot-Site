# D&D Item Vault — Recommended Roadmap v1

This is the 9-step roadmap agreed for the larger architecture.

## 1. Foundation V2
Make campaigns the hard security/data boundary before adding more features.

- `campaigns/{campaignId}` as the container.
- `campaigns/{campaignId}/members/{uid}` as authoritative membership.
- `users/{uid}/campaigns/{campaignId}` as a fast per-user campaign index.
- Campaign-scoped `characters`, `saves`, and `itemState`.
- Keep `items/{itemId}` as a global read-mostly master catalogue.
- Move visibility, loot, highlight, owner, received date out of global items.
- Finish Firestore + Storage Security Rules.
- Add Firebase App Check and billing/budget alerts before public scale.
- Run dry-run migration, verify, then remove legacy collections/fields.

## 2. Invitation System
Use real invitations rather than trying to client-side map arbitrary email addresses to Firebase UIDs.

- DM creates invitation with email, campaign, intended role, status and expiry.
- Player sees/accepts invitation after sign-in.
- Trusted backend/Cloud Function finalizes membership and user campaign index.
- Email sending can be added later.

## 3. DM Tools
Build on campaign-scoped `itemState`.

- Item visibility.
- Looted state.
- Item owner / assignment.
- Highlights.
- Campaign settings.
- Member management.
- Optional activity/audit history.

## 4. DM Application / Approval
Separate global creator permission from campaign authority.

- User submits `dmRequests/{uid}`.
- Admin approves/rejects.
- Approval grants permission to create campaigns.
- Being an approved campaign creator must NOT make the user DM in every campaign.

## 5. Usage Limits
Enforce limits in trusted code, not only in the browser.

Initial targets:
- Max 10 members per campaign.
- Max 10 characters per player per campaign.

Use server-side transactions / Cloud Functions and counters for enforcement. Client checks remain only UX.

## 6. Dashboard + Landing Page
Turn campaign selection into a real signed-in dashboard and add a public landing page.

Dashboard ideas:
- My Campaigns.
- Invitations.
- Create Campaign.
- Recent Characters.
- DM Requests.
- Account/settings.

Landing page:
- Product explanation.
- Login/register.
- Feature overview.

## 7. Second Performance Pass
Optimize the global item catalogue as a versioned cache because it is read constantly and changes rarely.

- `catalogVersion` metadata.
- IndexedDB/local cache for the item catalogue.
- Only refresh catalogue when version changes.
- Store direct thumbnail URLs where possible.
- Use WebP/AVIF thumbnails for card grids.
- Consider serving versioned catalogue JSON through Firebase Hosting/CDN later.

## 8. Split `app.js` Into Modules
Do this after the schema and permission model are stable.

Suggested modules:
- `auth.js`
- `campaigns.repo.js`
- `items.repo.js`
- `characters.repo.js`
- `saves.repo.js`
- `item-state.repo.js`
- `library.js`
- `dm-tools.js`
- `admin.js`
- `images.js`
- shared UI/helpers

Do not perform the large refactor while the underlying data model is still moving.

## 9. Payments Last
Do not build payment architecture speculatively.

- First get real campaigns/users using the product.
- Learn which features actually create value.
- Then define free/paid limits and integrate billing.

---

## Guiding architecture principle

Global data:
- user identity/profile
- global item master catalogue
- platform-level admin / campaign-creator capability

Campaign data:
- membership/roles
- characters
- saves
- item visibility
- loot/highlight/owner state
- campaign settings

A global `dm`/creator capability means **may create campaigns**. Actual DM authority must always come from the membership/ownership of the specific campaign.
