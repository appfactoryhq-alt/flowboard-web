# Learnings

Stolpersteine und Erkenntnisse aus dem Build, damit sie nicht zweimal passieren.

## Phase 0

- `create-next-app` hat diesmal kein Git-Repo automatisch angelegt, obwohl Git installiert ist — `git init` wurde manuell nachgeholt.
- Package-Name musste von "Projektmanagement Tool" (Leerzeichen, Großbuchstaben, npm-inkompatibel) auf `flow-board` geändert werden — Scaffold lief in einem temporären Unterordner, Inhalt wurde danach ins Hauptverzeichnis verschoben.
- shadcn-CLI (aktuell v4.13.0) nutzt neue Flags (`-b/--base`, `-p/--preset`, `-d/--defaults`) statt der älteren `--base-color`-Option. `-d` (Defaults: Template `next`, Preset `base-nova`) war der non-interaktive Weg ohne hängenden Prompt.
