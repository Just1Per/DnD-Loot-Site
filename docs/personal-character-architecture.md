# Personal characters and campaign attachment (proposal)

Status: design only. The current My Characters cleanup still creates campaign characters.

## Ownership and storage

Use `users/{ownerId}/characters/{characterId}` for a personal identity and a private sheet subdocument. The player owns this aggregate before, during and after a campaign. Keep IDs stable. My Characters reads saved identity fields; the sheet is the only player editor for name, class and level.

Store campaign attachment separately at `campaigns/{campaignId}/characterLinks/{characterId}` with owner ID and attachment status. Initially allow one active attachment per character to avoid different campaigns changing the same playable state. Campaign loot, DM advancement, catalogue overrides and permissions remain campaign-scoped. Leaving a campaign preserves the personal character and does not copy campaign-owned loot into personal gear.

## Application boundary

Introduce a character repository with an explicit context: character ID, owner ID, personal/campaign scope and optional campaign ID. Loading, saving, gear, printing and rules evaluation consume this context instead of assuming `activeCampaign`. Existing campaign characters remain supported through a legacy adapter during migration. Retain revision checks and the existing serialized sheet envelope.

Personal mode offers character building, personal equipment, feats, spells, notes, portraits and printing. Campaign loot and DM controls become available only after attachment. Personal mode has no campaign catalogue overrides; a player chooses a base rules edition.

## Attach flow

The player selects a campaign where they have an active membership with character access. Validate the edition and character choices against that campaign's policy, including hidden/custom feats. Show incompatibilities and let the player resolve them before attachment; never silently delete choices. Commit the link and active-attachment marker atomically. Access rules must validate ownership, membership and campaign policy; browser checks alone are insufficient.

The owner can access their own sheet. A DM can access it only while the character is actively attached to a campaign they manage. Other players, unrelated DMs and former campaign DMs receive no private-sheet access. Campaign summaries expose only the fields necessary for the roster. Any detach/archive/delete operation must explicitly clean up links and ownership references.

## Migration and verification

1. Add repository adapters and personal-character security rules without moving existing data.
2. Enable creation outside campaigns and the personal dashboard.
3. Add policy-aware attach/detach and campaign projections.
4. Migrate existing characters using stable IDs, backups and idempotent checkpoints. Verify identity, sheet revision, serialized data and inventory associations before retiring any legacy paths.

Test personal saves without a campaign, unauthorized reads/writes, unrelated/former DM access, campaign policies, simultaneous attachments, stale revisions, logout/campaign switching, inventory isolation, detach preservation and existing campaign characters. Migration and security work belong in a dedicated PR before enabling this feature.
