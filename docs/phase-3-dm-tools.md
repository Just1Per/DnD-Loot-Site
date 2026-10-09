# CampaignAtlas — Phase 3: game-master workspace

Status: planned after Phase 2. These tools are not implemented or advertised as available in Phase 2.

## Product direction

Everything your campaign needs in one place: character building and printable sheets for players, a magical item library, then one-shot ideas, world building and chapter trackers for game masters.

Keep the burgundy/gold palette, parchment surfaces and compact, readable Overview design. Build the new workspace inside the current campaign, retaining the existing distinction between global account roles and campaign membership.

## Proposed implementation order

1. **DM workspace foundation.** Add clearly named DM Tools navigation for Adventures, World and Chapters. Reuse existing campaign membership and permissions. Keep campaign management (members, edition policy, feats, loot and bonus advancement) accessible. Define campaign-scoped storage and migration/versioning before adding editors.
2. **One-shot ideas and adventures.** Save original ideas with title, level range, player count, estimated duration, premise and hooks. Expand an idea into scenes, encounters, NPCs, locations, rewards and preparation notes. Support drafts, editing, search, duplication and archive, plus a compact printable run sheet. Start with a manual editor and original templates; automatic idea generation needs its own scope decision.
3. **World building.** Create linked locations, regions, NPCs, factions and organizations with custom fields and notes. Cross-reference existing characters and campaign items rather than duplicate them. Allow the DM to choose what players can see, keeping secrets private by default. Add map/image uploads only with explicit ownership, storage and size rules.
4. **Chapter tracker.** Order chapters and scenes, mark planned/active/completed, track objectives and session recaps, and link relevant world records and rewards. Show the next chapter and unresolved hooks in a compact campaign summary. Provide a player-visible recap separate from DM notes.
5. **Connections and finishing.** Link chapters to adventures and world entries, add search and filters, restore archived entries, export/print selected records, and extend role guides and contextual ? help to every new editor.

## Acceptance criteria for each delivery

- Campaign owners and campaign DMs can manage only their campaign's records. Players see only explicitly published material. A global admin role does not silently bypass campaign membership.
- Test read/write permissions against another campaign, a player account, removed membership and an account that changes campaigns while an editor is open.
- Save, reopen and edit without losing fields or closing an editor after each keystroke. Handle conflicts and unsaved changes deliberately.
- Confirm archive/reset actions preserve the intended records and cannot remove unrelated character sheets, notes or catalogue entries.
- Verify desktop and mobile layout, keyboard/touch access, clear empty states, and compact print output without blank areas or clipping.
- Keep original content, publisher references and licensed SRD material clearly identified. Preserve source attribution and review public access to any material relying on the Fan Content Policy, which restricts registration gates. Private campaign records and account functionality require a separate access design.

## Phase 2 handoff

Phase 2 establishes the CampaignAtlas identity and metadata, a public Rules Sources & Legal Information page, separate Fan Content and Creative Commons notices, corrected footer ownership wording, field help and player/DM/admin onboarding guides. Existing legal paragraphs and attribution links are retained. The current logo remains in use after visual inspection; that inspection does not establish the provenance of uploaded artwork.

Official references reviewed on 2026-10-09:

- https://company.wizards.com/en/legal/fancontentpolicy
- https://www.dndbeyond.com/srd
- https://creativecommons.org/licenses/by/4.0/

The Phase 3 list is a handoff, not implementation approval for a generation service, public sharing platform or new hosting/deployment.
