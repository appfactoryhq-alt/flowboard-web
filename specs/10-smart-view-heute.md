# 10 — Smart-View „Heute"

## Ziel

Aggregierte Ansicht über alle Boards hinweg: Cards mit `due_date = heute` (in User-Timezone) an einem Ort. Erste Smart-View, ersetzt den Platzhalter-Sidebar-Link aus Spec 03.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `profiles.timezone`, `cards.due_date`.
- Spec 09 (Labels + Priority) — Card-Darstellung ist bereits vollständig (Labels/Priority sichtbar), diese Spec nutzt dieselbe Card-Komponente in einer neuen Liste.

## Out of Scope

- Focus-Mode (eigene Spec 11, andere Filterlogik).
- Zeitraum-Filter jenseits „heute" (z. B. „diese Woche") — nicht im Scope.

## Bereits entschiedene Punkte

- Timezone-Handling: `profiles.timezone`, View filtert mit `current_date at time zone <user-tz>`, nicht mit `current_date` direkt (Server-Timezone wäre falsch für den User).

## Tasks

1. SQL-View `today_cards` via Supabase MCP `apply_migration`: `create view today_cards with (security_invoker = true) as select c.* from cards c join profiles p on p.id = c.user_id where c.due_date = (now() at time zone p.timezone)::date`. `security_invoker = true` ist Pflicht, damit RLS der Basis-Tabelle greift (sonst würde die View mit den Rechten des Erstellers laufen).
2. `src/app/(app)/today/page.tsx` — lädt aus `today_cards`, rendert Cards gruppiert oder flach mit Board-Referenz (damit klar ist, aus welchem Board eine Card stammt, da boardübergreifend).
3. Sidebar-Link „Heute" aus Spec 03 aktivieren (Platzhalter entfernen, echten Link setzen).
4. Klick auf eine Card in der Heute-Ansicht öffnet dasselbe Detail-Modal wie im Board (Spec 08), Card bleibt aber logisch in ihrer Original-Liste (kein Move).
5. Empty State „keine Cards heute fällig".
6. Cross-Fade-Transition beim Wechsel zwischen Smart-View und normaler Board-Ansicht (siehe `rules/design-system.md`).

## Akzeptanzkriterien

1. Card mit `due_date = heute` (in der User-Timezone aus `profiles.timezone`) erscheint in der Heute-Ansicht.
2. Card mit `due_date` in der Vergangenheit oder Zukunft erscheint nicht.
3. Ein User sieht ausschließlich eigene Cards (RLS über `security_invoker` greift durch die View hindurch, verifiziert per zweitem Test-User).
4. Timezone-Wechsel im Profil (falls testbar) verschiebt, welche Cards als „heute" gelten, korrekt.
5. Detail-Modal aus der Heute-Ansicht speichert Änderungen korrekt zurück in die Original-Card.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- `get_advisors(security)` nach View-Migration — keine Blocker (insbesondere `security_invoker` korrekt gesetzt).
- Manuell: Card mit heutigem Due-Date anlegen, in Heute-Ansicht prüfen, mit zweitem Test-User Isolation prüfen.

## Relevante Rules

- `rules/tech-stack.md` — Supabase/RLS.
- `rules/design-system.md` — Cross-Fade bei Smart-View-Wechsel.

## Status

offen
