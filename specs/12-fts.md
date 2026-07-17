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

fertig

## Debrief

- Migration `flow_board_cards_search_vector`: generated column `search_vector` (`to_tsvector('german', title || description)`), GIN-Index. `get_advisors(security)` zeigt nur die bekannte, erwartete WARN.
- `searchCards` nutzt `.textSearch("search_vector", query, { type: "websearch", config: "german" })` — von Codex explizit gegen die installierte `@supabase/postgrest-js`-Version verifiziert, entspricht `websearch_to_tsquery('german', ...)`. Kein eigener `user_id`-Filter — konsistent mit allen bisherigen Actions in diesem Projekt, die durchgängig RLS als alleinige Autorisierungsschicht nutzen (Abweichung von der ursprünglichen Spec-Formulierung, die einen zusätzlichen Filter „defense in depth" vorsah — bewusst an die etablierte Projekt-Konvention angeglichen).
- `SearchCommand`: Cmd/Ctrl+K-Shortcut, 300ms Debounce, shadcn `CommandDialog`. **Wichtiger Fund:** die base-nova-generierte `CommandDialog`-Komponente wrapped `children` NICHT automatisch in `<Command>` (anders als der shadcn-Standard-Codebaustein) — `cmdk`-Primitives wie `CommandInput`/`CommandList` brauchen aber den `Command`-Context, sonst Runtime-Crash. Fix: eigener `<Command shouldFilter={false}>`-Wrapper in `search-command.tsx`, von Codex als notwendig und korrekt bestätigt.
- Klick auf Ergebnis navigiert zu `/board/{boardId}?card={cardId}`; `CardItem` liest `?card=` und öffnet automatisch das passende Detail-Modal, entfernt den Parameter danach wieder.
- **Codex-Review (gpt-5.6-sol, high): ein Blocker, eine Warning behoben.**
  - **Blocker behoben: Deep-Link öffnete die Card nicht, wenn deren Board bereits angezeigt wurde.** Der `useState`-Lazy-Initializer für `detailOpen` erfasst nur den Fall, dass die Card gerade neu gemountet wird (Navigation von einem anderen Board). Bleibt die Card-Liste beim Klick auf ein Suchergebnis für das aktuell offene Board gemountet, ändert sich nur der Query-Param — kein neuer Mount, der Initializer läuft nie erneut, der Dialog blieb zu. Fix: „Adjust state during render"-Guard (`handledSearchOpen`-Flag) öffnet den Dialog jetzt zuverlässig bei jedem `?card=`-Treffer, unabhängig vom Mount-Zeitpunkt. Der reine URL-Cleanup (`router.replace`) bleibt als echter Seiteneffekt im `useEffect`.
  - **Warning behoben: veraltete Suchantworten konnten neuere überschreiben.** Schnelle Folge-Eingaben ohne Sequenzschutz — eine langsamere ältere Antwort konnte nach einer schnelleren neueren zurückkommen und deren Ergebnisse überschreiben. Fix: `requestIdRef`-Zähler, nur die jeweils aktuellste Anfrage darf `results` setzen.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** Suche im UI, Deep-Link auf gleichem/anderem Board, deutsches Stemming (Singular/Plural), Cross-User-Isolation, GIN-Index-Nutzung via `explain`.
