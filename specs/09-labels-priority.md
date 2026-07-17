# 09 — Labels + Priority

## Ziel

Labels pro Board verwalten (Preset-Farben) und Cards zuweisen, Priority (low/med/high) pro Card setzen und in Card-Ansicht plus Detail-Modal sichtbar machen. Schließt MVP 1 (Kern-Kanban) ab.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `labels`, `card_labels`, `cards.priority` existieren bereits.
- Spec 08 (Card-Detail-Modal) — Ort für Label-Zuweisung und Priority-Auswahl.

## Out of Scope

- Freier Color-Picker (bewusst gegen Preset-Liste entschieden, siehe Spec 01).
- Label-Filter/Board-weite Label-Verwaltungsseite jenseits eines einfachen Verwaltungs-Dialogs (kann bei Bedarf in den Backlog).

## Bereits entschiedene Punkte

- Preset-Farbliste (9 Werte: gray/red/orange/amber/green/cyan/blue/purple/pink), Check-Constraint bereits in Spec 01 angelegt.

## Tasks

1. `src/lib/labels/actions.ts` — Server Actions `createLabel`, `deleteLabel`, `assignLabel`, `unassignLabel`. `{ data, error }`-Pattern, Preset-Farben als Enum/Const-Array gespiegelt zur DB-Check-Constraint.
2. `src/lib/cards/actions.ts` erweitern um `updateCardPriority`.
3. Label-Verwaltungs-`Popover` im Card-Detail-Modal: Liste vorhandener Board-Labels mit Checkbox (zugewiesen/nicht), „Neues Label"-Inline-Formular (Name + Farb-Swatch-Auswahl aus den 9 Presets).
4. Priority-Select im Card-Detail-Modal (shadcn `Select`, drei Optionen low/med/high mit visueller Kennzeichnung, z. B. Farbpunkt).
5. Card-Komponente (Liste) zeigt zugewiesene Labels als kompakte Farb-Badges plus Priority-Indikator (dezent, nicht dominant).
6. Label löschen entfernt automatisch alle Zuweisungen (Cascade über `card_labels`).

## Akzeptanzkriterien

1. Neues Label mit Name plus Preset-Farbe anlegen erscheint sofort in der Auswahl.
2. Label einer Card zuweisen/entfernen spiegelt sich sofort auf der Card in der Listenansicht.
3. Priority-Änderung ist sofort auf Card und im Modal sichtbar.
4. Zwei Labels mit demselben Namen auf demselben Board sind nicht möglich (DB-Unique-Constraint greift, Fehlermeldung statt Crash).
5. Label löschen entfernt alle Zuweisungen, keine verwaisten `card_labels`-Einträge.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Label anlegen, zuweisen, entfernen, löschen, Priority setzen, Duplicate-Name-Versuch.

## Relevante Rules

- `rules/code-conventions.md` — Error-Pattern.
- `rules/design-system.md` — Badge-Darstellung, Farbkontrast bei abgestuften Neutrals.

## Status

offen
