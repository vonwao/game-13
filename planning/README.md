# Planning

This directory is the canonical home for sprint planning and planning history.

## Conventions

- One numbered file per sprint: `SPRINT-###-short-name.md`
- The highest numbered sprint is the current active sprint unless marked `Completed`
- Keep sprint docs short: goal, current status, todo list, risks, exit criteria
- Do **not** recreate every historical chat thread in docs

## What belongs here

- Active sprint plan
- Completed sprint summaries worth preserving
- Lightweight historical context that helps future work

## What does not belong here

- Long design exports
- One-off prompts for unrelated experiments
- Stale execution plans that are no longer trustworthy

## Current files

- [SPRINT-000-shipped-foundation.md](./SPRINT-000-shipped-foundation.md): concise history of the work already shipped
- [SPRINT-001-single-front-door.md](./SPRINT-001-single-front-door.md): current sprint and live todo list
- [archive/README.md](./archive/README.md): index of archived execution plans and status snapshots

## Active root docs

These stay in the repo root because they are still live reference material:

- [ROADMAP.md](../ROADMAP.md): long-arc product and architecture direction
- [LEGACY-MODES.md](../LEGACY-MODES.md): current public-vs-legacy mode boundary

## Archive policy

Past work should be documented, but lightly:

- keep one short shipped summary for major completed phases
- keep each completed sprint doc once it has real decisions or outcomes worth remembering
- avoid writing retro docs for every tiny iteration after the fact
- move stale sprint plans, status snapshots, and handoff briefs into `planning/archive/`
- do not use repo-root markdown files as live sprint control documents

## Out of scope

Some root markdown files are intentionally not part of the sprint-planning system:

- one-off prompts for side projects
- design bundles and handoff exports
