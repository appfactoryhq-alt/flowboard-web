import { notFound } from "next/navigation"

import { BoardLists } from "@/components/lists/board-lists"
import type { Label } from "@/lib/labels/types"
import { createClient } from "@/lib/supabase/server"

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const supabase = await createClient()
  const { data: board, error } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .maybeSingle()

  if (error) {
    throw new Error(`Board konnte nicht geladen werden: ${error.message}`)
  }

  if (!board) {
    notFound()
  }

  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select("id, name, position")
    .eq("board_id", boardId)
    .order("position", { ascending: true })

  if (listsError) {
    throw new Error(`Lists konnten nicht geladen werden: ${listsError.message}`)
  }

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(
      "id, board_id, list_id, title, description, due_date, priority, focus_slot, position, created_at, updated_at",
    )
    .eq("board_id", boardId)
    .order("position", { ascending: true })

  if (cardsError) {
    throw new Error(`Cards konnten nicht geladen werden: ${cardsError.message}`)
  }

  const { data: boardLabels, error: labelsError } = await supabase
    .from("labels")
    .select("id, name, color")
    .eq("board_id", boardId)
    .order("name", { ascending: true })

  if (labelsError) {
    throw new Error(`Labels konnten nicht geladen werden: ${labelsError.message}`)
  }

  const { data: cardLabels, error: cardLabelsError } = await supabase
    .from("card_labels")
    .select("card_id, label_id, cards!inner(board_id)")
    .eq("cards.board_id", boardId)

  if (cardLabelsError) {
    throw new Error(`Label-Zuordnungen konnten nicht geladen werden: ${cardLabelsError.message}`)
  }

  const labelIdsByCard: Record<string, string[]> = {}
  for (const entry of cardLabels ?? []) {
    ;(labelIdsByCard[entry.card_id] ??= []).push(entry.label_id)
  }

  type CardRow = NonNullable<typeof cards>[number] & { labelIds: string[] }
  const cardsByList: Record<string, CardRow[]> = {}
  for (const card of cards ?? []) {
    const withLabels: CardRow = { ...card, labelIds: labelIdsByCard[card.id] ?? [] }
    ;(cardsByList[card.list_id] ??= []).push(withLabels)
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">{board.name}</h1>
      </div>
      <div className="min-h-0 flex-1">
        <BoardLists
          boardId={board.id}
          initialLists={lists ?? []}
          cardsByList={cardsByList}
          boardLabels={(boardLabels ?? []) as Label[]}
        />
      </div>
    </div>
  )
}
