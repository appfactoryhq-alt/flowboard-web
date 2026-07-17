# Changelog

Abgeschlossene Specs, neueste zuerst.

## Phase B — Kern-Kanban

### Spec 04 — Boards-CRUD
- `src/lib/boards/actions.ts` (createBoard/renameBoard/deleteBoard), Board-Übersicht `/board` (Grid + Empty State), Board-Detail-Platzhalter `/board/[boardId]` mit `notFound()`-Schutz
- Rename via Dialog, Delete via AlertDialog-Bestätigung, beide mit korrektem „nicht gefunden/kein Zugriff"-Fehlerpfad (Codex-Review-Fix)

### Spec 03 — Base-Layout
- Geschützte Route-Group `src/app/(app)/` mit Header (`app-header.tsx`, User-Menü/Logout) und Sidebar (`app-sidebar.tsx`, Boards-Link aktiv, Heute/Focus deaktiviert bis Spec 10/11)
- shadcn-Komponenten `dropdown-menu`, `tooltip`, `separator` ergänzt (base-ui-basiert)

## Phase A — Fundament

### Spec 02 — Auth
- Email/Passwort-Auth mit `@supabase/ssr`: `src/lib/supabase/{client,server,proxy}.ts`, `src/proxy.ts` (Next 16 Konvention, `getClaims()`-basiert)
- Server Actions `signup`/`login`/`logout` (`src/app/(auth)/actions.ts`), Formulare unter `/login`, `/signup`, Route Handler `/auth/confirm`
- Platzhalter `/board`, Fehler-/Info-Feedback via `useActionState` + Sonner-Toast

### Spec 01 — Schema + RLS
- Tabellen `profiles`, `boards`, `lists`, `cards`, `labels`, `card_labels` mit vollständiger RLS (select/insert/update/delete), Board-Konsistenz-Checks gegen IDOR und Cross-Board-Verknüpfung
- Trigger `handle_new_user()` (Profil-Auto-Anlage), `set_updated_at()`
- Fractional-Position (`float8`), Preset-Label-Farben, Partial-Unique-Index für Focus-Mode-Maximum

## Phase 0 — Skeleton

- Next.js-Scaffold (App Router, TypeScript strict, Tailwind v4, ESLint)
- shadcn/ui init (`base-nova`-Preset, Lucide-Icons)
- Doku-Skeleton (`CLAUDE.md`, `AGENTS.md`, `rules/`, `specs/README.md`, Root-Logs)
