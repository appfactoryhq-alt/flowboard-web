# 13 — Realtime-Sync

## Ziel

Änderungen an Cards (Insert/Update/Delete) synchronisieren live zwischen mehreren offenen Sessions desselben Users (z. B. zwei Browser-Tabs, später Web plus Native) innerhalb eines Boards, ohne manuellen Reload.

## Abhängigkeiten

- Spec 07 (Cards-DnD) — Card-Mutationen (Move, Create, Update, Delete) sind vollständig, Realtime baut darauf auf.

## Out of Scope

- Realtime für Lists/Boards selbst (Scope bewusst auf Cards begrenzt, da dort die Änderungsfrequenz am höchsten ist; Lists/Boards ändern sich selten genug, dass ein Fokus-Wechsel/Reload ausreicht).
- Konfliktauflösung bei echten gleichzeitigen Edits (Solo-User-Cross-Device-Szenario laut Architektur-Entscheidung, kein Multi-User-Merge nötig).

## Bereits entschieden

- Postgres-Changes-Filter `board_id=eq.${boardId}` pro geöffnetem Board.
- Cleanup zwingend via `supabase.removeChannel(channel)` beim Unmount/Board-Wechsel.
- Idempotenz bei INSERT-Events per Card-ID-Upsert (die eigene Session bekommt ihr eigenes Insert als Echo zurück, State-Update muss idempotent sein, kein Duplikat rendern).
- **DELETE-Events sind bei Postgres Changes nicht spaltenfilterbar** (der `board_id`-Filter greift bei DELETE nicht zuverlässig, da nur die alte Zeile ohne Filter-Spalten-Garantie kommt) — DELETE wird deshalb client-seitig optimistisch gehandhabt (löschende Session entfernt sofort lokal) statt sich auf das Realtime-DELETE-Event zu verlassen. Alternative Tombstone-Pattern nur falls sich das optimistische Vorgehen als unzureichend erweist (Entscheidung im Debrief dokumentieren).

## Tasks

1. Context7 MCP zuerst: aktuellen Stand von `@supabase/supabase-js` Realtime/Postgres-Changes-API prüfen (Pflicht laut `guidelines.md`).
2. Realtime-Publication für `cards` aktivieren (Supabase MCP `apply_migration` oder Dashboard, `alter publication supabase_realtime add table cards`, falls nicht bereits über Default-Publication abgedeckt — verifizieren, nicht annehmen).
3. `src/hooks/use-realtime-cards.ts` (Client Hook): abonniert `postgres_changes` auf `cards` mit Filter `board_id=eq.${boardId}`, verarbeitet INSERT/UPDATE als Upsert in den lokalen State, ignoriert DELETE-Events (siehe Entscheidung oben) oder nutzt sie nur als zusätzliche Bestätigung.
4. Hook-Cleanup: `useEffect`-Return ruft `supabase.removeChannel(channel)`, Channel wird bei Board-Wechsel (neue `boardId`) neu aufgebaut, nicht wiederverwendet.
5. Board-Detailseite (Client-Boundary für den Realtime-Teil) nutzt den Hook, merged eingehende Änderungen mit dem bestehenden optimistischen State aus Spec 06/07 ohne Flackern (kein kurzzeitiges Verschwinden/Wiedererscheinen bei Echo des eigenen Inserts).
6. Sichtbares (dezentes) Live-Indicator-UI ist nicht zwingend Teil des Scopes, aber ein Verbindungsstatus-Fallback (z. B. stiller Retry bei Verbindungsabbruch) muss vorhanden sein.

## Akzeptanzkriterien

1. Card in Tab A anlegen erscheint in Tab B (selbes Board geöffnet) ohne Reload.
2. Card in Tab A verschieben (Cross-List, Spec-07-RPC) aktualisiert Tab B korrekt (richtige Liste, richtige Position).
3. Card in Tab A löschen entfernt sie auch in Tab B (über den gewählten Mechanismus, optimistisch oder Tombstone — dokumentiert im Debrief).
4. Kein sichtbares Duplikat/Flackern in der Session, die die Änderung selbst ausgelöst hat (Echo-Idempotenz).
5. Wechsel zu einem anderen Board deabonniert den alten Channel zuverlässig (verifizierbar über Supabase Realtime-Logs oder Netzwerk-Tab, keine wachsende Zahl offener Sockets).
6. Ein User sieht ausschließlich Realtime-Events für Boards, die ihm gehören (RLS greift auch für Realtime, verifiziert mit zweitem Test-User).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: zwei Browser-Tabs/Fenster nebeneinander, alle drei Mutationsarten (Insert/Update/Move/Delete) gegenprüfen, Board-Wechsel-Cleanup über Netzwerk-Tab prüfen.

## Relevante Rules

- `guidelines.md` — Context7-Pflicht bei Realtime.
- `rules/code-conventions.md` — Error-Pattern.

## Status

fertig

## Debrief

- Realtime-Publication für `cards` war **komplett leer** (via `pg_publication_tables` verifiziert, nicht angenommen — genau der in der Spec verlangte Check). Migration `flow_board_realtime_cards_publication` fügt `public.cards` hinzu.
- `useRealtimeCards(boardId, { onUpsert, onDelete })`: abonniert `postgres_changes` INSERT/UPDATE gefiltert auf `board_id=eq.<boardId>` (RLS greift zusätzlich pro Subscriber). Callback wird über eine Ref aktuell gehalten (`useEffect` ohne Deps aktualisiert die Ref, nicht direkt im Render-Body — sonst schlägt `eslint react-hooks/refs` an), das Subscribe-Effect hängt nur von `boardId` ab, Cleanup via `supabase.removeChannel(channel)`.
- `board-lists.tsx`s `handleRealtimeUpsert`: idempotentes Upsert per Card-ID über alle Listen hinweg, übernimmt vorhandene `labelIds` von der lokal bekannten Card (die `cards`-Tabelle kennt keine Labels, ein Realtime-Payload würde sie sonst verlieren).
- **DELETE-Events sind bei Postgres Changes nicht spaltenfilterbar UND nicht RLS-geschützt** (dokumentierte Supabase-Einschränkung, in der Spec bereits antizipiert). Statt eines echten Tombstone-Datensatzes: leichtgewichtiges Supabase-Realtime-**Broadcast** über denselben Board-Channel (`broadcastDelete(cardId)`, kein DB-Trigger, reines Client-zu-Client-Signal, enthält nur die Card-ID). Eigene Broadcasts werden nicht an den Sender zurückgespiegelt (`self: false` ist Default).
- **Codex-Review (gpt-5.6-sol, high, zwei Runden):**
  - **Blocker behoben: Cross-Tab-Delete fehlte komplett.** Die ursprüngliche „Bereits entschieden"-Formulierung der Spec (DELETE bleibt rein lokal-optimistisch in der löschenden Session) widersprach der eigenen Akzeptanzkriterium 3 („Card in Tab A löschen entfernt sie auch in Tab B"). Nach Abwägung der beiden von der Spec selbst genannten Optionen („optimistisch **oder** Tombstone-Pattern") wurde das Tombstone-Pattern über Broadcast umgesetzt, da eine echte Cross-Device-Sync für den Solo-User-Anwendungsfall (siehe Architektur-Entscheidung: „Realtime-Sync zwischen Geräten") den tatsächlichen Produktnutzen besser trifft als eine rein lokale Lösung. Zweite Codex-Runde bestätigt: Happy-Path-Fix funktioniert zuverlässig.
  - **Bewusst akzeptiert (Backlog, von Codex als Warning/Risiko eingestuft, kein Blocker):** (1) Broadcast ist flüchtig ohne Zustellgarantie — eine kurz getrennte Session verpasst das Signal dauerhaft bis zur nächsten Revalidierung; (2) Broadcast-Channels sind nicht RLS-geschützt — wer Board- und Card-UUID kennt, könnte theoretisch ein gefälschtes Delete-Signal senden (keine Datenexposition, nur kosmetische, selbstheilende Desynchronisation); (3) keine strikte Ordering-Garantie zwischen `postgres_changes`- und `broadcast`-Events. Alle drei für eine Solo-User-App mit zufälligen UUIDs als akzeptables Risiko bewertet, vollständige Lösung (Supabase Realtime Authorization/Private Channels oder echte Tombstone-Spalte) in `backlog.md` dokumentiert.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** zwei echte Tabs (Insert/Update/Move/Delete), Board-Wechsel-Cleanup über den Netzwerk-Tab, Cross-User-Isolation, absichtlich verzögerte/offline Sessions.
