# Learnings

Stolpersteine und Erkenntnisse aus dem Build, damit sie nicht zweimal passieren.

## Phase A

- **`proxy.ts` bei `src/`-Layout gehört unter `src/`, nicht ins Repo-Root.** Next.js 16 sucht `proxy.ts` (wie zuvor `middleware.ts`) im selben Verzeichnis wie `app/` — bei `src/app/` also `src/proxy.ts`. Eine Root-`proxy.ts` wird ohne Fehlermeldung einfach nie geladen (stiller No-Op), der Redirect-Schutz greift dann nicht. Nach dem Verschieben zusätzlich Turbopack-Cache-Inkonsistenz beobachtet (`.next` löschen, Dev-Server sauber neu starten).
- **Unqualifizierte Spaltennamen in RLS-`exists`-Subqueries binden an die nächstliegende Tabelle, nicht an die äußere.** `l.board_id = board_id` in einer Subquery über `lists l` wurde zu `l.board_id = l.board_id` (immer wahr), weil `lists` selbst eine `board_id`-Spalte hat — gemeint war `cards.board_id`. Bei RLS-Policies mit Parent-Tabellen, die gleichnamige Spalten wie die äußere Tabelle haben, immer explizit qualifizieren (`cards.board_id` statt `board_id`). Durch Codex-Review-Hinweis plus empirischen Test (`SET LOCAL ROLE authenticated` + simulierte JWT-Claims) gefunden — reines Lesen des SQL hätte den Bug nicht zuverlässig aufgedeckt, `pg_policies` zeigt das kompilierte (fehlerhafte) Prädikat aber klar.
- **Kickoff-Prompt-Annahme "Confirm-Email ist im Dev deaktiviert" traf auf dem tatsächlichen Supabase-Projekt nicht zu.** Vor dem Bauen von Auth-Flows lieber einmal empirisch prüfen statt der Doku-Annahme zu vertrauen — die Robustheit gegen beide Fälle (Session vorhanden/nicht vorhanden nach `signUp()`) sollte ohnehin immer eingebaut werden.
- **`browser-use state` war in dieser Session wiederholt instabil** (Socket-Timeouts nach ca. 20s), während `open`/`input`/`click` zuverlässig liefen. Bei Timeouts: dev-server-Access-Log als Fallback-Verifikation nutzen (zeigt HTTP-Status und Redirect-Ziel pro Request) statt die Browser-Session wiederholt neu anzufragen.

## Phase 0

- `create-next-app` hat diesmal kein Git-Repo automatisch angelegt, obwohl Git installiert ist — `git init` wurde manuell nachgeholt.
- Package-Name musste von "Projektmanagement Tool" (Leerzeichen, Großbuchstaben, npm-inkompatibel) auf `flow-board` geändert werden — Scaffold lief in einem temporären Unterordner, Inhalt wurde danach ins Hauptverzeichnis verschoben.
- shadcn-CLI (aktuell v4.13.0) nutzt neue Flags (`-b/--base`, `-p/--preset`, `-d/--defaults`) statt der älteren `--base-color`-Option. `-d` (Defaults: Template `next`, Preset `base-nova`) war der non-interaktive Weg ohne hängenden Prompt.
