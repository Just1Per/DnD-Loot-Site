# Static creature reference metadata

The web sheet keeps its existing 127 base creatures and supplements their literal source facts: 168 attack descriptions/modifiers, saving throw and skill totals, trait/feature descriptions, alignment, languages, vulnerabilities and attack-action counts.

The builder validates the existing attack names, abilities, dice, ranges and DC flags before updating generated files. It reads the supplied PDF's `ListsCreatures` stream and parses its object literals with Acorn. It never executes Acrobat JavaScript, callbacks, getters or embedded expressions. Only bounded data is exported; the original PDF, filled character values and script bodies remain outside the repository.

With the private reference available locally:

```sh
npm ci --prefix tests
python3 -m pip install pypdf==6.10.0
node scripts/build-adobe-creature-metadata.cjs /path/to/reference.pdf
```

An optional second argument writes the four generated files to another directory for comparison. A statically extracted `ListsCreatures` JavaScript stream is also accepted as input; it is parsed as data. No original file is needed to run the synthetic parser tests.

```sh
node --test tests/adobe-creature-metadata.cjs tests/character-companion-rules.cjs
```

Runtime calculations live in `character-companion-rules.js` and are shared by the existing companion cards, Adobe view and Standard print. Fixed damage flags are significant: an owl's attack adds its Dexterity modifier to hit but retains fixed damage of 1. Numeric source modifiers, named ability modifiers and the source `dc±N` form are handled explicitly. Unknown expressions produce an unresolved result; they are never evaluated.

This is the MPMB v13.0.4 / SRD 2014 base catalogue. It does not convert a 2024 character to 2014, grant familiar action permissions, automate printed conditional effects or replace the active Druid Wild Shape engine. Class-specific companion scaling and remaining conditional/source workflows still need the broader parity review.
