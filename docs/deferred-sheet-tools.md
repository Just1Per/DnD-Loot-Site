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
