"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { LABEL_COLORS, type LabelColor } from "@/lib/labels/types"

export type LabelActionState = {
  data: { id: string } | null
  error: string | null
}

function readLabelName(formData: FormData): string | null {
  const name = formData.get("name")

  if (typeof name !== "string") return null

  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 40) return null

  return trimmed
}

function readLabelColor(formData: FormData): LabelColor | null {
  const color = formData.get("color")

  if (typeof color !== "string") return null

  return (LABEL_COLORS as readonly string[]).includes(color) ? (color as LabelColor) : null
}

export async function createLabel(
  boardId: string,
  _prevState: LabelActionState,
  formData: FormData,
): Promise<LabelActionState> {
  const name = readLabelName(formData)
  const color = readLabelColor(formData)

  if (!name) {
    return { data: null, error: "Name muss zwischen 1 und 40 Zeichen lang sein." }
  }
  if (!color) {
    return { data: null, error: "Bitte eine Farbe auswählen." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("labels")
    .insert({ board_id: boardId, name, color })
    .select("id")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Ein Label mit diesem Namen existiert bereits." }
    }
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Label konnte nicht angelegt werden." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: data.id }, error: null }
}

export async function deleteLabel(labelId: string, boardId: string): Promise<LabelActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("labels")
    .delete()
    .eq("id", labelId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: "Label nicht gefunden oder kein Zugriff." }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: labelId }, error: null }
}

export async function assignLabel(
  cardId: string,
  labelId: string,
  boardId: string,
): Promise<LabelActionState> {
  const supabase = await createClient()
  const { error } = await supabase.from("card_labels").insert({ card_id: cardId, label_id: labelId })

  if (error) {
    if (error.code === "23505") {
      return { data: { id: labelId }, error: null }
    }
    return { data: null, error: error.message }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: labelId }, error: null }
}

export async function unassignLabel(
  cardId: string,
  labelId: string,
  boardId: string,
): Promise<LabelActionState> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("card_labels")
    .delete()
    .eq("card_id", cardId)
    .eq("label_id", labelId)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: { id: labelId }, error: null }
}
