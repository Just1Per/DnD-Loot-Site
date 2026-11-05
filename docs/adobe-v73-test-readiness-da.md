# Klar til Adobe-brugertest

Dette er stoplisten før den første **bredere** sammenligningstest med Adobe-arket. Den afgrænser testen til karakteroprettelse, tekst på arket, spells, centrale PDF-knapper, gemning og print. Den betyder ikke, at hele PDF-paritetsbackloggen skal være færdig.

## Testblokeringer

| Status | Arbejde | Hvorfor det skal være færdigt før test |
| --- | --- | --- |
| Åben | Læg de lokale commits på PR #250 og en testbar preview | Testere skal have den samme version med Special features, spillerredigerbare spell/feat-felter og testarket. PR’en indeholder dem ikke endnu. |
| Åben | Færdiggør race- og feat-spell valg direkte fra Generate spell sheet | Klasse-spells åbner allerede deres native picker. Race- og feat-trinnene viser kilden, men fører fortsat videre til Origins/Feat-valget i stedet for en færdig kilde-specifik spell-dialog som Adobe. |
| Åben | Gennemfør browserkontrol af de nye flows | Bekræft Special features, source-guide, eget spell/feat-tekstfelt, Save/genåbn og print med den offentlige always-All visning. De tidligere målrettede adaptertests er grønne, men erstatter ikke dette. |
| Åben | Vælg og dokumentér testdata | Sørg for at den aktuelle katalogversion indeholder de spells/feats, som testprofilerne bruger. Hvis 5etools-metadata skal bruges, kør den staged import først; den må ikke aktiveres som regelsæt uden mapping-review. |
| Åben | Fastlæg feedbackvej | Del [sammenligningsarket](adobe-v73-comparison-test-da.md), og aftal hvor hvert udfyldt ark, screenshot og opfølgende spørgsmål samles. |

## Bør være færdigt i samme testforløb

| Status | Arbejde | Testens forventning |
| --- | --- | --- |
| I gang | Gennemgå alle synlige knapper på de testede sider | Hver knap skal enten have den lovede handling eller være tydeligt utilgængelig med en konkret forklaring. Ingen knap må åbne det fjernede Sheet tools-panel. |
| I gang | Kontroller kilde- og regelgrænser for Sorcerer, Cleric, High Elf og Magic Initiate | Known/prepared/always-prepared/race/feat-spells må ikke blande adgang eller forbrug. |
| I gang | Kontrollér spillerens tekstkopier | Valgt katalogtekst skal fylde spell/feat-feltet; brugerens egen tekst skal overleve Save/genåbn uden at ændre mekanikken. |
| I gang | Kontrollér connected print | Zoom/print på arket, header-print og tastaturprint skal sende alle relevante ark til browserens printdialog. |

## Ikke testblokeringer

Disse bliver stående på PDF-paritetsbackloggen og kan indgå som feedbackområder, men de behøver ikke være komplette for at begynde den afgrænsede brugertest:

- Alle magic-item-varianter, avancerede equipment-menugrene og alle Adventure Log-overførsler.
- Alle class-specifikke companion-skaleringer og betingede layout-/printvarianter.
- Fuld import og aktivering af 5etools-data for alle domæner, især items. Den eksisterende referencekatalog kan bruges til den første test.
- En fuld 1:1 PDF-paritetsgodkendelse for hver original Acrobat-menu.

## Anbefalet rækkefølge

1. Færdiggør race- og feat-spell-dialogerne og den offentlige browserkontrol.
2. Opdater PR #250 med den samlede testversion og opret preview.
3. Kør de fire anbefalede karakterprofiler i [sammenligningsarket](adobe-v73-comparison-test-da.md).
4. Triagér feedback som **blokerende fejl**, **forkert regel/beregning**, **manglende Adobe-funktion**, **forbedringsforslag** eller **nyttigt website-fortrin**.
5. Ret blokerende fund før næste testergruppe; behold øvrige fund i den prioriterede backlog.
