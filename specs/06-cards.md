# 06 — Cards-CRUD (Quick-Add)

## Ziel

Cards innerhalb einer Liste anlegen (inline Quick-Add am Listenende), anzeigen, bearbeiten (Titel/Beschreibung/Due-Date über die Card selbst, Details in Spec 08) und löschen. Kern-Kanban-Baustein.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `cards`-Tabelle.
- Spec 05 (Lists-CRUD) — Lists existieren als Container.

## Out of Scope

- Drag-and-Drop zwischen Lists (Spec 07).
- Vollständiges Detail-Modal (Spec 08) — hier nur Titel editierbar direkt auf der Card, Rest über Platzhalter-Klick auf Detail (Modal kommt erst in Spec 08, bis dahin reicht Titel-Edit inline).
- Labels/Priority-UI (Spec 09) — Schema-Felder existieren, aber Anzeige/Zuweisung erst dort.

## Bereits entschieden

- Quick-Add-UX: Enter speichert die Card sofort, Input-Feld leert sich direkt für die nächste Card (kein zusätzlicher Button-Klick nötig, siehe Vision). Escape bricht ab und schließt das Input.

## Tasks

1. `src/lib/cards/actions.ts` — Server Actions `createCard`, `updateCardTitle`, `deleteCard`. `{ data, error }`-Pattern. `position` analog Lists per Fractional Ranking (neue Card ans Listenende: letzte Position + fixer Schrittwert).
2. Card-Komponente: Titel, Due-Date-Badge falls gesetzt (Spec-09-Felder Labels/Priority werden erst dort gerendert, Komponente aber schon so aufbauen, dass sie erweiterbar ist).
3. Quick-Add-Input am Ende jeder Liste: Klick öffnet Inline-`Input`, Enter ruft `createCard` auf und behält Fokus für die nächste Eingabe, Escape schließt ohne Speichern, Blur ohne Eingabe schließt ebenfalls ohne Speichern.
4. Card-Titel inline editierbar (Klick auf Titel → Input, Enter/Blur speichert via `updateCardTitle`, Escape verwirft).
5. Card löschen über Kontext-Menü (Hover-sichtbares Icon), Bestätigung nur bei nicht-leerem Titel nicht nötig (geringes Risiko, aber kurze Undo-Toast via Sonner ist ausreichend statt Blocking-Dialog).
6. Cards je Liste laden, sortiert nach `position`.

## Akzeptanzkriterien

1. Enter im Quick-Add-Feld erzeugt sofort eine neue Card am Listenende, Feld bleibt fokussiert und leer für die nächste Eingabe.
2. Leerer Titel wird nicht gespeichert (Constraint `char_length between 1 and 200`, clientseitig gespiegelt).
3. Titel-Inline-Edit speichert bei Enter/Blur, verwirft bei Escape.
4. Card löschen entfernt sie sofort aus der Liste, Undo-Toast erlaubt Wiederherstellung innerhalb weniger Sekunden (oder zumindest klare Bestätigung, dass gelöscht wurde).
5. Cards bleiben nach Reload in der Liste, in der richtigen Reihenfolge.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: mehrere Cards per Enter nacheinander anlegen (Fokus-Verhalten prüfen), Titel editieren, löschen, Reload.

## Relevante Rules

- `rules/code-conventions.md` — Error-Pattern, Import-Reihenfolge.
- `rules/design-system.md` — Hover-/Focus-States auf Card und Quick-Add.

## Status

offen
