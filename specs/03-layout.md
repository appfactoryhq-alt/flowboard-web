# 03 — Base-Layout

## Ziel

App-Shell für den geschützten Bereich (`/board/*`): Header mit User-Menü (Logout) und Board-Titel, schlanke Sidebar-Navigation (Boards-Übersicht, Smart-Views „Heute"/„Focus" als Platzhalter-Links bis Spec 10/11), Content-Slot für die jeweilige Seite. Fundament für alle folgenden UI-Specs.

## Abhängigkeiten

- Spec 02 (Auth) — geschützter Bereich existiert bereits als Platzhalter (`/board`), wird hier zur echten Shell.

## Out of Scope

- Board-Inhalt selbst (Lists/Cards) — Spec 04+.
- Smart-View-Implementierung (Spec 10/11) — hier nur Navigations-Einträge, Zielseiten liefern vorerst leeren Platzhalter oder 404 bis zur jeweiligen Spec.
- Theme-Switch (Dark Mode bleibt erzwungen, siehe `rules/design-system.md`).

## Tasks

1. Route-Group `src/app/(app)/layout.tsx` für den geschützten Bereich: Server Component, lädt eingeloggten User serverseitig (bereits durch Proxy-Redirect abgesichert, hier nur Anzeige-Zweck über `getClaims()`).
2. Header-Komponente: App-Name/Logo, User-Menü (shadcn `DropdownMenu`, Logout ruft bestehende `logout`-Server-Action).
3. Sidebar-Komponente: Link „Boards" (→ `/board`), Platzhalter-Links „Heute" und „Focus" (deaktiviert/`aria-disabled`, Tooltip „kommt in Spec 10/11").
4. Bestehende Seiten `src/app/board/page.tsx` in die neue Route-Group verschieben (`src/app/(app)/board/page.tsx`), Pfad bleibt `/board` (Route Groups sind URL-neutral).
5. Responsive: Sidebar collapsible unter einem Breakpoint (mind. mobile-freundlich, kein dediziertes Mobile-Polish nötig laut Scope).
6. Design-Tokens aus `rules/design-system.md` anwenden: Gradients/Layering statt Flächenfarben, `100dvh` für die Shell, Hover-/Focus-States auf Nav-Items.

## Akzeptanzkriterien

1. `/board` zeigt Header plus Sidebar plus Content-Bereich.
2. Logout aus dem Header-Menü funktioniert (nutzt bestehende Server Action, Redirect auf `/login`).
3. Sidebar-Links „Heute"/„Focus" sind sichtbar, aber erkennbar inaktiv (kein toter Link ohne Feedback).
4. Layout ist ohne horizontalen Scroll auf Mobile-Breite nutzbar.
5. Kein Flash of Unstyled Content beim Seitenwechsel innerhalb der Shell (Layout bleibt stabil, nur Content-Slot wechselt).

## Validation

- `npm run typecheck` und `npm run lint` grün.
- Manuell im Browser: Sidebar-Klicks, Logout, Mobile-Breite (DevTools-Emulation oder Fenstergröße).

## Relevante Rules

- `rules/design-system.md` — Tokens, Dark-Mode-Default, Hover/Focus-States.
- `rules/code-conventions.md` — Import-Reihenfolge, Komponentenstruktur.

## Status

fertig

## Debrief

- Route-Group `src/app/(app)/` angelegt, `src/app/board/page.tsx` dorthin verschoben (`src/app/(app)/board/page.tsx`), URL bleibt `/board`.
- Header (`app-header.tsx`) und Sidebar (`app-sidebar.tsx`) als eigene Client-Komponenten unter `src/components/layout/`, `AppLayout` lädt den User serverseitig nur zur Anzeige (`getClaims()`), Sicherheitsentscheidung bleibt vollständig in `proxy.ts`.
- shadcn-Komponenten `dropdown-menu`, `tooltip`, `separator` per CLI ergänzt (base-ui-basiert, Projekt nutzt `@base-ui/react`, nicht Radix — Trigger-Komposition läuft über den `render`-Prop, nicht `asChild`). `TooltipProvider` in `src/app/layout.tsx` ergänzt.
- Sidebar-Links „Heute"/„Focus" bewusst deaktiviert (`aria-disabled`, `tabIndex={-1}`, Tooltip mit Hinweis auf die jeweilige Spec).
- Codex-Review (gpt-5.6-terra, medium): keine Blocker. Ein Warning (Sidebar unter `sm` komplett ausgeblendet, kein Mobile-Öffnen-Trigger) bewusst akzeptiert — Spec scoped explizit „kein dediziertes Mobile-Polish nötig", Content-Bereich bleibt ohne horizontalen Scroll nutzbar (Akzeptanzkriterium 4 weiterhin erfüllt). Wird nachgezogen, sobald weitere Nav-Ziele (Spec 10/11) aktiv werden.
- Browser-Erweiterung war in dieser Session nicht verbunden (kein `browser-use`-Durchlauf möglich) — Verifikation über `npm run typecheck`/`npm run lint` (beide grün) plus curl-Fallback (HTTP 307 auf `/board` ohne Session, HTTP 200 auf `/login`), analog zum in Spec 02 dokumentierten Fallback-Muster.
