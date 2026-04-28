# Sprint 001 — Single Front Door

Status: Completed

## Goal

Make Lexicon Deep feel like one intentional product surface centered on Word Hunt.

The public app should have:

- one obvious home/start screen
- one clear way to reach Settings and Help
- one truthful set of labels and flows

## Shipped

Completed in this sprint:

1. Public mode is now Word Hunt by default.
2. Siege is hidden from the public UI and preserved behind `?legacyModes=1`.
3. Pause / Round Complete / Run Complete overlays are live.
4. Combo has been removed from the active product path.
5. Wildcard `×0.5` is wired and verified.
6. The start surface is now a deliberate front door with clear `Start`, `Settings`, and `How to Play` entry points.
7. Pause / Round Complete / Run Complete overlays now carry stronger recap and next-step content.
8. Settings copy is now truthful about disabled controls and legacy-only behavior.
9. Legacy QA boundaries are documented and visibly marked when enabled.
10. Documentation cleanup is complete:
   - `planning/` is now the canonical sprint-planning home
   - stale root planning and status docs moved to `planning/archive/`
   - active root docs are now limited to live reference material such as `ROADMAP.md` and `LEGACY-MODES.md`

Checks green at completion:

- `npm run build`
- `bash scripts/check-sprint-sanity.sh`
- `node scripts/verify-bridge.mjs`

## Outcome

This sprint closed the “what app is this?” gap.

The public shell now behaves like one intentional Word Hunt product:

1. before a run, the front door clearly exposes `Start`, `Settings`, and `How to Play`
2. during a run, the unified menu/pause surface is the obvious route to settings and help
3. flow labels are truthful (`Quit to Start`, legacy modes marked as QA-only)
4. planning docs now live under `planning/`, with stale execution docs archived

## Risks

1. The app can still feel more “functional” than “finished” if the home screen remains utilitarian.
2. Disabled controls in Settings can still undermine trust if left unresolved for too long.
3. Legacy mode containment can keep leaking complexity into active work unless the boundary gets cleaner.

## Exit criteria

This sprint was done when:

1. The start surface felt like the one real front door.
2. Settings and Help were obvious before and during a run.
3. Flow-state overlays felt intentional, not placeholder.
4. The status of every visible settings control was truthful.
5. The current sprint could be understood by reading this file together with [planning/README.md](./README.md).
