# Flow Board — Guidelines

Verweise: `CLAUDE.md` (Router), `rules/` (verbindliche Regeln), `specs/` (Feature-Specs).

## Build-Loop pro Spec

1. Spec lesen (`specs/NN-<feature>.md`), Status in `implementierungsplan.md` auf "in Arbeit".
2. Bei Auth, Realtime, AI-SDK: Context7 MCP zuerst für aktuelle Docs.
3. Implementieren, `npm run typecheck` und `npm run lint` müssen grün sein.
4. Codex-Review nach `rules/codex-review.md`-Template (schreibgeschützt, Findings mit Severity Blocker/Warning/Nit).
5. Blocker beheben, bei Bedarf erneut prüfen.
6. Commit im passenden Branch-Namespace (`rules/code-conventions.md`).
7. `changelog.md` ergänzen, Status auf "fertig", Learnings in `learning.md` falls vorhanden.

## MCP-Pflichten

- Context7 MCP: Pflicht-Quelle bei Auth, Realtime, AI-SDK — nicht aus Trainingswissen raten, besonders wegen Next.js-16-Breaking-Changes.
- Supabase MCP: Schema-, RLS- und Migrations-Arbeit, full-access.
- shadcn MCP: Komponenten-Registry statt manuellem Copy-Paste.

## Sicherheit

- Keine Tokens, API-Keys, Service-Role-Keys oder `.env.local`-Inhalte im Terminal-Output oder in Code-Blöcken zeigen.
- Service-Role-Key nie in Client-Code, nie in Logs.
- Server-Sicherheitsentscheidungen über `getClaims()` oder RLS, nie über `getSession()`.

## Native-Awareness

- Geteilte Endpunkte (AI, alles was später auch Expo aufruft) als Route Handler bauen, nicht als Server Action — Expo kann keine Server Actions aufrufen.
- Mutationslogik in Server-Funktionen oder Postgres-RPCs kapseln, damit der Native-Schnitt später nicht teuer wird.
