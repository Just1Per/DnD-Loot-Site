# Pinned item mechanics and containers — v87

Source: revision `b9061583536101068b3a59d27e886d1fa664e366`. `scripts/build-pinned-item-facts.py` exports 1,191 relevant item records, 230 base-item facts and 225 non-inherited generic templates. Five inherited generic templates and inherited standalone item records require explicit future resolution. The release carries source hashes; names, numeric/category facts and structured requirements are shipped, with no full entries, artwork or executable expressions. This bundles mechanical definitions only; it does not publish/import new Firebase Library records.

## Variants and effects

The existing original item menu gains eligible source base-gear choices for generic families. Requirements, exclusions and editions are checked again at Apply; variant identity is retained in the existing private equipment choice. Source snapshots and quantity remain unchanged. The selected base supplies its derived weapon/armor profile, static bonuses and unit weight. Source attack/equipment and normal attunement rules remain authoritative. Original belt/ring families remain available.

Simple source resistances and static accessory AC bonuses are understood. War Mage wands grant their supported general spell-attack bonus only while worn and attuned, preserving save DC and per-caster adjustments. Multiple War Mage wand variants use the highest bonus rather than stacking. Selected source variants override inconsistent legacy attunement flags in the derived view while retaining the original snapshot. Class-restricted spell bonuses, activated conditional damage, curses, transformations and source-specific eligibility remain table instructions; generic base selection does not claim to automate these powers. Item information exposes source, charges/recovery, attunement review and attached spell names without teaching the spells or spending charges.

## Counters

The shared explicit initialization/use/undo/recovery ledger supports additional numeric source charge pools in both editions. Dawn, Dusk, Midnight and Long Rest events remain separate. Fixed-amount and bounded dice recovery cap at the recorded maximum; unrelated rests cannot refill pools. A random initial maximum requires the player to enter its determined total explicitly. That bounded maximum is encoded in the existing private reference string, so no new counter schema is required. Old 2014 counters retain their references and duration precision; stock quantity never multiplies a pool. Source changes/removed ownership do not silently initialize or refill it.

## Containers

From an original equipment row or owned-item information, choose **Container placement / contents**. Select one actual owned container on the same carrier and Apply; Cancel changes nothing. The placement is an ID association, separate from editable location/quantity/weight annotations. Save sheet persists it. A parent must be one owned container; duplicate stacks, cycles, nested magical containers and stale/invalid destinations refuse without mutation.

Ordinary containers count their contents' weight once. A source-defined weightless container excludes its contents from physical carried load while retaining its own unit weight. Live stock determines capacity; unknown weights and excess capacity are warnings, never deletion or stock changes. Source volume/compartment limits remain explicitly manual. Missing/renamed/unavailable/cross-carrier parents make a placement inactive and restore normal physical weight. Free-text locations and paper copy references cannot create weight exemptions.

Moving a container to a companion includes every placed descendant stack. Full destinations and worn contents refuse the whole bundle atomically. Between-companion and return actions retain the placement, row annotations, ownership, attunement, charges and notes; moving a child out individually releases its parent placement. Companion removal and shared return actions retain those boundaries. The original paper subtotal remains independent from actual physical load. Hiding a page does not remove placements.

Placement is a bounded map in the existing private Adobe envelope. No Firestore/Storage rule, production migration, catalogue publication or new dependency is needed. Session/source guards and sheet disposal close stale controls. UI and tests cover explicit Apply/Cancel, load/capacity, individual and bundle transfers, private save/reopen, mobile/axe, item counters and actual PDF.

The companion integration also retains the returned container map on card removal. Valid shared AC input is recorded before blur so an intervening calculation cannot discard the draft; the existing companion browser flow forces that refresh and verifies persistence.

## Readable locations — v94

The existing placement model now also has a searchable Containers overview, explicit carrier/nested paths, separate location notes, capacity meters and destination previews. Equipment headings and item/row/companion windows expose it directly. See [scope and tests](adobe-container-locations.md). This is a presentation and discoverability improvement; source volume/compartment limits remain manual.
