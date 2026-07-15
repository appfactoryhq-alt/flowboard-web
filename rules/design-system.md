# Design-System

## Tokens

- CSS-Variablen in `src/app/globals.css`, aktuell shadcn-`base-nova`-Preset-Defaults als Platzhalter (Grau, Light-first) — noch nicht die finale Flow-Board-Optik.
- `--radius: 1rem` ist bereits gesetzt und verbindlich (keine rechteckigen Cards).
- Sobald eine finale Palette vorliegt: hier eintragen. Alle Farben abgestuft (keine harten `#000`/`#fff`), Gradients plus Layering statt Flächenfarben.

## Verbindliche Regeln (jede UI-Spec)

- Dark Mode ist Default (aktuell über `className="dark"` in `layout.tsx` erzwungen, bis ein Theme-Switch gebaut wird).
- Keine flachen Farben — Gradients plus Layering.
- Keine harten `#000`/`#fff` — abgestufte Neutrals.
- Hover- plus Focus-State auf jedem interaktiven Element.
- Transitions mindestens 150ms, `ease-out`.
- Weiche, mehrschichtige Shadows statt harter Kanten.
- `100dvh` statt `100vh` bei Full-Height-Elementen.
- `@media (prefers-reduced-motion: reduce)` respektieren.

## Referenz-Niveau

Linear, Bento.me, Cal.com, Raycast, Arc Browser. Nicht: Default-shadcn-Demo, generische Kanban-Clones.

## Motion (`motion/react`)

- Layout-Animation bei Card-DnD (Cards weichen smooth aus).
- Shared-Layout-Transition Card-in-Liste ↔ Card-Detail-Modal via `layoutId`.
- Smart-View-Wechsel: Cross-Fade.
- AI-Stream-Stagger: `transition={{ delay: index * 0.05 }}` pro eingetroffener Card.
