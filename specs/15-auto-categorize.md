# 15 — Auto-Categorization

## Ziel

Für eine bestehende Card schlägt die AI eine passende Priority und/oder Labels vor (basierend auf Titel/Beschreibung). Vorschlag muss vom User explizit bestätigt werden, Version-Check verhindert, dass ein veralteter Vorschlag eine zwischenzeitlich geänderte Card überschreibt.

## Abhängigkeiten

- Spec 09 (Labels + Priority) — Ziel-Felder existieren.
- Spec 14 (Smart-Card-Generation) — AI-Provider-Setup (Requesty, Env-Var) bereits vorhanden, wird hier wiederverwendet statt dupliziert.

## Out of Scope

- Automatisches Anwenden ohne Bestätigung (bewusst nicht — User bleibt in Kontrolle).
- Batch-Kategorisierung mehrerer Cards gleichzeitig (kann bei Bedarf in den Backlog, hier nur Einzel-Card).

## Bereits entschieden

- Server Action (kein Route Handler nötig — dieses Feature ist nicht Native-kritisch im selben Sinn wie Generation, da es an eine bestehende Card im Web-UI gebunden ist; falls Native es später braucht, kann es dann zum Route Handler migriert werden).
- Modell: Haiku via Requesty (klein/günstig genug für eine einfache Klassifikationsaufgabe).
- Vorschlag wird mit `card_id` plus `card_updated_at`-Snapshot gespeichert (Version-Check), Apply läuft über RPC, die den Snapshot gegen den aktuellen `updated_at`-Wert prüft.

## Tasks

1. Context7 MCP für AI-SDK-Stand nutzen, falls seit Spec 14 nicht mehr aktuell im Kontext.
2. Postgres-RPC `apply_category_suggestion(p_card_id uuid, p_expected_updated_at timestamptz, p_priority text, p_label_ids uuid[])`: prüft `cards.updated_at = p_expected_updated_at` (sonst Fehler „Card wurde zwischenzeitlich geändert"), aktualisiert `priority` und `card_labels` atomar innerhalb einer Transaktion, `security definer`, Ownership-Check inklusive.
3. Server Action `suggestCategory(cardId)` in `src/lib/ai/actions.ts`: lädt Card-Titel/Beschreibung plus verfügbare Board-Labels, ruft Haiku via Requesty (kein Streaming nötig, einfacher `generateObject`-Call mit Zod-Schema `{ priority, labelNames: string[] }`), mappt vorgeschlagene Label-Namen auf existierende `label_id`s (keine neuen Labels automatisch anlegen).
4. Server Action `applyCategorySuggestion(cardId, expectedUpdatedAt, priority, labelIds)`: ruft die RPC, gibt `{ data, error }` zurück, Fehlermeldung bei Versionskonflikt klar an den Client durchgereicht.
5. UI im Card-Detail-Modal (Spec 08): Button „Vorschlag holen" → zeigt Vorschlag (Priority-Badge, Label-Chips) mit „Übernehmen"/„Verwerfen", kein automatisches Anwenden.
6. Versionskonflikt-Fall in UI: Meldung „Card wurde zwischenzeitlich geändert, bitte neu vorschlagen lassen" statt stillem Fehlschlag oder Überschreiben.

## Akzeptanzkriterien

1. „Vorschlag holen" liefert eine plausible Priority plus 0–n passende Label-Vorschläge basierend auf Titel/Beschreibung.
2. „Übernehmen" wendet den Vorschlag an, sichtbar in Card und Modal.
3. Wird die Card zwischen Vorschlag und Übernehmen anderswo geändert (simuliert), schlägt „Übernehmen" kontrolliert fehl mit verständlicher Meldung statt die zwischenzeitliche Änderung zu überschreiben.
4. Vorgeschlagene Labels, die nicht als Board-Label existieren, werden nicht automatisch angelegt (nur bestehende werden gemappt).
5. Requesty-API-Key bleibt server-only, kein Leak in Client-Bundle oder Logs.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Vorschlag holen und übernehmen, Versionskonflikt gezielt herbeiführen (Card in zweitem Tab ändern zwischen Vorschlag und Übernehmen).

## Relevante Rules

- `guidelines.md` — Context7-Pflicht AI-SDK.
- `rules/code-conventions.md` — RPC-Pflicht bei kritischer Mutationslogik, Error-Pattern.
- Sicherheitsregel — Requesty-Key nie im Client-Code, nie in Logs.

## Status

offen
