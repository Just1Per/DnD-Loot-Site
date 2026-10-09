# CampaignAtlas — Phase 3: game-master workspace

Status: Phase 3 foundation. DM Tools now has World Building, Chapter Tracker and One Shots cards beside Item Controls, with expandable setup guides. Editors, persistence, delegated hosting and one-shot rosters are proposed below; the guide cards do not save records.

## Product direction

Everything your campaign needs in one place: character building and printable sheets for players, a magical item library, then one-shot ideas, world building and chapter trackers for game masters.

Keep the burgundy/gold palette, parchment surfaces and compact, readable Overview design. Build the new workspace inside the current campaign, retaining the existing distinction between global account roles and campaign membership.

## Approved direction and delivery order

1. **Workspace foundation (this delivery).** Four matching cards: Item Controls, World Building, Chapter Tracker and One Shots. Add descriptions, practical setup guides and contextual ? help inside DM Tools. Preserve the existing membership, item controls and character management.
2. **World editor.** Campaign introduction, linked regions, locations, NPCs and factions. Keep player-facing descriptions separate from private DM notes. Add save/reopen, search, revision conflict handling, archive and compact print.
3. **Chapter editor.** Ordered planned/active/completed chapters with scenes, objectives, linked world entries, recaps and an explicit milestone plan. The DM confirms and applies level changes in Character Builder.
4. **One-shot editor.** Focused adventures and side missions, linked to world entries and chapters, with scenes, delegated hosts, invitations and separate character rosters. Offer DM-created pre-generated sheets, player-created sheets or a mixture.
5. **Connections and finishing.** Publish chosen player material, cross-link records, restore archives, print selected run sheets and extend the role guides. No automatic idea-generation service is included in this plan.

See [Phase 3 architecture](phase-3-architecture.md) for data boundaries, permissions, character integration and acceptance tests.

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
