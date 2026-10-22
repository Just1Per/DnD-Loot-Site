# Admin-data indlæses efter behov

Administratorens almindelige login ventede tidligere på at hente hele `users`-samlingen og alle `dmRequests`, samt en directory-opdatering for hver bruger. Det sker nu først, når Admin-visningen åbnes. Kampagnedashboardet, karakterer og Library behøver ikke disse globale lister.

| Arbejde ved login til dashboard | Før | Efter |
| --- | --- | --- |
| Globale collection-opslag til brugere og DM-ansøgninger | 2 | 0 |
| Directory-synkronisering af andre brugere | Én pr. bruger | 0 |

Den indloggede brugers egen profil/directory-synkronisering, rules-reference, invitationer og personlige DM-ansøgning er bevaret. Hvis en gemt navigation gendanner Admin direkte, indlæses listerne naturligvis dér. Tabellen beskriver antallet af operationer i den isolerede browserfixture, ikke en måling af samlet login-tid i produktion.

Admin viser en loading-tilstand, indtil begge lister er hentet. Samtidige åbninger genbruger den igangværende indlæsning. Fejl giver en tydelig fejltilstand og en Retry-knap; fejlen vises ikke som en tom brugerliste. Senere åbninger henter friske data. Den eksisterende directory-backfill er fortsat tilgængelig i Admin.

Kontoskift, navigation væk fra Admin og tab af administratorrollen gør forsinkede resultater ugyldige. Ingen ny persistent cache eller ændring af Firebase-rettigheder indføres. Guide forklarer genforsøg. Kontrasten på små tekster i ansøgningsoversigten er forbedret efter mobiltilgængelighedstesten.

Validering:

- Ny browsertest bekræfter nul globale admin-opslag og ingen directory-backfill af andre brugere ved dashboard-login.
- Testen dækker eksplicit Admin-indlæsning, samtidige åbninger, directory-kompatibilitet, fejl/genforsøg, forsinkede svar efter navigation/kontoskift, spillerafvisning samt 1440/390/320px og WCAG.
- 17 runtime-tests og 10 login/logout-DOM-checks består; Admin-katalog, kampagnesletning, app-navigation, Guide og Hosting-packaging er også kontrolleret.

Ingen nye Firestore-/Storage-regler, indeks, migration eller deployment.
