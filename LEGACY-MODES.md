# Legacy Modes

`Siege` is no longer part of the public Lexicon Deep product surface.

The live shell is now intentionally simplified around **Word Hunt**:

- the start screen no longer exposes a mode switch
- help and settings assume Word Hunt by default
- pause / completion flows return to the single start surface
- the legacy switch is treated as local QA only, not a second product path

The old mode is still kept in the codebase so it can be revived later without rebuilding it from scratch.

## Current status

- **Public product mode:** `wordhunt`
- **Deprecated legacy mode:** `siege`
- **Core code retained:** yes
- **Public UI entry points:** removed

## How to re-enable legacy modes locally

Two non-public switches are supported by the shell:

1. Open the app with `?legacyModes=1`
2. Or set local storage key `lexdeep:legacyModes=1`

To turn it back off cleanly:

1. Open the app with `?legacyModes=0`
2. Or remove local storage key `lexdeep:legacyModes`

When legacy modes are enabled:

- the start screen shows the hidden mode toggle again
- `m` toggles between `wordhunt` and `siege`
- help and settings restore the old mode-aware copy
- settings shows a legacy-testing notice so the public shell does not silently drift into deprecated copy

## What stays public-shell only

Even with the legacy switch available, the current product surface is still Word Hunt-first:

- settings language is written for the live shell by default
- disabled controls stay disabled instead of pretending legacy systems are user-configurable
- any future Siege revival should happen through a deliberate product pass, not by re-exposing debug affordances

## Where Siege still lives

- Core state / phase plumbing: `modules/game.js`
- Gameplay rules and submission flow: `modules/input.js`
- Board generation and seal/corruption logic: `modules/board.js`
- Legacy config tuning: `modules/constants.js`

## Intent

This is deprecation, not deletion.

If Siege comes back later, it should return as a deliberate product decision with:

- a fresh start-screen position
- updated help/settings copy
- a re-evaluated scoring/special-tile model
