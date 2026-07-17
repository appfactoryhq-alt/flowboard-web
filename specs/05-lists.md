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

fertig

## Debrief

- `src/lib/lists/actions.ts`: `createList`/`renameList`/`deleteList`/`reorderList`, Fractional-Position mit `POSITION_STEP = 1000` beim Anhängen.
- `BoardLists` (Client) haelt lokalen Reorder-State, synchronisiert mit Server-Props über das „Adjust state during render"-Pattern (Vergleich gegen gespeicherten Vorwert) statt `useEffect` — ESLint (`react-hooks/set-state-in-effect`, Teil von `eslint-config-next` mit React-Compiler-Regeln) verbietet direkte `setState`-Aufrufe im Effekt-Body, das Pattern aus den React-Docs („you might not need an effect") löst das sauber.
- Codex-Review (gpt-5.6-sol, high): ein Blocker, drei Warnings, ein Nit.
  - **Blocker behoben:** Fractional-Ranking ohne Kollisionsschutz — nach vielen Einsortierungen zwischen denselben Nachbarn rundet `float8` den Mittelwert exakt auf einen Nachbarwert (verletzt Akzeptanzkriterium 5). Fix: Kollisionserkennung (`newPosition === prev.position || newPosition === next.position`) löst ein volles Rebalancing aller sichtbaren Listen-Positionen auf sichere 1000er-Abstände aus.
  - **Warning behoben:** Reorder-Fehler wurden bisher verschluckt (`void reorderList(...)`) — jetzt awaited, bei Fehler Toast plus Rollback auf `initialLists`.
  - **Warning behoben:** `cancelledRef` (Escape-vs-Blur-Race) blieb nach einem abgebrochenen Edit gesetzt und hätte den nächsten regulären Blur verschluckt — wird jetzt beim Öffnen des Editors zurückgesetzt (Rename und Quick-Add).
  - **Warning bewusst akzeptiert:** `createList` liest `max(position)` und inserted in zwei getrennten Schritten ohne Lock/RPC — theoretische Race Condition bei zwei parallelen Requests (z. B. zwei Tabs). Für eine Solo-User-App mit seltenen gleichzeitigen List-Anlagen ist das Risiko gering; volle Lösung (RPC mit `select for update`) würde die Spec-Komplexität für einen Rand-Fall unverhältnismäßig erhöhen. Bei Bedarf in `backlog.md` nachziehbar.
  - **Nit behoben:** Quick-Add-Button zeigt „Erste Liste anlegen" statt „Liste hinzufügen", wenn das Board noch leer ist.
- Zusätzlich zu Typecheck/Lint erneut `npm run build` (alle Routen kompilieren). Browser-Erweiterung weiterhin nicht verbunden, kein visueller Drag-Test in dieser Session möglich — empfohlene Nachverifikation (Rebalancing-Stichprobe, Escape/Blur-Sequenz) folgt beim nächsten Browser-Zugriff.
