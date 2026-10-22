# Focused refresh after Library presentation changes

Highlight, item visibility and Quick show by rarity write only item metadata. They now request the campaign item collection once, then update the same Library, party and character displays. Previously each action also requested inventory, saves and DM supply even though the action changes none of those collections.

This reduces the follow-up collection requests from four to one for a DM. It is a request-count improvement; no production timing or total billed-document reduction has been measured. Existing unrelated in-memory state remains available. No persistent cache is added.

Manual Refresh Items, loot/use/assign/transfer, item creation/editing/removal, inventory upgrade and bulk stock/claim-policy controls retain full refresh. A focused action no longer opportunistically reloads unrelated changes made in another session; use Refresh Items to check those. The Guide explains this action.

A delayed metadata write returns without patching or refreshing if the account, campaign-load generation, campaign or management permission changes. A rarity batch stops before sending additional writes in the changed scope. SDK write/read errors retain the existing error feedback and retry behavior. Database authorization is unchanged.

Validation: `npm --prefix tests run test:library-item-refresh` uses the actual campaign loaders and records SDK collection requests through real button clicks. It verifies the 4 → 1 reduction, ownership/saves/supply preservation, complete explicit refresh, denied writes, failed refresh recovery and delayed account/campaign/generation/role changes, including interruption of a rarity batch. Existing character-workspace and campaign-item-removal browser tests cover inventory and saved-item navigation.

No Firestore or Storage rules, indexes, production data migration, or deployment required.
