# Klassetest og Adobe-opfølgning — 24. oktober 2026

Opdateret 25. oktober: `main` ved `24f6214` indeholder #219–224. Denne gren tilføjer Wizard Arcane Recovery. Ingen klasse er endnu færdigkontrolleret for alle features, levels, subclasses og kildebøger. Tabellen viser konkrete funktioner, som nu kan testes, ikke et løfte om fuld klasseautomatik.

## Hvad kan testes nu?

| Klasse / version | Funktioner klar til test | Den større gennemgang mangler stadig |
| --- | --- | --- |
| Fighter | Fighting Style, 2024 Weapon Mastery, feat/ASI-antal, Second Wind, Action Surge, Indomitable samt 2024 Tactical Mind/Shift | Resterende betingede features og subclass-valg; Extra Attack kommer i #222 |
| Bard | Expertise, Jack of All Trades, inspirationens antal/terning, Font og Superior Inspiration; 2024 spell-slot-veksling | Magical Secrets, Countercharm, Words of Creation og subclass-specifikke features |
| Rogue | Expertise, Thieves’ Cant, 2024 Weapon Mastery og Slippery Mind | Ekstra skill/sprog ved de relevante valg, Sneak Attack, Cunning Strike, Reliable Talent og øvrige betingede features/subclasses |
| Warlock | Invocation-valg/prerequisites, Devil’s Sight, Witch Sight, Eldritch Mind, Beguiling Influence, Eyes of the Rune Keeper, Agonizing Blast og Eldritch Spear | Flere casting-invocations, Pact Blade/Chain/Tome-effekter, Mystic Arcanum og øvrige class/subclass-features |
| Monk | Fælles Ki/Focus-pulje, feature-DC, rest, level-14 saves/reroll og 2024 Body and Mind | Martial Arts, movement, individuelle teknikker, special recovery og subclasses |
| Artificer — Tasha’s / 2014 | Artisan-tool-valg, Tool Expertise, Flash of Genius og attunement-grænser | Infusions, Spell-Storing Item, crafting, Soul of Artifice og subclasses. Kildevalget er nu adskilt fra core-edition; kontrollér både primærklasse og multiclass |
| Artificer — Eberron: Forge of the Artificer | Særskilt kildevalg på 2024 core, kildekorrekt feature-reference, preparation/multiclass-spellprofil, attunement og Flash | Replicate Magic Item, planer/crafting, Spell-Storing Item, øvrige effekter og subclasses |
| Cleric — 2024 | Divine Order: Protector/Thaumaturge, udstyrstræning, skill-bonus og ekstra cantrip | Channel Divinity, Blessed Strikes, Divine Intervention og domains |
| Druid — 2024 | Primal Order: Warden/Magician, skill-bonus, ekstra cantrip og Druidic | Wild Shape-classfunktioner, ressourcer, Elemental Fury og øvrige features/circles |
| Barbarian | 2024 Weapon Mastery og Primal Champion på level 20 i begge editions | Rage, movement, betingede angreb/defenses og subclasses |
| Ranger | Fighting Style, 2024 Weapon Mastery samt Deft Explorer/Expertise | 2014 Favored Enemy/Natural Explorer, ekstra sprog, Roving, optional Tasha’s og subclasses. #223 tilføjer Hunter’s Mark-brug, Tireless, Nature’s Veil, Feral Senses og Foe Slayer |
| Wizard | 2024 Scholar, class-baseret spellbook/preparation; denne gren tilføjer Arcane Recovery med samlet slotvalg, class-level-budget og edition-specifik nulstilling | Spell Mastery, Signature Spells og school-features |
| Paladin | Fighting Style og 2024 Weapon Mastery; eksisterende spell-grundlag. Denne gren tilføjer Lay on Hands-pulje med pointvalg og edition-specifikke cure/Restoring Touch-muligheder | Channel Divinity, auras, smite og oaths; målpersonens HP/conditions ændres stadig separat |
| Sorcerer | Sorcery Points, kildekorrekte Metamagic-valg/prerequisites og pointforbrug; 2024 Sorcerous Restoration | Font of Magic slot-veksling/skabte slots, Innate Sorcery, Metamagic Adept og øvrige features/subclasses |

Point Buy, class-level-baserede feat/ASI-antal, gem/genåbn og de fælles multiclass-beregninger er testet på tværs af alle 13 klasse-ID’er. Det er ikke det samme som, at alle klassernes features er gennemført.

## Forslag til din test-rækkefølge

1. **Fighter:** Prøv begge editions. 2024 Second Wind har 2 brug fra level 1, 3 fra 4 og 4 fra 10; 2014 har 1. Short Rest giver kun én tilbage i 2024. Action Surge unlocker ved 2 og får to brug ved 17. Indomitable unlocker ved 9 og har flere brug ved 13/17; 2024-bonussen gælder kun det valgte reroll.
2. **Bard:** Brug final Charisma 16 som eksempel: tre inspirationsbrug. Terningskift er ved Bard 5/10/15. Test Jack of All Trades på utrænede skills; kun 2014 giver også initiative-bonussen. Test Font fra 5, almindelig/Pact-slot-veksling i 2024 og Superior Inspiration ved 18 i 2024 eller 20 i 2014.
3. **Rogue:** Vælg Expertise ved 1 og 6. Ved Rogue 15 får 2014 Wisdom-save proficiency, mens 2024 får Wisdom og Charisma. Kontrollér, at manuel træning ikke lægger PB til igen.
4. **Warlock:** Lær Eldritch Blast i Spells. I 2024 vælges cantrip også under Agonizing Blast/Eldritch Spear. Final Charisma 16 giver +3 skade pr. beam. Warlock 2 giver Eldritch Blast 180 ft med revised Spear; legacy Spear giver 300 ft. Devil’s Sight skal stå særskilt i Senses.
5. **Monk:** Test points fra 2, alle saves/reroll fra 14 og revised Body and Mind ved 20. DC er 8 + character PB + final Wisdom modifier. Et reroll bruger ét point fra samme pulje.
6. **Tasha’s Artificer:** Test Tool Expertise ved 6, Flash ved 7 og attunement på 10/14/18. Prøv også en Headband of Intellect: alle viste Flash-brug skal kunne bruges. Vælg også Eberron-versionen separat med 2024 core; den må ikke få Tasha’s Tool Expertise. Kontrollér, at kilde og forbrug bevares efter gem/genåbn.
7. **Cleric/Druid 2024:** Skift mellem martial og magic Order. Med final Wisdom 16 giver magic-valget +3 til de relevante Intelligence-skills samt ét ekstra class-cantrip. Bonus til et check er ikke det samme som skill proficiency.
8. **Barbarian 20:** Primal Champion giver STR/CON +4; maksimum er 24 i 2014 og 25 i 2024. Brug Base scores, så arket beregner ændringen. Scores, saves, AC og Constitution-baseret HP skal følge med.

Test også **Extra Attack** på class-level-grænserne og **Ranger** i begge editions. Fighter 11 giver tre angreb; Fighter 5/Ranger 5 giver stadig to. Ranger 2024 har gratis Hunter’s Mark-castings uden slotforbrug; Tireless/Nature’s Veil følger Wisdom. Ved 18 er kun 2024 Feral Senses Blindsight. Ved 20 giver revised Hunter’s Mark d10, mens legacy Foe Slayer er en betinget Wisdom-bonus én gang på egen tur.

Genindlæs siden før testen. Brug gerne én testkarakter pr. edition. Efter et forløb: gem, luk arket og genåbn; prøv derefter et multiclass-level og kontrollér, at klassevalgene og forbruget er bevaret. Notér klasse, edition, class-levels, feature og forventet/faktisk resultat ved fejl.

## Adobe/MPMB: hvad er gennemgået?

Det tilgængelige materiale er de allerede udtrukne Adobe/MPMB v13.0.4/13.0.5-data og de tidligere auditrapporter i repositoryet. Selve PDF’en og dens indlejrede fulde rule-bundle er ikke til stede i dette workspace. Denne opfølgning gennemgår de bevarede data og den aktuelle webkode; den er ikke en ny kørsel inde i Acrobat eller en komplet ny scanning af PDF’en.

Metadataoversigten finder blandt andet 18 skills, de 12 oprindelige Adobe-baseklasser, 106 gear-records, 127 creatures og 239 magic-item-navne. Magic-item-indekset har 42 navngivne automatiske effektprofiler samt generiske våben/rustningsvarianter. Flere records end i Adobe betyder ikke, at deres effekter er implementeret.

De gamle tal om 77 choice groups og 8/9/60 coverage er historiske. De må ikke bruges som nutidig feature-status. Den aktuelle [level-for-level-oversigt](character-class-level-review.md) skelner mellem implementeret scope, delvis støtte og endnu ugennemgåede features.

Metadata-scannerens tidligere Firestore-varsel var baseret på en forældet kommentar/schema-allowlist og var ikke en rettighedstest. Scanneren angiver nu dette område som uden for sit scope og peger på de eksisterende permission/emulator-checks. Denne dokumentationsrettelse kræver ingen nye Firebase-regler.

## Det mest nyttige at hente fra Adobe-forløbet

Prioritér funktionalitet i de eksisterende områder:

1. **Afslut class-valg:** Metamagic, infusions/replication plans, Ranger-terræn/favored enemy, ekstra sprog og multiclass-skills. Registrér valgene, deres class-level-grænser og deres effekt; et referenceafsnit alene er ikke færdig funktionalitet.
2. **Betingede features og ressourcer:** Rage, Channel Divinity, Lay on Hands, Sorcery Points, Wild Shape og Reliable Talent. Brug relevante betingelser/forbrug frem for at tilføje permanente bonusser til alle rolls.
3. **Subclass-valg:** Totem-valg, Four Elements disciplines, Rune Knight-runer, Arcane Shot, Storm Herald og andre choice-producing features fra den historiske scan. Adskil udgivne kilder og UA; tilføj ikke alle eksperimentelle valg automatisk.
4. **Spell-valg og grants:** Korrekt kilde/edition, ekstra eller always-prepared spells, Metamagic/Arcanum-valg og fælles versus separate multiclass-puljer. Slot-veksling skal gemme begge sider af forbruget.
5. **Magic-item-effekter:** Gennemgå de indekserede items enkeltvis og udvid de sikre mekaniske profiler. Attuned/equipped er ikke nødvendigvis det samme som aktivt; midlertidige aktiveringer og charges skal være tydelige.
6. **Tool-checks og sprog:** Udvid de eksisterende skill/tool-områder med de valg, en feature faktisk giver. Bevar manuelle noter og lad ikke proficiency/Expertise stacke.
7. **Små inventory-hjælpere:** Se på ammunition, consumables, charges og vægt/encumbrance som valgfrie, kompakte funktioner. Tilføj dem først efter class-features og eksisterende beregninger er stabile.
8. **Rest, print og gem/genåbn:** Bevar de eksisterende knapper, men kontroller at relaterede counters, slots og midlertidige effekter følger samme regler. Print skal bruge de samme beregnede værdier som skærmen.

## Designramme

Bevar sidernes nuværende udseende, tabs og navigation. Tilføj små felter dér, hvor spilleren allerede leder efter dem. Brug kompakte/udfoldelige avancerede valg, én hjælp pr. sektion og hover/focus-hjælp til små felter. Opdatér Guide og de relevante infobokse med hver ny funktion. Kopiér ikke Acrobats særlige UI eller dokument-JavaScript ind i websitet.

Denne status ændrer ingen produktvisning, deployer ikke og ændrer eller migrerer ingen produktionsdata.
