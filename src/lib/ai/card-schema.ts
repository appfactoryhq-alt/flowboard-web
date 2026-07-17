import { z } from "zod"

// OpenAIs Structured-Outputs-Modus (strict: true, wird von Requesty
// durchgereicht) verlangt, dass ALLE Properties im JSON-Schema "required"
// sind - auch fachlich optionale Felder. Zods .optional() erzeugt aber ein
// Property, das NICHT in "required" auftaucht, was der Provider mit
// "Invalid schema" ablehnt (empirisch verifiziert). Optionale Felder daher
// als .nullable() modellieren (required, aber der Wert darf null sein),
// nicht als .optional().
export const generatedCardSchema = z.object({
  title: z.string().min(1).max(200).describe("Kurzer, praegnanter Card-Titel auf Deutsch."),
  description: z
    .string()
    .max(500)
    .nullable()
    .describe("Kurze Beschreibung mit ein bis zwei Saetzen auf Deutsch, sonst null."),
  priority: z
    .enum(["low", "med", "high"])
    .nullable()
    .describe("Geschaetzte Prioritaet, falls aus dem Kontext ableitbar, sonst null."),
})

export type GeneratedCard = z.infer<typeof generatedCardSchema>
