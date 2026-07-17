"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type CardActionState = {
  data: { id: string } | null
  error: string | null
}

const POSITION_STEP = 1000

function readCardTitle(formData: FormData): string | null {
  const title = formData.get("title")

  if (typeof title !== "string") return null

  const trimmed = title.trim()
  if (trimmed.length < 1 || trimmed.length > 200) return null

  return trimmed
}

export async function createCard(
  listId: string,
  boardId: string,
  _prevState: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const title = readCardTitle(formData)

  if (!title) {
    return { data: null, error: "Titel muss zwischen 1 und 200 Zeichen lang sein." }
  }

  const supabase = await createClient()

  const { data: lastCard } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (lastCard?.position ?? 0) + POSITION_STEP

  const { data, error } = await supabase
    .from("cards")
    .insert({ list_id: listId, board_id: boardId, title, position })
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return { data: null, error: error?.message ?? "Card konnte nicht angelegt werden." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: data.id }, error: null }
}

export async function updateCardTitle(
  cardId: string,
  boardId: string,
  _prevState: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const title = readCardTitle(formData)

  if (!title) {
    return { data: null, error: "Titel muss zwischen 1 und 200 Zeichen lang sein." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .update({ title })
    .eq("id", cardId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Card nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: cardId }, error: null }
}

export async function deleteCard(cardId: string, boardId: string): Promise<CardActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Card nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: cardId }, error: null }
}
