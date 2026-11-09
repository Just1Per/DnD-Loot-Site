# Oprydning og konfiguration — første gennemgang

Måling: 9. november 2026, udgangspunkt `cb6d431` på main. Dette er en gennemgang af repoet og dets lokale pakke-/testopsætning. Firebase-dokumenter, brugerdata og publicerede operatorpakker ændres ikke.

## Fund og udførte forbedringer

| Område | Fund | Ændring |
| --- | --- | --- |
| Hosting | `public: .` med `**/.*` udelukkede skjulte mappenavne, men ikke nødvendigvis filerne under dem. Firebase CLI's faktiske `listFiles` valgte bl.a. `.git/objects`. | Tilføjet `**/.*/**`; regressionskontrol af skjulte filer og en midlertidig skjult mappe. Runtime-moduler, styles, datakataloger og attribution skal stadig være med. |
| Arbejdsfiler | Lokale uploads, coverage, browserrapporter og arbejdsmapper er ikke runtime-indhold. Git-ignore og Hosting-ignore er forskellige grænser. | Fælles mappegrænser i begge konfigurationer: work, attachments, coverage, test-results, playwright-report. Hosting-testen opretter små canary-filer og kontrollerer CLI'ens faktiske udvalg. |
| Adobe-tests | 71 browser-scripts stod i én lang npm-kommandolinje og kørte efter engine/DOM i samme CI-job. | Én eksplicit manifestliste, en shell-fri Node-runner og tre isolerede CI-shards. Alle tests bevares; fail-fast er slået fra, og workspace kræver også hele matrixens succes. |
| Fejlfinding | En lang testgruppe gjorde fejl og varighed svære at aflæse. | Runneren udskriver filnavn og varighed pr. suite og stopper med fejlstatus ved fejl. Hver shard får egne logs, screenshots og PDF-artifacts med 14 dages retention. |

I denne arbejdsmappe ændrede den faktiske Hosting-filudvælgelse sig fra **2.386 filer / 67,1 MB** til omtrent **355 filer / 13,6 MB**, før nye testresultater blev skrevet. Størstedelen af forskellen var Git-interne filer. Tallene afhænger af den lokale checkout og er ukomprimerede uploadkandidater; de er ikke målinger af spillerens download eller en påstand om tidligere offentlig adgang til Git-data.

## Data og dependencies

Git-sporede størrelser før denne ændring:

| Indhold | Bytes |
| --- | ---: |
| data | 5.752.160 |
| JavaScript | 3.735.250 |
| tests | 3.620.882 |
| docs | 7.282.027 |
| scripts | 1.619.628 |

`tests/` fylder ca. 536 MB på disk med installerede dependencies; selve de Git-sporede tests fylder ca. 3,62 MB. Dependencies er allerede udelukket fra Hosting. Det er ikke 536 MB testkode eller frontend-download.

En SHA-256-gennemgang af data-/JavaScript-filer over 1 KB fandt ingen byte-identiske dubletter. De store runtime-kataloger er `monsters.json` (ca. 1,35 MB) og `catalog.json` (ca. 1,06 MB). Det beviser ikke, at alle felter bruges, men giver ikke grundlag for at slette dem som dubletter. De store auditrapporter og operator-ZIP-filer er dokumentations-/recovery-input og er udelukket fra Hosting. De gamle PNG-filer bevares som kompatibilitetsassets; siden bruger allerede mindre UI-varianter.

## Sådan køres testene

- Hele den eksisterende sekvens: `npm --prefix tests run test:adobe-connected`
- Én CI-del lokalt: `npm --prefix tests run test:adobe-connected -- --shard 1/3`
- Se delens filer uden at starte browseren: samme kommando med `--list`.
- Tilføj eller flyt en suite i `tests/adobe-connected-suites.json` — ikke i flere workflow-kommandolinjer.
- Kontrollér partition/CLI og workflow-tilslutning: `node --test tests/adobe-suite-runner.cjs`.
- Kontrollér den offentlige pakkes indhold uden deploy: `npm --prefix tests run test:packaging`.

Shards køres på separate GitHub-runnere. Tre browserprocesser på samme udviklingsmaskine kan være langsommere på grund af CPU-/RAM-konkurrence. Workflowet gør Adobe-gruppen uafhængig af engine/DOM og giver kortere delgrupper; den samlede wall time skal sammenlignes på faktiske CI-kørsler, også med runner-kø og installationer.

Den eksisterende offline startup-smoketest blev også kørt: seks starter nåede readiness med 146 unikke feature-moduler og nul fixture-skrivninger. Den kørte samtidig med browserregressionerne og bruges derfor ikke som en hastighedssammenligning mod den historiske baseline.

## Næste oprydningspunkter

1. Sammenlign CI-varigheder og eventuel skævhed mellem shards; brug de nye fil-timings før en anden fordeling vælges.
2. Kortlæg dependency-behov pr. testrolle. Browserjobs installerer fortsat hele tests-pakken med Firebase-emulatorværktøjer; en separat browserpakke kan reducere installationer, men kræver kontrol af alle fixture-imports og lockfiles.
3. Mål reel landing → login → kampagne → character sheet/Library på preview med netværk og cache adskilt. Den eksisterende offline startup-benchmark kan ikke stå alene som produktmåling.
4. Gennemgå katalogdata for semantisk overlap og mulighed for versionerede, behovsstyrede dele. Bevar begge editions, referencer, source-id'er og eksisterende gemte karakterer.
5. Saml de aktive dokumentationsindgange og marker historiske checkpoints. Bevar beslutninger, audits, attribution, reproducerbare generatorer og recovery-materiale.
6. Brug popup-kortlægningen ved senere afkobling af den gamle visning. Ingen af dens renderere, styles eller popup-komponenter slettes i denne oprydning.

7. Vurder en dedikeret Hosting-buildmappe eller en eksplicit staging-manifest, så public-filer ikke længere vælges fra hele repo-roden. Bevar asset-URLer, versionering og fallback-filer under en sådan ændring.
