"use server"

import { createClient } from "@/lib/supabase/server"

export type SearchResult = {
  id: string
  board_id: string
  title: string
  due_date: string | null
  boards: { name: string } | null
  lists: { name: string } | null
}

export type SearchActionState = {
  data: SearchResult[] | null
  error: string | null
}

export async function searchCards(query: string): Promise<SearchActionState> {
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    return { data: [], error: null }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cards")
    .select("id, board_id, title, due_date, boards(name), lists(name)")
    .textSearch("search_vector", trimmed, { type: "websearch", config: "german" })
    .order("updated_at", { ascending: false })
    .limit(20)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data ?? []) as unknown as SearchResult[], error: null }
}
