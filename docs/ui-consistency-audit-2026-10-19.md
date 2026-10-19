# Campaign UI review — 19 October 2026

Reviewed the current main branch, including the centered-dialog fix from PR #130, using real application markup and modules with deterministic local Firebase fixtures. No production accounts or data were used.

## Coverage

The new `npm --prefix tests run test:ui-consistency` suite visits 11 routes at 1440, 390 and 320 pixels: DM overview, settings, world, party, one shots, library, player campaign home, campaign information, NPC catalogue, chapter overview and My Characters. It records screenshots and control geometry, checks viewport overflow and runs axe WCAG A/AA checks through WCAG 2.2. Artifacts are written under the temporary `campaignatlas-ui-checks` directory.

Manual screenshot review covered mobile Party & Loot, campaign settings, World Building, library, campaign home and My Characters. Automated checks supplement that review; they do not guarantee every data-dependent editor state or screen-reader workflow.

## Findings and changes

- **Party & Loot overflow:** character actions extended beyond the card and screen on both mobile widths. The old shrink constraint targeted `#dmToolsPanel`, but these controls now live in the party workspace. The actual character list now constrains and wraps its action group. Long unbroken character/member names also wrap.
- **Small mobile actions:** shared site styling reduced many actions to about 30px, including campaign home navigation. Regular site actions now have a minimum 44px height on narrow screens. Small help badges and character-sheet controls retain their specialized sizing. Party character actions have 44px targets on desktop as well.
- **Small mobile form text:** campaign workspace fields inherited small browser text. Text fields, selects and textareas now use 16px text on narrow screens, improving readability and avoiding the small-text zoom trigger on mobile Safari. Safari itself was not exercised locally.

The changes retain the parchment/burgundy palette, existing labels, permissions and save behavior. Screen-only mobile styling does not change print output.

## Verification

The audit additionally tests long unbroken names, every party action's bounds/height, opening a character wishlist through its real action, and mobile header/field sizing. Existing UI/print, page-editor save/retry and native-dialog suites are run alongside it. Browser tests use Chromium; populated world/creature/chapter editors and production authentication remain covered by their separate existing suites or deployment smoke checks.

No Firestore or Storage rule changes, production migration or manual deployment are part of this change.
