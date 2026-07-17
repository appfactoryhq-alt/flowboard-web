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

offen
