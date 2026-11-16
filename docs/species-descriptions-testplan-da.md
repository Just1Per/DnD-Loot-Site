# Test af racebeskrivelser

1. Opret eller åbn en level 4-karakter med 2014-regler. Vælg Shadar-kai i Race-feltet på første side.
2. Gå til **Features & equipment**. Racial Traits skal forklare teleport, 60-ft Darkvision, Fey Ancestry, Keen Senses, Necrotic Resistance og Trance. Trance skal beskrive fire timers long rest og to midlertidige våben-/værktøjsfærdigheder.
3. Gem og genåbn karakteren. Teksten skal være den samme. Skift til Sea Elf: de fælles egenskaber skal stadig forklares, men havets egenskaber skal erstatte Shadar-kais teleport og Necrotic Resistance.
4. Skift til en ældre High Elf. Trance skal beskrive hvilen uden at tildele MPMM-udgavens midlertidige færdigheder. Half-Elf skal have Fey Ancestry, men ingen Trance.
5. Prøv Pallid Elf, Lotusden Halfling, Fire Genasi, Simic Hybrid og 2024 Tiefling. Racial Traits skal indeholde forklaringer. Ved Simic Hybrid/Tiefling skal det valgte enhancement/legacy kunne identificeres; fremtidige spells/fordele skal have tydelige niveaubetingelser.
6. Vælg 2024 Elf, og skift mellem Drow og High Elf. Darkvision-beskrivelsen skal skifte fra 120 til 60 ft. Gemte, uvalgte alternativer må ikke blive aktive.
7. På mobil: brug sidemenuen til Features & equipment, zoom om nødvendigt, og rul i længere tekstfelter. Siden må ikke få vandret overflow.
8. Udskriv til PDF. Hele racebeskrivelsen skal være læsbar; tekst, som ikke kan være i det oprindelige felt, fortsætter på en Notes-side med reference. Trances sidste sætning må ikke forsvinde.

Automatisk kontrol: `node scripts/test-profiles.cjs run core -- node --test tests/character-species-descriptions.cjs` og `node scripts/test-profiles.cjs run browser -- node tests/adobe-species-descriptions-browser.cjs`. Browserprofilen kræver installeret Playwright Chromium samt `pdftotext`. Den nye browsertest er også med i den samlede Adobe-testliste.

Denne test gælder beskrivelsestekst og dens præsentation. Den godkender ikke alle racespecifikke mekanikker som automatiserede. Den tilhørende audit skelner mellem beskrivelsesdækning og resterende mekanikarbejde.
