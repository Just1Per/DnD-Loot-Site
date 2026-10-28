# Adobe web function ledger

This supplements the reproducible [static inventory](README.md). Its 567 pushbutton occurrences include repeated templates and artwork. The inventory's `Unmapped` entries are a scanner review queue, not a live implementation status. This ledger records the concrete web behavior and remaining gaps; a related-editor link is **partial**, not proof that the original menu has been reproduced.

The live contracts are `character-adobe-fields.js`, `character-adobe-view.js` and the shared controllers they call. No Acrobat JavaScript runs in the web app.

| Source area or control | Current web behavior | Verification / remaining gap |
| --- | --- | --- |
| Core identity, abilities, saves and skills | Shared character identity/derived totals; manual save/skill choices retain granted training | First-page browser, adapter tests; original modifier menus remain partial |
| Add Experience / Class and Levels / Set Max HP | Opens existing advancement and HP controls; Add Experience focuses a bounded shared XP-addition control when XP mode is enabled | Comma-formatted totals, Enter, validation, common multiclass progression and save/reopen tested; other original advancement popup options remain partial |
| Heal / HP / inspiration / death saves | Shared Overview editor or bounded raw values/counters | Core save/reopen and invalid-input checks; source Heal menu remains partial |
| Tool, language and weapon training | Existing class/feat/origin effects plus permitted manual entries | Rogue and inherited training checks; full original option dialogs remain partial |
| Portrait | Existing private upload, resizing, removal and persistence | Browser upload/save/reopen; original portrait popup operations not all reproduced |
| Organization Symbol | Private upload/removal using the shared portrait image validator/resizer; separate saved symbol and Standard editor | Source and Standard print, rejected SVG, portrait isolation and save/reopen tested; original popup operations remain partial |
| SR / LR beside limited features | Existing eligible feature-use recovery, including feat pools | Second Wind and Lucky browser checks; these buttons do not restore HP or spell slots |
| Dawn and other item-charge recovery | Unavailable | Shared item-charge model/recovery still missing |
| Attack rows | Equipped attacks, manual attacks and existing derived actions; common bonuses | Manual editor and persistence tested; only five paper rows, further source attack menus remain partial |
| Feat arrows | Existing information dialog for the displayed feat; empty slot opens shared selection | Selected feats and continuation offsets tested; original full feat menus not reproduced |
| Magic-item arrows and attunement | Existing owned-item information and attunement controller | Ownership, class limits, removal isolation, AC and persistence verified |
| Magic-item dropdowns | Arrange carried records without granting items | Private paper order tested; original item catalogue/menu commands remain partial |
| Gear arrows | Existing information dialog for that carried entry | Exact row 51 tested; quantity/removal/storage edits remain in shared Inventory |
| Equipment Notes and Other Holdings | Separate bounded shared journal entries and common equipment notes | Continuation/ordinary-note isolation and save/reopen verified |
| Notes / Extra Notes page buttons | Open shared Journal; paper fields edit existing entries | Journal count/text budgets retained; original page-insertion menus not reproduced |
| Spell row information | Shared full spell dialog and shared catalogue presentation | 132-spell continuation, invocation ranges and source print tested |
| Spell preparation circles | Existing Wizard preparation command; fixed/known lists stay read-only | Allowance, automatic grants, multiclass and persistence tested |
| Spell-slot buttons | Open common ordinary/Pact slot controls | Distinct pools and remaining counts tested; original icon/menu operations remain partial |
| Spell-sheet generation / row menus | Related shared Spells editor | Original row customization, variants and generation menus remain incomplete |
| Companion Options / Set Max HP / Heal / attack arrows | Open existing companion/familiar editor | Shared-editor visibility and return synchronization tested; original popup menus remain partial |
| Companion core fields | Existing card identity, filtered creature picker, HP, AC, movement, scores, saves, skills, traits, descriptions, additional features, death-save counters and notes | Multiple companions, familiar filtering, inherited manual-form values and persistence tested |
| Companion pictures | Shared private uploader/resizer, per-card saved picture, upload/removal and both print styles | Independent cards, rejected SVG, save/reopen, late-upload removal isolation and persisted image budget tested; overlapping source image surfaces share one accessible frame |
| Companion hit dice | Catalogue count/die via shared projection and a bounded per-card used counter | Named saved creature lookup, type switches and save/reopen tested; healing and rest recovery remain separate |
| Companion source attack table | One shared creature calculation supplies natural attacks, fixed-damage flags, explicit save DCs, information arrows and bounded paper-slot choices | All 127 creatures / 168 attacks, catalogue training, source/Standard print and preserved manual notes tested; conditional effects remain source references, and manual form cards remain separate from active Druid forms |
| Wild Shape Options | Existing Druid controls under Companions | Original source menu options still partial |
| Wild Shape form dropdowns | Edition-aware known choices (2024) or private paper references (2014) | References spend no uses; legacy seen confirmation stays in the common transformation flow |
| Wild Shape values / active HP / return to normal | Shared engine profiles and commands | Both editions, continuation, separate legacy HP, revised HP, validation, persistence and print tested |
| Wild Shape hit-die metadata / further source actions / conditional menus | Unavailable or incomplete | Do not infer missing statistics from HP or execute source scripts |
| Player reference / extra reference | Original blank 2014 artwork, with edition notice | Current character edition remains unchanged; references are not a rules engine |
| Adventure Log | Blank original layout only | Structured log fields, calculations, advancement effects and Standard workflow pending |
| Header icon, reload/reset, layout/source/automation settings and remaining dynamic menus | Unavailable unless explicitly routed above | Review the static inventory and 287 dynamic UI sites individually |
| Print | Selected paper at source dimensions; UI-only annotations hidden, data indicators retained | Core, spells, items, companions and Wild Shape PDFs checked; whole-sheet print and overflow remain pending |
| Save / export / access | Existing session, store, revisions and access checks | Shared save/reopen and invalid-input protection checked; further access-loss/stale-write parity audit pending |

All unlisted source fields, buttons and dynamic menu actions remain unresolved. Full parity requires a per-function review of the inventory and each supported rule edition/source; layout exports and passing checks alone are insufficient. PR #250 stays a draft.
