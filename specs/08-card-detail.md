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

fertig

## Debrief

- `CardDetailDialog` (`src/components/cards/card-detail-dialog.tsx`): Titel (Input, Blur-Save), Beschreibung (Textarea, 600ms Debounce, Flush beim Schließen), Fälligkeitsdatum (Popover + shadcn `Calendar`/`react-day-picker`, deutsches Locale via `date-fns`), Erstellt-/Aktualisiert-Zeitstempel.
- **Interaktions-Kombination Spec 06 vs. Spec 08:** Klick auf den Titel-Text bleibt Inline-Edit (Spec 06, `stopPropagation`), Klick auf den restlichen Card-Body öffnet das Detail-Modal (Spec 08). Beide Anforderungen bewusst kombiniert statt eine zu verwerfen.
- **Motion `layoutId`** liegt bewusst nur auf dem Titel-Bereich (nicht dem ganzen Card-Container), sowohl in `CardItem` als auch im Dialog-Header — vermeidet einen Transform-Konflikt zwischen dnd-kits Drag-Transform (auf dem äußeren Card-Container) und Motions Layout-Animation auf demselben Element.
- `sortable-card.tsx` reicht dnd-kit-Drag-Props (`ref`/`style`/`attributes`/`listeners`) jetzt als Props an `CardItem` durch, statt einen eigenen umschließenden Div zu rendern — ein einziges Element trägt sowohl Drag- als auch Klick-/Tastatur-Handling, sonst landet der Tastatur-Fokus (dnd-kit) auf einem anderen Element als der Klick-Handler (Modal-Öffnen).
- `MotionConfig reducedMotion="user"` im Root-Layout (schützt die Motion-`layoutId`-Animation), `DialogContent` zusätzlich mit `motion-reduce:data-open:zoom-in-100 motion-reduce:data-closed:zoom-out-100 motion-reduce:duration-0` (neutralisiert Base UIs eigene, unbedingte CSS-Zoom-Klassen unter `prefers-reduced-motion`).
- **Codex-Review (gpt-5.6-sol, high, zwei Runden):**
  - **Blocker behoben:** Ursprünglich wurde der lokale Titel/Beschreibung-State bei jeder Änderung der `card`-Objektidentität zurückgesetzt (`card !== prevCard`) — da eine Server-Revalidierung für *jede* Card ein neues Objekt erzeugt (auch inhaltlich unveränderte), konnte das Bearbeiten von Card B ungespeicherten Text von Card A überschreiben, sobald irgendeine Revalidierung dazwischenkam. Fix: Reset nur beim Übergang geschlossen→offen (`open && !wasOpen`), nicht bei jeder Prop-Änderung während der Dialog offen bleibt. Zweite Codex-Runde bestätigt: Datenverlustpfad geschlossen.
  - **Warning behoben (Tastatur/Fokus):** Kein `DialogTrigger`, kein Tastaturweg zum Öffnen, Fokus-Rückgabe nicht garantiert. Fix: expliziter `onKeyDown` (Enter/Space) auf dem jetzt einzigen Card-Container, `containerRef.focus()` beim Schließen des Dialogs. Zweite Codex-Runde fand einen Folgefehler: der Container-`onKeyDown` fing auch von verschachtelten Elementen (Titel-Button, Delete-Button) hochblubbernde Enter/Space-Events ab und öffnete zusätzlich das Modal. Fix: `if (event.target !== event.currentTarget) return`-Guard, reagiert nur auf Events, die direkt am Container ausgelöst wurden. Der von Codex vermutete Bruch von dnd-kit-Keyboard-Dragging trifft nicht zu — es ist nur `PointerSensor` registriert (siehe Spec 07), ein `KeyboardSensor`-Aktivator existierte nie.
  - **Warning behoben (Reduced Motion):** Base UIs `DialogContent` hatte unbedingte `zoom-in-95`/`zoom-out-95`-Klassen, `MotionConfig` allein deckt nur Motions eigene Animationen ab. Fix wie oben, zweite Codex-Runde bestätigt: Tailwind-`motion-reduce:`-Klassen bleiben nach `tailwind-merge` erhalten und neutralisieren den Zoom korrekt.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** visuelle Qualität der `layoutId`-Shared-Transition, Tab/Enter/Space-Bedienung von Titel-Edit vs. Modal-Öffnen vs. Delete, Fokus-Rückgabe nach Escape/Close-Button, Reduced-Motion-Emulation.
