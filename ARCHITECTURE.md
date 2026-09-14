# D&D Item Vault — Recommended Foundation Architecture

This document merges the campaign-first idea with a few changes needed for performance,
multi-campaign correctness, and future growth.

## Core rule

`items/{itemId}` is the master catalogue only.

Anything that can differ between two campaigns must **not** live on the global item:
visibility, looted status, owner, highlight state, received date, etc.

## Firestore layout

```text
users/{uid}
  name
  email
  emailLower
  role: ["viewer" | "player" | "dm" | "admin"]
  created

  campaigns/{campaignId}                 # fast membership index
    role: "player" | "dm"
    status: "active" | "invited"
    joinedAt

campaigns/{campaignId}
  name
  description
  ownerId
  dmId                                  # compatibility during transition
  defaultItemVisible: true
  schemaVersion: 2
  created
  updatedAt

  members/{uid}                         # authoritative campaign membership
    uid
    role: "player" | "dm"
    status: "invited" | "active"
    joinedAt

  characters/{characterId}
    userId
    name
    class
    level
    active
    created

  saves/{saveId}
    userId
    characterId
    itemId
    created

  itemState/{itemId}                    # sparse campaign-specific overrides/state
    visible                             # optional; falls back to campaign default
    looted
    owner
    highlighted
    receivedDate

items/{itemId}                          # global master catalogue
  name
  category
  rarity
  source
  campaign                              # source/adventure metadata, not user campaign
  description
  properties
  classes
  attunement
  quote
  imageUrl / thumbnailUrl               # recommended future change
```

## Why the per-user campaign index exists

Firestore is excellent when the document path is known, but the shape

`campaigns/{campaignId}/members/{uid}`

is awkward for building a fast "show me my campaigns" screen. The Claude version first
loads every campaign and then checks a membership document for each campaign. That becomes
an N+1 query pattern as the service grows.

The small mirrored index under `users/{uid}/campaigns` means the campaign selector loads
only the user's memberships and then the corresponding campaign documents.

The campaign `members` document remains authoritative. The user-side document is a query
index/cache and must always be written together with membership changes.

## Global role vs campaign role

These are different concepts.

Global role:
- `admin`: platform administration
- `dm`: permission to create campaigns (after DM approval)
- `player` / `viewer`: account-level labels

Campaign membership role:
- `dm`: manages that specific campaign
- `player`: participates in that specific campaign

This lets one person DM Campaign A and play Campaign B without giving them DM powers in B.

## Invitation model

Do not require the DM's browser to know a Firebase UID from an email address. The normal
Firebase client SDK cannot securely look up arbitrary Auth users by email.

Recommended production flow:

```text
invitations/{inviteId}
  campaignId
  emailLower
  invitedBy
  campaignRole: "player"
  status: "pending" | "accepted" | "revoked"
  createdAt
  expiresAt
```

A callable Cloud Function should:
1. validate that the caller is a DM for the campaign,
2. enforce the member cap,
3. create the invitation,
4. optionally send email later.

When accepted, one transaction/function writes:
- `campaigns/{id}/members/{uid}`
- `users/{uid}/campaigns/{id}`
- invitation status = accepted

## Item visibility

Avoid creating one visibility document for every item in every campaign if possible.

Use:
- `campaign.defaultItemVisible`
- sparse `itemState/{itemId}.visible` overrides

Only exceptions need documents.

A later version can add campaign-level rarity/category rules so "hide every Legendary
item" becomes one update instead of hundreds of writes.

## Loot

Loot is campaign state, not master item data.

Never write `owner`, `looted`, `highlighted`, or `receivedDate` back to `items/{itemId}`.
Otherwise changing Blackrazor in one campaign changes it for every campaign.

## Saves

The merged build keeps campaign-level `saves` because it makes DM wishlist views simple.
New saves use a deterministic document id based on character + item to prevent duplicates.

If the product grows much larger, an alternative is:

`campaigns/{id}/characters/{charId}/saves/{itemId}`

and a collection-group query for DM views.

## Performance direction

### Current merged build
- does not resolve every Storage URL before first paint
- resolves artwork near the viewport with IntersectionObserver
- caches Storage URLs for the session
- dynamically imports the legacy item seed only when Firestore is empty
- uses a one-document emptiness check
- paints campaign selection while the item catalogue loads
- builds lookup maps once per render instead of repeatedly scanning arrays
- renders cards through a DocumentFragment
- debounces search
- uses CSS `content-visibility` for off-screen cards
- avoids loading the global users collection for ordinary players
- loads only a player's own saves

### Next performance milestone
The global item catalogue is read-heavy and changes rarely. Before a large public launch,
use one of these:

**Option A — recommended for this app:** versioned catalogue cache.
- `meta/catalog` contains a version number.
- item data is cached in IndexedDB.
- startup reads one version document.
- only reload the catalogue when the version changes.

**Option B:** serve a versioned compressed `items.json` from Firebase Hosting/CDN.
This is extremely fast and cheap for a mostly-static catalogue.

Store `thumbnailUrl` directly on each master item. The library grid should load a small
WebP/AVIF thumbnail, not full-resolution artwork and not a Storage metadata lookup per card.

## Limits

A client-side "10 characters / 10 members" check is good UX, but it is not security.

Before public launch, enforce limits in a callable Cloud Function or trusted backend
transaction. Client-side checks alone can be bypassed.

Suggested campaign fields later:
- `memberCount`
- `plan`
- `limits.maxMembers`
- `limits.maxCharactersPerUser`

## Suggested implementation order

1. Foundation v2 schema + migration + rules
2. Campaign membership / campaign selector
3. Campaign-specific item state (visibility + loot + owner + highlight)
4. Invitation + accept/reject flow
5. DM application / account capability approval
6. Secure usage limits
7. Landing/dashboard UX
8. Catalogue cache + direct thumbnails
9. Split monolithic app.js into modules
10. Payments only after real usage validates the product

## Future module layout

```text
js/
  app.js
  firebase.js

  core/
    auth.js
    roles.js
    state.js

  data/
    campaigns.repo.js
    characters.repo.js
    items.repo.js
    saves.repo.js
    users.repo.js

  features/
    campaign-selector.js
    library.js
    characters.js
    dm-tools.js
    admin.js
    invitations.js

  ui/
    cards.js
    modals.js
    filters.js
    images.js
```

Do not split into modules merely for style. Split when the v2 schema is stable so each
module can own a clear responsibility.
