# Shared item catalogue audit

The owner wants the shared catalogue limited to material with documented redistribution rights and wants to retain original records in a specific private campaign. This delivery audits evidence and prepares that migration; it does not move, rewrite or delete production data.

## What can be verified now

Repository rules make `/items` publicly readable. Legacy `/dnd-item-images` artwork is also public. Removing a catalogue record alone does not privatize its artwork, cached content, or copies already made in other campaigns. The current `js/items.js` export is empty; its commented list of books is not a database inventory. The Adobe magic-item reference is a separate names/mechanics reference, not the live shared item collection.

`data/rules/srd-magic-item-text-hashes.json` contains 1,259 name/text fingerprints from pinned Open5e-normalized SRD 5.1 and SRD 5.2 records. Their source Document records explicitly list CC-BY-4.0. The index records original-source digests and attribution links and includes no item descriptions. Rebuild with:

```sh
node scripts/build-srd-item-hashes.mjs
```

The auditor requires an exact normalized name/description match for an SRD text candidate. Extra quotes or property prose require review. Source-book names, a label saying SRD, and self-reported licence flags do not approve content. Matching a description does not establish artwork rights, satisfy attribution, or establish that additional mechanics/prose are cleared. Every record remains review-required; the tool never calls an item illegal or approves automatic publication.

## Run the read-only audit

The GitHub workflow **Read-only shared item catalogue audit** runs on changes to the audit code and can be manually rerun after it is merged. It makes unauthenticated GET requests to the root collection and follows every page. With the workflow’s explicit `--allow-reviewed-only` option, a denied full read falls back to the read-only `runQuery` POST for approved templates. That result is clearly labelled `completeRootCatalogue: false`, cannot be used for migration and never includes hidden originals. Neither path requires a Firebase service-account secret. It reads no campaign, character, inventory or personal data. A denied read stays denied; the workflow does not weaken rules or create credentials.

The artifact `shared-item-catalogue-audit` contains document IDs, names, source labels, content fingerprints and review flags. It excludes descriptions, quotes, property text and tokenized image URLs. A compact count/source summary also appears in a check notice. Artifacts expire after seven days.

For a local report and optional private snapshot:

```sh
node scripts/audit-item-catalogue.mjs --public-project dnd-loot-site --report "$HOME/item-audit.json" --snapshot "$HOME/private-item-snapshot.json"
```

Files are created with owner-only permissions and cannot overwrite existing files. Raw snapshots are explicitly forbidden in public CI. Keep the raw snapshot outside this repository and do not attach it to a public PR or issue. Offline re-audit:

```sh
node scripts/audit-item-catalogue.mjs --from-json "$HOME/private-item-snapshot.json" --report "$HOME/item-audit-rechecked.json"
```

All commands are read-only. No `--apply` or mutation operation exists.

## Migration that must follow the audit

1. Review each record against its actual source, permissions and artwork. Produce an item-ID/content-hash decision manifest: keep with evidence, replace with reviewed licensed/original material, or retire from sharing. A WotC name by itself is not a rights assessment. Freely readable material is not automatically licensed for republication.
2. Make a durable private backup of root documents and affected Storage objects. Confirm the destination campaign's exact ID/name, membership and inventory schema. Never use a public GitHub file as the private archive.
3. Copy original records into that campaign as hidden, DM-managed items without allocating stock or changing existing gear. Copy or preserve artwork through an explicitly private access design; retaining a public download-token URL does not make an image private. Verify record and asset hashes before retiring any shared source.
4. Inventory other campaigns' root-item copies and embedded inventory snapshots. The owner must choose how to replace restricted prose/art while preserving IDs, ownership, quantities and mechanical behavior. Do not silently delete other campaigns' gear or treat a root-item deletion as a complete cleanup.
5. Apply only a reviewed manifest against unchanged source revisions. Use deterministic private-copy IDs and resumable copy/verify/retire stages. Invalidate the root catalogue metadata/cache version. Existing external downloads cannot be recalled.
6. Verify anonymous/other-DM denial, destination-DM access, permitted SRD sharing, normal looting and character sheets, plus every old image path/token affected by the migration.

The campaign ID supplied by the owner is kept in the task context, not published in this public document. Actual production migration remains a separate reviewed operation. The owner's production merge/deployment restriction still applies.

The item-by-item Danish report and guarded migration/access design are linked from [reviewed-item-catalogue.md](reviewed-item-catalogue.md).
