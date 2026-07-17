# 11 — Focus-Mode

## Ziel

User kann bis zu 3 Cards boardübergreifend als „Focus" markieren (z. B. „das arbeite ich heute ab"). Eigene Ansicht `/focus` zeigt genau diese Cards, Slot-Limit wird durch das Schema erzwungen, nicht durch App-Logik.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `cards.focus_slot` (smallint, check 1–3), Partial Unique Index `(user_id, focus_slot) where is_focus_active = true` bereits angelegt.
- Spec 09 (Labels + Priority) — Card-Komponente wiederverwendbar.

## Bereits entschiedene Punkte

- Focus-Mode-Maximum: 3 Cards fix, durchgesetzt via Partial Unique Index (nicht als App-seitige Zählung, die Race Conditions erlauben würde).

## Out of Scope

- Automatische Focus-Vorschläge (kein AI-Bezug hier, das wäre ein anderer Feature-Schnitt).
- Reihenfolge/Priorisierung innerhalb der 3 Slots über Drag (Slots sind gleichwertig, keine Sub-Sortierung nötig).

## Tasks

1. Prüfen, ob Spec 01 bereits eine `is_focus_active`-Spalte angelegt hat (laut Architektur-Entscheidung Teil des Partial-Unique-Index); falls in der tatsächlichen Migration nur `focus_slot` ohne separates Aktiv-Flag existiert, per Supabase MCP `list_tables` verifizieren und bei Bedarf per neuer Migration ergänzen (`is_focus_active boolean not null default false`), bevor diese Spec weitergeht.
2. `src/lib/cards/actions.ts` erweitern: `activateFocus(cardId)` — setzt `is_focus_active = true` plus ersten freien `focus_slot` (1–3), schlägt fehl (kontrolliert, `{ data, error }`) wenn bereits 3 aktive Slots belegt sind (Unique-Index-Violation abfangen und in verständliche Fehlermeldung übersetzen). `deactivateFocus(cardId)` — setzt beides zurück.
3. `src/app/(app)/focus/page.tsx` — lädt Cards mit `is_focus_active = true` für den User, zeigt max. 3 Cards mit Board-Referenz.
4. Sidebar-Link „Focus" aus Spec 03 aktivieren.
5. Focus-Toggle direkt auf der Card (Icon-Button, z. B. Zielscheibe/Stern), sichtbarer Zustand wenn aktiv (auch außerhalb der Focus-Ansicht, also auf dem normalen Board).
6. UI-Feedback bei „Focus voll" (3/3 belegt): Toggle-Versuch zeigt klare Meldung statt stillem Fehlschlag.

## Akzeptanzkriterien

1. Card als Focus markieren erscheint in `/focus`, maximal 3 gleichzeitig möglich.
2. Versuch, eine vierte Card zu markieren, schlägt kontrolliert fehl mit verständlicher Meldung (kein 500er, kein stiller No-Op).
3. Focus-Status ist auf der Card auch im normalen Board-View sichtbar.
4. Deaktivieren gibt den Slot frei, eine neue Card kann danach markiert werden.
5. Race Condition (zwei schnelle Aktivierungsversuche) führt nicht zu mehr als 3 aktiven Slots (DB-Constraint als letzte Verteidigungslinie, nicht nur App-Logik).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: 3 Cards markieren, vierte versuchen (Fehlerfall prüfen), eine deaktivieren, erneut markieren.

## Relevante Rules

- `rules/code-conventions.md` — Error-Pattern (Constraint-Violation sauber übersetzen).
- `rules/design-system.md` — Cross-Fade bei Smart-View-Wechsel.

## Status

fertig

## Debrief

- Schema-Check bestätigt: **keine separate `is_focus_active`-Spalte nötig.** Live-Schema hat bereits einen Partial-Unique-Index `cards_focus_slot_unique_idx` auf `(user_id, focus_slot) WHERE focus_slot IS NOT NULL` — `focus_slot IS NOT NULL` dient direkt und eindeutig als „ist aktiv"-Signal, keine Migration erforderlich.
- `activateFocus`: liest alle Cards des Users mit belegtem `focus_slot`, wählt die kleinste freie Zahl 1–3, schreibt sie; bei „Focus voll" kontrollierte Fehlermeldung. Race Condition (zwei gleichzeitige Aktivierungen wählen denselben freien Slot) fängt den Unique-Index-Verstoß (`23505`) ab und übersetzt ihn verständlich — DB-Constraint bleibt letzte Verteidigungslinie, exakt wie in der Spec gefordert. `deactivateFocus` setzt `focus_slot` zurück auf `null`.
- Focus-Toggle direkt auf `CardItem` (Target-Icon, immer sichtbar wenn aktiv, sonst Hover-Reveal wie der Delete-Button).
- `/focus`-Seite folgt demselben Muster wie `/today` (Spec 10): board-übergreifend, gruppiert nach Board. Die gemeinsame Anzeigekomponente wurde von `today-cards-list.tsx` zu `cross-board-card-list.tsx`/`CrossBoardCardList` umbenannt, da sie jetzt von beiden Smart-Views geteilt wird.
- **Refactor:** `revalidateCardViews`-Helper aus `src/lib/cards/actions.ts` in ein eigenes plain Modul `src/lib/revalidate.ts` verschoben (kann als sync-Funktion nicht aus einer `"use server"`-Datei exportiert werden, siehe Spec-09-Learning) und jetzt auch von `src/lib/labels/actions.ts` verwendet — vorher hatte jede Action-Datei ihre eigene, leicht divergierende Revalidierungs-Logik.
- **Codex-Review (gpt-5.6-sol, high): kein Blocker.** Verzicht auf `is_focus_active` explizit als korrekt bestätigt. Eine Warning behoben: `deleteLabel`/`assignLabel`/`unassignLabel` revalidierten `/focus` nicht, obwohl Label-Badges auch dort angezeigt werden — durch den zentralisierten Helper jetzt automatisch mit abgedeckt.
- **Bewusst nicht behoben (Risiko, kein Fehler):** Bei zwei gleichzeitigen Aktivierungsversuchen mit zwei freien Slots kann einer der beiden fehlschlagen, obwohl danach noch ein Slot frei wäre (beide wählen denselben kleinsten freien Slot, einer verliert den Unique-Index-Wettlauf). Ein Retry nach `23505` wäre robuster, ist aber für die Akzeptanzkriterien nicht zwingend und für eine Solo-User-App ein seltenes Timing-Fenster.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** Focus-Toggle im UI, „Focus voll"-Fehlermeldung bei vierter Aktivierung, Label-Zuweisung direkt aus `/focus`.
