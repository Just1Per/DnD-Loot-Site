# World- og NPC-billeder tæt på det synlige område

World- og NPC-oversigterne hentede tidligere alle de viste listens illustrationer, også langt under skærmens synlige område. De hentes nu først, når billedfeltet er synligt eller inden for 400 px af skærmen. Kortene beholder deres faste billedplads, så et forsinket billede ikke flytter listen.

I den isolerede browsertest med 24 illustrerede kort blev den første indlæsning reduceret fra 24 billedopslag til 12 ved 1440×1000 og 2 ved 390×1000. Det gælder både World og NPCs. Det er målte forespørgsler i testens layout; produktionsresultatet afhænger af skærm og indhold.

Hver visning har fortsat højst fire samtidige billedopslag. Artikellæsere og kapitler bevarer deres direkte billedindlæsning. Billeddekodning er markeret asynkron. Browseren bruger den eksisterende direkte indlæsning, hvis IntersectionObserver mangler.

Filtrering, navigation, adgangstab og kontoskift afkobler den gamle observer, gør dens ventende arbejde ugyldigt og frigiver billed-URLs. Allerede igangværende Firebase-kald kan ikke afbrydes, men deres forsinkede svar kan ikke indsættes i en anden liste, artikel eller konto. Udgivelse, Firestore/Storage-adgang og private originaler er uændrede. Ingen ny persistent cache eller delingstokens.

Denne ændring reducerer antallet af billeder, der hentes ved åbning af lange oversigter. Den tilføjer ikke nye thumbnail-filer og reducerer ikke størrelsen på hver publiceret illustration. Små preview-filer er et separat resterende punkt.

Validering: ny browsertest dækker reelle observer-events, desktop/mobil, scroll, tastaturåbning af artikler, billedtekster, samtidighed, filtrering, afvist adgang, kontoskift, URL-oprydning og fallback. Eksisterende tests af Journal-kort, World-navigation, fire World-layouts, spillerbilleder, kapitler og Hosting-packaging består.

Ingen nye Firestore-/Storage-regler, indeks, datamigration eller deployment.
