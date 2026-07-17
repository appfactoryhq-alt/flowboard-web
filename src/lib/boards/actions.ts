"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type BoardActionState = {
  data: { id: string } | null
  error: string | null
}

function readBoardName(formData: FormData): string | null {
  const name = formData.get("name")

  if (typeof name !== "string") return null

  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 100) return null

  return trimmed
}

export async function createBoard(
  _prevState: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const name = readBoardName(formData)

  if (!name) {
    return { data: null, error: "Name muss zwischen 1 und 100 Zeichen lang sein." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("boards")
    .insert({ name })
    .select("id")
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? "Board konnte nicht angelegt werden." }
  }

  revalidatePath("/board")
  redirect(`/board/${data.id}`)
}

export async function renameBoard(
  boardId: string,
  _prevState: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const name = readBoardName(formData)

  if (!name) {
    return { data: null, error: "Name muss zwischen 1 und 100 Zeichen lang sein." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("boards")
    .update({ name })
    .eq("id", boardId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Board nicht gefunden oder kein Zugriff." }
  }

  revalidatePath("/board")
  revalidatePath(`/board/${boardId}`)
  return { data: { id: boardId }, error: null }
}

export async function deleteBoard(boardId: string): Promise<BoardActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Board nicht gefunden oder kein Zugriff." }
  }

  revalidatePath("/board")
  return { data: { id: boardId }, error: null }
}
