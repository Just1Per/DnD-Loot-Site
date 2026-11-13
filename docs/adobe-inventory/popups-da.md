# Adobe-popups og afhængigheder

Genereret med `node scripts/audit-adobe-popups.cjs`. Dette er en statisk kortlægning, ikke et løfte om fuld funktionel paritet. Gentagne IDs er samme popup-familie. Testreferencer betyder, at testen nævner id’et; de er ikke i sig selv et bestået testresultat.

Der er 45 registrerede popup-familier og 29 editor-routes.

## Popup-familier

| Popup | Type | Indgang | Afhængighed / hvad skal bevares | Kode |
| --- | --- | --- | --- | --- |
| sheetAttackPicker | shared-dialog | Add/edit attack fra Combat | Bevar action-renderer og dens handlers; åbnes også fra bridge. | [character-action-ui.js:6](../../js/modules/character-action-ui.js#L6) |
| adobeAbilityDialog | adobe-dialog | Ability-/skill-felter eller Special features | Eget draft; bruger fælles session/form-sync. | [character-adobe-ability-ui.js:7](../../js/modules/character-adobe-ability-ui.js#L7) |
| adobeAttackChoiceMenu | adobe-menu | Attack name-felt | Kan åbne spellvalg og attack row-menu. | [character-adobe-attack-menu.js:15](../../js/modules/character-adobe-attack-menu.js#L15) |
| adobeBackgroundChoiceDialog | adobe-menu | Baggrundens traits/ideals/bonds/flaws og Background Menu | Forslag og egne tekster; ingen flytning af Standard-panel. | [character-adobe-background-choice-ui.js:16](../../js/modules/character-adobe-background-choice-ui.js#L16) |
| adobeBackgroundFeatureDialog | adobe-dialog | Background feature → Custom | Eget navn/tekst; bevarer øvrige baggrundsvalg. | [character-adobe-background-feature-ui.js:5](../../js/modules/character-adobe-background-feature-ui.js#L5) |
| adobeChoiceDialog | adobe-dialog | Søgbare race/background/class/weapon/andre valglister | Generisk feltpicker; actual field descriptor afgør effekten. | [character-adobe-choice-ui.js:24](../../js/modules/character-adobe-choice-ui.js#L24) |
| adobeClassDialog | adobe-dialog | Level/Class, Class Features Menu, Special features | Class, edition, subclass, metamagic/styles, training og HP-draft. | [character-adobe-class-ui.js:11](../../js/modules/character-adobe-class-ui.js#L11) |
| adobeDruidFormsDialog | moves-component | Class features → Druid forms | Flytter #sheetDruidWildShape med placeholder; native skal må ikke forveksles med uafhængigt indhold. | [character-adobe-druid-forms-ui.js:10](../../js/modules/character-adobe-druid-forms-ui.js#L10) |
| adobeEquipmentDialog | adobe-dialog | Equipment.menu eller Special features → Equipment | Native add/preview/confirm; bruger fælles inventory/state. | [character-adobe-equipment-ui.js:8](../../js/modules/character-adobe-equipment-ui.js#L8) |
| adobeFeatDialog | adobe-dialog | Feat-knapper eller Special features → Feats | Kan åbne personal feat-editor og feat information. | [character-adobe-feat-ui.js:7](../../js/modules/character-adobe-feat-ui.js#L7) |
| sheetPageManager | standard-only | Standard page navigation → Add pages | Templatebygget dialog bevaret bag skjult Standard-navigation; Adobe bruger adobePagesDialog. | [character-adobe-pages.js:9](../../js/modules/character-adobe-pages.js#L9) |
| adobeSpellListDialog | adobe-dialog | Read spell list ved spell-arkets overskrift | Selvstændig læseliste med level-grupper, korte beskrivelser og udfoldede fulde noter; gemmer ikke separat spell-data. | [character-adobe-spell-list-ui.js:11](../../js/modules/character-adobe-spell-list-ui.js#L11) |
| adobeSpellDialog | adobe-dialog | Choose spells, spell-felt/knap, Special features | Native selection draft; bruger casting-engine og fælles spell-rendering. | [character-adobe-spell-ui.js:11](../../js/modules/character-adobe-spell-ui.js#L11) |
| adobeRaceSpellDialog | adobe-dialog | Generate spell sheet → Race spells | Race-cantrip/ability-valg; fælles session. | [character-adobe-spell-ui.js:78](../../js/modules/character-adobe-spell-ui.js#L78) |
| adobeSpellSourcesDialog | adobe-dialog | Special features → Generate spell sheet | Viderestiller til class/race/feat-spellvalg. | [character-adobe-spell-ui.js:97](../../js/modules/character-adobe-spell-ui.js#L97) |
| adobePagesDialog | adobe-dialog | Manage pages / Add pages | Valg af spell-, companion-, notes- og andre sider. | [character-adobe-stack-ui.js:67](../../js/modules/character-adobe-stack-ui.js#L67) |
| adobePaperZoomMenu | adobe-menu | Forstørrelsesglas på arket | Bruger fortsat intern #adobeZoom-selector; den skjulte kontrol skal bevares indtil afkobling. | [character-adobe-stack-ui.js:106](../../js/modules/character-adobe-stack-ui.js#L106) |
| adobePageActionsMenu | adobe-menu | Page options ved zoom/print → Hide this page / Manage pages | Skjuler en bestemt side uden at slette data; genopretning via Undo eller sideoversigten. | [character-adobe-stack-ui.js:107](../../js/modules/character-adobe-stack-ui.js#L107) |
| adobeSpecialFeaturesMenu | adobe-menu | Show extra features | Blander native routes og shared bridges; se routetabel. | [character-adobe-view.js:151](../../js/modules/character-adobe-view.js#L151) |
| adobeSharedEditor | moves-standard-body | Alle aktive bridge-routes i routetabellen | Flytter hele .sheet-body og #sheetSave; skjuler andre sektioner og gendanner dem ved lukning. | [character-adobe-view.js:215](../../js/modules/character-adobe-view.js#L215) |
| adobeNotesOptions | adobe-dialog | Notes.Options | Linjer/fortsættelse er egne controls; Open journal åbner notes-bridge. | [character-adobe-view.js:313](../../js/modules/character-adobe-view.js#L313) |
| sheetFeatInformation | shared-dialog | Feat information fra native featvalg | Selvstændig læsning, men modulet indeholder også katalog/resource-renderere. | [character-catalog-ui.js:99](../../js/modules/character-catalog-ui.js#L99) |
| sheetCompanionHPOptions | shared-dialog | Companion Set Max HP | Egen dialog; afhænger af companion state, ikke en flyttet popup-body. | [character-companion-hp-ui.js:13](../../js/modules/character-companion-hp-ui.js#L13) |
| adobeHitPointMenu | adobe-menu | Set Max HP | Native flyout → sheetHitPointOptions og fælles HP-apply. | [character-hit-point-ui.js:25](../../js/modules/character-hit-point-ui.js#L25) |
| sheetHitPointOptions | shared-dialog | Set Max HP → avanceret/manual og hp-route | To visninger af samme dialog-id; automatisk/manual/one-shot. | [character-hit-point-ui.js:34](../../js/modules/character-hit-point-ui.js#L34) |
| sheetPersonalGearEditor | shared-dialog | Owned item information → Edit eller inventory-bridge | Selvstændig editor, men gemning opdaterer de fælles inventory-controls. | [character-inventory-ui.js:35](../../js/modules/character-inventory-ui.js#L35) |
| sheetInventoryItemInformation | shared-dialog | Magic/gear information og item links | Kan åbne Edit item og ændre backpack/remove via fælles handlers. | [character-inventory-ui.js:63](../../js/modules/character-inventory-ui.js#L63) |
| sheetItemResourceRecovery | shared-dialog | Dawn/item resource recovery | Åbnes fra resource-bridge; modulet renderer #sheetItemResources. | [character-item-resource-ui.js:53](../../js/modules/character-item-resource-ui.js#L53) |
| sheetModifierDialog | shared-dialog | Bonusfelter, Ctrl/Meta/Shift-click, Modifiers | Egen form; afhænger af shared modifier-render/update hooks. | [character-modifier-ui.js:25](../../js/modules/character-modifier-ui.js#L25) |
| sheetSkillOptions | shared-dialog | SkillsClick | Egen popup til rækkefølge/training; åbner native skills-editor. | [character-modifier-ui.js:46](../../js/modules/character-modifier-ui.js#L46) |
| sheetPaperAttackMenu | shared-dialog | Attack arrows eller attack picker → row options | Rækkefølge/clear/insert; kan åbne Combat-bridge. | [character-named-equipment-ui.js:75](../../js/modules/character-named-equipment-ui.js#L75) |
| sheetSpellInformation | shared-dialog | Spell information fra native spellvalg og ark | Selvstændig læsedialog; må ikke slettes sammen med Overview-modulet. | [character-overview-ui.js:143](../../js/modules/character-overview-ui.js#L143) |
| sheetHitDiceRecovery | shared-dialog | Hit Dice-controls fra Actions/ammunition | Preview og forbrug af Hit Dice; fælles form/session. | [character-paper-combat-ui.js:38](../../js/modules/character-paper-combat-ui.js#L38) |
| sheetPaperActionMenu | shared-dialog | Action/Bonus Action/Reaction-arrows | Egen row-menu; edit kan åbne paperCombat-bridge. | [character-paper-combat-ui.js:48](../../js/modules/character-paper-combat-ui.js#L48) |
| adobeGearDialog | adobe-dialog | Gear-arrows og Enter/dobbeltklik på gear | Native row-editor, source catalogue og confirmations; delt inventory-engine. | [character-paper-gear-ui.js:9](../../js/modules/character-paper-gear-ui.js#L9) |
| sheetPaperIcons | shared-dialog | Header/log-icon og Symbol | Egen billedvælger/upload; fælles image-budget og private data. | [character-paper-icons-ui.js:16](../../js/modules/character-paper-icons-ui.js#L16) |
| adobeFooterDialog | adobe-dialog | Equipment footer/layout-controls | Egen footer-popup; modulet ejer også bridge-komponenten #sheetPaperInventoryLayout. | [character-paper-inventory-ui.js:33](../../js/modules/character-paper-inventory-ui.js#L33) |
| sheetPaperLogMenu | shared-dialog | Adventure Log row arrows | Egen menu; Edit går gennem notes-bridge og #sheetAdventureLog. | [character-paper-log-ui.js:6](../../js/modules/character-paper-log-ui.js#L6) |
| sheetPaperMagicMenu | shared-dialog | Magic item-arrows og variantvalg | Egen menu; nested information/confirmations og equipment handlers. | [character-paper-magic-ui.js:28](../../js/modules/character-paper-magic-ui.js#L28) |
| sheetPaperResourceMenu | shared-dialog | Limited Feature arrows | Egen row-menu; Open feature controls åbner resources-bridge eller item controls. | [character-paper-resource-ui.js:5](../../js/modules/character-paper-resource-ui.js#L5) |
| adobeWeightDialog | adobe-dialog | Weight Carried-knappen eller weight-route | Native draft; gammel editorTargets selector er skygget af native route. | [character-paper-weight-ui.js:10](../../js/modules/character-paper-weight-ui.js#L10) |
| personalFeatDialog | adobe-dialog | Native Feats → Create/Edit personal feat | Egen draft og delete-confirmation; private save/data. | [character-personal-feat-ui.js:8](../../js/modules/character-personal-feat-ui.js#L8) |
| sheetRestRecovery | shared-dialog | Heal/Comp.Heal og shared rest-controls | Selvstændigt HP/Hit Dice-preview; ikke en komplet reset af alle feature pools. | [character-rest-recovery-ui.js:8](../../js/modules/character-rest-recovery-ui.js#L8) |
| sheetPrintDialog | standard-only | Standard print fallback | Adobe print interceptes og bruger printConnected/preparePrint; behold fælles print-hooks under udfasning. | [character-sheet.js:641](../../js/modules/character-sheet.js#L641) |
| sheetSpellGenerator | nested-standard-dialog | Spell Slots/shared spell-controls → Generate | Legacy generator kan nås inde i spellSlots-bridge; native Choose spells erstatter ikke alle nested controls. | [character-spellcasting-ui.js:61](../../js/modules/character-spellcasting-ui.js#L61) |

## Samtlige editor-routes

Native branches kommer før editorTargets-opslaget. Deres gamle selectors er derfor ikke aktive bridges. Alle `moves-standard-body`-routes er aktive afhængigheder.

| Command | Popup | Implementering | Standard-selector |
| --- | --- | --- | --- |
| experience | adobeClassDialog | native | #sheetAdobeXP |
| edition | adobeClassDialog | native | #sheetBuildControls |
| weight | adobeWeightDialog | native | #sheetInventoryTotals |
| paperInventory | adobeSharedEditor | moves-standard-body | #sheetPaperInventoryLayout |
| carrying | adobeSharedEditor | moves-standard-body | #sheetCarrying |
| customTool | adobeSharedEditor | moves-standard-body | #sheetCustomToolCheck |
| itemResources | adobeSharedEditor | moves-standard-body | #sheetItemResources |
| paperCombat | adobeSharedEditor | moves-standard-body | #sheetPaperCombat |
| companion | adobeSharedEditor | moves-standard-body | #sheet-companion |
| vitals | adobeSharedEditor | moves-standard-body | #characterSheetForm .sheet-vital-editor |
| classes | adobeClassDialog | native | #sheetAdobeProgression |
| hp | sheetHitPointOptions | native | #sheetAdobeProgression |
| abilities | adobeAbilityDialog | native | #sheet-skills |
| skills | adobeAbilityDialog | native | #sheet-skills |
| origins | adobeSharedEditor | moves-standard-body | #sheetBuildControls |
| features | adobeClassDialog | native | #sheetBuildControls |
| background | adobeSharedEditor | moves-standard-body | #sheetBuildControls |
| equipment | adobeSharedEditor | moves-standard-body | #sheet-inventory |
| inventory | adobeSharedEditor | moves-standard-body | #sheet-inventory |
| spells | adobeSpellDialog | native | #sheet-spells |
| spellSlots | adobeSharedEditor | moves-standard-body | #sheet-spells |
| feats | adobeFeatDialog | native | #sheet-feats |
| attacks | adobeSharedEditor | moves-standard-body | #sheet-combat |
| resources | adobeSharedEditor | moves-standard-body | #sheetFeatResources |
| conditions | adobeSharedEditor | moves-standard-body | #sheetMovementConditions |
| combat | adobeSharedEditor | moves-standard-body | #sheet-combat |
| notes | adobeSharedEditor | moves-standard-body | #sheet-notes |
| story | adobeSharedEditor | moves-standard-body | #sheet-story |
| builder | adobeSharedEditor | moves-standard-body | #sheetBuildControls |

## Infrastruktur og overlays

- **characterSheetDialog** (js/modules/character-sheet.js): Outer shell, #characterSheetForm, session/store, ownership and close/save lifecycle.
- **siteConfirmationDialog** (js/modules/site-confirmation.js): Shared confirmation/Cancel, isCurrent guards and focus restoration.
- **CharacterAdobeFlyoutMenu** (js/modules/character-adobe-flyout-menu.js): Generic dynamic flyout factory; concrete IDs listed above.
- **adobeSkillHelp-*** (js/modules/character-adobe-skill-help.js): Non-modal skill provenance overlays; keep keyboard/touch/cleanup.
- **CharacterSizeGuidanceUI** (js/modules/character-size-guidance-ui.js): Non-modal height/weight guidance overlay.
- **browser.confirm (Long Rest)** (js/modules/character-catalog-ui.js): Platform confirmation used by the shared Long Rest handler; reached from Adobe through sharedCommand. Keep the confirmation and its cancellation behavior.
- **vaultContextHelp / siteGuideDialog** (js/modules/site-help.js): Site-wide contextual help and guide; also used inside shared Adobe popups.

## Gemning og fælles form

Selvstændig dialog betyder kun, at popup-indholdet ikke flyttes ud af Standard. Native dialogs bruger stadig sheetSession, readSheetForm, fillSheetForm, updateSheetCalculations, sheetStatus, sheetEquipmentLoot og fælles store/permission-kontrol. Den fælles form er en særskilt udfasningsafhængighed, også for native dialoger.

sharedCommand klikker stadig på kontroller i #characterSheetForm (bl.a. spell preparation, rest/slot/form-actions). Disse indirekte handlers skal flyttes eller bevares sammen med panelerne.

## Direkte bridge-kald

| Kald | Kode |
| --- | --- |
| row.descriptor.command | [character-adobe-view.js:112](../../js/modules/character-adobe-view.js#L112) |
| id | [character-adobe-view.js:150](../../js/modules/character-adobe-view.js#L150) |
| notes | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| companion | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| companion | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| experience | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| story | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| feats | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| cmd | [character-adobe-view.js:177](../../js/modules/character-adobe-view.js#L177) |
| conditions | [character-adobe-view.js:219](../../js/modules/character-adobe-view.js#L219) |
| notes | [character-adobe-view.js:318](../../js/modules/character-adobe-view.js#L318) |
| spells | [character-adobe-view.js:396](../../js/modules/character-adobe-view.js#L396) |
| companion | [character-adobe-view.js:401](../../js/modules/character-adobe-view.js#L401) |
| editorChoice.value | [character-adobe-view.js:402](../../js/modules/character-adobe-view.js#L402) |
| st.editor | [character-adobe-view.js:412](../../js/modules/character-adobe-view.js#L412) |
| key | [character-adobe-view.js:432](../../js/modules/character-adobe-view.js#L432) |
| notes | [character-adventure-log-ui.js:6](../../js/modules/character-adventure-log-ui.js#L6) |
| itemResources | [character-item-resource-ui.js:49](../../js/modules/character-item-resource-ui.js#L49) |
| attacks | [character-named-equipment-ui.js:82](../../js/modules/character-named-equipment-ui.js#L82) |
| equipment | [character-paper-gear-ui.js:60](../../js/modules/character-paper-gear-ui.js#L60) |
| story | [character-paper-icons-ui.js:23](../../js/modules/character-paper-icons-ui.js#L23) |
| paperInventory | [character-paper-inventory-ui.js:49](../../js/modules/character-paper-inventory-ui.js#L49) |
| notes | [character-paper-log-ui.js:14](../../js/modules/character-paper-log-ui.js#L14) |
| paperInventory | [character-paper-magic-ui.js:58](../../js/modules/character-paper-magic-ui.js#L58) |
| equipment | [character-paper-magic-ui.js:60](../../js/modules/character-paper-magic-ui.js#L60) |
| resources | [character-paper-resource-ui.js:11](../../js/modules/character-paper-resource-ui.js#L11) |
| spells | [character-spellcasting-ui.js:76](../../js/modules/character-spellcasting-ui.js#L76) |

## Før noget slettes

1. Bevar yderdialog, session, private save-format, fælles regler, character-sheet.css, character-adobe-integration.css, character-adobe-view.css og modal/confirmation-infrastruktur.
2. Afkobl de aktive routes til adobeSharedEditor og Druid Forms-komponenten fra den gamle panelsamling.
3. Flyt genbrugte popup-renderere ud af blandede moduler (fx spell information fra Overview, feat information fra Catalogue), før de gamle moduler slettes.
4. Afkobl sharedCommand og de fælles form-sync-hooks; test det nye ejerskab.
5. Test hver familie med åbning, relevant ændring, Apply/Cancel, Escape, fokus, Save/genåbn, mobil, print hvor relevant og sen/asynkron sessionlukning. Først derefter slettes Standard-koden. Det synlige visningsvalg kan skjules tidligere, når alle bagvedliggende komponenter bevares.

Originale knapper uden en implementeret funktion kan stadig være disabled; denne kortlægning kalder dem ikke fungerende popups. Browserens printdialog og filvælger er platformkontroller, ikke egne popup-familier. Den konkrete browser-confirm ved Long Rest er registreret som infrastruktur.

