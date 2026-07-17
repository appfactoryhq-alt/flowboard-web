# 12 — Full-Text Search

## Ziel

User kann Cards boardübergreifend per Volltextsuche über Titel und Beschreibung finden (deutschsprachige Suche, Stemming über Postgres `german`-Konfiguration).

## Abhängigkeiten

- Spec 06 (Cards-CRUD) — `cards.title`/`description` existieren mit echten Inhalten.

## Out of Scope

- Fuzzy-/Typo-Toleranz jenseits dessen, was `websearch_to_tsquery` bietet.
- Suche über Kommentare/Attachments (existieren nicht, bewusst draußen).

## Tasks

1. Migration via Supabase MCP `apply_migration`: generated column `search_vector tsvector generated always as (to_tsvector('german', coalesce(title, '') || ' ' || coalesce(description, ''))) stored` auf `cards`, plus GIN-Index (`create index cards_search_idx on cards using gin (search_vector)`).
2. Server Action `searchCards(query: string)` in `src/lib/cards/actions.ts`: `select ... where search_vector @@ websearch_to_tsquery('german', $1) and user_id = auth.uid()` (RLS greift zusätzlich, `user_id`-Filter ist Defense-in-Depth, kein Ersatz für RLS).
3. Search-UI: `Command`-Palette (shadcn `Command`, ⌘K/Ctrl+K-Shortcut) im Header, Debounced Input, Ergebnisliste mit Board-/List-Referenz pro Treffer.
4. Klick auf Suchergebnis navigiert zum entsprechenden Board und öffnet die Card (Detail-Modal aus Spec 08).
5. Leere Query zeigt keine Ergebnisse (kein „alle Cards"-Dump), zu kurze Query (< 2 Zeichen) triggert noch keinen Request (Debounce plus Mindestlänge).

## Akzeptanzkriterien

1. Suche nach einem Wort aus dem Titel einer Card findet diese Card.
2. Suche nach einem Wort aus der Beschreibung findet die Card ebenfalls.
3. Suche liefert ausschließlich eigene Cards (RLS-Isolation, verifiziert mit zweitem Test-User).
4. Deutsche Wortformen (z. B. Singular/Plural, Deklination) werden durch die `german`-Textsearch-Konfiguration abgedeckt (Stichprobe: „Rechnung" findet „Rechnungen").
5. Klick auf Ergebnis öffnet die richtige Card im richtigen Board-Kontext.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- `get_advisors(performance)` — GIN-Index wird genutzt, kein Sequential Scan bei der Suche (Stichprobe via `execute_sql` mit `explain`).
- Manuell: Suche über mehrere Boards hinweg, Stemming-Test, Isolation-Test mit zweitem User.

## Relevante Rules

- `rules/tech-stack.md` — Supabase Postgres.
- `rules/code-conventions.md` — Error-Pattern.

## Status

offen
