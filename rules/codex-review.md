# Codex-Review-Template ("Codex-nach-Spec")

Für jeden Review-Auftrag an Codex dieses Format verwenden.

## Auftrag

- **Spec-Bezug:** `specs/NN-<feature>.md`
- **Geänderte Dateien:** Liste der Pfade
- **Prüf-Fokus:** zum Beispiel RLS-Korrektheit, Race-Conditions bei DnD, Typsicherheit, Security (Service-Role-Key-Leaks)
- **Test-Bezug:** was geprüft wurde (Typecheck-/Lint-Status, ggf. `browser-use`-Durchlauf)

## Antwortformat (von Codex erwartet)

- Findings, je Finding:
  - Severity: `Blocker` / `Warning` / `Nit`
  - Datei plus Zeile
  - Beschreibung
  - Vorschlag (optional)
- Codex bleibt schreibgeschützt — keine eigenen Edits, nur Findings zurückmelden.

## Nacharbeit

- Blocker: vor Spec-Abschluss beheben.
- Warning: bewusst annehmen oder beheben, Begründung in `learning.md` falls nicht offensichtlich.
- Nit: optional.
