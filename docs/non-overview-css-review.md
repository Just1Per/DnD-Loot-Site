# Non-Overview UI stylesheet review

All 56 candidates were checked against current HTML and JavaScript, including dynamic template strings. Print, responsive, state selectors and compound pseudo-class branches remain when their ownership cannot be proved. Overview candidates are deferred.

| Candidate | Decision |
|---|---|
| `.btn-delete-char` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.hidden-item` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-derived-field` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-point-locked` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-add-page-menu` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-feature-chip-list` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-feature-chip` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-creature-picker` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-creature-attack-picker` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-overview-important-more` | Retain for the Overview pass |
| `.sheet-hp-tools` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-ability-total` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-identity-strip` | Retain for the Overview pass |
| `.sheet-page-grid` | Retain for the Overview pass |
| `.sheet-owned-item` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-gear-reference` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-inventory-campaign` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-inventory-settings` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-carry` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-inventory-loot` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-point-cost` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-dm-approval-grid` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-pact-slot-help` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.sheet-feat-result` | Retain: current HTML/JavaScript reference |
| `.sheet-catalog-result` | Retain: current HTML/JavaScript reference |
| `.site-eyebrow` | Retain for the Overview pass |
| `.campaign-selector-card` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.campaign-selector-name` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.campaign-selector-desc` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.campaign-selector-role` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.campaign-selector-arrow` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.campaign-selector-empty` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.hidden-from-players` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.watermark` | Retain for the Overview pass |
| `.no-char-hint` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.wish-admin-block` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.wish-count-block` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.edit-name` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.card-image-edit` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.card-art--edit` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.upload-image-btn--overlay` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.upload-progress` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.edit-description` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.owner-block` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.owner-label` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.level-badge--empty` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.admin-stats-grid` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.stat-card` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.stat-num` | Retain: current HTML/JavaScript reference |
| `.stat-label` | Retain: current HTML/JavaScript reference |
| `.table-actions` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.chars-cell` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.admin-char-name` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.admin-char-class` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |
| `.char-campaign` | Retain: current HTML/JavaScript reference |
| `.no-chars` | Absent from current rendering; remove standalone selector branches, retain complex shared branches |

## Removed selector branches

- `button-theme.css`: `.character-card-actions .btn-delete-char`
- `button-theme.css`: `.character-card-actions .btn-delete-char:hover`
- `button-theme.css`: `.item-card .visibility-toggle-btn.hidden-item`
- `button-theme.css`: `.character-card-actions .btn-delete-char`
- `button-theme.css`: `.character-card-actions .btn-delete-char:hover`
- `character-adobe-integration.css`: `.sheet-derived-field input`
- `character-adobe-integration.css`: `.sheet-derived-field select`
- `character-adobe-integration.css`: `.sheet-point-locked`
- `character-adobe-integration.css`: `.sheet-add-page-menu`
- `character-adobe-integration.css`: `.sheet-add-page-menu > summary`
- `character-adobe-integration.css`: `.sheet-add-page-menu[open] > summary`
- `character-adobe-integration.css`: `.sheet-add-page-menu > summary::-webkit-details-marker`
- `character-adobe-integration.css`: `.sheet-add-page-menu > div`
- `character-adobe-integration.css`: `.sheet-add-page-menu button`
- `character-adobe-integration.css`: `.sheet-add-page-menu`
- `character-adobe-integration.css`: `.sheet-add-page-menu`
- `character-adobe-integration.css`: `.sheet-add-page-menu > summary:hover`
- `character-adobe-integration.css`: `.sheet-add-page-menu[open] > summary`
- `character-adobe-integration.css`: `.sheet-add-page-menu > div button`
- `character-adobe-integration.css`: `.sheet-feature-chip-list`
- `character-adobe-integration.css`: `.sheet-feature-chip`
- `character-adobe-integration.css`: `.sheet-feature-chip.is-subclass`
- `character-adobe-integration.css`: `.sheet-feature-chip small`
- `character-adobe-integration.css`: `.sheet-creature-picker`
- `character-adobe-integration.css`: `.sheet-creature-attack-picker`
- `character-adobe-integration.css`: `.sheet-creature-attack-picker .sheet-help`
- `character-sheet.css`: `.sheet-hp-tools input`
- `character-sheet.css`: `.sheet-hp-tools`
- `character-sheet.css`: `.sheet-hp-tools label`
- `character-sheet.css`: `.sheet-hp-tools input`
- `character-sheet.css`: `.sheet-hp-tools small`
- `character-sheet.css`: `.sheet-hp-tools`
- `character-sheet.css`: `.sheet-ability-total`
- `character-sheet.css`: `.sheet-owned-item`
- `character-sheet.css`: `.sheet-owned-item .item-card`
- `character-sheet.css`: `#characterSheetDialog .sheet-hp-tools`
- `character-sheet.css`: `.sheet-gear-reference`
- `character-sheet.css`: `.sheet-gear-reference summary`
- `character-sheet.css`: `#sheetInventory .sheet-owned-item`
- `character-sheet.css`: `.sheet-inventory-campaign`
- `character-sheet.css`: `.sheet-inventory-settings`
- `character-sheet.css`: `.sheet-carry`
- `character-sheet.css`: `.sheet-inventory-loot`
- `character-sheet.css`: `.sheet-inventory-settings`
- `character-sheet.css`: `.sheet-point-cost`
- `character-vault-theme.css`: `#characterSheetPage .sheet-hp-tools`
- `character-vault-theme.css`: `#characterSheetDialog .sheet-hp-tools`
- `character-vault-theme.css`: `.character-sheet .sheet-ability-total`
- `character-vault-theme.css`: `.character-sheet .sheet-point-cost`
- `character-vault-theme.css`: `.character-sheet .sheet-inventory-loot`
- `character-vault-theme.css`: `.character-sheet .sheet-feature-chip`
- `character-vault-theme.css`: `.character-sheet .sheet-feature-chip.is-subclass`
- `character-vault-theme.css`: `.character-sheet .sheet-gear-reference`
- `character-vault-theme.css`: `.character-sheet .sheet-creature-attack-picker`
- `character-vault-theme.css`: `.character-sheet .sheet-dm-approval-grid`
- `character-vault-theme.css`: `.character-sheet .sheet-dm-approval-grid article`
- `character-vault-theme.css`: `.character-sheet .sheet-dm-approval-grid article>strong`
- `character-vault-theme.css`: `.character-sheet .sheet-dm-approval-grid article>div`
- `character-vault-theme.css`: `.character-sheet .sheet-pact-slot-help`
- `style.css`: `.campaign-selector-card`
- `style.css`: `.campaign-selector-card:hover`
- `style.css`: `.campaign-selector-name`
- `style.css`: `.campaign-selector-desc`
- `style.css`: `.campaign-selector-role`
- `style.css`: `.campaign-selector-arrow`
- `style.css`: `.campaign-selector-empty`
- `style.css`: `.campaign-selector-empty p`
- `style.css`: `.item-card.hidden-from-players`
- `style.css`: `.btn-delete-char`
- `style.css`: `.btn-delete-char:hover`
- `style.css`: `.visibility-toggle-btn.hidden-item`
- `style.css`: `.no-char-hint`
- `style.css`: `.wish-admin-block`
- `style.css`: `.wish-count-block`
- `style.css`: `.edit-name`
- `style.css`: `.edit-name`
- `style.css`: `.card-image-edit`
- `style.css`: `.card-art--edit`
- `style.css`: `.upload-image-btn--overlay`
- `style.css`: `.upload-image-btn--overlay:hover`
- `style.css`: `.upload-progress`
- `style.css`: `.edit-description`
- `style.css`: `.owner-block`
- `style.css`: `.owner-label`
- `style.css`: `.owner-block select`
- `style.css`: `.level-badge--empty`
- `style.css`: `.btn-delete-char`
- `style.css`: `.admin-stats-grid`
- `style.css`: `.stat-card`
- `style.css`: `.table-actions`
- `style.css`: `.chars-cell`
- `style.css`: `.admin-char-name`
- `style.css`: `.admin-char-class`
- `style.css`: `.no-chars`
- `style.css`: `.admin-stats-grid`
- `style.css`: `.chars-cell`
- `style.css`: `.admin-stats-grid`
- `style.css`: `.campaign-selector-card`
- `style.css`: `.campaign-selector-card:hover`
