# 08 — Card-Detail-Modal

## Ziel

Klick auf eine Card öffnet ein Detail-Modal (shadcn `Dialog`) mit voller Editierbarkeit (Titel, Beschreibung, Due-Date). Übergang von Card-in-Liste zu Modal läuft als Shared-Layout-Transition über Motion `layoutId`, damit die Card visuell „aufklappt" statt hart zu wechseln.

## Abhängigkeiten

- Spec 06 (Cards-CRUD) — Card-Grunddaten und Actions existieren.

## Out of Scope

- Labels/Priority-Editierung im Modal (Spec 09 ergänzt die entsprechenden Controls in diesem Modal).
- Kommentare/Attachments (bewusst draußen laut Vision).

## Tasks

1. `src/components/cards/card-detail-dialog.tsx` — shadcn `Dialog`, Trigger ist die Card-Komponente selbst (kein separater „Öffnen"-Button nötig, Klick auf Card-Body öffnet).
2. Motion `layoutId={`card-${card.id}`}` auf Card-Komponente und korrespondierendem Element im Dialog-Content, damit der Übergang als Shared-Layout-Transition läuft (siehe `rules/design-system.md`).
3. Modal-Inhalt: Titel (editierbar, gleiche Inline-Edit-Logik wie Spec 06), Beschreibung (Textarea, `updateCardDescription`-Action), Due-Date (shadcn `Calendar`/`Popover`, `updateCardDueDate`-Action), Erstellt-/Aktualisiert-Zeitstempel als Read-only-Info.
4. `src/lib/cards/actions.ts` erweitern: `updateCardDescription`, `updateCardDueDate`. `{ data, error }`-Pattern, `updated_at` wird per DB-Trigger aktualisiert (kein manuelles Setzen nötig).
5. Speichern läuft debounced (Beschreibung) bzw. sofort bei Blur/Auswahl (Due-Date), kein expliziter „Speichern"-Button nötig (konsistent mit Quick-Add/Inline-Edit-Pattern der App).
6. Modal schließen (Escape, Klick außerhalb, X-Button) — offene Debounce-Saves werden vor dem Schließen geflusht, damit keine Eingabe verloren geht.
7. `prefers-reduced-motion`: Shared-Layout-Transition fällt bei aktivierter Systemeinstellung auf einfaches Fade zurück (siehe `rules/design-system.md`).

## Akzeptanzkriterien

1. Klick auf Card öffnet Modal mit sichtbarer Shared-Layout-Transition (Card-Form wandert visuell zur Modal-Position).
2. Titel/Beschreibung/Due-Date-Änderungen im Modal sind nach Schließen auch in der Card-Ansicht sichtbar (kein Reload nötig).
3. Schließen ohne explizites Speichern verliert keine bereits eingegebene Beschreibung (Debounce/Flush greift).
4. Modal ist per Escape und Klick außerhalb schließbar, Fokus kehrt nach Schließen zur auslösenden Card zurück (Accessibility).
5. Mit `prefers-reduced-motion: reduce` läuft der Übergang als einfaches Fade statt Layout-Morph.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Modal öffnen/schließen, alle Felder editieren, Reduced-Motion-Emulation im Browser prüfen.

## Relevante Rules

- `rules/design-system.md` — `layoutId`-Pattern, Reduced-Motion.
- `rules/code-conventions.md` — Error-Pattern.

## Status

offen
