# Expanded D&D character options

Revision 20 expands the character builder beyond the Adobe/PHB baseline while keeping source and rules edition visible.

## Coverage

The assembled rules catalogue currently exposes:

- 16 current Player's Handbook backgrounds plus 19 legacy PHB background/variant entries.
- 122 additional first-party background/source variants from books such as Sword Coast Adventurer's Guide, Tomb of Annihilation, Ghosts of Saltmarsh, Ravnica, Strixhaven, Dragonlance, Planescape, Bigby Presents, Forgotten Realms: Heroes of Faerûn, Eberron: Forge of the Artificer, Ravenloft: The Horrors Within, Lorwyn: First Light and others.
- 104 race/species entries after assembling the legacy, 2024 and expanded catalogues.
- 186 subclass metadata entries, including all 48 subclasses in the 2024 Player's Handbook and a broad set of first-party legacy/supplement options.

The builder labels expanded options by source. On a 2024 class, compatible 2014 subclasses remain available as explicit legacy choices rather than being silently removed.

## Automation boundary

An option being selectable does not imply every feature from its source book is fully automated.

Core/baseline options keep the existing automatic mechanics. Expanded entries provide safe factual selection metadata such as name, source, class, subclass level, skills, fixed background feat where known, race/species traits already supported by the shared engine, and edition.

When the web rules engine does not yet implement a source-specific feature, the sheet labels it as source/manual instead of inventing a mechanic. Source prose is not copied into the repository.

Artificer subclass metadata is included for catalogue completeness, but the Artificer base class is not yet implemented as a selectable web class. That is the next required class-engine expansion before those subclasses can be used normally.

## Persistence

This iteration does not change the character-sheet schema. Firestore remains schema 14.

The matching rules file is:

- D&D Vault Firestore Rules Revision: 20

Revision 20 changes catalogue/UI code only; Firestore permissions are unchanged.
