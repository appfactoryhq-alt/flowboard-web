# 05 — Lists-CRUD

## Ziel

Innerhalb eines Boards (`/board/[boardId]`) kann der User Lists (Spalten) anlegen, umbenennen, löschen und per Same-Row-Reorder neu anordnen. Liefert das Spalten-Grundgerüst, auf dem Spec 06 (Cards) aufbaut.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `lists`-Tabelle, `position` (float8).
- Spec 04 (Boards-CRUD) — Board-Detailseite existiert als Ziel.

## Out of Scope

- Cards (Spec 06).
- Cross-List-Reorder (das ist Card-DnD, Spec 07) — Lists selbst werden hier nur horizontal per einfachem Reorder sortiert (Same-Row, Motion `Reorder`, kein dnd-kit nötig).

## Bereits entschiedene Punkte

- Position-Modell: Fractional Ranking (`float8`), siehe Spec 01. Neue Position = Mittelwert der Nachbar-Positionen; beim Anhängen ans Ende: letzte Position + fixer Schrittwert (z. B. 1000, damit genug Fließkomma-Spielraum für spätere Einfügungen bleibt).

## Tasks

1. `src/lib/lists/actions.ts` — Server Actions `createList`, `renameList`, `deleteList`, `reorderList` (Position-Update). `{ data, error }`-Pattern.
2. Board-Detailseite lädt Lists sortiert nach `position` (Server Component).
3. Spalten-Layout: horizontales Board mit Lists nebeneinander, „Liste hinzufügen"-Button am Ende (Inline-Input analog Quick-Add-Pattern aus Spec 06, hier aber einfacher: Name eingeben, Enter/Blur speichert).
4. List-Header: Name (inline editierbar per Klick), Kontext-Menü „Löschen" mit Bestätigung (Cascade auf Cards greift über Schema).
5. Reorder der Lists per Motion `Reorder.Group`/`Reorder.Item` (horizontal), Persistenz der neuen Reihenfolge via `reorderList` (Fractional-Position-Neuberechnung clientseitig vor dem Server-Call: neue Position = Mittelwert der Nachbarn nach dem Drop).
6. Empty State pro Board ohne Lists („Erste Liste anlegen").

## Akzeptanzkriterien

1. Liste anlegen erscheint sofort am Ende, Position ist größer als alle bestehenden.
2. Liste umbenennen persistiert (Server-Revalidate oder Optimistic Update).
3. Liste löschen entfernt sie inkl. aller enthaltenen Cards (Cascade).
4. Reorder per Drag ändert die Reihenfolge visuell sofort (Motion-Animation) und bleibt nach Seiten-Reload erhalten (Position korrekt persistiert).
5. Zwei Lists lassen sich beliebig oft neu einsortiert werden, ohne dass Positionswerte kollidieren (Fractional Ranking funktioniert bei wiederholtem Reorder).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Liste anlegen, umbenennen, mehrfach reordnen, Reload prüfen, löschen.

## Relevante Rules

- `rules/tech-stack.md` — Motion `Reorder` für Same-List/Same-Row.
- `rules/code-conventions.md` — Mutationslogik-Regel (Reorder ist einfache Server Action, keine Cross-Entity-RPC nötig, da nur eine Tabelle betroffen).

## Status

offen
