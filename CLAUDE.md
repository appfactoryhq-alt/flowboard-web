# Flow Board — Claude Code Router

Solo-User Kanban-App. Next.js App Router, TypeScript strict, Supabase (Postgres + RLS + Auth), Tailwind v4, shadcn/ui, Motion, dnd-kit.

## Kontext laden
- Plattform-Entscheidungen (final): `Architektur-EntscheidungFlowBoard.md`
- Umsetzungsplan: `implementierungsplan.md`
- Aktuelle Spec: `specs/NN-<feature>.md` (Reihenfolge in `specs/README.md`)

## Regeln (verbindlich)
- `rules/tech-stack.md` — Stack, Versionen, Context7-Pflicht
- `rules/design-system.md` — Design-Tokens, Animations-Regeln
- `rules/code-conventions.md` — Branches, Imports, Error-Pattern
- `rules/verification.md` — Self-Validation, Codex-Review-Pflicht
- `rules/codex-review.md` — Review-Template für Codex-nach-Spec

## Logs (laufend pflegen)
- `backlog.md` — offene Ideen, Deferred Work
- `changelog.md` — abgeschlossene Specs
- `learning.md` — Learnings, Stolpersteine

## Arbeitsweise
1. Spec lesen, Kontext plus Regeln oben laden.
2. Bauen, `npm run typecheck` plus `npm run lint` müssen grün sein.
3. Codex-Review nach `rules/codex-review.md`-Template.
4. Commit, `changelog.md` ergänzen, nächste Spec.

Details: `guidelines.md`.
