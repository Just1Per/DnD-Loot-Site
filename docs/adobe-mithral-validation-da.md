# Adobe-sammenligning med Mithral

**Senere brugerbeslutning, 9. november 2026:** Adobe bliver eneste synlige visning, mens den gamle kode og popup-komponenterne bevares. Kravene nedenfor om afkobling gælder fortsat før sletning af Standard-koden; de blokerer ikke skjulning af visningsvælgeren.

Reference: brugerens udfyldte **MPMB v12.999 (Printer Friendly)**, modtaget 9. november 2026. Seks aktive sider og 2.125 formularwidgets i denne fil. Antallet omfatter også skjulte/gentagne controls og er ikke et mål for funktionsdækning. PDF, indlejret Acrobat-kode, personlige noter og fulde regeltekster indgår ikke i repoet.

Websidernes eksisterende grafik er fra **MPMB v13.0.4**, mens den udfyldte reference er v12.999. Layoutforskelle skal registreres med de to versioner; webarket er ikke en pixelidentisk kopi af den vedhæftede fil.

## Reproducerbar test

`tests/adobe-mithral-reference-browser.cjs` bruger en minimal testkarakter med referencekarakterens klasse og relevante tal. Den er ikke en fuld import af PDF'en.

| Område | Kontrol |
| --- | --- |
| Regler | 2014, High Elf, Draconic Bloodline Sorcerer 3 |
| Scores | Slutværdier 15 / 13 / 13 / 13 / 16 / 19; ingen dobbelt racebonus |
| Afledte værdier | AC 14, proficiency +2, Sorcerer spell attack +6 / DC 14 |
| Metamagic | To valg direkte i Adobe-klassevinduet, Quickened 2 point og Empowered 1 point |
| Forbrug | Quickened efterlader 1/3 point; endnu en Quickened er blokeret; Empowered er tilgængelig |
| Gemning | Navn, valg og brugte point overlever Save/genåbn; current HP og mønter ændres ikke af valgene |
| Edition | 2024 Heightened viser 2 point; Cancel bevarer den oprindelige 2014-karakter |
| Layout | Ressourcevinduet uden vandret overflow ved 1440, 390 og 320 px; WCAG A/AA-kontrol |

Kør fra `tests`: `node adobe-mithral-reference-browser.cjs`. Testen er også del af `npm run test:adobe-connected`.

## Rettelser fra gennemgangen

- Den native klassevælger viser nu prisen ved de valgte Metamagic-forklaringer, også den variable pris på legacy Twinned Spell.
- Entydige recovery-etiketter bruger LR/SR/SR-LR-format på det smalle arkfelt; fulde betingelser bevares og komplekse recovery-regler forkortes ikke til en misvisende standardrest.
- Åbning af Feature resources fra Adobe fører direkte til ressourceafsnittet frem for toppen af hele Combat-panelet.

## Faktiske forskelle og åbne punkter

1. **PDF'en har indbyrdes forskellige metamagic-oplysninger.** Kampoversigten viser Quickened/Empowered; noterne viser Twinned/Empowered. Testen vælger kampoversigtens par eksplicit. En senere komplet karakterrekonstruktion skal vælge det ønskede par, ikke sammenlægge dem til tre kendte muligheder.
2. **To UA-feats findes ikke som tilsvarende katalogvalg.** PDF'ens Alchemist og Dragonmark [Healing] er ikke katalogets Aberrant Dragonmark. Personal/homebrew-feats kan gemme egen tekst og understøttede eksplicitte effekter, men det er ikke dokumentation for fuld UA-automatik. De må ikke erstattes af navnelignende feats.
3. **HP skal kontrolleres med den valgte metode.** PDF'ens maksimum er 14. Den minimale test bevarer current HP 14; den påstår ikke, at automatisk fixed HP skal give samme maksimum som et historisk kast/manuelt tal.
4. **2014-reference er ikke en 2024-facitliste.** Feats, spells, rests og metamagic kontrolleres edition-specifikt. Den originale spillerreference skal fortsat mærkes som 2014.
5. **Nogle Adobe-vinduer bruger fortsat Standard-editorens DOM.** `CharacterAdobeView.editorTargets` og `openEditor` flytter bl.a. Combat/resources, conditions, story, inventory og companion-controls ind i en Adobe-dialog. De virker via den fælles session, men fjernelse af de bagvedliggende paneler vil bryde funktionerne. Klasse-, ability-, feat- og spellvalg har egne native vinduer.
6. **Browser-fixtures erstatter Firebase og login.** De tester reelle styles, DOM, input, gemmeforløb og print, men erstatter ikke en rigtig brugertest af oprettelse, netværksfejl og genåbning på preview med en testkonto.
7. **Fuld visuel og interaktiv Acrobat-paritet er ikke godkendt.** De eksisterende audits beskriver flere delvise originalmenuer, betingede layouts og manuelle bordeffekter. At alle regressionstests består, er ikke det samme som at alle funktioner i den udfyldte PDF er genskabt.

## Gate før den gamle visning udfases

- Erstat eller afkobl alle resterende `editorTargets`-afhængigheder; bevar fælles regelmotor og private saveformat.
- Genskab hele Mithral (inklusive besluttede feats/metamagic, magic items, metriske indstillinger og HP-metode); sammenlign alle seks sider, også faktisk PDF-print.
- Test en ny karakter fra kampagnens Opret-knap til Save/genåbn på preview. Test også en eksisterende karakter, 2024, multiclass og companion.
- Få spillere til at udføre valg, level-up, skade/healing, spells, pointforbrug, rests og lange tekstredigeringer på desktop og mobil. Registrer fejl og målrettede rettelser.
- Først når ingen blokerende fejl eller mistede funktioner står åbne: skift default til Adobe med midlertidig tilbagevej. Fjern derefter den gamle præsentation og dens overflødige kode.

Den gamle visning er bevaret under denne gennemgang.

## Lokal validering, 9. november 2026

- Samlet engine/DOM-kørsel: 1.010 engine-tests og 371 DOM-checks bestået.
- Efter recovery-etiketrettelsen: alle 35 field-adapter-tests bestået, inklusive bevarede fulde recovery-betingelser.
- Alle 69 hidtidige scripts i den sammenhængende Adobe-browserpakke bestået.
- Den nye Mithral-regression bestået med sidste fixture-rettelse til katalogets `city-watch-scag` og reference-XP 2.050.
- De tre yderligere browserkontroller af spell-kilder, redigerbare spell/feat-kopier og Sorcerer point/metamagic bestået.

Dette er lokale fixture-tests. GitHub-resultater står på den nye PR; en rigtig preview-brugertest er fortsat en selvstændig release-gate.
