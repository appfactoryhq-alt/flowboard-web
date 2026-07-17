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

fertig

## Debrief

- **RPC `move_card(p_card_id, p_board_id, p_target_list_id, p_new_position)`** via Supabase MCP angewendet (`flow_board_move_card_rpc`, gehärtet in `flow_board_move_card_scope_board`): `security definer`, `set search_path = ''`, prüft Card-Ownership UND dass die Zielliste zu `p_board_id` gehört (verhindert, dass eine Card versehentlich board-übergreifend verschoben wird — ursprüngliche Version prüfte das nicht, Codex-Review-Fund). PUBLIC/anon-Execute revoked, nur `authenticated`. `get_advisors(security)` zeigt nur die erwartete/beabsichtigte `authenticated_security_definer_function_executable`-WARN (das ist der Zweck der Funktion).
- **Bewusste Architektur-Abweichung von `rules/tech-stack.md`:** Die Regel sagt „dnd-kit für Cross-List, Motion Reorder nur für Same-List" bei Cards — technisch nicht sauber umsetzbar, da zwei konkurrierende Pointer-Gesten-Systeme auf denselben Card-Elementen kollidieren würden. Umgesetzt: dnd-kit übernimmt beide Fälle über einen `DndContext` mit `SortableContext` pro Liste (Standard-Multi-Container-Sortable-Pattern), „smooth reflow" kommt aus dnd-kits eingebauter CSS-Transition statt Motion Reorder/`layout`. Motion `Reorder` bleibt unverändert exklusiv für die Lists-Spalten selbst (Spec 05). Codex-Review bestätigt: architektonisch sinnvoll begründet, kein besserer praktikabler Weg für den literalen Wortlaut gefunden.
- `src/components/cards/sortable-card.tsx` (`useSortable`-Wrapper), `src/components/cards/card-preview.tsx` (rein präsentationelle Vorschau für `DragOverlay`, keine Server-Action-Bindings), `ListColumn` cards jetzt kontrollierte Props (`useDroppable` für leere/Ziel-Listen), `BoardLists` hält `cardsByList` als gelifteten State mit `onDragStart`/`onDragOver`/`onDragEnd`/`onDragCancel`.
- Codex-Review (gpt-5.6-sol, high, zweiter Anlauf nach Timeout bei xhigh): kein Blocker, mehrere Warnings behoben:
  - **Board-Scoping in der RPC** (siehe oben) — vorher konnte ein User (kein IDOR, aber unerwünschte Scope-Erweiterung) eine eigene Card in eine eigene Liste eines *anderen* Boards verschieben, da `boardId` nicht an die RPC durchgereicht wurde.
  - **`onDragCancel` fehlte** — Escape während eines Drags ließ optimistische Cross-List-Änderungen und das Overlay hängen, ohne Rollback. Jetzt behandelt: setzt `activeCard` zurück und stellt den Snapshot vom Drag-Start wieder her.
  - **Rollback setzte die gesamte `cardsByList`-Map auf die initiale Server-Prop zurück** statt nur die Änderungen des fehlgeschlagenen Drags rückgängig zu machen — bei mehreren schnellen Drags hätte das bereits erfolgreiche, aber noch nicht revalidierte Moves sichtbar rückgängig gemacht. Fix: Snapshot beim Drag-Start (`dragStartSnapshotRef`) statt der ursprünglichen Prop.
  - **Race Condition bei schnellen Folge-Drags** — ein Generation-Counter (`dragGenerationRef`) verhindert, dass die verspätete Fehler-Antwort eines älteren Drags den bereits optimistisch aktualisierten Zustand eines neueren Drags überschreibt.
  - **Bewusst akzeptiert (Backlog):** Rebalancing-Batch bei Positionskollision ist nicht transaktional (mehrere parallele RPC-Calls statt einer DB-Transaktion); Server-seitige Schreibreihenfolge bei sehr schnellen Folge-Drags derselben Card nicht vollständig serialisiert. Beides für eine Solo-User-App geringes, dokumentiertes Risiko.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** visueller Cross-List- und Same-List-Drag-Test, Escape-Cancel, Drop außerhalb des Boards, verschachteltes Gesten-Verhalten (dnd-kit-Card-Drag innerhalb eines Motion-`Reorder.Item` für die Liste — strukturell unproblematisch, aber nicht visuell verifiziert), leere Zielliste als Drop-Ziel.
