# Opdelte test-dependencies

Testpakkerne er opdelt efter opgave. `tests/package.json` er nu kun kommandooversigten; den installerer ikke længere et fælles sæt dependencies.

| Profil | Direkte dependencies | Anvendelse |
| --- | --- | --- |
| core | acorn 8.18.0, linkedom 0.18.13 | Beregninger, source-audits og DOM-fixtures |
| browser | Playwright 1.51.1, axe-core 4.14.0 | Browser, Adobe, layout og accessibility |
| emulator | Firebase 11.10.0, rules-unit-testing 4.0.1, Firebase CLI 14.27.0 | Rigtige Firestore/Storage-emulator- og adgangsregeltests |
| hosting | Firebase CLI 14.27.0 | CLI'ens faktiske Hosting-filudvælgelse |

De direkte versioner er bevaret fra den tidligere lockfile, ikke opgraderet til nye hovedversioner. Hver profil har egen `package.json` og `package-lock.json`; transitive dependency-træer låses separat. Firebase CLI findes i både emulator- og hostingprofilen med samme version, fordi de er separate job med forskellige øvrige behov.

## Installation på en udviklingsmaskine

Kør fra repo-roden med Node 22 eller 24:

```sh
npm ci --prefix tests
node scripts/test-profiles.cjs install core browser
npm --prefix tests run with -- browser playwright install chromium
```

Den første kommando fjerner den gamle samlede installation fra `tests/node_modules`. `install core browser` installerer kun de to profiler til almindelig udvikling og UI-tests. Browserinstallationen henter Chromium; på Linux kan nødvendige systembiblioteker kræve Playwrights `--with-deps` og almindelig systeminstallation. Java 21 er kun nødvendigt, hvis du vil køre emulator-tests.

Installer emulator eller hosting efter behov med `node scripts/test-profiles.cjs install emulator` eller `install hosting`. `npm --prefix tests run deps:all` er en valgfri genvej til alle fire. Det bruger mere samlet lokal diskplads end én fælles installation, fordi de to isolerede Firebase-profiler hver har CLI-træet; til almindelig frontend-udvikling er core/browser tilstrækkeligt.

Du kan vælge én eller flere profiler:

```sh
node scripts/test-profiles.cjs install core browser
```

Alle kommandoer bruger samme Node/npm-installation og virker på Linux og Windows; wrapperen starter npm's JavaScript-CLI direkte frem for en shell-afhængig `.cmd`-kommando.

## Kørsel

```sh
npm --prefix tests run with -- "core,browser" npm --prefix tests test
npm --prefix tests run with -- browser npm --prefix tests run test:adobe-connected
npm --prefix tests run with -- browser npm --prefix tests run test:adobe-connected -- --shard 1/3
npm --prefix tests run with -- emulator npm --prefix tests run test:workspace-rules
npm --prefix tests run with -- hosting npm --prefix tests run test:packaging
npm --prefix tests run with -- core node scripts/audit-adobe-popups.cjs
```

Wrapperen starter altid den ønskede kommando fra repo-roden, sætter `NODE_PATH` til **kun de valgte profiler** og tilføjer deres CLI-binaries til `PATH`. Derfor kræver browser-tests ikke, at emulator eller hosting er installeret. Miljøet ændres kun for den startede proces og dens børn; din terminalkonfiguration bliver ikke skrevet om.

Hvis en profil mangler, giver wrapperen den nødvendige installationskommando. Direkte `node tests/foo.cjs` uden profil-miljø er ikke den nye anbefalede indgang.

## GitHub Actions

- Engine/DOM-jobbet installerer **core + browser**. Det bruger browseren til sine eksisterende catalogue-/UI-regressioner, men har ikke Firebase CLI.
- De tre Adobe-shards, det brede browserjob og catalogue review-browseren installerer **browser**.
- Permissions-jobbet installerer **emulator** og får fortsat Java 21.
- Et separat, påkrævet Hosting-job installerer **hosting**. Det erstatter den tidligere Hosting-kontrol inde i engine-jobbet.
- `workspace` kræver alle engine-, browser-, Adobe-, permissions- og Hosting-resultater.
- Den eksisterende Linux/Windows operator-matrix kontrollerer også profil-wrapperen med core/browser. Operatorens `functions/`-SDK-installation og publicerede pakker er bevaret.

Installationshelperen skriver de valgte modul-/binary-stier til GitHub-jobbets miljø. npm-downloadcachen bruger den relevante profils lockfile; engine-jobbets nøgle dækker begge profiler. Testfiler, fixtures og de 71 Adobe-suites er bevaret.

## Opdatering og kontrol

Opdater versionen i den relevante profils manifest og regenerér dens lockfile. Hvis Firebase CLI opdateres, skal emulator- og hostingprofilerne holdes på samme version. Tests kontrollerer dette samt eksakte direkte versioner, lockfile-overensstemmelse, CI-tilslutning og manglende Firebase-pakker i core/browser.

```sh
npm --prefix tests run with -- "core,browser" node --test tests/test-dependency-profiles.cjs
```

Kontrollér nye imports, før et job får en ekstra profil. Tilføj ikke alle profiler til et job for at skjule en manglende dependency. Hosting-reglerne udelukker fortsat `tests/` og alle `node_modules` fra hjemmesiden; dette er en CI-/udviklingsforbedring, ikke i sig selv en hastighedsændring for spillerens sideindlæsning.

## Måling i udviklingsmiljøet

De rene installationer fylder omtrent 7,8 MiB (core), 16 MiB (browser), 510 MiB (emulator) og 380 MiB (hosting), mod ca. 536 MiB for den tidligere fælles installation. Dette er Node-pakker på den aktuelle Linux-maskine; Chromium, Java og emulator-JARs tælles ikke med. Browserjobbet går dermed fra hele pakken til ca. 16 MiB, og engine-jobbet bruger ca. 24 MiB. Faktiske npm-installationstider afhænger også af downloadcache, native builds og runner.
