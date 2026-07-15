# prompts.md: Flow Board

Konsolidierte Sammlung aller Prompts und Setup-Commands aus dem Flow-Board-Projekt (Kanban-App mit AI-Features, Realtime, PWA). Strukturiert nach Video-Reihenfolge, copy-paste-fertig in Code-Bloecken.

**Nutzung:** Download-Asset für Teilnehmer in der Members-Area. Alle Prompts sind direkt übernehmbar und als Vorlage für eigene Projekte anpassbar.

**Stack-Abhängigkeiten:** Next.js (App Router), TypeScript strict, Tailwind v4, shadcn/ui, Motion (früher Framer Motion, aus `motion/react`), dnd-kit für Cross-List-DnD, Supabase (Email + Passwort + RLS), Vercel, npm, Requesty als AI-Gateway, Claude Code, Codex-Plugin. **Kein PWA-Layer, kein Husky.** Native-App folgt im separaten Repo mit Expo.

**MCPs im Projekt:** Supabase MCP (full-access), Context7 MCP (aktuelle Docs), **shadcn MCP** (Komponenten-Registry plus Install).

---

## Inhalt

1. [Offline-Prep Setup-Commands](#offline-prep)
2. [Kickoff-Prompt Skeleton plus Kern-Specs](#kickoff-prompt)
3. [Spec-schreiben-lassen-Prompts](#spec-prompts)
4. [AI-Feature-Prompts mit Zod-Schemas](#ai-prompts)
5. [Codex-Review-Prompt-Templates](#codex-prompts)
6. [Build-Loop-Prompts pro Feature](#build-prompts)
7. [Live-Prompts aus dem Video](#live-prompts)
8. [Design-Committment und Theme-Export](#theme)
9. [Deployment-Commands](#deploy)
10. [Native-Kickoff-Prompt (Expo)](#native-kickoff)

---

<a id="offline-prep"></a>
## 1. Offline-Prep Setup-Commands

Vor dem ersten Kickoff einmal durchlaufen.

### Supabase-Projekt anlegen

1. Login auf `https://supabase.com/dashboard/projects`
2. Neues Projekt anlegen. Name z.B. `flow-board-kurs`. **Dediziertes Projekt, nicht Prod-DB.**
3. Region nach Datenschutz wählen (für DACH: eu-central-1 Frankfurt).
4. Database-Passwort generieren, sicher ablegen.

### Email-Provider aktivieren

Im Supabase-Dashboard:

1. Auth → Providers → Email → aktivieren
2. Auth → Providers → Email → **„Confirm email" ausschalten** (Dev-Modus, damit Sign-Up ohne Bestaetigungsmail durchlaeuft)
3. Auth → URL Configuration → Site URL auf `http://localhost:3000` waehrend Dev, später auf Vercel-URL umschalten

### MCPs projekt-scoped installieren

Im zukünftigen Projekt-Ordner (nach `mkdir ~/Desktop/flow-board && cd ~/Desktop/flow-board`):

```bash
# Supabase MCP (full-access für Schema-Änderungen)
claude mcp add supabase --scope project -- npx -y @supabase/mcp-server-supabase --access-token <service-role-token>

# Context7 MCP (aktuelle Docs für Supabase plus Next-App-Router plus AI-SDK)
claude mcp add context7 --scope project -- npx -y @upstash/context7-mcp

# shadcn MCP (Komponenten-Registry plus Install via MCP statt raten)
# Wird erst nach Phase 0b Skeleton-Aufbau aktiviert, weil er auf components.json
# und src/lib/utils.ts aus shadcn init angewiesen ist.
npx shadcn@latest mcp init
```

Service-Role-Token findest du im Supabase-Dashboard unter Settings → API → `service_role` key. **Niemals in Commits oder Terminal-Output.**

**Zum shadcn MCP:** Gibt dem Agent direkten Zugriff auf die shadcn-Registry. Statt `npx shadcn@latest add button` per Bash muss er nur noch via MCP die Komponente suchen und installieren. Besonders wertvoll bei weniger bekannten Komponenten (z.B. Sonner, Resizable, Drawer), kein Raten, keine veraltete Namen. Das Setup-Command legt die MCP-Config im Projekt-Scope an.

### Browser Use CLI installieren

```bash
# Via pip
pip install browser-use-cli

# Oder pipx (isoliert)
pipx install browser-use-cli

# Test
browser-use --version
```

Bei Install-Problemen: Doku auf `https://docs.browser-use.com`.

### Requesty-Account

1. Signup auf `https://requesty.ai`
2. Email, Passwort, API-Key generieren
3. API-Key notieren für später (wird in `.env.local` gelegt)
4. Kurzer Test-Call mit Sonnet und Haiku im Requesty-Playground

### Codex-Plugin in Claude Code

1. Claude Code starten
2. Codex-Plugin über Standard-Plugin-Mechanismus installieren
3. `~/.codex/config.toml` konfigurieren:

```toml
model = "gpt-5.5"
reasoning_effort = "high"
```

4. Test-Review auf Dummy-Datei, um sicherzugehen dass Plugin antwortet

### GitHub plus Vercel

1. GitHub-Account ready (keine spezielle Config für Flow Board noetig)
2. Vercel-Account ready, `npm i -g vercel` für CLI, optional login jetzt oder im Deploy-Sub

---

<a id="kickoff-prompt"></a>
## 2. Kickoff-Prompt: Skeleton plus Kern-Specs

Der zentrale Prompt, der das Projekt von Null startet. **Einmal** in eine frische Claude-Code-Session im leeren Projektordner einwerfen.

```
Wir bauen zusammen Flow Board, eine Kanban-App für persönliches Projekt-Management. Du arbeitest im Kurskontext, Zielgruppe Einsteiger ins Agentic Coding mit Vorwissen aus einem Linktree-Projekt. Erkläre beiläufig, warum du Entscheidungen triffst, aber gehe nicht auf Basics ein die aus dem Vorprojekt bekannt sind (Kickoff-Prompt-Konzept, CLAUDE.md als Router, Build-Loop, browser-use, git-Workflow). Kein Fachjargon ohne kurze Erklärung. Antworte auf Deutsch, respektvoll, pragmatisch, lösungsorientiert. Ich-Form statt „man macht das so".

### Kontext-Datei

Lies `architektur-entscheidung.md` aus dem Workspace-Ordner. Frontend, Datenbank, Mobile-Plattform sind dort schon entschieden. Phase 2 Sparring fällt entsprechend kürzer aus, weil die großen Plattform-Fragen geklärt sind.

### Vision

Kanban-Board-App. User registriert sich mit Email plus Passwort, legt eigene Boards an, Boards haben Lists (Spalten), Lists haben Cards. Cards werden per Drag-and-Drop zwischen Lists verschoben. Cards haben Titel, Beschreibung, Due-Date, Labels, Priority. Smart-Views aggregieren Cards (Heute, Focus). Plus Marketing-Landingpage als Polish-Move.

Solo-User. Jeder hat eigene Boards. Keine Team-Kollaboration, keine Multi-User-Features, keine Assignees, keine Kommentare, keine Attachments. Reduktion ist bewusst.

Native-Awareness: später kommt eine React-Native-App auf derselben Datenbank dazu. Schema und APIs Plattform-agnostisch planen. **AI- und andere geteilte Endpunkte immer als Route Handler bauen, weil Web und Expo denselben HTTP-Endpunkt nutzen können. Server Actions bleiben Web-spezifisch.** Mutationslogik in shared Server-Funktionen oder Postgres-RPCs kapseln, damit der Native-Schnitt später nicht teuer wird.

### Tech-Stack (final entschieden, aus dem Architektur-Sparring)

- Frontend: Next.js (latest, aktueller App Router), React, TypeScript strict
- UI: Tailwind v4, shadcn/ui, Motion (früher Framer Motion, importiert aus `motion/react`), Lucide Icons
- DnD: dnd-kit für Cross-List, Motion-`Reorder` nur für Same-List
- Design-Theme: CSS-Variablen in `src/app/globals.css` werden vom User vorab bereitgestellt
- Backend in einer App: **Server Actions** für Mutationen plus CRUD; **Route Handlers** unter `app/api/.../route.ts` für Streaming und Drittsysteme
- DB plus Auth: Supabase (Postgres plus Row Level Security), Email plus Passwort
- Auth-Lib: `@supabase/ssr` (Cookies via `proxy.ts` in Next 16, in Next 15 weiter als `middleware.ts`)
- Server-Sicherheitsentscheidungen via `getClaims()` (in `proxy.ts`) oder direkt via RLS. `auth.getUser()` nur, wenn der User-Datensatz wirklich gebraucht wird. `getSession()` ist serverseitig nie als Sicherheitsentscheidung verwendbar.
- Deployment: Vercel
- Package Manager: npm
- MCPs: Supabase MCP (full-access), Context7 MCP (aktuelle Docs als Pflicht-Quelle bei Auth/Realtime/AI-SDK), shadcn MCP (Komponenten-Registry)
- Agentic Tools: Claude Code (Builder) plus Codex-Plugin (Reviewer, „Codex-nach-Spec" als Default)

### Was NICHT in den Stack gehört

- Kein PWA-Layer, kein Serwist, kein Manifest, kein Service Worker. PWA wurde im Sparring bewusst gegen Native verworfen. Mobile kommt später als eigene React-Native-App im separaten Repo.
- Kein Husky, kein Pre-Commit-Hook. Self-Validation läuft via `npm run typecheck` plus `eslint .` plus Codex-nach-Spec, nicht über Git-Hooks.
- Kein `next lint` mehr. In Next 16 entfernt, in Next 15 deprecated. Wir nutzen `eslint .` direkt.

### Budget und Kosten

Alle Free-Tiers:
- Supabase Free Tier (500 MB DB, 50.000 MAU, 2 Projekte, Email-Auth inklusive)
- Vercel Hobby (kostenlos für nicht-kommerziell)
- GitHub kostenlos
- Requesty kommt erst in der AI-Features-Spec, hier im Kern-MVP nicht nötig

### Scope, drin (MVP 1, Specs 1-9)

1. Schema plus RLS (Solo-User via `auth.uid()`)
2. Auth (Sign-Up, Sign-In, Sign-Out via Server Actions, Cookie-Refresh in `proxy.ts` mit `getClaims()`)
3. Base-Layout
4. Boards-CRUD
5. Lists-CRUD innerhalb Board
6. Cards-CRUD (inline Quick-Add am Listen-Ende, Enter erzeugt Card)
7. Cards-DnD (Cross-List via dnd-kit, persistiert via atomare Postgres-RPC `move_card`)
8. Card-Detail-Modal (shadcn Dialog plus Motion `layoutId` für Shared-Layout-Transition)
9. Labels plus Priority

### Scope, drin (MVP+, Specs 10-16)

10. Smart-View Heute (SQL-View `today_cards` mit `with (security_invoker = true)`, Filter in User-Timezone, nicht in `current_date` direkt)
11. Focus-Mode (max 3 Slots pro User: Spalte `focus_slot smallint check (focus_slot between 1 and 3)`, `unique (user_id, focus_slot) where is_focus_active = true`. Drei Slots fix begrenzt durch das Schema, nicht durch App-Logik.)
12. Full-Text Search (Postgres `tsvector` als generated column, GIN-Index, Server Action mit `websearch_to_tsquery('german', $1)`)
13. Realtime-Sync (Postgres Changes mit Filter `board_id=eq.${boardId}`, Cleanup via `supabase.removeChannel(channel)`, Idempotenz per Card-ID-Upsert wegen Echo des eigenen Inserts. **Wichtig:** DELETE-Events bei Postgres Changes sind nicht spaltenfilterbar, deshalb DELETE im Client lokal-optimistisch handhaben oder Tombstone-Pattern.)
14. Smart-Card-Generation (Route Handler `app/api/cards/generate/route.ts` mit AI SDK 6 `streamText` plus `output: Output.array({ element: cardSchema })`. Client liest mit `experimental_useObject as useObject` aus `@ai-sdk/react`. Dependencies: `npm install ai @ai-sdk/react zod`.)
15. Auto-Categorization (Server Action mit Haiku via Requesty, Vorschlag mit `card_id` plus `card_updated_at`-Snapshot speichern, Apply via RPC mit Version-Check)
16. Marketing-Landingpage (öffentliche Route `/`, Hero plus Feature-Cards. Proxy-Redirect nur für `/` bei eingeloggten Usern auf `/board`. Auth-Routen `/login`, `/signup` und statische Assets explizit von der Redirect-Logik ausschließen, damit kein Loop entsteht.)

### Scope, bewusst draußen

- OAuth-Provider, Magic Link
- Multi-User, Team-Kollaboration, Sharing, Assignees, Kommentare, Attachments, Checklisten
- Activity-Feed, Audit-Log, Email-Notifications
- Custom Board-Backgrounds, Voice-Input, Kalender-Integration, Mehrsprachigkeit
- PWA, Service Worker, Install-Button (siehe „Was NICHT in den Stack gehört")

### Design-Anforderungen

UI muss hochwertig wirken, nicht Default-shadcn:
- Dark Mode default
- Keine flachen Farben, immer Gradients plus Layering
- Keine harten `#000` / `#fff`, abgestufte Neutrals
- Hover- plus Focus-State auf jedem interaktiven Element
- Smooth Transitions (min 150ms ease-out)
- `--radius: 1rem` als Default, keine rechteckigen Cards
- Weiche, mehrschichtige Shadows
- `100dvh` statt `100vh` für Full-Height-Elemente

Ziel-Niveau visuell: Linear, Bento.me, Cal.com, Raycast, Arc Browser. Nicht: Default-shadcn-Demo, generische Kanban-Clones.

### Animations-Strategie (Motion)

- Layout-Animation bei Card-DnD (Cards weichen smooth aus)
- Shared-Layout-Transition zwischen Card-in-Liste und Card-Detail-Modal via `layoutId`
- Smart-View-Wechsel mit Cross-Fade
- Stagger im AI-Stream: pro fertig eingetroffener Card 50ms Delay (`transition={{ delay: index * 0.05 }}`)
- `@media (prefers-reduced-motion: reduce)` respektieren

### Git und Self-Validation

- `git init` ist bereits durch `create-next-app` passiert
- Ein einziger Skeleton-Commit am Ende von Phase 0b via `git add -A && git commit --amend --no-edit`
- Branch-Convention in `rules/code-conventions.md`: `feat/*`, `fix/*`, `refactor/*`, `test/*`
- Self-Validation-Scripts: `typecheck` (`tsc --noEmit`), `lint` (`eslint .`). Kein Husky, kein Pre-Commit-Hook. Codex-nach-Spec deckt Validation pro Spec ab.

### Workflow-Erwartung

0. Projekt-Skeleton aufsetzen, STOP nach Phase 0, warten auf „weiter".
1. Discovery: 2 parallele Sub-Agents (Supabase SSR Auth aktueller Stand, DnD-Position-Handling für Cross-List). Findings konsolidiert in `references/discovery.md`.
2. Sparring: eine Runde, max 3 Fragen, weil Plattform-Fragen aus `architektur-entscheidung.md` schon geklärt sind.
3. Output erzeugen: `implementierungsplan.md` plus nummerierte Feature-Specs `specs/NN-<feature>.md`.

### Dein Auftrag jetzt

Preflight Phase 0, zuerst prüfen, STOP wenn etwas fehlt:
- [ ] Aktuelles Verzeichnis ist leer (`ls` zeigt keine Projektdateien)
- [ ] Node.js 20.9 oder höher (`node -v`)
- [ ] Claude Code hat Write-Zugriff im Verzeichnis
- [ ] `architektur-entscheidung.md` im Workspace-Ordner gelesen

Supabase und MCPs werden vor Phase 1 geprüft. browser-use CLI wird im Build-Loop gebraucht. Wenn Preflight grün: bestätige und starte Phase 0. Sonst STOP plus Feedback.

Sicherheits-Hinweis für die ganze Session: keine Tokens, API-Keys, Service-Role-Keys oder `.env.local`-Inhalte im Terminal-Output anzeigen oder in Code-Blöcke schreiben.

#### Phase 0a, Next.js-Projekt initialisieren

`npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --use-npm --import-alias "@/*" --yes`

Direkt danach in einer separaten Shell-Session: `npm run dev` starten, HTTP 200 auf `http://localhost:3000` prüfen, dann den Prozess wieder beenden. Nicht im Foreground laufen lassen, sonst blockiert er den Workflow.

WICHTIG nach 0a:
- `create-next-app` hat eine eigene `README.md` erstellt, wird in 0b überschrieben.
- `create-next-app` hat ein lokales Git-Repo plus ersten Commit (`Initial commit from Create Next App`) angelegt. **Erster eigener Commit nach 0b** mit `git add -A && git commit -m "chore: scaffold flow board"`. (`--amend` würde nur den `create-next-app`-Commit umschreiben, was Phase-0-Spuren glättet, aber nicht zwingend ist.)
- `create-next-app` hat eine `.gitignore` erstellt, ergänze `.env.local` falls nicht drin.
- In aktuellen Versionen von `create-next-app` taucht oft eine `AGENTS.md` plus erste `CLAUDE.md` auf. Beide werden in 0b mit unseren Inhalten überschrieben.

#### Phase 0b, Dokumentations-Skeleton plus Tooling

CLAUDE.md als Router (unter 50 Zeilen, Verweise auf `rules/`, `specs/`, Root-Logs).

`rules/`-Verzeichnis:
- `design-system.md` (Tokens aus `globals.css`, Animations-Regeln)
- `code-conventions.md` (Branch-Names, Import-Order, Error-Pattern)
- `verification.md` (Self-Validation, Codex-Review-Pflicht pro Spec)
- `tech-stack.md` (Pflicht-Use von Context7 MCP bei Auth/Realtime/AI-SDK, Library-Versionen, was nicht zum Stack gehört)
- `codex-review.md` (wiederverwendbares Review-Template: Spec-Bezug, geänderte Dateien, Prüf-Fokus, Severity-Level (Blocker/Warning/Nit), Test-Bezug, Findings-Format. Macht das Codex-nach-Spec-Ritual reproduzierbar.)

`guidelines.md`, `specs/README.md`, Root-Logs (`implementierungsplan.md`, `backlog.md`, `changelog.md`, `learning.md`).

shadcn-Init in 0b:
- `npx shadcn@latest init` mit npm plus Tailwind-v4-Defaults
- Legt `components.json` plus `src/lib/utils.ts` an

Theme-Variablen:
- Falls CSS-Variablen mitgegeben (`globals.css`-Snippet vom User): in `src/app/globals.css` einsetzen
- Falls nicht: Platzhalter-Block mit Kommentar

Self-Validation-Scripts in `package.json`:
- `"typecheck": "tsc --noEmit"`
- `"lint": "eslint ."`

Commit-Abschluss am Ende von 0b:
`git add -A && git commit -m "chore: scaffold flow board"`. Phase 0 endet mit einem einzigen sauberen Skeleton-Commit.

Nach Phase 0: STOP. Bestätige dass Skeleton steht. Warte auf „weiter".

---

#### Preflight Phase 1, wenn User „weiter" sagt

- [ ] Supabase-Projekt existiert, dediziert für Kurs-Projekt
- [ ] Email-Provider aktiviert, Confirm-Email für Dev aus
- [ ] Auth → URL Configuration → Site URL auf `http://localhost:3000` während Dev
- [ ] Supabase MCP konfiguriert (`--scope project`, full-access)
- [ ] Context7 MCP konfiguriert (`--scope project`)
- [ ] browser-use CLI installiert (`browser-use --version`)

Wenn der Email-Provider noch nicht aktiv ist, aktiviere ihn jetzt im Supabase-Dashboard. Confirm-Email für Dev ausschalten, damit Sign-Up ohne Bestätigungsmail durchläuft.

#### Phase 1, Discovery (2 Sub-Agents parallel)

1. Starte 2 Sub-Agents parallel.
2. Jeder Sub-Agent gibt Findings-Report an dich zurück (schreibt nicht selbst in Dateien).
3. Konsolidiere Reports in `references/discovery.md`.

Themen:
- Supabase SSR Auth plus RLS plus **Realtime-Eigenheiten** für aktuellen Next-App-Router. `@supabase/ssr`, `proxy.ts` (Next 16) bzw. `middleware.ts` (Next 15) mit `getClaims()`, Cookie-Handling, Server Actions für Sign-Up/Sign-In/Sign-Out, RLS-Policies mit `auth.uid()`. Plus: Realtime-Publication aktivieren für `cards`, plus DELETE-Event-Einschränkungen bei Postgres Changes (DELETE ist nicht spaltenfilterbar). **Pflicht: Context7 MCP für aktuelle Docs.**
- DnD-Position-Handling für Kanban. dnd-kit für Cross-List, Motion-`Reorder` für Same-List. Position-Modelle: Integer Reindex mit Gaps vs Fractional Ranking. Mutationen laufen in jedem Fall via atomare Postgres-RPC `move_card` (Transaktionshülle), die Frage ist nur das Positionsmodell.

#### Phase 2, Sparring (max 3 Fragen)

Genau eine Runde, maximal 3 Fragen. Plattform-Fragen sind aus `architektur-entscheidung.md` geklärt, hier nur Detail-Tuning:
- DnD-Position-Modell: Fractional Ranking oder Integer-Gaps mit Reindex? (Mutation läuft in beiden Fällen via atomare RPC `move_card`.)
- Label-Farben: Preset-Liste oder freier Color-Picker pro Board?
- Quick-Add-UX: Card nach Enter sofort speichern und Input-Feld leeren für die nächste Card, oder erst nach explizitem Button-Klick speichern?

Bereits entschieden, NICHT als Sparring-Frage stellen:
- Focus-Mode-Maximum: 3 Cards fix, durchgesetzt via Partial Unique Index
- Timezone-Handling: im User-Profile, View filtert mit `current_date at time zone <user-tz>`
- Drei Plattform-Achsen: aus `architektur-entscheidung.md`

#### Phase 3, Output

- `implementierungsplan.md` mit Projektbeschreibung, Arbeitspaket-Tabelle (Status offen / in Arbeit / fertig), Reihenfolge-Begründung
- 16 Feature-Specs in `specs/NN-<feature>.md` nach Abhängigkeits-Reihenfolge:

MVP 1 (Specs 1-9):
1. `01-schema-rls.md`
2. `02-auth.md`
3. `03-layout.md`
4. `04-boards.md`
5. `05-lists.md`
6. `06-cards.md`
7. `07-dnd.md`
8. `08-card-detail.md`
9. `09-labels-priority.md`

MVP+ (Specs 10-16):
10. `10-smart-view-heute.md`
11. `11-focus-mode.md`
12. `12-fts.md`
13. `13-realtime-sync.md`
14. `14-smart-card-generation.md`
15. `15-auto-categorize.md`
16. `16-marketing-landingpage.md`

### Kommunikation

- Antworte auf Deutsch.
- Stil: respektvoll, pragmatisch, lösungsorientiert (RPL).
- Ich-Form: „ich würde hier...", „ich nehme...", nicht „man macht...".
- Maximal 1 Begründungssatz pro Entscheidung.
- Pro Block: 1 Satz Ankündigung vor der Ausführung, danach nur Status plus Fehler.
- Bei Auth, Realtime und AI-SDK: Pflicht Context7 MCP nutzen für aktuelle Docs.
- Sicherheit: `.env`-Inhalte nicht ausgeben. Supabase-, Requesty-, Anthropic-Keys nie printen, nur Variablennamen oder maskierte Präfixe. Service-Role-Key nie in Client-Code, nie in Logs.
```

---

<a id="spec-prompts"></a>
## 3. Spec-schreiben-lassen-Prompts

Der Agent schreibt neue Feature-Specs selbst, dann baut er sie. Ab AI-Features-Sub durchgaengig.

### AI-Features-Specs anstossen im AI-Features-Schritt

```
Basierend auf dem aktuellen Projekt schreibe zwei neue Feature-Specs: `specs/14-smart-card-generation.md` und `specs/15-auto-categorization.md`. Details liegen in `docs/ai-features.md`, die Struktur ist wie die anderen Specs.

Pro Spec bitte:
- Ziel (1-2 Saetze)
- Abhaengigkeiten zu anderen Specs
- Out of Scope
- Konkrete Akzeptanzkriterien (testbar)
- Tasks (Schritte)
- Zod-Schemas inline dokumentiert
- Eval-Plan (10 Test-Inputs, Pass-Fail-Kriterien)
- Validation (browser-use --headed plus Supabase Dashboard plus Typecheck)
- Relevante Rules (Verweis auf rules/*.md)
- Status: offen
- Debrief-Sektion (wird nach Build gefuellt)

Nach Erstellung kurz bestaetigen und auf Build-Start warten.
```

### Realtime-Spec anstossen im Realtime-Schritt

```
Schreibe `specs/16-realtime-sync.md`. Supabase Realtime Channel auf `boards:{user_id}`. Client abonniert Postgres Changes beim Board-Mount, State wird optimistisch updatet. Cleanup bei Unmount.

Struktur wie die anderen Specs. Besonders wichtig:
- Akzeptanzkriterien (Latenz unter 500ms, RLS greift, Cleanup beim Unmount, funktioniert Cross-Device)
- Tasks (Hook `useBoardRealtime`, Change-Handler mit INSERT/UPDATE/DELETE, Cleanup, State-Update-Logik)
- Validation (zwei Browser-Tabs oder Desktop plus iPhone, Card-Create und DnD testen)
- Test-Plan (Memory-Leak-Check beim Wechsel zwischen Boards)

Nach Erstellung bestaetigen.
```

### Install-Button-Spec (beim Native-Setup-Sub)

```
Schreibe `specs/17-pwa-install-button.md`. Install-Button-Komponente mit Platform-Detection (Android: `beforeinstallprompt`-Event, iOS: Fallback-Modal mit Anleitung, Standalone-Mode: Button unsichtbar).

Struktur wie die anderen Specs. Besondere Punkte:
- iOS hat KEIN beforeinstallprompt-Event, Fallback-Modal mit Step-by-Step-Anleitung
- Standalone-Detection via window.matchMedia('(display-mode: standalone)').matches
- Komponenten-Pfad: src/components/pwa/install-button.tsx
- Tests: funktioniert auf Android (Prompt-Dialog), iOS Safari (Fallback-Modal), Standalone-Mode (unsichtbar)
```

---

<a id="ai-prompts"></a>
## 4. AI-Feature-Prompts mit Zod-Schemas

### Smart Card Generation: System-Prompt

Wird in `src/lib/ai/smart-card-gen.ts` als System-Prompt gegen Sonnet 4.6 via Requesty verwendet.

```
Du bist ein Kanban-Projekt-Planer. Der User beschreibt ein Projekt, du generierst 10 bis 20 konkrete Cards dafür.

Jede Card braucht:
- title: pragnant, max 80 Zeichen, aktiv formuliert (Infinitiv, nicht Partizip)
- description: 1-2 Saetze, konkret was zu tun ist, optional leer
- priority: low/med/high basierend auf Wichtigkeit für Projekt-Erfolg
- position: Float zwischen 0 und 1, aufsteigend sortiert nach Bearbeitungsreihenfolge

Vermeide Duplikate (mindestens Levenshtein-Distance 3 zwischen Titeln). Verteile Prioritaeten realistisch: nicht alle high, nicht alle low. Typischerweise 20 Prozent high, 50 Prozent med, 30 Prozent low.

Antworte in der User-Sprache (Deutsch).

User-Prompt:
{user_prompt}

Board-Kontext (falls vorhanden):
{board_context}
```

### Smart Card Generation: Zod-Schema

```typescript
import { z } from 'zod';

export const cardsOutputSchema = z.object({
  cards: z.array(z.object({
    title: z.string().min(1).max(80),
    description: z.string().optional(),
    priority: z.enum(['low', 'med', 'high']),
    position: z.number().min(0).max(1),
  })).min(1).max(20),
});

export type CardsOutput = z.infer<typeof cardsOutputSchema>;
```

### Smart Card Generation: Route Handler

**Wichtig:** Streaming an den Client geht **nicht** über Server Actions, sondern über Route Handlers. Server Actions sind async Mutations, kein progressives Response-Streaming. AI SDK 6 nutzt `streamText` plus `output: Output.array`, nicht das deprecated `streamObject`.

`src/app/api/cards/generate/route.ts`:

```typescript
import { streamText, Output } from 'ai';
import { requesty } from '@/lib/requesty';
import { cardSchema } from '@/lib/schemas';
import { getBoardContext } from '@/lib/board';

export async function POST(req: Request) {
  const { prompt, boardId } = await req.json();
  const board = await getBoardContext(boardId);

  const result = streamText({
    model: requesty('anthropic/claude-sonnet-4-6'),
    output: Output.array({ element: cardSchema }),
    system: `Du bist ein Kanban-Projekt-Planer. ...`,
    prompt: `User will: ${prompt}\n\nBoard-Kontext:\n${JSON.stringify(board, null, 2)}`,
  });

  return result.toTextStreamResponse();
}
```

Client liest mit `experimental_useObject as useObject` aus `@ai-sdk/react`. Nach Stream-Ende ein Bulk-Insert via `supabase.from("cards").insert([...alleCards])` (Array-Insert läuft atomar als single PostgREST-Request).

### Auto-Categorization: System-Prompt

Wird in `src/lib/ai/auto-categorization.ts` gegen Haiku 4.5 via Requesty verwendet.

```
Du bist ein Kanban-Card-Klassifizierer. Bei jeder neu erstellten Card bekommst du den Board-State (Lists, existierende Labels, Beispiel-Cards) und sollst vorschlagen:

- 1 bis 3 passende Labels aus den existierenden Board-Labels. Keine neuen Labels erfinden. Wenn keine passen: leere Liste.
- Prioritaet (low/med/high) basierend auf Titel und Beschreibung
- suggestedListId: welche Liste passt am besten?

Antworte nur mit dem JSON-Schema. Keine Erklaerung.

Card:
Titel: {card_title}
Beschreibung: {card_description}

Board-State:
Lists: {lists}
Existierende Labels: {labels}
Beispiel-Cards: {sample_cards}
```

### Auto-Categorization: Zod-Schema

```typescript
export const categorizationSchema = z.object({
  labels: z.array(z.string()).min(0).max(3),
  priority: z.enum(['low', 'med', 'high']),
  suggestedListId: z.string().uuid(),
});
```

### Requesty-Client-Setup

`src/lib/requesty.ts`. Paket heißt `@requesty/ai-sdk` (Vercel-AI-SDK-Adapter), **nicht** `@requesty/sdk`:

```typescript
import { createRequesty } from '@requesty/ai-sdk';

export const requesty = createRequesty({
  apiKey: process.env.REQUESTY_API_KEY!,
});

// Nutzung: requesty('anthropic/claude-sonnet-4-6') oder requesty('anthropic/claude-haiku-4-5')
// Volle Model-IDs mit Bindestrich, Requesty routet pro Provider/Modell-ID.
```

### Graceful Degradation Pattern

Im Route Handler abfangen, nicht in der UI. Bei direkten Modell-Calls gibt es **kein** automatisches Fallback. Echtes Auto-Failover Sonnet → Haiku → OpenAI braucht eine Requesty-Policy (`model="policy/<name>"`).

```typescript
export async function POST(req: Request) {
  try {
    const result = streamText({ ... });
    return result.toTextStreamResponse();
  } catch (error) {
    return Response.json(
      { ok: false, error: 'AI-Service nicht erreichbar. Generierung deaktiviert.' },
      { status: 503 }
    );
  }
}
```

---

<a id="codex-prompts"></a>
## 5. Codex-Review-Prompt-Templates

Codex-Plugin wird vor jedem Merge und als Final-Pre-Production-Check verwendet.

### Standard-Review (pro Feature-Branch, vor Merge)

```
Review den Diff auf Branch {branch-name} gegen main.

Fokus:
- Security-Issues (Auth-Bypass, SQL-Injection, XSS, API-Key-Leaks)
- Fehlende Error-Handling bei async Operations
- Vergessene Edge-Cases (leere Arrays, null-Werte, Network-Errors)
- Best-Practice-Verletzungen für den eingesetzten Stack (Next.js 15, Supabase SSR, React 19)
- Memory-Leaks (fehlende Cleanup-Calls in useEffect, unsubscribe)
- Performance-Smells (unnoetige Re-Renders, fehlende Memoization bei teuren Ops)

Gib Findings kategorisiert zurück:
- BLOCKER (muss vor Merge behoben werden)
- WARNING (sollte behoben werden, kann aber in Folge-PR)
- INFO (Empfehlung, nicht blockierend)

Falls alles sauber: nur „Looks clean" antworten mit 1-2 Saetzen zu den wichtigsten Pruefbereichen.
```

### Security-Pass (für Auth- und RLS-Specs)

```
Security-Review auf Branch {branch-name}.

Fokus-Liste:
1. Auth-Flow: getUser statt getSession auf dem Server? Cookies HttpOnly plus Secure? Middleware-Refresh korrekt?
2. RLS-Policies: alle Tabellen haben RLS aktiv? Policies decken SELECT, INSERT, UPDATE, DELETE ab? Keine offene Policy (using true)?
3. API-Keys: NEXT_PUBLIC_* Variablen nur für wirklich Öffentliches (anon key)? Service-Role nie client-seitig?
4. Input-Validation: User-Input serverseitig validiert (Zod-Schema)? SQL-Statements nur via Supabase-SDK oder Parameterized?
5. XSS: User-Input in innerHTML? style-Attribute mit User-Daten?
6. CSRF: Server Actions nutzen Next.js CSRF-Protection?

Findings mit Severity: CRITICAL / HIGH / MEDIUM / LOW.
```

### Architektur-Review

```
Architektur-Review auf dem aktuellen Projekt-Stand.

Fokus:
1. Sind Server Components und Client Components sinnvoll getrennt? Keine 'use client' auf Root-Level?
2. Ist Server-Client-Boundary klar? Secrets nie in Client-Code?
3. Ist die Ordner-Struktur konsistent (Co-Location im Segment-Ordner)?
4. Gibt es vermeidbare Wiederholungen (DRY-Verletzungen) die in Helper ausgelagert werden sollten?
5. Ist die Schema-Struktur normalisiert? Gibt es Junction-Tables wo noetig?
6. Werden TypeScript-Types aus Supabase genutzt statt manuelle Interfaces?
7. Ist die Component-Hierarchie flach genug? Keine Prop-Drilling tief als 3 Ebenen?

Empfehlungen priorisieren: Quick Win / Mittelfristig / Refactor-Projekt.
```

### Pre-Production-Final-Review (beim Web-Deploy-Sub)

```
Pre-Production-Review auf dem gesamten Projekt. Fokus: Security, Performance, Edge-Cases, fehlende Error-Handling, vergessene RLS-Policies, API-Key-Leaks, SSR-Hydration-Issues.

Nimm dir Zeit, Reasoning-Level hoch. Ich will Production-Deploy-Ready sein.

Gib Findings kategorisiert:
- BLOCKER (muss vor Deploy behoben werden)
- WARNING (sollte in nächsten 1-2 Tagen behoben werden)
- INFO (für Roadmap)

Pro Finding:
- Was ist das Problem
- Wo im Code (Datei plus Zeile)
- Warum ist es ein Problem
- Konkrete Fix-Empfehlung

Falls alles sauber: kurze Bestaetigung mit den gepruefen Bereichen.
```

---

<a id="build-prompts"></a>
## 6. Build-Loop-Prompts pro Feature

Drei Phasen pro Feature-Spec: Plan, Build, Check.

### Plan-Phase-Prompt (pro Feature)

```
Lies `specs/{NN}-{feature}.md` und bestaetige deinen Ansatz für die Implementation.

Falls offene Fragen: stelle sie jetzt, bevor du anfaengst zu bauen. Wenn Spec klar: kurz dein Plan in 3-5 Stichpunkten zusammenfassen, dann mit dem Build starten.

Bei Supabase-Auth-Code oder -Middleware: PFLICHT Context7 MCP nutzen für aktuellen Supabase-Next.js-15-Guide, nicht aus Gedaechtnis ableiten.
```

### Build-Phase-Prompt

```
Bau das Feature auf Branch `feat/{feature}`. Nutze Server Components als Default, 'use client' nur wo noetig. Implementiere entlang der Spec-Tasks.

Akzeptanzkriterien abhaken wie du gehst. Wenn unsicher bei einem Schritt: Context7 konsultieren statt spekulieren.
```

### Check-Phase-Prompt

```
Pruefe das Feature gegen die Akzeptanzkriterien aus der Spec:

1. Typecheck grün? (npm run typecheck)
2. Visual Verification mit browser-use --headed: alle User-Flows durchspielen
3. Mobile-Viewport bei 375px und 390px pruefen
4. Bei DB-Änderungen: Supabase Dashboard öffnen, Tabellen und Policies ansehen
5. Stopp-Kriterien UI (falls Frontend): Abgleich mit references/design-analysis.md plus Hover-Focus plus Dark-Mode plus Empty-State

Wenn alles grün: Codex-Review starten (siehe Standard-Review-Prompt).
```

### Commit-Phase-Prompt

```
Nach Codex-Clean-Review:
- Spec-Status auf fertig setzen, Debrief-Sektion ausfuellen (Was lief gut, Was war schwieriger, Was würde ich anders machen, Wichtig für zukünftige Features)
- changelog.md Eintrag (Format siehe changelog.md Header)
- learning.md Eintrag falls Learnings
- Commit mit Semantic-Commit-Format: feat(scope): message
- Merge auf main (git checkout main && git merge feat/{feature} && git branch -d feat/{feature})
```

---

<a id="live-prompts"></a>
## 7. Direkt-Prompts an die laufende App

Prompts, die du im Build live in Claude Code oder im UI einwirfst, sobald die jeweilige Spec gebaut ist.

### Smart-Card-Generation live triggern im AI-Features-Schritt

Im Prompt-Input-Field oben am Board tippen:

```
Plane Produktlaunch für Q3 2026. Marketing, Entwicklung, Support.
```

Alternativen (Use-Case-Pool):

```
Relaunch der Website mit neuem Design-System.
```

```
Kunden-Onboarding-Projekt für einen neuen Enterprise-Klienten.
```

```
Fachkonferenz organisieren mit 200 Teilnehmern, Speaker-Management und Sponsoring.
```

### Board-Kontext-Prompt im Auto-Categorization-Test

User erstellt eine neue Card manuell:

```
Titel: Newsletter-Template finalisieren
Beschreibung: Neues Template für den wochentlichen Produkt-Newsletter, responsive, dark-mode-ready
```

Agent schlaegt automatisch vor:
- Labels: `marketing`, `content`
- Prioritaet: `med`
- Liste: `Diese Woche`

### Live-Fixes-Prompts

Wenn Codex einen Finding meldet, Denis promptet Claude für den Fix:

```
Codex hat einen Finding: Error-Boundary fehlt um die Smart-Card-Generation-Komponente. Baue eine `<AIErrorBoundary>`-Komponente, die Smart-Gen-Errors abfaengt und einen Toast „AI-Service nicht erreichbar. Bitte später erneut versuchen" anzeigt. Komponenten-Pfad: src/components/pwa/ai-error-boundary.tsx. Umhuelle Smart-Gen-UI damit.
```

```
Cleanup-Leak im useEffect vom Realtime-Hook. Der Channel wird beim Unmount nicht unsubscribed. Fix den useEffect in src/hooks/use-board-realtime.ts, sodass cleanup() den Channel abmeldet.
```

---

<a id="theme"></a>
## 8. Design-Committment und Theme-Export

### P3-Theme als Kopie-Vorlage

Falls das Linktree-Theme uebernommen werden soll: CSS-Variablen aus `linktree/src/app/globals.css` kopieren. Beispiel-Block:

```css
@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 240 5% 94%;
    --card: 240 6% 10%;
    --card-foreground: 240 5% 94%;
    --primary: 51 96% 70%;
    --primary-foreground: 0 0% 10%;
    --secondary: 240 4% 16%;
    --accent: 51 96% 70%;
    --border: 240 4% 16%;
    --radius: 1rem;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    --shadow-lg: 0 16px 40px -8px rgb(0 0 0 / 0.5), 0 8px 16px -4px rgb(0 0 0 / 0.4);
  }
}
```

### Alternatives Theme via tweakcn

1. `https://tweakcn.com` öffnen
2. Startpunkt wählen (z.B. „Linear Dark" als Preset)
3. Drei Dimensionen entscheiden: Temperatur (kalt/warm/bunt), Accent-Intensitaet (dezent/mittel/kraeftig), Charakter (praezise-clean/soft-premium/playful)
4. Farben, Radius, Shadows tunen bis Committment sitzt
5. Export → CSS-Variablen-Block in Zwischenablage
6. In `src/app/globals.css` einfuegen nach `@tailwind base`

---

<a id="deploy"></a>
## 9. Deployment-Commands

### GitHub-Repo anlegen im Web-Deploy-Schritt

```bash
# Alle Files plus commits bereits vorhanden durch Build-Loop
gh repo create flow-board --public --source=. --remote=origin --push
```

### Vercel Preview-Deploy

```bash
# CLI-Login falls noetig
vercel login

# Projekt linken, Preview-URL erscheint
vercel
```

Danach im Vercel-Dashboard Environment-Variables setzen:

```
NEXT_PUBLIC_SUPABASE_URL = <aus Supabase Dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <aus Supabase Dashboard>
REQUESTY_API_KEY = <aus Requesty Dashboard>
```

### Production-Deploy

```bash
vercel --prod
```

Oder bei verbundener main-Branch: einfach `git push origin main`.

### Supabase-Type-Generation

Nach jeder Schema-Änderung:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > lib/database.types.ts
```

### pwa-asset-generator im Native-Setup-Schritt

```bash
npx pwa-asset-generator public/logo.svg public/icons \
  --manifest src/app/manifest.ts \
  --type png \
  --padding "25%" \
  --background "#0a0a0a"
```

### Lighthouse-Audit

Chrome DevTools → Lighthouse Tab → Generate Report.

Ziel-Werte:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+
- PWA Installable: YES

---

<a id="native-kickoff"></a>
## 10. Native-Kickoff-Prompt (Expo)

Lite-Scope-Kickoff für die React-Native-App im Schwester-Repo `flow-board-native`. Reverse-Pattern: Codex-Plugin baut, Claude reviewt. Phase 0 (Expo-Init, NativeWind plus Token-Sync, Supabase-Client, Deny-Rule, Icons) plus Phase 1-3 (Discovery, Sparring, 6 Specs) in einem Prompt.

### Vorbereitung (Terminal)

```bash
cd <Parent-Ordner-von-flow-board-web>
mkdir flow-board-native && cd flow-board-native
claude
```

Wichtig: Der Native-Repo liegt als **Schwester-Ordner** zu `flow-board-web`, damit der Token-Sync per Pfad `../flow-board-web/src/app/globals.css` funktioniert.

### Native-Kickoff-Prompt

````
# Native-Kickoff: Flow Board Native (Expo)

## Kontext

Wir bauen Flow Board Native als React-Native-App im Schwester-Repo zu `../flow-board-web`. Native-Builder ist das Codex-Plugin in Claude Code (Reverse-Pattern zur Web-Phase, wo Claude gebaut und Codex reviewt hat). Du leitest jetzt den Kickoff. Ab Spec-Implementierung übernimmt Codex das Bauen, Claude bleibt Reviewer.

Erkläre beiläufig, warum du Entscheidungen triffst, aber gehe nicht auf Basics ein, die aus der Web-Phase bekannt sind (Spec-Pattern, CLAUDE.md als Router, Build-Loop, browser-use, Git-Workflow). Antworte auf Deutsch, respektvoll, pragmatisch, lösungsorientiert. Ich-Form statt „man macht das so".

## Sicherheits-Hinweis

Für die gesamte Session: keine Tokens, API-Keys, Service-Role-Keys oder `.env`-Inhalte im Terminal-Output anzeigen oder in Code-Blöcke schreiben. `.env` ist Deny-Listed (User-Level plus Project-Level).

## Vision plus Architektur-Constraints

- Gleiche Supabase-Datenbank wie Web (`../flow-board-web/`). Same Auth, same RLS, same Schema. Kein neues Schema, keine Migration.
- AI-Endpunkte werden NICHT in Native dupliziert. Smart-Card-Gen ruft den Web-Route-Handler `/api/cards/generate` aus dem Web-Repo via `expo/fetch` plus Bearer-Token auf.
- Theme-Tokens werden 1:1 aus `../flow-board-web/src/app/globals.css` nach `tailwind.config.js` gespiegelt (HSL-Strings). Visuelle Nähe zu Web, keine Identität (Schatten und Animationen sind plattform-spezifisch).
- Lite-Scope: kein FTS, kein Focus-Mode. DnD per etablierter RN-Library (z.B. `react-native-draggable-flatlist`), kein eigenes Gesture-System bauen. Mobile-UX-Patterns wo sinnvoll (Action-Sheet, Long-Press, Pull-to-Refresh).

## Tech-Stack (final entschieden)

- Expo SDK aktuell (Cloud-Build via EAS), Tabs-Template
- Expo Router (File-based Routing wie Next.js App Router)
- NativeWind v4 plus Tailwind v3 (`tailwindcss@^3.4.17`). NativeWind v5 plus Tailwind v4 ist Pre-Release und nicht für Production
- Supabase-js mit AsyncStorage (`@react-native-async-storage/async-storage`) plus `react-native-url-polyfill`
- AppState-Listener für `startAutoRefresh`/`stopAutoRefresh` (Battery-Schutz)
- React Native Reanimated für Animationen
- TypeScript strict

Was NICHT in den Stack gehört: kein Redux/Zustand (Server-State via Supabase, Local-State via React-Hooks), kein React-Navigation (Expo Router reicht), kein eigener AI-Endpunkt (Web wird wiederverwendet).

## Dein Auftrag jetzt

Preflight, zuerst prüfen, STOP wenn etwas fehlt:
- [ ] Aktuelles Verzeichnis ist leer (`ls` zeigt keine Projektdateien)
- [ ] Node.js 20.9 oder höher (`node -v`)
- [ ] Expo-Account vorhanden (fragt nicht ab, nur Hinweis: wird beim ersten EAS-Build via `eas login` gebraucht)
- [ ] Apple-Developer-Account-Status erwähnen (für späteren iOS-Device-Build und TestFlight, NICHT für Phase 0/Simulator notwendig)
- [ ] Web-Repo unter `../flow-board-web` lesbar (`ls ../flow-board-web/src/app/globals.css`)

Wenn Preflight grün: bestätige und starte Phase 0.

---

### Phase 0a, Expo-Projekt initialisieren

`npx create-expo-app@latest . --template tabs`

Direkt danach:
- `app.json`: `ios.bundleIdentifier` und `android.package` setzen (z.B. `com.kilernen.flowboard`). Später nicht mehr ändern, weil das Signatur und Store-Eintrag bricht.
- `npx expo install nativewind tailwindcss@^3.4.17 react-native-reanimated`
- `tailwind.config.js` anlegen, NativeWind-Babel-Plugin in `babel.config.js` einsetzen, `global.css` als Entry für Tailwind anlegen, in `_layout.tsx` importieren

### Phase 0b, Design-Token-Sync zu Web

- Lies `../flow-board-web/src/app/globals.css`, extrahiere die CSS-Variablen für background, foreground, primary, accent, border, radius (HSL-Werte).
- Spiegele sie 1:1 in `tailwind.config.js` unter `theme.extend.colors` und `theme.extend.borderRadius`.
- Test-View in `app/(tabs)/index.tsx`: ein `View` mit `className="bg-background"` plus `Text` mit `className="text-foreground"`. Visueller Vergleich gegen Web-Screenshot.
- Hinweis im Output: „Visuelle Nähe zu Web. Schatten und Animationen sind plattform-spezifisch."

### Phase 0c, Supabase-Client

- `npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill`
- `.env` anlegen mit `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Werte zeigt User, nicht ins Terminal echoen). `.env` in `.gitignore` aufnehmen.
- Plus später für Smart-Card-Gen: `EXPO_PUBLIC_WEB_API_URL` (URL des Web-Deployments). In Phase 0 nur als Platzhalter eintragen.
- `src/lib/supabase.ts` mit der vollständigen Konfiguration aus Supabase-Quickstart für React Native:
  - `import 'react-native-url-polyfill/auto'` ganz oben
  - `createClient` mit `auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }`
  - AppState-Listener: bei `active` `supabase.auth.startAutoRefresh()`, sonst `stopAutoRefresh()`

### Phase 0d, Deny-Rule plus App-Icons

- Project-Level Deny-Rule in `.claude/settings.json` einrichten, die `.env` blockiert. (User-Level greift schon, Project-Level macht es im Repo dokumentiert.)
- `assets/icon.png` als 1024x1024 PNG vorbereiten (User liefert das Bild später, fürs erste Platzhalter aus dem Expo-Template behalten).
- `app.json`: `icon` plus `android.adaptiveIcon` (Foreground-PNG plus `backgroundColor`) auf das Web-Branding setzen.

### Phase 0 abschließen

- `git init`, `git add -A`, `git commit -m "chore: scaffold flow board native"`
- Simulator-Build prüfen: `npx expo start` im Hintergrund, iOS-Simulator-Tap testen, Prozess wieder beenden.
- STOP. Bestätige, dass Skeleton steht. Warte auf „weiter".

---

### Phase 1, Discovery (2 Sub-Agents parallel)

Wenn User „weiter" sagt: 2 Claude-Code-Subagents parallel starten. Jeder gibt Findings-Report zurück, konsolidiere in `references/discovery.md`. Pflicht: Context7 MCP für aktuelle Docs verwenden, wenn verfügbar.

Themen:
1. **Supabase-Auth-Patterns in Expo plus AppState-Lifecycle.** Wie funktioniert Sign-In, Sign-Up, Session-Refresh, AppState-Lifecycle in einer RN-App. Cookie-vs-AsyncStorage-Unterschiede. Wann passiert Auto-Refresh-Start/Stop, wann nicht.
2. **Realtime-Subscription-Verhalten in React Native.** `useEffect`-Cleanup mit `supabase.removeChannel()`, Verhalten bei AppState-Wechseln (Background/Foreground), Filter-Syntax für Postgres-Changes auf Mobile (Akku/Daten-Effizienz).

### Phase 2, Sparring (maximal 4 Fragen)

Eine Runde, maximal 4 Native-Specific-Fragen. Architektur ist aus Web-Phase klar, hier nur Detail-Tuning:
- Bottom-Sheet-Library für Card-Detail-Modal: Expo Router `presentation: 'modal'` (Standard, einfach) oder `formSheet` mit Detents (iOS-nativ, aber Android-Verhalten unterschiedlich)?
- Form-Komponente: nackte `TextInput` mit `useState` (minimal, kein Dependency-Gewicht) oder `react-hook-form` (skaliert besser bei Card-Detail mit mehreren Feldern)?
- Streaming-Strategie für Smart-Card-Gen: `expo/fetch` (Default ab SDK 54+, sauberes Streaming) oder klassisches `fetch` mit Polyfill?
- DnD-Library: `react-native-draggable-flatlist` (community, reorder innerhalb einer Liste sehr stabil, Cross-Section per Workaround) oder `react-native-reorderable-list` (jüngere Alternative, Cross-Section nativ)?

Bereits entschieden, NICHT als Sparring-Frage stellen:
- Reverse-Pattern (Codex baut, Claude reviewt)
- Same Supabase-DB wie Web
- AI-Endpunkt aus Web wiederverwenden
- AsyncStorage statt expo-secure-store (Tradeoff explizit: einfacher und Cross-Platform)
- DatePicker: `@react-native-community/datetimepicker` (konservativ, in Expo Go enthalten)

### Phase 3, Output

6 Feature-Specs in `specs/NN-<feature>.md` nach Abhängigkeits-Reihenfolge. Jede Spec: User-Story, Routing, Komponenten, Datenfluss, Acceptance-Criteria.

1. `specs/01-auth.md` - Sign-Up, Sign-In, Sign-Out plus AppState-Auto-Refresh. Expo-Router-Struktur mit `(auth)`-Group plus geschützter `(app)`-Group. Loading-States plus Mobile-Eingabe-Paket (`keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`).
2. `specs/02-boards-liste.md` - FlatList, Per-Item-Touch zu `app/(app)/board/[id].tsx`, RefreshControl Pull-to-Refresh, Empty-State. Plus Board-Create-Flow: Plus-Button im Header öffnet Create-Modal mit TextInput "Board-Name" und Erstellen-Button, der `boards.insert({ name, owner_id })` ausführt.
3. `specs/03-cards-liste.md` - SectionList mit 4 Lists (Backlog/Diese Woche/In Arbeit/Done), Cards als Rows. Inline Quick-Add unten pro Section (Plus-Button öffnet Mini-Input, Enter erzeugt Card). Optimistic UI nur beim Quick-Add. Tap-zu-Card-Detail. **Plus Cross-Section Card-Move via Long-Press plus Drag:** Library laut Sparring-Antwort (`react-native-draggable-flatlist` ODER `react-native-reorderable-list`). Reorder innerhalb Section per Drag. Mutation via Postgres-RPC `move_card` aus dem Web-Repo (atomar, gleich wie auf Web). Optimistic UI während Drag, Rollback bei Fehler. Cross-Section auf SectionList ist nicht trivial, evtl. Umstellung auf flache FlatList mit manuellen Section-Headern nötig - Codex entscheidet anhand der gewählten Library.
4. `specs/04-card-detail.md` - Modal-Style Screen (`presentation: 'modal'`). TextInput Title, multi-line TextInput Description, DatePicker für Due-Date (ISO-String gespeichert, Locale-Formatierung nur in Anzeige). Save mit optimistischem UI plus Rollback bei Fehler. Unsaved-Changes-Guard beim Swipe-Down.
5. `specs/05-smart-card-gen.md` - AI-Generation gegen Web-Endpunkt `/api/cards/generate`. `expo/fetch`, Bearer-Token aus Supabase-Session, Plain-Text-Stream via `response.body.getReader()` selbst parsen (kein `EventSource`). Stagger-Animation pro Card via `react-native-reanimated`. AbortController im Cleanup. `useRef`-Guard plus Disabled-State gegen Doppel-Tap.
6. `specs/06-realtime.md` - Channel `board:${boardId}` mit Postgres-Changes-Subscription. Filter Pflicht: `filter: board_id=eq.${boardId}`. Optimistic UI mit Idempotenz (Card-ID-Merge gegen Echo). Cleanup auf Unmount via `supabase.removeChannel(channel)`. Fokus auf INSERT/UPDATE, DELETE lokal-optimistisch (RLS plus Filter sind bei DELETE eingeschränkt).

Plus `implementierungsplan.md` im Root mit Arbeitspaket-Tabelle (Status offen/in Arbeit/fertig).

### Phase 3 abschließen

- Alle 6 Spec-Dateien plus `implementierungsplan.md` committen: `git add specs/ implementierungsplan.md && git commit -m "docs: add native specs 01-06 plus plan"`
- STOP. Bestätige, dass die 6 Specs auf der Platte liegen. Liste die Spec-Dateinamen plus jeweils 1-Satz-Zusammenfassung. KEIN Code-Bauen. Warte auf weitere Anweisung. Spec-Implementierung passiert in separaten Sessions mit dem Codex-Plugin.

## Kommunikation

- Antworte auf Deutsch.
- RPL: respektvoll, pragmatisch, lösungsorientiert.
- Ich-Form statt „man".
- Maximal 1 Begründungssatz pro Entscheidung.
- Bei Phase 0 kurze Status-Linien nach jedem Schritt, kein Stream-of-Consciousness.
````

### Nach Phase 3: Codex-Plugin aktivieren

Wenn Phase 3 die 6 Specs auf der Platte hat, Codex-Plugin in Claude Code aktivieren und den Build pro Spec starten:

```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

Ab da: Codex baut Spec für Spec (`specs/01-auth.md` bis `specs/06-realtime.md`), Claude reviewt nach jeder Implementation gegen den Diff. Reverse-Pattern in Action.

---

## Abschluss-Hinweise

**Wiederverwendung:** Alle Prompts sind bewusst so formuliert, dass sie für eigene Projekte anpassbar sind. Kickoff-Prompt ist modular: Vision plus Scope ändern, Design-Anforderungen und Workflow bleiben.

**Versionierung:** Diese prompts.md wurde erstellt am 2026-04-24. Bei Prompt-Änderungen in Skripten oder Teleprompter auch hier aktualisieren.

**Sicherheit:** Niemals Tokens, API-Keys oder Service-Role-Keys in diese Datei committen. Alle Platzhalter (`<...>`) vom User lokal ersetzen.

**Fragen und Feedback:** über den Members-Area-Channel des Kurses.
