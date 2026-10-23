# Opfølgende hastighedsmåling — 22. oktober 2026

Den offentlige side er målt igen med den uændrede `scripts/audit-public-loading.cjs`: kold og varm browsercache på desktop og simuleret mobil. Ingen login, klik, private kampagnedata eller produktionsændringer. Sammenligningen er med den oprindelige måling i `site-performance-audit-2026-10-22.md`; den dækker de allerede udgivne optimeringer, ikke kun denne PR's loot-/ønskelisteændring.

## Resultater

| Profil | Oprindelig måling | Ny måling |
| --- | ---: | ---: |
| Desktop: overførte bytes, kold cache | 4.086.421 | 805.059 |
| Mobil: overførte bytes, kold cache | 4.086.872 | 805.002 |
| Desktop: app klar, kold cache | 4.368 ms | 5.021 ms |
| Mobil: app klar, kold cache | 8.600 ms | 7.213 ms |
| Mobil: load-event, kold cache | 16.760 ms | 7.247 ms |
| Desktop: app klar, varm cache | 100 ms | 111 ms |
| Mobil: app klar, varm cache | 317 ms | 394 ms |
| Ressourceforespørgsler pr. visning | 139 | 134 |
| Featurefiler ved opstart | 102 | 97 |

**Den samlede overførsel er reduceret cirka 80 %.** Det store UI-logo er erstattet med `assets/ui/logo-144-v1.webp`, som overførte cirka 30 KB i den nye desktopmåling. Varm cache gav 133 cachetræffere og ingen overførte indholdsbytes fra succesfulde ressourcer. Logoet blev indlæst korrekt i alle fire visninger.

Tiderne varierer: mobilens kolde load-event var tidligere, mens desktop var langsommere i dette ene forsøg. Målingerne dokumenterer en stor reduktion i bytes, men giver ikke et stabilt estimat for en brugers tidsgevinst. Begge gennemgange har ét koldt/varmt forsøg pr. profil; runner, proxy, eksterne servere og cache påvirker tiderne.

## Metode og begrænsninger

Samme profiler som før: desktop 40 ms latency/2.000.000 bytes per sekund; mobil 390 × 844, 100 ms latency/187.500 bytes per sekund og 4× CPU-begrænsning. Scriptet venter på app-ready, load og network idle, så sent hentede billedressourcer medregnes. Ingen registrerede long tasks eller browserfejl i den nye måling. Certifikatvalidering var aktiv; browseren betroede miljøets eksisterende proxy-CA.

Miljøet blokerer fortsat `www.google.com/recaptcha/enterprise.js`. Siden nåede app-ready, men dette er **ikke en komplet test af App Check, login eller autentificerede kampagnesider**. Blokeringen er en miljøbegrænsning, ikke dokumentation for en produktionsfejl. App Check er uændret, og netværkspolitikken er ikke omgået.

World/NPC-billeder ligger bag adgangskontrol og er ikke en del af den offentlige måling. Deres separate miniaturetest dokumenterer 486.316 → 62.606 billedbytes pr. kort i en deterministisk fixture; det er ikke et live tidsmål. Loot og ønskeliste testes tilsvarende med SDK-forespørgselstælling, uden adgang til en virkelig konto.

Sanitiserede rådata: `performance/public-loading-followup-2026-10-22.json`. URL'er gemmes uden query strings; ingen tokens, cookies eller kontotekster indsamles.

## Næste målbare arbejde

Den største enkelte afsluttede download i denne måling er Firebase Firestore SDK, cirka 180 KB. Appen indlæser stadig 97 featurefiler før en bruger vælger en funktion. En senere optimering bør derfor måle, hvilke resterende karakter-/DM-moduler der kan indlæses efter behov, og kontrollere login, genåbning og første besøg på hver destination. Uændrede filnavne leveres fortsat med `max-age=3600`; cacheversionering skal håndteres sammen med eventuel yderligere opdeling.

Der er ikke dokumenteret en ny nødvendighed for databaseindekser, nye regler eller produktionsmigrering i denne opfølgning.
