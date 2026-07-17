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

fertig

## Debrief

- `src/lib/labels/actions.ts` (createLabel/deleteLabel/assignLabel/unassignLabel), `src/lib/labels/types.ts` (LABEL_COLORS/LabelColor/Label — bewusst NICHT in der `"use server"`-Datei, siehe Codex-Fund), `src/lib/labels/colors.ts` (statische Tailwind-Klassen-Maps pro Preset-Farbe, damit Tailwind v4s JIT sie erkennt).
- `updateCardPriority` in `src/lib/cards/actions.ts` ergänzt.
- UI: `LabelPicker` (Popover, Zuweisen/Entfernen per Klick, inline „Neues Label"-Formular mit 9 Farb-Swatches, Löschen pro Label per Hover-Icon), `LabelBadge` (Listen- und Modal-Ansicht), `PrioritySelect`/`PriorityDot` (shadcn `Select`, 3 Stufen mit Farbpunkt).
- `Card`-Typ um `priority` und `labelIds` erweitert, `board/[boardId]/page.tsx` lädt `labels` (board-weit) und `card_labels` über einen PostgREST-Embedded-Join (`card_labels.select("card_id, label_id, cards!inner(board_id)").eq("cards.board_id", boardId)`), gruppiert zu `labelIdsByCard`.
- **Codex-Review (gpt-5.6-sol, high): zwei Blocker behoben.**
  - **Blocker: ungültiger Non-Async-Export aus einer `"use server"`-Datei.** `LABEL_COLORS` (Array) sowie die Typen `LabelColor`/`Label` waren ursprünglich direkt in `src/lib/labels/actions.ts` definiert — Next.js erlaubt aus einem `"use server"`-Modul aber ausschließlich async-Funktions-Exports; ein Client Component importierte `LABEL_COLORS` als Laufzeitwert direkt daraus. Der lokale Build lief zwar grün durch (vermutlich weil Turbopack das in dieser Konstellation toleriert), das ist aber fragiles, nicht spezifikationskonformes Verhalten. Fix: `LABEL_COLORS`/`LabelColor`/`Label` in ein neues, plain Modul `src/lib/labels/types.ts` verschoben, alle Konsumenten (App-weit acht Dateien) auf den neuen Importpfad umgestellt. `actions.ts` importiert `LABEL_COLORS`/`LabelColor` von dort für die interne Validierung, exportiert selbst nur noch async Functions plus den (type-only, damit unkritischen) `LabelActionState`-Typ.
  - **Blocker: `deleteLabel` war nirgends in der UI erreichbar.** Task 6/Akzeptanzkriterium 5 der Spec verlangen, dass Löschen eines Labels alle Zuweisungen entfernt — die Funktion existierte, wurde aber nie aufgerufen. Fix: Hover-sichtbares Lösch-Icon pro Label-Zeile im `LabelPicker` (kein Blocking-Dialog, konsistent mit dem bereits etablierten Card-Delete-Muster, da eine falsch gelöschte Label sich einfach neu anlegen lässt).
- Zusätzlich zu Typecheck/Lint einen vollständig sauberen `npm run build` nach `rm -rf .next` gefahren (nicht nur inkrementell), um den vom Review aufgeworfenen Zweifel am Build-Status auszuräumen.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** Label anlegen/zuweisen/entfernen/löschen im UI, Duplicate-Name-Fehlermeldung, Priority-Select-Interaktion, PostgREST-Embedded-Join-Query gegen echte Daten (Codex hält die Syntax für korrekt basierend auf der installierten `@supabase/postgrest-js`-Version und dem in Spec 01 dokumentierten FK, hat es aber mangels DB-Zugriff nicht selbst ausgeführt).
