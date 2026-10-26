# Druid: Wild Companion

From actual **2024 Druid level 2**, Combat → **Summon familiar in Companions** opens a dedicated Wild Companion card. Choose an eligible CR 0 Beast and exactly one payment: a Wild Shape use, an ordinary spell slot, an available Pact Magic slot or an available created Druid slot. Casting takes a Magic action and waives Material components; coins and spell-preparation choices are unchanged. Ordinary, Pact and created slots remain separate. Created slots expire at Long Rest under the agreed table rule. Failed validation or a full choice map spends nothing.

The selected form uses the pinned 2024 SRD creature statistics, including its own mental abilities and Initiative. It is a **Fey familiar**. Find Familiar allows CR 0 Beasts of different sizes, not just Tiny creatures; swimming/flying forms are not gated by the Druid’s Wild Shape movement limits. Pact-specific alternative forms and circle-specific stat modifications remain separate work.

The 2014 base Druid is unchanged. The optional Tasha’s legacy feature is not automatically granted by this implementation; existing manual familiar/companion cards remain available.

## One familiar and separate HP

One managed familiar is retained. If one already exists, or the character has manual familiar cards, a new casting requires an explicit one-familiar acknowledgement. It changes the active familiar’s form and charges the selected resource; previous manual cards remain reference records and are never deleted or overwritten. Casting again resets the managed form’s base statistics.

The dedicated card tracks current, maximum and temporary familiar HP. Raising maximum HP for a table-resolved effect does not automatically heal; record that healing separately. Its damage consumes its temporary HP first and never damages the owner or the owner’s Wild Shape form. At 0 HP, or maximum HP 0, the familiar disappears and needs another paid casting to return. It does not use the player’s saving-throw proficiency, mental scores or class bonuses automatically.

A familiar cannot attack under the base spell. The card explains its own Initiative, telepathy, seeing through its senses and Reaction-based touch-spell delivery. Positions, targets, allied buffs and class exceptions remain table-resolved.

## Presence and expiry

- **Send to pocket dimension / Bring familiar back:** Magic actions, no new casting payment. Current, maximum and temporary HP remain saved; returning does not heal or refresh its lifetime.
- **Dismiss familiar permanently:** a contextual confirmation explains that another paid casting is required. The record is retained, rather than deleting manual cards.
- **Long Rest:** expires the familiar even if it was in a pocket dimension, the resource pools were already full or the character’s edition/class changed after summoning. Combat’s Long Rest feature reset, Spells’ Long Rest slot reset and the catalogue Long Rest action all apply expiry. The familiar card also offers **Record Long Rest expiry**, which ends only this familiar without restoring other resources.

Short Rest, initiative and turn resets do not expire it. A paid casting is not exposed as an undoable generic Wild Shape other-feature spend. Summoning follows normal spellcasting availability, including the current own Wild Shape/Beast Spells gate; recorded incapacitation prevents casting and presence actions. Independent familiar damage can still be tracked while its owner is incapacitated.

## Persistence, loading and tests

The managed record uses the existing normalized class-choice string-array map, with ordinary slot usage and the established independent Pact counter. All record/payment changes are committed together. There are no new top-level sheet fields, rule changes or migrations. Catalogue data is shared with the deferred Wild Shape catalogue and retains source attribution; loading failures provide Retry without spending resources. A stale account/campaign confirmation cannot dismiss another context’s familiar. A shared public catalogue request refreshes the currently valid sheet after a context switch without modifying the previous sheet.

Guide and inline/section help explain the feature. Stats and HP remain in a separate card from the normal character, their own Wild Shape and the existing manual companion cards. Print includes the familiar’s status and source. The related odd-level Wild Shape duration display now follows the general round-down rule in both editions.

Engine and real-browser tests cover levels 1–20, unlock/source gates, forms and sizes, Wild Shape/ordinary/Pact payments, exhaustion, one-familiar confirmation, HP and max/temp adjustments, pocket return, 0 HP, Long Rest and other reset events, class/source changes, save/reopen, stale confirmation, failed loading, manual-card preservation, print, responsive sizing and accessibility.

**Firestore and Storage rules are unchanged. No production deployment or data migration is performed.**

Sources: [2024 Druid: Wild Companion](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), [Find Familiar](https://www.dndbeyond.com/sources/dnd/br-2024/spell-descriptions), [general Round Down rule](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game).
