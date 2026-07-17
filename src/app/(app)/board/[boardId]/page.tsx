import { notFound } from "next/navigation"

import { BoardLists } from "@/components/lists/board-lists"
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

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">{board.name}</h1>
      </div>
      <div className="min-h-0 flex-1">
        <BoardLists boardId={board.id} initialLists={lists ?? []} />
      </div>
    </div>
  )
}
