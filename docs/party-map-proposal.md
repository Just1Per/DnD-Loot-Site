# DM-published interactive campaign map — agreed direction

This is a design proposal, not an implemented map-permission change. The owner clarified that only campaign DMs upload maps and edit pins. Players explore deliberately published maps. Player uploads and player pin suggestions are not part of this design.

## Simple page

Use Journal navigation with Recaps and Map. Give the map most of the page, with zoom/pan, a small region/city legend and a way to reset the view. DMs see Edit map, Preview as player and Publish changes. Players see the published map and its places. A phone uses tap instead of hover and shows detailed place information in a panel below the map.

## Map and pins

The DM uploads a map image and adds Region or City pins. Each pin has a name, description, optional small picture and optional World Builder link. Pin positions remain attached to the same map location at different zoom levels. Editing or replacing the image must not silently publish changes or lose the existing published map/pins.

Hover or keyboard focus opens a compact preview with the place name, a short excerpt and optional thumbnail. Clicking/tapping a pin opens a persistent details panel with the complete description, larger image and See more action. Pointer movement into the preview must not dismiss it prematurely; Escape dismisses previews, and clicking/tapping controls must work without hover. Meaningful image alt text is captured with the optional picture.

## World Builder links

DMs choose an existing World Builder entry rather than paste a URL. See more takes players to its published player-facing page, never the DM editor or private notes. If the entry has not been shared, explain that to the DM before publishing the link; do not expose its private contents. If a linked entry is later unpublished, the player action must become unavailable safely. Keep the map's intentionally published place description as a separate shared snapshot.

## Draft and published views

DM edits remain private working drafts. Publish creates/updates the party-facing map snapshot, including explicitly revealed pins and pictures. Unrevealed pins and DM-only information must not be sent to players and merely hidden on screen. Players continue seeing the previous published version while the DM edits. Preview as player must use only the published/previewable player fields. Publishing changes must not alter existing World Builder publication state without an explicit separate action.

## Implementation boundaries

The current implementation has one DM-managed map whose saved image and pin descriptions become visible immediately. It does not yet provide this draft/publish model, hover previews, pin pictures or linked World Builder pages. These are planned changes. Implementing safe draft/published map data and pin images will require Firestore and Storage rule changes plus emulator tests, with no player upload permissions. Keep the existing map and pins during the transition. This proposal does not deploy rules or migrate production data.
