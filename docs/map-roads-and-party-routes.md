# Roads and party routes

DM Workspace → Maps adds **Draw a road** and **Mark party route**. Roads are solid brown lines; the party’s travelled route is dashed blue. Both have a name, description, optional illustration/World link, and the existing reveal/publish controls. Keyboard users can add coordinates instead of clicking the image. The place list and labelled markers provide keyboard access to each line.

Draw 2–256 points, then Finish route and Keep place in draft. Saving or publishing before finishing highlights and focuses Finish route. Continue route appends points; Undo point, Redraw route and Adjust route points support corrections. A line may cross itself or revisit a place, including returning to its start. Adjacent duplicate points are rejected. Roads/routes remain open polylines; region polygon/intersection rules are unchanged. Switching between Road and Party route retains the line geometry.

Each map keeps its own lines in its existing private draft. Save private draft stays private. Publish changes releases only revealed entries; hiding/removing a route and republishing removes player access to the earlier snapshot. Players see names, descriptions and distinct line styles but have no editing controls. The route follows its entered point order; the app does not calculate real distances or infer travel automatically.

## Required Firebase update

**Publish this PR’s Firestore rules before publishing a road or party route.** Storage rules are unchanged. No data migration is needed and no production deployment was performed by the agent.

Existing map pin documents support two additional explicit types: `Road` and `Travelled`. Private drafts retain exact `boundary` point arrays. Published lines use the existing bounded numeric `boundaryPoints` representation, with an empty `boundary` array, to avoid per-vertex Firestore expression limits. Published routes require 2–256 bounded points; regions still require 3–256 packed points or their supported legacy arrays. The normal exact public-field allowlist and map-revision checks remain in force; region fill styles are invalid on routes.

Validation includes geometry/count/range/field checks, two-point roads and 256-point routes on a secondary map published by a member DM alongside City/Region entries, private line exclusion, role restrictions, hide/republish access, malformed direct-write rejection with a valid-write control, and separation between named maps. Browser coverage checks finish guidance, continuing/undoing, private drafts, publication/player round-trip, open solid/dashed rendering, narrow screens and WCAG. Existing region and multiple-map tests remain required.
