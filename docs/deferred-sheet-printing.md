# Første trin i indlæsning af karakterværktøjer efter behov

Printmodulet hentes ikke længere ved den almindelige app-opstart. Den obligatoriske featureliste går fra 102 til 101 scripts; printfilen er 14.490 ukomprimerede bytes. En lille loader til indlæsning efter behov ligger i den eksisterende app-entry, så filstørrelsen er ikke det samme som nettobesparelsen eller en måling af samlet loadingtid.

Første åbning af et karakterark henter printkoden samtidig med arkets private data. Arket bliver først vist, når begge er klar, så almindelig print og browserens print kan bruge samme layout som før. Senere åbninger genbruger den indlæste kode. Samtidige åbninger deler ét scriptopslag. En mislykket kodeindlæsning kan prøves igen ved at åbne arket på ny.

Den asynkrone åbning bevarer eksisterende generation-, konto- og kampagnetjek. Et forsinket resultat kan ikke åbne et gammelt ark, efter at man har skiftet konto/kampagne eller lukket arket. Kun offentlig kode caches; ingen karakterdata eller credentials indgår i loaderens cache. Modulet virker også efter, at bootstrap har fjernet sin midlertidige SDK-binding.

Dette var første trin. Den efterfølgende omlægning i [deferred-sheet-tools.md](deferred-sheet-tools.md) flytter yderligere fire UI-moduler til første åbning af arket og reducerer opstartslisten til 97 scripts. Beregningsmotorer, fælles referencekataloger og de øvrige karaktermoduler er fortsat i den obligatoriske opstart.

Validering: ny browsertest bruger den faktiske scriptloader og printfil, uden print i testens obligatoriske features. Den dækker ingen print-request før behov, fejl/genforsøg, ægte printlayout uden writes, kodegenbrug, samtidige åbninger og sene svar efter konto-/kampagneskift eller lukning. Eksisterende karakter-workspace, 23 print-DOM-checks og Hosting-packaging består.

Ingen Firebase-regler, indeks, datamigration eller deployment.
