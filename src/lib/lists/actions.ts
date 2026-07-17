"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type ListActionState = {
  data: { id: string } | null
  error: string | null
}

const POSITION_STEP = 1000

function readListName(formData: FormData): string | null {
  const name = formData.get("name")

  if (typeof name !== "string") return null

  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 60) return null

  return trimmed
}

export async function createList(
  boardId: string,
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  const name = readListName(formData)

  if (!name) {
    return { data: null, error: "Name muss zwischen 1 und 60 Zeichen lang sein." }
  }

  const supabase = await createClient()

  const { data: lastList } = await supabase
    .from("lists")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (lastList?.position ?? 0) + POSITION_STEP

  const { data, error } = await supabase
    .from("lists")
    .insert({ board_id: boardId, name, position })
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return { data: null, error: error?.message ?? "Liste konnte nicht angelegt werden." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: data.id }, error: null }
}

export async function renameList(
  listId: string,
  boardId: string,
  _prevState: ListActionState,
  formData: FormData,
): Promise<ListActionState> {
  const name = readListName(formData)

  if (!name) {
    return { data: null, error: "Name muss zwischen 1 und 60 Zeichen lang sein." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lists")
    .update({ name })
    .eq("id", listId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Liste nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: listId }, error: null }
}

export async function deleteList(
  listId: string,
  boardId: string,
): Promise<ListActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Liste nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: listId }, error: null }
}

export async function reorderList(
  listId: string,
  boardId: string,
  newPosition: number,
): Promise<ListActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lists")
    .update({ position: newPosition })
    .eq("id", listId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Liste nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: listId }, error: null }
}
