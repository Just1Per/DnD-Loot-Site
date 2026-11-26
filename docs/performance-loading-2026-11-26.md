# Loading, kataloger og CI — 26. november 2026

Denne levering måler og forbedrer første character-sheet-åbning, fordeler CI efter
målte tider og samler dokumentationens aktuelle indgange. Den ændrer ingen
karakterdata, katalog-records, kilde-id’er, Firestore-/Storage-regler eller dependencies.
Baseline er `a9103cf` efter merge af #290; eftermålingen bruger denne PR’s loader.

## Før/efter med HTTP og rigtig browsercache

Tre målinger pr. cachetilstand og version, samme executor, Chromium, 4× CPU,
80 ms simuleret netværkslatens, 1,25 MiB/s og gzip. Tabellen viser medianer.
Alle frontend-assets leveres over rigtig HTTP; browser-routing er ikke brugt,
fordi Playwright-routing ellers slår HTTP-cache fra. Auth, kampagne og Library
bruger et isoleret in-memory SDK og en lille/tom testkampagne. Navigation nulstilles
før varm reload, mens HTTP-cache beholdes. Det er en kontrolleret frontend-måling,
ikke produktionens login-, Firestore- eller billedtider.

| Cache | Trin | Før | Efter |
| --- | --- | ---: | ---: |
| Tom HTTP-cache | Landing | 3.670 s | 3.676 s |
| Tom HTTP-cache | Første åbning af Adobe-sheet | 12.081 s | 6.263 s |
| Tom HTTP-cache | Genåbning i samme dokument | 3.072 s | 2.932 s |
| Varm HTTP-cache | Landing | 1.012 s | 1.043 s |
| Varm HTTP-cache | Første åbning af Adobe-sheet | 5.089 s | 4.684 s |
| Varm HTTP-cache | Genåbning i samme dokument | 2.422 s | 2.872 s |

Første kolde åbning falder fra **12,081 s til 6,263 s**, cirka **48 %** i denne
opsætning. Begge versioner henter de samme 78 ressourcer / 709.695 transfer-bytes
i dette trin. Gevinsten kommer fra overlappende download, ikke fjernede regler.
Landing er omtrent uændret. Cachede åbninger/genåbninger viser fortsat væsentligt
renderer-/CPU-arbejde og variation; denne ændring fastslår ikke en generel forbedring
af genåbning. Den næste profilering bør fokusere på dét arbejde.

[Alle førmålinger](performance/loading-before-2026-11-26.json),
[alle eftermålinger](performance/loading-after-2026-11-26.json).

### Hvad loaderen ændrer

De 71 ekstra tool-scripts bliver fortsat først hentet efter eksplicit brug.
Når en gruppe åbnes, starter det første script normalt, mens resten af samme
gruppe preloades. Scripts udføres stadig ét ad gangen i den oprindelige rækkefølge.
Samtidige åbninger deler downloads; vellykkede scripts/wrappers bevares ved fejl,
og kun fejlede loads skal genforsøges. Preload er ikke en ekstra tilladelse til at
åbne en karakter: eksisterende konto-, kampagne-, aktør- og sessionskontroller
bestemmer stadig, om resultatet må bruges. Preload-fejl er ikke en falsk succes;
den faktiske script-load er autoritativ.

Den nye HTTP-regression holder første script tilbage, indtil de senere downloads
er startet. Den kræver korrekt udførselsrækkefølge og præcis én vellykket download
pr. fil ved samtidige/genbrugte åbninger. De eksisterende integrerede tests bevarer
fejl/retry, wrapper-isolation, alle 127 companion-records, gemning/genåbning,
spell-generation, print og afvisning efter konto-/kampagneskift.

### Anonym live-landing

Den eksisterende offentlige `https://dnd-loot-site.web.app` blev åbnet anonymt i
et separat, tomt browser-context uden login eller konto-/kampagneskrivninger.
Én kold/varm måling var **3,532 s / 1,133 s** med de samme throttle-indstillinger.
Det er en baseline for den allerede publicerede version, ikke en eftermåling af
PR-koden. Browseren accepterede eksekveringsmiljøets HTTPS-proxycertifikat; eksterne
Resource Timing-bytefelter kan være ufuldstændige uden Timing-Allow-Origin.
[Resultat og afgrænsning](performance/loading-public-2026-11-26.json).

## Katalogvurdering

Den statiske inventering finder **176 startup-scripts**, 3.803.155 bytes før gzip
(ca. 1.011.502 bytes med gzip pr. fil), og **71 ekstra scripts** på 1.111.480 bytes.
Dette er filstørrelser; det er ikke brugerens samlede download eller en ny
unused-code-analyse af det fælles scope.

- `catalog.json`: 1.207.949 bytes / 202.664 gzip-bytes; 969 spells og 302 feats i
  begge editions. Indholdshash/release er uændret.
- `monsters.json`: 1.352.087 bytes / 166.992 gzip-bytes. Det er allerede en
  behovsstyret creature-katalogindlæsning.
- Alle kontrollerede landing/login/kampagne-trin henter **nul** af disse JSON-filer.
  Spell/feat-kataloget hentes ved character-sheet-behov; Library-kataloget har
  fortsat sin eksplicitte Load magical items-handling og sin eksisterende cache.
- Der er stadig startup-data, fx `character-pinned-item-data.js` på 357.279 bytes.
  Ikke alle regeldata er dermed lazy. Flytning kræver gennemgang af modulers
  IIFE-referencer og engine-afhængigheder, før udførselsrækkefølgen ændres.
- Ingen byte-identiske JS/rules-JSON-dubletter over 1 KB blev fundet. Ensartede
  navne/records i begge editions er ikke i sig selv sletbare dubletter.

Der er derfor ikke lavet en ny spell/feat-JSON-opdeling uden behovsbevis. Det
nuværende katalog har integritetskontrol, Firestore-parts og en content-addressed
release, og klienten kan bruge spells/feats på tværs af editions. En senere
opdeling skal have en kompatibel, versioneret manifest-adapter og bevare alle
kilde-id’er og eksisterende karakterreferencer. Ingen kildeprosa eller katalogdata
kopieres ind i nye runtime-tabeller.

[Inventering med hashes og størrelser](performance/runtime-data-2026-11-26.json).

## CI-fordeling med bevaret dækning

Timinggrundlaget er den grønne #290-kørsel **45703716747**, commit `0fff5e4`.
`tests/browser-suite-timings.json` gemmer fil-/kommando-tider og provenance.

| Gruppe | Målt tidligere | Fordeling efter de registrerede vægte |
| --- | --- | --- |
| 112 Adobe-browserfiler | 462,1 / 320,9 / 359,1 s | ca. 379 / 382 / 382 s |
| 97 øvrige npm-browserchecks | ca. 574 s i én sekvens | ca. 191–192 s pr. gruppe før ny HTTP-check |

Tallene til højre er plan-estimater, ikke lovede runner-tider. Kø, installation,
runner-variation og artifact-upload kommer oveni. Site-gruppen får to ekstra
setup-jobs; formålet er kortere ventetid, ikke et løfte om færre samlede CI-minutter.

Fordelingen bruger længste målte suite først og næste ledige gruppe. Inden for
en gruppe beholdes manifest-rækkefølgen. En ny suite får medianvægten, så den ikke
forsvinder, mens den mangler sin første måling. Alle 112 Adobe-filer og alle 97
oprindelige site-kommandoer er med præcis én gang; HTTP-regressionen er tilføjet.
Begge matrixjobs har `fail-fast: false`, unikke artifacts og 14 dages retention.
Det obligatoriske `workspace`-check kræver succes fra **hele begge matrixer**.
Det eksisterende checknavn **Browser and navigation** bevares som et særskilt
samlecheck, så eksisterende repository-regler fortsat kan referere til det.

Begge runners understøtter `--report FILE` og gemmer varigheder, exitstatus samt
om kørslen blev fuldført. En fejl giver en ufuldstændig rapport med den fejlede
suite; resterende suites påstås ikke kørt. Fortsat dækning/partition, fallback,
workflow-afhængigheder og fejlrapportering har målrettede regressionstests.

## Dokumentation og næste konkrete punkter

[docs/README.md](README.md) er den fælles aktuelle indgang. De gamle målinger,
stabiliserings-/Overview-noter og den første cleanup er markeret som historiske.
#250-instruktionen er opdateret efter merge; map-management og kampagnefarver er
markeret merget, og rod-README skelner igen mellem operator-SDK og mail-backend.
Ingen beslutnings-, attribution-, audit- eller recovery-filer slettes.

Resterende performance-arbejde er konkret:

1. Profilér cached character-sheet-rendering/genberegning på en faktisk stor karakter.
2. Mål rigtigt login, Firestore og billedtunge kampagnesider på en repræsentativ
   spillerenhed; de isolerede fixture-tider kan ikke erstatte det.
3. Vurder afkobling af startup-regeldata ud fra deres faktiske referencekæder og
   relevante save/reopen-/regeltests, frem for at flytte filer på størrelse alene.
4. Opdatér CI-vægtene fra flere nye grønne timing-rapporter, hvis skævhed gentager sig.
5. Vurder en eksplicit Hosting-buildmappe/staging-manifest separat; den nuværende
   Hosting-grænse og alle runtime-URL’er er bevaret.

## Reproduktion

```sh
node scripts/test-profiles.cjs run browser -- node scripts/benchmark-loading.cjs --runs 3 --app-ref a9103cf --out /tmp/loading-before.json
node scripts/test-profiles.cjs run browser -- node scripts/benchmark-loading.cjs --runs 3 --out /tmp/loading-after.json
node scripts/test-profiles.cjs run browser -- node scripts/benchmark-loading.cjs --runs 1 --url https://dnd-loot-site.web.app --out /tmp/loading-public.json
node scripts/audit-runtime-data.cjs --out /tmp/runtime-data.json
node scripts/run-adobe-connected.cjs --shard 1/3 --list
node scripts/run-site-browser.cjs --shard 1/3 --list
node scripts/test-profiles.cjs run core -- node --test tests/browser-suite-plan.cjs tests/adobe-suite-runner.cjs tests/test-dependency-profiles.cjs
```

Chromium skal være installeret til browserprofilen. En måling med `--app-ref`
bruger den valgte revisions bootstrap sammen med checkoutens øvrige assets, så
før/efter skal afgrænses til den ændrede loader, som her. Benchmarken starter kun
en loopback-server i fixture-mode. Den er ikke en Hosting- eller rules-deploy.
