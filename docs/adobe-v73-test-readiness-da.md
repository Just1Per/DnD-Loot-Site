# Klar til Adobe-brugertest

> Historisk v73-checkpoint. PR #250 er siden merget. Den aktuelle gennemgang af den udfyldte original og kravene før udfasning findes i [Mithral-valideringen](adobe-mithral-validation-da.md); tabellen nedenfor er ikke den aktuelle release-status.

Dette er stoplisten før den første **bredere** sammenligningstest med Adobe-arket. Den afgrænser testen til karakteroprettelse, tekst på arket, spells, centrale PDF-knapper, gemning og print. Den betyder ikke, at hele PDF-paritetsbackloggen skal være færdig.

## Testblokeringer

| Status | Arbejde | Hvorfor det skal være færdigt før test |
| --- | --- | --- |
| Åben | Læg de lokale commits på PR #250 og en testbar preview | Testere skal have den samme version med Special features, spillerredigerbare spell/feat-felter og testarket. PR’en indeholder dem ikke endnu. |
| Færdig lokalt | Direkte kildevalg fra Generate spell sheet | Klasse-spells åbner den native picker; race-spells åbner en dedikeret race-spell-dialog for High Elf og andre cantrip-pools; feat-spells åbner den native feat-dialog med Magic Initiate-valgene. Browserflowet dækker High Elf → Fire Bolt → Save/genåbn. |
| Færdig lokalt | Gennemfør browserkontrol af de nye flows | Bekræftet med `adobe-spell-sources-browser`, `adobe-editable-copy-browser`, `adobe-paper-controls-browser`, `adobe-native-feats-browser`, `adobe-native-spells-browser` og `adobe-connected-sheet-browser`: Special features, source-guide, eget spell/feat-tekstfelt, Save/genåbn, print og always-All-visning. |
| Færdig lokalt | Vælg og dokumentér testdata | De fire profiler i [sammenligningsarket](adobe-v73-comparison-test-da.md) bruger den aktuelle katalogbaseline. 5etools-import er bevidst ikke en afhængighed for denne test; staged metadata kan køres og mappes som et separat spor. |
| Klar | Fastlæg feedbackvej | Del [sammenligningsarket](adobe-v73-comparison-test-da.md) med testerne og aftal ét sted for udfyldte ark, screenshots og opfølgende spørgsmål. Selve skabelonen er klar. |

## Bør være færdigt i samme testforløb

| Status | Arbejde | Testens forventning |
| --- | --- | --- |
| Færdig lokalt | Gennemgå alle synlige knapper på de testede sider | De dækkede controls åbner deres lovede flow; ingen åbner det fjernede Sheet tools-panel. |
| Færdig lokalt | Kontroller kilde- og regelgrænser for Sorcerer, Cleric, High Elf og Magic Initiate | Native browserflows dækker known/prepared/always-prepared, race-cantrip og feat-spell valg uden at blande adgang eller forbrug. |
| Færdig lokalt | Kontrollér spillerens tekstkopier | Valgt katalogtekst fylder spell/feat-felterne; spillerens egen tekst overlever Save/genåbn, mens katalog-id og regelvirkning bevares. |
| Færdig lokalt | Kontrollér connected print | Zoom/print på arket, header-print og tastaturprint sender relevante ark til browserens printdialog. |

## Ikke testblokeringer

Disse bliver stående på PDF-paritetsbackloggen og kan indgå som feedbackområder, men de behøver ikke være komplette for at begynde den afgrænsede brugertest:

- Alle magic-item-varianter, avancerede equipment-menugrene og alle Adventure Log-overførsler.
- Alle class-specifikke companion-skaleringer og betingede layout-/printvarianter.
- Fuld import og aktivering af 5etools-data for alle domæner, især items. Den eksisterende referencekatalog kan bruges til den første test.
- En fuld 1:1 PDF-paritetsgodkendelse for hver original Acrobat-menu.

## Anbefalet rækkefølge

1. Opdater PR #250 med den samlede testversion og opret preview.
2. Kør de fire anbefalede karakterprofiler i [sammenligningsarket](adobe-v73-comparison-test-da.md).
3. Triagér feedback som **blokerende fejl**, **forkert regel/beregning**, **manglende Adobe-funktion**, **forbedringsforslag** eller **nyttigt website-fortrin**.
4. Ret blokerende fund før næste testergruppe; behold øvrige fund i den prioriterede backlog.
