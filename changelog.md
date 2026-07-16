# Changelog

Abgeschlossene Specs, neueste zuerst.

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
