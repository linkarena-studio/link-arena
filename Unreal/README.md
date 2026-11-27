# LINK ARENA — Unreal Engine 2D prototype
UE 5.6 / C++ / Slate. The existing GitHub Pages version remains independent.

## Open
Install UE 5.6 and Visual Studio 2022 with Game development with C++ (Windows).
Clone or download this repository, open Unreal/LinkArena.uproject and build the module when prompted.
Press Play in the editor (or launch a standalone game). The project uses a native Slate interface and the engine Entry map; no binary assets are required.
If the editor does not start the custom mode, check Project Settings > Maps & Modes > Default GameMode = LinkArenaMode.

## Implemented in source
Four-player offline game (one human, three CPUs), seven starting cards, three visible board cards, bitmask matching, 17 card types, target selection, draw, victory, restart, public logs without secret card names.

## Not yet implemented / verified
Actual Unreal compilation, packaging, mobile layout/device testing, original card illustrations, BGM, animations and online multiplayer. The project is a source prototype, not a compiled application. Crossplay needs a separately deployed transport and session integration. Japanese font availability depends on platform fonts.
