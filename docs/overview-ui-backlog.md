# Deferred Character Overview work

The user requested completing non-Overview P1/P2/P3 work first. Overview rendering, styling and design were not redesigned in this PR.

| Priority | Remaining point | Acceptance check |
| --- | --- | --- |
| P2 | Enlarge and space Overview help controls (C05) | At least 24 px targets, accessible names, keyboard focus, no overlap with adjacent actions or dense stats. |
| P2 | Remove duplicate Attacks & Actions / + Add Attack help decoration (C05) | One relevant hint per action/heading, with no repeated badge after rerender/save/reopen. |
| P3 | Finish Overview-specific CSS ownership review (E01) | Review deferred `.sheet-overview-important-more`, `.sheet-identity-strip` and `.sheet-page-grid` candidates with `.site-eyebrow` / `.watermark` shared candidates; remove only confirmed obsolete branches. Preserve intentional state, responsive and print selectors. |
| P3 | Assess adoption of shared component/color tokens in Overview | Preserve its compact burgundy/gold design and existing readable contrast. Check populated and empty builds before replacing any styling. |

Verification accompanying that work: check long names, portraits, many attacks, pinned feats/features and warning disclosures on narrow screens; rerun keyboard/axe checks and populated one-page print stress tests. These are required regression checks, not new confirmed visual defects. The current audit identified no remaining Overview P1 finding.

Optional compact combined print and standalone character ownership remain separate product proposals, not Overview blockers.
