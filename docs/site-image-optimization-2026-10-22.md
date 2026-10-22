# Smaller UI images and shared item lookups

The header previously requested a 2,151,895-byte logo and a 1,172,961-byte favicon. The originals remain in the repository for reuse; the public header and attribution page now use purpose-sized derivatives with unchanged artwork and aspect ratio.

| Asset | Original bytes | Runtime bytes |
| --- | ---: | ---: |
| Logo | 2,151,895 | 30,178 |
| Favicon | 1,172,961 | 4,670 |
| Item placeholder | 313,356 | 10,904 |
| Total | 3,638,212 | 45,752 |

This removes 98.7% of these assets' bytes. The logo is 144px wide (the header renders it inside 55px), the favicon is 48px, and the shared card placeholder is 384px. These byte savings are measured file sizes, not a claim about total page loading time. Browser cache and network speed affect the actual result. The earlier public-page audit provides the baseline; a production comparison requires these changes to be deployed.

Derivatives were exported with ImageMagick (originals preserved):

```sh
magick logo.png -resize 144x144 -strip -define webp:lossless=true assets/ui/logo-144-v1.webp
magick favicon.png -resize 48x48 -strip assets/ui/favicon-48-v1.png
magick placeholder.png -resize 384x384 -strip -quality 88 assets/ui/placeholder-384-v1.webp
```

Shared public catalogue artwork now deduplicates concurrent Storage URL lookups by normalized artwork ID. Successful resolutions are reused across item variants; failed/missing requests are removed from the pending map so later attempts can retry. Campaign-private artwork retains its separate authenticated loader.

Validation: 13 runtime tests, Hosting packaging, Library browser regressions and app navigation/role/accessibility checks. No Firestore or Storage rule changes, production data changes, or deployment are required by this PR.
