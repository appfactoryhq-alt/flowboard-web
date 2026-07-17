# 14 — Smart-Card-Generation

## Ziel

User beschreibt in Stichworten, was zu tun ist ("Umzug organisieren"), AI generiert mehrere passende Cards (Titel, optional Beschreibung/Priority) als Streaming-Vorschlag, User bestätigt Übernahme in eine Liste. Erster AI-Feature-Baustein, als Route Handler gebaut, damit die spätere Native-App denselben Endpunkt nutzen kann.

## Abhängigkeiten

- Spec 06 (Cards-CRUD) — `createCard`-Logik existiert, wird hier für die Übernahme der generierten Cards wiederverwendet (idealerweise über eine gemeinsame Server-Funktion, nicht dupliziert).

## Out of Scope

- Auto-Categorization (Spec 15, eigener Feature-Schnitt).
- Eigene Native-Implementierung (Route Handler ist bereits plattform-agnostisch, Native-Client kommt in einem späteren, separaten Repo).

## Bereits entschieden

- Route Handler `src/app/api/cards/generate/route.ts`, AI SDK 6 `streamText` mit `output: Output.array({ element: cardSchema })`.
- Client liest mit `experimental_useObject as useObject` aus `@ai-sdk/react`.
- Dependencies: `npm install ai @ai-sdk/react zod`.
- AI-Provider: Requesty (kompatibel zu OpenAI-Format, wie bereits für Spec 15 vorgesehen) — Modellwahl siehe Tasks.

## Tasks

1. Context7 MCP zuerst: aktuellen Stand des AI SDK (Version 6, `streamText`, `Output.array`, `experimental_useObject`) prüfen, API kann sich ggü. Trainingswissen geändert haben (Pflicht laut `guidelines.md`).
2. Dependencies installieren: `ai`, `@ai-sdk/react`, `zod`.
3. `.env.local`: Requesty-API-Key als Server-only-Variable (kein `NEXT_PUBLIC_`-Prefix, nie in Client-Code).
4. `src/lib/ai/card-schema.ts` — Zod-Schema für eine generierte Card (Titel Pflicht, Beschreibung optional, Priority optional mit Default).
5. `src/app/api/cards/generate/route.ts` — Route Handler: nimmt `{ prompt: string, boardId: string }`, prüft Auth serverseitig (Route Handler hat keinen automatischen RLS-Kontext wie Server Actions über Cookies, `createClient` aus `src/lib/supabase/server.ts` trotzdem nutzbar, da Cookies auch bei Route Handlern verfügbar sind), streamt Array generierter Cards via `streamText`/`Output.array`.
6. Client-Komponente (im Board-Kontext, z. B. Trigger-Button „Cards per AI generieren" neben Quick-Add): Prompt-Eingabe, `useObject` gegen den Route Handler, während des Streams erscheinen Card-Vorschläge gestaffelt (`transition={{ delay: index * 0.05 }}`, siehe `rules/design-system.md`).
7. Übernahme-Flow: pro generiertem Vorschlag ein „Übernehmen"-Button (nutzt bestehende `createCard`-Logik, landet in der Liste, aus der die Generierung gestartet wurde) plus „Alle übernehmen".
8. Fehlerfall (AI-Provider nicht erreichbar, Rate-Limit): klare Fehlermeldung statt hängendem Spinner.

## Akzeptanzkriterien

1. Prompt-Eingabe erzeugt gestreamte Card-Vorschläge, sichtbar mit Stagger-Animation während des Eintreffens.
2. „Übernehmen" auf einem Vorschlag legt eine echte Card in der Ziel-Liste an (persistiert, RLS-konform über `auth.uid()`).
3. „Alle übernehmen" legt alle generierten Cards in einem Zug an.
4. Route Handler lehnt Requests ohne gültige Session ab (kein anonymer Zugriff auf den AI-Endpunkt).
5. Fehlerfall (z. B. simulierter Provider-Timeout) zeigt Fehlermeldung, kein unbegrenzt hängender Ladezustand.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: Prompt eingeben, Stream beobachten, einzelne und alle Vorschläge übernehmen, Fehlerfall simulieren (z. B. falscher API-Key testweise).

## Relevante Rules

- `guidelines.md` — Context7-Pflicht bei AI-SDK.
- `rules/tech-stack.md` — Route Handler für geteilte/Native-fähige Endpunkte, Server Actions bleiben Web-only.
- Vision-Dokument — AI-Stream-Stagger-Timing.

## Status

offen
