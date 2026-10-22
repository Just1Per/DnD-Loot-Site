# World and NPC card images

World and Story NPC publication prepares two WebP snapshots from the saved private illustration: the existing reader image (at most 512 KiB, longest side at most 1600 px), and a card image (at most 64 KiB, longest side at most 640 px). Both preserve aspect ratio. Smaller sources are never enlarged. Original uploads, private notes, captions, layout and publication actions are unchanged.

The thumbnail lives in `campaigns/{campaignId}/playerIllustrationThumbnails/{world|creature}/entries/{recordId}` with exactly `path`, `contentType`, and base64 `data`. Publication metadata gains optional `image.thumbnail: true` only alongside a prepared thumbnail. The transaction writes both image documents and publication metadata together. Existing text-only updates retain the previously published image. List snapshots contain no image bytes.

Cards fetch the thumbnail separately, retaining viewport deferral and four-request concurrency. Article readers request the larger image directly. Legacy releases without the flag read their existing image without an extra thumbnail request. Missing, denied, mismatched, oversized or undecodable thumbnails fall back to the existing reader-image lookup. Campaign/access changes cancel pending display work.

## Rules and rollout

**Updated Firestore rules are required before publishing with this client.** Storage rules are unchanged. The thumbnail rules require an active campaign DM for writes, a matching active private source and matching publication image. Player reads require active campaign membership and matching released image metadata; list queries are denied. Payloads are restricted to PNG/JPEG/WebP, base64 and at most 88,000 encoded characters. The new metadata flag must be true and reference an existing matching thumbnail in the resulting transaction. Chapters cannot use the flag or thumbnail collection.

No deployment or production migration is performed by this change. Existing publications need no migration. The DM can use Publish changes again to generate thumbnails for existing World/NPC posts. Unpublish removes player access; retained image copies follow the existing recovery policy.

## Validation

`npm --prefix tests run test:journal-thumbnails` exercises real browser encoding, World/NPC publication, overview/reader document requests, original preservation, mobile widths, damaged/denied/legacy fallback and cancellation. A deterministic textured 1440 × 960 fixture produced 486,316-byte reader images and 62,606-byte thumbnails: **87% fewer image bytes per overview card** (base64 overhead applies to both). This is a fixture measurement, not a production latency benchmark.

`test:journal-images` and `test:publishing-feedback` cover viewport loading, concurrency, navigation, object URL cleanup and access revocation. `test:published-illustrations-rules` covers atomic copies/flags, permissions, malformed payloads, stale drafts, unpublish, archive and campaign deletion in the Firebase emulator. Existing image-sharing and publication suites remain part of CI.
