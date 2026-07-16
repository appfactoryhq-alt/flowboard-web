# 01 — Schema + RLS

## Ziel

Postgres-Schema für Boards/Lists/Cards/Labels mit Row Level Security, sodass jeder User ausschließlich seine eigenen Daten lesen und schreiben kann. Fundament für alle folgenden Specs (Web und später Native greifen auf dieselbe DB zu).

## Abhängigkeiten

- Keine (erste Spec).

## Out of Scope

- Auth-Flow selbst (Spec 02).
- Realtime-Publication für `cards` (Spec 13) — Schema ist dafür vorbereitet (denormalisierte `user_id`, `board_id` für Filterung), Publication wird aber erst in Spec 13 aktiviert.
- DnD-Mutations-RPC `move_card` (Spec 07) — Schema stellt `position` (float8) bereit, die RPC-Logik folgt separat.
- UI (Spec 03+).

## Bereits entschiedene Punkte (nicht mehr offen)

- **Position-Modell:** Fractional Ranking (`float8`). Neue Position = Mittelwert der Nachbar-Positionen, kein Reindex nötig.
- **Label-Farben:** Preset-Liste (9 Farben) als Check-Constraint, kein freier Color-Picker.
- **Focus-Mode-Maximum:** 3 Cards fix, durchgesetzt via Partial Unique Index auf `(user_id, focus_slot)`.
- **Timezone-Handling:** In `profiles.timezone`, spätere Views (Spec 10, "Heute") filtern mit `current_date at time zone <user-tz>`.

## Tabellen

### `profiles`
Erweitert `auth.users` 1:1, automatisch befüllt via Trigger bei Sign-Up.

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | uuid | PK, references `auth.users(id)` on delete cascade |
| `timezone` | text | not null, default `'UTC'` |
| `created_at` | timestamptz | not null, default `now()` |

### `boards`

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | not null, default `auth.uid()`, references `auth.users(id)` on delete cascade |
| `name` | text | not null, `char_length(name) between 1 and 100` |
| `created_at` | timestamptz | not null, default `now()` |
| `updated_at` | timestamptz | not null, default `now()`, via Trigger |

### `lists`

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `board_id` | uuid | not null, references `boards(id)` on delete cascade |
| `user_id` | uuid | not null, default `auth.uid()` — denormalisiert für RLS-Performance + Realtime-Filter |
| `name` | text | not null, `char_length(name) between 1 and 60` |
| `position` | float8 | not null |
| `created_at` / `updated_at` | timestamptz | wie oben |

### `cards`

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `list_id` | uuid | not null, references `lists(id)` on delete cascade |
| `board_id` | uuid | not null, references `boards(id)` on delete cascade — denormalisiert |
| `user_id` | uuid | not null, default `auth.uid()` — denormalisiert |
| `title` | text | not null, `char_length(title) between 1 and 200` |
| `description` | text | nullable |
| `due_date` | date | nullable |
| `priority` | text | not null, default `'med'`, check in `('low','med','high')` |
| `position` | float8 | not null |
| `focus_slot` | smallint | nullable, check `between 1 and 3` |
| `created_at` / `updated_at` | timestamptz | wie oben |

### `labels`

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `board_id` | uuid | not null, references `boards(id)` on delete cascade |
| `user_id` | uuid | not null, default `auth.uid()` |
| `name` | text | not null, `char_length(name) between 1 and 40` |
| `color` | text | not null, check in Preset-Liste (9 Werte: gray/red/orange/amber/green/cyan/blue/purple/pink) |
| `created_at` | timestamptz | not null, default `now()` |
| — | — | unique `(board_id, name)` |

### `card_labels` (Junction)

| Spalte | Typ | Constraint |
|---|---|---|
| `card_id` | uuid | not null, references `cards(id)` on delete cascade |
| `label_id` | uuid | not null, references `labels(id)` on delete cascade |
| `user_id` | uuid | not null, default `auth.uid()` |
| — | — | PK `(card_id, label_id)` |

## RLS-Strategie

- RLS auf allen 6 Tabellen aktiv, keine Policy für `anon` — nur `authenticated`.
- `profiles`: `select`/`update` nur eigene Zeile (`id = auth.uid()`), kein `insert`/`delete` durch Client (läuft über Trigger).
- `boards`: alle Operationen `using`/`with check (user_id = auth.uid())`.
- `lists`/`cards`/`labels`/`card_labels`: `select`/`delete` prüfen nur `user_id = auth.uid()` (schnell, kein Join). `insert`/`update` prüfen zusätzlich per `exists`-Subquery, dass die referenzierte Parent-Ressource (Board/List/Card/Label) tatsächlich dem User gehört — verhindert, dass ein User eine fremde `board_id`/`list_id`/`card_id`/`label_id` verknüpft (IDOR-Schutz trotz denormalisierter `user_id`).
- Alle `user_id`-Spalten `default auth.uid()`, Client muss sie nicht mitschicken — `with check` verhindert Spoofing trotzdem.

## Akzeptanzkriterien

1. Migration läuft ohne Fehler durch (`apply_migration` via Supabase MCP).
2. `get_advisors(type: security)` zeigt keine offenen Blocker (RLS aktiv auf allen 6 Tabellen, keine fehlenden Policies).
3. Mit User A eingeloggt: `select` auf `boards`/`lists`/`cards`/`labels` liefert ausschließlich Zeilen mit `user_id = A`.
4. Mit User A eingeloggt: `insert` einer `list` mit `board_id` von User B schlägt fehl (RLS-Block).
5. Partial Unique Index verhindert einen vierten `focus_slot`-Eintrag pro User (Constraint-Violation bei Versuch).
6. Sign-Up eines neuen Users erzeugt automatisch eine `profiles`-Zeile (Trigger `handle_new_user`).
7. `updated_at` wird bei `update` auf `boards`/`lists`/`cards` automatisch aktualisiert (Trigger).

## Tasks

1. Migration schreiben: Tabellen, Constraints, Indizes.
2. Trigger-Funktionen: `set_updated_at()`, `handle_new_user()` (beide `security definer` wo nötig, `set search_path = ''`).
3. RLS aktivieren + Policies je Tabelle (select/insert/update/delete getrennt für lists/cards/labels/card_labels).
4. Grants: `authenticated` bekommt select/insert/update/delete, `anon` explizit revoked.
5. `get_advisors` (security + performance) prüfen, Findings beheben.
6. Manuelle Stichprobe über Supabase MCP `execute_sql` (Cross-User-Insert-Versuch simulieren, sofern über SQL-Editor als Rolle `authenticated` möglich, sonst Verifikation zurückgestellt auf Spec 02/04, sobald echte Sessions existieren).

## Validation

- `get_advisors(security)` — keine Blocker.
- `list_tables(verbose: true)` — Spalten/FKs wie oben spezifiziert.
- Typecheck/Lint: nicht relevant (reine DB-Migration, kein App-Code in dieser Spec).

## Relevante Rules

- `rules/tech-stack.md` — Supabase Postgres + RLS.
- `rules/code-conventions.md` — Mutationslogik-Regel (spätere RPCs).

## Status

fertig

## Debrief

- Schema mit 6 Tabellen via Supabase MCP `apply_migration` angewendet: `flow_board_schema_rls` (Basis), `flow_board_schema_rls_hardening` (Advisor-Fixes: `handle_new_user()`-EXECUTE-Revoke, fehlender Index auf `card_labels.user_id`), `flow_board_revoke_public_execute` (PUBLIC-Grant war die eigentliche Quelle des Advisor-Findings, nicht nur `anon`/`authenticated`).
- Codex-Review deckte einen echten Bug in einer ersten Härtungsmigration auf: `l.board_id = board_id` wurde durch SQL-Scoping fälschlich zu `l.board_id = l.board_id` aufgelöst (immer wahr), weil `lists` selbst eine `board_id`-Spalte hat — unqualifizierte Spaltennamen in RLS-Subqueries binden an die nächstliegende Tabelle, nicht an die äußere. Fix: explizite Qualifizierung (`cards.board_id`). Per `SET LOCAL ROLE authenticated` plus simulierten JWT-Claims empirisch verifiziert (Cross-Board-Insert schlägt fehl, valide Inserts funktionieren).
- `cards`/`card_labels` INSERT/UPDATE-Policies erzwingen zusätzlich zur User-Ownership, dass `list_id`/`board_id` beziehungsweise `card_id`/`label_id` tatsächlich zum selben Board gehören (IDOR- und Datenintegritäts-Schutz, siehe Learnings).
- `get_advisors(security)` sauber (0 Findings) nach allen drei Migrationen.
