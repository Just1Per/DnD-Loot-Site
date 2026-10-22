# Hastighedsgennemgang — 22. oktober 2026

Gennemgået mod `main` a389055 (#174 merged). Formål: prioritere de målbare flaskehalse fra første besøg til login, kampagner, lister og billeder. One Shots er parkeret. Ingen produktionsdata, regler eller hosting er ændret under gennemgangen.

## Hvad målingen dækker

`scripts/audit-public-loading.cjs` åbner den offentlige hjemmeside uden login eller klik, i Chromium med tom browsercache og derefter samme browser med varm cache. Det logger kun ressourceadresser uden query strings, størrelser, cache-information og tider. Ingen kontodata eller credentials eksporteres. TLS-verifikation var slået til; miljøets eksisterende proxy-CA blev betroet i testbrowseren.

Desktopprofil: 40 ms simuleret latency, 2.000.000 bytes/s, normal CPU. Mobilprofil: 390 × 844, 100 ms, 187.500 bytes/s (1,5 Mbit/s), 4× CPU-begrænsning. Der er én komplet kold/varm måling per profil. Proxy, runner og det simulerede netværk påvirker tiderne; de er ikke løfter om brugerens egen forbindelse eller en fuld Core Web Vitals-vurdering.

Miljøets netværk blokerer `www.google.com/recaptcha/enterprise.js`. Appen nåede sin ready-hændelse, men målingen kan derfor ikke bruges som en komplet test af Firebase App Check eller login. Dette er en målebegrænsning, ikke bevis på en produktionsfejl. App Check ændres ikke.

| Profil | App ready, kold cache | Load-event, kold cache | App ready, varm cache | Afsluttede ressourcers overførte bytes, kold cache |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 4.368 ms | 4.368 ms | 100 ms | 4.086.421 |
| Mobil | 8.600 ms | 16.760 ms | 317 ms | 4.086.872 |

De sanitiserede måledata ligger i `docs/performance/public-loading-2026-10-22.json`.

Der blev observeret 139 ressourceforespørgsler per sidevisning; varm cache gav 138 cachetræffere og ingen overførte indholdsbytes for de succesfulde ressourcer. Logiske cacheforespørgsler er ikke det samme som nye netværksdownloads. Favicon kan indlæses efter load-eventet; auditten venter også på network idle, så billedbytes medregnes. Mobilen havde to long tasks på tilsammen 163 ms, største 93 ms. Det peger i denne måling mere mod netværk/initiale assets end omfattende CPU-blokering.

## Prioriteret arbejde

| Prioritet | Område og fund | Anbefalet ændring | Effekt og afgrænsning |
| --- | --- | --- | --- |
| 1 | Logo: 2.151.895 bytes, 1312 × 1199, vist ved 55 × 55 CSS-pixels. Favicon: 1.172.961 bytes, 1254 × 1254. Samlet faktisk overførsel ca. 3,29 MB. | Lav særskilte, pixeltilpassede UI-assets: logo omkring 128–144 px til 2× skærme og favicon 32/48/64 px. Brug effektivt format med bevaret transparens og sammenlign visuelt. Behold originalerne. | Logo og favicon står for ca. 80 % af den målte første overførsel. Største dokumenterede mulighed. Et samlet budget på fx 50 KB er et mål, ikke en allerede målt filstørrelse eller tidsgevinst. |
| 2 | Login læser hver rules-edition igen under hydrate efter allerede at have hentet metadata, klasser og subclasses. | Genbrug det allerede indlæste snapshot. Efter en admin-publicering hentes den friske version stadig. | Første forberedte kodeændring: regelopslag 12 → 6, samlet kontoforløb 13 → 7 SDK-læsninger. Rettigheder og katalogindhold bevares; ingen persistent cache. |
| 3 | `loadCurrentUser` venter på optional directory-synkronisering og begge regelkataloger, før dashboardet kan vises. Dashboardet henter også karakterer fra alle kampagner før visning. | Mål disse faser efter login. Flyt kun uafhængigt arbejde ud af den kritiske vej; vis dashboard tidligere og indlæs karakterer efter behov. Sørg for katalog-readiness inden sheet/build-handlinger. | Sandsynlig næste login-gevinst, men endnu ikke målt mod en virkelig konto. Må ikke skabe forkerte karakterregler eller sene kontoskift-opdateringer. |
| 4 | 102 featurefiler og 23 lokale stylesheets indlæses fra starten. Featurekoden fylder ca. 1,77 MB ukomprimeret; CSS ca. 346 KB. | Undersøg en opdelt build: lille shell/login-del først, karakterbygger/spells/print og DM-editorer efter behov. Test derefter bundling/minificering. | Preloads henter allerede featurefiler parallelt; det er ikke 102 sekventielle netværksrundture. Komprimeret JS/CSS fylder langt mindre end UI-billederne. Gør dette efter de enklere gevinster. |
| 5 | Journal/World/NPC-kort henter alle publicerede illustrationer i den indlæste liste. Fire samtidige opslag begrænser køen, men reducerer ikke samlet datamængde. Samme publicerede billede bruges til kort og læsevisning. | Lazy-load kortbilleder nær viewporten. Tilføj små beskyttede thumbnails ved publicering og behold større læsebilleder. Mål før der tilføjes cache. | Et publiceret billede kan være op til 512 KB før base64. Mange kort kan derfor blive dyre. Nye thumbnail-felter/dokumenter kræver koordinerede regler og tests; eksisterende billeder må ikke automatisk gøres offentlige. |
| 6 | Library har allerede 48-korts sider og lazy-loading, men billed-URL-opslag har ingen fælles pending-promise for samme artwork-path. Placeholderen er 313 KB og 794 × 794. | Saml samtidige opslag for identisk artwork; brug en lille placeholder og passende thumbnail til kort. | Undgå gentagne metadataopslag. Browseren kan genbruge samme placeholder-download, så den skal ikke tælles 48 gange. Private item-billeder skal fortsat være kontrollerede. |
| 7 | Kampagneåbning læser kampagne og medlemskab sekventielt; efterfølgende data venter i flere grupper. Item-handlinger genindlæser ofte items, inventory, saves og supply samlet. DM Overview indlæser hele præparationssamlinger for seks seneste poster. | Parallelisér uafhængige adgangsopslag, og opdatér kun berørte data efter en handling. Overvej begrænsede sorteret/sideinddelte forespørgsler til overblik og store lister. | Skal måles på repræsentative kampagner. Adgang skal stadig kontrolleres før visning; større query-ændringer kan kræve indekser og tilpassede tests. |
| 8 | HTML, logo og app-entry leveres med `Cache-Control: max-age=3600`. Samme globale JS-version skiftes for alle features ved en lille ændring. | Behold hurtig browsercache, men giv HTML en eksplicit revalideringsstrategi. Brug indholdshashede navne til langtidscache af uforanderlige assets. | Kan forbedre genbesøg/opdateringer og mindske unødig genhentning efter releases. Sæt ikke blindt `immutable` på eksisterende filnavne, som kan ændres uden versionsskift. |
| 9 | Kampagneforside/kort kan læse originaler på op til 5 MB; private entry-uploads tillader knap 5 MB, mens publicering laver en mindre kopi. | Brug størrelsestilpassede visninger/komprimering ved upload eller publicering. For kort: bevar læsbare stednavne og zoom-detaljer; mål behovet for fliseopdeling frem for blind nedskalering. | Ingen automatisk omskrivning af eksisterende kampagnebilleder eller tab af originaler som del af denne audit. |

## Første kodeændring og reproduktion

`ensureGlobalCharacterRulesReference` giver nu det versionstjekkede snapshot videre til `hydrate`, så metadata/klasser/subclasses ikke hentes to gange. Den oprindelige indlæsningsrækkefølge og admin-seeding er bevaret. Kald uden et allerede indlæst snapshot læser stadig aktuelle data. Et kendt manglende katalog bruger den eksisterende bundled fallback uden endnu et identisk opslag.

```sh
node scripts/benchmark-rules-login.cjs a389055
node --test tests/runtime-cleanup.cjs
PLAYWRIGHT_PATH=<Playwright module> node scripts/audit-public-loading.cjs
```

Benchmarken for login bruger en isoleret SDK-fixture med 25 ms forsinkelse per operation og ingen netværkskald. Tre før-målinger: 251/253/252 ms. Tre efter-målinger: 152/151/151 ms. Det er kontoprofil/regel-initialisering i en kontrolleret fixture, ikke samlet virkelig login-tid. Katalog-opslag reduceres fra 12 til 6; account-read og den eksisterende directory-write er uændrede. Tests dækker også en manglende edition, direkte hydrate-kald og frisk admin-publicering.

## Hvad der allerede er gjort

Library-render-snapshots, 48-korts visning og den beskyttede illustrationskø med højst fire samtidige læsninger er allerede på main. Se `library-render-performance.md`, `library-result-pages.md` og `shared-illustration-loading.md`. UI-sider er kun klient-side rendering; hele den tilladte item-liste hentes stadig. Den tidligere offline-bootstrap-test viser fungerende parallel preloading, ikke reel Firebase/login-tid.

## Næste målinger og leverancer

1. UI-logo/favicon/placeholder: før/efter overførte bytes, koldt mobilbesøg, 1×/2× visuel sammenligning og samme design.
2. Login: separate tider for account, rules-reference, dashboard og første kampagne. Ingen adgang til eller eksport af passwords, tokens, cookies eller private tekster er nødvendig.
3. Repræsentative små/store kampagner: antal forespørgsler og synlig-side-tid for Home, Library, Journal, kort og sheet. Mål første og gentagne åbning samt søgning/filtre.
4. Billeder: antal downloads, størrelse og tid til synlig illustration ved liste → artikel → tilbage, herunder mobil. Test adgangsændringer og kontoskift samtidig med performanceændringerne.
5. Først derefter større ændringer til code splitting, datamodel, thumbnail-regler eller persistent caching.

Denne audits første runtime-ændring kræver ingen Firestore-/Storage-regler, indekser, migration eller produktionsdeploy. Guide/knapforløb ændres ikke; rapporten forklarer de tekniske målinger uden at lægge dem ind i brugergrænsefladen.
