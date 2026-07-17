# 07 — Cards-DnD (Cross-List)

## Ziel

Cards lassen sich per Drag-and-Drop zwischen Lists verschieben (dnd-kit), Same-List-Reorder läuft über Motion `Reorder`. Persistenz atomar über Postgres-RPC `move_card`, damit ein abgebrochener Request nie einen inkonsistenten Zwischenzustand (Card doppelt/verschwunden) hinterlässt.

## Abhängigkeiten

- Spec 06 (Cards-CRUD) — Cards existieren, Fractional-Position-Pattern etabliert.

## Out of Scope

- Realtime-Reflektion von Drags anderer Geräte (Spec 13) — hier zählt nur die lokale Session.
- Focus-Mode-Slot-Zuweisung per Drag (Spec 11 hat eigene UI, kein DnD-Ziel).

## Bereits entschiedene Punkte

- Position-Modell: Fractional Ranking, keine Reindex-Batch-Updates.
- Mutation läuft immer über die atomare RPC `move_card`, nie als direktes `update` aus der Component heraus (siehe `rules/code-conventions.md`).

## Tasks

1. Postgres-RPC `move_card(p_card_id uuid, p_target_list_id uuid, p_new_position float8)`: `security definer`, `set search_path = ''`, prüft Ownership (Card gehört `auth.uid()`, Ziel-Liste gehört demselben Board/User) innerhalb der Funktion, führt `update cards set list_id = ..., position = ..., board_id = (Ziel-Board)` atomar aus. Via Supabase MCP `apply_migration` anlegen.
2. `src/lib/cards/actions.ts` erweitern um `moveCard`-Wrapper (ruft die RPC über `supabase.rpc('move_card', ...)`, `{ data, error }`-Pattern).
3. dnd-kit-Setup: `DndContext` auf Board-Ebene, `SortableContext` pro Liste, Cards als `useSortable`-Items. Drag-Overlay für visuelles Feedback während des Drags (Motion-Layout-Animation für ausweichende Cards, siehe `rules/design-system.md`).
4. Positionsberechnung beim Drop: Zielindex innerhalb der Ziel-Liste ermitteln, neue Position = Mittelwert der Nachbar-Positionen (oder Rand-Schrittwert bei Anfang/Ende), `moveCard` aufrufen. Optimistic UI: Card visuell sofort an neuer Stelle, Rollback bei Fehler (Server-Error-Toast).
5. Same-List-Reorder weiterhin über Motion `Reorder` innerhalb einer Liste (kein dnd-kit-Overhead für den einfachen Fall) — Konsistenz mit Spec 05 (Lists-Reorder-Pattern), aber auf Card-Ebene.
6. Edge Case: Drop auf leere Liste (kein Nachbar) — Position = fixer Startwert (z. B. 1000).
7. Edge Case: Sehr viele aufeinanderfolgende Inserts an derselben Stelle können Fractional-Position-Präzision an die `float8`-Grenze bringen — nicht in dieser Spec lösen (Backlog-Eintrag bei Bedarf), aber im Debrief dokumentieren, falls beobachtet.

## Akzeptanzkriterien

1. Card von Liste A nach Liste B ziehen aktualisiert `list_id`, `board_id` bleibt korrekt, Card erscheint sofort in Liste B.
2. Reorder innerhalb derselben Liste funktioniert weiterhin über Motion (kein Bruch durch dnd-kit-Einführung).
3. Ein fehlgeschlagener `move_card`-Call (z. B. simulierter Netzwerkfehler) lässt die UI in konsistentem Zustand zurück (Rollback statt UI-Karteileiche).
4. `move_card` verweigert Cross-User-Ziele (Board/Liste gehört nicht `auth.uid()`) — verifiziert per `SET LOCAL ROLE authenticated` plus simulierten Claims analog Spec 01.
5. Layout-Animation bei ausweichenden Cards ist sichtbar smooth (kein Hard-Cut).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- `get_advisors(security)` nach RPC-Migration — keine neuen Blocker.
- Manuell: Cross-List-Drag mehrfach, Same-List-Reorder, simulierter Cross-User-RPC-Aufruf.

## Relevante Rules

- `rules/tech-stack.md` — dnd-kit Cross-List, Motion `Reorder` Same-List, RPC-Pflicht für Move.
- `rules/design-system.md` — Layout-Animation bei DnD.

## Status

offen
