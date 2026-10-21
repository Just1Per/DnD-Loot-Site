# Shared illustration loading

World, NPC and completed-chapter pages previously fetched illustrated entries serially. Each iteration also queried the live list DOM again, so work started for an old list could discover a newer article's image host after navigation. Old work could repeat that image request or overwrite the newer reader's result.

The loader now captures the current view's image hosts once and runs at most four requests concurrently. Every repaint, session clear or access revocation invalidates the old queue. Requests already in flight may finish, but their results are discarded; queued requests stop. The active reader owns its image URL and caption until its own view changes. No persistent image cache, public URL or permission change is introduced.

A deterministic browser regression holds the first requests open, verifies exactly four simultaneous requests, opens another article and confirms the discarded list cannot fetch/repaint its image. It then revokes access during loading and verifies no late image or queued read returns. This test failed on the old serial loader (one request rather than four).

In a separate local fixture measurement with 12 images and a simulated 50 ms delay per protected image read, the complete card images loaded in 632 ms before and 171 ms after. Both runs made 12 reads. This measures the controlled queue behavior, not real Firebase/network latency or a guarantee for production. The comparison uses the same app fixture and waits for all 12 images' naturalWidth to become nonzero.

World reading/navigation, explicit image publication, private Storage denial, later private drafts, chapter notes, desktop/mobile layout and accessibility checks pass locally. The owner reported that their previously missing article image had appeared before this optimization; this change is not claimed as a confirmed root-cause fix for that transient report.

No Firestore/Storage rule changes, deployment, backfill or data migration.
