# Backlog

Offene Ideen und bewusst verschobene Arbeit, außerhalb der 16 MVP/MVP+ Specs.

- **`createList`-Race-Condition (Spec 05):** `select max(position)` + `insert` laufen ohne Lock/RPC in zwei Schritten. Bei zwei parallelen Requests (z. B. zwei Tabs) können beide dieselbe Position erhalten. Für Solo-User-MVP bewusst akzeptiert (Codex-Review), bei Bedarf via RPC mit `select for update` oder Unique-Constraint-Retry lösen.
