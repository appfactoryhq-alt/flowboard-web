# 02 — Auth (Sign-Up / Sign-In / Sign-Out)

## Ziel

Email/Passwort-Auth mit `@supabase/ssr`. Server Actions für Sign-Up/Sign-In/Sign-Out, Cookie-Refresh über `proxy.ts` (Next 16) mit `getClaims()`. Geschützte Routen leiten nicht eingeloggte User auf `/login` um.

## Abhängigkeiten

- Spec 01 (Schema + RLS) — `profiles`-Trigger muss stehen, bevor Sign-Up sinnvoll getestet werden kann.

## Out of Scope

- OAuth/Social-Login (laut Architektur-Entscheidung bewusst nicht im Scope).
- Passwort-Reset-Flow (kein MVP-1-Spec, kommt bei Bedarf als eigener Backlog-Punkt).
- Board-UI, geschützte App-Struktur jenseits des Redirects (Spec 03+).

## Bereits entschieden

- Ursprüngliche Annahme aus dem Kickoff-Prompt war, Confirm-Email sei im Dev-Projekt deaktiviert. Tatsächlicher Stand (verifiziert per Test-Sign-Up): Confirm-Email ist **aktiv**. `signup` behandelt das robust — bei `data.session === null` nach erfolgreichem `signUp()` wird kein Redirect ausgelöst, sondern eine Info-Meldung angezeigt ("Konto erstellt, bitte Email bestätigen"). `/auth/confirm` ist damit kein reiner Production-Pfad, sondern wird bereits im aktuellen Dev-Projekt durchlaufen.

## Tasks

1. Dependencies: `@supabase/ssr`, `@supabase/supabase-js`.
2. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. `src/lib/supabase/client.ts` — `createBrowserClient` für Client Components.
4. `src/lib/supabase/server.ts` — `createClient` (async, `cookies()` aus `next/headers`) für Server Components/Actions.
5. `src/lib/supabase/proxy.ts` — `updateSession(request)`: Cookie-Refresh via `getClaims()` (nicht `getUser()`/`getSession()`, siehe `rules/tech-stack.md`), Redirect auf `/login` wenn kein User und Pfad nicht `/login`/`/signup`/`/auth/*`.
6. Root `proxy.ts` — ruft `updateSession`, `matcher` schließt `_next/static`, `_next/image`, `favicon.ico`, statische Asset-Extensions aus.
7. `src/app/(auth)/actions.ts` — Server Actions `signup`, `login`, `logout`. Rückgabe `{ data, error }` (kein `throw` über Action-Grenze, siehe `rules/code-conventions.md`).
8. `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx` — Formulare, Fehleranzeige über shadcn `Toast`/`Sonner`.
9. `src/app/auth/confirm/route.ts` — Route Handler für `verifyOtp` (Production-Pfad bei aktiver Confirm-Email).
10. Platzhalter-Zielseite `/board` (leere Seite, wird in Spec 04 zur echten Board-Ansicht) — Redirect-Ziel nach Login/Sign-Up.

## Akzeptanzkriterien

1. Sign-Up mit neuer Email/Passwort erzeugt User in `auth.users` **und** automatisch eine Zeile in `profiles` (Trigger aus Spec 01).
2. Nach Sign-Up: Bei aktivem Confirm-Email (aktueller Dev-Stand) erscheint eine Info-Meldung statt Redirect. Ist Confirm-Email deaktiviert, landet der User direkt eingeloggt auf `/board`.
3. Sign-In mit korrekten Credentials landet auf `/board`.
4. Sign-In mit falschem Passwort zeigt Fehlermeldung, kein Redirect, kein Server-Crash.
5. Sign-Out löscht die Session, danach Redirect auf `/login` bei erneutem Zugriff auf `/board`.
6. Direkter Zugriff auf `/board` ohne Session leitet auf `/login` um (Proxy-Redirect).
7. `/login` und `/signup` bleiben ohne Session erreichbar (kein Redirect-Loop).
8. Sicherheitsentscheidung im Proxy läuft über `getClaims()`, nicht `getSession()`.

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell im Browser: Sign-Up → Sign-Out → Sign-In → Sign-Out, plus direkter `/board`-Zugriff ohne Session (Redirect-Check).
- Supabase Dashboard: neuer User in Auth-Tabelle, korrespondierende `profiles`-Zeile.

## Relevante Rules

- `rules/tech-stack.md` — `@supabase/ssr`, `getClaims()`, `proxy.ts` (Next 16).
- `rules/code-conventions.md` — Error-Pattern `{ data, error }`.
- `guidelines.md` — Context7-Pflicht für Auth (bereits recherchiert, siehe Debrief).

## Status

fertig

## Debrief

- Context7-Doku (`@supabase/ssr`, Next.js 16 `proxy.ts`) vor dem Build recherchiert, aktuelles offizielles Cookie-Handling-Pattern (`getAll`/`setAll` mit Headers-Propagation) übernommen.
- Realer Bug beim ersten Deploy: `proxy.ts` lag im Repo-Root statt unter `src/` — bei einem `src/app`-Layout erwartet Next.js `src/proxy.ts` (analog `middleware.ts`), sonst wird die Datei nie geladen (kein Fehler, einfach stiller No-Op). Per Turbopack-Modulfehler nach dem Verschieben entdeckt, sauberer Dev-Server-Neustart nötig (Turbopack-Zwischenstand wurde inkonsistent).
- Confirm-Email ist auf dem Dev-Supabase-Projekt aktiv (ursprüngliche Kickoff-Prompt-Annahme war falsch). `signup`-Action behandelt den Fall robust: kein Redirect bei `data.session === null`, stattdessen Info-Toast.
- Codex-Review (gpt-5.6-sol, high): kein Blocker. Drei Warnings behoben — Spec-Doku an echten Confirm-Email-Stand angepasst, `logout()` prüft jetzt den `signOut()`-Fehler statt blind zu redirecten (nutzt `useActionState` wie Login/Signup), `FormData`-Felder plus `EmailOtpType` gegen Allowlist validiert statt ungeprüft gecastet. Ein Nit behoben (`startsWith`-Pfadmatching zu `path === prefix || path.startsWith(prefix + "/")` verschärft).
- Vollständig manuell verifiziert (browser-use plus curl plus Supabase SQL): Sign-Up inkl. Confirm-Email-Pending-Pfad, Sign-In, Sign-Out, `/board`-Redirect-Schutz ohne Session (307), kein Redirect-Loop für `/login`/`/signup`, Fehlerbehandlung bei falschem Passwort über direkten Supabase-Auth-API-Call bestätigt.
