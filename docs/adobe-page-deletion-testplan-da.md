# Test af sletning af sider

1. Åbn en karakter. Tilføj en ekstra side via **Manage pages → Add pages**.
2. Vælg sidens **⋯ → Delete this page**. Tryk **Cancel**: siden skal blive stående.
3. Slet igen og bekræft med **Delete page**. Siden skal forsvinde fra arket og **Your pages**.
4. Slet også en skjult side med skraldespanden i **Manage pages**. Det må ikke slå dens synlighedskontakt til.
5. Gem, luk og genåbn arket. Siderne skal fortsat være fjernet. Ændring af race, level eller andre beregninger må ikke få dem til at dukke op igen.
6. Udskriv til PDF med **Include hidden pages** slået til. Skjulte sider må medtages; slettede sider må ikke.
7. Vælg **Manage pages → Add pages → Removed pages → Add page again**. Notesidens tekst, companionens data eller den valgte casters spells skal være bevaret. Andre companions/casters skal være uændrede.
8. Prøv på mobilen: skraldespanden og bekræftelsen skal kunne betjenes uden vandret rulning. Tab/Enter og Escape skal også fungere.
9. Skjul sider, indtil der kun er én synlig tilbage. Den sidste sides Delete-handling skal være deaktiveret.

Sletning gælder siden som visning. Noter, spells, companions, inventory og brugte ressourcer bliver på karakteren, som aftalt.

Automatisk: `node scripts/test-profiles.cjs run core -- node --test tests/adobe-stack-plan.cjs tests/adobe-print-plan.cjs` og `node scripts/test-profiles.cjs run browser -- node tests/adobe-page-deletion-browser.cjs`. Browsertesten indgår også i hele Adobe-listen og kræver Playwright Chromium samt `pdftotext`.
