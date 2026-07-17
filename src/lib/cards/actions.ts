"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type CardActionState = {
  data: { id: string } | null
  error: string | null
}

export type CardPriority = "low" | "med" | "high"

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

export async function updateCardDescription(
  cardId: string,
  boardId: string,
  description: string,
): Promise<CardActionState> {
  const trimmed = description.trim()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .update({ description: trimmed.length > 0 ? trimmed : null })
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

export async function updateCardDueDate(
  cardId: string,
  boardId: string,
  dueDate: string | null,
): Promise<CardActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .update({ due_date: dueDate })
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

export async function updateCardPriority(
  cardId: string,
  boardId: string,
  priority: CardPriority,
): Promise<CardActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .update({ priority })
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

export async function moveCard(
  cardId: string,
  boardId: string,
  targetListId: string,
  newPosition: number,
): Promise<CardActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("move_card", {
    p_card_id: cardId,
    p_board_id: boardId,
    p_target_list_id: targetListId,
    p_new_position: newPosition,
  })

  if (error) {
    return { data: null, error: error.message }
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
