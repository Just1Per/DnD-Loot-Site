D&D ITEM VAULT — FOUNDATION V2 MERGED BUILD
===========================================

This package merges:
- the campaign-first UI/structure from the uploaded Claude build
- the performance work from the previous performance patch
- several architecture corrections needed before multi-campaign growth

FILES
-----
index.html
css/style.css
js/app.js
js/migration-v2.js
ARCHITECTURE.md

IMPORTANT
---------
This is a PREVIEW / FOUNDATION migration, not a blind drop-in over production.

Do NOT run the old migration.js from the Claude package.

The old migration copies characters and wishes, but it does not build the
fast user campaign index and it does not solve campaign-specific loot state.

Use js/migration-v2.js instead.

BEFORE DEPLOYING
----------------
1. Back up Firestore.
2. Deploy/test this on a preview Firebase Hosting channel if possible.
3. Your Firestore Security Rules must allow the new paths:
     campaigns/{campaignId}/members/{uid}
     campaigns/{campaignId}/characters/{charId}
     campaigns/{campaignId}/saves/{saveId}
     campaigns/{campaignId}/itemState/{itemId}
     users/{uid}/campaigns/{campaignId}
4. I did not overwrite/propose exact production rules because your current
   firestore.rules file was not included. Review rules before live migration.

MIGRATION
---------
Upload js/migration-v2.js beside firebase.js.

While logged in as admin, open DevTools Console and run:

  const { runMigration } = await import("/js/migration-v2.js");

First do a dry run:

  await runMigration({ dryRun: true });

Read every warning.

If it looks correct:

  await runMigration({ dryRun: false });

The migration intentionally does NOT delete:
- global characters/
- global wishes/
- old itemVisibility/
- old looted/highlighted/owner fields on item documents

Keep them until you have verified the new app.

WHAT CHANGED ARCHITECTURALLY
----------------------------
Global items are master content only.

Campaign-specific state now lives in:

  campaigns/{campaignId}/itemState/{itemId}

That includes:
- visible
- looted
- highlighted
- owner
- receivedDate

This prevents Campaign A from changing Campaign B's copy of an item's loot state.

Campaign membership is authoritative at:

  campaigns/{campaignId}/members/{uid}

and mirrored for fast campaign selection at:

  users/{uid}/campaigns/{campaignId}

PERFORMANCE CHANGES
-------------------
- Item images no longer block page startup.
- Storage URLs are loaded near the viewport.
- Image URLs are cached in sessionStorage.
- items.js is dynamically imported only if the item collection is empty.
- Empty-catalogue check reads max 1 Firestore item.
- Item catalogue begins loading in parallel with campaign setup.
- Campaign selector does not wait for every image.
- Render-time maps avoid repeated array scans for every item card.
- Cards are inserted with DocumentFragment.
- Search is debounced.
- Off-screen cards use CSS content-visibility.
- Normal players load only their own saves.
- DMs load users from active campaign membership instead of all platform users.
- User campaign index avoids the long-term "load every campaign then check membership" pattern.

NOT YET IMPLEMENTED
-------------------
- Invitations
- DM application workflow
- server-enforced usage limits
- email sending
- payments
- full item catalogue version/IndexedDB cache
- thumbnailUrl stored directly on item docs
- modular split of app.js
- production Firestore rules

Those are deliberately left for the next phases.

TEST CHECKLIST
--------------
After migration test at least:

Admin:
- can select campaigns
- can edit master items
- can manage campaign visibility
- can loot/highlight/assign items
- can edit users

DM:
- sees only campaigns they belong to / own
- can manage visibility
- can loot/highlight/assign items
- cannot edit master item content unless also admin

Player:
- sees campaign selector
- can enter active campaign
- sees only visible items
- can create character
- can save/unsave items
- sees assigned loot

Multi-campaign:
- hide an item in Campaign A
- verify it remains visible in Campaign B
- loot an item in Campaign A
- verify it is NOT looted in Campaign B

Performance:
- hard refresh with DevTools Network open
- verify there is not one Firebase Storage URL lookup for every item at startup
- scroll down and verify images begin loading as they approach the viewport

See ARCHITECTURE.md for the recommended roadmap.
