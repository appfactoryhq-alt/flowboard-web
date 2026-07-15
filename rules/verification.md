# Verification

## Self-Validation (jede Spec)

- `npm run typecheck` — `tsc --noEmit`, muss ohne Fehler durchlaufen.
- `npm run lint` — `eslint .`, muss ohne Fehler durchlaufen.
- Kein Husky, kein Pre-Commit-Hook — beides läuft manuell im Build-Loop, nicht git-hook-erzwungen.

## Codex-Review (Pflicht pro Spec)

- Nach jeder Spec: Codex-Review schreibgeschützt, Template in `rules/codex-review.md`.
- Blocker müssen behoben werden, bevor eine Spec als „fertig" gilt.
- Warnings: bewusst annehmen oder beheben, kurz begründen.
- Nits: optional.

## Manuelles Prüfen (UI-nahe Specs)

- Bei sichtbaren UI-Änderungen zusätzlich kurz im Browser beziehungsweise via `browser-use` gegenprüfen, nicht nur auf Typecheck/Lint vertrauen.
