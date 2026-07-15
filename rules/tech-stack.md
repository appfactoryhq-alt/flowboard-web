# Tech-Stack

## Frontend

- Next.js (latest, App Router) — installiert: 16.2.10. Breaking Changes ggü. älterem Trainingswissen möglich (`proxy.ts` statt `middleware.ts` in Next 16, `middleware.ts` bleibt gültig in Next 15). Bei Unsicherheit: `node_modules/next/dist/docs/` oder Context7 MCP, nicht raten.
- React 19.2, TypeScript strict
- Tailwind v4, shadcn/ui (Preset `base-nova`, Icon-Library Lucide)
- Motion (`motion/react`, vormals Framer Motion)

## Drag & Drop

- dnd-kit für Cross-List
- Motion `Reorder` nur für Same-List
- Mutation in jedem Fall über atomare Postgres-RPC `move_card`

## Backend (in derselben App)

- Server Actions: Mutationen/CRUD, Web-only
- Route Handler (`app/api/.../route.ts`): Streaming, Drittsysteme, und **alles, was Native/Expo später ebenfalls aufruft**

## Datenbank + Auth

- Supabase Postgres + Row Level Security, Email/Passwort-Auth
- `@supabase/ssr`, Cookies via `proxy.ts` (Next 16) bzw. `middleware.ts` (Next 15)
- Sicherheitsentscheidungen: `getClaims()` oder RLS. `auth.getUser()` nur bei echtem Bedarf am User-Datensatz. `getSession()` serverseitig nie für Sicherheitsentscheidungen.

## Deployment & Tooling

- Vercel, npm
- MCPs: Supabase (full-access), Context7 (**Pflicht** bei Auth/Realtime/AI-SDK), shadcn (Komponenten-Registry)
- Agenten: Claude Code (Builder), Codex-Plugin (Reviewer, „Codex-nach-Spec")

## Nicht im Stack

- Kein PWA-Layer, kein Serwist, kein Manifest, kein Service Worker — Native kommt separat als React-Native/Expo-App im eigenen Repo.
- Kein Husky, kein Pre-Commit-Hook — Self-Validation über `npm run typecheck`, `npm run lint`, Codex-Review.
- Kein `next lint` — in Next 16 entfernt, in Next 15 deprecated. `eslint .` direkt nutzen.
