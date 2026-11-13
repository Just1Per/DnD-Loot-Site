# Satyr, movement og læsbare spells

Brugertest-opfølgning, november 2026. Feat/reaction-opfølgningen er fortsat i samme PR.

## Satyr og kildevalg

Satyr fra *Monsters of the Multiverse* fandtes allerede i kataloget. Adobe-vælgeren filtrerede imidlertid alle ældre racer væk, når karakteren valgte 2024-regler. Den viser nu også kampagnens tilladte ældre racer til en 2024-karakter. Valget angiver bog og original regeludgave; det udgiver sig ikke for at være en ny 2024-udgivelse. En kampagnes eksplicitte begrænsning til 2024-kilder respekteres stadig.

Begge Satyr-varianter er kontrolleret mod `races.json` fra den pinnede revision `b9061583536101068b3a59d27e886d1fa664e366`. Fuld source-prosa og fluff kopieres ikke ind i appen.

| Variant | Kilde | Fælles fakta | Forskelle |
| --- | --- | --- | --- |
| Satyr, MPMM | MPMM p. 29 | Medium Fey, 35 ft, Performance, Persuasion, ét instrument, Mirthful Leaps | Ram 1d6 + STR; Magic Resistance gælder spells; fleksible legacy-ability-valg og Common + et valgfrit sprog |
| Satyr, Theros | MOT p. 24 | Medium Fey, 35 ft, samme skills, instrument og hop | Ram 1d4 + STR; Magic Resistance omfatter også andre magiske effekter; legacy CHA +2/DEX +1, Common/Sylvan |

Med 2024-regler kommer ability increases fra baggrunden; legacy-racens ability increases lægges ikke oveni. Ram indgår i den fælles unarmed-beregning og sammenlignes med en aktiv Monk-die. Magic Resistance og Mirthful Leaps har korte bordpåmindelser; sheetet afgør ikke, om et konkret eksternt effect er magisk, eller hvor langt et slag på 1d8 hopper.

## Movement som egen tekst

Speed-feltet viser motorens aktuelle resultat, indtil spilleren skriver sin egen tekst. `adobe.movementText` er en privat, normaliseret tekst på højst 80 tegn og bevares ved save/reopen. Ryd feltet, eller skriv den aktuelle automatiske værdi, for at vende tilbage til den løbende beregning.

Teksten er en sheet-override til bordets aftalte movement. Den ændrer ikke motorens særskilte armor-, load-, class-, condition-, fly/swim/climb-beregninger. Den aktuelle beregning vises i feltets hjælp. Dobbeltklik eller Alt+Enter åbner de eksisterende movement/carrying-kontroller; Enter anvender teksten. En aktiv skrivedraft bliver ikke erstattet af en baggrundsopdatering.

## Korte beskrivelser og spell-liste

`CharacterSpellSummaries` har egne korte påmindelser til alle 969 katalogposter / 583 navne. Ændrede 2014/2024-regler, bl.a. Counterspell, Sleep, Resistance, Blade Ward, True Strike og Conjure-spells, har separate tekster. Beskrivelserne erstatter ikke de fulde regler.

Adobe-arkets Description bruger nu denne korte tekst frem for hele regelteksten med kildeintroduktion. Spilleren kan stadig skrive en egen kort beskrivelse i feltet; den gemmes som `spells[].shortDescription`, højst 400 tegn. Feltet kan ryddes for at genbruge forslaget. `notes`, source-ID, casting class, prepared state og fulde beskrivelser bevares. Save, school, time, range og duration forkortes på det kompakte papir; fulde værdier findes i spell-information og læselisten. Papirets eksisterende felter, continuation-indeks, slot-puljer og print-rækkefølge ændres ikke.

**Read spell list** ved spell-sidens overskrift åbner en særskilt læsevisning, som grupperer Cantrips, 1st-level spells osv. Den viser navn, kort beskrivelse, save, school, casting time, range, components og duration. Man kan filtrere efter caster eller søge på navn/effekt/school og udfolde fulde regler og egne noter ved at vælge navnet. På mobil vises de samme oplysninger som kort med labels. Listen læser de normale spell-rækker og har ingen separat spell-gemning. Dialogen fjernes ved sessionskift.

## Regressioner

- Unit: source-forskelle, Ram/Monk, skill/type/speed, movement-tekst/fallback, fuld katalogdækning, ændrede edition-regler, normalisering og adskilte korte/lange tekster.
- Browser: legacy-valg i 2024, movement under Grappled og automatisk reset, private save/reopen, Alt+Enter til eksisterende popup, source-rigtige paperfelter, niveaugrupper, alle faktakolonner, søgning, fulde noter og session cleanup.
- Mobil: dialogens synlige lukning/footer, ingen vandret overflow, keyboard og axe.
- PDF: både automatisk Speed og egen kort spell-tekst; fulde personlige spell-noter kopieres ikke ind i den kompakte Description-kolonne.
