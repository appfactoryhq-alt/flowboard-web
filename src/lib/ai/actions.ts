"use server"

import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { revalidateCardViews } from "@/lib/revalidate"
import type { CardPriority } from "@/lib/cards/actions"

// Gleicher Requesty-Aufbau wie in Spec 14 (src/app/api/cards/generate/route.ts):
// OPENAI_KEY ist trotz Namens ein Requesty-Key. Haiku via Requesty passt fuer
// eine einfache Klassifikationsaufgabe wie hier (siehe Architektur-Entscheidung).
const requesty = createOpenAI({
  apiKey: process.env.OPENAI_KEY,
  baseURL: "https://router.requesty.ai/v1",
})

const suggestionSchema = z.object({
  priority: z.enum(["low", "med", "high"]),
  labelNames: z.array(z.string()).max(10),
})

export type CategorySuggestion = {
  priority: CardPriority
  labelIds: string[]
  labelNames: string[]
}

export type SuggestCategoryState = {
  data: CategorySuggestion | null
  error: string | null
}

export async function suggestCategory(cardId: string): Promise<SuggestCategoryState> {
  const supabase = await createClient()

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("title, description, board_id")
    .eq("id", cardId)
    .maybeSingle()

  if (cardError) {
    return { data: null, error: cardError.message }
  }
  if (!card) {
    return { data: null, error: "Card nicht gefunden oder kein Zugriff." }
  }

  const { data: labels, error: labelsError } = await supabase
    .from("labels")
    .select("id, name")
    .eq("board_id", card.board_id)

  if (labelsError) {
    return { data: null, error: labelsError.message }
  }

  const availableLabels = labels ?? []

  try {
    const { object } = await generateObject({
      model: requesty("anthropic/claude-haiku-4-5"),
      schema: suggestionSchema,
      prompt: [
        `Card-Titel: "${card.title}"`,
        `Beschreibung: ${card.description ?? "(keine)"}`,
        `Verfügbare Labels für dieses Board: ${JSON.stringify(availableLabels.map((label) => label.name))}`,
        "",
        "Schlage eine Priorität (low/med/high) und passende Labels (nur aus der verfügbaren Liste, per exaktem Namen) für diese Card vor. Wenn kein Label passt, gib eine leere Liste zurück.",
      ].join("\n"),
    })

    const labelIdByName = new Map(availableLabels.map((label) => [label.name, label.id]))
    const matchedLabelIds: string[] = []
    const matchedLabelNames: string[] = []

    for (const name of object.labelNames) {
      const id = labelIdByName.get(name)
      if (id) {
        matchedLabelIds.push(id)
        matchedLabelNames.push(name)
      }
    }

    return {
      data: { priority: object.priority, labelIds: matchedLabelIds, labelNames: matchedLabelNames },
      error: null,
    }
  } catch {
    return { data: null, error: "Vorschlag konnte nicht generiert werden." }
  }
}

export type AiActionState = {
  data: { id: string } | null
  error: string | null
}

export async function applyCategorySuggestion(
  cardId: string,
  boardId: string,
  expectedUpdatedAt: string,
  priority: CardPriority,
  labelIds: string[],
): Promise<AiActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("apply_category_suggestion", {
    p_card_id: cardId,
    p_expected_updated_at: expectedUpdatedAt,
    p_priority: priority,
    p_label_ids: labelIds,
  })

  if (error) {
    if (error.message.includes("zwischenzeitlich geaendert")) {
      return {
        data: null,
        error: "Card wurde zwischenzeitlich geändert, bitte neu vorschlagen lassen.",
      }
    }
    return { data: null, error: error.message }
  }

  revalidateCardViews(boardId)
  return { data: { id: cardId }, error: null }
}
