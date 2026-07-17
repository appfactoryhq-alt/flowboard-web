# 04 — Boards-CRUD

## Ziel

User kann eigene Boards anlegen, umbenennen und löschen. `/board` wird zur echten Board-Übersicht (Grid/Liste der eigenen Boards), Klick auf ein Board navigiert zu `/board/[boardId]` (Platzhalter-Detailseite bis Spec 05 Lists liefert).

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `boards`-Tabelle plus Policies stehen.
- Spec 03 (Base-Layout) — App-Shell für die Übersicht.

## Out of Scope

- Lists/Cards innerhalb eines Boards (Spec 05/06).
- Board-Sharing, Multi-User (bewusst draußen laut Vision).

## Tasks

1. `src/lib/boards/actions.ts` — Server Actions `createBoard`, `renameBoard`, `deleteBoard`. Rückgabe `{ data, error }` (kein `throw`, siehe `rules/code-conventions.md`). `user_id` wird nicht vom Client mitgeschickt (Spalten-Default `auth.uid()`, RLS erzwingt Ownership).
2. `src/app/(app)/board/page.tsx` — lädt Boards des Users (Server Component, `select` über `src/lib/supabase/server.ts`), rendert Grid mit Board-Cards (Name, `created_at`, Kontext-Menü Umbenennen/Löschen).
3. Neues-Board-Dialog (shadcn `Dialog` + `Input`), `createBoard` per `useActionState`, Redirect auf neues Board nach Erfolg.
4. Löschen mit Bestätigungs-Dialog (shadcn `AlertDialog`) — Board-Löschung kaskadiert über `on delete cascade` auf Lists/Cards/Labels (Schema aus Spec 01), UI muss das nicht selbst orchestrieren.
5. `src/app/(app)/board/[boardId]/page.tsx` — lädt einzelnes Board (404/`notFound()` falls nicht vorhanden oder nicht dem User gehörend, RLS liefert ohnehin leeres Ergebnis statt Fremddaten), zeigt Board-Name als Titel, Platzhalter-Content bis Spec 05.
6. Empty State für „noch keine Boards" (kein generischer Leerlauf, sondern klarer CTA „Erstes Board anlegen").

## Akzeptanzkriterien

1. Neues Board anlegen erscheint sofort in der Übersicht, Navigation zur Detailseite funktioniert.
2. Umbenennen aktualisiert Name in Übersicht und Detailseite ohne vollen Reload-Sprung (Optimistic UI oder Server-Revalidate via `revalidatePath`).
3. Löschen entfernt Board aus der Übersicht, zugehörige Lists/Cards/Labels sind danach über SQL nicht mehr auffindbar (Cascade greift).
4. Zugriff auf `/board/[fremde-id]` (Board eines anderen Users, simuliert über direkte URL) zeigt 404, keine Datenlecks.
5. Board-Name-Validierung (1–100 Zeichen, siehe Schema-Constraint) wird clientseitig gespiegelt, serverseitig bleibt die DB-Constraint die Wahrheit.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Board anlegen → umbenennen → löschen, plus Zugriffsversuch auf fremde Board-ID.

## Relevante Rules

- `rules/code-conventions.md` — Error-Pattern, Mutationslogik.
- `rules/design-system.md` — Card-Grid, Hover-States, Gradients.

## Status

offen
