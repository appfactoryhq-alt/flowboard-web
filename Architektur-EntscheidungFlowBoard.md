# Architektur-Entscheidung Flow Board

**Format:** Output aus dem Architektur-Sparring mit ChatGPT, vor dem ersten Code-Schritt.
**Zweck:** Plattform-Entscheidungen vor Code-Entscheidungen, dokumentiert. Wird in den Kickoff-Prompt als Kontext geladen, damit Phase-2-Sparring kürzer ausfällt.

---

## Kontext

Solo-User-Kanban-Tool. Web plus Native (iOS/Android). AI-Features (Smart-Card-Generation, Auto-Categorization). Realtime-Sync zwischen Geräten. Self-Hosting nicht nötig.

---

## Drei Achsen, drei Entscheidungen

### Achse 1: Frontend Web

**Entscheidung:** Next.js mit App Router, TypeScript strict, Tailwind v4, shadcn/ui.

**Warum:**
- App Router plus Server Actions plus Route Handler decken Auth, CRUD und Streaming sauber ab
- shadcn/ui plus Tailwind sind der etablierte Default für moderne Web-Apps
- Vercel-Deployment ist für Next-Apps der einfachste Weg

**Alternative verworfen:** Remix oder reines React/Vite. Beide funktionieren, aber Next-App-Router ist die ausgereifteste Option für unseren Stack.

### Achse 2: Datenbank plus Auth

**Entscheidung:** Supabase Postgres mit Row Level Security plus Email/Passwort-Auth.

**Warum:**
- Eine DB für Web und Native, RLS greift in beiden Plattformen identisch
- Supabase Realtime liefert Postgres Changes ohne eigenen Server
- Email/Passwort reicht für Solo-User-Tool, kein OAuth-Drama

**Alternative verworfen:** Eigenes Backend mit Drizzle plus Lucia. Mehr Kontrolle, aber doppelter Setup-Aufwand. Lite-Scope steht im Vordergrund.

### Achse 3: Mobile-Plattform

**Entscheidung:** React Native via Expo plus Expo Router plus NativeWind. EAS Build für iOS und Android. AI-Endpunkt aus dem Web-Backend wiederverwenden, kein eigener Native-AI-Code.

**Warum:**
- Echte App-Experience mit nativen Patterns (Bottom-Sheet, Pull-to-Refresh, Swipe-Down-Modal)
- Push und Background-Sync zuverlässig auf beiden Plattformen
- Token-Sync zwischen Web und Native via NativeWind plus geteilten Tokens
- AI-Endpunkt-Wiederverwendung: Modell-Wechsel im Web-Backend wirkt automatisch auch nativ

**Alternative verworfen:** PWA. iOS-Limits sind real (Push nur für installierte Web-Apps ab 16.4, kein verlässliches Background Sync auf Safari, dynamische Storage-Quotas). Wenn Push und Offline langfristig Pflicht sind, ist Native die robustere Wahl. Für ein anderes Projekt ohne Push-Need wäre PWA besser.

---

## Konsequenzen für den Build

- **Schema und APIs Plattform-agnostisch planen.** Web und Native arbeiten auf derselben DB, dieselben Endpunkte.
- **Design-Tokens als Single Source of Truth.** CSS-Variablen im Web spiegeln 1:1 auf NativeWind-Config. Schatten und Animationen plattform-spezifisch.
- **Reverse-Pattern in der Native-Phase.** Web-Build mit Claude Code, Native-Build mit Codex-Plugin als Builder. Agent-Diversität als Qualitätsmechanismus.
- **AI-Endpunkt nur einmal bauen.** Route Handler im Web-Repo, Native ruft via `expo/fetch` auf.

---

## Was diese Datei nicht beantwortet

- Konkrete Spec-Inhalte (kommen in Phase 3 des Kickoff-Prompts).
- DnD-Position-Strategie, Label-Farben-Palette, Realtime-Filter-Details, Stagger-Timing (kommen in Phase 2 Sparring des Kickoff-Prompts).
- Production-Skalierung (Postgres Changes vs Broadcast, Multi-User-Konflikt-Resolution). Aktueller Scope: Solo-User-Cross-Device.
