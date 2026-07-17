# Changelog

Abgeschlossene Specs, neueste zuerst.

## Phase C — Smart-Features, Realtime, AI, Landingpage

### Spec 10 — Smart-View Heute
- SQL-View `today_cards` (`security_invoker = true`, Timezone-Filter über `profiles.timezone`), `/today`-Seite gruppiert board-übergreifend fällige Cards
- Sidebar-Link aktiviert, globale Cross-Fade-Transition (`PageTransition`) für alle App-Seitenwechsel
- Codex-Review: `revalidateCardViews`-Helper eingeführt, damit Card-/Label-Mutationen auch `/today` aktuell halten (nicht nur das jeweilige Board)

## Phase B — Kern-Kanban

### Spec 09 — Labels + Priority
- `LabelPicker` (Zuweisen/Entfernen/Anlegen/Löschen, 9 Preset-Farben), `PrioritySelect`/`PriorityDot`, Label-Badges in Listen- und Modal-Ansicht
- Schließt MVP 1 (Kern-Kanban, Specs 01-09) ab. Codex-Review: zwei Blocker behoben (ungültiger Non-Async-Export aus `"use server"`-Datei, `deleteLabel` war nicht in der UI erreichbar)

### Spec 08 — Card-Detail-Modal
- `CardDetailDialog`: Titel, Beschreibung (debounced), Fälligkeitsdatum (Popover+Calendar), Zeitstempel; Motion-`layoutId`-Shared-Transition auf den Titel-Bereich beschränkt
- Codex-Review (zwei Runden): Datenverlust-Blocker bei Server-Revalidierung während offenem Dialog behoben, Tastatur-Fokus-Handling für Modal-Öffnen nachgezogen, Reduced-Motion-Zoom neutralisiert

### Spec 07 — Cards-DnD (Cross-List)
- Atomare RPC `move_card` (board-gescoped, Ownership-Checks), dnd-kit Multi-Container-Sortable für Same-List- und Cross-List-Drag (bewusste Abweichung von der Motion+dnd-kit-Hybrid-Vorgabe, siehe Spec-Debrief)
- `DragOverlay`, optimistisches Cross-List-Verschieben mit Rollback-Snapshot pro Drag, Generation-Counter gegen veraltete Rollback-Antworten

### Spec 06 — Cards-CRUD (Quick-Add)
- `src/lib/cards/actions.ts` (createCard/updateCardTitle/deleteCard), inline Quick-Add (Enter speichert sofort, Feld bleibt offen), inline Titel-Edit, Hover-Delete mit Sonner-Bestätigung
- Due-Date-Badge auf der Card (UTC-Parsing-Fix aus Codex-Review)

### Spec 05 — Lists-CRUD
- `src/lib/lists/actions.ts` (createList/renameList/deleteList/reorderList), horizontales Same-Row-Reorder via `motion/react` `Reorder`
- Fractional-Ranking-Kollisionsschutz (Rebalancing auf 1000er-Abstände bei float8-Präzisionsgrenze), Reorder-Fehlerbehandlung mit Rollback

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
