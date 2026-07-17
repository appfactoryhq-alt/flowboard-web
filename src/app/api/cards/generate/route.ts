import { Output, createTextStreamResponse, streamText, toTextStream } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { generatedCardSchema } from "@/lib/ai/card-schema"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

// OPENAI_KEY ist trotz des Namens ein Requesty-Key (Format "rqsty-sk-...",
// empirisch verifiziert: ein echter Call gegen api.openai.com schlaegt mit
// 401 fehl, gegen Requestys OpenAI-kompatiblen Endpoint funktioniert er).
// Requesty ist der in der Architektur-Entscheidung vorgesehene Provider,
// Modellnamen sind provider-praefixiert (z. B. "openai/gpt-4.1-mini").
const requesty = createOpenAI({
  apiKey: process.env.OPENAI_KEY,
  baseURL: "https://router.requesty.ai/v1",
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()

  if (!claims?.claims) {
    return new Response("Unauthorized", { status: 401 })
  }

  // useObject().submit(input) sendet den Request-Body als JSON.stringify(input)
  // direkt - bei einem einzelnen String-Argument ist der Body also der
  // JSON-kodierte String selbst, kein { prompt: ... }-Objekt (empirisch am
  // installierten @ai-sdk/react verifiziert, nicht nur aus der Doku uebernommen).
  const prompt: unknown = await request.json().catch(() => null)

  if (typeof prompt !== "string" || prompt.trim().length < 1 || prompt.length > 500) {
    return new Response("Bad Request", { status: 400 })
  }

  const result = streamText({
    model: requesty("openai/gpt-4.1-mini"),
    output: Output.array({ element: generatedCardSchema }),
    prompt: `Du hilfst dabei, ein Kanban-Board mit Cards zu befuellen. Erzeuge 3 bis 6 passende, konkrete Cards (Titel, optional kurze Beschreibung und Prioritaet) fuer folgendes Vorhaben. Antworte ausschliesslich auf Deutsch.\n\nVorhaben: ${prompt.trim()}`,
  })

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
  })
}
