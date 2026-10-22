# Companion catalogue at first sheet opening

The companion/familiar/Wild Shape catalogue and its four data batches now load through the existing optional `sheetTools` loader before its UI adapters. They previously loaded/preloaded for every public visit. The mandatory feature list drops from 97 to 92 files; 50,199 uncompressed source bytes move out of startup. This is a source-size/request-list measurement, not a measured production transfer or timing improvement.

The first sheet opening fetches the five files in the existing ordered chain alongside private sheet data and the optional print load. This shifts work to the first sheet opening; it does not remove that work. Subsequent and concurrent openings share the same public script promises. No character content, Firebase credentials, permissions or private cache is added to that loader.

The base catalogue must execute before batches 1–4, and all batches before the page manager and creature picker. A failed batch retains completed files and the catalogue object. Retry requests only the failed and remaining files. All 127 creature identities, search/filtering and previously saved card data remain available. A delayed code response cannot reopen a closed sheet or render a sheet after an account/campaign change.

The real creature-selection test also exposed an existing missing UI boundary: the picker called a card renderer hidden inside another module. That boundary is now explicit, and choosing a base creature refreshes its card and copies its six ability scores as well as HP/AC. The browser regression verifies Brown Bear ability scores and visible HP survive save/reopen.

The Player guide now explains + Page / Choose extra pages, Companion / Familiar / Wild Shape, creature search and saving the selected base creature. There are no extra user actions for loading data.

Validation extends `test:sheet-tools-loading`: catalogue absent before opening; exact optional file order; retry after a data-batch failure and after a later UI-adapter failure; 127 unique creatures without reset/duplicates; importing Brown Bear statistics and saving/reopening; print/spells/builders; shared concurrent loads; late account/campaign/close guards. Existing print-loading and complete engine/DOM tests are also run. CI already includes these suites.

No Firestore/Storage rules, indexes, migration or production deployment required.
