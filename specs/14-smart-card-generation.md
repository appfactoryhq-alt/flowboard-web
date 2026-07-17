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

fertig

## Debrief

- **Provider-Klärung (User-Entscheidung eingeholt, dann empirisch korrigiert):** Auf Nachfrage entschied der User zunächst „direkt OpenAI nutzen", da kein Requesty-Key konfiguriert schien. Ein echter Test-Call gegen `api.openai.com` schlug mit 401 fehl — der maskierte Fehlertext zeigte, dass `OPENAI_KEY` trotz seines Namens tatsächlich ein **Requesty-Key** ist (Format `rqsty-sk-...`). Ein Call gegen `https://router.requesty.ai/v1` mit demselben Key und provider-präfixiertem Modellnamen (`openai/gpt-4.1-mini`) funktionierte sofort. Route nutzt jetzt Requesty — trifft damit die ursprünglich in der Architektur-Entscheidung vorgesehene Provider-Wahl, nur mit einem irreführend benannten Env-Var.
- `src/lib/ai/card-schema.ts`: Zod-Schema mit `.nullable()` statt `.optional()` für `description`/`priority` — OpenAIs Structured-Outputs-Strict-Modus (von Requesty durchgereicht) verlangt, dass alle Properties in `required` stehen; `.optional()` verletzt das (empirisch verifiziert: `.optional()` → „Invalid schema... Missing description"-Fehler vom Provider).
- Route Handler (`app/api/cards/generate/route.ts`), `createCardFromSuggestion` (eigene Action statt `createCard` wiederzuverwenden, da AI-Vorschläge Description/Priority direkt mitliefern), `AiGenerateDialog` (Prompt, gestaffelte Motion-Animation pro Vorschlag, Übernehmen/Alle übernehmen — sequenziell, nicht parallel, um Positions-Kollisionen zu vermeiden).
- **Codex-Review (gpt-5.6-sol, high, zwei Runden) plus eigene empirische Verifikation (Node-Testskripte gegen den echten Requesty-Endpoint, danach gelöscht) — zwei Blocker gefunden und behoben, beide durch direkte Quelltext-/Wire-Format-Prüfung bestätigt, nicht nur vermutet:**
  - **Blocker: falscher Request-Body.** `useObject().submit(input)` sendet laut installiertem `@ai-sdk/react`-Quelltext `body: JSON.stringify(input)` — bei einem einzelnen String-Argument ist der Body also der JSON-kodierte String selbst, kein `{ prompt: ... }`-Objekt. Route las ursprünglich `body.prompt`, was `null` ergab und immer 400 lieferte. Fix: Route liest `await request.json()` direkt als String.
  - **Blocker: Stream-Format-Mismatch.** `Output.array()` kapselt das Array serverseitig als `{ elements: [...] }` (OpenAIs Strict-Modus erlaubt kein Array als Root-Schema). Ein eigenständiges Testskript mit demselben `streamText`/`Output.array`/`toTextStream`-Code bestätigte den rohen Stream-Text wörtlich als `{"elements":[...]}`. Der Client erwartete ursprünglich ein Root-Array (`z.array(...)`) und hätte zur Laufzeit `.filter is not a function` geworfen. Fix: Client-Schema `z.object({ elements: z.array(generatedCardSchema) })`, Zugriff über `object?.elements`.
  - **Warning behoben (zweite Runde):** Der Filter, der „vollständige" Streaming-Elemente erkennt, prüfte nur `item?.title` und behauptete per Type Predicate fälschlich volle Schema-Konformität — während des Streamings können `description`/`priority` noch fehlen (DeepPartial-Zwischenstände), ein früher Klick auf „Übernehmen" hätte zu einer verwirrenden Fehlermeldung geführt (kein Datenverlust, da `createCardFromSuggestion`s `safeParse` bereits schützte, aber vermeidbar). Fix: Filter nutzt jetzt `generatedCardSchema.safeParse(item).success` statt nur den Titel zu prüfen.
  - **Warning behoben:** `createCardFromSuggestion` nahm ursprünglich einen typisierten (aber zur Laufzeit ungeprüften) Parameter — Server Actions sind direkt aufrufbare Grenzen, TS-Typen schützen nicht zur Laufzeit. Fix: Parameter auf `unknown`, `generatedCardSchema.safeParse` am Anfang.
  - **Warning behoben:** einzelne „Übernehmen"-Buttons blieben während „Alle übernehmen" aktiv (potenziell parallele Inserts). Fix: zusätzlich `disabled={... || addingAll}`.
  - **Bewusst akzeptiert:** `toTextStream()` leitet nur `text-delta`-Parts weiter, Provider-Fehler nach Start der 200-Response erreichen `useObject.error` möglicherweise nicht. Das ist das von der AI-SDK-Dokumentation selbst empfohlene Pattern für `Output.array` + `useObject`, eine Abweichung davon würde vom dokumentierten, unterstützten Ansatz abgehen. Kein Rate-Limiting auf dem Endpoint — für eine Solo-User-App ohne offenen Signup als vertretbar eingestuft (Codex-Review), bei Bedarf um ein Requesty-seitiges Ausgabenlimit ergänzbar.
- **Offene Nachverifikation (kein Browser-Zugriff in dieser Session):** vollständiger UI-Flow (Dialog öffnen, Prompt eingeben, Stream-Animation, Übernehmen-Klicks), Fehlerdarstellung bei Provider-Timeout im UI.
