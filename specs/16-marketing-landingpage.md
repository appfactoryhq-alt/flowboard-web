# 16 — Marketing-Landingpage

## Ziel

Öffentliche Landingpage unter `/` (Hero plus Feature-Cards), die Flow Board vorstellt. Eingeloggte User werden von `/` automatisch auf `/board` weitergeleitet, Auth-Routen bleiben davon unberührt. Polish-Move zum Abschluss von MVP+.

## Abhängigkeiten

- Spec 02 (Auth) — Proxy-Redirect-Logik existiert bereits, wird hier erweitert.
- Spec 03 (Base-Layout) — Design-Tokens/Referenz-Niveau bereits etabliert, Landingpage nutzt dieselbe Design-Sprache.

## Out of Scope

- Eigenes Marketing-CMS oder Blog.
- A/B-Testing, Analytics-Integration (nicht im Scope, kann bei Bedarf in den Backlog).

## Bereits entschieden

- Proxy-Redirect nur für `/` bei eingeloggten Usern auf `/board`. Auth-Routen `/login`, `/signup` und statische Assets explizit von der Redirect-Logik ausschließen, damit kein Loop entsteht.

## Tasks

1. `src/app/page.tsx` wird zur echten öffentlichen Landingpage (aktuell Next.js-Default-Platzhalter aus Phase 0 — falls noch nicht ersetzt, hier final ersetzen).
2. Hero-Sektion: Produktname, kurzer Value-Proposition-Satz, Primary-CTA („Kostenlos starten" → `/signup`), Secondary-CTA („Anmelden" → `/login`).
3. Feature-Cards-Sektion: 3–4 Kernfeatures (Boards/Lists/Cards, Drag-and-Drop, Smart-Views, AI-Card-Generation) mit Icon (Lucide) plus Kurzbeschreibung.
4. Design: gleiches Referenz-Niveau wie App (`rules/design-system.md`) — Gradients, Layering, abgestufte Neutrals, aber Light-Mode-fähig falls die Landingpage bewusst heller wirken soll als die App (Entscheidung im Debrief festhalten, Dark-Mode-Default bleibt für den eingeloggten Bereich in jedem Fall bestehen).
5. `src/proxy.ts`/`src/lib/supabase/proxy.ts` erweitern: bei `pathname === '/'` und vorhandenem User (`getClaims()`) → Redirect auf `/board`. Explizite Ausnahme-Liste (`/login`, `/signup`, `/auth/*`, statische Asset-Pfade) bleibt wie in Spec 02 unverändert, kein Redirect-Loop.
6. Meta-Tags (Title, Description) für die Landingpage über Next.js `metadata`-Export.

## Akzeptanzkriterien

1. Ausgeloggter Zugriff auf `/` zeigt die Landingpage.
2. Eingeloggter Zugriff auf `/` leitet sofort auf `/board` weiter (kein sichtbarer Flash der Landingpage).
3. `/login` und `/signup` bleiben für eingeloggte User weiterhin ohne Redirect-Loop erreichbar (falls z. B. direkt aufgerufen — bestehende Ausnahme aus Spec 02 bleibt intakt).
4. CTAs führen zu den richtigen Zielen (`/signup`, `/login`).
5. Landingpage ist responsive und erfüllt die Design-System-Grundregeln (Hover-/Focus-States, `100dvh` bei Full-Height-Hero, keine harten Schwarz-/Weißtöne).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell: `/` ausgeloggt und eingeloggt aufrufen (Redirect-Verhalten), CTAs klicken, Mobile-Breite prüfen.

## Relevante Rules

- `rules/design-system.md` — Referenz-Niveau, Grundregeln.
- Vision-Dokument — Proxy-Redirect-Ausnahmen (Loop-Vermeidung).

## Status

offen
