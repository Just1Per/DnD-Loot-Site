# Karakterværktøjer ved første åbning af arket

Fire UI-moduler indlæses først, når man åbner et karakterark: builderens progression/HP, ekstra sider, companion-vælger og spellcasting-visningen. Den obligatoriske opstart går fra 101 til 97 featurefiler. De fire filer fylder tilsammen 97.368 ukomprimerede bytes; en lidt større loader er stadig i app.js. Det er filstørrelser, ikke en måling af samlet loadingtid eller nettobesparelse over netværket.

Første åbning henter offentlig UI-kode samtidig med private arkdata og printkoden. Formularen vises først, når alt er klar. Senere åbninger genbruger koden. Modulerne til beregninger, fælles referencekataloger og andre karakterfunktioner er stadig en del af opstarten; dette gør ikke hele karakterdelen dynamisk.

## Rækkefølge og genforsøg

UI-modulerne udvider hinandens funktioner. Loaderen bevarer rækkefølgen builder → ekstra sider → companion → spells og gemmer én promise pr. fil. Samtidige åbninger deler hver fil. Hvis en senere fil fejler, bevares de allerede installerede moduler; et genforsøg henter kun den fejlede og de resterende filer. Det undgår gentagne wrappers og event handlers. En mislykket script-node fjernes som før.

Koden virker efter fjernelse af bootstrap-processens midlertidige SDK-binding. Loaderen opbevarer kun offentlige kode-promises; ingen konti, private ark, credentials eller tokens. Konto-, kampagne- og generationskontroller før rendering bevares. Lukning eller skift af konto/kampagne under kodeindlæsning kan ikke åbne det tidligere ark.

## Kontrol

`test:sheet-tools-loading` kører de faktiske udskudte filer og den faktiske loader i Chromium, uden de fire UI-filer i testens opstart og med SDK-bindingen fjernet. Den kontrollerer ingen requests før åbning, sekventiel rækkefølge, fejl midt i kæden, genforsøg uden dobbelte wrappers, builder/companion/spell generation, save/reopen, print, cachegenbrug, samtidige åbninger og forsinkede konto-/kampagneskift eller lukning.

Print-loaderens regression bruger nu samme obligatoriske featureliste som appen, så den også tester integrationen med de udsatte UI-moduler. Eksisterende workspace-, spellcasting-, formular-, print- og packagingchecks kontrolleres særskilt.

Ingen Firestore-/Storage-regler, indekser, datamigrationer eller deployment kræves.

## CI-installation

GitHub-kørslen på `d812aa4` blev afbrudt i Chromium-installationen efter cirka 20 minutter. Loggen viser en fastlåst Ubuntu Azure-mirror; motortestene var endnu ikke startet. Begge browserafhængige jobs forbereder nu APT med den officielle HTTPS Ubuntu-archive i stedet for Azure-mirror, 20 sekunders netværkstimeout og to genforsøg. Chromium-installationen har sin egen grænse på seks minutter, så en installationsfejl rapporteres på det rigtige trin. PDF-værktøjet genbruger den allerede opdaterede pakkeliste. Signatur- og TLS-kontrol bevares. `tests/ci-apt-setup.cjs` kontrollerer mirrorlisten, begge kildeformater, uændrede tredjepartskilder og gentagen kørsel i en isoleret mappe.
