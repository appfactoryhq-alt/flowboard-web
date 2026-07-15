# Flow Board — Agent Router (Codex)

Solo-User Kanban-App. Rollenteilung: Claude Code baut, Codex reviewt schreibgeschützt nach `rules/codex-review.md`.

Kontext, Regeln und Specs: siehe `CLAUDE.md` — identischer Router-Inhalt, gilt für alle Agenten in diesem Repo.

**Next.js-16-Hinweis:** Dieses Projekt läuft auf einer sehr aktuellen Next.js-Version mit Breaking Changes gegenüber älterem Trainingswissen (zum Beispiel `proxy.ts` statt `middleware.ts`). Bei Unsicherheit `node_modules/next/dist/docs/` oder Context7 MCP konsultieren, nicht aus Erinnerung raten.
