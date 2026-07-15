# Code-Konventionen

## Branches

- `feat/*`, `fix/*`, `refactor/*`, `test/*`

## Imports

- Absoluter Alias `@/*` für alles unter `src/`.
- Reihenfolge: externe Packages → interne Alias-Imports → relative Imports, jeweils durch Leerzeile getrennt.

## Error-Pattern

- Server Actions und RPC-Aufrufe geben `{ data, error }` zurück, kein `throw` über die Action-Grenze hinweg.
- Client zeigt Fehler über shadcn `Toast`/`Sonner`, kein stiller Fail.

## Mutationslogik

- Mutationen mit Cross-List- oder späterem Native-Bedarf (DnD-Move, geteilte Endpunkte) als Postgres-RPC oder shared Server-Funktion, nicht inline in der Component.
