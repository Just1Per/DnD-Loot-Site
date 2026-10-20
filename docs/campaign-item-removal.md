# Remove an imported item from a campaign

In Library → Items, campaign DMs can choose **Remove from campaign** on a campaign item. The confirmation names the item and explains that only this campaign copy and its available supply will be removed. The shared catalogue template, its artwork and other campaigns' copies stay unchanged. This control is separate from the global administrator's **Delete root item** action and from a character's inventory actions.

If a character owns any copies, removal is blocked with directions to return them using Unloot in Party & Loot. The existing stock-revision check prevents a concurrent assignment from being lost between the inventory check and removal. The source item and supply are removed atomically. A repeated removal reports that the item is already gone. Saved bookmarks can become unavailable after their source campaign item is removed.

The confirmation starts with Cancel focused and supports Escape. Changing campaign or account invalidates it. Only a campaign DM can remove campaign items; global administrator status alone does not grant campaign-item permission.

No Firestore or Storage rule changes are required. No production items were removed, and no deployment or migration was performed during implementation.

`npm --prefix tests run test:item-removal` covers imported-copy/catalogue isolation, owned-copy protection, concurrent stock changes, unauthorized accounts, repeat removal, UI confirmation, cancellation, account/campaign changes and mobile dialog accessibility.

`test:item-removal-rules` also verifies the real Firestore permissions for campaign DM removal, player/admin/foreign-campaign denial, and retained global/other-campaign templates.
