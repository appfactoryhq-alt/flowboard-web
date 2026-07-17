# Implementierungsplan — Flow Board

Solo-User-Kanban-App (Web plus Native, siehe `Architektur-EntscheidungFlowBoard.md`). Reihenfolge folgt Abhängigkeiten: Schema/RLS und Auth zuerst (jede weitere Spec braucht beides), danach Layout, dann CRUD-Schicht (Boards → Lists → Cards) in der Reihenfolge, in der die Entitäten aufeinander aufbauen, danach DnD/Detail/Labels als Kern-Kanban-Abschluss (MVP 1). MVP+ (Smart-Views, Realtime, AI, Landingpage) folgt danach.

## Arbeitspakete

| # | Spec | Status |
|---|---|---|
| 01 | Schema + RLS | fertig |
| 02 | Auth | fertig |
| 03 | Base-Layout | fertig |
| 04 | Boards-CRUD | fertig |
| 05 | Lists-CRUD | fertig |
| 06 | Cards-CRUD (Quick-Add) | fertig |
| 07 | Cards-DnD (Cross-List) | fertig |
| 08 | Card-Detail-Modal | fertig |
| 09 | Labels + Priority | fertig |
| 10 | Smart-View Heute | fertig |
| 11 | Focus-Mode | fertig |
| 12 | Full-Text Search | fertig |
| 13 | Realtime-Sync | offen |
| 14 | Smart-Card-Generation | offen |
| 15 | Auto-Categorize | offen |
| 16 | Marketing-Landingpage | offen |

Details je Spec: `specs/NN-<feature>.md`. Plattform-Entscheidungen: `Architektur-EntscheidungFlowBoard.md`.
